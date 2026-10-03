import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { AppTheme } from '../../theme';
import { Header } from '../../components/common/Header';
import { CustomButton } from '../../components/common/CustomButton';
import { useConfigStore } from '../../store/useConfigStore';
import { checkHealth, fetchRules } from '../../services/api/scamService';
import { getRulesVersion, isUsingRemoteRules, setRemoteRules } from '../../services/engine/localEngine';
import { setGeminiKey } from '../../services/ai/geminiClient';

export const AdminSettingsScreen: React.FC = () => {
  const theme = useTheme() as AppTheme;
  const navigation = useNavigation();
  const { backendUrl, engineMode, setBackendUrl, setEngineMode } = useConfigStore((state) => ({ backendUrl: state.backendUrl, engineMode: state.engineMode, setBackendUrl: state.setBackendUrl, setEngineMode: state.setEngineMode }));
  const [url, setUrl] = useState(backendUrl);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [rulesStatus, setRulesStatus] = useState<string | null>(null);
  const [refreshingRules, setRefreshingRules] = useState(false);
  const [geminiKey, setGeminiKeyInput] = useState('');
  const [geminiStatus, setGeminiStatus] = useState<string | null>(null);

  const save = () => {
    if (!/^https?:\/\/[^\s]+$/i.test(url.trim())) {
      Alert.alert('Invalid backend URL', 'Enter a full HTTP URL, for example http://192.168.1.23:8000.');
      return;
    }
    setBackendUrl(url);
    setStatus('Saved. This URL will be used for the next scan.');
  };

  const testConnection = async () => {
    if (!/^https?:\/\/[^\s]+$/i.test(url.trim())) {
      Alert.alert('Invalid backend URL', 'Enter a full HTTP URL before testing.');
      return;
    }
    setTesting(true);
    setStatus(null);
    try {
      const health = await checkHealth(url);
      setBackendUrl(url);
      setStatus(`Connected · ${health.engine} · rules v${health.rulesVersion}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to test the connection.');
    } finally { setTesting(false); }
  };

  return <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
    <Header title="Demo Connection" showBack />
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={[styles.heading, theme.fonts.h3, { color: theme.colors.textPrimary }]}>Backend URL</Text>
      <Text style={[styles.helper, theme.fonts.bodySmall, { color: theme.colors.textSecondary }]}>For a physical phone, use your laptop’s Wi-Fi or hotspot IPv4 address and port 8000.</Text>
      <TextInput value={url} onChangeText={setUrl} autoCapitalize="none" autoCorrect={false} keyboardType="url" placeholder="http://192.168.1.23:8000" placeholderTextColor={theme.colors.textMuted} style={[styles.input, theme.fonts.bodyMedium, { color: theme.colors.textPrimary, borderColor: theme.colors.outline, backgroundColor: theme.colors.surface }]} />
      <CustomButton title="Save backend URL" onPress={save} variant="outline" style={styles.button} />
      <CustomButton title="Test connection" onPress={testConnection} loading={testing} variant="primary" style={styles.button} />
      {status && <View style={[styles.statusCard, { backgroundColor: theme.colors.surfaceContainer, borderColor: status.startsWith('Connected') || status.startsWith('Saved') ? theme.colors.safe : theme.colors.warning }]}><Text style={[theme.fonts.bodySmall, { color: theme.colors.textPrimary }]}>{status}</Text></View>}

      <Text style={[styles.heading, theme.fonts.h3, { color: theme.colors.textPrimary }]}>Engine mode</Text>
      <TouchableOpacity onPress={() => setEngineMode('auto')} style={[styles.modeCard, { borderColor: engineMode === 'auto' ? theme.colors.primary : theme.colors.outline, backgroundColor: theme.colors.surface }]}><Text style={[theme.fonts.bodyLarge, { color: theme.colors.textPrimary, fontWeight: '700' }]}>Auto (recommended)</Text><Text style={[theme.fonts.bodySmall, { color: theme.colors.textSecondary }]}>Use the FastAPI server, then fall back to on-device rules if it is unreachable.</Text></TouchableOpacity>
      <TouchableOpacity onPress={() => setEngineMode('offline')} style={[styles.modeCard, { borderColor: engineMode === 'offline' ? theme.colors.primary : theme.colors.outline, backgroundColor: theme.colors.surface }]}><Text style={[theme.fonts.bodyLarge, { color: theme.colors.textPrimary, fontWeight: '700' }]}>Force offline</Text><Text style={[theme.fonts.bodySmall, { color: theme.colors.textSecondary }]}>Use only the on-device rules engine. Useful for demonstrating the fallback.</Text></TouchableOpacity>
      <Text style={[styles.heading, theme.fonts.h3, { color: theme.colors.textPrimary }]}>Threat rules (P2 OTA)</Text>
      <Text style={[styles.helper, theme.fonts.bodySmall, { color: theme.colors.textSecondary }]}>Offline engine rules v{getRulesVersion()} ({isUsingRemoteRules() ? 'remote' : 'bundled'}). Server mode always uses live server rules.</Text>
      <CustomButton
        title="Refresh rules from server"
        onPress={() => {
          setRefreshingRules(true);
          setRulesStatus(null);
          fetchRules()
            .then((remote) => {
              const version = setRemoteRules(remote);
              setRulesStatus(`Updated to rules v${version}. Offline scans now use them.`);
            })
            .catch((error) => setRulesStatus(error instanceof Error ? error.message : 'Refresh failed.'))
            .finally(() => setRefreshingRules(false));
        }}
        loading={refreshingRules}
        variant="outline"
        style={styles.button}
      />
      {rulesStatus && <View style={[styles.statusCard, { backgroundColor: theme.colors.surfaceContainer, borderColor: theme.colors.outline }]}><Text style={[theme.fonts.bodySmall, { color: theme.colors.textPrimary }]}>{rulesStatus}</Text></View>}
      <Text style={[styles.heading, theme.fonts.h3, { color: theme.colors.textPrimary }]}>Gemini explainer (opt-in)</Text>
      <Text style={[styles.helper, theme.fonts.bodySmall, { color: theme.colors.textSecondary }]}>Off by default. Saved in SecureStore. The result screen sends text to Google only when you tap Explain.</Text>
      <TextInput value={geminiKey} onChangeText={setGeminiKeyInput} autoCapitalize="none" autoCorrect={false} secureTextEntry placeholder="Paste Gemini API key (blank to remove)" placeholderTextColor={theme.colors.textMuted} style={[styles.input, theme.fonts.bodyMedium, { color: theme.colors.textPrimary, borderColor: theme.colors.outline, backgroundColor: theme.colors.surface }]} />
      <CustomButton
        title="Save Gemini key"
        onPress={() => {
          setGeminiKey(geminiKey)
            .then(() => {
              setGeminiStatus(geminiKey.trim() ? 'Saved in SecureStore.' : 'Removed.');
              setGeminiKeyInput('');
            })
            .catch((error) => setGeminiStatus(error instanceof Error ? error.message : 'Save failed.'));
        }}
        variant="outline"
        style={styles.button}
      />
      {geminiStatus && <View style={[styles.statusCard, { backgroundColor: theme.colors.surfaceContainer, borderColor: theme.colors.outline }]}><Text style={[theme.fonts.bodySmall, { color: theme.colors.textPrimary }]}>{geminiStatus}</Text></View>}
      <CustomButton title="Done" onPress={() => navigation.goBack()} variant="success" style={styles.doneButton} />
    </ScrollView>
  </View>;
};

const styles = StyleSheet.create({ container: { flex: 1 }, content: { padding: 20, paddingBottom: 40 }, heading: { fontWeight: '700', marginBottom: 6, marginTop: 8 }, helper: { lineHeight: 18, marginBottom: 14 }, input: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, minHeight: 50 }, button: { width: '100%', marginTop: 8 }, statusCard: { borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 12 }, modeCard: { borderWidth: 1.5, borderRadius: 14, padding: 14, marginTop: 10, gap: 5 }, doneButton: { width: '100%', marginTop: 18 } });
export default AdminSettingsScreen;
