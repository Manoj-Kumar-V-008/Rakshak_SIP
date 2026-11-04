import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import { AppTheme } from '../../theme';
import { Header } from '../../components/common/Header';
import { CustomButton } from '../../components/common/CustomButton';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Card } from '../../components/common/Card';
import { useConfigStore } from '../../store/useConfigStore';
import { analyze } from '../../services/engine/analyze';
import { AnalysisResult } from '../../types/analysis';
import { t } from '../../locales';
import * as Speech from 'expo-speech';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const smsTemplates = [
  { label: 'Bank KYC Scam', sender: 'SBIBNK', text: 'Dear customer, your SBI account will be blocked today. Update KYC immediately at http://sbi-kyc-update.xyz and share your OTP.' },
  { label: 'UPI Payment Request', sender: 'UPIPAY', text: 'You have received a collect request of Rs 500 from unknown@upi. Accept to receive money.' },
  { label: 'Digital Arrest', sender: 'CBI-IND', text: 'This is Inspector Rao from CBI. A parcel in your name contains narcotics. Stay on video call and transfer Rs 50,000 for verification.' },
  { label: 'Safe Bank OTP', sender: 'HDFCBK', text: '482913 is your OTP for HDFC Bank NetBanking login. Do not share it with anyone.' },
];

export const SMSScreen: React.FC = () => {
  const theme = useTheme() as AppTheme;
  const addSmsRecord = useConfigStore((state) => state.addSmsRecord);
  const [sender, setSender] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [smsResult, setSmsResult] = useState<AnalysisResult | null>(null);

  const handleScanSms = async () => {
    const from = sender.trim();
    const text = message.trim();
    if (text.length < 5) return;
    setLoading(true);
    setSmsResult(null);
    try {
      const { result, via } = await analyze(`${from}: ${text}`);
      setSmsResult(result);
      addSmsRecord({
        sender: from || 'Unknown',
        text,
        score: result.riskScore,
        level: result.level,
        type: result.scamType,
        indicators: result.indicators,
        remediationSteps: result.remediationSteps,
      });
      if (via === 'offline') {
        Alert.alert(t('common.offlineMode'), 'The server was unavailable. SMS scan used on-device rules.');
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Unknown error.';
      Alert.alert('SMS scan unavailable', detail);
    } finally { setLoading(false); }
  };

  const hearWarning = async () => {
    if (!smsResult) return;
    const script = `SMS from ${sender.trim() || 'unknown sender'} rated ${smsResult.level}, risk ${smsResult.riskScore} out of 100. ${smsResult.indicators.join(', ')}`;
    Speech.speak(script, { rate: 0.95 });
  };

  const levelColor = (level: AnalysisResult['level']) => {
    if (level === 'danger') return theme.colors.danger;
    if (level === 'suspicious') return theme.colors.warning;
    return theme.colors.safe;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header title={t('sms.title')} showBack />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={[styles.sectionTitle, theme.fonts.h3, { color: theme.colors.textPrimary }]}>Scan Incoming SMS</Text>
          <Text style={[styles.instruction, theme.fonts.bodySmall, { color: theme.colors.textSecondary }]}>Paste the SMS sender and message body to check for scams.</Text>

          <View style={[styles.inputContainer, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surfaceContainer }]}>
            <TextInput
              value={sender}
              onChangeText={setSender}
              placeholder="Sender ID (e.g. SBI-BNK, HDFCBK)"
              placeholderTextColor={theme.colors.textMuted}
              style={[styles.input, theme.fonts.bodyMedium, { color: theme.colors.textPrimary }]}
              editable={!loading}
              maxLength={30}
            />
          </View>

          <View style={[styles.inputContainer, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surfaceContainer, marginTop: 12 }]}>
            <TextInput
              multiline
              numberOfLines={5}
              value={message}
              onChangeText={setMessage}
              placeholder="Paste the SMS message body here..."
              placeholderTextColor={theme.colors.textMuted}
              style={[styles.input, theme.fonts.bodyMedium, { color: theme.colors.textPrimary }]}
              maxLength={1000}
              editable={!loading}
            />
            {message.length > 0 && !loading ? <TouchableOpacity onPress={() => setMessage('')} style={styles.clearBtn}><MaterialCommunityIcons name="close-circle" size={18} color={theme.colors.textMuted} /></TouchableOpacity> : null}
          </View>

          <CustomButton title={loading ? t('common.scanning') : t('sms.scanSms')} onPress={handleScanSms} variant="primary" disabled={loading || message.trim().length < 5} style={styles.ctaButton} />

          {smsResult ? (
            <Card padding={20} radius={20} elevation={3} marginTop={16}>
              <View style={[styles.resultHeader, { borderLeftWidth: 4, borderLeftColor: levelColor(smsResult.level) }]}>
                <View style={styles.resultInfo}>
                  <Text style={[styles.verdictLabel, theme.fonts.h3, { color: levelColor(smsResult.level), fontWeight: '800' }]}>{smsResult.level.toUpperCase()} SMS</Text>
                  <Text style={[styles.verdictScore, theme.fonts.bodyLarge, { color: theme.colors.textPrimary, fontWeight: '800' }]}>Risk {smsResult.riskScore}/100</Text>
                </View>
              </View>
              <View style={[styles.senderBox, { marginTop: 12 }]}>
                <Text style={[styles.senderLabel, theme.fonts.caption, { color: theme.colors.textSecondary }]}>From</Text>
                <Text style={[styles.senderValue, theme.fonts.bodyMedium, { color: theme.colors.textPrimary }]}>{sender.trim() || 'Unknown'}</Text>
              </View>
              <View style={[styles.messageBox, { marginTop: 12 }]}>
                <Text style={[styles.senderLabel, theme.fonts.caption, { color: theme.colors.textSecondary }]}>Message</Text>
                <Text style={[styles.messageText, theme.fonts.bodyMedium, { color: theme.colors.textPrimary }]}>{smsResult.displayText}</Text>
              </View>
              <View style={[styles.typeCard, { marginTop: 12 }]}>
                <Text style={[styles.senderLabel, theme.fonts.caption, { color: theme.colors.textSecondary }]}>Scam Type</Text>
                <View style={styles.typeBadgeRow}>
                  <StatusBadge label={smsResult.scamType} variant={smsResult.level === 'danger' ? 'coral' : smsResult.level === 'suspicious' ? 'amber' : 'emerald'} />
                </View>
              </View>
              <Text style={[styles.sectionTitle, theme.fonts.h3, { color: theme.colors.textPrimary, marginTop: 16 }]}>Red Flags</Text>
              <View style={styles.listContainer}>
                {smsResult.indicators.map((indicator) => (
                  <View key={indicator} style={styles.listItem}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={16} color={levelColor(smsResult.level)} style={styles.listIcon} />
                    <Text style={[styles.listItemText, theme.fonts.bodyMedium, { color: theme.colors.textSecondary }]}>{indicator}</Text>
                  </View>
                ))}
              </View>
              <Text style={[styles.sectionTitle, theme.fonts.h3, { color: theme.colors.textPrimary, marginTop: 16 }]}>What to do</Text>
              <View style={styles.listContainer}>
                {smsResult.remediationSteps.map((step) => (
                  <View key={step} style={styles.listItem}>
                    <MaterialCommunityIcons name="shield-outline" size={16} color={theme.colors.safe} style={styles.listIcon} />
                    <Text style={[styles.listItemText, theme.fonts.bodyMedium, { color: theme.colors.textSecondary }]}>{step}</Text>
                  </View>
                ))}
              </View>
              {smsResult.level !== 'safe' ? <CustomButton title="Call Cybercrime Helpline · 1930" onPress={() => Alert.alert('Call 1930', 'Dialing cybercrime helpline...')} variant="danger" style={[styles.helplineButton, { marginTop: 12 }]} /> : null}
              <CustomButton title="Hear warning aloud" onPress={hearWarning} variant="outline" style={[styles.helplineButton, { marginTop: 12 }]} />
            </Card>
          ) : null}

          <Text style={[styles.sectionTitle, theme.fonts.h3, { color: theme.colors.textPrimary, marginTop: 24 }]}>Sample SMS</Text>
          <View style={styles.templatesGroup}>
            {smsTemplates.map((template) => (
              <TouchableOpacity
                key={template.label}
                onPress={() => { setSender(template.sender); setMessage(template.text); }}
                style={[styles.templateCard, { backgroundColor: theme.colors.surfaceContainer, borderColor: theme.colors.outline }]}
                disabled={loading}
              >
                <Text style={[styles.templateLabel, theme.fonts.bodyLarge, { color: theme.colors.primary }]}>{template.label}</Text>
                <Text style={[styles.templatePreview, theme.fonts.bodySmall, { color: theme.colors.textSecondary }]}>{template.sender}: {template.text}</Text>
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
  instruction: { lineHeight: 18, marginBottom: 16 },
  inputContainer: { borderWidth: 1.5, borderRadius: 14, padding: 14, minHeight: 140, marginBottom: 12 },
  input: { flex: 1, textAlignVertical: 'top', fontSize: 15, lineHeight: 22 },
  clearBtn: { position: 'absolute', bottom: 12, right: 12 },
  ctaButton: { width: '100%', marginTop: 8 },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  verdictLabel: { textAlign: 'center' },
  verdictScore: { textAlign: 'center' },
  resultInfo: { flex: 1 },
  senderBox: { flexDirection: 'row', justifyContent: 'space-between' },
  senderLabel: { fontWeight: '700', fontSize: 10, marginBottom: 2 },
  senderValue: { fontSize: 14, fontWeight: '700' },
  messageBox: { marginBottom: 10 },
  messageText: { fontSize: 14, lineHeight: 22 },
  typeBadgeRow: { flexDirection: 'row' },
  typeCard: { marginBottom: 0 },
  listContainer: { marginBottom: 20 },
  listItem: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 6, paddingRight: 12 },
  listIcon: { marginTop: 3, marginRight: 10 },
  listItemText: { lineHeight: 20, flex: 1 },
  helplineButton: { width: '100%', marginTop: 8 },
  templatesGroup: { marginTop: 12 },
  templateCard: { borderWidth: 1.5, borderRadius: 12, padding: 14, marginVertical: 6 },
  templateLabel: { fontWeight: '700', marginBottom: 4 },
  templatePreview: { lineHeight: 16 },
});
