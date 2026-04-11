import React from 'react';
import { Platform } from 'react-native';
import { History as WebHistory } from '../screens/webview/History';
import MobileHistory from '../screens/mobile/History';

export default function HistoryScreen() {
  if (Platform.OS === 'web') {
    return <WebHistory />;
  }
  return <MobileHistory />;
}
