import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useTheme } from 'react-native-paper';
import { AppTheme } from '../../theme';
import { CustomButton } from '../../components/common/CustomButton';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useConfigStore } from '../../store/useConfigStore';
import { useNavigation, CommonActions } from '@react-navigation/native';

type LanguageType = 'en' | 'hi' | 'ta' | 'te';

interface LanguageOption {
  label: string;
  nativeLabel: string;
  code: LanguageType;
}

export const OnboardingScreenThree: React.FC = () => {
  const theme = useTheme() as AppTheme;
  const navigation = useNavigation();
  const completeOnboarding = useConfigStore((state) => state.completeOnboarding);

  const [name, setName] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageType>('en');

  const languages: LanguageOption[] = [
    { label: 'English', nativeLabel: 'English', code: 'en' },
    { label: 'Hindi', nativeLabel: 'हिन्दी', code: 'hi' },
    { label: 'Tamil', nativeLabel: 'தமிழ்', code: 'ta' },
    { label: 'Telugu', nativeLabel: 'తెలుగు', code: 'te' },
  ];

  const handleComplete = () => {
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      Alert.alert('Invalid Name', 'Please enter your first name (minimum 2 characters) to personalize your protection.');
      return;
    }
    
    // Updates Zustand and triggers RootNavigator re-evaluation
    completeOnboarding(trimmedName, selectedLanguage);

    // Reset Root navigation stack to 'App'
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'App' }],
      })
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContainer, { backgroundColor: theme.colors.background }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Section (10% real estate) */}
        <View style={styles.header}>
          <Text style={[styles.title, theme.fonts.h2, { color: theme.colors.textPrimary }]}>
            Personalize Shield
          </Text>
          <Text style={[styles.subtitle, theme.fonts.bodySmall, { color: theme.colors.textSecondary }]}>
            Set your preferences to activate protection.
          </Text>
        </View>

        {/* Input Name field (20% real estate) */}
        <View style={styles.formSection}>
          <Text style={[styles.label, theme.fonts.bodyLarge, { color: theme.colors.textPrimary }]}>
            Your First Name
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Manoj"
            placeholderTextColor={theme.colors.textMuted}
            style={[
              styles.input,
              {
                borderColor: name.trim().length >= 2 ? theme.colors.safe : theme.colors.outline,
                color: theme.colors.textPrimary,
                backgroundColor: theme.colors.surface,
                borderRadius: theme.borderRadius.medium,
              },
            ]}
            maxLength={20}
          />
        </View>

        {/* Language Selection Grid (25% real estate) */}
        <View style={styles.languageSection}>
          <Text style={[styles.label, theme.fonts.bodyLarge, { color: theme.colors.textPrimary }]}>
            Preferred Language
          </Text>
          <View style={styles.languageGrid}>
            {languages.map((item) => {
              const isSelected = selectedLanguage === item.code;
              return (
                <TouchableOpacity
                  key={item.code}
                  onPress={() => setSelectedLanguage(item.code)}
                  style={[
                    styles.langTile,
                    {
                      backgroundColor: isSelected ? theme.colors.primaryContainer : theme.colors.surface,
                      borderColor: isSelected ? theme.colors.primary : theme.colors.outline,
                      borderRadius: theme.borderRadius.medium,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.langLabel,
                      theme.fonts.bodyLarge,
                      { color: isSelected ? theme.colors.primary : theme.colors.textPrimary },
                    ]}
                  >
                    {item.nativeLabel}
                  </Text>
                  <Text
                    style={[
                      styles.langSubLabel,
                      theme.fonts.caption,
                      { color: isSelected ? theme.colors.primary : theme.colors.textSecondary },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Storage Note (20% real estate) */}
        <View style={styles.noteSection}>
          <View style={[styles.infoCard, { backgroundColor: theme.colors.surfaceContainer }]}>
            <MaterialCommunityIcons name="folder-lock-outline" size={20} color={theme.colors.primary} />
            <Text style={[styles.infoText, theme.fonts.caption, { color: theme.colors.textSecondary }]}>
              Your preferences and scan logs are encrypted and stored locally on your device storage.
            </Text>
          </View>
        </View>

        {/* Action Button Section (25% real estate) */}
        <View style={styles.buttonSection}>
          <CustomButton
            title="Complete Setup & Activate"
            onPress={handleComplete}
            variant="primary"
            style={styles.completeButton}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  header: {
    height: 80,
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 4,
  },
  formSection: {
    height: 100,
    justifyContent: 'center',
    marginBottom: 20,
  },
  label: {
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 52,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  languageSection: {
    height: 160,
    justifyContent: 'center',
    marginBottom: 20,
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  langTile: {
    width: '48%',
    height: 64,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 6,
  },
  langLabel: {
    fontWeight: '600',
  },
  langSubLabel: {
    marginTop: 2,
  },
  noteSection: {
    height: 90,
    justifyContent: 'center',
    marginBottom: 20,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    lineHeight: 16,
  },
  buttonSection: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 16,
  },
  completeButton: {
    width: '100%',
  },
});
