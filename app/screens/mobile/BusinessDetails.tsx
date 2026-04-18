import { MotiView } from '@/components/MotiShim';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import {
  Building,
  Camera,
  ChevronLeft,
  CreditCard,
  Hash,
  Mail,
  MapPin,
  Phone,
  Upload,
  User
} from 'lucide-react-native';
import React from 'react';
import { Image, RefreshControl, SafeAreaView, ScrollView, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Button } from '../../../components/Button';
import { useNotifications } from '../../../components/NotificationProvider';
import { TText, TView, useTheme } from '../../../components/ThemedUI';
import { db } from '../../../services/supabase';
import { COLORS, RADIUS } from '../../../theme';

const MobileField = ({ label, placeholder, icon: Icon, value, onChangeText, multiline, required }: any) => {
  const { colors, isDark } = useTheme();
  return (
    <TView style={styles.fieldGroup}>
      <TView style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TText variant="caption" style={[styles.fieldLabel, { color: isDark ? 'rgba(255,255,255,0.5)' : 'gray' }]}>{label}</TText>
        {required && <TText style={{ color: COLORS.danger, fontSize: 12, marginLeft: 4, marginTop: -6 }}>*</TText>}
      </TView>
      <TView style={[
        styles.inputContainer,
        {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(129, 140, 248, 0.2)' : colors.border,
          height: multiline ? 100 : 52
        }
      ]}>
        <Icon size={18} color={COLORS.primary} style={multiline ? { marginTop: 14 } : {}} />
        <TextInput
          placeholder={placeholder}
          placeholderTextColor={isDark ? 'rgba(255,255,255,0.3)' : '#999'}
          style={[styles.input, { color: colors.text }]}
          value={value}
          onChangeText={onChangeText}
          multiline={multiline}
        />
      </TView>
    </TView>
  );
};

