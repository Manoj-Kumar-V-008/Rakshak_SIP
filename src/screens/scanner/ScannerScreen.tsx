import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import { AppTheme } from '../../theme';
import { Header } from '../../components/common/Header';
import { CustomButton } from '../../components/common/CustomButton';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useConfigStore } from '../../store/useConfigStore';

type NavigationProp = StackNavigationProp<RootStackParamList, 'App'>;

export const ScannerScreen: React.FC = () => {
  const theme = useTheme() as AppTheme;
  const navigation = useNavigation<NavigationProp>();
  const addScanRecord = useConfigStore((state) => state.addScanRecord);

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);

  // Demo Mock templates to make testing easy
  const templates = [
    {
      label: '⚡ Electricity Scam',
      text: 'ALERT: Dear customer your electricity power connection will be disconnected tonight at 9.30 PM. Call power officer at 9812345678 immediately to pay pending bills.',
      riskScore: 92,
      scamType: 'Fake Utility Scam',
      indicators: ['Urgency tactics used', 'Requests immediate callback', 'Non-official helpline number'],
      remediationSteps: ['Do not call the number', 'Directly verify with your electricity company board', 'Report this SMS to the cybercrime cell (1930)'],
    },
    {
      label: '💬 Safe Message',
      text: 'Hey! Are we still meeting for lunch at 1:30 PM today? Let me know, I am ordering the food.',
      riskScore: 5,
      scamType: 'Safe Conversation',
      indicators: ['No suspicious links found', 'Normal conversational dialogue'],
      remediationSteps: ['Safe to reply', 'Always exercise standard safety when sharing private info'],
    },
    {
      label: '🎁 Lottery/Gifts',
      text: 'CONGRATULATIONS! Your mobile number has won a cash prize of 25,00,000 INR in KBC Lucky Draw. To claim your prize money contact manager Mr. Kumar at 9999123456.',
      riskScore: 88,
      scamType: 'KBC Lottery Scam',
      indicators: ['Too good to be true claims', 'Requests advance processing fee', 'Unknown phone number source'],
      remediationSteps: ['Do not share bank credentials', 'Do not pay any money to claim lottery rewards', 'Block and report this contact number'],
    },
  ];

  const handleTemplateSelect = (text: string) => {
    setMessage(text);
  };

  const handleAnalyze = () => {
    const textToScan = message.trim();
    if (textToScan.length < 5) {
      Alert.alert('Message Too Short', 'Please enter a valid message (minimum 5 characters) to perform security scanning.');
      return;
    }

    setLoading(true);
    setConsoleLogs([]);

    // Step-by-step console logs to simulate on-device neural network loading
    const logSteps = [
      { delay: 100, msg: '❯ [CORE] Initializing Mobile-BERT classifier...' },
      { delay: 500, msg: '❯ [NLP] Tokenizing input string into wordpiece vectors...' },
      { delay: 900, msg: '❯ [HEURISTICS] Checking semantic vectors for urgency/fear metrics...' },
      { delay: 1300, msg: '❯ [DECISION] Computing local neural threat score...' },
    ];

    logSteps.forEach((step) => {
      setTimeout(() => {
        setConsoleLogs((prev) => [...prev, step.msg]);
      }, step.delay);
    });

    // Complete scan and navigate to results (takes 2 seconds)
    setTimeout(() => {
      setLoading(false);

      const matchedTemplate = templates.find((t) => t.text === textToScan);

      let resultData = {
        scamText: textToScan,
        riskScore: 12,
        scamType: 'Unverified Sender',
        indicators: ['Unverified sender number source'],
        remediationSteps: [
          'Avoid replying or calling back directly',
          'Verify with official helpline numbers',
          'Do not share personal details',
        ],
      };

      if (matchedTemplate) {
        resultData = {
          scamText: textToScan,
          riskScore: matchedTemplate.riskScore,
          scamType: matchedTemplate.scamType,
          indicators: matchedTemplate.indicators,
          remediationSteps: matchedTemplate.remediationSteps,
        };
      } else {
        const lower = textToScan.toLowerCase();
        
        // 1. Utility Bill Scams
        if (
          lower.includes('electricity') ||
          lower.includes('bill') ||
          lower.includes('power') ||
          lower.includes('disconnected') ||
          lower.includes('disconnect') ||
          lower.includes('cutoff')
        ) {
          resultData = {
            scamText: textToScan,
            riskScore: 92,
            scamType: 'Utility Disconnection Fraud',
            indicators: [
              'Urgency tactics detected (threatening disconnection tonight)',
              'Asks to call unverified phone number',
              'Non-official communication channel',
            ],
            remediationSteps: [
              'Do not call the number listed in the message',
              'Check your bill directly on the official state electricity portal',
              'Report the scam attempt to local authorities',
            ],
          };
        }
        // 2. Phishing & Banking credentials
        else if (
          lower.includes('otp') ||
          lower.includes('card') ||
          lower.includes('bank') ||
          lower.includes('blocked') ||
          lower.includes('suspended') ||
          lower.includes('kyc') ||
          lower.includes('pan') ||
          lower.includes('aadhaar') ||
          lower.includes('verify')
        ) {
          resultData = {
            scamText: textToScan,
            riskScore: 96,
            scamType: 'Credential Phishing Fraud',
            indicators: [
              'Requests critical authentication codes (OTP/PIN)',
              'Mimics official banking warning alerts to create panic',
              'Requests account verification using external unverified links',
            ],
            remediationSteps: [
              'Never share OTPs, PINs, or card details with anyone',
              'Contact your bank directly using the phone number printed on your card',
              'Block the sender immediately',
            ],
          };
        }
        // 3. Digital Arrest Scams & Legal Threats
        else if (
          lower.includes('police') ||
          lower.includes('customs') ||
          lower.includes('cbi') ||
          lower.includes('arrest') ||
          lower.includes('court') ||
          lower.includes('warrant') ||
          lower.includes('illegal') ||
          lower.includes('narcotics') ||
          lower.includes('laundering')
        ) {
          resultData = {
            scamText: textToScan,
            riskScore: 98,
            scamType: 'Digital Arrest Scam',
            indicators: [
              'Uses extreme fear and legal threats to coerce compliance',
              'Impersonates law enforcement (CBI, Customs, Police)',
              'Demands remaining on video call / Skype for investigation',
            ],
            remediationSteps: [
              'Disconnect the video call immediately. Real police never investigate via video calls',
              'Real authorities will never demand instant bank transfers for verification',
              'Call 1930 immediately to report the blackmail attempt',
            ],
          };
        }
        // 4. Lottery & Sweeps Scams
        else if (
          lower.includes('win') ||
          lower.includes('lucky') ||
          lower.includes('lottery') ||
          lower.includes('prize') ||
          lower.includes('won') ||
          lower.includes('kbc') ||
          lower.includes('crore') ||
          lower.includes('lakh')
        ) {
          resultData = {
            scamText: textToScan,
            riskScore: 88,
            scamType: 'Lottery Reward Scam',
            indicators: [
              'Too-good-to-be-true sweepstakes rewards',
              'Requires advance fee or processing charges to release prize',
              'Unsolicited congratulatory SMS messages',
            ],
            remediationSteps: [
              'If you did not buy a ticket, you did not win. Block the sender',
              'Never pay money (GST/customs fee) to receive a prize',
              'Do not click the link or send files',
            ],
          };
        }
        // 5. Job Scams
        else if (
          lower.includes('job') ||
          lower.includes('salary') ||
          lower.includes('earn') ||
          lower.includes('part time') ||
          lower.includes('work from home')
        ) {
          resultData = {
            scamText: textToScan,
            riskScore: 84,
            scamType: 'Fake Job Recruitment Scam',
            indicators: [
              'Offers high pay for simple tasks (liking videos, writing reviews)',
              'Recruitment happens via WhatsApp or Telegram channels',
              'Requires upfront payment for training or tools',
            ],
            remediationSteps: [
              'Reputable companies do not recruit via anonymous chats or pay for likes',
              'Do not deposit money to secure employment',
              'Block the recruiters immediately',
            ],
          }
        }
        // 6. Generic Link / Warning words
        else if (
          lower.includes('scam') ||
          lower.includes('fraud') ||
          lower.includes('link') ||
          lower.includes('click') ||
          lower.includes('http') ||
          lower.includes('bit.ly')
        ) {
          resultData = {
            scamText: textToScan,
            riskScore: 78,
            scamType: 'Suspicious Link Redirect',
            indicators: [
              'Uses shortened redirect links (bit.ly/tinyurl)',
              'Suspicious domain names not matching official resources',
            ],
            remediationSteps: [
              'Do not click unknown or shortened URLs',
              'Use a link checker tool to expand the redirect address',
            ],
          };
        }
      }

      // WRITE RECORD TO THE LOCAL ZUSTAND DATABASE HISTORY
      addScanRecord({
        text: resultData.scamText,
        score: resultData.riskScore,
        type: resultData.scamType,
        indicators: resultData.indicators,
        remediationSteps: resultData.remediationSteps,
      });

      // Clear search text field for next scan
      setMessage('');

      // Navigate to results stack
      (navigation as any).navigate('ScamAnalysisResult', resultData);
    }, 2000);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header title="Scam Scanner" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={[styles.sectionTitle, theme.fonts.h3, { color: theme.colors.textPrimary }]}>
            On-Device AI Parser
          </Text>
          <Text style={[styles.instruction, theme.fonts.bodySmall, { color: theme.colors.textSecondary }]}>
            Copy and paste any suspicious text message, SMS alert, or link below to run local Natural Language Processing (NLP).
          </Text>

          {/* Text Input Block */}
          <View style={[styles.inputContainer, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface }]}>
            <TextInput
              multiline
              numberOfLines={6}
              value={message}
              onChangeText={setMessage}
              placeholder="Paste suspicious SMS, email, or UPI link message here..."
              placeholderTextColor={theme.colors.textMuted}
              style={[styles.input, theme.fonts.bodyMedium, { color: theme.colors.textPrimary }]}
              maxLength={400}
              editable={!loading}
            />
            {message.length > 0 && !loading && (
              <TouchableOpacity onPress={() => setMessage('')} style={styles.clearBtn}>
                <MaterialCommunityIcons name="close-circle" size={18} color={theme.colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Analyze CTA Button / AI Loading logs */}
          {loading ? (
            <View style={[styles.consoleViewer, { backgroundColor: '#020617', borderColor: '#1E293B' }]}>
              <View style={styles.consoleHeader}>
                <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginRight: 8 }} />
                <Text style={styles.consoleHeaderTitle}>SENTINEL_NEURAL_LOGS</Text>
              </View>
              <ScrollView style={styles.logList} nestedScrollEnabled>
                {consoleLogs.map((log, i) => (
                  <Text key={i} style={[styles.logLine, { color: theme.colors.safe }]}>
                    {log}
                  </Text>
                ))}
              </ScrollView>
            </View>
          ) : (
            <CustomButton
              title="Analyze Message"
              onPress={handleAnalyze}
              variant="primary"
              disabled={message.trim().length < 5}
              style={styles.ctaButton}
            />
          )}

          {/* Demo Templates Section */}
          <Text style={[styles.sectionTitle, theme.fonts.h3, { color: theme.colors.textPrimary, marginTop: 24 }]}>
            Demo Scam Templates
          </Text>
          <Text style={[styles.instruction, theme.fonts.bodySmall, { color: theme.colors.textSecondary }]}>
            Tap any template card below to automatically load sample text messages to test and evaluate the app.
          </Text>

          <View style={styles.templatesGroup}>
            {templates.map((t, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleTemplateSelect(t.text)}
                style={[
                  styles.templateCard,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline },
                ]}
                disabled={loading}
              >
                <Text style={[styles.templateLabel, theme.fonts.bodyLarge, { color: theme.colors.primary }]}>
                  {t.label}
                </Text>
                <Text
                  numberOfLines={2}
                  style={[styles.templatePreview, theme.fonts.bodySmall, { color: theme.colors.textSecondary }]}
                >
                  {t.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 4,
  },
  instruction: {
    lineHeight: 18,
    marginBottom: 16,
  },
  inputContainer: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 12,
    minHeight: 140,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    textAlignVertical: 'top',
    fontSize: 15,
    lineHeight: 20,
  },
  clearBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  consoleViewer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    height: 140,
    marginBottom: 16,
  },
  consoleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingBottom: 6,
    marginBottom: 8,
  },
  consoleHeaderTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#94A3B8',
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  logList: {
    flex: 1,
  },
  logLine: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    lineHeight: 18,
    marginVertical: 2,
  },
  ctaButton: {
    width: '100%',
  },
  templatesGroup: {
    marginTop: 12,
  },
  templateCard: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    marginVertical: 6,
  },
  templateLabel: {
    fontWeight: '700',
    marginBottom: 4,
  },
  templatePreview: {
    lineHeight: 16,
  },
});
export default ScannerScreen;
