import React, { useState, useEffect } from 'react';
import { Modal, StyleSheet, TouchableOpacity, ScrollView, View, Platform } from 'react-native';
import { TView, TText, useTheme } from './ThemedUI';
import { COLORS, RADIUS, SHADOWS } from '../theme';
import { X, ChevronDown } from 'lucide-react-native';

interface Props {
  visible: boolean;
  value: string; // YYYY-MM-DD
  onClose: () => void;
  onChange: (date: string) => void;
}

export const DateDropdown = ({ visible, value, onClose, onChange }: Props) => {
  const { colors, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'D' | 'M' | 'Y'>('D');
  
  const [day, setDay] = useState('01');
  const [month, setMonth] = useState('01');
  const [year, setYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    if (visible && value) {
      const parts = value.split('-');
      if (parts.length === 3) {
        setYear(parts[0]);
        setMonth(parts[1]);
        setDay(parts[2]);
      }
      setActiveTab('D');
    }
  }, [visible, value]);

  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const months = [
    { label: 'Jan', value: '01' }, { label: 'Feb', value: '02' }, { label: 'Mar', value: '03' },
    { label: 'Apr', value: '04' }, { label: 'May', value: '05' }, { label: 'Jun', value: '06' },
    { label: 'Jul', value: '07' }, { label: 'Aug', value: '08' }, { label: 'Sep', value: '09' },
    { label: 'Oct', value: '10' }, { label: 'Nov', value: '11' }, { label: 'Dec', value: '12' }
  ];
  const years = Array.from({ length: 12 }, (_, i) => (new Date().getFullYear() - 6 + i).toString());

  const handleSave = () => {
    onChange(`${year}-${month}-${day}`);
    onClose();
  };

  const renderContent = () => {
    if (activeTab === 'D') {
      return (
        <View style={styles.gridContainer}>
          {days.map(d => (
            <TouchableOpacity 
              key={d} 
              onPress={() => setDay(d)} 
              style={[styles.gridItem, day === d && styles.activeItem, { borderColor: colors.border }]}
            >
              <TText style={[styles.itemText, day === d && styles.activeItemText]}>{d}</TText>
            </TouchableOpacity>
          ))}
        </View>
      );
    }
    if (activeTab === 'M') {
      return (
        <View style={styles.gridContainer}>
          {months.map(m => (
            <TouchableOpacity 
              key={m.value} 
              onPress={() => setMonth(m.value)} 
              style={[styles.gridItem, { width: '30%' }, month === m.value && styles.activeItem, { borderColor: colors.border }]}
            >
              <TText style={[styles.itemText, month === m.value && styles.activeItemText]}>{m.label}</TText>
            </TouchableOpacity>
          ))}
        </View>
      );
    }
    return (
      <View style={styles.gridContainer}>
        {years.map(y => (
          <TouchableOpacity 
            key={y} 
            onPress={() => setYear(y)} 
            style={[styles.gridItem, { width: '30%' }, year === y && styles.activeItem, { borderColor: colors.border }]}
          >
            <TText style={[styles.itemText, year === y && styles.activeItemText]}>{y}</TText>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        <TView style={[styles.container, { backgroundColor: colors.card, ...SHADOWS.lg }]}>
          <View style={styles.header}>
            <View>
              <TText style={styles.title}>Select Date</TText>
              <TText variant="caption">Tap to change values</TText>
            </View>
            <View style={styles.tabBar}>
               <TouchableOpacity onPress={() => setActiveTab('D')} style={[styles.tab, activeTab === 'D' && styles.activeTab]}><TText style={[styles.tabTxt, activeTab === 'D' && styles.activeTabTxt]}>{day}</TText></TouchableOpacity>
               <TouchableOpacity onPress={() => setActiveTab('M')} style={[styles.tab, activeTab === 'M' && styles.activeTab]}><TText style={[styles.tabTxt, activeTab === 'M' && styles.activeTabTxt]}>{months.find(m => m.value === month)?.label}</TText></TouchableOpacity>
               <TouchableOpacity onPress={() => setActiveTab('Y')} style={[styles.tab, activeTab === 'Y' && styles.activeTab]}><TText style={[styles.tabTxt, activeTab === 'Y' && styles.activeTabTxt]}>{year}</TText></TouchableOpacity>
            </View>
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={false} 
            style={{ maxHeight: 300 }}
            contentContainerStyle={styles.contentArea}
          >
            {renderContent()}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={[styles.btn, { backgroundColor: 'transparent' }]}><TText style={{ fontWeight: '800', opacity: 0.5 }}>CANCEL</TText></TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={[styles.btn, { backgroundColor: COLORS.primary, flex: 1 }]}><TText style={{ color: '#fff', fontWeight: '900' }}>DONE</TText></TouchableOpacity>
          </View>
        </TView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  container: { width: '92%', maxWidth: 360, borderRadius: 28, padding: 16 },
  header: { marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '900', textAlign: 'center', marginBottom: 12 },
  tabBar: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: 16, padding: 4, alignSelf: 'center' },
  tab: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  activeTab: { backgroundColor: '#fff', ...SHADOWS.sm },
  tabTxt: { fontSize: 13, fontWeight: '800', opacity: 0.5 },
  activeTabTxt: { opacity: 1, color: COLORS.primary },
  contentArea: { minHeight: 280, justifyContent: 'center', paddingVertical: 10 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
  gridItem: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center', borderRadius: 12, borderWidth: 1 },
  activeItem: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  itemText: { fontSize: 14, fontWeight: '700', opacity: 0.7 },
  activeItemText: { color: '#fff', fontWeight: '900', opacity: 1 },
  footer: { flexDirection: 'row', gap: 12, marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  btn: { height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }
});
