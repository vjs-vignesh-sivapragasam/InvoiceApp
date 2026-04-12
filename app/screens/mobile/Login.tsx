import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
   ArrowRight,
   Check,
   Eye,
   EyeOff,
   Lock,
   Mail,
   Sparkles,
   Zap
} from 'lucide-react-native';
import { AnimatePresence, MotiView } from 'moti';
import React, { useCallback, useState } from 'react';
import {
   ActivityIndicator,
   Dimensions,
   KeyboardAvoidingView,
   Platform,
   ScrollView,
   StatusBar,
   StyleSheet,
   TextInput,
   TouchableOpacity,
   View,
} from 'react-native';
import { TText } from '../../../components/ThemedUI';
import { SPACING } from '../../../theme';
import { db } from '../../../services/supabase';

const { width, height } = Dimensions.get('window');

// Design System
const THEME = {
   colors: {
      background: '#0A0E27',
      surface: '#141B3C',
      surfaceLight: '#1E2749',
      primary: '#6366F1',
      primaryLight: '#818CF8',
      accent: '#10B981',
      danger: '#EF4444',
      white: '#FFFFFF',
      gray100: '#F1F5F9',
      gray300: '#CBD5E1',
      gray500: '#64748B',
      gray700: '#334155',
      gray900: '#0F172A',
   },
   gradients: {
      primary: ['#667EEA', '#764BA2'],
      accent: ['#10B981', '#059669'],
      background: ['#0A0E27', '#1a1f3a', '#0A0E27'],
      card: ['rgba(20, 27, 60, 0.6)', 'rgba(30, 39, 73, 0.4)'],
   }
};

// Floating Particles Background
const FloatingParticle = ({ delay, duration, size, top, left }) => (
   <MotiView
      from={{ opacity: 0, translateY: 100 }}
      animate={{
         opacity: [0.1, 0.3, 0.1],
         translateY: [-100, 100, -100],
      }}
      transition={{
         type: 'timing',
         duration: duration || 8000,
         delay: delay || 0,
         loop: true,
      }}
      style={[
         styles.particle,
         {
            width: size,
            height: size,
            top: top,
            left: left,
         }
      ]}
   />
);

const AnimatedBackground = () => (
   <View style={styles.backgroundContainer}>
      <LinearGradient
         colors={THEME.gradients.background}
         style={StyleSheet.absoluteFill}
      />

      {/* Floating Particles */}
      <FloatingParticle delay={0} duration={10000} size={100} top="10%" left="10%" />
      <FloatingParticle delay={2000} duration={12000} size={150} top="60%" left="70%" />
      <FloatingParticle delay={4000} duration={9000} size={80} top="80%" left="20%" />
      <FloatingParticle delay={1000} duration={11000} size={120} top="30%" left="80%" />

      {/* Gradient Orbs */}
      <MotiView
         from={{ scale: 0.8, opacity: 0.3 }}
         animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.3, 0.5, 0.3] }}
         transition={{ type: 'timing', duration: 8000, loop: true }}
         style={[styles.gradientOrb, styles.orb1]}
      >
         <LinearGradient
            colors={['#667EEA80', '#764BA280']}
            style={StyleSheet.absoluteFill}
         />
      </MotiView>

      <MotiView
         from={{ scale: 1, opacity: 0.2 }}
         animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
         transition={{ type: 'timing', duration: 10000, loop: true }}
         style={[styles.gradientOrb, styles.orb2]}
      >
         <LinearGradient
            colors={['#10B98180', '#05966980']}
            style={StyleSheet.absoluteFill}
         />
      </MotiView>
   </View>
);

