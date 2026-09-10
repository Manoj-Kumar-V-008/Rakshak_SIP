import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { AppTheme } from '../../theme';
import { CustomButton } from '../../components/common/CustomButton';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import { OnboardingStackParamList } from '../../navigation/types';

type NavigationProp = StackNavigationProp<OnboardingStackParamList, 'Welcome'>;

export const OnboardingScreenOne: React.FC = () => {
  const theme = useTheme() as AppTheme;
  const navigation = useNavigation<NavigationProp>();

  const handleNext = () => {
    navigation.navigate('PermissionsSetup');
  };

  const handleSkip = () => {
    navigation.navigate('UserProfileSetup');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Top Navigation Skip Link (5% real estate) */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={[styles.skipText, theme.fonts.bodySmall, { color: theme.colors.textSecondary }]}>
            Skip
          </Text>
        </TouchableOpacity>
      </View>

      {/* Security Illustration / Graphic (45% real estate) */}
      <View style={styles.graphicContainer}>
        <View style={[styles.graphicBg, { backgroundColor: theme.colors.surfaceContainer }]}>
          <MaterialCommunityIcons name="security" size={120} color={theme.colors.primary} />
          <Text style={[styles.graphicLabel, theme.fonts.caption, { color: theme.colors.textSecondary }]}>
            RAKSHAK ACTIVE PROTECTION
          </Text>
        </View>
      </View>

      {/* Text Group / Value Proposition (25% real estate) */}
      <View style={styles.textContainer}>
        <Text style={[styles.title, theme.fonts.h1, { color: theme.colors.textPrimary }]}>
          Guard Against Digital Fraud
        </Text>
        <Text style={[styles.description, theme.fonts.bodyMedium, { color: theme.colors.textSecondary }]}>
          Protect yourself and your loved ones from OTP frauds, digital arrest scams, phishing, and fake investment traps.
        </Text>
      </View>

      {/* Progress Dots Indicator (5% real estate) */}
      <View style={styles.progressContainer}>
        <View style={[styles.dot, styles.activeDot, { backgroundColor: theme.colors.primary }]} />
        <View style={[styles.dot, { backgroundColor: theme.colors.outline }]} />
        <View style={[styles.dot, { backgroundColor: theme.colors.outline }]} />
      </View>

      {/* Primary Action Button (20% real estate) */}
      <View style={styles.buttonContainer}>
        <CustomButton
          title="Get Started"
          onPress={handleNext}
          variant="primary"
          style={styles.ctaButton}
        />
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
    height: '5%',
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  skipText: {
    fontWeight: '600',
  },
  graphicContainer: {
    height: '45%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  graphicBg: {
    width: '100%',
    height: 240,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  graphicLabel: {
    marginTop: 16,
    letterSpacing: 1,
    fontWeight: '700',
  },
  textContainer: {
    height: '25%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: 12,
  },
  description: {
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  progressContainer: {
    height: '5%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24, // Expanded shape for current step
  },
  buttonContainer: {
    height: '20%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaButton: {
    width: '100%',
  },
});
