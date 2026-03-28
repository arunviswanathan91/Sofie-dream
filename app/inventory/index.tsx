/**
 * Inventory screen — lists all inventory products (craft supplies / product templates).
 * Each product groups its materials and auto-calculates total material cost + suggested price.
 */
import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert, Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { useInventory } from '../../context/InventoryContext';
import { useTheme } from '../../context/ThemeContext';
import { getCurrencySymbol } from '../../lib/theme';
import type { InventoryProduct } from '../../types';

const T = {
  bg: '#FFF8F5',
  surfaceLow: '#F9F2EF',
  surfaceContainer: '#F3ECEA',
  surfaceHigh: '#EDE7E4',
  surfaceLowest: '#FFFFFF',
  primary: '#864D5F',
  primaryContainer: '#C9879A',
  onPrimary: '#FFFFFF',
  tertiary: '#994530',
  tertiaryFixed: '#FFDAD2',
  secondary: '#625E5A',
  secondaryContainer: '#E8E1DC',
  text: '#1D1B1A',
  subText: '#514346',
  outline: '#837376',
  outlineVariant: '#D5C2C5',
  error: '#BA1A1A',
  success: '#4A7C59',
};

function generateCSV(products: InventoryProduct[]): string {
  const lines = ['Product,Category,Materials,Total Cost,Suggested Price,Currency,Notes,Created'];
  products.forEach((p) => {
    const materialsStr = p.materials.map((m) => `${m.name}(${m.quantity}${m.unit}@${m.costPerUnit})`).join('; ');
    lines.push([
      `"${p.name}"`,
      `"${p.category ?? ''}"`,
      `"${materialsStr}"`,
      p.totalMaterialCost.toFixed(2),
      p.suggestedPrice.toFixed(2),
      `"${p.materials[0]?.currency ?? 'INR'}"`,
      `"${p.notes ?? ''}"`,
      format(new Date(p.createdAt), 'yyyy-MM-dd'),
    ].join(','));
  });
  return lines.join('\n');
}

