import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Login as WebLogin } from '../screens/webview/Login';
import MobileLogin from '../screens/mobile/Login';
import { useAppConfig } from '../../components/AppConfigProvider';

export default function LoginScreen() {
  const { config } = useAppConfig();
  const router = useRouter();

  useEffect(() => {
    if (!config.loginEnabled) {
      router.replace('/(tabs)/dashboard');
    }
  }, [config.loginEnabled]);

  if (Platform.OS === 'web') {
    return <WebLogin />;
  }
  return <MobileLogin />;
}
