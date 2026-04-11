import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { TView, TText, useTheme } from '../../../components/ThemedUI';
import { Button } from '../../../components/Button';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../../../theme';
import { ChevronLeft, CheckCircle2, Layout } from 'lucide-react-native';

const MobileTemplates = () => {
  const { colors } = useTheme();
  const router = useRouter();
  const [selected, setSelected] = useState('1');

  return (
    <TView style={[styles.container, { backgroundColor: colors.background }]}>
      <TView style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <TText variant="subtitle">Invoice Designs</TText>
        <TView style={{ width: 40 }} />
      </TView>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TText variant="caption" style={{ marginBottom: 20, textAlign: 'center' }}>
          Swipe and select your preferred template
        </TText>
        
        {['1', '2', '3'].map((id, i) => (
          <TouchableOpacity 
            key={id} 
            onPress={() => setSelected(id)}
            style={[
              styles.card, 
              { backgroundColor: colors.card, borderColor: selected === id ? COLORS.primary : 'transparent' },
              SHADOWS.md
            ]}
          >
            <TView style={styles.preview}>
               <TView style={[styles.pLine, { width: '40%', height: 10, backgroundColor: COLORS.primary }]} />
               <TView style={[styles.pLine, { width: '100%', marginTop: 20 }]} />
               <TView style={[styles.pLine, { width: '80%' }]} />
               <TView style={styles.spacer} />
               <TView style={[styles.pLine, { width: '100%', height: 30, backgroundColor: COLORS.primary + '20' }]} />
            </TView>
            <TView style={styles.cardInfo}>
               <TText style={{ fontWeight: '700' }}>Template Style {id}</TText>
               {selected === id && <CheckCircle2 size={24} color={COLORS.primary} />}
            </TView>
          </TouchableOpacity>
        ))}

        <Button 
          title="Save as Default" 
          onPress={() => router.back()} 
          style={{ marginTop: 20, marginBottom: 40 }}
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
    borderRadius: RADIUS.xl,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
  },
  preview: {
    height: 180,
    backgroundColor: '#fff',
    borderRadius: RADIUS.md,
    padding: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  pLine: {
    height: 6,
    backgroundColor: '#f5f5f5',
    marginBottom: 8,
    borderRadius: 3,
  },
  spacer: {
    flex: 1,
  },
  cardInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
});

export default MobileTemplates;
