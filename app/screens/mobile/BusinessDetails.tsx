import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { TView, TText, useTheme } from '../../../components/ThemedUI';
import { Button } from '../../../components/Button';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../../../theme';
import { 
  Building, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Hash, 
  CreditCard, 
  ChevronLeft,
  Camera,
  Upload
} from 'lucide-react-native';

const MobileField = ({ label, placeholder, icon: Icon, multiline }) => {
  const { colors } = useTheme();
  return (
    <TView style={styles.fieldGroup}>
      <TText variant="caption" style={styles.fieldLabel}>{label}</TText>
      <TView style={[styles.inputContainer, { backgroundColor: colors.surfaceSecondary, height: multiline ? 100 : 52 }]}>
        <Icon size={18} color={COLORS.primary} style={multiline ? { marginTop: 14 } : {}} />
        <TextInput 
          placeholder={placeholder} 
          style={[styles.input, { color: colors.text }]} 
          multiline={multiline}
        />
      </TView>
    </TView>
  );
};

export const BusinessDetails = () => {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <TView style={[styles.container, { backgroundColor: colors.background }]}>
      <TView style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <TText variant="subtitle">Business Details</TText>
        <TView style={{ width: 40 }} />
      </TView>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <MotiView 
          from={{ opacity: 0, translateY: 30 }}
          animate={{ opacity: 1, translateY: 0 }}
          style={[styles.card, { backgroundColor: colors.card, ...SHADOWS.sm }]}
        >
          {/* Photos */}
          <TView style={styles.photoContainer}>
            <TView style={styles.avatarSection}>
              <TView style={[styles.avatar, { backgroundColor: colors.surfaceSecondary }]}>
                <Camera size={24} color={colors.textSecondary} />
              </TView>
              <TText style={{ fontSize: 12, marginTop: 8 }}>Owner Photo</TText>
            </TView>
            <TView style={styles.logoSection}>
              <TView style={[styles.logoBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                <Upload size={24} color={COLORS.primary} />
              </TView>
              <TText style={{ fontSize: 12, marginTop: 8 }}>Business Logo</TText>
            </TView>
          </TView>

          <TText variant="subtitle" style={styles.subHeader}>Company Info</TText>
          <MobileField label="COMPANY NAME" placeholder="Ex: Digital Solutions" icon={Building} />
          <MobileField label="USERNAME" placeholder="John Doe" icon={User} />
          <MobileField label="GSTIN / VAT" placeholder="Enter Registration No." icon={Hash} />

          <TText variant="subtitle" style={styles.subHeader}>Contact Details</TText>
          <MobileField label="EMAIL ID" placeholder="contact@business.com" icon={Mail} />
          <MobileField label="MOBILE NO." placeholder="+1 000 000 000" icon={Phone} />
          <MobileField label="ALTERNATE MOBILE" placeholder="+1 111 111 111" icon={Phone} />
          <MobileField label="OFFICE ADDRESS" placeholder="Full business address..." icon={MapPin} multiline />

          <TText variant="subtitle" style={styles.subHeader}>Bank Information</TText>
          <MobileField label="BANK ACCOUNT NAME" placeholder="Business Name" icon={User} />
          <MobileField label="ACCOUNT NUMBER" placeholder="0000 0000 0000" icon={CreditCard} />
          <MobileField label="IFSC / SWIFT" placeholder="IFSC CODE" icon={Hash} />
        </MotiView>

        <Button 
          title="Save Profile" 
          onPress={() => router.back()} 
          style={{ marginTop: 24, marginBottom: 40 }}
        />
      </ScrollView>
    </TView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    marginTop: Platform.OS === 'ios' ? 40 : 0,
  },
  backBtn: {
    padding: 8,
  },
  scrollContent: {
    padding: 20,
  },
  card: {
    padding: 20,
    borderRadius: RADIUS.xl,
  },
  photoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 32,
  },
  avatarSection: {
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoSection: {
    alignItems: 'center',
  },
  logoBox: {
    width: 120,
    height: 80,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subHeader: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 14,
    marginTop: 24,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 6,
    marginLeft: 4,
    color: 'gray',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
  },
});
