import React from 'react';
import { Platform } from 'react-native';
import { Billing as WebCreateInvoice } from '../screens/webview/Billing';
import MobileCreateInvoice from '../screens/mobile/CreateInvoice';

export default function CreateInvoiceScreen() {
  if (Platform.OS === 'web') {
    return <WebCreateInvoice />;
  }
  return <MobileCreateInvoice />;
}
