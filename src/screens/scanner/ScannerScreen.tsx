import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppTheme } from '../../theme';
import { Header } from '../../components/common/Header';
import { CustomButton } from '../../components/common/CustomButton';
import { RootStackParamList } from '../../navigation/types';
import { useConfigStore } from '../../store/useConfigStore';
import { analyze, verifyLink, type LinkAnalysisResponse } from '../../services/engine/analyze';
import { reportScamLink } from '../../services/api/scamService';
import { useRemoteRules } from '../../hooks/useRemoteRules';
import { t, setLanguage, getLanguage } from '../../locales';
import { Language } from '../../locales';
import { Card } from '../../components/common/Card';

type NavigationProp = StackNavigationProp<RootStackParamList, 'App'>;
const templates = [
  { label: 'Electricity Scam', text: 'ALERT: your electricity power connection will be disconnected tonight at 9.30 PM. Call power officer at 9812345678 immediately.' },
  { label: 'Safe Bank OTP', text: '482913 is your OTP for HDFC Bank NetBanking login. Do not share it with anyone.' },
  { label: 'Digital Arrest', text: 'This is Inspector Rao from CBI. A parcel in your name contains narcotics. You are under digital arrest. Stay on the video call and do not tell anyone.' },
];

export const ScannerScreen: React.FC = () => {
  const theme = useTheme() as AppTheme;
  const navigation = useNavigation<NavigationProp>();
  useRemoteRules();
  const addScanRecord = useConfigStore((state) => state.addScanRecord);
  const addLinkRecord = useConfigStore((state) => state.addLinkRecord);
  const setLang = useConfigStore((state) => state.setLanguage);
  const currentLang = useConfigStore((state) => state.profile.preferredLanguage);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [linkInput, setLinkInput] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkResult, setLinkResult] = useState<LinkAnalysisResponse | null>(null);
  const [reportLinkBusy, setReportLinkBusy] = useState(false);

  const handleLanguageChange = () => {
    Alert.alert(
      t('profile.language'),
      'Select preferred language:',
      [
        { text: 'English', onPress: () => { setLang('en'); setLanguage('en'); } },
        { text: 'Hindi (हिन्दी)', onPress: () => { setLang('hi'); setLanguage('hi'); } },
        { text: 'Tamil (தமிழ்)', onPress: () => { setLang('ta'); setLanguage('ta'); } },
        { text: 'Telugu (తెలుగు)', onPress: () => { setLang('te'); setLanguage('te'); } },
        { text: 'Kannada (ಕನ್ನಡ)', onPress: () => { setLang('kn'); setLanguage('kn'); } },
        { text: 'Marathi (मराठी)', onPress: () => { setLang('mr'); setLanguage('mr'); } },
        { text: 'Bengali (বাংলা)', onPress: () => { setLang('bn'); setLanguage('bn'); } },
        { text: t('common.cancel'), style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const handleAnalyze = async () => {
    const text = message.trim();
    if (text.length < 5) return;
    setLoading(true);
    setConsoleLogs([t('common.analyzing')]);
    try {
      const { result, via } = await analyze(text);
      setConsoleLogs(result.trace.map((step) => `[${step.stage.toUpperCase()}] ${step.detail} (${step.ms} ms)`));
      addScanRecord({ text: result.displayText, score: result.riskScore, type: result.scamType, indicators: result.indicators, remediationSteps: result.remediationSteps });
      setMessage('');
      navigation.navigate('ScamAnalysisResult', { result });
      if (via === 'offline') Alert.alert(t('common.offlineMode'), 'The server was unavailable. This scan used the on-device rules engine.');
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Unknown error.';
      setConsoleLogs([`[ERROR] ${detail}`]);
      Alert.alert('Scan unavailable', detail);
    } finally { setLoading(false); }
  };

  const handleVerifyLink = async () => {
    const text = linkInput.trim();
    if (!text) return;
    setLinkLoading(true);
    setLinkResult(null);
    try {
      const { result, via } = await verifyLink(text);
      setLinkResult(result);
      setLinkInput('');
      const worst = result.urls.reduce((prev, cur) => (cur.riskScore > prev.riskScore ? cur : prev), result.urls[0]);
      addLinkRecord({
        originalUrl: worst.original,
        expandedUrl: worst.expanded ?? null,
        domain: worst.domain ?? null,
        verdict: result.overallVerdict,
        riskScore: result.overallRiskScore,
        reasons: worst.reasons,
      });
      if (via === 'offline') {
        Alert.alert(t('common.offlineMode'), 'The server was unavailable. Link checks used on-device heuristics.');
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Unknown error.';
      Alert.alert('Link check unavailable', detail);
    } finally { setLinkLoading(false); }
  };

  const handleReportLink = async () => {
    if (!linkResult) return;
    const worst = linkResult.urls.reduce((prev, cur) => (cur.riskScore > prev.riskScore ? cur : prev), linkResult.urls[0]);
    setReportLinkBusy(true);
    try {
      await reportScamLink({
        originalUrl: worst.original,
        expandedUrl: worst.expanded ?? null,
        domain: worst.domain ?? '',
        reporterText: linkResult.inputText,
      });
      Alert.alert('Reported', 'This link has been reported as a scam and will help protect other users.');
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Unknown error.';
      Alert.alert('Report failed', detail);
    } finally { setReportLinkBusy(false); }
  };

  const verdictColor = (v: LinkAnalysisResponse['overallVerdict']) => {
    if (v === 'danger') return theme.colors.danger;
    if (v === 'suspicious') return theme.colors.warning;
    return theme.colors.safe;
  };

  const verdictLabel = (v: LinkAnalysisResponse['overallVerdict']) => {
    if (v === 'danger') return t('common.danger').toUpperCase();
    if (v === 'suspicious') return t('common.suspicious').toUpperCase();
    return t('common.safe').toUpperCase();
  };

  const langLabel = (lang: Language) => {
    switch (lang) {
      case 'hi': return 'हिन्दी';
      case 'ta': return 'தமிழ்';
      case 'te': return 'తెలుగు';
      case 'kn': return 'ಕನ್ನಡ';
      case 'mr': return 'मराठी';
      case 'bn': return 'বাংলা';
      case 'en':
      default: return 'English';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header title={t('scanner.title')} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Message Scanner Card */}
          <Card padding={20} radius={20} elevation={3}>
            <Text style={[styles.sectionTitle, theme.fonts.h3, { color: theme.colors.textPrimary }]}>Message Scanner</Text>
            <Text style={[styles.instruction, theme.fonts.bodySmall, { color: theme.colors.textSecondary }]}>Paste a message to scan it against explainable scam patterns.</Text>
            <View style={[styles.inputContainer, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surfaceContainer }]}>
              <TextInput
                multiline
                numberOfLines={5}
                value={message}
                onChangeText={setMessage}
                placeholder="Paste suspicious SMS, email, or UPI link message here..."
                placeholderTextColor={theme.colors.textMuted}
                style={[styles.input, theme.fonts.bodyMedium, { color: theme.colors.textPrimary }]}
                maxLength={1000}
                editable={!loading}
              />
              {message.length > 0 && !loading && (
                <TouchableOpacity onPress={() => setMessage('')} style={styles.clearBtn}>
                  <MaterialCommunityIcons name="close-circle" size={20} color={theme.colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Language toggle */}
            <View style={styles.langRow}>
              <Text style={[styles.langLabel, theme.fonts.bodySmall, { color: theme.colors.textSecondary }]}>{t('profile.language')}:</Text>
              <TouchableOpacity onPress={handleLanguageChange} style={styles.langBtn}>
                <Text style={[styles.langValue, theme.fonts.bodyMedium, { color: theme.colors.primary }]}>{langLabel(currentLang === 'en' ? 'hi' : 'en')}</Text>
              </TouchableOpacity>
            </View>

            <CustomButton
              title={loading ? t('common.analyzing') : t('scanner.analyzeMessage')}
              onPress={handleAnalyze}
              variant="primary"
              disabled={loading || message.trim().length < 5}
              style={styles.ctaButton}
            />
          </Card>

          {/* Link Verification Card */}
          <Card padding={20} radius={20} elevation={3} marginTop={16}>
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionTitle, theme.fonts.h3, { color: theme.colors.textPrimary }]}>{t('scanner.verifyLink')}</Text>
              <Text style={[styles.sectionSubtitle, theme.fonts.bodySmall, { color: theme.colors.textSecondary }]}>Check if a link is safe or a scam</Text>
            </View>
            <View style={[styles.inputContainer, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surfaceContainer, marginTop: 12 }]}>
              <TextInput
                multiline
                numberOfLines={2}
                value={linkInput}
                onChangeText={setLinkInput}
                placeholder="Paste a link here (e.g. http://bit.ly/3xYz)"
                placeholderTextColor={theme.colors.textMuted}
                style={[styles.input, theme.fonts.bodyMedium, { color: theme.colors.textPrimary }]}
                maxLength={500}
                editable={!linkLoading}
              />
              {linkInput.length > 0 && !linkLoading && (
                <TouchableOpacity onPress={() => setLinkInput('')} style={styles.clearBtn}>
                  <MaterialCommunityIcons name="close-circle" size={20} color={theme.colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
            <CustomButton
              title={linkLoading ? t('common.verifying') : t('scanner.verifyLinkButton')}
              onPress={handleVerifyLink}
              variant="primary"
              disabled={linkLoading || linkInput.trim().length < 5}
              style={styles.ctaButton}
            />

            {linkResult && (
              <View style={[styles.linkResultCard, { borderLeftWidth: 4, borderLeftColor: verdictColor(linkResult.overallVerdict) }]}>
                <View style={styles.linkResultHeader}>
                  <Text style={[styles.verdictLabel, theme.fonts.h3, { color: verdictColor(linkResult.overallVerdict), fontWeight: '800' }]}>{verdictLabel(linkResult.overallVerdict)}</Text>
                  <Text style={[styles.verdictScore, theme.fonts.bodyLarge, { color: theme.colors.textPrimary, fontWeight: '800' }]}>Risk {linkResult.overallRiskScore}/100</Text>
                </View>
                {linkResult.urls.map((url: LinkAnalysisResponse['urls'][number], idx: number) => (
                  <View key={idx} style={styles.urlItem}>
                    <Text style={[styles.urlLabel, theme.fonts.caption, { color: theme.colors.textSecondary }]}>Original</Text>
                    <Text style={[styles.urlText, theme.fonts.bodyMedium, { color: theme.colors.textPrimary }]}>{url.original}</Text>
                    {url.expanded && (
                      <>
                        <Text style={[styles.urlLabel, theme.fonts.caption, { color: theme.colors.textSecondary }]}>Destination</Text>
                        <Text style={[styles.urlText, theme.fonts.bodyMedium, { color: theme.colors.primary }]}>{url.expanded}</Text>
                      </>
                    )}
                    <View style={styles.urlBadges}>
                      {url.domain && <Text style={[styles.badge, { backgroundColor: theme.colors.primaryContainer }]}>{url.domain}</Text>}
                      <Text style={[styles.badge, { backgroundColor: url.isHttps ? theme.colors.safeContainer : theme.colors.dangerContainer, color: url.isHttps ? theme.colors.safe : theme.colors.danger }]}>{url.isHttps ? 'HTTPS' : 'HTTP'}</Text>
                      {url.reputation && <Text style={[styles.badge, { backgroundColor: theme.colors.dangerContainer, color: theme.colors.danger }]}>REPUTATION: {url.reputation.threatType}</Text>}
                      {url.reasons.length > 0 && <Text style={[styles.badge, { backgroundColor: theme.colors.dangerContainer, color: theme.colors.danger }]}>{url.reasons.join(', ')}</Text>}
                    </View>
                  </View>
                ))}
                <View style={styles.linkResultFooter}>
                  <Text style={[styles.engineDetail, theme.fonts.caption, { color: theme.colors.textMuted }]}>{linkResult.engine.mode === 'offline-link' ? 'Offline · on-device heuristics' : linkResult.engine.mode === 'link-verifier+safebrowsing' ? 'Server · link verifier + Safe Browsing' : 'Server · link verifier'} · {linkResult.trace.map((t: { stage: string; ms: number; detail: string }) => t.detail).join(' | ')}</Text>
                </View>
                {linkResult.overallVerdict !== 'safe' && (
                  <CustomButton
                    title={reportLinkBusy ? t('common.reporting') : t('common.reportScam')}
                    onPress={handleReportLink}
                    variant="danger"
                    loading={reportLinkBusy}
                    disabled={reportLinkBusy}
                    style={[styles.ctaButton, { marginTop: 12 }]}
                  />
                )}
              </View>
            )}
          </Card>

          {/* Engine Trace */}
          {(loading || consoleLogs.length > 0) && (
            <Card padding={16} radius={16} elevation={2} marginTop={16}>
              <View style={styles.consoleHeader}>
                <ActivityIndicator size="small" color={theme.colors.primary} style={styles.spinner} />
                <Text style={[styles.consoleHeaderTitle, { color: theme.colors.textSecondary }]}>RAKSHAK_ENGINE_TRACE</Text>
              </View>
              {consoleLogs.map((log) => (
                <Text key={log} style={[styles.logLine, { color: theme.colors.textSecondary }]}>{log}</Text>
              ))}
            </Card>
          )}

          {/* Quick Actions */}
          <Text style={[styles.sectionTitle, theme.fonts.h3, { color: theme.colors.textPrimary, marginTop: 16 }]}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              onPress={() => navigation.navigate('VoiceScanner')}
              style={[styles.actionTile, { backgroundColor: theme.colors.surfaceContainer, borderColor: theme.colors.outline }]}
              disabled={loading}
            >
              <MaterialCommunityIcons name="microphone" size={24} color={theme.colors.secondary} style={styles.actionIcon} />
              <Text style={[styles.actionLabel, theme.fonts.bodySmall, { color: theme.colors.textPrimary }]}>Voice Scanner</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('SMSScreen')}
              style={[styles.actionTile, { backgroundColor: theme.colors.surfaceContainer, borderColor: theme.colors.outline }]}
              disabled={loading}
            >
              <MaterialCommunityIcons name="message" size={24} color={theme.colors.secondary} style={styles.actionIcon} />
              <Text style={[styles.actionLabel, theme.fonts.bodySmall, { color: theme.colors.textPrimary }]}>{t('scanner.scanSms')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('FileScanner')}
              style={[styles.actionTile, { backgroundColor: theme.colors.surfaceContainer, borderColor: theme.colors.outline }]}
              disabled={loading}
            >
              <MaterialCommunityIcons name="file" size={24} color={theme.colors.secondary} style={styles.actionIcon} />
              <Text style={[styles.actionLabel, theme.fonts.bodySmall, { color: theme.colors.textPrimary }]}>{t('scanner.scanFile')}</Text>
            </TouchableOpacity>
          </View>

          {/* Sample Messages */}
          <Text style={[styles.sectionTitle, theme.fonts.h3, { color: theme.colors.textPrimary, marginTop: 24 }]}>Sample Messages</Text>
          <View style={styles.templatesGroup}>
            {templates.map((template) => (
              <TouchableOpacity
                key={template.label}
                onPress={() => setMessage(template.text)}
                style={[styles.templateCard, { backgroundColor: theme.colors.surfaceContainer, borderColor: theme.colors.outline }]}
                disabled={loading}
              >
                <Text style={[styles.templateLabel, theme.fonts.bodyLarge, { color: theme.colors.primary }]}>{template.label}</Text>
                <Text numberOfLines={2} style={[styles.templatePreview, theme.fonts.bodySmall, { color: theme.colors.textSecondary }]}>{template.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontWeight: '700', marginBottom: 6 },
  sectionSubtitle: { fontSize: 12, color: '#64748B', marginBottom: 12 },
  instruction: { lineHeight: 18, marginBottom: 16 },
  inputContainer: { borderWidth: 1.5, borderRadius: 14, padding: 14, minHeight: 150, marginBottom: 16 },
  input: { flex: 1, textAlignVertical: 'top', fontSize: 15, lineHeight: 22 },
  clearBtn: { position: 'absolute', bottom: 14, right: 14 },
  consoleViewer: { backgroundColor: '#0F172A', borderColor: '#334155', borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 16 },
  consoleHeader: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#334155', paddingBottom: 6, marginBottom: 8 },
  spinner: { marginRight: 8 },
  consoleHeaderTitle: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', color: '#94A3B8', fontWeight: '700', fontSize: 11, letterSpacing: 0.5 },
  logLine: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 12, lineHeight: 18, marginVertical: 2 },
  ctaButton: { width: '100%', marginTop: 8 },
  templatesGroup: { marginTop: 12 },
  templateCard: { borderWidth: 1.5, borderRadius: 12, padding: 14, marginVertical: 6 },
  templateLabel: { fontWeight: '700', marginBottom: 4 },
  templatePreview: { lineHeight: 16 },

  /* Link verification styles */
  linkResultCard: { backgroundColor: '#1E293B', borderColor: '#334155', borderWidth: 1, borderRadius: 16, padding: 16, marginTop: 16, marginBottom: 20 },
  linkResultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  verdictLabel: { textAlign: 'center' },
  verdictScore: { textAlign: 'center' },
  urlItem: { marginBottom: 12 },
  urlLabel: { fontWeight: '700', fontSize: 10, marginBottom: 2 },
  urlText: { fontSize: 14, lineHeight: 20, marginBottom: 8 },
  urlBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, fontSize: 10, fontWeight: '700' },
  linkResultFooter: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#334155' },
  engineDetail: { textAlign: 'center', fontSize: 11 },

  /* Language row */
  langRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  langLabel: { fontWeight: '600' },
  langBtn: { paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#1E3A8A', borderRadius: 8 },
  langValue: { fontWeight: '700' },

  /* Section row */
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },

  /* Actions grid */
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionTile: { width: '30%', borderWidth: 1, borderRadius: 12, padding: 14, alignItems: 'center' },
  actionIcon: { marginBottom: 6 },
  actionLabel: { fontSize: 11, textAlign: 'center' },
});
