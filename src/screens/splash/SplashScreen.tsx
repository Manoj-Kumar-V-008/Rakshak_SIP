import React, { useEffect } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useConfigStore } from '../../store/useConfigStore';
import { AppTheme } from '../../theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const SplashScreen: React.FC = () => {
  const theme = useTheme() as AppTheme;
  const navigation = useNavigation();
  const onboardingCompleted = useConfigStore((state) => state.profile.onboardingCompleted);

  useEffect(() => {
    // Simulate initial loading (state hydration check, loading assets)
    const initializeApp = setTimeout(() => {
      if (onboardingCompleted) {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'App' }],
          })
        );
      } else {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Onboarding' }],
          })
        );
      }
    }, 1500); // 1.5 seconds loading time for visual transition

    return () => clearTimeout(initializeApp);
  }, [onboardingCompleted, navigation]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Visual Logo Group (20% real estate) */}
      <View style={styles.logoGroup}>
        <View style={[styles.logoIconBg, { backgroundColor: theme.colors.surfaceContainer }]}>
          <MaterialCommunityIcons name="shield-check" size={72} color={theme.colors.primary} />
        </View>
      </View>

      {/* App Branding & Tagline (10% real estate) */}
      <View style={styles.brandGroup}>
        <Text style={[styles.brandText, theme.fonts.display, { color: theme.colors.textPrimary }]}>
          RAKSHAK AI
        </Text>
        <Text style={[styles.taglineText, theme.fonts.bodySmall, { color: theme.colors.textSecondary }]}>
          Your Intelligent Guardian Against Digital Fraud
        </Text>
      </View>

      {/* Activity Indicator (10% real estate) */}
      <View style={styles.indicatorGroup}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>

      {/* Security Tagline / Footnote (50% real estate) */}
      <View style={styles.footnoteGroup}>
        <View style={[styles.badgeContainer, { backgroundColor: theme.colors.surfaceContainer }]}>
          <MaterialCommunityIcons name="lock-outline" size={14} color={theme.colors.safe} />
          <Text style={[styles.footnoteText, theme.fonts.caption, { color: theme.colors.textSecondary }]}>
            100% SECURE ON-DEVICE AI PROTECTION
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logoGroup: {
    height: '20%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  logoIconBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandGroup: {
    height: '10%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  brandText: {
    letterSpacing: 2,
    fontWeight: '700',
  },
  taglineText: {
    marginTop: 4,
    textAlign: 'center',
  },
  indicatorGroup: {
    height: '10%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footnoteGroup: {
    height: '50%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 24,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  footnoteText: {
    marginLeft: 6,
    letterSpacing: 0.5,
    fontWeight: '600',
  },
});
