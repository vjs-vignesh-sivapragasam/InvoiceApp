import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import React from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../theme';
import { TText, useTheme } from './ThemedUI';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'gradient' | 'success' | 'purple' | 'ocean' | 'sunset' | 'aurora';
  loading?: boolean;
  disabled?: boolean;
  style?: any;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
}

const GRADIENT_PRESETS = {
  primary: ['#818cf8', '#6366f1', '#4f46e5'],
  danger: ['#ff6b6b', '#ee5a6f', '#c92a2a'],
  success: ['#51cf66', '#37b24d', '#2f9e44'],
  purple: ['#b197fc', '#9775fa', '#7950f2'],
  ocean: ['#3b82f6', '#2563eb', '#1d4ed8'],
  sunset: ['#ff6b6b', '#ffa94d', '#fab005'],
  aurora: ['#cc5de8', '#845ef7', '#5c7cfa'],
  gradient: ['#667eea', '#764ba2', '#f093fb'],
};

const SIZE_CONFIGS = {
  sm: { height: 40, fontSize: 13, paddingHorizontal: SPACING.md },
  md: { height: 48, fontSize: 15, paddingHorizontal: SPACING.lg },
  lg: { height: 56, fontSize: 17, paddingHorizontal: SPACING.xl },
};

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  style,
  icon,
  size = 'md',
  glow = true,
}) => {
  const { colors } = useTheme();
  const sizeConfig = SIZE_CONFIGS[size];

  const isGradient = variant !== 'secondary' && variant !== 'outline';

  const getGradientColors = () => {
    return GRADIENT_PRESETS[variant as keyof typeof GRADIENT_PRESETS] || GRADIENT_PRESETS.primary;
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: colors.surfaceSecondary,
          borderWidth: 1,
          borderColor: colors.border,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: COLORS.primary
        };
      default:
        return {};
    }
  };

  const getTextColor = () => {
    if (variant === 'outline') return COLORS.primary;
    if (variant === 'secondary') return colors.text;
    return '#ffffff';
  };

  const getShadowColor = () => {
    const gradientColors = getGradientColors();
    return gradientColors[1] || COLORS.primary;
  };

  const Content = (
    <View style={[styles.content, { paddingHorizontal: sizeConfig.paddingHorizontal }]}>
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon && (
            <MotiView
              from={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 15 }}
              style={styles.iconContainer}
            >
              {icon}
            </MotiView>
          )}
          <TText style={[
            styles.buttonText,
            {
              color: getTextColor(),
              fontSize: sizeConfig.fontSize,
            }
          ]}>
            {title}
          </TText>
        </>
      )}
    </View>
  );

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', damping: 20 }}
    >
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        disabled={disabled || loading}
        style={[
          styles.buttonContainer,
          { height: sizeConfig.height },
          style,
        ]}
      >
        <MotiView
          animate={{
            opacity: (disabled || loading) ? 0.5 : 1,
          }}
          transition={{ type: 'timing', duration: 200 }}
          style={StyleSheet.absoluteFill}
        >
          {/* Glow Effect Layer */}
          {isGradient && glow && !disabled && (
            <View
              style={[
                styles.glowLayer,
                {
                  shadowColor: getShadowColor(),
                  shadowOpacity: 0.4,
                  shadowRadius: 20,
                  elevation: 8,
                }
              ]}
            />
          )}

          {/* Button Container */}
          <View
            style={[
              styles.button,
              getVariantStyles(),
              { borderRadius: RADIUS.md }
            ]}
          >
            {isGradient ? (
              <>
                {/* Gradient Background */}
                <LinearGradient
                  colors={getGradientColors()}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[StyleSheet.absoluteFill, { borderRadius: RADIUS.md }]}
                />

                {/* Shimmer Overlay */}
                {!disabled && !loading && (
                  <MotiView
                    from={{ translateX: -200, opacity: 0 }}
                    animate={{ translateX: 200, opacity: [0, 0.3, 0] }}
                    transition={{
                      type: 'timing',
                      duration: 2000,
                      loop: true,
                      repeatReverse: false,
                    }}
                    style={styles.shimmer}
                  />
                )}

                {Content}
              </>
            ) : (
              Content
            )}
          </View>
        </MotiView>
      </TouchableOpacity>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    width: '100%',
    position: 'relative',
  },
  glowLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: RADIUS.md,
    backgroundColor: 'transparent',
  },
  button: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
  buttonText: {
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: -100,
    width: 100,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    transform: [{ skewX: '-20deg' }],
  },
});