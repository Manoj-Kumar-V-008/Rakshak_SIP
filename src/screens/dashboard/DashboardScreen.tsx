import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Linking, Platform, ImageBackground } from 'react-native';
import { useTheme } from 'react-native-paper';
import { AppTheme } from '../../theme';
import { Header } from '../../components/common/Header';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useConfigStore } from '../../store/useConfigStore';
import { getRulesVersion, isUsingRemoteRules } from '../../services/engine/localEngine';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export const DashboardScreen: React.FC = () => {
  const theme = useTheme() as AppTheme;
  const navigation = useNavigation();
  const profile = useConfigStore((state) => state.profile);
  const scansHistory = useConfigStore((state) => state.scansHistory);
  const engineMode = useConfigStore((state) => state.engineMode);
  const backendUrl = useConfigStore((state) => state.backendUrl);
  const highRisk = scansHistory.filter((s) => s.score > 60).length;
  const safeCount = scansHistory.filter((s) => s.score <= 20).length;
  const suspiciousCount = scansHistory.filter((s) => s.score > 20 && s.score <= 60).length;

  const handleSOS = async () => {
    try {
      const telUrl = 'tel:1930';
      if (!(await Linking.canOpenURL(telUrl))) throw new Error('Calling is not supported on this device.');
      await Linking.openURL(telUrl);
    } catch (error) {
      Alert.alert('Dial 1930', error instanceof Error ? error.message : 'Please dial 1930 manually.');
    }
  };

  const handleQuickAction = (actionType: string) => {
    if (actionType === 'scan') {
      navigation.navigate('ScannerTab' as never);
    } else {
      Alert.alert('AI Feature simulation', `${actionType} scanning is simulated in this prototype. Go to the Scanner tab to test the text message AI scanner.`);
    }
  };

  const getRiskProps = (score: number) => {
    if (score <= 20) {
      return { variant: 'emerald' as const, label: 'Safe' };
    } else if (score <= 60) {
      return { variant: 'amber' as const, label: 'Caution' };
    } else {
      return { variant: 'coral' as const, label: 'Danger' };
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Branding Header with SOS button and Top-Left logo */}
      <Header
        title="RAKSHAK AI"
        rightAction={
          <TouchableOpacity
            onPress={handleSOS}
            style={[styles.sosButton, { backgroundColor: theme.colors.danger }]}
            activeOpacity={0.8}
          >
            <Text style={styles.sosText} numberOfLines={1}>SOS</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Sleek Cybersecurity Greeting Banner */}
        <View style={[styles.bannerWrapper, { borderColor: theme.colors.outline }]}>
          <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1510511459019-5dda7724fd87?w=600&auto=format&fit=crop&q=80' }}
            style={styles.bannerImageBg}
            imageStyle={{ borderRadius: 16 }}
          >
            <View style={styles.bannerDarkeningOverlay}>
              <View style={styles.bannerLeftContent}>
                <Text style={[styles.welcomeText, theme.fonts.h2, { color: '#FFFFFF' }]}>
                  Namaste, {profile.name}!
                </Text>
                <Text style={[styles.subText, theme.fonts.bodySmall, { color: '#CBD5E1', marginTop: 4 }]}>
                  Active Guardian Shield in {profile.preferredLanguage.toUpperCase()} mode.
                </Text>
              </View>
              <View style={[styles.bannerRightBadge, { backgroundColor: 'rgba(16, 185, 129, 0.2)', borderColor: theme.colors.safe }]}>
                <View style={[styles.pulseCircle, { backgroundColor: theme.colors.safe }]} />
                <Text style={[styles.pulseText, theme.fonts.labelSmall, { color: theme.colors.safe }]}>SYSTEM LIVE</Text>
              </View>
            </View>
          </ImageBackground>
        </View>

        {/* Dynamic AI Status Dial */}
        <View style={[styles.statusCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>
          <Text style={[styles.scanDiagnosticLabel, theme.fonts.caption, { color: theme.colors.textMuted, marginBottom: 12 }]}>
            AI THREAT SCANNER STATUS (TAP DIAL TO SCAN)
          </Text>
          {/* Radar Scanner Visual effect */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => handleQuickAction('scan')}
            style={[styles.radarCircle, { borderColor: theme.colors.outline }]}
          >
            <View style={[styles.dialCircle, { borderColor: theme.colors.safe, backgroundColor: theme.colors.background }]}>
              <MaterialCommunityIcons name="brain" size={48} color={theme.colors.primary} style={styles.brainIcon} />
              <Text style={[styles.dialStatus, theme.fonts.h3, { color: theme.colors.textPrimary }]}>
                {scansHistory.some((s) => s.score > 60) ? 'WARN' : 'SECURE'}
              </Text>
              <StatusBadge 
                label={scansHistory.some((s) => s.score > 60) ? 'Threat Alerted' : 'AI Shield Active'} 
                variant={scansHistory.some((s) => s.score > 60) ? 'coral' : 'emerald'} 
                style={styles.badgeAdjust} 
              />
            </View>
          </TouchableOpacity>
          <Text style={[styles.statusBrief, theme.fonts.bodySmall, { color: theme.colors.textSecondary }]}>
            {scansHistory.length === 0
              ? 'No scans yet. Paste a message in Scan, or analyze a call clip in Voice.'
              : `Scanned ${scansHistory.length} messages · ${highRisk} high-risk. Tap the dial to scan another.`}
          </Text>
        </View>

        {/* AI Assistant Message Bubble */}
        <View style={[styles.assistantBubble, { backgroundColor: theme.colors.surfaceContainer, borderColor: theme.colors.primary }]}>
          <View style={styles.assistantHeader}>
            <MaterialCommunityIcons name="robot" size={20} color={theme.colors.primary} />
            <Text style={[styles.assistantTitle, theme.fonts.labelLarge, { color: theme.colors.textPrimary }]}>
              Sentinel AI Assistant
            </Text>
            <StatusBadge label="Rules + AI" variant="info" style={{ marginLeft: 'auto' }} />
          </View>
          <Text style={[styles.assistantText, theme.fonts.bodyMedium, { color: theme.colors.textSecondary }]}>
            {`Namaste ${profile.name || 'friend'}! Paste any suspicious message in Scan, or bring a call clip to Voice Scanner. I check it against scam patterns and explain the risk in simple words.`}
          </Text>
        </View>

        {/* Real status panel (no simulated model stats) */}
        <Text style={[styles.sectionTitle, theme.fonts.h3, { color: theme.colors.textPrimary }]}>
          Protection Status
        </Text>
        <View style={[styles.diagnosticsCard, { backgroundColor: '#020617', borderColor: theme.colors.outline }]}>
          <View style={styles.consoleHeader}>
            <Text style={[styles.consoleTitle, theme.fonts.caption, { color: theme.colors.secondary }]}>
              RAKSHAK_STATUS
            </Text>
          </View>

          <View style={styles.diagnosticLine}>
            <Text style={styles.consoleLabel}>ENGINE :</Text>
            <Text style={styles.consoleVal}>{engineMode === 'offline' ? 'offline rules only' : 'auto (server, offline fallback)'}</Text>
          </View>
          <View style={styles.diagnosticLine}>
            <Text style={styles.consoleLabel}>OFFLINE_RULES :</Text>
            <Text style={styles.consoleVal}>v{getRulesVersion()}{isUsingRemoteRules() ? ' (remote)' : ' (bundled)'}</Text>
          </View>
          <View style={styles.diagnosticLine}>
            <Text style={styles.consoleLabel}>SCANS :</Text>
            <Text style={[styles.consoleVal, { color: highRisk > 0 ? theme.colors.danger : theme.colors.safe }]}>{scansHistory.length} total · {highRisk} high-risk</Text>
          </View>
          <View style={styles.diagnosticLine}>
            <Text style={styles.consoleLabel}>SERVER :</Text>
            <Text style={styles.consoleVal} numberOfLines={1}>{backendUrl}</Text>
          </View>
        </View>

        {/* Your scan mix (real counts from history) */}
        <Text style={[styles.sectionTitle, theme.fonts.h3, { color: theme.colors.textPrimary, marginTop: 12 }]}>
          Your Scan Mix
        </Text>
        {scansHistory.length === 0 ? (
          <View style={[styles.chartCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>
            <Text style={[theme.fonts.bodySmall, { color: theme.colors.textSecondary }]}>Scan a message to build your mix.</Text>
          </View>
        ) : (
        <View style={[styles.chartCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>
          {[
            { label: 'Safe scans', count: safeCount, color: theme.colors.safe },
            { label: 'Suspicious scans', count: suspiciousCount, color: theme.colors.warning },
            { label: 'Danger scans', count: highRisk, color: theme.colors.danger },
          ].map((row) => (
          <View key={row.label} style={styles.chartItem}>
            <View style={styles.chartLabelRow}>
              <Text style={[styles.chartLabel, theme.fonts.bodyMedium, { color: theme.colors.textPrimary }]}>
                {row.label}
              </Text>
              <Text style={[styles.chartPercent, theme.fonts.caption, { color: row.color }]}>{row.count}</Text>
            </View>
            <View style={[styles.progressBarBg, { backgroundColor: theme.colors.surfaceContainer }]}>
              <View style={[styles.progressBarFill, { backgroundColor: row.color, width: `${Math.round((row.count / scansHistory.length) * 100)}%` }]} />
            </View>
          </View>
          ))}
        </View>
        )}

        {/* Scans Database History (PHYSICAL DB LIST VERIFICATION) */}
        <Text style={[styles.sectionTitle, theme.fonts.h3, { color: theme.colors.textPrimary, marginTop: 16 }]}>
          Local Database Logs ({scansHistory.length} items)
        </Text>
        {scansHistory.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>
            <Ionicons name="folder-open-outline" size={24} color={theme.colors.textMuted} style={{ marginBottom: 6 }} />
            <Text style={[styles.emptyText, theme.fonts.bodySmall, { color: theme.colors.textSecondary }]}>
              No items in local database. Paste a message in the Scan tab to record scanning logs.
            </Text>
          </View>
        ) : (
          <View style={styles.historyList}>
            {scansHistory.map((item) => {
              const risk = getRiskProps(item.score);
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.8}
                  onPress={() => Alert.alert(
                    `AI Scan Verdict (${item.score}/100)`,
                    `Source: ${item.type}\nTime: ${item.timestamp}\n\nMessage:\n"${item.text}"`
                  )}
                  style={[styles.historyCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}
                >
                  <View style={styles.historyCardHeader}>
                    <Text style={[styles.historyTime, theme.fonts.caption, { color: theme.colors.textMuted }]}>
                      🕒 {item.timestamp}
                    </Text>
                    <StatusBadge label={`${item.score} - ${risk.label}`} variant={risk.variant} />
                  </View>
                  <Text numberOfLines={1} style={[styles.historyText, theme.fonts.bodyMedium, { color: theme.colors.textPrimary }]}>
                    {item.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Scanner entry points */}
        <Text style={[styles.sectionTitle, theme.fonts.h3, { color: theme.colors.textPrimary, marginTop: 16 }]}>
          Scan With
        </Text>
        <View style={styles.engineGrid}>
          <TouchableOpacity onPress={() => handleQuickAction('scan')} style={[styles.engineTile, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>
            <MaterialCommunityIcons name="message-processing-outline" size={24} color={theme.colors.primary} />
            <Text style={[styles.engineLabel, theme.fonts.labelSmall, { color: theme.colors.textPrimary }]}>
              Text Scanner
            </Text>
            <Text style={[styles.engineStatus, { color: theme.colors.safe }]}>● ready</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => (navigation.getParent() as unknown as { navigate: (name: string) => void })?.navigate('VoiceScanner')} style={[styles.engineTile, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>
            <MaterialCommunityIcons name="microphone-outline" size={24} color={theme.colors.secondary} />
            <Text style={[styles.engineLabel, theme.fonts.labelSmall, { color: theme.colors.textPrimary }]}>
              Voice Scanner
            </Text>
            <Text style={[styles.engineStatus, { color: theme.colors.safe }]}>● ready</Text>
          </TouchableOpacity>
        </View>

        {/* Live Scam Warnings */}
        <Text style={[styles.sectionTitle, theme.fonts.h3, { color: theme.colors.textPrimary, marginTop: 12 }]}>
          Live Scam Warnings
        </Text>
        
        <View style={[styles.alertCard, { backgroundColor: theme.colors.surface, borderLeftColor: theme.colors.danger }]}>
          <View style={styles.alertHeader}>
            <MaterialCommunityIcons name="alert-decagram" size={20} color={theme.colors.danger} />
            <Text style={[styles.alertTitle, theme.fonts.bodyLarge, { color: theme.colors.textPrimary }]}>
              Fake Electricity Bill Scam
            </Text>
          </View>
          <Text style={[styles.alertText, theme.fonts.bodySmall, { color: theme.colors.textSecondary }]}>
            Users are receiving SMS warnings stating "Power will be cut tonight at 9:30 PM due to unpaid bills. Call 98XXXXXXXX". Do not call or share OTPs.
          </Text>
        </View>

        <View style={[styles.alertCard, { backgroundColor: theme.colors.surface, borderLeftColor: theme.colors.warning }]}>
          <View style={styles.alertHeader}>
            <MaterialCommunityIcons name="alert-decagram" size={20} color={theme.colors.warning} />
            <Text style={[styles.alertTitle, theme.fonts.bodyLarge, { color: theme.colors.textPrimary }]}>
              UPI Double-Deduction Fraud
            </Text>
          </View>
          <Text style={[styles.alertText, theme.fonts.bodySmall, { color: theme.colors.textSecondary }]}>
            Fraudsters are sending Google Pay/PhonePe collect requests claiming they sent money by mistake. Block immediately.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sosButton: {
    width: 52,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  greetingContainer: {
    marginBottom: 20,
  },
  welcomeText: {
    fontWeight: '700',
  },
  subText: {
    marginTop: 2,
  },
  statusCard: {
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  scanDiagnosticLabel: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  radarCircle: {
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'dashed',
    marginBottom: 10,
  },
  dialCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brainIcon: {
    marginBottom: 4,
  },
  dialStatus: {
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  badgeAdjust: {
    position: 'absolute',
    bottom: -10,
    alignSelf: 'center',
  },
  statusBrief: {
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 12,
  },
  assistantBubble: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  assistantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  assistantTitle: {
    fontWeight: '700',
    marginLeft: 8,
  },
  assistantText: {
    fontStyle: 'italic',
    lineHeight: 18,
  },
  diagnosticsCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  consoleHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingBottom: 6,
    marginBottom: 10,
  },
  consoleTitle: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  diagnosticLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  consoleLabel: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  consoleVal: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  chartCard: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  chartItem: {
    marginVertical: 8,
  },
  chartLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  chartLabel: {
    fontWeight: '700',
  },
  chartPercent: {
    fontWeight: '800',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 12,
  },
  emptyCard: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderStyle: 'dashed',
  },
  emptyText: {
    textAlign: 'center',
    lineHeight: 18,
  },
  historyList: {
    marginBottom: 24,
  },
  historyCard: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 14,
    marginVertical: 6,
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyTime: {
    fontWeight: '600',
  },
  historyText: {
    fontStyle: 'italic',
  },
  engineGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  engineTile: {
    width: '48%',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 12,
    alignItems: 'flex-start',
  },
  engineLabel: {
    fontWeight: '700',
    marginVertical: 4,
  },
  engineStatus: {
    fontSize: 10,
    fontWeight: '700',
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionTile: {
    width: '48%',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionLabel: {
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 16,
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E2E8F0',
  },
  alertCard: {
    borderLeftWidth: 4,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  alertTitle: {
    fontWeight: '700',
    marginLeft: 8,
  },
  alertText: {
    lineHeight: 18,
  },
  bannerWrapper: {
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginBottom: 20,
  },
  bannerImageBg: {
    width: '100%',
    height: 100,
  },
  bannerDarkeningOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerLeftContent: {
    flex: 1,
  },
  bannerRightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pulseCircle: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  pulseText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
export default DashboardScreen;
