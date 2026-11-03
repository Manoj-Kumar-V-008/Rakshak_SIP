import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useConfigStore } from '../store/useConfigStore';
import { reportScamLink, fetchScamLinkBlocklist } from '../services/api/scamService';

const TOKEN_KEY = 'rakshak_auth_token';
const USER_KEY = 'rakshak_auth_user';

interface AuthContextType {
  user: { id: string; email: string; name?: string; preferredLanguage: string } | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: { id: string; email: string; name?: string; preferredLanguage: string }) => Promise<void>;
  logout: () => Promise<void>;
  register: (token: string, user: { id: string; email: string; name?: string; preferredLanguage: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email: string; name?: string; preferredLanguage: string } | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const setTokenAndUser = useCallback(async (newToken: string | null, newUser: { id: string; email: string; name?: string; preferredLanguage: string } | null) => {
    setToken(newToken);
    setUser(newUser);
    if (newToken && newUser) {
      await SecureStore.setItemAsync(TOKEN_KEY, newToken);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(newUser));
      useConfigStore.getState().setPushToken(newToken); // optional: link push token to user
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
      useConfigStore.getState().setPushToken(null);
    }
  }, []);

  // Hydrate auth state from SecureStore on mount.
  useEffect(() => {
    const hydrate = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        const storedUser = await SecureStore.getItemAsync(USER_KEY);
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch {
        // Ignore hydration errors.
      } finally {
        setIsLoading(false);
      }
    };
    hydrate();
  }, []);

  const login = useCallback(async (newToken: string, newUser: { id: string; email: string; name?: string; preferredLanguage: string }) => {
    await setTokenAndUser(newToken, newUser);
  }, [setTokenAndUser]);

  const register = useCallback(async (newToken: string, newUser: { id: string; email: string; name?: string; preferredLanguage: string }) => {
    await setTokenAndUser(newToken, newUser);
  }, [setTokenAndUser]);

  const logout = useCallback(async () => {
    await setTokenAndUser(null, null);
  }, [setTokenAndUser]);

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider value={{ user, token, isLoading, isAuthenticated, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
};
