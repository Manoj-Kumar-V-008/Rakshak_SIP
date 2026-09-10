import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useConfigStore } from './src/store/useConfigStore';
import { lightTheme, darkTheme } from './src/theme';
import { NavigationRouter } from './src/navigation';

export default function App() {
  const isDarkMode = useConfigStore((state) => state.isDarkMode);
  const activeTheme = isDarkMode ? darkTheme : lightTheme;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PaperProvider theme={activeTheme}>
          <NavigationContainer>
            <NavigationRouter />
            <StatusBar style={isDarkMode ? 'light' : 'dark'} />
          </NavigationContainer>
        </PaperProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
