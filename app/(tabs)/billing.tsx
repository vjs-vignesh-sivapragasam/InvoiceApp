import React from 'react';
import { Platform } from 'react-native';
import { Billing as WebBilling } from '../screens/webview/Billing';
import MobileBilling from '../screens/mobile/Billing';

export default function BillingScreen() {
  if (Platform.OS === 'web') {
    return <WebBilling />;
  }
  return <MobileBilling />;
}