// Glass Card Component
const GlassCard = ({ children, style }) => (
   <MotiView
      from={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', damping: 20 }}
      style={[styles.glassCard, style]}
   >
      <LinearGradient
         colors={THEME.gradients.card}
         style={StyleSheet.absoluteFill}
      />
      <View style={styles.glassContent}>
         {children}
      </View>
   </MotiView>
);

// Hero Section
const HeroSection = React.memo(() => (
   <MotiView
      from={{ opacity: 0, translateY: -30 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', delay: 100, damping: 20 }}
      style={styles.heroSection}
   >
      <MotiView
         from={{ scale: 0, rotate: '-180deg' }}
         animate={{ scale: 1, rotate: '0deg' }}
         transition={{ type: 'spring', delay: 200, damping: 15 }}
         style={styles.logoCircle}
      >
         <LinearGradient
            colors={THEME.gradients.primary}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
         />
         <Sparkles size={32} color={THEME.colors.white} strokeWidth={2} />
      </MotiView>

      <MotiView
         from={{ opacity: 0, translateY: 20 }}
         animate={{ opacity: 1, translateY: 0 }}
         transition={{ delay: 400 }}
      >
         <TText style={styles.welcomeText}>Welcome Back</TText>
         <TText style={styles.subtitleText}>Sign in to continue to your workspace</TText>
      </MotiView>
   </MotiView>
));

HeroSection.displayName = 'HeroSection';

// Modern Input Field
const ModernInput = React.memo(({
   label,
   value,
   onChangeText,
   placeholder,
   icon: Icon,
   secureTextEntry,
   keyboardType,
   delay,
   showPasswordToggle,
   onTogglePassword,
   showPassword,
}) => {
   const [isFocused, setIsFocused] = useState(false);
   const hasValue = value.length > 0;

   return (
      <MotiView
         from={{ opacity: 0, translateY: 20 }}
         animate={{ opacity: 1, translateY: 0 }}
         transition={{ type: 'spring', delay, damping: 20 }}
         style={styles.inputWrapper}
      >
         <TText style={styles.modernLabel}>{label}</TText>

         <MotiView
            animate={{
               borderColor: isFocused ? THEME.colors.primaryLight : 'rgba(139, 149, 186, 0.3)',
               backgroundColor: isFocused ? 'rgba(99, 102, 241, 0.05)' : 'rgba(30, 39, 73, 0.5)',
            }}
            transition={{ type: 'timing', duration: 200 }}
            style={styles.modernInputBox}
         >
            <View style={styles.inputIconBox}>
               <Icon
                  size={20}
                  color={isFocused ? THEME.colors.primaryLight : THEME.colors.gray500}
                  strokeWidth={2}
               />
            </View>

            <TextInput
               value={value}
               onChangeText={onChangeText}
               placeholder={placeholder}
               placeholderTextColor="rgba(139, 149, 186, 0.4)"
               style={styles.modernInput}
               secureTextEntry={secureTextEntry}
               keyboardType={keyboardType}
               autoCapitalize="none"
               onFocus={() => setIsFocused(true)}
               onBlur={() => setIsFocused(false)}
            />

            {showPasswordToggle && (
               <TouchableOpacity
                  onPress={onTogglePassword}
                  style={styles.eyeButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
               >
                  {showPassword ? (
                     <EyeOff size={20} color={THEME.colors.gray500} strokeWidth={2} />
                  ) : (
                     <Eye size={20} color={THEME.colors.gray500} strokeWidth={2} />
                  )}
               </TouchableOpacity>
            )}

            <AnimatePresence>
               {hasValue && !showPasswordToggle && (
                  <MotiView
                     from={{ scale: 0, opacity: 0 }}
                     animate={{ scale: 1, opacity: 1 }}
                     exit={{ scale: 0, opacity: 0 }}
                     style={styles.checkMark}
                  >
                     <Check size={16} color={THEME.colors.accent} strokeWidth={3} />
                  </MotiView>
               )}
            </AnimatePresence>
         </MotiView>
      </MotiView>
   );
});

ModernInput.displayName = 'ModernInput';

// Action Button
const ActionButton = React.memo(({ onPress, loading, disabled, label }) => {
   return (
      <MotiView
         from={{ opacity: 0, scale: 0.9 }}
         animate={{ opacity: 1, scale: 1 }}
         transition={{ type: 'spring', delay: 600, damping: 20 }}
      >
         <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.9}
            style={styles.actionButtonWrapper}
         >
            <MotiView
               animate={{ opacity: disabled ? 0.5 : 1 }}
               style={StyleSheet.absoluteFill}
            >
               <LinearGradient
                  colors={['#667EEA', '#764BA2', '#F093FB']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionButtonGradient}
               >
                  {/* Animated shimmer */}
                  {!loading && !disabled && (
                     <MotiView
                        from={{ translateX: -300 }}
                        animate={{ translateX: 300 }}
                        transition={{
                           type: 'timing',
                           duration: 3000,
                           loop: true,
                        }}
                        style={styles.buttonShimmer}
                     />
                  )}

                  <View style={styles.buttonContent}>
                     {loading ? (
                        <ActivityIndicator color={THEME.colors.white} size="small" />
                     ) : (
                        <>
                           <Zap size={20} color={THEME.colors.white} fill={THEME.colors.white} />
                           <TText style={styles.buttonText}>{label}</TText>
                           <ArrowRight size={20} color={THEME.colors.white} strokeWidth={2.5} />
                        </>
                     )}
                  </View>
               </LinearGradient>
            </MotiView>

            {/* Glow effect */}
            {!disabled && (
               <View style={styles.buttonGlow} />
            )}
         </TouchableOpacity>
      </MotiView>
   );
});

ActionButton.displayName = 'ActionButton';

// Main Component
export default function LoginScreen() {
   const router = useRouter();
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [loading, setLoading] = useState(false);
   const [showPassword, setShowPassword] = useState(false);

   const handleLogin = useCallback(async () => {
      if (!email || !password) return;

      setLoading(true);
      try {
         const user = await db.users.login(email, password);
         if (user) {
            router.replace('/(tabs)/dashboard');
         } else {
            alert('Access Denied: Invalid credentials');
         }
      } catch (e) {
         console.error('Login error:', e);
         alert('System Error: Could not connect to authentication server');
      } finally {
         setLoading(false);
      }
   }, [email, password, router]);

   const togglePassword = useCallback(() => {
      setShowPassword(prev => !prev);
   }, []);

   const isFormValid = email.length > 0 && password.length > 1;

   return (
      <View style={styles.container}>
         <StatusBar barStyle="light-content" />
         <AnimatedBackground />

         <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
         >
            <ScrollView
               contentContainerStyle={styles.scrollContent}
               showsVerticalScrollIndicator={false}
               keyboardShouldPersistTaps="handled"
            >
               <HeroSection />

               <GlassCard style={styles.formCard}>
                  <ModernInput
                     label="Email Address"
                     value={email}
                     onChangeText={setEmail}
                     placeholder="your@email.com"
                     icon={Mail}
                     keyboardType="email-address"
                     delay={300}
                  />

                  <ModernInput
                     label="Password"
                     value={password}
                     onChangeText={setPassword}
                     placeholder="Enter your password"
                     icon={Lock}
                     secureTextEntry={!showPassword}
                     delay={400}
                     showPasswordToggle
                     onTogglePassword={togglePassword}
                     showPassword={showPassword}
                  />

                  <TouchableOpacity style={styles.forgotButton}>
                     <TText style={styles.forgotText}>Forgot Password?</TText>
                  </TouchableOpacity>

                  <ActionButton
                     onPress={handleLogin}
                     loading={loading}
                     disabled={!isFormValid}
                     label="Sign In"
                  />
               </GlassCard>

               {/* Footer */}
               <MotiView
                  from={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 900 }}
                  style={styles.footer}
               >
                  <TText style={styles.footerText}>
                     Don't have an account?{' '}
                     <TText 
                        style={styles.footerLink}
                        onPress={() => router.push('/(tabs)/dashboard')}
                     >
                        Sign up free
                     </TText>
                  </TText>
               </MotiView>
            </ScrollView>
         </KeyboardAvoidingView>
      </View>
   );
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
      backgroundColor: THEME.colors.background,
   },
   backgroundContainer: {
      ...StyleSheet.absoluteFillObject,
      overflow: 'hidden',
   },
   particle: {
      position: 'absolute',
      borderRadius: 1000,
      backgroundColor: THEME.colors.primaryLight,
      opacity: 0.1,
   },
   gradientOrb: {
      position: 'absolute',
      width: 300,
      height: 300,
      borderRadius: 150,
      overflow: 'hidden',
   },
   orb1: {
      top: -150,
      right: -100,
   },
   orb2: {
      bottom: -100,
      left: -150,
   },
   keyboardView: {
      flex: 1,
   },
   scrollContent: {
      flexGrow: 1,
      padding: SPACING.xl,
      justifyContent: 'center',
      minHeight: height,
   },

   // Hero Section
   heroSection: {
      alignItems: 'center',
      marginBottom: 40,
   },
   logoCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
      overflow: 'hidden',
      shadowColor: THEME.colors.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.5,
      shadowRadius: 20,
      elevation: 10,
   },
   welcomeText: {
      fontSize: 32,
      fontWeight: '900',
      color: THEME.colors.white,
      textAlign: 'center',
      marginBottom: 8,
   },
   subtitleText: {
      fontSize: 15,
      color: THEME.colors.gray300,
      textAlign: 'center',
      fontWeight: '500',
   },
   statsPills: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 24,
   },
   statPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(30, 39, 73, 0.6)',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: 'rgba(139, 149, 186, 0.2)',
   },
   statDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
   },
   statText: {
      fontSize: 12,
      color: THEME.colors.gray300,
      fontWeight: '600',
   },

   // Glass Card
   glassCard: {
      borderRadius: 24,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(139, 149, 186, 0.2)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 20 },
      shadowOpacity: 0.3,
      shadowRadius: 30,
      elevation: 15,
   },
   glassContent: {
      padding: 28,
   },
   formCard: {
      maxWidth: 480,
      width: '100%',
      alignSelf: 'center',
   },

   // Modern Input
   inputWrapper: {
      marginBottom: 20,
   },
   modernLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: THEME.colors.gray300,
      marginBottom: 10,
      letterSpacing: 0.5,
   },
   modernInputBox: {
      height: 56,
      borderRadius: 14,
      borderWidth: 2,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      gap: 12,
   },
   inputIconBox: {
      width: 24,
      alignItems: 'center',
   },
   modernInput: {
      flex: 1,
      fontSize: 15,
      fontWeight: '600',
      color: THEME.colors.white,
   },
   eyeButton: {
      padding: 4,
   },
   checkMark: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: 'rgba(16, 185, 129, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
   },

   // Forgot Password
   forgotButton: {
      alignSelf: 'flex-end',
      marginTop: 8,
      marginBottom: 24,
   },
   forgotText: {
      fontSize: 13,
      color: THEME.colors.primaryLight,
      fontWeight: '600',
   },

   // Action Button
   actionButtonWrapper: {
      height: 56,
      borderRadius: 14,
      overflow: 'hidden',
      position: 'relative',
   },
   actionButtonGradient: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
   },
   buttonShimmer: {
      position: 'absolute',
      top: 0,
      left: -100,
      width: 100,
      height: '100%',
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      transform: [{ skewX: '-20deg' }],
   },
   buttonContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
   },
   buttonText: {
      fontSize: 16,
      fontWeight: '800',
      color: THEME.colors.white,
      letterSpacing: 0.5,
   },
   buttonGlow: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: 14,
      shadowColor: '#764BA2',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.5,
      shadowRadius: 20,
      elevation: 10,
   },

   // Divider
   divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 28,
   },
   dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: 'rgba(139, 149, 186, 0.2)',
   },
   dividerText: {
      fontSize: 12,
      color: THEME.colors.gray500,
      fontWeight: '600',
      marginHorizontal: 16,
   },

   // Social Buttons
   socialButtons: {
      flexDirection: 'row',
      gap: 12,
      justifyContent: 'center',
   },
   socialButton: {
      width: 56,
      height: 56,
      borderRadius: 14,
      backgroundColor: 'rgba(30, 39, 73, 0.5)',
      borderWidth: 2,
      borderColor: 'rgba(139, 149, 186, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
   },
   socialButtonText: {
      fontSize: 18,
      fontWeight: '800',
      color: THEME.colors.white,
   },

   // Footer
   footer: {
      marginTop: 32,
      alignItems: 'center',
   },
   footerText: {
      fontSize: 14,
      color: THEME.colors.gray500,
      fontWeight: '500',
   },
   footerLink: {
      color: THEME.colors.primaryLight,
      fontWeight: '700',
   },
});