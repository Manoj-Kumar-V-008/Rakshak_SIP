import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppTheme } from '../../theme';
import { Header } from '../../components/common/Header';
import { CustomButton } from '../../components/common/CustomButton';
import { RootStackParamList } from '../../navigation/types';
import { useConfigStore } from '../../store/useConfigStore';
import { analyze } from '../../services/engine/analyze';

type NavigationProp = StackNavigationProp<RootStackParamList, 'App'>;
const templates = [
  { label: 'Electricity Scam', text: 'ALERT: your electricity power connection will be disconnected tonight at 9.30 PM. Call power officer at 9812345678 immediately.' },
  { label: 'Safe Bank OTP', text: '482913 is your OTP for HDFC Bank NetBanking login. Do not share it with anyone.' },
  { label: 'Digital Arrest', text: 'This is Inspector Rao from CBI. A parcel in your name contains narcotics. You are under digital arrest. Stay on the video call and do not tell anyone.' },
];

export const ScannerScreen: React.FC = () => {
  const theme = useTheme() as AppTheme;
  const navigation = useNavigation<NavigationProp>();
  const addScanRecord = useConfigStore((state) => state.addScanRecord);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);

  const handleAnalyze = async () => {
    const text = message.trim();
    if (text.length < 5) return;
    setLoading(true);
    setConsoleLogs(['Connecting to Rakshak rules engine…']);
    try {
      const { result, via } = await analyze(text);
      setConsoleLogs(result.trace.map((step) => `[${step.stage.toUpperCase()}] ${step.detail} (${step.ms} ms)`));
      addScanRecord({ text: result.displayText, score: result.riskScore, type: result.scamType, indicators: result.indicators, remediationSteps: result.remediationSteps });
      setMessage('');
      navigation.navigate('ScamAnalysisResult', { result });
      if (via === 'offline') Alert.alert('Offline mode', 'The server was unavailable. This scan used the on-device rules engine.');
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Unknown error.';
      setConsoleLogs([`[ERROR] ${detail}`]);
      Alert.alert('Scan unavailable', detail);
    } finally { setLoading(false); }
  };

  return <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
    <Header title="Scam Scanner" />
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={[styles.sectionTitle, theme.fonts.h3, { color: theme.colors.textPrimary }]}>Server · transparent rules engine</Text>
        <Text style={[styles.instruction, theme.fonts.bodySmall, { color: theme.colors.textSecondary }]}>Paste a message to scan it against explainable scam patterns. Your text is sent only to the configured Rakshak backend.</Text>
        <View style={[styles.inputContainer, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface }]}>
          <TextInput multiline numberOfLines={6} value={message} onChangeText={setMessage} placeholder="Paste suspicious SMS, email, or UPI link message here..." placeholderTextColor={theme.colors.textMuted} style={[styles.input, theme.fonts.bodyMedium, { color: theme.colors.textPrimary }]} maxLength={1000} editable={!loading} />
          {message.length > 0 && !loading && <TouchableOpacity onPress={() => setMessage('')} style={styles.clearBtn}><MaterialCommunityIcons name="close-circle" size={18} color={theme.colors.textMuted} /></TouchableOpacity>}
        </View>
        {(loading || consoleLogs.length > 0) && <View style={styles.consoleViewer}><View style={styles.consoleHeader}>{loading && <ActivityIndicator size="small" color={theme.colors.primary} style={styles.spinner} />}<Text style={styles.consoleHeaderTitle}>RAKSHAK_ENGINE_TRACE</Text></View>{consoleLogs.map((log) => <Text key={log} style={[styles.logLine, { color: theme.colors.safe }]}>{log}</Text>)}</View>}
        <CustomButton title={loading ? 'Analyzing…' : 'Analyze Message'} onPress={handleAnalyze} variant="primary" disabled={loading || message.trim().length < 5} style={styles.ctaButton} />
        <Text style={[styles.sectionTitle, theme.fonts.h3, { color: theme.colors.textPrimary, marginTop: 24 }]}>Sample messages</Text>
        <View style={styles.templatesGroup}>{templates.map((template) => <TouchableOpacity key={template.label} onPress={() => setMessage(template.text)} style={[styles.templateCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]} disabled={loading}><Text style={[styles.templateLabel, theme.fonts.bodyLarge, { color: theme.colors.primary }]}>{template.label}</Text><Text numberOfLines={2} style={[styles.templatePreview, theme.fonts.bodySmall, { color: theme.colors.textSecondary }]}>{template.text}</Text></TouchableOpacity>)}</View>
      </ScrollView>
    </KeyboardAvoidingView>
  </View>;
};

const styles = StyleSheet.create({
  container: { flex: 1 }, flex: { flex: 1 }, scrollContent: { padding: 20, paddingBottom: 40 }, sectionTitle: { fontWeight: '700', marginBottom: 4 }, instruction: { lineHeight: 18, marginBottom: 16 }, inputContainer: { borderWidth: 1.5, borderRadius: 16, padding: 12, minHeight: 140, marginBottom: 16 }, input: { flex: 1, textAlignVertical: 'top', fontSize: 15, lineHeight: 20 }, clearBtn: { position: 'absolute', bottom: 12, right: 12 }, consoleViewer: { backgroundColor: '#020617', borderColor: '#1E293B', borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 16 }, consoleHeader: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#1E293B', paddingBottom: 6, marginBottom: 8 }, spinner: { marginRight: 8 }, consoleHeaderTitle: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', color: '#94A3B8', fontWeight: '700', fontSize: 11, letterSpacing: 0.5 }, logLine: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 12, lineHeight: 18, marginVertical: 2 }, ctaButton: { width: '100%' }, templatesGroup: { marginTop: 12 }, templateCard: { borderWidth: 1.5, borderRadius: 12, padding: 12, marginVertical: 6 }, templateLabel: { fontWeight: '700', marginBottom: 4 }, templatePreview: { lineHeight: 16 },
});
export default ScannerScreen;
