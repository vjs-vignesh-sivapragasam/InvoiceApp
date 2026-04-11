import React from 'react';
import { StyleSheet, TouchableOpacity, TextInput, ScrollView, Image, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { TView, TText, useTheme } from '../../../components/ThemedUI';
import { WebLayout } from './WebLayout';
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
  UploadCloud
} from 'lucide-react-native';

const DetailField = ({ label, placeholder, icon: Icon, value, onChangeText, multiline, width = '48%' }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.inputGroup, { width }]}>
      <TText variant="caption" style={styles.label}>{label}</TText>
      <TView style={[styles.inputWrapper, { backgroundColor: colors.surfaceSecondary, height: multiline ? 80 : 48 }]}>
        <Icon size={18} color={colors.textSecondary} style={multiline ? { marginTop: 12 } : {}} />
        <TextInput 
          placeholder={placeholder} 
          style={[styles.input, { color: colors.text, height: '100%' }]} 
          value={value}
          onChangeText={onChangeText}
          multiline={multiline}
        />
      </TView>
    </View>
  );
};

export const BusinessDetails = () => {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <WebLayout>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View>
          <TText variant="title">Business Profile</TText>
          <TText variant="caption">Manage your company information and billing details</TText>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <MotiView 
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          style={[styles.formCard, { backgroundColor: colors.card, ...SHADOWS.sm }]}
        >
          {/* Identity Section */}
          <View style={styles.section}>
            <TText variant="subtitle" style={styles.sectionTitle}>Company Identity</TText>
            <View style={styles.imageUploadGrid}>
              <View style={styles.uploadBox}>
                <TText variant="caption" style={styles.label}>Company Logo</TText>
                <TouchableOpacity style={[styles.logoUploader, { borderColor: colors.border, backgroundColor: colors.surfaceSecondary }]}>
                  <UploadCloud size={32} color={COLORS.primary} />
                  <TText style={{ fontSize: 12, marginTop: 8 }}>Upload Logo</TText>
                </TouchableOpacity>
              </View>
              <View style={styles.uploadBox}>
                <TText variant="caption" style={styles.label}>User Picture</TText>
                <TouchableOpacity style={[styles.avatarUploader, { borderColor: colors.border, backgroundColor: colors.surfaceSecondary }]}>
                  <Camera size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.grid}>
              <DetailField label="Company Name" placeholder="Your Company Ltd" icon={Building} />
              <DetailField label="User/Owner Name" placeholder="John Doe" icon={User} />
              <DetailField label="Registration / GSTIN" placeholder="22AAAAA0000A1Z5" icon={Hash} />
            </View>
          </View>

          <TView style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Contact Section */}
          <View style={styles.section}>
            <TText variant="subtitle" style={styles.sectionTitle}>Contact & Location</TText>
            <View style={styles.grid}>
              <DetailField label="Email Address" placeholder="hello@company.com" icon={Mail} />
              <DetailField label="Mobile Number" placeholder="+1 (555) 000-0000" icon={Phone} />
              <DetailField label="Alternate Mobile" placeholder="+1 (555) 111-1111" icon={Phone} />
              <DetailField label="Office Address" placeholder="Street, Building, City, ZIP" icon={MapPin} multiline width="100%" />
            </View>
          </View>

          <TView style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Bank Details Section */}
          <View style={styles.section}>
            <TText variant="subtitle" style={styles.sectionTitle}>Bank Account Details</TText>
            <View style={styles.grid}>
              <DetailField label="Bank Account Name" placeholder="John Doe" icon={User} />
              <DetailField label="Account Number" placeholder="0000 1234 5678" icon={CreditCard} />
              <DetailField label="IFSC / SWIFT Code" placeholder="BANK0001234" icon={Hash} />
            </View>
          </View>

          <View style={styles.actions}>
            <Button 
              title="Save Changes" 
              onPress={() => router.back()}
              style={{ width: 220, height: 50 }}
            />
          </View>
        </MotiView>
      </ScrollView>
    </WebLayout>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    gap: 16,
  },
  backBtn: {
    padding: 8,
  },
  content: {
    alignItems: 'center',
    paddingBottom: 60,
  },
  formCard: {
    width: '100%',
    maxWidth: 900,
    padding: 40,
    borderRadius: RADIUS.xl,
  },
  section: {
    marginBottom: 40,
  },
  sectionTitle: {
    marginBottom: 32,
    color: COLORS.primary,
    fontWeight: '700',
  },
  imageUploadGrid: {
    flexDirection: 'row',
    gap: 40,
    marginBottom: 32,
  },
  uploadBox: {
    gap: 12,
  },
  logoUploader: {
    width: 160,
    height: 100,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarUploader: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
  },
  input: {
    flex: 1,
    marginLeft: 12,
  },
  divider: {
    height: 1,
    marginVertical: 40,
    opacity: 0.3,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
});
