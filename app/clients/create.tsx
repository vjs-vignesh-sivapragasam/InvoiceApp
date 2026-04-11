import React from 'react';
import { Platform } from 'react-native';
import { CreateClient as WebCreateClient } from '../screens/webview/CreateClient';
import MobileCreateClient from '../screens/mobile/CreateClient';

export default function CreateClientScreen() {
  if (Platform.OS === 'web') {
    return <WebCreateClient />;
  }
  return <MobileCreateClient />;
}
