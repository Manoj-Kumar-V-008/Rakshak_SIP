import {
  AndroidImportance,
  NotificationPermissionsStatus,
  getDevicePushTokenAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  scheduleNotificationAsync,
  setNotificationChannelAsync,
  setNotificationHandler,
} from 'expo-notifications';
import { Platform } from 'react-native';
import { useConfigStore } from '../../store/useConfigStore';

const CHANNEL_ID = 'rakshak-scam-alerts';

/**
 * Initialize push notifications for Rakshak AI.
 * Call this once on app launch (e.g., from SplashScreen).
 * Returns the Expo push token if registration succeeds.
 */
export const setupPushNotifications = async (): Promise<string | null> => {
  // Configure notification handler for foreground notifications.
  setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  // Create notification channel on Android.
  if (Platform.OS === 'android') {
    await setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Rakshak Scam Alerts',
      importance: AndroidImportance.HIGH,
      description: 'Real-time alerts when a scam link, SMS, or message is detected.',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#EF4444',
      sound: 'default',
      enableVibrate: true,
      bypassDnd: false,
      enableLights: true,
      lockscreenVisibility: 1,
      showBadge: true,
    });
  }

  const existingPermission = await getPermissionsAsync();
  let permissionStatus: NotificationPermissionsStatus = existingPermission;

  if (existingPermission.status !== 'granted') {
    permissionStatus = await requestPermissionsAsync();
  }

  if (permissionStatus.status !== 'granted') {
    return null;
  }

  try {
    const token = await getDevicePushTokenAsync();
    useConfigStore.getState().setPushToken(token.data);
    return token.data;
  } catch (error) {
    console.warn('Failed to get push token:', error);
    return null;
  }
};

/**
 * Check whether notifications are currently enabled.
 */
export const areNotificationsEnabled = async (): Promise<boolean> => {
  const status = await getPermissionsAsync();
  return status.status === 'granted';
};

/**
 * Request notification permissions from the user.
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  const status = await requestPermissionsAsync();
  return status.status === 'granted';
};

/**
 * Send a local scam alert notification.
 * Use this when a link, SMS, or message is detected as dangerous.
 */
export const sendScamAlert = async ({
  title,
  body,
  data,
}: {
  title: string;
  body: string;
  data?: Record<string, string>;
}) => {
  await scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { type: 'scam_alert', ...data },
      sound: true,
      vibrate: [0, 250, 250, 250],
      priority: 'high',
    },
    trigger: null, // Immediate delivery.
  });
};
