import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as DocumentPicker from 'expo-document-picker';
import { RecordingPresets, requestRecordingPermissionsAsync, useAudioRecorder, useAudioRecorderState } from 'expo-audio';
import { Header } from '../../components/common/Header';
import { CustomButton } from '../../components/common/CustomButton';
import { RootStackParamList } from '../../navigation/types';
import { useConfigStore } from '../../store/useConfigStore';
import { analyzeAudio } from '../../services/api/scamService';
import { analyze } from '../../services/engine/analyze';
import { analyzeLocally } from '../../services/engine/localEngine';
import { useRemoteRules } from '../../hooks/useRemoteRules';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export const VoiceScannerScreen: React.FC = () => {
  const theme = useTheme() as unknown as import('../../theme').AppTheme;
  const navigation = useNavigation<NavigationProp>();
  const addScanRecord = useConfigStore((state) => state.addScanRecord);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  useRemoteRules();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [liveMode, setLiveMode] = useState(false);
  const [chunks, setChunks] = useState(0);
  const [rollingTranscript, setRollingTranscript] = useState('');
  const [liveScore, setLiveScore] = useState<number | null>(null);
  const [liveLevel, setLiveLevel] = useState<string | null>(null);
  const chunkUploading = useRef(false);
  const liveState = useRef({ rolling: '', count: 0 });
  const recorderRef = useRef(recorder);
  recorderRef.current = recorder;

  const uploadAndAnalyze = async (uri: string, fileName: string) => {
    setBusy(true);
    setStatus('Transcribing…');
    try {
      const result = await analyzeAudio(uri, fileName);
      setStatus(result.transcript ? `Transcript: ${result.transcript.slice(0, 120)}${result.transcript.length > 120 ? '…' : ''}` : 'Transcribed.');
      addScanRecord({ text: result.displayText, score: result.riskScore, type: result.scamType, indicators: result.indicators, remediationSteps: result.remediationSteps });
      navigation.navigate('ScamAnalysisResult', { result });
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Unknown error.';
      setStatus(detail);
      Alert.alert('Voice scan unavailable', detail);
    } finally { setBusy(false); }
  };

  const handleRecordToggle = async () => {
    if (recorderState.isRecording) {
      await handleStop(liveMode && liveState.current.count > 0);
      return;
    }
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Microphone blocked', 'Allow microphone access to record a call clip. You can still pick a pre-recorded file.');
      return;
    }
    liveState.current = { rolling: '', count: 0 };
    setRollingTranscript('');
    setLiveScore(null);
    setLiveLevel(null);
    setChunks(0);
    try {
      await recorder.prepareToRecordAsync();
      recorder.record();
      setStatus(liveMode ? 'Live meter on: recording in 8s chunks. Tap Stop to finish.' : 'Recording… keep clips under 20 seconds. Tap Stop to analyze.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not start recording.');
    }
  };

  const handleStop = async (useRolling: boolean) => {
    try {
      await recorder.stop();
      if (useRolling && liveState.current.rolling.trim().length >= 5) {
        await finishLiveAnalysis();
        return;
      }
      const uri = recorder.uri;
      if (uri) await uploadAndAnalyze(uri, 'recording.m4a');
      else setStatus('Recording produced no file.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Stop failed.');
    }
  };

  const finishLiveAnalysis = async () => {
    const rolling = liveState.current.rolling.trim();
    setBusy(true);
    setStatus('Analyzing rolling transcript…');
    try {
      const { result, via } = await analyze(rolling.slice(0, 1000));
      addScanRecord({ text: result.displayText, score: result.riskScore, type: result.scamType, indicators: result.indicators, remediationSteps: result.remediationSteps });
      if (via === 'offline') Alert.alert('Offline mode', 'Live meter and final used on-device rules.');
      navigation.navigate('ScamAnalysisResult', { result });
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Unknown error.';
      setStatus(detail);
      Alert.alert('Voice scan unavailable', detail);
    } finally { setBusy(false); }
  };

  // P2 pseudo-live: every 8s stop the chunk, transcribe it, update an offline-rules meter.
  useEffect(() => {
    if (!liveMode || !recorderState.isRecording) return;
    const timer = setInterval(async () => {
      if (chunkUploading.current) return;
      chunkUploading.current = true;
      try {
        const rec = recorderRef.current;
        await rec.stop();
        const uri = rec.uri;
        if (uri) {
          try {
            const chunkResult = await analyzeAudio(uri, `chunk-${liveState.current.count + 1}.m4a`);
            const piece = (chunkResult.transcript ?? chunkResult.displayText).trim();
            if (piece) {
              liveState.current = { rolling: `${liveState.current.rolling} ${piece}`.trim(), count: liveState.current.count + 1 };
              const meter = analyzeLocally(liveState.current.rolling.slice(0, 1000));
              setRollingTranscript(liveState.current.rolling);
              setChunks(liveState.current.count);
              setLiveScore(meter.riskScore);
              setLiveLevel(meter.level);
              setStatus(`Chunk ${liveState.current.count} transcribed · live ${meter.riskScore} (${meter.level}) · offline rules on partial transcript`);
            }
          } catch (error) {
            setStatus(error instanceof Error ? error.message : 'Chunk failed; continuing.');
          }
          await rec.prepareToRecordAsync();
          rec.record();
        }
      } catch {
        // Recorder busy; next tick retries.
      } finally { chunkUploading.current = false; }
    }, 8000);
    return () => clearInterval(timer);
  }, [liveMode, recorderState.isRecording]);

  const handlePickFile = async () => {
    const picked = await DocumentPicker.getDocumentAsync({ type: 'audio/*', copyToCacheDirectory: true });
    if (picked.canceled || !picked.assets?.[0]) return;
    const asset = picked.assets[0];
    if (asset.size && asset.size > 10 * 1024 * 1024) {
      Alert.alert('File too large', 'Audio must be 10 MB or less and 60 seconds or less.');
      return;
    }
    await uploadAndAnalyze(asset.uri, asset.name ?? 'clip.m4a');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header title="Voice Scanner" showBack />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, theme.fonts.h3, { color: theme.colors.textPrimary }]}>Call clip analysis</Text>
        <Text style={[styles.helper, theme.fonts.bodySmall, { color: theme.colors.textSecondary }]}>
          Record 10-20 seconds or pick a pre-recorded clip. The server transcribes it (on-device Whisper, or Gemini cloud when a server key is set), then runs the same rules pipeline. Live in-call monitoring is Phase 2.
        </Text>
        <CustomButton
          title={recorderState.isRecording ? 'Stop and analyze' : 'Record clip'}
          onPress={handleRecordToggle}
          variant={recorderState.isRecording ? 'danger' : 'primary'}
          disabled={busy}
          style={styles.button}
        />
        <CustomButton
          title={liveMode ? 'Live meter: ON (8s chunks)' : 'Live meter: OFF'}
          onPress={() => {
            if (recorderState.isRecording) {
              Alert.alert('Stop recording first', 'Toggle live meter before starting a recording.');
              return;
            }
            setLiveMode((v) => !v);
          }}
          variant="outline"
          disabled={busy || recorderState.isRecording}
          style={styles.button}
        />
        <CustomButton title="Pick audio file" onPress={handlePickFile} variant="outline" disabled={busy || recorderState.isRecording} style={styles.button} />
        {liveScore !== null && (
          <View style={[styles.meterCard, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface }]}>
            <Text style={[theme.fonts.caption, { color: theme.colors.textSecondary }]}>LIVE RISK · {chunks} chunk{chunks === 1 ? '' : 's'} · offline rules on partial transcript</Text>
            <Text style={[theme.fonts.h3, { color: liveLevel === 'danger' ? theme.colors.danger : liveLevel === 'suspicious' ? theme.colors.warning : theme.colors.safe }]}>
              {liveScore} / 100 ({liveLevel})
            </Text>
            <View style={styles.meterTrack}>
              <View style={[styles.meterFill, { width: `${Math.min(100, Math.max(0, liveScore))}%`, backgroundColor: liveLevel === 'danger' ? theme.colors.danger : liveLevel === 'suspicious' ? theme.colors.warning : theme.colors.safe }]} />
            </View>
            {rollingTranscript ? <Text style={[theme.fonts.bodySmall, { color: theme.colors.textSecondary, marginTop: 8 }]}>{rollingTranscript.slice(-200)}</Text> : null}
          </View>
        )}
        {(busy || status) && (
          <View style={styles.statusCard}>
            {busy && <ActivityIndicator size="small" color={theme.colors.primary} style={styles.spinner} />}
            <Text style={[theme.fonts.bodySmall, { color: theme.colors.textPrimary }]}>{status}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  title: { fontWeight: '700', marginBottom: 6 },
  helper: { lineHeight: 18, marginBottom: 16 },
  button: { width: '100%', marginTop: 8 },
  meterCard: { borderWidth: 1.5, borderRadius: 14, padding: 14, marginTop: 16, gap: 8 },
  meterTrack: { height: 10, borderRadius: 5, backgroundColor: '#1E293B', overflow: 'hidden', marginTop: 8 },
  meterFill: { height: 10, borderRadius: 5 },
  statusCard: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 16 },
  spinner: { marginRight: 8 },
});

export default VoiceScannerScreen;
