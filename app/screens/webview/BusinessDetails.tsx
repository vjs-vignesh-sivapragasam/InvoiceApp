import React from 'react';
import { StyleSheet, TouchableOpacity, TextInput, ScrollView, Image, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from '@/components/MotiShim';
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
  UploadCloud,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../../../services/supabase';
import { useNotifications } from '../../../components/NotificationProvider';
import * as ImagePicker from 'expo-image-picker';

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
  const { colors, isDark } = useTheme();
  const { showToast } = useNotifications();
  const router = useRouter();

  const [loading, setLoading] = React.useState(false);
  const [profile, setProfile] = React.useState({
    companyName: '',
    ownerName: '',
    gstin: '',
    email: '',
    mobile: '',
    altMobile: '',
    address: '',
    address2: '',
    landmark: '',
    pincode: '',
    bankName: '',
    accountNo: '',
    ifsc: '',
    logo: null,
    ownerPhoto: null
  });

  React.useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const saved = await AsyncStorage.getItem('business_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
           setProfile(prev => ({ ...prev, ...parsed }));
        }
      }
    } catch (storageErr) {
      console.warn('Web storage load failed, checking cloud...', storageErr);
    }

    try {
      console.log('Fetching profile from Supabase (Webview)...');
      const dbProfile = await db.users.getProfile(1);
      console.log('Webview received Supabase profile:', dbProfile);
      
      if (dbProfile) {
        setProfile({
          userid: dbProfile.userid,
          companyName: dbProfile.optional1 || '',
          ownerName: dbProfile.username || '',
          gstin: dbProfile.gstin || '',
          email: dbProfile.emailid || '',
          mobile: dbProfile.mobile || '',
          altMobile: dbProfile.mobile2 || '',
          address: dbProfile.addressline1 || '',
          address2: dbProfile.addressline2 || '',
          landmark: dbProfile.landmark || '',
          pincode: dbProfile.pincode || '',
          bankName: dbProfile.bankaccountname || '',
          accountno: dbProfile.accountno || '',
          ifsc: dbProfile.ifsc || '',
          logo: dbProfile.brandlogo || null,
          ownerPhoto: dbProfile.profilepicture || null
        });
      }
    } catch (e) {
      console.log('Web profile fetch error:', e);
    }
  };

  const pickImage = async (type: 'logo' | 'ownerPhoto') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'ownerPhoto' ? [1, 1] : [3, 2],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setProfile({ ...profile, [type]: base64 });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const userId = profile.userid || 1;
      const dbUpdates = {
        optional1: profile.companyName,
        username: profile.ownerName,
        gstin: profile.gstin,
        emailid: profile.email,
        mobile: profile.mobile,
        mobile2: profile.altMobile,
        addressline1: profile.address,
        addressline2: profile.address2,
        landmark: profile.landmark,
        pincode: profile.pincode,
        bankaccountname: profile.bankName,
        accountno: profile.accountNo,
        ifsc: profile.ifsc,
        brandlogo: profile.logo,
        profilepicture: profile.ownerPhoto
      };

      await db.users.updateProfile(userId, dbUpdates);
      await AsyncStorage.setItem('business_profile', JSON.stringify({ ...profile, userid: userId }));
      showToast('Business Profile Updated!', 'success');
      setTimeout(() => router.back(), 500);
    } catch (e: any) {
      showToast(e.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

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
                <TouchableOpacity 
                   onPress={() => pickImage('logo')}
                   style={[styles.logoUploader, { borderColor: colors.border, backgroundColor: colors.surfaceSecondary, overflow: 'hidden' }]}
                >
                  {profile.logo ? (
                    <Image source={{ uri: profile.logo }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
                  ) : (
                    <>
                      <UploadCloud size={32} color={COLORS.primary} />
                      <TText style={{ fontSize: 12, marginTop: 8 }}>Upload Logo</TText>
                    </>
                  )}
                </TouchableOpacity>
              </View>
              <View style={styles.uploadBox}>
                <TText variant="caption" style={styles.label}>User Picture</TText>
                <TouchableOpacity 
                   onPress={() => pickImage('ownerPhoto')}
                   style={[styles.avatarUploader, { borderColor: colors.border, backgroundColor: colors.surfaceSecondary, overflow: 'hidden' }]}
                >
                  {profile.ownerPhoto ? (
                    <Image source={{ uri: profile.ownerPhoto }} style={{ width: '100%', height: '100%' }} />
                  ) : (
                    <Camera size={24} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.grid}>
              <DetailField label="Company Name" placeholder="Your Company Ltd" icon={Building} value={profile.companyName} onChangeText={v => setProfile({...profile, companyName: v})} />
              <DetailField label="User/Owner Name" placeholder="John Doe" icon={User} value={profile.ownerName} onChangeText={v => setProfile({...profile, ownerName: v})} />
              <DetailField label="Registration / GSTIN" placeholder="22AAAAA0000A1Z5" icon={Hash} value={profile.gstin} onChangeText={v => setProfile({...profile, gstin: v})} />
            </View>
          </View>

          <TView style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Contact Section */}
          <View style={styles.section}>
            <TText variant="subtitle" style={styles.sectionTitle}>Contact & Location</TText>
            <View style={styles.grid}>
              <DetailField label="Email Address" placeholder="hello@company.com" icon={Mail} value={profile.email} onChangeText={v => setProfile({...profile, email: v})} />
              <DetailField label="Mobile Number" placeholder="+1 (555) 000-0000" icon={Phone} value={profile.mobile} onChangeText={v => setProfile({...profile, mobile: v})} />
              <DetailField label="Alternate Mobile" placeholder="+1 (555) 111-1111" icon={Phone} value={profile.altMobile} onChangeText={v => setProfile({...profile, altMobile: v})} />
              <DetailField label="Office Address (Line 1)" placeholder="Street, Building..." icon={MapPin} multiline width="100%" value={profile.address} onChangeText={v => setProfile({...profile, address: v})} />
              <DetailField label="Address (Line 2)" placeholder="Area, City..." icon={MapPin} value={profile.address2} onChangeText={v => setProfile({...profile, address2: v})} />
              <DetailField label="Landmark" placeholder="Nearby point" icon={MapPin} value={profile.landmark} onChangeText={v => setProfile({...profile, landmark: v})} />
              <DetailField label="Pincode" placeholder="000000" icon={Hash} value={profile.pincode} onChangeText={v => setProfile({...profile, pincode: v})} />
            </View>
          </View>

          <TView style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Bank Details Section */}
          <View style={styles.section}>
            <TText variant="subtitle" style={styles.sectionTitle}>Bank Account Details</TText>
            <View style={styles.grid}>
              <DetailField label="Bank Account Name" placeholder="John Doe" icon={User} value={profile.bankName} onChangeText={v => setProfile({...profile, bankName: v})} />
              <DetailField label="Account Number" placeholder="0000 1234 5678" icon={CreditCard} value={profile.accountNo} onChangeText={v => setProfile({...profile, accountNo: v})} />
              <DetailField label="IFSC / SWIFT Code" placeholder="BANK0001234" icon={Hash} value={profile.ifsc} onChangeText={v => setProfile({...profile, ifsc: v})} />
            </View>
          </View>

          <View style={styles.actions}>
            <Button 
              title="Save Changes" 
              onPress={handleSave}
              loading={loading}
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
