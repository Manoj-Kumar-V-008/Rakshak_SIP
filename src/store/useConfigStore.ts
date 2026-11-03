import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ScanRecord {
  id: string;
  timestamp: string;
  text: string;
  score: number;
  type: string;
  indicators: string[];
  remediationSteps: string[];
}

export interface LinkRecord {
  id: string;
  timestamp: string;
  originalUrl: string;
  expandedUrl: string | null;
  domain: string | null;
  verdict: 'safe' | 'suspicious' | 'danger';
  riskScore: number;
  reasons: string[];
}

export interface SmsRecord {
  id: string;
  timestamp: string;
  sender: string;
  text: string;
  score: number;
  level: 'safe' | 'suspicious' | 'danger';
  type: string;
  indicators: string[];
  remediationSteps: string[];
}

export interface UserProfile {
  name: string;
  isRegistered: boolean;
  onboardingCompleted: boolean;
  smsTrackingAllowed: boolean;
  preferredLanguage: 'en' | 'hi' | 'ta' | 'te' | 'kn';
  phoneNumber: string;
  userCategory: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
}

interface ConfigState {
  profile: UserProfile;
  appVersion: string;
  isDarkMode: boolean;
  scansHistory: ScanRecord[];
  linkHistory: LinkRecord[];
  smsHistory: SmsRecord[];
  backendUrl: string;
  engineMode: 'auto' | 'offline';
  pushToken: string | null;
  notificationEnabled: boolean;
  updateProfile: (profile: Partial<UserProfile>) => void;
  toggleTheme: () => void;
  setLanguage: (lang: 'en' | 'hi') => void;
  setPushToken: (token: string | null) => void;
  setNotificationEnabled: (enabled: boolean) => void;
  completeOnboarding: (
    name: string,
    language: 'en' | 'hi' | 'ta' | 'te' | 'kn',
    phoneNumber?: string,
    userCategory?: string,
    emergencyContactName?: string,
    emergencyContactPhone?: string
  ) => void;
  addScanRecord: (record: Omit<ScanRecord, 'id' | 'timestamp'>) => void;
  addLinkRecord: (record: Omit<LinkRecord, 'id' | 'timestamp'>) => void;
  addSmsRecord: (record: Omit<SmsRecord, 'id' | 'timestamp'>) => void;
  clearLinkHistory: () => void;
  clearSmsHistory: () => void;
  clearScanHistory: () => void;
  setBackendUrl: (url: string) => void;
  setEngineMode: (mode: 'auto' | 'offline') => void;
  resetConfig: () => void;
}

const initialProfile: UserProfile = {
  name: '',
  isRegistered: false,
  onboardingCompleted: false,
  smsTrackingAllowed: false,
  preferredLanguage: 'en',
  phoneNumber: '',
  userCategory: 'Working Professional',
  emergencyContactName: '',
  emergencyContactPhone: '',
};

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      profile: initialProfile,
      appVersion: '1.0.0',
      isDarkMode: true,
      scansHistory: [],
      linkHistory: [],
      smsHistory: [],
      backendUrl: process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000',
      engineMode: 'auto',
      pushToken: null,
      notificationEnabled: true,
      
      updateProfile: (profileUpdates) =>
        set((state) => ({
          profile: { ...state.profile, ...profileUpdates },
        })),
        
      toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  
      setLanguage: (lang: 'en' | 'hi') =>
        set((state) => ({
          profile: { ...state.profile, preferredLanguage: lang },
        })),
      
      setPushToken: (token: string | null) =>
        set({ pushToken: token }),
      
      setNotificationEnabled: (enabled: boolean) =>
        set({ notificationEnabled: enabled }),
      
      completeOnboarding: (name, language, phoneNumber, userCategory, emergencyContactName, emergencyContactPhone) =>
        set((state) => ({
          profile: {
            ...state.profile,
            name,
            preferredLanguage: language,
            phoneNumber: phoneNumber || '',
            userCategory: userCategory || 'Working Professional',
            emergencyContactName: emergencyContactName || '',
            emergencyContactPhone: emergencyContactPhone || '',
            onboardingCompleted: true,
            isRegistered: true,
          },
        })),
        
      addScanRecord: (record) =>
        set((state) => {
          const newRecord: ScanRecord = {
            ...record,
            id: Math.random().toString(36).substring(7),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          return {
            scansHistory: [newRecord, ...state.scansHistory],
          };
        }),
      
      addLinkRecord: (record: Omit<LinkRecord, 'id' | 'timestamp'>) =>
        set((state) => {
          const newRecord: LinkRecord = {
            ...record,
            id: Math.random().toString(36).substring(7),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          return {
            linkHistory: [newRecord, ...state.linkHistory],
          };
        }),
      
      addSmsRecord: (record: Omit<SmsRecord, 'id' | 'timestamp'>) =>
        set((state) => {
          const newRecord: SmsRecord = {
            ...record,
            id: Math.random().toString(36).substring(7),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };
          return {
            smsHistory: [newRecord, ...state.smsHistory],
          };
        }),
      
      clearSmsHistory: () => set({ smsHistory: [] }),
      clearLinkHistory: () => set({ linkHistory: [] }),
      clearScanHistory: () => set({ scansHistory: [] }),
      setBackendUrl: (backendUrl) => set({ backendUrl: backendUrl.trim().replace(/\/$/, '') }),
      setEngineMode: (engineMode) => set({ engineMode }),
      
      resetConfig: () =>
        set({
          profile: initialProfile,
          isDarkMode: true,
          scansHistory: [],
          linkHistory: [],
          smsHistory: [],
          pushToken: null,
          notificationEnabled: true,
          backendUrl: process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000',
          engineMode: 'auto',
        }),
    }),
    {
      name: 'rakshak-config',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
