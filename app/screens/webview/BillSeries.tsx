import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, TextInput, ActivityIndicator } from 'react-native';
import { TView, TText, useTheme } from '../../../components/ThemedUI';
import { WebLayout } from './WebLayout';
import { COLORS, RADIUS, SHADOWS } from '../../../theme';
import { Hash, Save, ChevronLeft, AlertCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAppConfig } from '../../../components/AppConfigProvider';
import { db } from '../../../services/supabase';

export const BillSeries = () => {
  const { colors } = useTheme();
  const { updateConfig } = useAppConfig();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasTransactions, setHasTransactions] = useState(false);

  const [prefix, setPrefix] = useState('');
  const [delimiter, setDelimiter] = useState('/');
  const [startingNumber, setStartingNumber] = useState('');
  const [currentCount, setCurrentCount] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dbData, transactions] = await Promise.all([
        db.billSeries.get(1),
        db.billing.getAll()
      ]);
      
      setHasTransactions(transactions.length > 0);
      
      if (dbData) {
        setPrefix(dbData.prefix || '');
        setDelimiter(dbData.delimiter || '/');
        setStartingNumber(dbData.startingnumber?.toString() || '');
        setCurrentCount(dbData.currentcount || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getPreview = () => {
    const nextCount = (currentCount + 1).toString().padStart(2, '0');
    return `${prefix}${delimiter}${startingNumber}${delimiter}${nextCount}`;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await db.billSeries.upsert(1, {
        prefix,
        delimiter,
        startingnumber: parseInt(startingNumber) || 1
      });
      updateConfig({
        billSeriesText: prefix,
        billSeriesDelimiter: delimiter,
        billSeriesNumber: startingNumber
      });
      router.back();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <WebLayout><ActivityIndicator size="large" color={COLORS.primary} /></WebLayout>;

  return (
    <WebLayout>
      <TView style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
           <ChevronLeft size={20} color={colors.text} />
           <TText style={{ marginLeft: 8, fontWeight: '600' }}>Back to Settings</TText>
        </TouchableOpacity>
        <TText variant="title" style={{ fontSize: 32, marginTop: 16 }}>Bill No Series</TText>
        <TText variant="caption">Simple configuration for automated sequencing</TText>
      </TView>

      <TView style={styles.contentGrid}>
        <TView style={{ flex: 1.5 }}>
          <TView style={[styles.card, { backgroundColor: colors.card, ...SHADOWS.sm }]}>
            <TText variant="subtitle" style={{ marginBottom: 24 }}>Series Settings</TText>
            
            <View style={styles.fieldGroup}>
              <TText style={styles.label}>Prefix Text</TText>
              <TextInput 
                style={[styles.input, { borderColor: colors.border, backgroundColor: hasTransactions ? 'rgba(0,0,0,0.05)' : colors.surfaceSecondary }]}
                value={prefix}
                editable={!hasTransactions}
                onChangeText={setPrefix}
              />
            </View>

            <View style={styles.fieldGroup}>
              <TText style={styles.label}>Delimiter</TText>
              <TextInput 
                style={[styles.input, { borderColor: colors.border, backgroundColor: hasTransactions ? 'rgba(0,0,0,0.05)' : colors.surfaceSecondary }]}
                value={delimiter}
                editable={!hasTransactions}
                onChangeText={setDelimiter}
              />
            </View>

            <View style={styles.fieldGroup}>
              <TText style={styles.label}>Starting Number/Year</TText>
              <TextInput 
                style={[styles.input, { borderColor: colors.border, backgroundColor: hasTransactions ? 'rgba(0,0,0,0.05)' : colors.surfaceSecondary }]}
                value={startingNumber}
                keyboardType="numeric"
                editable={!hasTransactions}
                onChangeText={setStartingNumber}
              />
            </View>

            <View style={styles.fieldGroup}>
              <TText style={styles.label}>Current Usage Count</TText>
              <TextInput 
                style={[styles.input, { backgroundColor: 'rgba(0,0,0,0.05)' }]}
                value={currentCount.toString().padStart(2, '0')}
                editable={false}
              />
            </View>

            <TouchableOpacity 
              onPress={handleSave}
              disabled={saving || hasTransactions}
              style={[styles.saveBtn, { opacity: (saving || hasTransactions) ? 0.6 : 1 }]}
            >
               {saving ? <ActivityIndicator color="#fff" /> : <><Save size={18} color="#fff" /><TText style={{ color: '#fff', fontWeight: '800', marginLeft: 10 }}>SAVE CONFIGURATION</TText></>}
            </TouchableOpacity>
          </TView>
        </TView>

        <TView style={{ flex: 1 }}>
           <TView style={[styles.previewCard, { backgroundColor: COLORS.primary, ...SHADOWS.md }]}>
              <Hash size={24} color="#fff" />
              <TText style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '900', marginTop: 16, letterSpacing: 2 }}>LIVE PREVIEW</TText>
              <TText style={{ color: '#fff', fontSize: 36, fontWeight: '900', marginTop: 10 }}>{getPreview()}</TText>
              <TView style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.2)', width: '100%', marginVertical: 20 }} />
              <TText style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, textAlign: 'center' }}>
                This is the format for your next generated bill.
              </TText>
           </TView>

           {hasTransactions && (
             <TView style={[styles.card, { backgroundColor: COLORS.danger + '10', marginTop: 24, borderColor: COLORS.danger + '30', borderWidth: 1 }]}>
                <TView style={{ flexDirection: 'row', gap: 12 }}>
                   <AlertCircle size={20} color={COLORS.danger} />
                   <TView style={{ flex: 1 }}>
                      <TText style={{ fontWeight: '700', color: COLORS.danger }}>Editing Locked</TText>
                      <TText variant="caption" style={{ marginTop: 4, color: COLORS.danger }}>Transactions already exist. Series cannot be changed mid-cycle.</TText>
                   </TView>
                </TView>
             </TView>
           )}
        </TView>
      </TView>
    </WebLayout>
  );
};

const styles = StyleSheet.create({
  header: { marginBottom: 40 },
  backBtn: { flexDirection: 'row', alignItems: 'center' },
  contentGrid: { flexDirection: 'row', gap: 32 },
  card: { padding: 32, borderRadius: RADIUS.xl },
  previewCard: { padding: 40, borderRadius: RADIUS.xl, alignItems: 'center' },
  fieldGroup: { marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '700', marginBottom: 10, opacity: 0.7 },
  input: { height: 48, borderWidth: 1, borderRadius: 10, paddingHorizontal: 16, fontSize: 16, fontWeight: '700' },
  saveBtn: { height: 52, backgroundColor: COLORS.primary, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 },
});
