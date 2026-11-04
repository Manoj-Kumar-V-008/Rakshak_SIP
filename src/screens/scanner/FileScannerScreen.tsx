import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import { AppTheme } from '../../theme';
import { Header } from '../../components/common/Header';
import { CustomButton } from '../../components/common/CustomButton';
import { StatusBadge } from '../../components/common/StatusBadge';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useConfigStore } from '../../store/useConfigStore';
import { analyzeFile, type FileAnalysisResponse } from '../../services/api/fileService';
import { t } from '../../locales';

export const FileScannerScreen: React.FC = () => {
  const theme = useTheme() as AppTheme;
  const navigation = useNavigation() as any;
  const addFileRecord = useConfigStore((state) => state.addFileRecord);
  const [selectedFile, setSelectedFile] = useState<{ name: string; uri: string; size: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileResult, setFileResult] = useState<FileAnalysisResponse | null>(null);

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      const fileInfo = await FileSystem.getInfoAsync(asset.uri);
      setSelectedFile({
        name: asset.name,
        uri: asset.uri,
        size: (fileInfo as any).size ?? 0,
      });
      setFileResult(null);
    } catch (error) {
      Alert.alert('File picker error', error instanceof Error ? error.message : 'Unknown error.');
    }
  };

  const handleScanFile = async () => {
    if (!selectedFile) return;
    setLoading(true);
    setFileResult(null);
    try {
      const { result, via } = await analyzeFile(selectedFile.uri, selectedFile.name, selectedFile.size);
      setFileResult(result);
      addFileRecord({
        fileName: result.fileName,
        fileSizeBytes: result.fileSizeBytes,
        sha256: result.sha256,
        verdict: result.verdict.verdict,
        riskScore: result.verdict.riskScore,
        reasons: result.verdict.reasons,
      });
      if (via === 'offline') {
        Alert.alert('Offline Mode', 'The backend was unavailable. Evaluated file security using on-device heuristics.');
      }
    } catch (error) {
      Alert.alert('File scan failed', error instanceof Error ? error.message : 'Unknown error.');
    } finally { setLoading(false); }
  };

  const verdictColor = (v: FileAnalysisResponse['verdict']['verdict']) => {
    if (v === 'danger') return theme.colors.danger;
    if (v === 'suspicious') return theme.colors.warning;
    if (v === 'unknown') return theme.colors.textMuted;
    return theme.colors.safe;
  };

  const verdictLabel = (v: FileAnalysisResponse['verdict']['verdict']) => {
    if (v === 'danger') return 'MALICIOUS FILE';
    if (v === 'suspicious') return 'SUSPICIOUS';
    if (v === 'unknown') return 'UNKNOWN';
    return 'SAFE FILE';
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header title="File Scanner" showBack />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={[styles.sectionTitle, theme.fonts.h3, { color: theme.colors.textPrimary }]}>Scan a File</Text>
          <Text style={[styles.instruction, theme.fonts.bodySmall, { color: theme.colors.textSecondary }]}>Select any file (APK, ZIP, PDF, EXE, etc.) to check its reputation against VirusTotal. Only the file hash is sent — never the full content.</Text>

          <TouchableOpacity onPress={pickFile} style={[styles.pickButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]} disabled={loading}>
            <MaterialCommunityIcons name={selectedFile ? 'file-check' : 'file-upload'} size={32} color={theme.colors.primary} style={styles.icon} />
            <Text style={[styles.pickLabel, theme.fonts.bodyLarge, { color: theme.colors.textPrimary }]}>{selectedFile ? 'Change file' : 'Select file to scan'}</Text>
            {selectedFile ? (
              <Text style={[styles.pickSubtitle, theme.fonts.bodySmall, { color: theme.colors.textSecondary }]}>{selectedFile.name}</Text>
            ) : null}
          </TouchableOpacity>

          {selectedFile ? (
            <View style={[styles.fileInfo, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>
              <Text style={[styles.fileLabel, theme.fonts.caption, { color: theme.colors.textSecondary }]}>File</Text>
              <Text style={[styles.fileValue, theme.fonts.bodyMedium, { color: theme.colors.textPrimary }]} numberOfLines={1}>{selectedFile.name}</Text>
              <Text style={[styles.fileLabel, theme.fonts.caption, { color: theme.colors.textSecondary }]}>Size</Text>
              <Text style={[styles.fileValue, theme.fonts.bodyMedium, { color: theme.colors.textPrimary }]}>{(selectedFile.size / 1024).toFixed(1)} KB</Text>
            </View>
          ) : null}

          <CustomButton
            title={loading ? 'Scanning…' : 'Scan File'}
            onPress={handleScanFile}
            variant="primary"
            disabled={loading || !selectedFile}
            style={styles.ctaButton}
          />

          {fileResult ? (
            <View style={[styles.resultCard, { borderLeftWidth: 4, borderLeftColor: verdictColor(fileResult.verdict.verdict) }]}>
              <View style={styles.resultHeader}>
                <Text style={[styles.verdictLabel, theme.fonts.h3, { color: verdictColor(fileResult.verdict.verdict), fontWeight: '800' }]}>{verdictLabel(fileResult.verdict.verdict)}</Text>
                <Text style={[styles.verdictScore, theme.fonts.bodyLarge, { color: theme.colors.textPrimary, fontWeight: '800' }]}>Risk {fileResult.verdict.riskScore}/100</Text>
              </View>
              <View style={styles.hashBox}>
                <Text style={[styles.hashLabel, theme.fonts.caption, { color: theme.colors.textSecondary }]}>SHA-256</Text>
                <Text style={[styles.hashValue, theme.fonts.bodySmall, { color: theme.colors.textSecondary }]}>{fileResult.sha256}</Text>
              </View>
              <View style={styles.reasonsBox}>
                <Text style={[styles.sectionTitle, theme.fonts.h3, { color: theme.colors.textPrimary, marginTop: 12 }]}>Reasons</Text>
                {fileResult.verdict.reasons.length > 0 ? (
                  fileResult.verdict.reasons.map((reason) => (
                    <View key={reason} style={styles.reasonItem}>
                      <MaterialCommunityIcons name="alert-circle-outline" size={16} color={verdictColor(fileResult.verdict.verdict)} style={styles.reasonIcon} />
                      <Text style={[styles.reasonText, theme.fonts.bodyMedium, { color: theme.colors.textSecondary }]}>{reason}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={[styles.reasonText, theme.fonts.bodyMedium, { color: theme.colors.textSecondary }]}>No threat indicators found.</Text>
                )}
              </View>
              <View style={styles.engineBox}>
                <Text style={[styles.engineLabel, theme.fonts.caption, { color: theme.colors.textMuted }]}>{fileResult.engine.mode === 'virustotal' ? 'Server · VirusTotal' : 'Server · heuristic-only'} · {fileResult.trace.map((t) => t.detail).join(' | ')}</Text>
              </View>
            </View>
          ) : null}

          <Text style={[styles.sectionTitle, theme.fonts.h3, { color: theme.colors.textPrimary, marginTop: 24 }]}>About File Scanning</Text>
          <Text style={[styles.instruction, theme.fonts.bodySmall, { color: theme.colors.textSecondary }]}>We compute a SHA-256 hash of the file locally and check it against VirusTotal&apos;s threat database. The full file content is never uploaded — only the hash is sent.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  sectionTitle: { fontWeight: '700', marginBottom: 4 },
  instruction: { lineHeight: 18, marginBottom: 16 },
  pickButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderRadius: 16, paddingVertical: 20, marginBottom: 16 },
  icon: { marginRight: 10 },
  pickLabel: { fontSize: 16, fontWeight: '700' },
  pickSubtitle: { fontSize: 12, marginTop: 4 },
  fileInfo: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 16 },
  fileLabel: { fontWeight: '700', fontSize: 10, marginBottom: 2 },
  fileValue: { fontSize: 14, lineHeight: 20, marginBottom: 8 },
  ctaButton: { width: '100%', marginTop: 8 },
  resultCard: { backgroundColor: '#151D30', borderColor: '#2A3654', borderWidth: 1, borderRadius: 16, padding: 16, marginTop: 16, marginBottom: 20 },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  verdictLabel: { textAlign: 'center' },
  verdictScore: { textAlign: 'center' },
  hashBox: { backgroundColor: '#1E293B', borderRadius: 8, padding: 10, marginBottom: 12 },
  hashLabel: { fontWeight: '700', fontSize: 10, marginBottom: 2 },
  hashValue: { fontSize: 12, lineHeight: 18, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  reasonsBox: { marginBottom: 12 },
  reasonItem: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 4, paddingRight: 12 },
  reasonIcon: { marginTop: 3, marginRight: 10 },
  reasonText: { lineHeight: 20, flex: 1 },
  engineBox: { marginTop: 12, textAlign: 'center', fontSize: 11 },
  engineLabel: { textAlign: 'center' },
});
