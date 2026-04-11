import React from 'react';
import { Platform } from 'react-native';
import { Templates as WebTemplates } from '../screens/webview/Templates';
import MobileTemplates from '../screens/mobile/Templates';

export default function TemplatesScreen() {
  if (Platform.OS === 'web') {
    return <WebTemplates />;
  }
  return <MobileTemplates />;
}
