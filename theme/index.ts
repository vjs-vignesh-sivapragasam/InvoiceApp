export const COLORS = {
  primary: '#818cf8',
  secondary: '#a78bfa',
  accent: '#34d399',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#fbbf24',
  info: '#60a5fa',

  // Light Theme
  light: {
    background: '#f1f5f9',
    surface: '#f8fafc',
    surfaceSecondary: '#f1f5f9',
    text: '#0f172a',
    textSecondary: '#64748b',
    border: '#e2e8f0',
    card: '#ffffff',
    glass: 'rgba(255, 255, 255, 0.8)',
    shadow: '#000000',
  },

  // Premium Deep Navy Theme (Refined Dark)
  dark: {
    background: '#0f1623',      // Deep Navy — rich, not pure black
    surface: '#161e2e',         // Slightly lighter navy surface
    surfaceSecondary: '#1e2a40', // Elevated layer — visible depth
    text: '#e8edf5',            // Soft white — easier on eyes
    textSecondary: '#8fa3bf',   // Muted steel-blue
    border: 'rgba(129, 140, 248, 0.18)', // Neon-tinted borders
    card: '#192236',            // Deep navy card
    glass: 'rgba(22, 30, 46, 0.80)',
    highlight: '#818cf8',       // Primary glow
    accentSecondary: '#f472b6', // Pink accent for variety
    shadow: '#000000',
  }
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  cardGap: 30, // Optimized for stunning layouts
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 20,
  xl: 30,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: 'rgba(0,0,0,0.1)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: 'rgba(0,0,0,0.2)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 4,
  },
  lg: {
    shadowColor: 'rgba(0,0,0,0.3)',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 8,
  },
};