export default function InventoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { products, loading, deleteProduct } = useInventory();
  const { colors } = useTheme();
  const [filter, setFilter] = useState<string>('all');

  const categories = ['all', ...Array.from(new Set(products.map((p) => p.category ?? 'Uncategorized')))];

  const filtered = filter === 'all'
    ? products
    : products.filter((p) => (p.category ?? 'Uncategorized') === filter);

  const handleDelete = (p: InventoryProduct) => {
    Alert.alert('Delete', `Delete "${p.name}" from inventory?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteProduct(p.id) },
    ]);
  };

  const handleExportCSV = async () => {
    const csv = generateCSV(products);
    await Share.share({ message: csv, title: 'Inventory Export.csv' });
  };

  const totalValue = products.reduce((sum, p) => sum + p.totalMaterialCost, 0);

  return (
    <SafeAreaView style={[s.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.bg }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backPill} hitSlop={12}>
          <Text style={s.backChevron}>‹</Text>
          <Text style={s.back}>Back</Text>
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: colors.text }]}>Inventory</Text>
        <TouchableOpacity
          style={s.addBtn}
          onPress={() => router.push('/inventory/new')}
          activeOpacity={0.85}
        >
          <Text style={s.addBtnTxt}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}>
        {/* Summary card */}
        <View style={s.summaryCard}>
          <View style={s.summaryRow}>
            <View style={s.summaryItem}>
              <Text style={s.summaryValue}>{products.length}</Text>
              <Text style={s.summaryLabel}>PRODUCTS</Text>
            </View>
            <View style={s.summaryDivider} />
            <View style={s.summaryItem}>
              <Text style={s.summaryValue}>₹{totalValue.toFixed(0)}</Text>
              <Text style={s.summaryLabel}>TOTAL INVESTED</Text>
            </View>
          </View>
        </View>

        {/* Export bar */}
        <View style={s.exportRow}>
          <TouchableOpacity style={s.exportBtn} onPress={handleExportCSV} activeOpacity={0.85}>
            <Text style={s.exportBtnTxt}>Export CSV</Text>
          </TouchableOpacity>
        </View>

        {/* Category filters */}
        {categories.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterScroll} contentContainerStyle={s.filterContent}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[s.filterChip, filter === cat && s.filterChipOn]}
                onPress={() => setFilter(cat)}
              >
                <Text style={[s.filterChipTxt, filter === cat && s.filterChipTxtOn]}>
                  {cat === 'all' ? 'All' : cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Product list */}
        <View style={s.list}>
          {loading && <Text style={s.emptyText}>Loading inventory…</Text>}
          {!loading && filtered.length === 0 && (
            <View style={s.emptyState}>
              <Text style={s.emptyEmoji}>🧶</Text>
              <Text style={s.emptyTitle}>No inventory yet</Text>
              <Text style={s.emptyBody}>
                Add products with their materials to track costs and get suggested prices.
              </Text>
              <TouchableOpacity
                style={s.emptyBtn}
                onPress={() => router.push('/inventory/new')}
              >
                <Text style={s.emptyBtnTxt}>Add first product →</Text>
              </TouchableOpacity>
            </View>
          )}

          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onPress={() => router.push(`/inventory/${product.id}`)}
              onDelete={() => handleDelete(product)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProductCard({ product, onPress, onDelete }: { product: InventoryProduct; onPress: () => void; onDelete: () => void }) {
  const currency = product.materials[0]?.currency ?? 'INR';
  const sym = getCurrencySymbol(currency);
  const hasReminder = !!product.nextReminderDate && new Date(product.nextReminderDate) <= new Date();

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.85}>
      {/* Left accent */}
      <View style={[s.cardAccent, { backgroundColor: hasReminder ? T.error : T.primary }]} />
      <View style={s.cardBody}>
        <View style={s.cardTop}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
            {product.emoji ? <Text style={{ fontSize: 22 }}>{product.emoji}</Text> : null}
            <View style={{ flex: 1 }}>
              <Text style={s.cardName} numberOfLines={1}>{product.name}</Text>
              {product.category ? <Text style={s.cardCategory}>{product.category}</Text> : null}
            </View>
          </View>
          <TouchableOpacity onPress={onDelete} hitSlop={8}>
            <Text style={s.deleteBtn}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={s.cardStats}>
          <View style={s.stat}>
            <Text style={s.statLabel}>MATERIALS</Text>
            <Text style={s.statValue}>{sym}{product.totalMaterialCost.toFixed(0)}</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statLabel}>SUGGESTED</Text>
            <Text style={[s.statValue, { color: T.tertiary }]}>{sym}{product.suggestedPrice.toFixed(0)}</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statLabel}>MARKUP</Text>
            <Text style={s.statValue}>{((product.markup - 1) * 100).toFixed(0)}%</Text>
          </View>
        </View>

        <View style={s.materialsRow}>
          <Text style={s.materialsLabel}>{product.materials.length} material{product.materials.length !== 1 ? 's' : ''}</Text>
          {product.materials.slice(0, 3).map((m) => (
            <View key={m.id} style={s.materialChip}>
              <Text style={s.materialChipTxt}>{m.name}</Text>
            </View>
          ))}
          {product.materials.length > 3 && (
            <View style={s.materialChip}>
              <Text style={s.materialChipTxt}>+{product.materials.length - 3} more</Text>
            </View>
          )}
        </View>

        {hasReminder && (
          <View style={s.reminderBadge}>
            <Text style={s.reminderBadgeTxt}>⏰ Reminder due</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  backPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: T.surfaceContainer, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7, gap: 2 },
  backChevron: { fontSize: 20, color: T.primary, lineHeight: 20, fontWeight: '300', marginTop: -1 },
  back: { fontSize: 13, fontFamily: 'DMSans', color: T.primary, fontWeight: '600' },
  headerTitle: { fontSize: 22, fontFamily: 'PlayfairDisplay', fontWeight: '700', color: T.text },
  addBtn: { backgroundColor: T.primary, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
  addBtnTxt: { color: '#FFFFFF', fontFamily: 'DMSans', fontSize: 13, fontWeight: '700' },
  summaryCard: { marginHorizontal: 16, marginBottom: 16, backgroundColor: T.primaryContainer, borderRadius: 20, padding: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center', gap: 4 },
  summaryValue: { fontSize: 28, fontFamily: 'PlayfairDisplay', fontWeight: '700', color: '#FFFFFF' },
  summaryLabel: { fontSize: 10, fontFamily: 'DMSans', fontWeight: '600', color: 'rgba(255,255,255,0.7)', letterSpacing: 1, textTransform: 'uppercase' },
  summaryDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  exportRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 8, gap: 10 },
  exportBtn: { flex: 1, backgroundColor: T.surfaceHigh, borderRadius: 999, paddingVertical: 10, alignItems: 'center' },
  exportBtnTxt: { fontSize: 13, fontFamily: 'DMSans', fontWeight: '600', color: T.subText },
  filterScroll: { marginBottom: 12 },
  filterContent: { paddingHorizontal: 16, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 999, backgroundColor: T.surfaceContainer, marginRight: 0 },
  filterChipOn: { backgroundColor: T.primary },
  filterChipTxt: { fontSize: 13, fontFamily: 'DMSans', fontWeight: '600', color: T.subText },
  filterChipTxtOn: { color: '#FFFFFF' },
  list: { paddingHorizontal: 16, gap: 12 },
  emptyText: { textAlign: 'center', fontFamily: 'DMSans', color: T.subText, paddingTop: 40 },
  emptyState: { alignItems: 'center', paddingTop: 40, gap: 12 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 20, fontFamily: 'PlayfairDisplay', fontWeight: '700', color: T.text },
  emptyBody: { fontSize: 14, fontFamily: 'DMSans', color: T.subText, textAlign: 'center', lineHeight: 22, paddingHorizontal: 16 },
  emptyBtn: { backgroundColor: T.primary, borderRadius: 999, paddingHorizontal: 28, paddingVertical: 14 },
  emptyBtnTxt: { color: '#FFFFFF', fontFamily: 'DMSans', fontSize: 14, fontWeight: '600' },
  card: { flexDirection: 'row', backgroundColor: T.surfaceLowest, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  cardAccent: { width: 4 },
  cardBody: { flex: 1, padding: 14, gap: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardName: { fontSize: 16, fontFamily: 'PlayfairDisplay', fontWeight: '700', color: T.text },
  cardCategory: { fontSize: 12, fontFamily: 'DMSans', color: T.subText, marginTop: 2 },
  deleteBtn: { fontSize: 14, color: T.outline, padding: 4 },
  cardStats: { flexDirection: 'row', gap: 16 },
  stat: { gap: 2 },
  statLabel: { fontSize: 9, fontFamily: 'DMSans', fontWeight: '600', color: T.subText, textTransform: 'uppercase', letterSpacing: 0.8 },
  statValue: { fontSize: 15, fontFamily: 'DMMono', fontWeight: '700', color: T.text },
  materialsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  materialsLabel: { fontSize: 11, fontFamily: 'DMSans', color: T.subText },
  materialChip: { backgroundColor: T.surfaceContainer, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  materialChipTxt: { fontSize: 11, fontFamily: 'DMSans', color: T.subText },
  reminderBadge: { backgroundColor: '#FFF3E0', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  reminderBadgeTxt: { fontSize: 11, fontFamily: 'DMSans', fontWeight: '600', color: T.tertiary },
});
