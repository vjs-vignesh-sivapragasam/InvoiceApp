import React from 'react';
import { Platform } from 'react-native';
import { Reports as WebReports } from '../screens/webview/Reports';
import MobileReports from '../screens/mobile/Reports';

export default function ReportsScreen() {
  if (Platform.OS === 'web') {
    return <WebReports />;
  }
  return <MobileReports />;
}
