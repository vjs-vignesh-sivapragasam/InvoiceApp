import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, View } from 'react-native';
import { TView, TText, useTheme } from '../../../components/ThemedUI';
import { WebLayout } from './WebLayout';
import { COLORS, RADIUS, SPACING, SHADOWS } from '../../../theme';
import { db } from '../../../services/supabase';
import * as Print from 'expo-print';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Search, 
  Filter, 
  Download, 
  MoreHorizontal,
  FileText
} from 'lucide-react-native';

export const History = () => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [businessProfile, setBusinessProfile] = useState<any>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const [data, profile, dbProfile] = await Promise.all([
        db.billing.getAll(),
        AsyncStorage.getItem('business_profile'),
        db.users.getProfile(1)
      ]);
      setTransactions(data);

      const loadProfile = (prof: any) => ({
        name: prof.companyName || prof.optional1 || prof.name || 'MK AGENCY',
        address: prof.address || prof.addressline1 || '',
        address2: prof.address2 || prof.addressline2 || '',
        mobile: prof.mobile || '',
        gstin: prof.gstin || '',
        bankName: prof.bankName || prof.bankaccountname || '',
        accountNo: prof.accountNo || prof.accountno || '',
        ifsc: prof.ifsc || '',
      });

      if (dbProfile) {
        setBusinessProfile(loadProfile(dbProfile));
      } else if (profile) {
        setBusinessProfile(loadProfile(JSON.parse(profile)));
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (item: any) => {
    setDownloading(item.billno);
    try {
      const html = `
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
                  <p style="font-size: 16px; font-weight: 800;">To, ${item.clientdetails?.clientname || '-'}</p>
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
      await Print.printAsync({ html });
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <WebLayout>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </WebLayout>
    );
  }

  return (
    <WebLayout>
      <View style={styles.header}>
        <View>
          <TText variant="title" style={{ fontSize: 32 }}>Transaction History</TText>
          <TText variant="caption">Manage and search through all your generated invoices</TText>
        </View>
      </View>

      <View style={styles.toolbar}>
        <TView style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Search size={18} color={colors.textSecondary} />
          <TextInput 
            placeholder="Search by ID, client..." 
            style={[styles.input, { color: colors.text }]} 
            placeholderTextColor={colors.textSecondary}
          />
        </TView>
        <TouchableOpacity style={[styles.filterBtn, { borderColor: colors.border }]}>
          <Filter size={18} color={colors.text} />
          <TText style={{ marginLeft: 8 }}>Filters</TText>
        </TouchableOpacity>
      </View>

      <TView style={[styles.tableCard, { backgroundColor: colors.card, ...SHADOWS.sm }]}>
        <View style={[styles.tableHeader, { borderBottomColor: colors.border }]}>
          <TText style={[styles.col, { flex: 1.5 }]} variant="caption">Invoice ID</TText>
          <TText style={[styles.col, { flex: 2 }]} variant="caption">Client Name</TText>
          <TText style={styles.col} variant="caption">Amount</TText>
          <TText style={styles.col} variant="caption">Date</TText>
          <TText style={styles.col} variant="caption">Payment</TText>
          <TText style={styles.col} variant="caption">Status</TText>
          <View style={{ width: 80 }} />
        </View>

        {transactions.map((row) => (
          <View key={row.billingid} style={[styles.tableRow, { borderBottomColor: colors.border }]}>
            <View style={[styles.col, { flex: 1.5, flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
              <TText style={{ fontWeight: '700' }} variant="body">{row.billno || `INV-${row.billingid}`}</TText>
              {row.optional1 === 'DUMMY' && (
                <View style={{ backgroundColor: COLORS.warning + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                  <TText style={{ color: COLORS.warning, fontSize: 10, fontWeight: '900' }}>DUMMY</TText>
                </View>
              )}
            </View>
            <View style={[styles.col, { flex: 2, flexDirection: 'row', alignItems: 'center' }]}>
              <TView style={[styles.avatar, { backgroundColor: colors.surfaceSecondary }]}>
                <FileText size={14} color={COLORS.primary} />
              </TView>
              <TText style={{ marginLeft: 12 }}>{row.clientdetails?.clientname || 'Deleted Client'}</TText>
            </View>
            <TText style={styles.col} variant="body">₹{row.totalamount?.toLocaleString()}</TText>
            <TText style={styles.col} variant="body">{row.billdate}</TText>
            <View style={styles.col}>
               <TText style={{ fontSize: 13, fontWeight: '700', color: row.paymentmethod?.toUpperCase() === 'CREDIT' ? COLORS.danger : COLORS.primary }}>
                  {row.paymentmethod || 'CASH'}
               </TText>
            </View>
            <View style={styles.col}>
              <View style={[styles.statusBadge, { backgroundColor: (row.isactive ? COLORS.success : COLORS.warning) + '20' }]}>
                <TText style={{ fontSize: 11, color: row.isactive ? COLORS.success : COLORS.warning, fontWeight: '700' }}>
                  {row.isactive ? 'Active' : 'Void'}
                </TText>
              </View>
            </View>
            <View style={styles.actionGroup}>
              <TouchableOpacity 
                onPress={() => handleDownload(row)}
                disabled={downloading === row.billno}
              >
                {downloading === row.billno ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <Download size={18} color={colors.textSecondary} />
                )}
              </TouchableOpacity>
              <TouchableOpacity><MoreHorizontal size={18} color={colors.textSecondary} /></TouchableOpacity>
            </View>
          </View>
        ))}
      </TView>
    </WebLayout>
  );
};

const styles = StyleSheet.create({
  header: { marginBottom: 40 },
  toolbar: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  searchBox: { flex: 1, maxWidth: 400, height: 48, borderRadius: RADIUS.md, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  input: { flex: 1, marginLeft: 12 },
  filterBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, height: 48, borderRadius: RADIUS.md, borderWidth: 1 },
  tableCard: { borderRadius: RADIUS.xl, padding: 24 },
  tableHeader: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, marginBottom: 8 },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1 },
  col: { flex: 1 },
  avatar: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  actionGroup: { width: 80, flexDirection: 'row', justifyContent: 'flex-end', gap: 16 },
});
