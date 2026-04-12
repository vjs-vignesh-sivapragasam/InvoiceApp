// ⚠️ Must be first — polyfills navigator.userAgent before moti/framer-motion loads
import '../polyfills';

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';
import { ThemeProvider } from '../components/ThemedUI';
import { AppConfigProvider } from '../components/AppConfigProvider';
import { NotificationProvider } from '../components/NotificationProvider';
import { StatusBar } from 'expo-status-bar';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <AppConfigProvider>
      <ThemeProvider>
        <NotificationProvider>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)/login" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="invoice/create" options={{ presentation: 'modal' }} />
            <Stack.Screen name="manage-clients" options={{ title: 'Client Master' }} />
            <Stack.Screen name="manage-products" options={{ title: 'Product Master' }} />
            <Stack.Screen name="manage-inventory" options={{ title: 'Inventory Update' }} />
          </Stack>
        </NotificationProvider>
      </ThemeProvider>
    </AppConfigProvider>
  );
}
