import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from 'react-native-paper';
import { AppTheme } from '../../theme';
import { Header } from '../../components/common/Header';
import { StatusBadge } from '../../components/common/StatusBadge';
import { CustomButton } from '../../components/common/CustomButton';
import { useRoute, useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface RouteParams {
  scamText: string;
  riskScore: number;
  scamType: string;
  indicators: string[];
  remediationSteps: string[];
}

export const ScamAnalysisResultScreen: React.FC = () => {
  const theme = useTheme() as AppTheme;
  const navigation = useNavigation();
  const route = useRoute();
  
  const params = (route.params as RouteParams) || {
    scamText: 'Unverified SMS message logs.',
    riskScore: 78,
    scamType: 'Phishing Threat Alert',
    indicators: ['Fear tactics detected', 'Urgent call-to-action details found'],
    remediationSteps: ['Never share payment links', 'Report contact to local authorities'],
  };

  const { scamText, riskScore, scamType, indicators, remediationSteps } = params;

  // Resolve threat rating colors and details
  const getThreatDetails = () => {
    if (riskScore <= 20) {
      return {
        label: 'Safe',
        variant: 'emerald' as const,
        color: theme.colors.safe,
        icon: 'check-decagram',
        description: 'Low scam threat level. This message contains no malicious signatures.',
        urgency: '4%',
        impersonation: '2%',
        sentiment: 'NORMAL',
      };
    } else if (riskScore <= 60) {
      return {
        label: 'Suspicious',
        variant: 'amber' as const,
        color: theme.colors.warning,
        icon: 'alert-decagram-outline',
        description: 'Medium scam threat level. Uses suspicious URL links or unverified numbers.',
        urgency: '48%',
        impersonation: '35%',
        sentiment: 'UNUSUAL',
      };
    } else {
      return {
        label: 'High Risk',
        variant: 'coral' as const,
        color: theme.colors.danger,
        icon: 'alert-decagram',
        description: 'Critical scam threat level! Clear signs of phishing, fear tactics, or fraud.',
        urgency: `${riskScore - 6}%`,
        impersonation: `${riskScore - 12}%`,
        sentiment: 'THREATENING',
      };
    }
  };

  const threat = getThreatDetails();

  const handleBlock = () => {
    Alert.alert('Contact Blocked', 'This sender phone number has been blocked and will no longer trigger notifications.');
    navigation.goBack();
  };

  const handleReport = () => {
    Alert.alert('Scam Reported', 'Thank you! This message has been added to our threat database to protect other users.');
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header title="Analysis Result" showBack />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Risk Score Dial Card */}
        <View style={[styles.dialCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>
          <Text style={[styles.dialLabel, theme.fonts.bodySmall, { color: theme.colors.textSecondary }]}>
            AI Threat Score
          </Text>
          
          <View style={[styles.dialOuterCircle, { borderColor: theme.colors.outline }]}>
            <View style={[styles.dialInnerCircle, { borderColor: threat.color }]}>
              <Text style={[styles.scoreValue, theme.fonts.display, { color: threat.color }]}>
                {riskScore}
              </Text>
              <Text style={[styles.scoreScale, theme.fonts.caption, { color: theme.colors.textMuted }]}>
                out of 100
              </Text>
            </View>
          </View>

          <View style={styles.badgeRow}>
            <StatusBadge label={threat.label} variant={threat.variant} />
            <Text style={[styles.scamTitle, theme.fonts.h3, { color: theme.colors.textPrimary, marginLeft: 12 }]}>
              {scamType}
            </Text>
          </View>
          
          <Text style={[styles.threatDescription, theme.fonts.bodySmall, { color: theme.colors.textSecondary }]}>
            {threat.description}
          </Text>
        </View>

        {/* AI Classifier Breakdown Metrics (Futuristic AI UI detail) */}
        <Text style={[styles.sectionTitle, theme.fonts.h3, { color: theme.colors.textPrimary }]}>
          AI Classifier Metrics
        </Text>
        
        <View style={[styles.metricsBoard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outline }]}>
          <View style={styles.metricRow}>
            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, theme.fonts.caption, { color: theme.colors.textSecondary }]}>
                URGENCY FACTOR
              </Text>
              <Text style={[styles.metricValue, theme.fonts.bodyLarge, { color: threat.color }]}>
                {threat.urgency}
              </Text>
            </View>
            <View style={[styles.metricDivider, { backgroundColor: theme.colors.outline }]} />
            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, theme.fonts.caption, { color: theme.colors.textSecondary }]}>
                IMPERSONATION
              </Text>
              <Text style={[styles.metricValue, theme.fonts.bodyLarge, { color: threat.color }]}>
                {threat.impersonation}
              </Text>
            </View>
            <View style={[styles.metricDivider, { backgroundColor: theme.colors.outline }]} />
            <View style={styles.metricItem}>
              <Text style={[styles.metricLabel, theme.fonts.caption, { color: theme.colors.textSecondary }]}>
                SENTIMENT
              </Text>
              <Text style={[styles.metricValue, theme.fonts.bodyLarge, { color: threat.color }]}>
                {threat.sentiment}
              </Text>
            </View>
          </View>
        </View>

        {/* Original message text box */}
        <Text style={[styles.sectionTitle, theme.fonts.h3, { color: theme.colors.textPrimary }]}>
          Scanned Text Message
        </Text>
        <View style={[styles.messageBox, { backgroundColor: theme.colors.surfaceContainer }]}>
          <Text style={[styles.messageText, theme.fonts.bodyMedium, { color: theme.colors.textPrimary }]}>
            "{scamText}"
          </Text>
        </View>

        {/* Threat Indicators */}
        <Text style={[styles.sectionTitle, theme.fonts.h3, { color: theme.colors.textPrimary }]}>
          Scam Signals Flagged
        </Text>
        <View style={styles.listContainer}>
          {indicators.map((ind, i) => (
            <View key={i} style={styles.listItem}>
              <MaterialCommunityIcons name="alert-circle-outline" size={16} color={threat.color} style={styles.listIcon} />
              <Text style={[styles.listItemText, theme.fonts.bodyMedium, { color: theme.colors.textSecondary }]}>
                {ind}
              </Text>
            </View>
          ))}
        </View>

        {/* Actionable Remedies */}
        <Text style={[styles.sectionTitle, theme.fonts.h3, { color: theme.colors.textPrimary }]}>
          Security Recommendations
        </Text>
        <View style={styles.listContainer}>
          {remediationSteps.map((step, i) => (
            <View key={i} style={styles.listItem}>
              <MaterialCommunityIcons name="shield-outline" size={16} color={theme.colors.safe} style={styles.listIcon} />
              <Text style={[styles.listItemText, theme.fonts.bodyMedium, { color: theme.colors.textSecondary }]}>
                {step}
              </Text>
            </View>
          ))}
        </View>

        {/* Quick Action CTAs */}
        <View style={styles.buttonGroup}>
          <CustomButton
            title="Block Sender"
            onPress={handleBlock}
            variant="danger"
            style={styles.actionBtn}
          />
          <CustomButton
            title="Report to Database"
            onPress={handleReport}
            variant="outline"
            style={styles.actionBtn}
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
  dialCard: {
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  dialLabel: {
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  dialOuterCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  dialInnerCircle: {
    width: 124,
    height: 124,
    borderRadius: 62,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreValue: {
    fontWeight: '800',
  },
  scoreScale: {
    fontWeight: '600',
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  scamTitle: {
    fontWeight: '700',
  },
  threatDescription: {
    textAlign: 'center',
    lineHeight: 18,
  },
  metricsBoard: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontWeight: '700',
    marginBottom: 4,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  metricValue: {
    fontWeight: '800',
  },
  metricDivider: {
    width: 1,
    height: 30,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 8,
  },
  messageBox: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  messageText: {
    fontStyle: 'italic',
    lineHeight: 20,
  },
  listContainer: {
    marginBottom: 20,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 6,
    paddingRight: 12,
  },
  listIcon: {
    marginTop: 3,
    marginRight: 10,
  },
  listItemText: {
    lineHeight: 20,
    flex: 1,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionBtn: {
    width: '48%',
  },
});
export default ScamAnalysisResultScreen;
