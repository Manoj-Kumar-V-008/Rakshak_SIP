import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { AppTheme } from '../../theme';
import { CustomButton } from '../../components/common/CustomButton';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { OnboardingStackParamList } from '../../navigation/types';
import { useConfigStore } from '../../store/useConfigStore';

type NavigationProp = StackNavigationProp<OnboardingStackParamList, 'PermissionsSetup'>;

export const OnboardingScreenTwo: React.FC = () => {
  const theme = useTheme() as AppTheme;
  const navigation = useNavigation<NavigationProp>();
  const updateProfile = useConfigStore((state) => state.updateProfile);

  const [smsGranted, setSmsGranted] = useState(false);
  const [notificationGranted, setNotificationGranted] = useState(false);

  const requestSmsPermission = () => {
    // Simulate OS-level permission request with custom explanation alert
    Alert.alert(
      'SMS Protection',
      'Rakshak AI requires SMS access to read incoming texts and alert you of OTP scam indicators. No data leaves your device.',
      [
        {
          text: 'Deny',
          style: 'cancel',
        },
        {
          text: 'Allow',
          onPress: () => {
            setSmsGranted(true);
            updateProfile({ smsTrackingAllowed: true });
          },
        },
      ]
    );
  };

  const requestNotificationPermission = () => {
    Alert.alert(
      'Notification Alerts',
      'Rakshak AI requires notification access to immediately warn you if a suspicious message arrives.',
      [
        {
          text: 'Deny',
          style: 'cancel',
        },
        {
          text: 'Allow',
          onPress: () => setNotificationGranted(true),
        },
      ]
    );
  };

  const handleNext = () => {
    navigation.navigate('UserProfileSetup');
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Verification?',
      'Without SMS and notification permissions, Rakshak AI cannot scan incoming alerts automatically. You will need to check messages manually.',
      [
        { text: 'Go Back', style: 'cancel' },
        { text: 'Skip Anyway', onPress: () => navigation.navigate('UserProfileSetup') },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Title Header (10% real estate) */}
      <View style={styles.header}>
        <Text style={[styles.title, theme.fonts.h2, { color: theme.colors.textPrimary }]}>
          Device Security Setup
        </Text>
      </View>

      {/* SMS Access Card (20% real estate) */}
      <TouchableOpacity
        onPress={requestSmsPermission}
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: smsGranted ? theme.colors.safe : theme.colors.outline,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons
            name="message-text-outline"
            size={24}
            color={smsGranted ? theme.colors.safe : theme.colors.primary}
          />
          <Text style={[styles.cardTitle, theme.fonts.h3, { color: theme.colors.textPrimary }]}>
            SMS Scam Shield
          </Text>
          <MaterialCommunityIcons
            name={smsGranted ? 'checkbox-marked-circle' : 'circle-outline'}
            size={20}
            color={smsGranted ? theme.colors.safe : theme.colors.textMuted}
            style={styles.checkIcon}
          />
        </View>
        <Text style={[styles.cardText, theme.fonts.bodySmall, { color: theme.colors.textSecondary }]}>
          Scans incoming SMS texts in real-time to alert you of UPI, OTP, and lottery fraud messages.
        </Text>
      </TouchableOpacity>

      {/* Notification Access Card (20% real estate) */}
      <TouchableOpacity
        onPress={requestNotificationPermission}
        style={[
          styles.card,
          {
            backgroundColor: theme.colors.surface,
            borderColor: notificationGranted ? theme.colors.safe : theme.colors.outline,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons
            name="bell-ring-outline"
            size={24}
            color={notificationGranted ? theme.colors.safe : theme.colors.primary}
          />
          <Text style={[styles.cardTitle, theme.fonts.h3, { color: theme.colors.textPrimary }]}>
            Real-Time Alert Center
          </Text>
          <MaterialCommunityIcons
            name={notificationGranted ? 'checkbox-marked-circle' : 'circle-outline'}
            size={20}
            color={notificationGranted ? theme.colors.safe : theme.colors.textMuted}
            style={styles.checkIcon}
          />
        </View>
        <Text style={[styles.cardText, theme.fonts.bodySmall, { color: theme.colors.textSecondary }]}>
          Monitors warnings to stop active scam attempts (such as financial fraud and sextortion threats).
        </Text>
      </TouchableOpacity>

      {/* Privacy Assurance Box (20% real estate) */}
      <View style={[styles.privacyBox, { backgroundColor: theme.colors.surfaceContainer }]}>
        <MaterialCommunityIcons name="shield-key" size={28} color={theme.colors.safe} />
        <View style={styles.privacyTextGroup}>
          <Text style={[styles.privacyTitle, theme.fonts.bodyLarge, { color: theme.colors.textPrimary }]}>
            Privacy Shield Active
          </Text>
          <Text style={[styles.privacyText, theme.fonts.bodySmall, { color: theme.colors.textSecondary }]}>
            All scans happen locally on-device. Your text messages never leave your phone.
          </Text>
        </View>
      </View>

      {/* Buttons Group (30% real estate split into CTA and skip links) */}
      <View style={styles.footer}>
        <CustomButton
          title={smsGranted && notificationGranted ? 'Continue' : 'Grant Permissions'}
          onPress={smsGranted && notificationGranted ? handleNext : () => {
            if (!smsGranted) requestSmsPermission();
            else if (!notificationGranted) requestNotificationPermission();
          }}
          variant="primary"
          style={styles.ctaButton}
        />
        <TouchableOpacity onPress={handleSkip} style={styles.skipLink}>
          <Text style={[styles.skipLinkText, theme.fonts.bodyMedium, { color: theme.colors.textSecondary }]}>
            Maybe Later
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  header: {
    height: '10%',
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: {
    fontWeight: '700',
  },
  card: {
    height: '20%',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'center',
    marginVertical: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
  },
  cardText: {
    lineHeight: 18,
  },
  checkIcon: {
    alignSelf: 'center',
  },
  privacyBox: {
    height: '20%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginVertical: 12,
  },
  privacyTextGroup: {
    flex: 1,
    marginLeft: 16,
  },
  privacyTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  privacyText: {
    lineHeight: 16,
  },
  footer: {
    height: '30%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaButton: {
    width: '100%',
  },
  skipLink: {
    marginTop: 12,
    paddingVertical: 8,
  },
  skipLinkText: {
    fontWeight: '600',
  },
});
