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
  updateProfile: (profile: Partial<UserProfile>) => void;
  toggleTheme: () => void;
  completeOnboarding: (
    name: string,
    language: 'en' | 'hi' | 'ta' | 'te' | 'kn',
    phoneNumber?: string,
    userCategory?: string,
    emergencyContactName?: string,
    emergencyContactPhone?: string
  ) => void;
  addScanRecord: (record: Omit<ScanRecord, 'id' | 'timestamp'>) => void;
  clearScanHistory: () => void;
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
      
      updateProfile: (profileUpdates) =>
        set((state) => ({
          profile: { ...state.profile, ...profileUpdates },
        })),
        
      toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      
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
        
      clearScanHistory: () => set({ scansHistory: [] }),
      
      resetConfig: () =>
        set({
          profile: initialProfile,
          isDarkMode: true,
          scansHistory: [],
        }),
    }),
    {
      name: 'rakshak-config',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
