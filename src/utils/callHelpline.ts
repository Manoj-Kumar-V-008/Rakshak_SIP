import { Alert, Linking } from 'react-native';

// Direct-dial without a canOpenURL gate: the gate false-negatives on some
// Android builds/Expo Go. If dialing truly fails, the number stays visible.
export const callCybercrimeHelpline = async (): Promise<void> => {
  try {
    await Linking.openURL('tel:1930');
  } catch {
    Alert.alert('Dial 1930 manually', 'National Cyber Crime Helpline: 1930. Auto-dial was blocked on this device, so please dial the number yourself.');
  }
};
