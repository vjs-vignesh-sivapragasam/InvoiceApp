import React from 'react';
import { Platform } from 'react-native';
import { BusinessDetails as WebBusinessDetails } from '../screens/webview/BusinessDetails';
import MobileBusinessDetails from '../screens/mobile/BusinessDetails';

export default function BusinessDetailsScreen() {
  if (Platform.OS === 'web') {
    return <WebBusinessDetails />;
  }
  return <MobileBusinessDetails />;
}
