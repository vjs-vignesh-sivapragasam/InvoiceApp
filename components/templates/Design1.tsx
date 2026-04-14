import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

interface InvoiceItem {
  name: string;
  hsn: string;
  box: string | number;
  pieces: string | number;
  price: string | number;
  disc?: string;
  cgst: string | number;
  sgst: string | number;
  rate: string | number;
  amount: string | number;
}

interface InvoiceData {
  business: {
    name?: string;
    address?: string;
    address2?: string;
    mobile?: string;
    gstin?: string;
    bankName?: string;
    accountNo?: string;
    ifsc?: string;
  };
  client: {
    clientname?: string;
    addressline1?: string;
    addressline2?: string;
    mobile?: string;
    gstin?: string;
  };
  billNo: string;
  billDate: string;
  items: InvoiceItem[];
  summary: {
    totalQty: string | number;
    totalAmount: string | number;
    beforeTax: string | number;
    afterTax: string | number;
  };
  docType?: 'quotation' | 'invoice';
}

export const Design1: React.FC<{ data: InvoiceData }> = ({ data }) => {
  const { business, client, billNo, billDate, items, summary, docType } = data;
  const isQuotation = docType === 'quotation';

  return (
    <View style={styles.container}>
      {isQuotation && (
        <View style={styles.watermarkContainer} pointerEvents="none">
           <Text style={styles.watermarkText}>QUOTATION</Text>
        </View>
      )}

      {/* Main Border */}
      <View style={styles.content}>
        
        {/* Header Section */}
        <View style={styles.headerRow}>
          <View style={styles.leftCol}>
            <Text style={styles.businessName}>{business.name || 'MK Agency'}</Text>
            {business.address ? <Text style={styles.headerText}>{business.address}</Text> : null}
            {business.address2 ? <Text style={styles.headerText}>{business.address2}</Text> : null}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              <Text style={styles.headerText}>Mobile: {business.mobile || '-'}</Text>
              <Text style={styles.headerText}>GSTIN: {business.gstin || '-'}</Text>
            </View>
          </View>

          <View style={styles.centerCol}>
            <View style={styles.taxInvoiceBox}>
              <Text style={styles.taxInvoiceText}>{isQuotation ? 'QUOTATION' : 'TAX INVOICE'}</Text>
            </View>
            
            <View style={styles.billMetaContainer}>
              <View style={styles.metaBox}>
                <Text style={styles.metaLabel}>{isQuotation ? 'REF' : 'BILL'} NO: {billNo}</Text>
              </View>
              <View style={styles.metaBox}>
                <Text style={styles.metaLabel}>DATE: {billDate}</Text>
              </View>
            </View>
          </View>

          <View style={styles.rightCol}>
            <Text style={styles.toText}>To, {client.clientname || '-'}</Text>
            <Text style={styles.headerTextRight}>{client.addressline1 || '-'}</Text>
            <Text style={styles.headerTextRight}>{client.addressline2 || ''}</Text>
            <Text style={styles.headerTextRight}>Mobile: {client.mobile || '-'}</Text>
            <Text style={styles.headerTextRight}>GSTIN: {client.gstin || '-'}</Text>
          </View>
        </View>

        {/* Table Section */}
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.cellHeader, { flex: 0.5 }]}>S.No</Text>
            <Text style={[styles.cellHeader, { flex: 2.5 }]}>Particulars</Text>
            <Text style={[styles.cellHeader, { flex: 0.8 }]}>HSN</Text>
            <Text style={[styles.cellHeader, { flex: 0.7 }]}>Box</Text>
            <Text style={[styles.cellHeader, { flex: 0.8 }]}>Pieces</Text>
            <Text style={[styles.cellHeader, { flex: 1 }]}>S.Price</Text>
            <Text style={[styles.cellHeader, { flex: 1.2 }]}>Disc</Text>
            <Text style={[styles.cellHeader, { flex: 1 }]}>CGST</Text>
            <Text style={[styles.cellHeader, { flex: 1 }]}>SGST</Text>
            <Text style={[styles.cellHeader, { flex: 1 }]}>Net Rate</Text>
            <Text style={[styles.cellHeader, { flex: 1.2, borderRightWidth: 0 }]}>Line Total</Text>
          </View>

          {items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.cell, { flex: 0.5 }]}>{index + 1}</Text>
              <Text style={[styles.cell, { flex: 2.5, fontWeight: '700' }]}>{item.name}</Text>
              <Text style={[styles.cell, { flex: 0.8 }]}>{item.hsn}</Text>
              <Text style={[styles.cell, { flex: 0.7 }]}>{item.box}</Text>
              <Text style={[styles.cell, { flex: 0.8 }]}>{item.pieces}</Text>
              <Text style={[styles.cell, { flex: 1 }]}>{item.price}</Text>
              <Text style={[styles.cell, { flex: 1.2 }]}>{item.disc || '0% - 0.00'}</Text>
              <Text style={[styles.cell, { flex: 1 }]}>{item.cgst}</Text>
              <Text style={[styles.cell, { flex: 1 }]}>{item.sgst}</Text>
              <Text style={[styles.cell, { flex: 1 }]}>{item.rate}</Text>
              <Text style={[styles.cell, { flex: 1.2, borderRightWidth: 0, textAlign: 'right' }]}>{item.amount}</Text>
            </View>
          ))}

          {/* Table Totals Row */}
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabelCell, { flex: 3.8 }]}>TOTAL QTY:</Text>
            <Text style={[styles.totalValueCell, { flex: 0.8 }]}>{summary.totalQty}</Text>
            <View style={{ flex: 4.4 }} />
            <Text style={[styles.totalLabelCell, { flex: 2 }]}>TOTAL AMOUNT:</Text>
            <Text style={[styles.totalValueCell, { flex: 1.2, borderRightWidth: 0, textAlign: 'right' }]}>{summary.totalAmount}</Text>
          </View>
        </View>

        {/* Amount Summary Section */}
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>TOTAL AMOUNT BEFORE TAX:</Text>
            <Text style={styles.summaryValue}>{summary.beforeTax}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>TOTAL AMOUNT AFTER TAX:</Text>
            <Text style={styles.summaryValue}>{summary.afterTax}</Text>
          </View>
        </View>

        {/* Footer Section */}
        <View style={styles.footerRow}>
          <View style={styles.bankContainer}>
            <View style={styles.bankHeaderBox}>
              <Text style={styles.bankHeaderText}>BANK DETAILS</Text>
            </View>
            <View style={styles.bankDetailRow}>
              <Text style={styles.bankLabel}>Bank Account Name:</Text>
              <Text style={styles.bankValue}>{business.bankName || '-'}</Text>
            </View>
            <View style={styles.bankDetailRow}>
              <Text style={styles.bankLabel}>Bank Account Number:</Text>
              <Text style={styles.bankValue}>{business.accountNo || '-'}</Text>
            </View>
            <View style={styles.bankDetailRow}>
              <Text style={styles.bankLabel}>IFSC Code:</Text>
              <Text style={styles.bankValue}>{business.ifsc || '-'}</Text>
            </View>
          </View>

          <View style={styles.signatureCol}>
            <Text style={styles.certifyText}>Certified that the particulars given above are true and correct.</Text>
            <View style={styles.agencyNameBox}>
              <Text style={styles.agencyNameText}>FOR {business.name || '-'}</Text>
            </View>
            <View style={{ height: 60 }} />
            <Text style={styles.signatoryText}>Authorised Signatory</Text>
          </View>
        </View>

      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 20,
    width: '100%',
    minHeight: 800,
  },
  content: {
    borderWidth: 2,
    borderColor: '#000',
    padding: 10,
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  leftCol: {
    flex: 1,
  },
  centerCol: {
    flex: 1.2,
    alignItems: 'center',
    paddingTop: 10,
  },
  rightCol: {
    flex: 1,
    alignItems: 'flex-end',
  },
  businessName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  headerText: {
    fontSize: 9,
    lineHeight: 12,
    color: '#333',
    marginBottom: 1,
  },
  headerTextRight: {
    fontSize: 9,
    lineHeight: 12,
    color: '#333',
    marginBottom: 1,
    textAlign: 'right',
  },
  toText: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  taxInvoiceBox: {
    backgroundColor: '#ccc',
    paddingHorizontal: 20,
    paddingVertical: 5,
    marginBottom: 15,
  },
  taxInvoiceText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
  billMetaContainer: {
    gap: 2,
    alignItems: 'center',
  },
  metaBox: {
    borderWidth: 1,
    borderColor: '#000',
    paddingHorizontal: 10,
    paddingVertical: 3,
    width: 180,
    backgroundColor: '#fff',
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: '800',
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: '#000',
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#ddd',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  cellHeader: {
    fontSize: 10,
    fontWeight: '800',
    padding: 4,
    borderRightWidth: 1,
    borderColor: '#000',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  cell: {
    fontSize: 10,
    padding: 4,
    borderRightWidth: 1,
    borderColor: '#000',
    textAlign: 'center',
  },
  totalRow: {
    flexDirection: 'row',
    backgroundColor: '#eee',
    borderTopWidth: 1,
    borderTopColor: '#000',
  },
  totalLabelCell: {
    fontSize: 10,
    fontWeight: '800',
    padding: 4,
    borderRightWidth: 1,
    borderColor: '#000',
    textAlign: 'right',
  },
  totalValueCell: {
    fontSize: 10,
    fontWeight: '800',
    padding: 4,
    borderRightWidth: 1,
    borderColor: '#000',
    textAlign: 'center',
  },
  summarySection: {
    alignItems: 'flex-end',
    marginTop: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    width: 250,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#000',
    padding: 4,
    marginTop: -1,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '800',
  },
  summaryValue: {
    fontSize: 10,
    fontWeight: '800',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    alignItems: 'flex-end',
  },
  bankContainer: {
    width: 350,
    borderWidth: 1,
    borderColor: '#000',
  },
  bankHeaderBox: {
    backgroundColor: '#ccc',
    padding: 4,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#000',
  },
  bankHeaderText: {
    fontSize: 10,
    fontWeight: '800',
  },
  bankDetailRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  bankLabel: {
    flex: 1,
    fontSize: 10,
    fontWeight: '700',
    padding: 4,
    borderRightWidth: 1,
    borderColor: '#eee',
  },
  bankValue: {
    flex: 1.5,
    fontSize: 10,
    padding: 4,
  },
  signatureCol: {
    alignItems: 'flex-end',
  },
  certifyText: {
    fontSize: 10,
    marginBottom: 8,
  },
  agencyNameBox: {
    backgroundColor: '#ccc',
    paddingHorizontal: 20,
    paddingVertical: 6,
    width: 350,
    alignItems: 'flex-end',
  },
  agencyNameText: {
    fontSize: 12,
    fontWeight: '900',
  },
  signatoryText: {
    fontSize: 10,
    fontWeight: '500',
  },
  watermarkContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  watermarkText: {
    fontSize: 80,
    fontWeight: '900',
    color: 'rgba(0,0,0,0.05)',
    transform: [{ rotate: '-45deg' }],
    textAlign: 'center',
    letterSpacing: 10,
  }
});
