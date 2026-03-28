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
import { useTheme, type ThemeColors } from '../../context/ThemeContext';
import { getCurrencySymbol } from '../../lib/theme';
import type { InventoryProduct } from '../../types';

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
  const c = colors;
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
    <SafeAreaView style={[s.container, { backgroundColor: c.bg }]}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: c.bg }]}>
        <TouchableOpacity onPress={() => router.back()} style={[s.backPill, { backgroundColor: c.surfaceContainer }]} hitSlop={12}>
          <Text style={[s.backChevron, { color: c.primary }]}>‹</Text>
          <Text style={[s.back, { color: c.primary }]}>Back</Text>
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: c.text }]}>Inventory</Text>
        <TouchableOpacity
          style={[s.addBtn, { backgroundColor: c.primary }]}
          onPress={() => router.push('/inventory/new')}
          activeOpacity={0.85}
        >
          <Text style={[s.addBtnTxt, { color: c.onPrimary }]}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}>
        {/* Summary card */}
        <View style={[s.summaryCard, { backgroundColor: c.primaryContainer }]}>
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
          <TouchableOpacity style={[s.exportBtn, { backgroundColor: c.surfaceHigh }]} onPress={handleExportCSV} activeOpacity={0.85}>
            <Text style={[s.exportBtnTxt, { color: c.subText }]}>Export CSV</Text>
          </TouchableOpacity>
        </View>

        {/* Category filters */}
        {categories.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterScroll} contentContainerStyle={s.filterContent}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[s.filterChip, { backgroundColor: filter === cat ? c.primary : c.surfaceContainer }]}
                onPress={() => setFilter(cat)}
              >
                <Text style={[s.filterChipTxt, { color: filter === cat ? c.onPrimary : c.subText }]}>
                  {cat === 'all' ? 'All' : cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Product list */}
        <View style={s.list}>
          {loading && <Text style={[s.emptyText, { color: c.subText }]}>Loading inventory…</Text>}
          {!loading && filtered.length === 0 && (
            <View style={s.emptyState}>
              <Text style={s.emptyEmoji}>🧶</Text>
              <Text style={[s.emptyTitle, { color: c.text }]}>No inventory yet</Text>
              <Text style={[s.emptyBody, { color: c.subText }]}>
                Add products with their materials to track costs and get suggested prices.
              </Text>
              <TouchableOpacity
                style={[s.emptyBtn, { backgroundColor: c.primary }]}
                onPress={() => router.push('/inventory/new')}
              >
                <Text style={[s.emptyBtnTxt, { color: c.onPrimary }]}>Add first product →</Text>
              </TouchableOpacity>
            </View>
          )}

          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              colors={c}
              onPress={() => router.push(`/inventory/${product.id}`)}
              onDelete={() => handleDelete(product)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProductCard({ product, colors, onPress, onDelete }: {
  product: InventoryProduct;
  colors: ThemeColors;
  onPress: () => void;
  onDelete: () => void;
}) {
  const c = colors;
  const currency = product.materials[0]?.currency ?? 'INR';
  const sym = getCurrencySymbol(currency);
  const hasReminder = !!product.nextReminderDate && new Date(product.nextReminderDate) <= new Date();

  return (
    <TouchableOpacity style={[s.card, { backgroundColor: c.surfaceLowest }]} onPress={onPress} activeOpacity={0.85}>
      {/* Left accent */}
      <View style={[s.cardAccent, { backgroundColor: hasReminder ? c.error : c.primary }]} />
      <View style={s.cardBody}>
        <View style={s.cardTop}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
            {product.emoji ? <Text style={{ fontSize: 22 }}>{product.emoji}</Text> : null}
            <View style={{ flex: 1 }}>
              <Text style={[s.cardName, { color: c.text }]} numberOfLines={1}>{product.name}</Text>
              {product.category ? <Text style={[s.cardCategory, { color: c.subText }]}>{product.category}</Text> : null}
            </View>
          </View>
          <TouchableOpacity onPress={onDelete} hitSlop={8}>
            <Text style={[s.deleteBtn, { color: c.outline }]}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={s.cardStats}>
          <View style={s.stat}>
            <Text style={[s.statLabel, { color: c.subText }]}>MATERIALS</Text>
            <Text style={[s.statValue, { color: c.text }]}>{sym}{product.totalMaterialCost.toFixed(0)}</Text>
          </View>
          <View style={s.stat}>
            <Text style={[s.statLabel, { color: c.subText }]}>SUGGESTED</Text>
            <Text style={[s.statValue, { color: c.accent }]}>{sym}{product.suggestedPrice.toFixed(0)}</Text>
          </View>
          <View style={s.stat}>
            <Text style={[s.statLabel, { color: c.subText }]}>MARKUP</Text>
            <Text style={[s.statValue, { color: c.text }]}>{((product.markup - 1) * 100).toFixed(0)}%</Text>
          </View>
        </View>

        <View style={s.materialsRow}>
          <Text style={[s.materialsLabel, { color: c.subText }]}>{product.materials.length} material{product.materials.length !== 1 ? 's' : ''}</Text>
          {product.materials.slice(0, 3).map((m) => (
            <View key={m.id} style={[s.materialChip, { backgroundColor: c.surfaceContainer }]}>
              <Text style={[s.materialChipTxt, { color: c.subText }]}>{m.name}</Text>
            </View>
          ))}
          {product.materials.length > 3 && (
            <View style={[s.materialChip, { backgroundColor: c.surfaceContainer }]}>
              <Text style={[s.materialChipTxt, { color: c.subText }]}>+{product.materials.length - 3} more</Text>
            </View>
          )}
        </View>

        {hasReminder && (
          <View style={[s.reminderBadge, { backgroundColor: c.accentContainer }]}>
            <Text style={[s.reminderBadgeTxt, { color: c.accent }]}>⏰ Reminder due</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  backPill: { flexDirection: 'row', alignItems: 'center', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7, gap: 2 },
  backChevron: { fontSize: 20, lineHeight: 20, fontWeight: '300', marginTop: -1 },
  back: { fontSize: 13, fontFamily: 'DMSans', fontWeight: '600' },
  headerTitle: { fontSize: 22, fontFamily: 'PlayfairDisplay', fontWeight: '700' },
  addBtn: { borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
  addBtnTxt: { fontFamily: 'DMSans', fontSize: 13, fontWeight: '700' },
  summaryCard: { marginHorizontal: 16, marginBottom: 16, borderRadius: 20, padding: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  summaryItem: { alignItems: 'center', gap: 4 },
  summaryValue: { fontSize: 28, fontFamily: 'PlayfairDisplay', fontWeight: '700', color: '#FFFFFF' },
  summaryLabel: { fontSize: 10, fontFamily: 'DMSans', fontWeight: '600', color: 'rgba(255,255,255,0.7)', letterSpacing: 1, textTransform: 'uppercase' },
  summaryDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  exportRow: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 8, gap: 10 },
  exportBtn: { flex: 1, borderRadius: 999, paddingVertical: 10, alignItems: 'center' },
  exportBtnTxt: { fontSize: 13, fontFamily: 'DMSans', fontWeight: '600' },
  filterScroll: { marginBottom: 12 },
  filterContent: { paddingHorizontal: 16, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 999, marginRight: 0 },
  filterChipTxt: { fontSize: 13, fontFamily: 'DMSans', fontWeight: '600' },
  list: { paddingHorizontal: 16, gap: 12 },
  emptyText: { textAlign: 'center', fontFamily: 'DMSans', paddingTop: 40 },
  emptyState: { alignItems: 'center', paddingTop: 40, gap: 12 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 20, fontFamily: 'PlayfairDisplay', fontWeight: '700' },
  emptyBody: { fontSize: 14, fontFamily: 'DMSans', textAlign: 'center', lineHeight: 22, paddingHorizontal: 16 },
  emptyBtn: { borderRadius: 999, paddingHorizontal: 28, paddingVertical: 14 },
  emptyBtnTxt: { fontFamily: 'DMSans', fontSize: 14, fontWeight: '600' },
  card: { flexDirection: 'row', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2, marginBottom: 0 },
  cardAccent: { width: 4 },
  cardBody: { flex: 1, padding: 14, gap: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardName: { fontSize: 16, fontFamily: 'PlayfairDisplay', fontWeight: '700' },
  cardCategory: { fontSize: 12, fontFamily: 'DMSans', marginTop: 2 },
  deleteBtn: { fontSize: 14, padding: 4 },
  cardStats: { flexDirection: 'row', gap: 16 },
  stat: { gap: 2 },
  statLabel: { fontSize: 9, fontFamily: 'DMSans', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
  statValue: { fontSize: 15, fontFamily: 'DMMono', fontWeight: '700' },
  materialsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  materialsLabel: { fontSize: 11, fontFamily: 'DMSans' },
  materialChip: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  materialChipTxt: { fontSize: 11, fontFamily: 'DMSans' },
  reminderBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  reminderBadgeTxt: { fontSize: 11, fontFamily: 'DMSans', fontWeight: '600' },
});
