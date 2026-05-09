import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { COLORS, RADIUS } from '../theme';
import { TText, TView, useTheme } from './ThemedUI';

interface Props {
  visible: boolean;
  value: string; // YYYY-MM-DD
  onClose: () => void;
  onChange: (date: string) => void;
}

export const SimpleDatePicker = ({ visible, value, onClose, onChange }: Props) => {
  const { colors, isDark } = useTheme();
  const [currentView, setCurrentView] = useState(new Date(value));

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const renderDays = () => {
    const year = currentView.getFullYear();
    const month = currentView.getMonth();
    const daysCount = getDaysInMonth(year, month);
    const firstDay = new Date(year, month, 1).getDay();

    const days = [];
    // Add empty slots for the first week
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysCount; i++) days.push(i);

    return (
      <View style={styles.daysGrid}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <TText key={`header-${i}`} style={styles.dayHeader}>{d}</TText>
        ))}
        {days.map((day, i) => (
          <TouchableOpacity
            key={i}
            disabled={!day}
            onPress={() => {
              if (day) {
                const y = year;
                const m = String(month + 1).padStart(2, '0');
                const d = String(day).padStart(2, '0');
                onChange(`${y}-${m}-${d}`);
                onClose();
              }
            }}
            style={[
              styles.dayCell,
              (day && value === `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`) ? { backgroundColor: COLORS.primary } : null
            ]}
          >
            <TText style={[
              styles.dayText,
              !day ? { opacity: 0 } : null,
              (day && value === `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`) ? { color: '#fff', fontWeight: '900' } : null
            ]}>
              {day}
            </TText>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const changeMonth = (offset: number) => {
    const next = new Date(currentView);
    next.setMonth(next.getMonth() + offset);
    setCurrentView(next);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <TView style={[styles.container, { backgroundColor: colors.card }]}>
          <View style={styles.header}>
            <TText style={styles.title}>Select Date</TText>
            <TouchableOpacity onPress={onClose}><X size={20} color={colors.text} /></TouchableOpacity>
          </View>

          <View style={styles.selector}>
            <TouchableOpacity onPress={() => changeMonth(-1)}><ChevronLeft size={24} color={COLORS.primary} /></TouchableOpacity>
            <TText style={styles.monthName}>{months[currentView.getMonth()]} {currentView.getFullYear()}</TText>
            <TouchableOpacity onPress={() => changeMonth(1)}><ChevronRight size={24} color={COLORS.primary} /></TouchableOpacity>
          </View>

          {renderDays()}

          <TouchableOpacity
            onPress={() => {
              const today = new Date();
              const y = today.getFullYear();
              const m = String(today.getMonth() + 1).padStart(2, '0');
              const d = String(today.getDate()).padStart(2, '0');
              onChange(`${y}-${m}-${d}`);
              onClose();
            }}
            style={styles.todayBtn}
          >
            <TText style={{ color: COLORS.primary, fontWeight: '700' }}>SET TO TODAY</TText>
          </TouchableOpacity>
        </TView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  container: { width: '85%', borderRadius: RADIUS.xl, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 16, fontWeight: '900' },
  selector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  monthName: { fontSize: 18, fontWeight: '800' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayHeader: { width: '14.28%', textAlign: 'center', fontSize: 12, fontWeight: '700', color: '#94A3B8', marginBottom: 10 },
  dayCell: { width: '14.28%', height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 20 },
  dayText: { fontSize: 14, fontWeight: '600' },
  todayBtn: { marginTop: 20, alignItems: 'center', padding: 10 }
});
