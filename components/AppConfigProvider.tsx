import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../services/supabase';

interface AppConfig {
  loginEnabled: boolean;
  billSeriesText: string;
  billSeriesDelimiter: string;
  billSeriesNumber: string;
  billSeriesCount: string;
  defaultTemplate: string;
}

interface AppConfigContextType {
  config: AppConfig;
  updateConfig: (updates: Partial<AppConfig>) => void;
  refreshConfig: () => Promise<void>;
}

const AppConfigContext = createContext<AppConfigContextType | undefined>(undefined);

export const AppConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<AppConfig>({
    loginEnabled: true,
    billSeriesText: 'INV',
    billSeriesDelimiter: '/',
    billSeriesNumber: new Date().getFullYear().toString(),
    billSeriesCount: '01',
    defaultTemplate: '1',
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const saved = await AsyncStorage.getItem('app_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          setConfig(prev => ({ ...prev, ...parsed }));
        }
      }
    } catch (e) {
      console.warn('App configuration loaded with defaults (Storage restricted)');
    }

    // 2. Sync Security Gate from Supabase (Source of Truth)
    try {
      const dbProfile = await db.users.getProfile(1);
      if (dbProfile) {
        setConfig(prev => ({ ...prev, loginEnabled: dbProfile.isloginscreenenabled }));
        console.log('Login gate status synced from cloud:', dbProfile.isloginscreenenabled);
      }
    } catch (dbErr) {
      console.log('Could not sync login gate from cloud, using local/default');
    }

    // 3. Sync Bill Series from Supabase
    try {
      const billSeries = await db.billSeries.get(1);
      if (billSeries) {
        setConfig(prev => ({
          ...prev,
          billSeriesText: billSeries.prefix || 'INV',
          billSeriesDelimiter: billSeries.delimiter || '/',
          billSeriesNumber: (billSeries.startingnumber || 1).toString(),
          billSeriesCount: (billSeries.currentcount || 0).toString().padStart(3, '0')
        }));
      }
    } catch (err) {
      console.log('Could not sync bill series from cloud');
    }
  };

  const updateConfig = async (updates: Partial<AppConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    try {
      await AsyncStorage.setItem('app_config', JSON.stringify(newConfig));
    } catch (e) {
      console.warn('Configuration saved to memory only (Storage restricted)');
    }
  };

  const refreshConfig = async () => {
    await loadConfig();
  };

  return (
    <AppConfigContext.Provider value={{ config, updateConfig, refreshConfig }}>
      {children}
    </AppConfigContext.Provider>
  );
};

export const useAppConfig = () => {
  const context = useContext(AppConfigContext);
  if (!context) throw new Error('useAppConfig must be used within AppConfigProvider');
  return context;
};
