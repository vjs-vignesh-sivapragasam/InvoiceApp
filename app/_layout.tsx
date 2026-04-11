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
          </Stack>
        </NotificationProvider>
      </ThemeProvider>
    </AppConfigProvider>
  );
}
