import React from 'react';
import { Platform } from 'react-native';
import { Settings as WebSettings } from '../screens/webview/Settings';
import MobileSettings from '../screens/mobile/Settings';

export default function SettingsScreen() {
  if (Platform.OS === 'web') {
    return <WebSettings />;
  }
  return <MobileSettings />;
}
