import { useRouter } from 'expo-router';
import { CheckCircle2, ChevronLeft, Eye, Layout, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Modal, Platform, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useAppConfig } from '../../../components/AppConfigProvider';
import { Button } from '../../../components/Button';
import { useNotifications } from '../../../components/NotificationProvider';
import { Design1 } from '../../../components/templates/Design1';
import { TText, TView, useTheme } from '../../../components/ThemedUI';
import { COLORS, RADIUS } from '../../../theme';

const MobileTemplates = () => {
  const { colors, isDark } = useTheme();
  const { config, updateConfig } = useAppConfig();
  const { showToast } = useNotifications();
  const router = useRouter();

  // Use config.defaultTemplate or default to '1'
  const [selected, setSelected] = useState('1');
  const [showPreview, setShowPreview] = useState(false);

  // Mock data for previewing Design 1
  const mockData = {
    business: {
      name: 'MK AGENCY',
      address: '6, 1st cross, Iyyanar Kovil Street,',
      address2: 'Duruga Nagar, Kombakkam, Puducherry',
      mobile: '+91 9791858965',
      gstin: '34CEBPG0848B1Z5',
      bankName: 'INDIAN OVERSEAS BANK',
      accountNo: '360502000000219',
      ifsc: 'IOBA0003605'
    },
    client: {
      clientname: 'LE CAFE',
      description: 'A unit of PTDC, Govt of Puducherry',
      addressline1: 'Beach Road, Puducherry 605001',
      mobile: '04132917949',
      gstin: '34AADCP5609G1ZK'
    },
    billNo: 'INV/2024/001',
    billDate: '11/04/2026',
    items: [
      { name: '50W LED DRIVER', hsn: '8504', box: '1', pieces: '50', price: '120.00', cgst: '540.00', sgst: '540.00', rate: '138.00', amount: '6900.00' },
      { name: 'WATERPROOF CASE', hsn: '3926', box: '2', pieces: '100', price: '45.00', cgst: '405.00', sgst: '405.00', rate: '53.10', amount: '5310.00' }
    ],
    summary: {
      totalQty: '150',
      beforeTax: '10,500.00',
      totalAmount: '12,210.00',
      afterTax: '12,210.00'
    },
    docType: 'invoice'
  };

  const handleSave = () => {
    updateConfig({ defaultTemplate: '1' });
    showToast('Template design updated!', 'success');
    router.back();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TView style={[styles.header, { borderBottomColor: isDark ? 'rgba(129, 140, 248, 0.2)' : colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <TText variant="subtitle" style={{ fontWeight: '900' }}>Invoice Designs</TText>
        <TView style={{ width: 40 }} />
      </TView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TText variant="caption" style={{ marginBottom: 30, textAlign: 'center', fontWeight: '800' }}>
          VERIFY YOUR DEFAULT CORPORATE TEMPLATE
        </TText>

        <TouchableOpacity
          onPress={() => setSelected('1')}
          style={[
            styles.card,
            {
              backgroundColor: 'transparent',
              borderColor: COLORS.primary,
              borderWidth: 2
            }
          ]}
        >
          <TView style={[styles.previewArea, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#fff', borderColor: isDark ? 'rgba(255,255,255,0.05)' : '#eee' }]}>
            <Layout size={32} color={COLORS.primary} strokeWidth={2.5} />
            <TText style={{ marginTop: 15, fontWeight: '800', color: colors.textSecondary }}>DESIGN 1: STANDARD TAX LAYOUT</TText>
          </TView>
          <TView style={styles.cardInfo}>
            <TView>
              <TText style={{ fontWeight: '900', fontSize: 18 }}>Premium Design 01</TText>
              <TText variant="caption" style={{ fontSize: 11, fontWeight: '600' }}>Strict compliance for GST & Invoicing</TText>
            </TView>
            <CheckCircle2 size={24} color={COLORS.primary} />
          </TView>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowPreview(true)}
          style={[styles.previewBtn, { borderColor: COLORS.primary + '40' }]}
        >
          <Eye size={18} color={COLORS.primary} />
          <TText style={{ color: COLORS.primary, fontWeight: '800', marginLeft: 10 }}>View Design Preview</TText>
        </TouchableOpacity>

        <Button
          title="Apply Template"
          onPress={handleSave}
          style={{ marginTop: 30, marginBottom: 40 }}
        />
      </ScrollView>

      {/* Preview Modal */}
      <Modal visible={showPreview} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={styles.modalHeader}>
            <TText style={{ fontWeight: '900' }}>LAYOUT PREVIEW</TText>
            <TouchableOpacity onPress={() => setShowPreview(false)} style={styles.closeBtn}>
              <X size={24} color="#000" />
            </TouchableOpacity>
          </View>
          <ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TView style={{ width: 850 }}>
                <Design1 data={mockData} />
              </TView>
            </ScrollView>
            <TView style={{ padding: 20 }}>
              <Button
                title="CLOSE PREVIEW"
                onPress={() => setShowPreview(false)}
                style={{ backgroundColor: '#333' }}
              />
            </TView>
            <View style={{ height: 50 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: 1, marginTop: Platform.OS === 'ios' ? 40 : 0 },
  backBtn: { padding: 8 },
  scrollContent: { padding: 20 },
  card: { borderRadius: RADIUS.xl, padding: 25, marginBottom: 20 },
  previewArea: { height: 180, borderRadius: RADIUS.lg, padding: 16, borderWidth: 1, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  cardInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
  previewBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 50, borderRadius: RADIUS.lg, borderWidth: 1, marginTop: 10 },
  modalHeader: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, borderBottomWidth: 1, borderColor: '#eee' },
  closeBtn: { padding: 8 },
});

export default MobileTemplates;
