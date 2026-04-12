import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Dimensions, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { TView, TText, useTheme } from '../../../components/ThemedUI';
import { Button } from '../../../components/Button';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../../../theme';
import { Mail, Lock, LogIn, CheckCircle2 } from 'lucide-react-native';
import { db } from '../../../services/supabase';

const { width } = Dimensions.get('window');

export const Login = () => {
  const { colors } = useTheme();
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!identifier || !password) return;
    setLoading(true);
    try {
      const user = await db.users.login(identifier, password);
      if (user) {
        router.replace('/(tabs)/dashboard');
      } else {
        alert('Access Denied: Invalid credentials');
      }
    } catch (e) {
      console.error('Login error:', e);
      alert('System Error: Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TView style={styles.container}>
      {/* Visual Side */}
      <View style={styles.visualSide}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.secondary]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <MotiView 
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={styles.branding}
        >
          <TView style={styles.logoBox}>
            <LogIn color={COLORS.primary} size={40} />
          </TView>
          <TText style={styles.brandingTitle}>Streamline your invoicing process.</TText>
          <View style={styles.features}>
            {['Automated billing', 'Real-time analytics', 'Custom templates'].map((f, i) => (
              <View key={i} style={styles.featureItem}>
                <CheckCircle2 color="rgba(255,255,255,0.6)" size={20} />
                <TText style={styles.featureText}>{f}</TText>
              </View>
            ))}
          </View>
        </MotiView>
      </View>

      {/* Form Side */}
      <TView style={[styles.formSide, { backgroundColor: colors.background }]}>
        <MotiView
          from={{ opacity: 0, translateX: 50 }}
          animate={{ opacity: 1, translateX: 0 }}
          style={styles.formContainer}
        >
          <TText variant="title" style={{ fontSize: 32, marginBottom: 8 }}>Sign In</TText>
          <TText variant="caption" style={{ marginBottom: 40 }}>Enter your credentials to access your dashboard</TText>

        <View style={styles.inputGroup}>
            <TText variant="caption" style={styles.label}>Username or Email</TText>
            <TView style={[styles.inputWrapper, { backgroundColor: colors.surfaceSecondary }]}>
              <Mail size={20} color={colors.textSecondary} />
              <TextInput 
                placeholder="admin or name@company.com" 
                style={[styles.input, { color: colors.text }]} 
                placeholderTextColor={colors.textSecondary}
                value={identifier}
                onChangeText={setIdentifier}
              />
            </TView>
          </View>

          <View style={styles.inputGroup}>
            <TText variant="caption" style={styles.label}>Password</TText>
            <TView style={[styles.inputWrapper, { backgroundColor: colors.surfaceSecondary }]}>
              <Lock size={20} color={colors.textSecondary} />
              <TextInput 
                placeholder="••••••••" 
                secureTextEntry 
                style={[styles.input, { color: colors.text }]} 
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
              />
            </TView>
          </View>

          <TouchableOpacity style={styles.forgotPass}>
            <TText style={{ color: COLORS.primary, fontSize: 14 }}>Forgot password?</TText>
          </TouchableOpacity>

          <Button 
            title="Access Account" 
            onPress={handleLogin} 
            loading={loading}
            style={{ height: 56, marginTop: 10 }}
          />

          <View style={styles.footer}>
            <TText variant="caption">Don't have an account? </TText>
            <TouchableOpacity><TText style={{ color: COLORS.primary, fontWeight: '700' }}>Register now</TText></TouchableOpacity>
          </View>
        </MotiView>
      </TView>
    </TView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  visualSide: {
    flex: 1.2,
    justifyContent: 'center',
    padding: 80,
  },
  branding: {
    zIndex: 1,
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.xl,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    ...SHADOWS.lg,
  },
  brandingTitle: {
    color: '#fff',
    fontSize: 48,
    fontWeight: '800',
    lineHeight: 56,
    marginBottom: 40,
  },
  features: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 18,
  },
  formSide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 60,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    marginBottom: 8,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
    borderRadius: RADIUS.md,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  forgotPass: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
  },
});
