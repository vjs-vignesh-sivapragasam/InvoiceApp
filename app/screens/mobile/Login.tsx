import React, { useState } from 'react';
import { StyleSheet, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView, MotiText } from 'moti';
import { TView, TText, useTheme } from '../../../components/ThemedUI';
import { Button } from '../../../components/Button';
import { RADIUS, SPACING } from '../../../theme';
import { Mail, Lock, LogIn } from 'lucide-react-native';

export default function LoginScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    // Simulate auth
    setTimeout(() => {
      setLoading(false);
      router.replace('/(tabs)/dashboard');
    }, 1500);
  };

  return (
    <TView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <MotiView 
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 1000 }}
            style={styles.header}
          >
            <TView style={[styles.logoContainer, { backgroundColor: colors.surfaceSecondary }]}>
              <LogIn color={colors.text} size={32} />
            </TView>
            <TText variant="title" style={styles.title}>Welcome Back</TText>
            <TText variant="caption">Sign in to manage your invoices</TText>
          </MotiView>

          <MotiView 
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 300 }}
            style={styles.form}
          >
            <TView style={styles.inputContainer}>
              <Mail size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                placeholder="Email Address"
                placeholderTextColor={colors.textSecondary}
                value={email}
                onChangeText={setEmail}
                style={[styles.input, { color: colors.text, borderBottomColor: colors.border }]}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </TView>

            <TView style={styles.inputContainer}>
              <Lock size={20} color={colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                placeholder="Password"
                placeholderTextColor={colors.textSecondary}
                value={password}
                onChangeText={setPassword}
                style={[styles.input, { color: colors.text, borderBottomColor: colors.border }]}
                secureTextEntry
              />
            </TView>

            <Button 
              title="Sign In" 
              onPress={handleLogin} 
              loading={loading}
              style={{ marginTop: SPACING.xl }}
            />

            <TText style={styles.forgotPassword} variant="caption">
              Forgot Password?
            </TText>
          </MotiView>

          <MotiView 
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 600 }}
            style={styles.footer}
          >
            <TText variant="caption">Don't have an account? </TText>
            <TText style={{ color: colors.text, fontWeight: '600' }} variant="caption">
              Sign Up
            </TText>
          </MotiView>
        </ScrollView>
      </KeyboardAvoidingView>
    </TView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.xl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    marginBottom: SPACING.xs,
  },
  form: {
    gap: SPACING.lg,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputIcon: {
    marginRight: SPACING.md,
  },
  input: {
    flex: 1,
    height: 50,
    borderBottomWidth: 1,
    fontSize: 16,
  },
  forgotPassword: {
    textAlign: 'center',
    marginTop: SPACING.lg,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: SPACING.xxl,
  },
});
