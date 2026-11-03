import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import { AppTheme } from '../../theme';
import { Header } from '../../components/common/Header';
import { CustomButton } from '../../components/common/CustomButton';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useConfigStore } from '../../store/useConfigStore';
import { useAuth } from '../../context/AuthContext';
import { t } from '../../locales';

export const RegisterScreen: React.FC = () => {
  const theme = useTheme() as AppTheme;
  const navigation = useNavigation() as any;
  const { register } = useAuth();
  const backendUrl = useConfigStore((state) => state.backendUrl);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const emailVal = email.trim();
    const passwordVal = password.trim();
    const confirmVal = confirmPassword.trim();
    const nameVal = name.trim();

    if (!emailVal || !passwordVal || !confirmVal) {
      Alert.alert(t('common.ok'), 'Please fill in all required fields.');
      return;
    }
    if (passwordVal !== confirmVal) {
      Alert.alert('Registration failed', 'Passwords do not match.');
      return;
    }
    if (passwordVal.length < 6) {
      Alert.alert('Registration failed', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailVal,
          password: passwordVal,
          name: nameVal || undefined,
          preferredLanguage: 'en',
        }),
      });
      if (!response.ok) {
        const detail = (await response.json().catch(() => ({}))).detail || 'Registration failed.';
        Alert.alert('Registration failed', detail);
        return;
      }
      const data = await response.json();
      await register(data.access_token, {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name ?? undefined,
        preferredLanguage: data.user.preferredLanguage,
      });
      navigation.reset({
        index: 0,
        routes: [{ name: 'App' }],
      });
    } catch (error) {
      Alert.alert('Registration failed', error instanceof Error ? error.message : 'Network error.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = () => {
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header title={t('profile.title')} showBack />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.brandGroup}>
            <MaterialCommunityIcons name="account-plus" size={64} color={theme.colors.primary} style={styles.icon} />
            <Text style={[styles.appName, theme.fonts.display, { color: theme.colors.textPrimary }]}>Create Account</Text>
            <Text style={[styles.tagline, theme.fonts.bodySmall, { color: theme.colors.textSecondary }]}>
              Join Rakshak AI to protect your devices and sync scam reports.
            </Text>
          </View>

          <View style={[styles.inputContainer, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface }]}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Full name (optional)"
              placeholderTextColor={theme.colors.textMuted}
              style={[styles.input, theme.fonts.bodyMedium, { color: theme.colors.textPrimary }]}
              editable={!loading}
            />
          </View>

          <View style={[styles.inputContainer, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface, marginTop: 12 }]}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email address"
              placeholderTextColor={theme.colors.textMuted}
              style={[styles.input, theme.fonts.bodyMedium, { color: theme.colors.textPrimary }]}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />
          </View>

          <View style={[styles.inputContainer, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface, marginTop: 12 }]}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={theme.colors.textMuted}
              style={[styles.input, theme.fonts.bodyMedium, { color: theme.colors.textPrimary }]}
              secureTextEntry
              editable={!loading}
            />
          </View>

          <View style={[styles.inputContainer, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface, marginTop: 12 }]}>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm password"
              placeholderTextColor={theme.colors.textMuted}
              style={[styles.input, theme.fonts.bodyMedium, { color: theme.colors.textPrimary }]}
              secureTextEntry
              editable={!loading}
            />
          </View>

          <CustomButton
            title={loading ? 'Creating account…' : 'Create Account'}
            onPress={handleRegister}
            variant="primary"
            disabled={loading || !email.trim() || !password.trim() || !confirmPassword.trim()}
            style={styles.ctaButton}
          />

          <View style={styles.dividerRow}>
            <Text style={[styles.dividerText, theme.fonts.caption, { color: theme.colors.textMuted }]}>Or</Text>
          </View>

          <CustomButton
            title="Already have an account? Sign in"
            onPress={handleGoToLogin}
            variant="outline"
            disabled={loading}
            style={styles.ctaButton}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  brandGroup: { alignItems: 'center', marginTop: 20, marginBottom: 30 },
  icon: { marginBottom: 12 },
  appName: { letterSpacing: 2, marginBottom: 4 },
  tagline: { textAlign: 'center', lineHeight: 18 },
  inputContainer: { borderWidth: 1.5, borderRadius: 16, padding: 12, minHeight: 56, marginBottom: 12 },
  input: { flex: 1, fontSize: 15, lineHeight: 20 },
  ctaButton: { width: '100%', marginTop: 8 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  dividerText: { flex: 1, borderBottomWidth: 1, borderColor: '#2A3654', marginRight: 8 },
});
