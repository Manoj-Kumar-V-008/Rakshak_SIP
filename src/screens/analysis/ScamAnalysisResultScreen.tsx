import React, { useState } from 'react';
import { Alert, Linking, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { AppTheme } from '../../theme';
import { Header } from '../../components/common/Header';
import { StatusBadge } from '../../components/common/StatusBadge';
import { CustomButton } from '../../components/common/CustomButton';
import { AnalysisResult } from '../../types/analysis';
import { sendFeedback } from '../../services/api/scamService';
import { explainSimply } from '../../services/ai/geminiClient';
import { RootStackParamList } from '../../navigation/types';
import * as Speech from 'expo-speech';

interface RouteParams { result: AnalysisResult; }
type BadgeVariant = 'emerald' | 'amber' | 'coral';

const levelDetails = (level: AnalysisResult['level'], theme: AppTheme) => {
  if (level === 'safe') return { label: 'Safe', variant: 'emerald' as BadgeVariant, color: theme.colors.safe, description: 'No high-risk rules were triggered by this message.' };
  if (level === 'suspicious') return { label: 'Suspicious', variant: 'amber' as BadgeVariant, color: theme.colors.warning, description: 'Some suspicious rules were triggered. Verify through an official channel before acting.' };
  return { label: 'High risk', variant: 'coral' as BadgeVariant, color: theme.colors.danger, description: 'Multiple or high-risk scam rules were triggered. Do not respond, pay, or share credentials.' };
};

const highlightedSegments = (text: string, result: AnalysisResult) => {
  const ranges = result.signals.flatMap((signal) => signal.matches.map((match) => ({ start: match.start, end: match.end }))).sort((a, b) => a.start - b.start);
  const merged = ranges.reduce<Array<{ start: number; end: number }>>((all, range) => {
    const previous = all[all.length - 1];
    if (previous && range.start <= previous.end) previous.end = Math.max(previous.end, range.end);
    else all.push({ ...range });
    return all;
  }, []);
  let cursor = 0;
  return merged.flatMap((range, index) => {
    const plain = text.slice(cursor, range.start);
    const flagged = text.slice(range.start, range.end);
    cursor = range.end;
    return [{ key: `plain-${index}`, text: plain, flagged: false }, { key: `flagged-${index}`, text: flagged, flagged: true }];
  }).concat([{ key: 'tail', text: text.slice(cursor), flagged: false }]).filter((segment) => segment.text.length > 0);
};

export const ScamAnalysisResultScreen: React.FC = () => {
  const theme = useTheme() as AppTheme;
  const { result } = useRoute().params as RouteParams;
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const threat = levelDetails(result.level, theme);
  const metrics = [['Urgency', result.subScores.urgency], ['Impersonation', result.subScores.impersonation], ['Coercion', result.subScores.coercion], ['Financial ask', result.subScores.financialAsk]] as const;
  const [feedbackBusy, setFeedbackBusy] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState<string | null>(null);
  const [explaining, setExplaining] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);

  const hearWarning = async () => {
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
      return;
    }
    const script = `This message is rated ${threat.label}, risk ${result.riskScore} out of 100, ${result.scamType}. ${result.remediationSteps.join('. ')}`;
    setSpeaking(true);
    Speech.speak(script, { rate: 0.95, onDone: () => setSpeaking(false), onStopped: () => setSpeaking(false), onError: () => setSpeaking(false) });
  };

  const callCybercrimeHelpline = async () => {
    try {
      const telUrl = 'tel:1930';
      if (!(await Linking.canOpenURL(telUrl))) throw new Error('Calling is not supported on this device.');
      await Linking.openURL(telUrl);
    } catch (error) {
      Alert.alert('Unable to call 1930', error instanceof Error ? error.message : 'Please dial 1930 manually.');
    }
  };

  const submitFeedback = async (verdict: 'scam_confirmed' | 'false_positive' | 'missed_scam') => {
    if (result.analysisId.startsWith('offline-')) {
      Alert.alert('Offline result', 'Connect to the backend and rescan before reporting - offline results have no server analysis ID.');
      return;
    }
    setFeedbackBusy(true);
    try {
      await sendFeedback(result.analysisId, verdict, result.displayText);
      setFeedbackSent(verdict === 'scam_confirmed' ? 'Thanks - reported as scam and saved on the server.' : 'Thanks - marked as safe and saved on the server.');
    } catch (error) {
      Alert.alert('Report not saved', error instanceof Error ? error.message : 'Please try again.');
    } finally { setFeedbackBusy(false); }
  };

  const shareWarning = async () => {
    try {
      await Share.share({ message: `Rakshak AI flagged this as ${threat.label} (${result.scamType}, score ${result.riskScore}/100):\n${result.displayText}` });
    } catch (error) {
      Alert.alert('Unable to share', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const handleExplain = async () => {
    Alert.alert(
      'Send to Gemini?',
      'This sends the scanned text to Google Gemini for a simple explanation. Only continue if you consent.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Explain',
          onPress: async () => {
            setExplaining(true);
            setExplanation(null);
            try {
              const text = await explainSimply(result.displayText, result.scamType, result.riskScore, result.indicators);
              setExplanation(text);
            } catch (error) {
              const detail = error instanceof Error ? error.message : 'Please try again.';
              if (detail.includes('No Gemini key')) {
                Alert.alert('Gemini key needed', 'Save a Gemini API key in Demo Connection first. The explainer stays off until then.', [
                  { text: 'Open settings', onPress: () => navigation.navigate('AdminSettings') },
                  { text: 'Cancel', style: 'cancel' },
                ]);
              } else {
                Alert.alert('Explainer unavailable', detail);
              }
            } finally { setExplaining(false); }
          },
        },
      ]
    );
  };

  return <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
    <Header title="Analysis Result" showBack />
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={[styles.dialCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>
        <Text style={[styles.dialLabel, theme.fonts.bodySmall, { color: theme.colors.textSecondary }]}>RULES RISK SCORE</Text>
        <View style={[styles.dialOuterCircle, { borderColor: theme.colors.outline }]}><View style={[styles.dialInnerCircle, { borderColor: threat.color }]}><Text style={[styles.scoreValue, theme.fonts.display, { color: threat.color }]}>{result.riskScore}</Text><Text style={[styles.scoreScale, theme.fonts.caption, { color: theme.colors.textMuted }]}>out of 100</Text></View></View>
        <View style={styles.badgeRow}><StatusBadge label={threat.label} variant={threat.variant} /><Text style={[styles.scamTitle, theme.fonts.h3, { color: theme.colors.textPrimary }]}>{result.scamType}</Text></View>
        <Text style={[styles.threatDescription, theme.fonts.bodySmall, { color: theme.colors.textSecondary }]}>{threat.description}</Text>
        <Text style={[styles.engineDetail, theme.fonts.caption, { color: theme.colors.textMuted }]}>{result.engine.mode === 'offline-rules' ? 'Offline · rules on device' : result.engine.mode === 'hybrid-llm' ? `Server · AI hybrid (${result.engine.model ?? 'llm'})` : result.engine.mode === 'hybrid' ? `Server · hybrid (${result.engine.model ?? 'e5-small'})` : 'Server · rules engine'} · {result.engine.latencyMs} ms · rules v{result.engine.rulesVersion}</Text>
      </View>

      <Text style={[styles.sectionTitle, theme.fonts.h3, { color: theme.colors.textPrimary }]}>Rule sub-scores</Text>
      <View style={[styles.metricsBoard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>{metrics.map(([label, score]) => <View key={label} style={styles.metricItem}><Text style={[styles.metricLabel, theme.fonts.caption, { color: theme.colors.textSecondary }]}>{label.toUpperCase()}</Text><Text style={[styles.metricValue, theme.fonts.bodyLarge, { color: threat.color }]}>{score}%</Text></View>)}</View>

      <Text style={[styles.sectionTitle, theme.fonts.h3, { color: theme.colors.textPrimary }]}>Scanned message</Text>
      <View style={[styles.messageBox, { backgroundColor: theme.colors.surfaceContainer }]}><Text style={[styles.messageText, theme.fonts.bodyMedium, { color: theme.colors.textPrimary }]}>{highlightedSegments(result.displayText, result).map((segment) => <Text key={segment.key} style={segment.flagged ? [styles.highlight, { color: threat.color, backgroundColor: `${threat.color}2B` }] : undefined}>{segment.text}</Text>)}</Text></View>
      {result.transcript ? <View style={[styles.messageBox, { backgroundColor: theme.colors.surface }]}><Text style={[theme.fonts.caption, { color: theme.colors.textSecondary, marginBottom: 4 }]}>VOICE TRANSCRIPT</Text><Text style={[styles.messageText, theme.fonts.bodyMedium, { color: theme.colors.textPrimary }]}>{result.transcript}</Text></View> : null}

      <Text style={[styles.sectionTitle, theme.fonts.h3, { color: theme.colors.textPrimary }]}>Evidence found</Text>
      <View style={styles.listContainer}>{result.indicators.map((indicator) => <View key={indicator} style={styles.listItem}><MaterialCommunityIcons name="alert-circle-outline" size={16} color={threat.color} style={styles.listIcon} /><Text style={[styles.listItemText, theme.fonts.bodyMedium, { color: theme.colors.textSecondary }]}>{indicator}</Text></View>)}</View>

      <Text style={[styles.sectionTitle, theme.fonts.h3, { color: theme.colors.textPrimary }]}>What to do</Text>
      <View style={styles.listContainer}>{result.remediationSteps.map((step) => <View key={step} style={styles.listItem}><MaterialCommunityIcons name="shield-outline" size={16} color={theme.colors.safe} style={styles.listIcon} /><Text style={[styles.listItemText, theme.fonts.bodyMedium, { color: theme.colors.textSecondary }]}>{step}</Text></View>)}</View>
      {result.level !== 'safe' && <CustomButton title="Call Cybercrime Helpline · 1930" onPress={callCybercrimeHelpline} variant="danger" style={styles.helplineButton} />}
      <CustomButton title="Report as scam" onPress={() => submitFeedback('scam_confirmed')} variant="primary" loading={feedbackBusy} disabled={feedbackBusy} style={styles.helplineButton} />
      <CustomButton title="Mark as safe" onPress={() => submitFeedback('false_positive')} variant="outline" loading={feedbackBusy} disabled={feedbackBusy} style={styles.helplineButton} />
      <CustomButton title="Share warning" onPress={shareWarning} variant="secondary" style={styles.helplineButton} />
      <CustomButton title={speaking ? 'Stop spoken warning' : 'Hear warning aloud'} onPress={hearWarning} variant="outline" style={styles.helplineButton} />
      {feedbackSent && <Text style={[theme.fonts.bodySmall, { color: theme.colors.safe, marginTop: 8, textAlign: 'center' }]}>{feedbackSent}</Text>}
      <Text style={[styles.sectionTitle, theme.fonts.h3, { color: theme.colors.textPrimary }]}>Simple explanation (opt-in)</Text>
      <Text style={[theme.fonts.bodySmall, { color: theme.colors.textSecondary, marginBottom: 8 }]}>Off by default. Sends this text to Google Gemini only when you tap Explain.</Text>
      <CustomButton title="Explain in simple words" onPress={handleExplain} variant="outline" loading={explaining} disabled={explaining} style={styles.helplineButton} />
      {explanation && <View style={[styles.messageBox, { backgroundColor: theme.colors.surface }]}><Text style={[styles.messageText, theme.fonts.bodyMedium, { color: theme.colors.textPrimary }]}>{explanation}</Text></View>}
    </ScrollView>
  </View>;
};

const styles = StyleSheet.create({
  container: { flex: 1 }, scrollContent: { padding: 20, paddingBottom: 40 }, dialCard: { borderWidth: 1.5, borderRadius: 20, padding: 20, alignItems: 'center', marginBottom: 24 }, dialLabel: { fontWeight: '700', letterSpacing: 0.5, marginBottom: 12 }, dialOuterCircle: { width: 140, height: 140, borderRadius: 70, borderWidth: 6, justifyContent: 'center', alignItems: 'center', marginBottom: 16 }, dialInnerCircle: { width: 124, height: 124, borderRadius: 62, borderWidth: 3, justifyContent: 'center', alignItems: 'center' }, scoreValue: { fontWeight: '800' }, scoreScale: { fontWeight: '600', marginTop: 2 }, badgeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }, scamTitle: { fontWeight: '700', textAlign: 'center' }, threatDescription: { textAlign: 'center', lineHeight: 18 }, engineDetail: { marginTop: 12, textAlign: 'center' }, sectionTitle: { fontWeight: '700', marginBottom: 12, marginTop: 8 }, metricsBoard: { borderWidth: 1.5, borderRadius: 16, padding: 8, marginBottom: 24, flexDirection: 'row', flexWrap: 'wrap' }, metricItem: { width: '50%', alignItems: 'center', paddingVertical: 10 }, metricLabel: { fontWeight: '700', marginBottom: 4, fontSize: 9, letterSpacing: 0.5 }, metricValue: { fontWeight: '800' }, messageBox: { padding: 16, borderRadius: 16, marginBottom: 20 }, messageText: { lineHeight: 22 }, highlight: { fontWeight: '700' }, listContainer: { marginBottom: 20 }, listItem: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 6, paddingRight: 12 }, listIcon: { marginTop: 3, marginRight: 10 }, listItemText: { lineHeight: 20, flex: 1 }, helplineButton: { width: '100%', marginTop: 8 },
});
export default ScamAnalysisResultScreen;
