import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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

// --- SKELETON KNOWLEDGE TAB ---
const KnowledgePlaceholder = () => (
  <View style={[styles.placeholder, { backgroundColor: '#0B0F19' }]}>
    <Ionicons name="book-outline" size={48} color="#3F8CFF" />
    <Text style={[styles.placeholderText, { color: '#F8FAFC', marginTop: 12 }]}>Scam Knowledge Hub</Text>
    <Text style={[styles.placeholderSub, { color: '#94A3B8', marginTop: 6 }]}>Categories and prevention quizzes coming in Phase C.</Text>
  </View>
);

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
        component={KnowledgePlaceholder} 
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

// Root Router Entry
export const NavigationRouter = () => {
  const theme = useTheme() as AppTheme;
  return (
    <RootStack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <RootStack.Screen name="Splash" component={SplashScreen} />
      <RootStack.Screen name="Onboarding" component={OnboardingNavigator} />
      <RootStack.Screen name="App" component={AppNavigator} />
      <RootStack.Screen name="ScamAnalysisResult" component={ScamAnalysisResultScreen} />
    </RootStack.Navigator>
  );
};

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  placeholderSub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
});
export default NavigationRouter;
