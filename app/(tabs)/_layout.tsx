import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { useTheme } from '../../components/ThemedUI';
import { LayoutDashboard, ReceiptText, History, Settings, BarChart2, Database } from 'lucide-react-native';
import { COLORS } from '../../theme';

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 10,
          display: Platform.OS === 'web' ? 'none' : 'flex',
        },
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTitleStyle: {
          color: colors.text,
          fontWeight: '700',
        },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <LayoutDashboard size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <History size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="billing"
        options={{
          title: 'Billing',
          tabBarIcon: ({ color, focused }) => (
            <View style={[
              styles.billingTabIcon, 
              { 
                backgroundColor: focused ? COLORS.primary : colors.surfaceSecondary,
                shadowColor: COLORS.primary,
                elevation: focused ? 8 : 0,
                shadowOpacity: focused ? 0.4 : 0,
              }
            ]}>
              <ReceiptText size={28} color={focused ? '#fff' : color} />
            </View>
          ),
          tabBarLabel: () => null,
        }}
      />
      <Tabs.Screen
        name="master"
        options={{
          title: 'Master',
          tabBarIcon: ({ color }) => <Database size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  billingTabIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -25, // Raise it up
    borderWidth: 3,
    borderColor: 'transparent',
  }
});
