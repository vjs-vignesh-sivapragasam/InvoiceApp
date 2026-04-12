import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme, View, Text, ViewProps, TextProps, StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../theme';

type ThemeType = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeType;
  colors: typeof COLORS.light;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [theme, setTheme] = useState<ThemeType>((systemScheme === 'dark' ? 'dark' : 'light'));

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const colors = COLORS[theme] ?? COLORS.light;
  const isDark = theme === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};

export const TView: React.FC<ViewProps & { variant?: 'surface' | 'card' | 'secondary' }> = ({ 
  style, 
  variant, 
  ...props 
}) => {
  const { colors } = useTheme();
  
  const getVariantStyle = () => {
    switch (variant) {
      case 'surface': return { backgroundColor: colors.surface };
      case 'card': return { 
        backgroundColor: colors.card,
        borderRadius: RADIUS.md,
        padding: SPACING.md,
        ...SHADOWS.sm,
      };
      case 'secondary': return { backgroundColor: colors.surfaceSecondary };
      default: return { backgroundColor: colors.background };
    }
  };

  return <View style={[getVariantStyle(), style]} {...props} />;
};

export const TText: React.FC<TextProps & { variant?: 'title' | 'subtitle' | 'caption' | 'body' }> = ({ 
  style, 
  variant = 'body', 
  ...props 
}) => {
  const { colors } = useTheme();
  
  const getVariantStyle = () => {
    switch (variant) {
      case 'title': return { fontSize: 24, fontWeight: '700', color: colors.text };
      case 'subtitle': return { fontSize: 18, fontWeight: '600', color: colors.text };
      case 'body': return { fontSize: 16, color: colors.text };
      case 'caption': return { fontSize: 13, color: colors.textSecondary };
      default: return { fontSize: 16, color: colors.text };
    }
  };

  return <Text style={[getVariantStyle(), style]} {...props} />;
};
