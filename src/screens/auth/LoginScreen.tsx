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

export const LoginScreen: React.FC = () => {
  const theme = useTheme() as AppTheme;
  const navigation = useNavigation() as any;
  const { login } = useAuth();
  const backendUrl = useConfigStore((state) => state.backendUrl);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const emailVal = email.trim();
    const passwordVal = password.trim();
    if (!emailVal || !passwordVal) {
      Alert.alert(t('common.ok'), 'Please enter email and password.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailVal, password: passwordVal }),
      });
      if (!response.ok) {
        const detail = (await response.json().catch(() => ({}))).detail || 'Login failed.';
        Alert.alert('Login failed', detail);
        return;
      }
      const data = await response.json();
      await login(data.access_token, {
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
      Alert.alert('Login failed', error instanceof Error ? error.message : 'Network error.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToRegister = () => {
    navigation.navigate('Register');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header title={t('profile.title')} showBack />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.brandGroup}>
            <MaterialCommunityIcons name="shield-check" size={64} color={theme.colors.primary} style={styles.icon} />
            <Text style={[styles.appName, theme.fonts.display, { color: theme.colors.textPrimary }]}>RAKSHAK AI</Text>
            <Text style={[styles.tagline, theme.fonts.bodySmall, { color: theme.colors.textSecondary }]}>
              Sign in to protect your devices and sync your scam reports.
            </Text>
          </View>

          <View style={[styles.inputContainer, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surface }]}>
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

          <TouchableOpacity style={styles.forgotRow} onPress={() => Alert.alert('Forgot Password', 'Contact support to reset your password.')}>
            <Text style={[styles.forgotText, theme.fonts.bodySmall, { color: theme.colors.primary }]}>Forgot password?</Text>
          </TouchableOpacity>

          <CustomButton
            title={loading ? t('common.loggingIn') : 'Sign In'}
            onPress={handleLogin}
            variant="primary"
            disabled={loading || !email.trim() || !password.trim()}
            style={styles.ctaButton}
          />

          <View style={styles.dividerRow}>
            <Text style={[styles.dividerText, theme.fonts.caption, { color: theme.colors.textMuted }]}>Or</Text>
          </View>

          <CustomButton
            title="Create account"
            onPress={handleGoToRegister}
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
  forgotRow: { alignSelf: 'flex-end', marginRight: 16, marginTop: 4, marginBottom: 16 },
  forgotText: { fontSize: 12 },
  ctaButton: { width: '100%', marginTop: 8 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  dividerText: { flex: 1, borderBottomWidth: 1, borderColor: '#2A3654', marginRight: 8 },
});
