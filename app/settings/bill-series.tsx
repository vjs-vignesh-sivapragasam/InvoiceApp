import React from 'react';
import { Platform } from 'react-native';
import { BillSeries as WebBillSeries } from '../screens/webview/BillSeries';
import MobileBillSeries from '../screens/mobile/BillSeries';

export default function BillSeriesScreen() {
  if (Platform.OS === 'web') {
    return <WebBillSeries />;
  }
  return <MobileBillSeries />;
}
