import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch, ActivityIndicator, Platform } from 'react-native';
import { MotiView } from 'moti';
import { TView, TText, useTheme } from '../../../components/ThemedUI';
import { Button } from '../../../components/Button';
import { COLORS, RADIUS, SHADOWS } from '../../../theme';
import { db } from '../../../services/supabase';
import { Plus, Search, Edit2, User, Building, MapPin, CreditCard, Mail } from 'lucide-react-native';

const MobileClientManagement = () => {
  const { colors } = useTheme();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const data = await db.clients.getAll();
      setClients(data);
    } catch (error) {
       console.error(error);
    } finally {
       setLoading(false);
    }
  };

  const toggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      await db.clients.update(id, { isactive: !currentStatus });
      fetchClients();
    } catch (error) {
       alert('Error updating');
    }
  };

  if (loading) return <TView style={{flex: 1, justifyContent: 'center'}}><ActivityIndicator color={COLORS.primary} /></TView>;

  return (
    <TView style={[styles.container, { backgroundColor: colors.background }]}>
      <TView style={[styles.header, { borderBottomColor: colors.border }]}>
        <TText variant="subtitle">Client Directory</TText>
        <TouchableOpacity style={styles.addBtn}><Plus size={24} color={COLORS.primary} /></TouchableOpacity>
      </TView>

      <TView style={styles.searchContainer}>
        <TView style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Search size={18} color={colors.textSecondary} />
          <TextInput placeholder="Search by name or company..." style={{ marginLeft: 8, flex: 1, color: colors.text }} />
        </TView>
      </TView>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {clients.map((c, i) => (
          <MotiView
            key={c.clientid}
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: i * 50 }}
            style={[styles.clientCard, { backgroundColor: colors.card, ...SHADOWS.sm }]}
          >
            <TView style={styles.cardHeader}>
               <TView style={[styles.avatar, { backgroundColor: COLORS.primary + '15' }]}>
                  <TText style={{ color: COLORS.primary, fontWeight: '800' }}>{c.clientname?.[0]}</TText>
               </TView>
               <TView style={{ flex: 1, marginLeft: 16 }}>
                  <TText style={{ fontWeight: '700', fontSize: 16 }}>{c.clientname}</TText>
                  <TView style={{ flexDirection: 'row', alignItems: 'center' }}>
                     <Building size={12} color={colors.textSecondary} />
                     <TText variant="caption" style={{ marginLeft: 6 }}>{c.gstin || 'No GSTIN'}</TText>
                  </TView>
               </TView>
               <Switch 
                value={c.isactive} 
                onValueChange={() => toggleStatus(c.clientid, c.isactive)}
                trackColor={{ false: colors.border, true: COLORS.primary }}
              />
            </TView>

            <TView style={[styles.divider, { backgroundColor: colors.border }]} />
            
            <TView style={styles.infoRow}>
               <MapPin size={14} color={colors.textSecondary} style={{ width: 20 }} />
               <TText variant="caption" style={{ flex: 1 }}>{c.addressline1 || 'No Address Provided'}</TText>
            </TView>
            <TView style={[styles.infoRow, { marginTop: 6 }]}>
               <CreditCard size={14} color={colors.textSecondary} style={{ width: 20 }} />
               <TText variant="caption" style={{ flex: 1 }}>{c.accountnumber ? `Bank: ****${c.accountnumber.slice(-4)}` : 'No Banking Info'}</TText>
            </TView>

            <TView style={styles.cardFooter}>
               <TouchableOpacity style={styles.actionBtn}>
                  <Mail size={14} color={COLORS.primary} />
                  <TText style={{ color: COLORS.primary, fontWeight: '700', fontSize: 12, marginLeft: 6 }}>Contact</TText>
               </TouchableOpacity>
               <TouchableOpacity style={styles.editBtn}>
                  <Edit2 size={14} color={colors.textSecondary} />
               </TouchableOpacity>
            </TView>
          </MotiView>
        ))}
      </ScrollView>

      <TouchableOpacity style={[styles.fab, { backgroundColor: COLORS.primary, ...SHADOWS.md }]}>
        <Plus size={28} color="#fff" />
      </TouchableOpacity>
    </TView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, borderBottomWidth: 1, marginTop: Platform.OS === 'ios' ? 40 : 10 },
  addBtn: { padding: 8 },
  searchContainer: { padding: 20 },
  searchBar: { height: 48, borderRadius: RADIUS.md, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  scrollContent: { padding: 20, paddingTop: 0, paddingBottom: 100 },
  clientCard: { borderRadius: RADIUS.lg, padding: 16, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  divider: { height: 1, marginVertical: 12, opacity: 0.3 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary + '10', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  editBtn: { padding: 8 },
  fab: { position: 'absolute', bottom: 30, right: 30, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
});

export default MobileClientManagement;
