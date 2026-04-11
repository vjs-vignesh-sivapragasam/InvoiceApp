import React from 'react';
import { Platform } from 'react-native';
import { CreateProduct as WebCreateProduct } from '../screens/webview/CreateProduct';
import MobileCreateProduct from '../screens/mobile/CreateProduct';

export default function CreateProductScreen() {
  if (Platform.OS === 'web') {
    return <WebCreateProduct />;
  }
  return <MobileCreateProduct />;
}
