import React from 'react';
import { Platform } from 'react-native';
import { Dashboard as WebDashboard } from '../screens/webview/Dashboard';
import MobileDashboard from '../screens/mobile/Dashboard';

export default function DashboardScreen() {
  if (Platform.OS === 'web') {
    return <WebDashboard />;
  }
  return <MobileDashboard />;
}
