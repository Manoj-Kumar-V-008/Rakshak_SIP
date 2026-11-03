import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { AppTheme } from '../theme';

import { RootStackParamList, OnboardingStackParamList, AppTabParamList } from './types';
import { SplashScreen } from '../screens/splash/SplashScreen';
import { OnboardingScreen } from '../screens/onboarding/OnboardingScreen';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { ScannerScreen } from '../screens/scanner/ScannerScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { ScamAnalysisResultScreen } from '../screens/analysis/ScamAnalysisResultScreen';
import { AdminSettingsScreen } from '../screens/settings/AdminSettingsScreen';
import { VoiceScannerScreen } from '../screens/scanner/VoiceScannerScreen';
import { SMSScreen } from '../screens/scanner/SMSScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { AuthProvider, useAuth } from '../context/AuthContext';

// --- NAVIGATOR CREATIONS ---
const RootStack = createStackNavigator<RootStackParamList>();
const OnboardingStack = createStackNavigator<OnboardingStackParamList>();
const AppTabs = createBottomTabNavigator<AppTabParamList>();

// Onboarding Nav Flow
const OnboardingNavigator = () => {
  const theme = useTheme() as AppTheme;
  return (
    <OnboardingStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <OnboardingStack.Screen name="Welcome" component={OnboardingScreen} />
    </OnboardingStack.Navigator>
  );
};

// Main App Bottom Tab Nav Flow
const AppNavigator = () => {
  const theme = useTheme() as AppTheme;

  return (
    <AppTabs.Navigator
      initialRouteName="HomeTab"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home-outline';

          if (route.name === 'HomeTab') {
            iconName = 'home-outline';
          } else if (route.name === 'ScannerTab') {
            iconName = 'scan-outline';
          } else if (route.name === 'KnowledgeTab') {
            iconName = 'book-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: theme.fonts.labelSmall,
      })}
    >
      <AppTabs.Screen
        name="HomeTab"
        component={DashboardScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <AppTabs.Screen
        name="ScannerTab"
        component={ScannerScreen}
        options={{ tabBarLabel: 'Scan' }}
      />
      <AppTabs.Screen
        name="KnowledgeTab"
        component={DashboardScreen}
        options={{ tabBarLabel: 'Learn' }}
      />
      <AppTabs.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Settings' }}
      />
    </AppTabs.Navigator>
  );
};

// Auth Stack (Login / Register)
const AuthStackNavigator = () => {
  const theme = useTheme() as AppTheme;
  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <RootStack.Screen name="Login" component={LoginScreen} />
      <RootStack.Screen name="Register" component={RegisterScreen} />
    </RootStack.Navigator>
  );
};

// Root Router Entry
export const NavigationRouter = () => {
  const theme = useTheme() as AppTheme;
  const { isLoading, isAuthenticated } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setReady(true);
    }
  }, [isLoading]);

  // While hydrating auth state, show splash.
  if (!ready) {
    return (
      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <RootStack.Screen name="Splash" component={SplashScreen} />
      </RootStack.Navigator>
    );
  }

  return (
    <AuthProvider>
      <RootStack.Navigator
        initialRouteName={isAuthenticated ? 'App' : 'Login'}
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <RootStack.Screen name="Splash" component={SplashScreen} />
        <RootStack.Screen name="Onboarding" component={OnboardingNavigator} />
        {isAuthenticated ? (
          <>
            <RootStack.Screen name="App" component={AppNavigator} />
            <RootStack.Screen name="ScamAnalysisResult" component={ScamAnalysisResultScreen} />
            <RootStack.Screen name="VoiceScanner" component={VoiceScannerScreen} />
            <RootStack.Screen name="SMSScreen" component={SMSScreen} />
            <RootStack.Screen name="AdminSettings" component={AdminSettingsScreen} />
          </>
        ) : (
          <>
            <RootStack.Screen name="Login" component={LoginScreen} />
            <RootStack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </RootStack.Navigator>
    </AuthProvider>
  );
};

export default NavigationRouter;
