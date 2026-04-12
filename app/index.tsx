import React, { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { useAppConfig } from '../components/AppConfigProvider';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { config } = useAppConfig();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Add a small delay to ensure config is loaded from AsyncStorage
    const timer = setTimeout(() => setReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#818cf8" />
      </View>
    );
  }

  if (config.loginEnabled) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(tabs)/dashboard" />;
}