export default function BusinessDetails() {
  const { colors, isDark } = useTheme();
  const { showToast } = useNotifications();
  const router = useRouter();

  const [loading, setLoading] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);
  const [profile, setProfile] = React.useState({
    userid: 1,
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

  const loadProfile = React.useCallback(async () => {
    // 1. Try Loading from Local Cache (Fast)
    try {
      const saved = await AsyncStorage.getItem('business_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          setProfile(prev => ({ ...prev, ...parsed }));
        }
      }
    } catch (storageErr) {
      console.warn('Local storage load failed, checking cloud...', storageErr);
    }

    // 2. Sync to Supabase (Source of Truth)
    try {
      console.log('Attempting to fetch profile from Supabase for ID: 1');
      const dbProfile = await db.users.getProfile(1);
      console.log('Supabase Profile Data Received:', dbProfile);

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
          accountNo: dbProfile.accountno || '',
          ifsc: dbProfile.ifsc || '',
          logo: dbProfile.brandlogo || null,
          ownerPhoto: dbProfile.profilepicture || null
        });
        console.log('Profile loaded from Supabase');
      }
    } catch (e) {
      console.log('Supabase profile sync notice:', e);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadProfile();
  }, [loadProfile]);

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

      console.log('Sending Profile Update:', { userId, dbUpdates });
      const result = await db.users.updateProfile(userId, dbUpdates);
      console.log('Profile Update Result:', result);

      try {
        await AsyncStorage.setItem('business_profile', JSON.stringify({ ...profile, userid: userId }));
      } catch (storageErr) {
        console.warn('AsyncStorage failed, profile only saved to DB:', storageErr);
      }

      showToast('Business Profile Updated!', 'success');
      setTimeout(() => router.back(), 500);
    } catch (e: any) {
      console.error('Save failed:', e);
      showToast(e.message || 'Failed to save profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async (type: 'logo' | 'ownerPhoto') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'ownerPhoto' ? [1, 1] : [3, 2],
      quality: 0.5, // Reduced quality for DB storage
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
      setProfile({ ...profile, [type]: base64 });
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TView style={[styles.header, { borderBottomColor: isDark ? 'rgba(129, 140, 248, 0.2)' : colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <TText variant="subtitle" style={{ fontWeight: '900' }}>Business Profile</TText>
        <TView style={{ width: 40 }} />
      </TView>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        <MotiView
          from={{ opacity: 0, translateY: 30 }}
          animate={{ opacity: 1, translateY: 0 }}
          style={[
            styles.card,
            {
              backgroundColor: 'transparent',
              borderWidth: 1.5,
              borderColor: isDark ? 'rgba(129, 140, 248, 0.4)' : colors.border
            }
          ]}
        >
          {/* Photos */}
          <TView style={styles.photoContainer}>
            <TView style={styles.avatarSection}>
              <TouchableOpacity
                onPress={() => pickImage('ownerPhoto')}
                style={[styles.avatar, { backgroundColor: isDark ? 'rgba(129, 140, 248, 0.1)' : colors.surfaceSecondary, borderWidth: 1, borderColor: isDark ? 'rgba(129, 140, 248, 0.2)' : colors.border }]}
              >
                {profile.ownerPhoto ? (
                  <Image source={{ uri: profile.ownerPhoto }} style={StyleSheet.absoluteFill} />
                ) : (
                  <Camera size={24} color={COLORS.primary} />
                )}
              </TouchableOpacity>
              <TText style={{ fontSize: 10, fontWeight: '800', marginTop: 8, color: colors.textSecondary }}>OWNER PHOTO</TText>
            </TView>
            <TView style={styles.logoSection}>
              <TouchableOpacity
                onPress={() => pickImage('logo')}
                style={[styles.logoBox, { backgroundColor: isDark ? 'rgba(129, 140, 248, 0.1)' : colors.surfaceSecondary, borderColor: isDark ? 'rgba(129, 140, 248, 0.3)' : colors.border }]}
              >
                {profile.logo ? (
                  <Image source={{ uri: profile.logo }} style={{ width: '100%', height: '100%', borderRadius: RADIUS.md }} />
                ) : (
                  <>
                    <Upload size={24} color={COLORS.primary} />
                    <TText style={{ fontSize: 10, fontWeight: '800', marginTop: 4, color: COLORS.primary }}>LOGO</TText>
                  </>
                )}
              </TouchableOpacity>
              <TText style={{ fontSize: 10, fontWeight: '800', marginTop: 8, color: colors.textSecondary }}>BUSINESS BRANDING</TText>
            </TView>
          </TView>

          <TText variant="subtitle" style={styles.subHeader}>Primary Info</TText>
          <MobileField label="COMPANY NAME" required placeholder="Ex: Digital Solutions" icon={Building} value={profile.companyName} onChangeText={(v: string) => setProfile({ ...profile, companyName: v })} />
          <MobileField label="USERNAME" required placeholder="John Doe" icon={User} value={profile.ownerName} onChangeText={(v: string) => setProfile({ ...profile, ownerName: v })} />
          <MobileField label="GSTIN / VAT" placeholder="Enter Registration No." icon={Hash} value={profile.gstin} onChangeText={(v: string) => setProfile({ ...profile, gstin: v })} />

          <TText variant="subtitle" style={styles.subHeader}>Communication</TText>
          <MobileField label="EMAIL ID" required placeholder="contact@business.com" icon={Mail} value={profile.email} onChangeText={(v: string) => setProfile({ ...profile, email: v })} />
          <MobileField label="MOBILE NO." required placeholder="+1 000 000 000" icon={Phone} value={profile.mobile} onChangeText={(v: string) => setProfile({ ...profile, mobile: v })} />
          <MobileField label="ALTERNATE MOBILE" placeholder="+1 111 111 111" icon={Phone} value={profile.altMobile} onChangeText={(v: string) => setProfile({ ...profile, altMobile: v })} />
          <MobileField label="OFFICE ADDRESS (LINE 1)" placeholder="Street, Building No..." icon={MapPin} multiline value={profile.address} onChangeText={(v: string) => setProfile({ ...profile, address: v })} />
          <MobileField label="ADDRESS (LINE 2)" placeholder="Area, Landmark..." icon={MapPin} value={profile.address2} onChangeText={(v: string) => setProfile({ ...profile, address2: v })} />
          <MobileField label="LANDMARK" placeholder="Nearby famous spot" icon={MapPin} value={profile.landmark} onChangeText={(v: string) => setProfile({ ...profile, landmark: v })} />
          <MobileField label="PINCODE / ZIP" placeholder="000 000" icon={Hash} value={profile.pincode} onChangeText={(v: string) => setProfile({ ...profile, pincode: v })} />

          <TText variant="subtitle" style={styles.subHeader}>Finance & Banking</TText>
          <MobileField label="BANK ACCOUNT NAME" placeholder="Business Name" icon={User} value={profile.bankName} onChangeText={(v: string) => setProfile({ ...profile, bankName: v })} />
          <MobileField label="ACCOUNT NUMBER" placeholder="0000 0000 0000" icon={CreditCard} value={profile.accountNo} onChangeText={(v: string) => setProfile({ ...profile, accountNo: v })} />
          <MobileField label="IFSC / SWIFT" placeholder="IFSC CODE" icon={Hash} value={profile.ifsc} onChangeText={(v: string) => setProfile({ ...profile, ifsc: v })} />
        </MotiView>

        <Button
          title="Update Business Profile"
          onPress={handleSave}
          loading={loading}
          style={{ marginTop: 24, marginBottom: 40 }}
        />
      </ScrollView>
    </SafeAreaView>
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
    marginTop: 5
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
