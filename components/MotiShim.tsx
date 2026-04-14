import React from 'react';
import { View, Text, ViewProps, TextProps } from 'react-native';

/**
 * 🛠️ Moti Shim
 * This file replaces the 'moti' library with standard React Native components.
 * It removes the native dependency on Reanimated while keeping the app structure intact.
 */

export const MotiView = (props: any) => {
  const { from, animate, transition, exit, style, ...rest } = props;
  return <View style={style} {...rest} />;
};

export const MotiText = (props: any) => {
  const { from, animate, transition, exit, style, ...rest } = props;
  return <Text style={style} {...rest} />;
};

export const AnimatePresence = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export default {
  MotiView,
  MotiText,
  AnimatePresence,
};
