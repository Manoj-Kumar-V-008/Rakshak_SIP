import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppTheme } from '../../theme';
import { Header } from '../../components/common/Header';
import { CustomButton } from '../../components/common/CustomButton';
import { SCAM_LIBRARY } from '../../data/scamLibrary';
import { callCybercrimeHelpline } from '../../utils/callHelpline';

export const LearnScreen: React.FC = () => {
  const theme = useTheme() as AppTheme;
  const navigation = useNavigation();
  const [openId, setOpenId] = useState<string | null>('digital_arrest');

  const callHelpline = callCybercrimeHelpline;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header title="Scam Knowledge Hub" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.helper, theme.fonts.bodySmall, { color: theme.colors.textSecondary }]}>
          The same 9 fraud types the scanner detects. Open one, learn its red flags, then test its sample in the Scanner.
        </Text>
        {SCAM_LIBRARY.map((entry) => {
          const open = openId === entry.id;
          return (
            <View key={entry.id} style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>
              <TouchableOpacity onPress={() => setOpenId(open ? null : entry.id)} style={styles.cardHeader}>
                <MaterialCommunityIcons name="shield-alert-outline" size={22} color={theme.colors.warning} style={styles.cardIcon} />
                <Text style={[styles.cardTitle, theme.fonts.bodyLarge, { color: theme.colors.textPrimary }]}>{entry.title}</Text>
                <MaterialCommunityIcons name={open ? 'chevron-down' : 'chevron-right'} size={22} color={theme.colors.textMuted} />
              </TouchableOpacity>
              {open && (
                <View style={styles.cardBody}>
                  <Text style={[styles.bodyText, theme.fonts.bodySmall, { color: theme.colors.textSecondary }]}>{entry.howItWorks}</Text>
                  <Text style={[styles.subHead, theme.fonts.labelLarge, { color: theme.colors.danger }]}>Red flags</Text>
                  {entry.redFlags.map((flag) => (
                    <View key={flag} style={styles.row}><Text style={styles.bullet}>•</Text><Text style={[styles.rowText, theme.fonts.bodySmall, { color: theme.colors.textSecondary }]}>{flag}</Text></View>
                  ))}
                  <Text style={[styles.subHead, theme.fonts.labelLarge, { color: theme.colors.safe }]}>Protect yourself</Text>
                  {entry.tips.map((tip) => (
                    <View key={tip} style={styles.row}><Text style={styles.bullet}>•</Text><Text style={[styles.rowText, theme.fonts.bodySmall, { color: theme.colors.textSecondary }]}>{tip}</Text></View>
                  ))}
                  <View style={[styles.sampleBox, { backgroundColor: theme.colors.surfaceContainer }]}>
                    <Text style={[theme.fonts.caption, { color: theme.colors.textMuted }]}>REALISTIC SAMPLE (paste in Scanner)</Text>
                    <Text style={[styles.sampleText, theme.fonts.bodySmall, { color: theme.colors.textPrimary }]}>{entry.sample}</Text>
                  </View>
                  <CustomButton
                    title="Open Scanner"
                    onPress={() => (navigation.navigate as (name: string) => void)('ScannerTab')}
                    variant="outline"
                    style={styles.scannerButton}
                  />
                </View>
              )}
            </View>
          );
        })}
        <CustomButton title="Call Cybercrime Helpline · 1930" onPress={callHelpline} variant="danger" style={styles.helplineButton} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  helper: { lineHeight: 18, marginBottom: 16 },
  card: { borderWidth: 1.5, borderRadius: 14, marginBottom: 12, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  cardIcon: { marginRight: 10 },
  cardTitle: { fontWeight: '700', flex: 1 },
  cardBody: { paddingHorizontal: 14, paddingBottom: 14 },
  bodyText: { lineHeight: 19, marginBottom: 10 },
  subHead: { fontWeight: '800', marginTop: 8, marginBottom: 4 },
  row: { flexDirection: 'row', marginVertical: 2, paddingRight: 8 },
  bullet: { color: '#94A3B8', marginRight: 8, fontWeight: '800' },
  rowText: { lineHeight: 19, flex: 1 },
  sampleBox: { borderRadius: 10, padding: 10, marginTop: 10 },
  sampleText: { lineHeight: 19, marginTop: 4 },
  scannerButton: { width: '100%', marginTop: 10 },
  helplineButton: { width: '100%', marginTop: 12 },
});

export default LearnScreen;
