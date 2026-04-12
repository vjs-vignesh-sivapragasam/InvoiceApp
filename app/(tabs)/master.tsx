import React from 'react';
import { Platform } from 'react-native';
import MasterScreen from '../screens/mobile/Master';

export default function MasterTab() {
  if (Platform.OS === 'web') return null;
  return <MasterScreen />;
}
