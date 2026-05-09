import { MotiView } from '@/components/MotiShim';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { ChevronLeft, Download, Eye, FileText, Filter, Search, Share2, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, RefreshControl, SafeAreaView, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Design1 } from '../../../components/templates/Design1';
import { TText, TView, useTheme } from '../../../components/ThemedUI';
import { db } from '../../../services/supabase';
import { COLORS, RADIUS } from '../../../theme';

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

      setTransactions(data);

      // Map DB fields to application business profile format
      const loadProfile = (prof: any) => ({
        name: prof.companyName || prof.optional1 || prof.name || 'MK AGENCY',
        ownerName: prof.ownerName || prof.username || '',
        address: prof.address || prof.addressline1 || prof.AddressLine1 || '',
        address2: prof.address2 || prof.addressline2 || prof.AddressLine2 || '',
        landmark: prof.landmark || prof.Landmark || '',
        pincode: prof.pincode || prof.Pincode || '',
        mobile: prof.mobile || prof.Mobile || '',
        altMobile: prof.altMobile || prof.mobile2 || prof.Mobile2 || '',
        email: prof.email || prof.emailid || prof.EmailID || '',
        gstin: prof.gstin || prof.GSTIN || '',
        bankName: prof.bankName || prof.bankaccountname || prof.BankAccountName || '',
        accountNo: prof.accountNo || prof.accountno || prof.AccountNo || '',
        ifsc: prof.ifsc || prof.IFSC || '',
      });

      if (dbProfile) {
        setBusinessProfile(loadProfile(dbProfile));
        await AsyncStorage.setItem('business_profile', JSON.stringify(dbProfile));
      } else if (profile) {
        setBusinessProfile(loadProfile(JSON.parse(profile)));
      } else {
        setBusinessProfile({ name: 'MK AGENCY', address: '6, 1st cross, Puducherry', mobile: '+91 9791858965', gstin: '34CEBPG0848B1Z5' });
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

  const getHTML = (item: any) => `
    <html>
      <head>
        <style>
          body { font-family: 'Helvetica', sans-serif; color: #333; padding: 20px; }
          .invoice-box { border: 2px solid #000; padding: 15px; }
          .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .business-info h1 { margin: 0; font-size: 22px; font-weight: 900; text-transform: uppercase; }
          .business-info p { margin: 1px 0; font-size: 10px; font-weight: 600; }
          .center-col { text-align: center; flex: 1.2; }
          .tax-badge { background: #eee; border: 1px solid #000; padding: 5px 15px; display: inline-block; font-weight: 900; font-size: 13px; margin-bottom: 10px; }
          .meta-box { border: 1px solid #000; padding: 3px 8px; font-size: 10px; font-weight: 800; text-align: left; width: 160px; margin: 0 auto 2px; }
          .right-col { text-align: right; }
          .table { width: 100%; border: 1px solid #000; border-collapse: collapse; margin-top: 15px; }
          .table th { background: #eee; border: 1px solid #000; padding: 5px; font-size: 10px; font-weight: 900; }
          .table td { border: 1px solid #000; padding: 5px; font-size: 10px; text-align: center; }
          .totals-section { display: flex; justify-content: flex-end; margin-top: 5px; }
          .summary-row { display: flex; width: 220px; border: 1px solid #000; padding: 4px; justify-content: space-between; font-size: 10px; font-weight: 800; margin-top: -1px; }
          .footer { display: flex; justify-content: space-between; margin-top: 30px; align-items: flex-end; }
          .bank-box { border: 1px solid #000; width: 300px; }
          .bank-head { background: #eee; border-bottom: 1px solid #000; padding: 4px; font-size: 10px; font-weight: 900; text-align: center; }
          .bank-row { display: flex; font-size: 9px; padding: 2px 4px; }
          .bank-label { flex: 1; font-weight: 700; }
          .sig-box { text-align: right; }
          .sig-agency { background: #eee; padding: 5px 15px; font-weight: 900; font-size: 11px; margin-bottom: 40px; border: 1px solid #000; }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <div class="header">
            <div class="business-info" style="flex: 1;">
              <h1>${businessProfile?.name || 'MK AGENCY'}</h1>
              <p>${businessProfile?.address || ''}</p>
              <p>Mobile: ${businessProfile?.mobile || '-'}</p>
              <p>GSTIN: ${businessProfile?.gstin || '-'}</p>
            </div>
            <div class="center-col">
              <div class="tax-badge">TAX INVOICE</div>
              <div class="meta-box">BILL NO: ${item.billno}</div>
              <div class="meta-box">DATE: ${item.billdate}</div>
            </div>
            <div class="right-col" style="flex: 1;">
              <p style="font-size: 16px; font-weight: 800; margin-bottom: 5px;">To, ${item.clientdetails?.clientname || '-'}</p>
              <p style="font-size: 9px;">${item.clientdetails?.addressline1 || '-'}</p>
              <p style="font-size: 9px;">GSTIN: ${item.clientdetails?.gstin || '-'}</p>
            </div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Sl.No</th>
                <th style="text-align: left; width: 25%;">Particulars</th>
                <th>HSN</th>
                <th>Box</th>
                <th>Pieces</th>
                <th>S.Price</th>
                <th>Disc</th>
                <th>CGST</th>
                <th>SGST</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td style="text-align: left; font-weight: 700;">${item.products?.productname || 'Goods/Services'}</td>
                <td>${item.products?.hsn || '0000'}</td>
                <td>${item.box || '0'}</td>
                <td>${item.pieces || '0'}</td>
                <td>₹${(item.rate || 0).toLocaleString()}</td>
                <td>${item.disperc}% - ₹${item.discamount?.toFixed(2)}</td>
                <td>₹${(item.cgstamount || 0).toFixed(2)}</td>
                <td>₹${(item.sgstamount || 0).toFixed(2)}</td>
                <td>₹${(item.rate || 0).toLocaleString()}</td>
                <td style="text-align: right; font-weight: 700;">₹${item.totalamount?.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <div style="display: flex; justify-content: space-between; margin-top: 10px; background: #eee; border: 1px solid #000; padding: 4px; font-size: 10px; font-weight: 800;">
            <div>TOTAL QTY: ${item.box || '0'}</div>
            <div>TOTAL AMOUNT: ₹${item.totalamount?.toLocaleString()}</div>
          </div>

          <div class="totals-section">
            <div>
              <div class="summary-row"><span>TOTAL BEFORE TAX:</span><span>₹${(item.taxableamount || 0).toLocaleString()}</span></div>
              <div class="summary-row"><span>TOTAL AFTER TAX:</span><span>₹${(item.totalamount || 0).toLocaleString()}</span></div>
            </div>
          </div>

          <div class="footer">
            <div class="bank-box">
              <div class="bank-head">BANK DETAILS</div>
              <div class="bank-row"><span class="bank-label">Bank:</span><span>${businessProfile?.bankName || '-'}</span></div>
              <div class="bank-row"><span class="bank-label">A/C:</span><span>${businessProfile?.accountNo || '-'}</span></div>
              <div class="bank-row"><span class="bank-label">IFSC:</span><span>${businessProfile?.ifsc || '-'}</span></div>
            </div>
            <div class="sig-box">
              <div class="sig-agency">FOR ${businessProfile?.name || 'MK AGENCY'}</div>
              <p style="font-size: 10px; font-weight: 700;">Authorised Signatory</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const handlePrintPDF = async (item: any) => {
    setDownloading(item.billno);
    try {
      const html = getHTML(item);
      await Print.printAsync({ html });
    } catch (error) {
      console.error('Print error:', error);
    } finally {
      setDownloading(null);
    }
  };

  const handleSharePDF = async (item: any) => {
    setDownloading(item.billno);
    try {
      const html = getHTML(item);
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      console.error('Share error:', error);
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TText style={{ fontWeight: '800', fontSize: 16 }}>{item.clientdetails?.clientname || 'Walk-in Client'}</TText>
            {item.optional1 === 'DUMMY' && (
              <View style={{ backgroundColor: COLORS.warning + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                <TText style={{ color: COLORS.warning, fontSize: 8, fontWeight: '900' }}>DUMMY</TText>
              </View>
            )}
          </View>
          <TText variant="caption">{item.billno || `#${item.billingid}`}</TText>
        </TView>
        <TView style={{ flexDirection: 'row', gap: 6 }}>
          <TouchableOpacity
            onPress={() => { setSelectedBill(item); setPreviewVisible(true); }}
            style={[styles.downloadBtn, { backgroundColor: isDark ? 'rgba(129, 140, 248, 0.1)' : '#F1F5F9' }]}
          >
            <Eye size={16} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleSharePDF(item)}
            disabled={!!downloading}
            style={[styles.downloadBtn, { backgroundColor: isDark ? 'rgba(129, 140, 248, 0.1)' : '#F1F5F9' }]}
          >
            <Share2 size={16} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handlePrintPDF(item)}
            disabled={!!downloading}
            style={[styles.downloadBtn, { backgroundColor: isDark ? 'rgba(129, 140, 248, 0.1)' : '#F1F5F9' }]}
          >
            {downloading === item.billno ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Download size={16} color={COLORS.primary} />
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
            <TView style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TText style={{ fontWeight: '900', color: '#000' }}>INVOICE PREVIEW</TText>
              {selectedBill?.optional1 === 'DUMMY' && (
                <View style={{ backgroundColor: COLORS.warning + '20', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                  <TText style={{ color: COLORS.warning, fontSize: 10, fontWeight: '900' }}>DUMMY BILLING</TText>
                </View>
              )}
            </TView>
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
                      business: businessProfile || {},
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
                          disc: selectedBill.disperc ? `${selectedBill.disperc}% - ₹${selectedBill.discamount?.toFixed(2)}` : '0% - ₹0.00',
                          cgst: (selectedBill.cgstamount || 0).toFixed(2),
                          sgst: (selectedBill.sgstamount || 0).toFixed(2),
                          rate: (selectedBill.totalamount / ((selectedBill.box * selectedBill.pieces) || 1)).toFixed(2),
                          amount: selectedBill.totalamount?.toFixed(2)
                        }
                      ],
                      summary: {
                        totalQty: selectedBill.box?.toString() || '0',
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
  header: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: 1, marginTop: 8 },
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
  downloadBtn: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  divider: { height: 1, marginVertical: 15 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  paymentBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginTop: 4 },
  empty: { alignItems: 'center', marginTop: 100 },
  modalHeader: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, borderBottomWidth: 1, borderColor: '#eee' },
  closeBtn: { padding: 8 },
  closePreviewBtn: { height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
});
