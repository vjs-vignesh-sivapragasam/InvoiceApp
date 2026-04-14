import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, View, RefreshControl, Platform, SafeAreaView, Modal, ScrollView } from 'react-native';
import { MotiView } from '@/components/MotiShim';
import { TView, TText, useTheme } from '../../../components/ThemedUI';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../../../theme';
import { Search, Filter, ChevronRight, ChevronLeft, CheckCircle2, Clock, AlertCircle, FileText, Download, X, MoreHorizontal, Eye } from 'lucide-react-native';
import { db } from '../../../services/supabase';
import { useRouter } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Design1 } from '../../../components/templates/Design1';

const StatusBadge = ({ isactive }: { isactive: boolean }) => {
  const status = isactive ? 'Active' : 'Void';
  const color = isactive ? COLORS.success : COLORS.warning;
  return (
    <View style={[styles.badge, { backgroundColor: color + '15' }]}>
      <TText style={{ color, fontSize: 10, fontWeight: '800' }}>{status.toUpperCase()}</TText>
    </View>
  );
};

export default function HistoryScreen() {
  const { colors, isDark } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [businessProfile, setBusinessProfile] = useState<any>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [selectedBill, setSelectedBill] = useState<any>(null);

  const fetchTransactions = useCallback(async () => {
    try {
      const [data, profile, dbProfile] = await Promise.all([
        db.billing.getAll(),
        AsyncStorage.getItem('business_profile'),
        db.users.getProfile(1)
      ]);
      setTransactions(data);
      
      if (dbProfile) {
        // Map DB fields to application business profile format
        const formattedProfile = {
          businessName: dbProfile.optional1 || 'INVOICE APP',
          ownerName: dbProfile.username || '',
          email: dbProfile.emailid || '',
          mobile: dbProfile.mobile || '',
          mobile2: dbProfile.mobile2 || '',
          address: dbProfile.addressline1 || '',
          address2: dbProfile.addressline2 || '',
          landmark: dbProfile.landmark || '',
          pincode: dbProfile.pincode || '',
          gstin: dbProfile.gstin || '',
          bankName: dbProfile.bankaccountname || '',
          accountNo: dbProfile.accountno || '',
          ifsc: dbProfile.ifsc || ''
        };
        setBusinessProfile(formattedProfile);
      } else if (profile) {
        setBusinessProfile(JSON.parse(profile));
      }
    } catch (error) {
      console.error('History fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTransactions();
  };

  const filteredTransactions = transactions.filter(item => {
    const clientName = (item.clientdetails?.clientname ?? '').toLowerCase();
    const billNo = (item.billno ?? '').toLowerCase();
    return clientName.includes(search.toLowerCase()) || billNo.includes(search.toLowerCase());
  });

  const handleDownloadPDF = async (item: any) => {
    setDownloading(item.billno);
    try {
      const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; padding: 40px; line-height: 1.4; }
              .header { display: flex; justify-content: space-between; border-bottom: 3px solid #6366F1; padding-bottom: 25px; }
              .business-info h1 { margin: 0; color: #6366F1; font-size: 26px; font-weight: 900; }
              .business-info p { margin: 2px 0; font-size: 11px; color: #475569; font-weight: 600; }
              .invoice-title { text-align: right; }
              .invoice-title h2 { margin: 0; font-size: 32px; color: #1E293B; font-weight: 900; }
              .details { display: flex; justify-content: space-between; margin-top: 40px; }
              .details-box h3 { font-size: 9px; color: #64748B; text-transform: uppercase; margin-bottom: 8px; letter-spacing: 1px; font-weight: 800; }
              .details-box p { margin: 0; font-size: 14px; font-weight: 800; color: #1E293B; }
              .table { width: 100%; border-collapse: collapse; margin-top: 40px; }
              .table th { background: #F8FAFC; text-align: left; padding: 15px; font-size: 10px; color: #64748B; text-transform: uppercase; border-bottom: 2px solid #E2E8F0; font-weight: 800; }
              .table td { padding: 15px; font-size: 14px; border-bottom: 1px solid #F1F5F9; color: #334155; }
              .totals { margin-top: 40px; width: 300px; margin-left: auto; }
              .total-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 14px; }
              .total-row.grand { border-top: 3px solid #6366F1; margin-top: 15px; padding-top: 20px; }
              .total-row.grand p { font-size: 24px; color: #6366F1; font-weight: 900; margin: 0; }
              .bank-details { margin-top: 50px; padding: 20px; background: #F8FAFC; border-radius: 12px; border: 1px dashed #CBD5E1; width: 60%; }
              .bank-details h4 { margin: 0 0 10px 0; font-size: 10px; color: #6366F1; text-transform: uppercase; letter-spacing: 1px; }
              .bank-details p { margin: 3px 0; font-size: 11px; color: #475569; font-weight: 700; }
              .footer { margin-top: 100px; text-align: center; font-size: 11px; color: #94A3B8; border-top: 1px solid #E2E8F0; padding-top: 30px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="business-info">
                <h1>${businessProfile?.businessName || 'INVOICE APP'}</h1>
                <p>Prop: ${businessProfile?.ownerName || ''}</p>
                <p>${businessProfile?.address || ''}${businessProfile?.address2 ? ', ' + businessProfile?.address2 : ''}</p>
                <p>${businessProfile?.landmark ? businessProfile?.landmark + ', ' : ''}${businessProfile?.pincode ? 'PIN: ' + businessProfile?.pincode : ''}</p>
                <p>Contact: ${businessProfile?.mobile || ''}${businessProfile?.mobile2 ? ' / ' + businessProfile?.mobile2 : ''}</p>
                <p>Email: ${businessProfile?.email || ''}</p>
                <p style="margin-top: 5px; color: #6366F1;">GSTIN: ${businessProfile?.gstin || 'N/A'}</p>
              </div>
              <div class="invoice-title">
                <h2>INVOICE</h2>
                <p style="margin-top: 10px; font-weight: 900; font-size: 18px;"># ${item.billno}</p>
                <p style="font-size: 12px; color: #64748B;">Date: ${item.billdate}</p>
              </div>
            </div>

            <div class="details">
              <div class="details-box">
                <h3>Bill To</h3>
                <p>${item.clientdetails?.clientname || 'General Customer'}</p>
                <p style="font-weight: 500; font-size: 12px; margin-top: 5px; color: #64748B;">
                  ${item.clientdetails?.addressline1 || ''}<br/>
                  ${item.clientdetails?.addressline2 || ''}
                </p>
                ${item.clientdetails?.gstin ? `<p style="font-size: 11px; color: #6366F1; margin-top: 5px;">GSTIN: ${item.clientdetails.gstin}</p>` : ''}
              </div>
              <div class="details-box" style="text-align: right;">
                <h3>Payment Status</h3>
                <p style="color: ${item.isactive ? '#10B981' : '#F59E0B'}">${item.isactive ? 'PAID' : 'VOID'}</p>
              </div>
            </div>

            <table class="table">
              <thead>
                <tr>
                  <th>Particulars</th>
                  <th style="text-align: center;">HSN</th>
                  <th style="text-align: center;">Box</th>
                  <th style="text-align: center;">Pieces</th>
                  <th style="text-align: right;">Rate</th>
                  <th style="text-align: right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${item.products?.productname || 'Goods/Services'}</td>
                  <td style="text-align: center;">${item.products?.hsn || '0000'}</td>
                  <td style="text-align: center;">${item.box || '0'}</td>
                  <td style="text-align: center;">${item.pieces || '0'}</td>
                  <td style="text-align: right;">₹${(item.rate || 0).toLocaleString()}</td>
                  <td style="text-align: right; font-weight: 700;">₹${item.totalamount?.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>

            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div class="bank-details">
                <h4>Bank Account Details</h4>
                <p>BANK: ${businessProfile?.bankName || 'N/A'}</p>
                <p>A/C NO: ${businessProfile?.accountNo || 'N/A'}</p>
                <p>IFSC: ${businessProfile?.ifsc || 'N/A'}</p>
              </div>

              <div class="totals">
                <div class="total-row">
                  <span>Subtotal</span>
                  <span>₹${(item.taxableamount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                ${item.discamount > 0 ? `
                  <div class="total-row">
                    <span>Discount (${item.disperc}%)</span>
                    <span style="color: #EF4444;">- ₹${item.discamount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                ` : ''}
                ${item.iswithgst ? `
                  <div class="total-row">
                    <span>CGST</span>
                    <span>₹${(item.cgstamount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div class="total-row">
                    <span>SGST</span>
                    <span>₹${(item.sgstamount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                ` : ''}
                ${item.optional2 ? `
                  <div class="total-row">
                    <span>Adjustment</span>
                    <span>₹${parseFloat(item.optional2).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                ` : ''}
                <div class="total-row grand">
                  <p>Grand Total</p>
                  <p>₹${(item.totalamount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
              </div>
            </div>

            <div class="footer">
              <p style="font-weight: 800; color: #475569; margin-bottom: 5px;">Thank you for your business!</p>
              <p>This is a computer generated invoice. No signature required.</p>
              <p style="margin-top: 10px;">Generated via InvoiceApp Terminal</p>
            </div>
          </body>
        </html>
      `;
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      console.error('PDF Generation error:', error);
      alert('Failed to generate PDF');
    } finally {
      setDownloading(null);
    }
  };

  const renderItem = ({ item, index }: { item: any, index: number }) => (
    <MotiView
      from={{ opacity: 0, translateY: 15 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ delay: index * 40 }}
      style={[
        styles.invoiceCard, 
        { 
          backgroundColor: 'transparent',
          borderWidth: 1.2,
          borderColor: 'rgba(129, 140, 248, 0.3)',
        }
      ]}
    >
      <TView style={styles.cardHeader}>
         <TView style={styles.typeIcon}>
            <FileText size={18} color={COLORS.primary} />
         </TView>
         <TView style={{ flex: 1, marginLeft: 15 }}>
            <TText style={{ fontWeight: '800', fontSize: 16 }}>{item.clientdetails?.clientname || 'Walk-in Client'}</TText>
            <TText variant="caption">{item.billno || `#${item.billingid}`}</TText>
         </TView>
          <TView style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity 
              onPress={() => { setSelectedBill(item); setPreviewVisible(true); }}
              style={[styles.downloadBtn, { backgroundColor: isDark ? 'rgba(129, 140, 248, 0.1)' : '#F1F5F9' }]}
            >
               <Eye size={18} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => handleDownloadPDF(item)} 
              disabled={!!downloading}
              style={[styles.downloadBtn, { backgroundColor: isDark ? 'rgba(129, 140, 248, 0.1)' : '#F1F5F9' }]}
            >
               {downloading === item.billno ? (
                 <ActivityIndicator size="small" color={COLORS.primary} />
               ) : (
                 <Download size={18} color={COLORS.primary} />
               )}
            </TouchableOpacity>
         </TView>
      </TView>

      <TView style={[styles.divider, { backgroundColor: colors.border }]} />

      <TView style={styles.cardFooter}>
         <TView>
            <TText variant="caption" style={{ fontSize: 10 }}>BILL DATE</TText>
            <TText style={{ fontWeight: '700', fontSize: 13 }}>{item.billdate || '2026-04-11'}</TText>
         </TView>
         <TView style={{ flex: 1, alignItems: 'center' }}>
            <TText variant="caption" style={{ fontSize: 10 }}>PAYMENT</TText>
            <TView style={[styles.paymentBadge, { backgroundColor: item.paymentmethod?.toUpperCase() === 'CREDIT' ? COLORS.danger + '10' : (isDark ? 'rgba(129, 140, 248, 0.1)' : '#F1F5F9') }]}>
               <TText style={{ fontSize: 10, fontWeight: '800', color: item.paymentmethod?.toUpperCase() === 'CREDIT' ? COLORS.danger : COLORS.primary }}>
                  {item.paymentmethod || 'CASH'}
               </TText>
            </TView>
         </TView>
         <TView style={{ alignItems: 'flex-end' }}>
            <TText style={{ fontWeight: '900', fontSize: 18, color: COLORS.primary }}>₹{item.totalamount?.toLocaleString()}</TText>
            <StatusBadge isactive={item.isactive} />
         </TView>
      </TView>
    </MotiView>
  );

  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <TView style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <TText variant="subtitle" style={{ fontWeight: '900' }}>Transaction Records</TText>
        <TView style={{ width: 40 }} />
      </TView>

      <TView style={styles.searchPart}>
        <TView style={styles.searchRow}>
          <TView style={[styles.searchContainer, { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(129, 140, 248, 0.2)' }]}>
            <Search size={20} color={COLORS.primary} />
            <TextInput
              placeholder="Search clients or bill ID..."
              placeholderTextColor="gray"
              value={search}
              onChangeText={setSearch}
              style={[styles.searchInput, { color: colors.text }]}
            />
            {search.length > 0 && <TouchableOpacity onPress={() => setSearch('')}><X size={18} color="gray" /></TouchableOpacity>}
          </TView>
          <TouchableOpacity style={[styles.filterBtn, { backgroundColor: 'transparent', borderWidth: 1, borderColor: 'rgba(129, 140, 248, 0.2)' }]}>
             <Filter size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </TView>
      </TView>

      {loading && transactions.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <FlatList
          data={filteredTransactions}
          renderItem={renderItem}
          keyExtractor={item => item.billingid.toString()}
          contentContainerStyle={styles.listPadding}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
          ListEmptyComponent={<TView style={styles.empty}><TText variant="caption">No transaction records found</TText></TView>}
        />
      )}

      <Modal visible={previewVisible} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
           <TView style={styles.modalHeader}>
              <TText style={{ fontWeight: '900', color: '#000' }}>INVOICE PREVIEW</TText>
              <TouchableOpacity onPress={() => setPreviewVisible(false)} style={styles.closeBtn}>
                 <X size={24} color="#000" />
              </TouchableOpacity>
           </TView>
           <ScrollView>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                 <TView style={{ width: 850 }}>
                    {selectedBill && (
                      <Design1 
                        data={{
                          business: {
                            name: businessProfile?.businessName || 'INVOICE APP',
                            ownerName: businessProfile?.ownerName || '',
                            address: businessProfile?.address || '',
                            address2: businessProfile?.address2 || '',
                            landmark: businessProfile?.landmark || '',
                            pincode: businessProfile?.pincode || '',
                            mobile: businessProfile?.mobile || '',
                            altMobile: businessProfile?.mobile2 || '',
                            email: businessProfile?.email || '',
                            gstin: businessProfile?.gstin || '',
                            bankName: businessProfile?.bankName || '',
                            accountNo: businessProfile?.accountNo || '',
                            ifsc: businessProfile?.ifsc || '',
                          },
                          client: selectedBill.clientdetails || { clientname: 'Guest Client' },
                          billNo: selectedBill.billno,
                          billDate: selectedBill.billdate,
                          items: [
                            { 
                              name: selectedBill.products?.productname || `Goods/Services as per Bill # ${selectedBill.billno}`, 
                              hsn: selectedBill.products?.hsn || '0000', 
                              box: selectedBill.box?.toString() || '0', 
                              pieces: selectedBill.pieces?.toString() || '0', 
                              price: (selectedBill.rate || 0).toString(), 
                              disc: selectedBill.disperc ? `${selectedBill.disperc}% - ${selectedBill.discamount?.toFixed(2)}` : '0% - 0.00',
                              cgst: (selectedBill.cgstamount || 0).toFixed(2), 
                              sgst: (selectedBill.sgstamount || 0).toFixed(2), 
                              rate: (selectedBill.rate || 0).toString(), 
                              amount: selectedBill.totalamount?.toFixed(2)
                            }
                          ],
                          summary: {
                            totalQty: '1',
                            beforeTax: (selectedBill.taxableamount || (selectedBill.totalamount - (selectedBill.gstamount || 0))).toFixed(2),
                            totalAmount: selectedBill.totalamount?.toFixed(2),
                            afterTax: selectedBill.totalamount?.toFixed(2)
                          },
                          docType: 'invoice'
                        }} 
                      />
                    )}
                 </TView>
              </ScrollView>
              <TView style={{ padding: 20 }}>
                 <TouchableOpacity 
                   onPress={() => setPreviewVisible(false)} 
                   style={[styles.closePreviewBtn, { backgroundColor: '#333' }]}
                 >
                    <TText style={{ color: '#fff', fontWeight: '800' }}>CLOSE PREVIEW</TText>
                 </TouchableOpacity>
              </TView>
              <View style={{ height: 50 }} />
           </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: 1 },
  backBtn: { padding: 8 },
  searchPart: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 },
  searchRow: { flexDirection: 'row', gap: 12 },
  searchContainer: { flex: 1, height: 50, borderRadius: 15, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14, fontWeight: '600' },
  filterBtn: { width: 50, height: 50, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  listPadding: { padding: 20, paddingTop: 5, paddingBottom: 100 },
  invoiceCard: { borderRadius: RADIUS.xl, padding: 18, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  typeIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  moreBtn: { padding: 5 },
  downloadBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  divider: { height: 1, marginVertical: 15 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  paymentBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 4 },
  empty: { alignItems: 'center', marginTop: 100 },
  modalHeader: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, borderBottomWidth: 1, borderColor: '#eee' },
  closeBtn: { padding: 8 },
  closePreviewBtn: { height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
});
