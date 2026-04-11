import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppConfig {
  loginEnabled: boolean;
  billSeriesText: string;
  billSeriesDelimiter: string;
  billSeriesNumber: string;
  billSeriesCount: string;
}

interface AppConfigContextType {
  config: AppConfig;
  updateConfig: (updates: Partial<AppConfig>) => void;
}

const AppConfigContext = createContext<AppConfigContextType | undefined>(undefined);

export const AppConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<AppConfig>({
    loginEnabled: true,
    billSeriesText: 'INV',
    billSeriesDelimiter: '/',
    billSeriesNumber: new Date().getFullYear().toString(),
    billSeriesCount: '001',
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const saved = await AsyncStorage.getItem('app_config');
      if (saved) setConfig(JSON.parse(saved));
    } catch (e) {
      console.error('Failed to load config');
    }
  };

  const updateConfig = async (updates: Partial<AppConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    try {
      await AsyncStorage.setItem('app_config', JSON.stringify(newConfig));
    } catch (e) {
      console.error('Failed to save config');
    }
  };

  return (
    <AppConfigContext.Provider value={{ config, updateConfig }}>
      {children}
    </AppConfigContext.Provider>
  );
};

export const useAppConfig = () => {
  const context = useContext(AppConfigContext);
  if (!context) throw new Error('useAppConfig must be used within AppConfigProvider');
  return context;
};
