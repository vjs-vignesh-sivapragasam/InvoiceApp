import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
   Delete,
   XCircle
} from 'lucide-react-native';
import React, { useState, useEffect } from 'react';
import {
   ActivityIndicator,
   Dimensions,
   StatusBar,
   StyleSheet,
   TouchableOpacity,
   View,
   Image,
   ScrollView,
   SafeAreaView
} from 'react-native';
import { TText } from '../../../components/ThemedUI';
import { db } from '../../../services/supabase';

const { width, height } = Dimensions.get('window');

// Design System
const THEME = {
   colors: {
      background: '#020617',
      primary: '#6366F1',
      primaryLight: '#818CF8',
      danger: '#EF4444',
      gray300: '#CBD5E1',
   },
   gradients: {
      primary: ['#6366F1', '#4F46E5'],
      background: ['#020617', '#0F172A'],
   }
} as const;

const PinSlot = ({ value, focused, error }: { value: string; focused: boolean; error: boolean }) => (
   <View 
      style={[
        styles.pinSlot,
        { 
          borderColor: error ? THEME.colors.danger : (focused ? THEME.colors.primaryLight : 'rgba(139, 149, 186, 0.2)'),
          backgroundColor: error ? 'rgba(239, 68, 68, 0.1)' : (focused ? 'rgba(99, 102, 241, 0.1)' : 'rgba(30, 39, 73, 0.3)'),
          transform: [{ scale: focused ? 1.1 : 1 }]
        }
      ]}
   >
      {value ? (
         <View 
            style={[styles.pinDot, { backgroundColor: error ? THEME.colors.danger : '#fff' }]} 
         />
      ) : focused ? (
         <View 
            style={styles.cursor} 
         />
      ) : null}
   </View>
);

const Key = ({ val, onPress, icon: Icon, color }: any) => (
   <TouchableOpacity 
      onPress={() => onPress(val)} 
      style={styles.key}
      activeOpacity={0.7}
   >
      {Icon ? <Icon size={24} color={color || '#fff'} /> : <TText style={styles.keyText}>{val}</TText>}
   </TouchableOpacity>
);

export default function LoginScreen() {
   const router = useRouter();
   const [pin, setPin] = useState('');
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState(false);

   useEffect(() => {
      if (pin.length === 4) handleLogin(pin);
   }, [pin]);

   const handleLogin = async (code: string) => {
      setLoading(true);
      setError(false);
      try {
         const user = await db.users.login('admin', code);
         if (user) {
            router.replace('/(tabs)/dashboard');
         } else {
            setError(true);
            setTimeout(() => { setError(false); setPin(''); }, 1000);
         }
      } catch (e) {
         setError(true);
         setPin('');
      } finally {
         setLoading(false);
      }
   };

   const handleKeyPress = (val: string) => {
      if (loading) return;
      if (val === 'DEL') setPin(p => p.slice(0, -1));
      else if (val === 'CLR') setPin('');
      else if (pin.length < 4) setPin(p => p + val);
   };

   return (
      <View style={styles.container}>
         <StatusBar barStyle="light-content" />
         <LinearGradient colors={THEME.gradients.background} style={StyleSheet.absoluteFill} />

         <SafeAreaView style={{ flex: 1 }}>
            <ScrollView 
               contentContainerStyle={styles.scrollContent}
               showsVerticalScrollIndicator={false}
            >
               <View style={styles.content}>
                <View style={styles.hero}>
                     <View style={styles.logoContainer}>
                        <Image source={require('../../../assets/images/icon.png')} style={styles.logoImage} resizeMode="contain" />
                     </View>
                     <TText style={styles.title}>Welcome Back</TText>
                     <TText style={styles.subtitle}>Enter security PIN to continue</TText>
                  </View>

                  <View style={styles.pinContainer}>
                     {[0, 1, 2, 3].map((i) => (
                        <PinSlot key={i} value={pin[i]} focused={pin.length === i} error={error} />
                     ))}
                  </View>

                  <View style={styles.padContainer}>
                     {[["1", "2", "3"], ["4", "5", "6"], ["7", "8", "9"]].map((row, rid) => (
                        <View key={rid} style={styles.row}>
                           {row.map(k => <Key key={k} val={k} onPress={handleKeyPress} />)}
                        </View>
                     ))}
                     <View style={styles.row}>
                        <Key val="CLR" onPress={handleKeyPress} icon={XCircle} color={THEME.colors.danger} />
                        <Key val="0" onPress={handleKeyPress} />
                        <Key val="DEL" onPress={handleKeyPress} icon={Delete} />
                     </View>
                  </View>

                  {loading && (
                     <View style={styles.loader}>
                        <ActivityIndicator size="small" color={THEME.colors.primaryLight} />
                        <TText style={styles.loadingText}>Verifying Access...</TText>
                     </View>
                  )}

                  <TouchableOpacity 
                     onPress={() => router.replace('/(tabs)/dashboard')} 
                     style={styles.devLink}
                  >
                     <TText style={styles.devText}>Skip for Development →</TText>
                  </TouchableOpacity>
               </View>
            </ScrollView>
         </SafeAreaView>
      </View>
   );
}

const styles = StyleSheet.create({
   container: { flex: 1, backgroundColor: THEME.colors.background },
   scrollContent: { flexGrow: 1 },
   content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40, minHeight: height - 100 },
   hero: { alignItems: 'center', marginBottom: 30 },
   logoContainer: { width: 90, height: 90, justifyContent: 'center', alignItems: 'center', marginBottom: 15, shadowColor: THEME.colors.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 12 },
   logoImage: { width: '100%', height: '100%' },
   title: { fontSize: 30, fontWeight: '900', color: '#fff', marginBottom: 4 },
   subtitle: { fontSize: 13, color: THEME.colors.gray300, fontWeight: '600', opacity: 0.6, letterSpacing: 0.5 },
   pinContainer: { flexDirection: 'row', gap: 12, marginBottom: 40 },
   pinSlot: { width: 55, height: 70, borderRadius: 16, borderWidth: 1.5, justifyContent: 'center', alignItems: 'center' },
   pinDot: { width: 14, height: 14, borderRadius: 7 },
   cursor: { width: 2, height: 25, backgroundColor: THEME.colors.primaryLight },
   padContainer: { width: width * 0.85, gap: 12 },
   row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
   key: { flex: 1, height: 75, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.03)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)' },
   keyText: { fontSize: 26, fontWeight: '700', color: '#fff' },
   loader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 40 },
   loadingText: { color: THEME.colors.primaryLight, fontWeight: '700', fontSize: 13, letterSpacing: 1 },
   devLink: { marginTop: 40, padding: 10, marginBottom: 20 },
   devText: { color: THEME.colors.gray300, fontSize: 12, fontWeight: '700', opacity: 0.4, letterSpacing: 1.5, textTransform: 'uppercase' }
});
