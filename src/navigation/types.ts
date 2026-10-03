import { NavigatorScreenParams } from '@react-navigation/native';
import { AnalysisResult } from '../types/analysis';

export type OnboardingStackParamList = {
  Welcome: undefined;
  PermissionsSetup: undefined;
  UserProfileSetup: undefined;
};

export type AppTabParamList = {
  HomeTab: undefined;
  ScannerTab: undefined;
  KnowledgeTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: NavigatorScreenParams<OnboardingStackParamList>;
  App: NavigatorScreenParams<AppTabParamList>;
  ScamAnalysisResult: {
    result: AnalysisResult;
  };
  VoiceScanner: undefined;
  ScamDetails: {
    scamId: string;
    title: string;
    description: string;
    protectionTips: string[];
  };
  EmergencyAlert: {
    scamScenarioType?: string;
  };
  AdminSettings: undefined;
};
