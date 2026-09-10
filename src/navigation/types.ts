import { NavigatorScreenParams } from '@react-navigation/native';

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
    scamText?: string;
    riskScore: number;
    scamType: string;
    indicators: string[];
    remediationSteps: string[];
  };
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
