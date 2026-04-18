import { useRouter } from 'expo-router';
import {
  CheckCircle2,
  ChevronLeft,
  FileText
} from 'lucide-react-native';
import { MotiView } from '@/components/MotiShim';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button } from '../../../components/Button';
import { useNotifications } from '../../../components/NotificationProvider';
import { Design1 } from '../../../components/templates/Design1';
import { TText, TView, useTheme } from '../../../components/ThemedUI';
import { COLORS, RADIUS, SHADOWS } from '../../../theme';
import { WebLayout } from '../webview/WebLayout';

const TEMPLATES = [
  { id: '1', name: 'Template Design 1', color: '#000000', type: 'Professional Grid' },
];

const MOCK_DATA = {
  business: { name: 'MK AGENCY', address: '6, 1st cross, Puducherry', mobile: '+91 9791858965', gstin: '34CEBPG0848B1Z5' },
  client: { name: 'LE CAFE', address: 'Beach Road, Puducherry 605001', mobile: '04132917949', gstin: '34AADCP5609G1ZK' },
  billNo: 'MK23-4',
  billDate: '30/12/2023',
  items: [
    { name: 'Springs Water - 1 Ltr', hsn: '2201', box: '60', pieces: '720', price: '7.77', cgst: '0.70', sgst: '0.70', rate: '9.17', amount: '6602.40' }
  ],
  summary: { totalQty: '720', totalAmount: '6602.40', beforeTax: '5594.40', afterTax: '6602.40' }
};

export const Templates = () => {
  const { colors } = useTheme();
  const { showToast } = useNotifications();
  const router = useRouter();
  const [selected, setSelected] = useState('1');

  const handleSave = () => {
    showToast('Template preferences saved!');
    router.back();
  };

  return (
    <WebLayout>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View>
          <TText variant="title">Layout & Templates</TText>
          <TText variant="caption">Instantly preview and select your official invoice design</TText>
        </View>
      </View>

      <View style={styles.mainContainer}>
        {/* Left Sidebar: Selector */}
        <View style={styles.sidebar}>
          <TText variant="subtitle" style={{ marginBottom: 20 }}>Select Template</TText>
          {TEMPLATES.map((tpl) => (
            <TouchableOpacity
              key={tpl.id}
              onPress={() => setSelected(tpl.id)}
              style={[
                styles.tplItem,
                {
                  backgroundColor: colors.card,
                  borderColor: selected === tpl.id ? COLORS.primary : colors.border
                }
              ]}
            >
              <TView style={[styles.iconBox, { backgroundColor: selected === tpl.id ? COLORS.primary : colors.surfaceSecondary }]}>
                <FileText size={20} color={selected === tpl.id ? '#fff' : COLORS.primary} />
              </TView>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <TText style={{ fontWeight: '700', color: selected === tpl.id ? COLORS.primary : colors.text }}>{tpl.name}</TText>
                <TText variant="caption">{tpl.type}</TText>
              </View>
              {selected === tpl.id && <CheckCircle2 size={18} color={COLORS.primary} />}
            </TouchableOpacity>
          ))}

          <View style={{ marginTop: 'auto', gap: 12 }}>
            <Button title="Save Preferences" onPress={handleSave} />
          </View>
        </View>

        {/* Right Section: Live Preview (No Clicks Needed) */}
        <TView style={[styles.previewArea, { backgroundColor: colors.card, ...SHADOWS.sm }]}>
          <View style={styles.previewHeader}>
            <TText variant="subtitle">Live System Preview</TText>
            <View style={styles.badge}><TText style={styles.badgeText}>PIXEL PERFECT</TText></View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.previewScroll}>
            <MotiView
              key={selected}
              from={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              style={[styles.paperOverlay, { ...SHADOWS.lg }]}
            >
              <Design1 data={MOCK_DATA} />
            </MotiView>
          </ScrollView>
        </TView>
      </View>
    </WebLayout>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, paddingLeft: 8 },
  backBtn: { marginRight: 16, padding: 8, borderRadius: RADIUS.md },
  mainContainer: { flexDirection: 'row', gap: 40, flex: 1 },
  sidebar: { width: 320, paddingTop: 10 },
  tplItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: RADIUS.xl,
    borderWidth: 2,
    marginBottom: 12
  },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  previewArea: { flex: 1, borderRadius: RADIUS.xl, borderLeftWidth: 1, borderLeftColor: 'rgba(0,0,0,0.05)' },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)'
  },
  badge: { backgroundColor: COLORS.primary + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: COLORS.primary, fontSize: 10, fontWeight: '800' },
  previewScroll: { paddingVertical: 40, paddingHorizontal: 20, alignItems: 'center' },
  paperOverlay: { width: '100%', maxWidth: 842, backgroundColor: '#fff', elevation: 10 },
});
