import React from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { AppTheme } from '../../theme';
import { Header } from '../../components/common/Header';
import { StatusBadge } from '../../components/common/StatusBadge';
import { CustomButton } from '../../components/common/CustomButton';
import { AnalysisResult } from '../../types/analysis';

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
  const threat = levelDetails(result.level, theme);
  const metrics = [['Urgency', result.subScores.urgency], ['Impersonation', result.subScores.impersonation], ['Coercion', result.subScores.coercion], ['Financial ask', result.subScores.financialAsk]] as const;

  const callCybercrimeHelpline = async () => {
    try {
      const telUrl = 'tel:1930';
      if (!(await Linking.canOpenURL(telUrl))) throw new Error('Calling is not supported on this device.');
      await Linking.openURL(telUrl);
    } catch (error) {
      Alert.alert('Unable to call 1930', error instanceof Error ? error.message : 'Please dial 1930 manually.');
    }
  };

  return <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
    <Header title="Analysis Result" showBack />
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={[styles.dialCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>
        <Text style={[styles.dialLabel, theme.fonts.bodySmall, { color: theme.colors.textSecondary }]}>RULES RISK SCORE</Text>
        <View style={[styles.dialOuterCircle, { borderColor: theme.colors.outline }]}><View style={[styles.dialInnerCircle, { borderColor: threat.color }]}><Text style={[styles.scoreValue, theme.fonts.display, { color: threat.color }]}>{result.riskScore}</Text><Text style={[styles.scoreScale, theme.fonts.caption, { color: theme.colors.textMuted }]}>out of 100</Text></View></View>
        <View style={styles.badgeRow}><StatusBadge label={threat.label} variant={threat.variant} /><Text style={[styles.scamTitle, theme.fonts.h3, { color: theme.colors.textPrimary }]}>{result.scamType}</Text></View>
        <Text style={[styles.threatDescription, theme.fonts.bodySmall, { color: theme.colors.textSecondary }]}>{threat.description}</Text>
        <Text style={[styles.engineDetail, theme.fonts.caption, { color: theme.colors.textMuted }]}>{result.engine.mode === 'offline-rules' ? 'Offline · rules on device' : 'Server · rules engine'} · {result.engine.latencyMs} ms · rules v{result.engine.rulesVersion}</Text>
      </View>

      <Text style={[styles.sectionTitle, theme.fonts.h3, { color: theme.colors.textPrimary }]}>Rule sub-scores</Text>
      <View style={[styles.metricsBoard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>{metrics.map(([label, score]) => <View key={label} style={styles.metricItem}><Text style={[styles.metricLabel, theme.fonts.caption, { color: theme.colors.textSecondary }]}>{label.toUpperCase()}</Text><Text style={[styles.metricValue, theme.fonts.bodyLarge, { color: threat.color }]}>{score}%</Text></View>)}</View>

      <Text style={[styles.sectionTitle, theme.fonts.h3, { color: theme.colors.textPrimary }]}>Scanned message</Text>
      <View style={[styles.messageBox, { backgroundColor: theme.colors.surfaceContainer }]}><Text style={[styles.messageText, theme.fonts.bodyMedium, { color: theme.colors.textPrimary }]}>{highlightedSegments(result.displayText, result).map((segment) => <Text key={segment.key} style={segment.flagged ? [styles.highlight, { color: threat.color, backgroundColor: `${threat.color}2B` }] : undefined}>{segment.text}</Text>)}</Text></View>

      <Text style={[styles.sectionTitle, theme.fonts.h3, { color: theme.colors.textPrimary }]}>Evidence found</Text>
      <View style={styles.listContainer}>{result.indicators.map((indicator) => <View key={indicator} style={styles.listItem}><MaterialCommunityIcons name="alert-circle-outline" size={16} color={threat.color} style={styles.listIcon} /><Text style={[styles.listItemText, theme.fonts.bodyMedium, { color: theme.colors.textSecondary }]}>{indicator}</Text></View>)}</View>

      <Text style={[styles.sectionTitle, theme.fonts.h3, { color: theme.colors.textPrimary }]}>What to do</Text>
      <View style={styles.listContainer}>{result.remediationSteps.map((step) => <View key={step} style={styles.listItem}><MaterialCommunityIcons name="shield-outline" size={16} color={theme.colors.safe} style={styles.listIcon} /><Text style={[styles.listItemText, theme.fonts.bodyMedium, { color: theme.colors.textSecondary }]}>{step}</Text></View>)}</View>
      {result.level !== 'safe' && <CustomButton title="Call Cybercrime Helpline · 1930" onPress={callCybercrimeHelpline} variant="danger" style={styles.helplineButton} />}
    </ScrollView>
  </View>;
};

const styles = StyleSheet.create({
  container: { flex: 1 }, scrollContent: { padding: 20, paddingBottom: 40 }, dialCard: { borderWidth: 1.5, borderRadius: 20, padding: 20, alignItems: 'center', marginBottom: 24 }, dialLabel: { fontWeight: '700', letterSpacing: 0.5, marginBottom: 12 }, dialOuterCircle: { width: 140, height: 140, borderRadius: 70, borderWidth: 6, justifyContent: 'center', alignItems: 'center', marginBottom: 16 }, dialInnerCircle: { width: 124, height: 124, borderRadius: 62, borderWidth: 3, justifyContent: 'center', alignItems: 'center' }, scoreValue: { fontWeight: '800' }, scoreScale: { fontWeight: '600', marginTop: 2 }, badgeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }, scamTitle: { fontWeight: '700', textAlign: 'center' }, threatDescription: { textAlign: 'center', lineHeight: 18 }, engineDetail: { marginTop: 12, textAlign: 'center' }, sectionTitle: { fontWeight: '700', marginBottom: 12, marginTop: 8 }, metricsBoard: { borderWidth: 1.5, borderRadius: 16, padding: 8, marginBottom: 24, flexDirection: 'row', flexWrap: 'wrap' }, metricItem: { width: '50%', alignItems: 'center', paddingVertical: 10 }, metricLabel: { fontWeight: '700', marginBottom: 4, fontSize: 9, letterSpacing: 0.5 }, metricValue: { fontWeight: '800' }, messageBox: { padding: 16, borderRadius: 16, marginBottom: 20 }, messageText: { lineHeight: 22 }, highlight: { fontWeight: '700' }, listContainer: { marginBottom: 20 }, listItem: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 6, paddingRight: 12 }, listIcon: { marginTop: 3, marginRight: 10 }, listItemText: { lineHeight: 20, flex: 1 }, helplineButton: { width: '100%', marginTop: 8 },
});
export default ScamAnalysisResultScreen;
