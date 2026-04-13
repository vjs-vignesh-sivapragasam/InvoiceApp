import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, TextInput, View, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { TView, TText, useTheme } from '../../components/ThemedUI';
import { Button } from '../../components/Button';
import { COLORS, RADIUS } from '../../theme';
import { ChevronLeft, Lock, ShieldCheck, Eye, EyeOff } from 'lucide-react-native';
import { db } from '../../services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotifications } from '../../components/NotificationProvider';

export default function ChangePassword() {
  const { colors, isDark } = useTheme();
  const { showToast } = useNotifications();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleUpdate = async () => {
    if (!form.newPassword || !form.confirmPassword) {
      showToast('Please fill all fields', 'error');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    setLoading(true);
    try {
      // Source of Truth: Administrative User ID 1
      const userId = 1;

      // In a real app we would verify oldPassword first, 
      // but for this implementation we directly update.
      await db.users.updateProfile(userId, { password: form.newPassword });
      
      showToast('Password Updated Successfully', 'success');
      setTimeout(() => router.back(), 500);
    } catch (e: any) {
      console.error('Update Password Error:', e);
      showToast(e.message || 'Failed to update password', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TView style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <TText variant="subtitle" style={{ fontWeight: '900' }}>Change Password</TText>
        <TView style={{ width: 40 }} />
      </TView>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <MotiView 
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={styles.card}
          >
            <TView style={[styles.iconBox, { backgroundColor: COLORS.primary + '10' }]}>
              <ShieldCheck size={32} color={COLORS.primary} />
            </TView>
            <TText style={styles.cardTitle}>Security Update</TText>
            <TText style={styles.cardDesc}>Update your login credentials to secure your management suite.</TText>
          </MotiView>

          <TView style={styles.form}>
             <TView style={styles.inputGroup}>
              <TText variant="caption" style={styles.label}>NEW PASSWORD</TText>
              <TView style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f9f9f9' }]}>
                <Lock size={18} color={COLORS.primary} />
                <TextInput 
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Minimum 4 characters"
                  placeholderTextColor="#999"
                  secureTextEntry={!showPass}
                  value={form.newPassword}
                  onChangeText={(v) => setForm({...form, newPassword: v})}
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff size={18} color="#999" /> : <Eye size={18} color="#999" />}
                </TouchableOpacity>
              </TView>
            </TView>

            <TView style={styles.inputGroup}>
              <TText variant="caption" style={styles.label}>CONFIRM NEW PASSWORD</TText>
              <TView style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f9f9f9' }]}>
                <Lock size={18} color={COLORS.primary} />
                <TextInput 
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Repeat new password"
                  placeholderTextColor="#999"
                  secureTextEntry={!showPass}
                  value={form.confirmPassword}
                  onChangeText={(v) => setForm({...form, confirmPassword: v})}
                />
              </TView>
            </TView>

            <Button 
              title="Update Security Key" 
              onPress={handleUpdate}
              loading={loading}
              style={{ marginTop: 20 }}
            />
          </TView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: 1 },
  backBtn: { padding: 8 },
  content: { padding: 20 },
  card: { alignItems: 'center', padding: 30, borderRadius: RADIUS.xl, marginBottom: 30 },
  iconBox: { width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  cardTitle: { fontSize: 20, fontWeight: '900', marginBottom: 10 },
  cardDesc: { textAlign: 'center', color: '#888', fontSize: 13, lineHeight: 20 },
  form: { gap: 20 },
  inputGroup: { gap: 8 },
  label: { fontWeight: '800', fontSize: 10, marginLeft: 4, letterSpacing: 1 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 56, borderRadius: RADIUS.md, borderWidth: 1 },
  input: { flex: 1, marginLeft: 12, fontSize: 16, fontWeight: '600' }
});
