import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Platform, ImageBackground } from 'react-native';
import { useTheme } from 'react-native-paper';
import { AppTheme } from '../../theme';
import { Header } from '../../components/common/Header';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Card } from '../../components/common/Card';
import { useConfigStore } from '../../store/useConfigStore';
import { callCybercrimeHelpline } from '../../utils/callHelpline';
import { t } from '../../locales';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export const DashboardScreen: React.FC = () => {
  const theme = useTheme() as AppTheme;
  const navigation = useNavigation();
  const profile = useConfigStore((state) => state.profile);
  const scansHistory = useConfigStore((state) => state.scansHistory);
  const linkHistory = useConfigStore((state) => state.linkHistory);
  const smsHistory = useConfigStore((state) => state.smsHistory);
  const engineMode = useConfigStore((state) => state.engineMode);
  const backendUrl = useConfigStore((state) => state.backendUrl);
  const highRisk = scansHistory.filter((s) => s.score > 60).length;
  const safeCount = scansHistory.filter((s) => s.score <= 20).length;
  const suspiciousCount = scansHistory.filter((s) => s.score > 20 && s.score <= 60).length;

  const handleSOS = callCybercrimeHelpline;

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
      <Header title="RAKSHAK AI" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Greeting Banner */}
        <Card padding={20} radius={20} elevation={3}>
          <View style={styles.bannerContent}>
            <View style={styles.bannerLeft}>
              <Text style={[styles.welcomeText, theme.fonts.h2, { color: theme.colors.textPrimary }]}>
                Namaste, {profile.name || 'User'}!
              </Text>
              <Text style={[styles.subText, theme.fonts.bodySmall, { color: theme.colors.textSecondary }]}>
                Active Guardian Shield in {profile.preferredLanguage.toUpperCase()} mode.
              </Text>
            </View>
            <View style={[styles.bannerRightBadge, { backgroundColor: theme.colors.safeContainer }]}>
              <View style={[styles.pulseCircle, { backgroundColor: theme.colors.safe }]} />
              <Text style={[styles.pulseText, theme.fonts.labelSmall, { color: theme.colors.safe }]}>SYSTEM LIVE</Text>
            </View>
          </View>
        </Card>

        {/* Threat Status */}
        <Text style={[styles.sectionTitle, theme.fonts.h3, { color: theme.colors.textPrimary, marginTop: 16 }]}>Threat Status</Text>
        <View style={styles.statusGrid}>
          <View style={[styles.statCard, { backgroundColor: theme.colors.surfaceContainer, borderColor: theme.colors.outline }]}>
            <Text style={[styles.statLabel, theme.fonts.caption, { color: theme.colors.textMuted }]}>Total Scans</Text>
            <Text style={[styles.statValue, theme.fonts.h2, { color: theme.colors.textPrimary }]}>{scansHistory.length}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.safeContainer, borderColor: theme.colors.safeContainer }]}>
            <Text style={[styles.statLabel, theme.fonts.caption, { color: theme.colors.safe }]}>Safe</Text>
            <Text style={[styles.statValue, theme.fonts.h2, { color: theme.colors.safe }]}>{safeCount}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.warningContainer, borderColor: theme.colors.warningContainer }]}>
            <Text style={[styles.statLabel, theme.fonts.caption, { color: theme.colors.warning }]}>Suspicious</Text>
            <Text style={[styles.statValue, theme.fonts.h2, { color: theme.colors.warning }]}>{suspiciousCount}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.dangerContainer, borderColor: theme.colors.dangerContainer }]}>
            <Text style={[styles.statLabel, theme.fonts.caption, { color: theme.colors.danger }]}>Danger</Text>
            <Text style={[styles.statValue, theme.fonts.h2, { color: theme.colors.danger }]}>{highRisk}</Text>
          </View>
        </View>

        {/* SOS & Quick Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            onPress={handleSOS}
            style={[styles.sosTile, { backgroundColor: theme.colors.dangerContainer }]}
          >
            <MaterialCommunityIcons name="alert-circle" size={28} color={theme.colors.danger} />
            <Text style={[styles.sosLabel, theme.fonts.bodySmall, { color: theme.colors.danger }]}>SOS · 1930</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleQuickAction('scan')}
            style={[styles.actionTile, { backgroundColor: theme.colors.primaryContainer }]}
          >
            <MaterialCommunityIcons name="barcode-scan" size={28} color={theme.colors.primary} />
            <Text style={[styles.sosLabel, theme.fonts.bodySmall, { color: theme.colors.primary }]}>Quick Scan</Text>
          </TouchableOpacity>
        </View>

        {/* Scan Mix Chart */}
        <Text style={[styles.sectionTitle, theme.fonts.h3, { color: theme.colors.textPrimary, marginTop: 24 }]}>Scan Mix</Text>
        <Card padding={16} radius={16} elevation={2}>
          {scansHistory.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="chart-line" size={32} color={theme.colors.textMuted} style={styles.emptyIcon} />
              <Text style={[styles.emptyText, theme.fonts.bodySmall, { color: theme.colors.textSecondary }]}>No scans yet. Scan a message to build your mix.</Text>
            </View>
          ) : (
            <View style={styles.chartRows}>
              {[
                { label: 'Safe', count: safeCount, color: theme.colors.safe },
                { label: 'Suspicious', count: suspiciousCount, color: theme.colors.warning },
                { label: 'Danger', count: highRisk, color: theme.colors.danger },
              ].map((row) => (
                <View key={row.label} style={styles.chartRow}>
                  <View style={styles.chartLabelRow}>
                    <Text style={[styles.chartLabel, theme.fonts.bodyMedium, { color: theme.colors.textPrimary }]}>{row.label}</Text>
                    <Text style={[styles.chartCount, theme.fonts.caption, { color: row.color }]}>{row.count}</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { backgroundColor: row.color, width: scansHistory.length > 0 ? `${Math.round((row.count / scansHistory.length) * 100)}%` : '0%' }]} />
                  </View>
                </View>
              ))}
            </View>
          )}
        </Card>

        {/* Link Verification History */}
        <Text style={[styles.sectionTitle, theme.fonts.h3, { color: theme.colors.textPrimary, marginTop: 24 }]}>Link Verification History ({linkHistory.length})</Text>
        {linkHistory.length === 0 ? (
          <Card padding={24} radius={16} elevation={2}>
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="link" size={32} color={theme.colors.textMuted} style={styles.emptyIcon} />
              <Text style={[styles.emptyText, theme.fonts.bodySmall, { color: theme.colors.textSecondary }]}>No links verified yet. Go to Scan → Verify a Link.</Text>
            </View>
          </Card>
        ) : (
          <View style={styles.historyList}>
            {linkHistory.map((item) => {
              const risk = getRiskProps(item.riskScore);
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.8}
                  onPress={() => Alert.alert(`Link Verdict (${item.riskScore}/100)`, `Original: ${item.originalUrl}\n${item.expandedUrl ? `Destination: ${item.expandedUrl}\n` : ''}Domain: ${item.domain ?? 'N/A'}\nTime: ${item.timestamp}\n\nReasons: ${item.reasons.join(', ') || 'None'}`)}
                  style={[styles.historyCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}
                >
                  <View style={styles.historyCardHeader}>
                    <Text style={[styles.historyTime, theme.fonts.caption, { color: theme.colors.textMuted }]}>🕒 {item.timestamp}</Text>
                    <StatusBadge label={item.verdict.toUpperCase()} variant={item.verdict === 'danger' ? 'coral' : item.verdict === 'suspicious' ? 'amber' : 'emerald'} />
                  </View>
                  <View style={[styles.historyTextContainer, { backgroundColor: theme.colors.surfaceContainer, borderRadius: 8, padding: 8, marginTop: 6 }]}>
                    <Text numberOfLines={1} style={[styles.historyText, theme.fonts.bodyMedium, { color: theme.colors.textPrimary }]}>{item.originalUrl}</Text>
                    {item.expandedUrl && (
                      <Text numberOfLines={1} style={[styles.historyText, theme.fonts.bodySmall, { color: theme.colors.textSecondary }]}>→ {item.expandedUrl}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* SMS History */}
        <Text style={[styles.sectionTitle, theme.fonts.h3, { color: theme.colors.textPrimary, marginTop: 24 }]}>SMS Scan History ({smsHistory.length})</Text>
        {smsHistory.length === 0 ? (
          <Card padding={24} radius={16} elevation={2}>
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="message" size={32} color={theme.colors.textMuted} style={styles.emptyIcon} />
              <Text style={[styles.emptyText, theme.fonts.bodySmall, { color: theme.colors.textSecondary }]}>No SMS scanned yet. Scan an SMS in the Scanner tab.</Text>
            </View>
          </Card>
        ) : (
          <View style={styles.historyList}>
            {smsHistory.map((item) => {
              const risk = getRiskProps(item.score);
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.8}
                  onPress={() => Alert.alert(`SMS Verdict (${item.score}/100)`, `From: ${item.sender}\nTime: ${item.timestamp}\n\nMessage: "${item.text}"\n\nType: ${item.type}\nRisk Flags: ${item.indicators.join(', ')}`)}
                  style={[styles.historyCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}
                >
                  <View style={styles.historyCardHeader}>
                    <Text style={[styles.historyTime, theme.fonts.caption, { color: theme.colors.textMuted }]}>🕒 {item.timestamp}</Text>
                    <StatusBadge label={item.level.toUpperCase()} variant={item.level === 'danger' ? 'coral' : item.level === 'suspicious' ? 'amber' : 'emerald'} />
                  </View>
                  <View style={[styles.historyTextContainer, { backgroundColor: theme.colors.surfaceContainer, borderRadius: 8, padding: 8, marginTop: 6 }]}>
                    <Text numberOfLines={2} style={[styles.historyText, theme.fonts.bodyMedium, { color: theme.colors.textPrimary }]}>{item.sender}: {item.text}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontWeight: '700', marginBottom: 12 },
  bannerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bannerLeft: { flex: 1 },
  welcomeText: { fontSize: 24, fontWeight: '800', marginBottom: 6 },
  subText: { lineHeight: 18 },
  bannerRightBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  pulseCircle: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  pulseText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  statCard: { padding: 16, borderRadius: 16, alignItems: 'center' },
  statLabel: { fontSize: 11, fontWeight: '700', marginBottom: 6, letterSpacing: 0.5 },
  statValue: { fontSize: 24, fontWeight: '800' },
  statusGrid: { flexDirection: 'row', gap: 10 },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  sosTile: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center' },
  actionTile: { flex: 1, padding: 16, borderRadius: 16, alignItems: 'center' },
  sosLabel: { marginTop: 6, fontSize: 12, fontWeight: '700' },
  chartRows: { marginTop: 12 },
  chartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  chartLabelRow: { flexDirection: 'row', alignItems: 'center' },
  chartLabel: { fontSize: 13, fontWeight: '700' },
  chartCount: { fontSize: 13, fontWeight: '800', marginLeft: 6 },
  progressBarBg: { height: 8, borderRadius: 4, overflow: 'hidden', width: '50%' },
  progressBarFill: { height: '100%', borderRadius: 4 },
  emptyState: { alignItems: 'center', paddingVertical: 30 },
  emptyIcon: { marginBottom: 10 },
  emptyText: { textAlign: 'center', lineHeight: 18 },
  historyList: { marginTop: 8 },
  historyCard: { borderWidth: 1, borderRadius: 12, padding: 14, marginVertical: 6 },
  historyCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  historyTime: { fontSize: 11, fontWeight: '600' },
  historyTextContainer: { backgroundColor: '#334155', borderRadius: 8, padding: 8, marginTop: 6 },
  historyText: { lineHeight: 20, flex: 1 },
});
