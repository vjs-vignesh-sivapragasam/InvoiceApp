export const COLORS = {
  primary: '#818cf8',
  secondary: '#a78bfa',
  accent: '#34d399',
  success: '#10b981',
  danger: '#ef4444',
  warning: '#fbbf24',
  info: '#60a5fa',

  // Premium Light Theme (Ocean & Ink)
  light: {
    background: '#f8fafc',      // Crisp, clean background
    surface: '#ffffff',         // Pure white surface
    surfaceSecondary: '#f1f5f9', // Soft light gray-blue
    text: '#0f172a',            // Deep Midnight Blue (Sophisticated)
    textSecondary: '#64748b',   // Steel Slate (Readable)
    border: '#e2e8f0',          // Subtle border
    card: '#ffffff',            // Pure white card
    glass: 'rgba(255, 255, 255, 0.9)',
    shadow: '#64748b',
  },

  // Premium Deep Navy Theme (Refined Dark)
  dark: {
    background: '#0f172a',      // Deep Navy
    surface: '#1e293b',         // Lighter navy
    surfaceSecondary: '#334155', // Elevated surface
    text: '#f1f5f9',            // Near white
    textSecondary: '#94a3b8',   // Muted slate
    border: 'rgba(148, 163, 184, 0.2)',
    card: '#1e293b',
    glass: 'rgba(15, 23, 42, 0.8)',
    highlight: '#818cf8',
    accentSecondary: '#f472b6',
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
