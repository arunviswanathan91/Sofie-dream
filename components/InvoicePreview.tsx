import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { generateInvoiceHTML } from '../lib/reports';
import { Spacing, BorderRadius, getCurrencySymbol } from '../lib/theme';
import type { Order } from '../types';

// Stitch "Warm Artisan Editorial" tokens
const PRIMARY = '#864D5F';
const PRIMARY_CONTAINER = '#C9879A';
const ON_PRIMARY = '#FFFFFF';
const ON_PRIMARY_CONTAINER = '#522232';
const TERTIARY = '#994530';
const SURFACE_LOWEST = '#FFFFFF';
const SURFACE_LOW = '#F9F2EF';
const OUTLINE_VARIANT = '#D5C2C5';
const TEXT = '#1D1B1A';
const SUB_TEXT = '#514346';

interface Props {
  order: Order;
  businessName: string;
  businessTagline?: string;
  businessAddress?: string;
  gstNumber?: string;
}

export function InvoicePreview({ order, businessName, businessTagline, businessAddress, gstNumber }: Props) {
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const html = generateInvoiceHTML(order, businessName, businessTagline, order.invoiceNumber, businessAddress, gstNumber);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Invoice — ${order.orderName}`,
        UTI: 'com.adobe.pdf',
      });
    } catch (e) {
      Alert.alert('Error', 'Failed to generate invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const symbol = getCurrencySymbol(order.currency);

  return (
    <View style={styles.container}>
      <View style={styles.preview}>
        {/* Header */}
        <View style={styles.previewHeader}>
          <Text style={styles.businessName}>{businessName.toUpperCase()}</Text>
          <Text style={styles.invoiceLabel}>INVOICE</Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        <Text style={styles.billTo}>{order.customerName}</Text>
        <Text style={styles.address}>{order.customerAddress}</Text>

        <View style={styles.divider} />

        {/* Line item */}
        <View style={styles.lineItem}>
          <Text style={styles.itemName}>{order.orderName}</Text>
          <Text style={styles.itemPrice}>
            {symbol}{order.askingPrice.toFixed(2)}
          </Text>
        </View>

        {/* Total section */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>TOTAL DUE</Text>
          <Text style={styles.totalValue}>
            {symbol}{order.askingPrice.toFixed(2)}
          </Text>
        </View>

        {/* Status badge */}
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: order.isPaid ? 'rgba(153,69,48,0.1)' : 'rgba(134,77,95,0.1)' },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: order.isPaid ? TERTIARY : PRIMARY },
              ]}
            >
              {order.isPaid ? '● PAID' : '○ UNPAID'}
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={handleGenerate}
        disabled={loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color={ON_PRIMARY} size="small" />
        ) : (
          <Text style={styles.buttonText}>Generate & Share PDF Invoice</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.md },
  preview: {
    backgroundColor: SURFACE_LOWEST,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  businessName: {
    fontSize: 14,
    fontFamily: 'PlayfairDisplay',
    color: PRIMARY,
    letterSpacing: 2,
  },
  invoiceLabel: {
    fontSize: 14,
    fontFamily: 'DMSans',
    color: SUB_TEXT,
    letterSpacing: 2,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: OUTLINE_VARIANT,
    opacity: 0.4,
    marginVertical: Spacing.sm,
  },
  billTo: {
    fontSize: 13,
    fontFamily: 'DMSans',
    color: TEXT,
    fontWeight: '600',
  },
  address: {
    fontSize: 12,
    fontFamily: 'DMSans',
    color: SUB_TEXT,
    marginTop: 2,
  },
  lineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
    paddingVertical: Spacing.xs,
    backgroundColor: SURFACE_LOW,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  itemName: {
    fontSize: 13,
    fontFamily: 'DMSans',
    color: TEXT,
    flex: 1,
  },
  itemPrice: {
    fontSize: 13,
    fontFamily: 'DMSans',
    color: TEXT,
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    backgroundColor: PRIMARY_CONTAINER,
    borderRadius: BorderRadius.sm,
  },
  totalLabel: {
    fontSize: 11,
    fontFamily: 'DMSans',
    color: ON_PRIMARY_CONTAINER,
    letterSpacing: 1,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 15,
    fontFamily: 'DMSans',
    color: ON_PRIMARY_CONTAINER,
    fontWeight: '700',
  },
  statusRow: {
    marginTop: Spacing.sm,
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'DMSans',
    letterSpacing: 1,
    fontWeight: '600',
  },
  button: {
    backgroundColor: PRIMARY,
    borderRadius: BorderRadius.pill,
    padding: Spacing.md,
    alignItems: 'center',
    shadowColor: 'rgba(134,77,95,0.25)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonText: {
    color: ON_PRIMARY,
    fontFamily: 'DMSans',
    fontSize: 14,
    fontWeight: '600',
  },
});
