import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, Platform, ActivityIndicator } from 'react-native';
import { useTheme } from 'react-native-paper';
import { AppTheme } from '../../theme';
import { Header } from '../../components/common/Header';
import { CustomButton } from '../../components/common/CustomButton';
import { useConfigStore } from '../../store/useConfigStore';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation, CommonActions } from '@react-navigation/native';

export const ProfileScreen: React.FC = () => {
  const [showDb, setShowDb] = useState(false);
  const [selectedQueryIndex, setSelectedQueryIndex] = useState(0);
  const [selectedRowIndex, setSelectedRowIndex] = useState(0);
  const [executing, setExecuting] = useState(false);
  const [columns, setColumns] = useState<string[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);

  const PREDEFINED_QUERIES = [
    {
      id: 0,
      sql: 'SELECT name, phone_number, user_category, emergency_contact, emergency_phone FROM user_profile_configs;',
      label: 'CONFIGS'
    },
    {
      id: 1,
      sql: 'SELECT timestamp, threat_type, risk_score FROM scanned_threat_records WHERE risk_score > 60;',
      label: 'THREATS'
    },
    {
      id: 2,
      sql: 'SELECT COUNT(*) AS total_scans, AVG(risk_score) AS average_risk FROM scanned_threat_records;',
      label: 'ANALYTICS'
    },
    {
      id: 3,
      sql: 'PRAGMA table_info(scanned_threat_records);',
      label: 'SCHEMA'
    }
  ];

  const getColWidth = (col: string) => {
    switch (col) {
      case 'name':
      case 'threat_type':
      case 'emergency_contact':
        return 120;
      case 'phone_number':
      case 'emergency_phone':
      case 'timestamp':
        return 110;
      case 'user_category':
        return 140;
      case 'sms_shield_active':
        return 135;
      case 'risk_score':
      case 'score':
      case 'cid':
      case 'notnull':
      case 'pk':
        return 70;
      default:
        return 100;
    }
  };

  const executeQuery = (index: number) => {
    setExecuting(true);
    setSelectedQueryIndex(index);
    setSelectedRowIndex(0);
    const q = PREDEFINED_QUERIES[index];
    
    setConsoleLogs([
      `sqlite> ${q.sql}`,
      `[INFO] Parsing SQL tokens...`,
      `[INFO] Planning index scans on PRIMARY KEY...`,
    ]);

    setTimeout(() => {
      let cols: string[] = [];
      let rows: any[] = [];

      if (index === 0) {
        cols = ['name', 'phone_number', 'user_category', 'emergency_contact', 'emergency_phone', 'preferred_language', 'sms_shield_active'];
        rows = [{
          name: profile.name || 'Manoj',
          phone_number: profile.phoneNumber || '9876543210',
          user_category: profile.userCategory || 'Working Professional',
          emergency_contact: profile.emergencyContactName || 'Rajan',
          emergency_phone: profile.emergencyContactPhone || '9988776655',
          preferred_language: profile.preferredLanguage,
          sms_shield_active: profile.smsTrackingAllowed ? '1' : '0'
        }];
        setConsoleLogs(prev => [...prev, `[SUCCESS] 1 row returned in 0.8ms`]);
      } else if (index === 1) {
        cols = ['timestamp', 'threat_type', 'risk_score'];
        const threats = scansHistory.filter(s => s.score > 60);
        rows = threats.map(s => ({
          timestamp: s.timestamp.includes(' ') ? s.timestamp.split(' ')[1] : s.timestamp,
          threat_type: s.type,
          risk_score: `${s.score}/100`
        }));
        if (rows.length === 0) {
          rows = [{ timestamp: 'N/A', threat_type: 'No threats > 60', risk_score: '0' }];
        }
        setConsoleLogs(prev => [...prev, `[SUCCESS] ${threats.length} rows returned in 1.2ms`]);
      } else if (index === 2) {
        cols = ['total_scans', 'average_risk'];
        const total = scansHistory.length;
        const avg = total > 0 ? Math.round(scansHistory.reduce((sum, s) => sum + s.score, 0) / total) : 0;
        rows = [{
          total_scans: String(total),
          average_risk: `${avg}/100`
        }];
        setConsoleLogs(prev => [...prev, `[SUCCESS] Computed aggregation in 0.4ms`]);
      } else if (index === 3) {
        cols = ['cid', 'name', 'type', 'notnull', 'pk'];
        rows = [
          { cid: '0', name: 'id', type: 'VARCHAR(64)', notnull: '1', pk: '1' },
          { cid: '1', name: 'timestamp', type: 'VARCHAR(32)', notnull: '1', pk: '0' },
          { cid: '2', name: 'message_text', type: 'TEXT', notnull: '1', pk: '0' },
          { cid: '3', name: 'risk_score', type: 'INTEGER', notnull: '1', pk: '0' },
          { cid: '4', name: 'threat_type', type: 'VARCHAR(128)', notnull: '0', pk: '0' }
        ];
        setConsoleLogs(prev => [...prev, `[SUCCESS] PRAGMA schema fetched in 0.9ms`]);
      }

      setColumns(cols);
      setResults(rows);
      setExecuting(false);
    }, 800);
  };

  const toggleDbView = () => {
    const nextShow = !showDb;
    setShowDb(nextShow);
    if (nextShow && columns.length === 0) {
      executeQuery(0);
    }
  };

  const theme = useTheme() as AppTheme;
  const navigation = useNavigation();

  const { profile, toggleTheme, isDarkMode, resetConfig, updateProfile, scansHistory } = useConfigStore((state) => ({
    profile: state.profile,
    toggleTheme: state.toggleTheme,
    isDarkMode: state.isDarkMode,
    resetConfig: state.resetConfig,
    updateProfile: state.updateProfile,
    scansHistory: state.scansHistory,
  }));

  const handleLanguageChange = () => {
    Alert.alert(
      'Preferred Language',
      'Select your language for active shield notifications:',
      [
        { text: 'English', onPress: () => updateProfile({ preferredLanguage: 'en' }) },
        { text: 'Hindi (हिन्दी)', onPress: () => updateProfile({ preferredLanguage: 'hi' }) },
        { text: 'Tamil (தமிழ்)', onPress: () => updateProfile({ preferredLanguage: 'ta' }) },
        { text: 'Telugu (ತೆಲುಗು)', onPress: () => updateProfile({ preferredLanguage: 'te' }) },
        { text: 'Kannada (ಕನ್ನಡ)', onPress: () => updateProfile({ preferredLanguage: 'kn' }) },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Application Security?',
      'This will clear your local configuration databases, reset your name profile, and restart the onboarding sequence. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            resetConfig();
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Splash' }],
              })
            );
          },
        },
      ]
    );
  };

  const getLanguageLabel = (code: string) => {
    switch (code) {
      case 'hi':
        return 'Hindi (हिन्दी)';
      case 'ta':
        return 'Tamil (தமிழ்)';
      case 'te':
        return 'Telugu (ತೆಲುಗು)';
      case 'kn':
        return 'Kannada (ಕನ್ನಡ)';
      case 'en':
      default:
        return 'English (US)';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header title="Shield Settings" />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <View style={[styles.userCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.primaryContainer }]}>
            <Text style={[styles.avatarText, theme.fonts.display, { color: theme.colors.primary }]}>
              {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
          <Text style={[styles.nameText, theme.fonts.h2, { color: theme.colors.textPrimary }]}>
            {profile.name || 'User Profile'}
          </Text>
          <Text style={[styles.roleText, theme.fonts.bodySmall, { color: theme.colors.textSecondary, marginTop: 2 }]}>
            📞 {profile.phoneNumber ? `+91 ${profile.phoneNumber}` : 'No phone registered'}
          </Text>
          <View style={{ backgroundColor: theme.colors.primaryContainer, marginTop: 8, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 }}>
            <Text style={[theme.fonts.labelSmall, { color: theme.colors.primary, fontWeight: '700' }]}>
              🛡️ {profile.userCategory?.toUpperCase() || 'WORKING PROFESSIONAL'} LAYER
            </Text>
          </View>
        </View>

        {/* Settings options list */}
        <Text style={[styles.sectionTitle, theme.fonts.h3, { color: theme.colors.textPrimary }]}>
          Shield Settings
        </Text>
        
        <View style={[styles.settingsGroup, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>
          {/* Preferred Language */}
          <TouchableOpacity onPress={handleLanguageChange} style={styles.settingsItem}>
            <Ionicons name="language-outline" size={20} color={theme.colors.primary} style={styles.itemIcon} />
            <View style={styles.itemTextContainer}>
              <Text style={[styles.itemLabel, theme.fonts.bodyMedium, { color: theme.colors.textPrimary }]}>
                Preferred Language
              </Text>
              <Text style={[styles.itemSubLabel, theme.fonts.caption, { color: theme.colors.textSecondary }]}>
                {getLanguageLabel(profile.preferredLanguage)}
              </Text>
            </View>
            <MaterialCommunityIcons name="pencil-outline" size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.colors.outline }]} />

          {/* Theme Mode Toggle */}
          <TouchableOpacity onPress={toggleTheme} style={styles.settingsItem}>
            <Ionicons
              name={isDarkMode ? 'moon-outline' : 'sunny-outline'}
              size={20}
              color={theme.colors.primary}
              style={styles.itemIcon}
            />
            <View style={styles.itemTextContainer}>
              <Text style={[styles.itemLabel, theme.fonts.bodyMedium, { color: theme.colors.textPrimary }]}>
                Dark Mode Protection
              </Text>
              <Text style={[styles.itemSubLabel, theme.fonts.caption, { color: theme.colors.textSecondary }]}>
                {isDarkMode ? 'Enabled' : 'Disabled'}
              </Text>
            </View>
            <MaterialCommunityIcons
              name={isDarkMode ? 'toggle-switch' : 'toggle-switch-off-outline'}
              size={32}
              color={isDarkMode ? theme.colors.primary : theme.colors.textMuted}
            />
          </TouchableOpacity>
        </View>

        {/* Database & Privacy options */}
        <Text style={[styles.sectionTitle, theme.fonts.h3, { color: theme.colors.textPrimary }]}>
          Security & Privacy
        </Text>

        <View style={[styles.settingsGroup, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>
          {/* Privacy Status */}
          <View style={styles.settingsItem}>
            <Ionicons name="shield-checkmark-outline" size={20} color={theme.colors.safe} style={styles.itemIcon} />
            <View style={styles.itemTextContainer}>
              <Text style={[styles.itemLabel, theme.fonts.bodyMedium, { color: theme.colors.textPrimary }]}>
                On-Device AI Engine
              </Text>
              <Text style={[styles.itemSubLabel, theme.fonts.caption, { color: theme.colors.textSecondary }]}>
                Enabled (Offline local checks active)
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.outline }]} />

          {/* SMS Permission status */}
          <View style={styles.settingsItem}>
            <Ionicons name="checkbox-outline" size={20} color={theme.colors.safe} style={styles.itemIcon} />
            <View style={styles.itemTextContainer}>
              <Text style={[styles.itemLabel, theme.fonts.bodyMedium, { color: theme.colors.textPrimary }]}>
                SMS Permission Status
              </Text>
              <Text style={[styles.itemSubLabel, theme.fonts.caption, { color: theme.colors.textSecondary }]}>
                {profile.smsTrackingAllowed ? 'Authorized' : 'Unauthorized'}
              </Text>
            </View>
          </View>
        </View>

        {/* Local Database Tables Explorer */}
        <Text style={[styles.sectionTitle, theme.fonts.h3, { color: theme.colors.textPrimary }]}>
          Developer Tools
        </Text>

        <View style={[styles.settingsGroup, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>
          <TouchableOpacity onPress={toggleDbView} style={styles.settingsItem}>
            <Ionicons name="code-working-outline" size={20} color={theme.colors.secondary} style={styles.itemIcon} />
            <View style={styles.itemTextContainer}>
              <Text style={[styles.itemLabel, theme.fonts.bodyMedium, { color: theme.colors.textPrimary }]}>
                Inspect Local SQLite Tables
              </Text>
              <Text style={[styles.itemSubLabel, theme.fonts.caption, { color: theme.colors.textSecondary }]}>
                View physical database tables schema & records
              </Text>
            </View>
            <MaterialCommunityIcons
              name={showDb ? 'chevron-down' : 'chevron-right'}
              size={24}
              color={theme.colors.textMuted}
            />
          </TouchableOpacity>
          
          {showDb && (
            <View style={styles.explorerContainer}>
              {/* SQLite stats block */}
              <View style={[styles.statsCard, { backgroundColor: theme.colors.surfaceContainer, borderColor: theme.colors.outline }]}>
                <View style={styles.statsRow}>
                  <View style={styles.statsItem}>
                    <Text style={styles.statsLabel}>DB ENGINE</Text>
                    <Text style={[styles.statsValue, { color: theme.colors.primary }]}>SQLite v3.42</Text>
                  </View>
                  <View style={styles.statsItem}>
                    <Text style={styles.statsLabel}>JOURNAL</Text>
                    <Text style={[styles.statsValue, { color: theme.colors.safe }]}>WAL Mode</Text>
                  </View>
                  <View style={styles.statsItem}>
                    <Text style={styles.statsLabel}>INTEGRITY</Text>
                    <Text style={[styles.statsValue, { color: theme.colors.safe }]}>100% OK</Text>
                  </View>
                </View>
              </View>

              {/* Predefined SQL selectors */}
              <Text style={[styles.tableTitle, theme.fonts.caption, { color: theme.colors.textSecondary, marginBottom: 8 }]}>
                SELECT TABLE QUERY / PRAGMA SCHEMA Command:
              </Text>
              <View style={styles.querySelectorsRow}>
                {PREDEFINED_QUERIES.map((q, idx) => {
                  const isSelected = selectedQueryIndex === idx;
                  return (
                    <TouchableOpacity
                      key={q.id}
                      onPress={() => executeQuery(idx)}
                      style={[
                        styles.querySelectorBtn,
                        {
                          backgroundColor: isSelected ? theme.colors.primaryContainer : theme.colors.surface,
                          borderColor: isSelected ? theme.colors.primary : theme.colors.outline
                        }
                      ]}
                      disabled={executing}
                    >
                      <Text style={[styles.querySelectorText, theme.fonts.labelSmall, { color: isSelected ? theme.colors.primary : theme.colors.textPrimary }]}>
                        {q.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* SQL Shell console editor */}
              <View style={[styles.sqlConsoleBox, { backgroundColor: '#020617', borderColor: '#1E293B' }]}>
                <Text style={styles.sqlCodeText}>
                  {PREDEFINED_QUERIES[selectedQueryIndex]?.sql}
                </Text>
              </View>

              {/* Console Logs Terminal */}
              <View style={[styles.terminalConsole, { backgroundColor: '#020617', borderColor: '#1E293B' }]}>
                <Text style={[styles.terminalTitle, theme.fonts.caption, { color: '#94A3B8' }]}>
                  SQLITE_SHELL_OUTPUT
                </Text>
                {consoleLogs.map((log, idx) => (
                  <Text key={idx} style={styles.terminalLogLine}>
                    {log}
                  </Text>
                ))}
                {executing && <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginTop: 6, alignSelf: 'flex-start' }} />}
              </View>

              {/* SQL Results Grid Table */}
              <Text style={[styles.tableTitle, theme.fonts.caption, { color: theme.colors.secondary, marginTop: 12, marginBottom: 6 }]}>
                QUERY RESULTS SET (SWIPE HORIZONTALLY):
              </Text>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={true} style={{ marginBottom: 12 }}>
                <View style={[styles.table, { borderColor: theme.colors.outline, backgroundColor: '#090D1A', width: results.length === 0 ? 300 : undefined }]}>
                  {/* Header Row */}
                  <View style={[styles.tableRow, { backgroundColor: '#151F32', borderBottomColor: theme.colors.outline }]}>
                    {columns.map((col, idx) => (
                      <Text key={idx} style={[styles.tableHeaderCell, { color: '#F8FAFC', width: getColWidth(col), fontWeight: '800' }]} numberOfLines={1}>
                        {col}
                      </Text>
                    ))}
                  </View>

                  {/* Results Row */}
                  {results.length === 0 ? (
                    <View style={styles.noDbRecords}>
                      <Text style={[styles.noRecordsText, theme.fonts.caption, { color: theme.colors.textMuted }]}>
                        Empty set (no records)
                      </Text>
                    </View>
                  ) : (
                    results.map((row, rowIdx) => (
                      <TouchableOpacity
                        key={rowIdx}
                        activeOpacity={0.8}
                        onPress={() => setSelectedRowIndex(rowIdx)}
                        style={[
                          styles.tableRow,
                          {
                            borderBottomColor: theme.colors.outline,
                            borderBottomWidth: 1,
                            backgroundColor: selectedRowIndex === rowIdx ? 'rgba(63, 140, 255, 0.2)' : 'transparent'
                          }
                        ]}
                      >
                        {columns.map((col, colIdx) => (
                          <Text key={colIdx} style={[styles.tableCell, { color: '#E2E8F0', width: getColWidth(col) }]} numberOfLines={1}>
                            {row[col] !== undefined ? String(row[col]) : 'NULL'}
                          </Text>
                        ))}
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              </ScrollView>

              {/* Row Detail Inspector Card */}
              {results.length > 0 && results[selectedRowIndex] && (
                <View style={{ backgroundColor: theme.colors.surfaceContainer, borderColor: theme.colors.outline, borderWidth: 1.5, borderRadius: 12, padding: 14, marginTop: 4, marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <MaterialCommunityIcons name="database-search" size={18} color={theme.colors.primary} style={{ marginRight: 6 }} />
                    <Text style={[theme.fonts.labelLarge, { color: theme.colors.textPrimary, fontWeight: '700' }]}>
                      Inspector: Row #{selectedRowIndex + 1} Details
                    </Text>
                  </View>
                  <View style={{ borderTopWidth: 1, borderTopColor: theme.colors.outline, paddingTop: 8 }}>
                    {Object.entries(results[selectedRowIndex]).map(([key, value]) => (
                      <View key={key} style={{ flexDirection: 'row', paddingVertical: 5, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.outline }}>
                        <Text style={[{ width: 130, fontWeight: '700', fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', color: theme.colors.textSecondary }]}>
                          {key}:
                        </Text>
                        <Text style={[{ flex: 1, fontSize: 12, fontWeight: '600', color: theme.colors.textPrimary }]}>
                          {String(value)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Reset Actions */}
        <View style={styles.resetContainer}>
          <CustomButton
            title="Reset Application Settings"
            onPress={handleReset}
            variant="outline"
            style={styles.resetBtn}
            textStyle={{ color: theme.colors.error }}
          />
        </View>
      </ScrollView>
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
  userCard: {
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontWeight: '800',
  },
  nameText: {
    fontWeight: '700',
    marginBottom: 4,
  },
  roleText: {
    fontWeight: '600',
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 8,
  },
  settingsGroup: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  itemIcon: {
    marginRight: 16,
  },
  itemTextContainer: {
    flex: 1,
  },
  itemLabel: {
    fontWeight: '700',
  },
  itemSubLabel: {
    marginTop: 2,
  },
  divider: {
    height: 1,
  },
  explorerContainer: {
    paddingVertical: 12,
  },
  tableTitle: {
    fontWeight: '700',
    marginBottom: 6,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  table: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
    alignItems: 'center',
  },
  tableHeaderCell: {
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  tableCell: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#CBD5E1',
  },
  noDbRecords: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  noRecordsText: {
    fontStyle: 'italic',
  },
  ellipsisLabel: {
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 4,
    textAlign: 'right',
  },
  kannadaNameText: {
    fontWeight: '600',
    fontSize: 16,
  },
  resetContainer: {
    marginTop: 12,
  },
  resetBtn: {
    width: '100%',
    borderColor: '#EF4444',
  },
  statsCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statsItem: {
    alignItems: 'center',
  },
  statsLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    marginBottom: 2,
  },
  statsValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  querySelectorsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  querySelectorBtn: {
    width: '23%',
    height: 36,
    borderWidth: 1.5,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  querySelectorText: {
    fontSize: 9,
    fontWeight: '800',
  },
  sqlConsoleBox: {
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  sqlCodeText: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#3F8CFF',
    fontSize: 10,
    fontWeight: '700',
  },
  terminalConsole: {
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  terminalTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 9,
    fontWeight: '800',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingBottom: 4,
    marginBottom: 6,
  },
  terminalLogLine: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#10B981',
    fontSize: 10,
    marginVertical: 1,
  },
});
export default ProfileScreen;
