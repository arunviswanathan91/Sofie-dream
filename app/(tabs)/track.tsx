import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  FlatList,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOrders } from '../../hooks/useOrders';
import { useCategories } from '../../hooks/useCategories';
import { useTheme } from '../../context/ThemeContext';
import { useProfile } from '../../hooks/useProfile';
import { RevenueByCategoryChart } from '../../components/EarningsChart';
import { Spacing, BorderRadius, getCurrencySymbol } from '../../lib/theme';
import type { CraftCategory } from '../../types';

// Stitch "Warm Artisan Editorial" tokens
const PRIMARY = '#864D5F';
const PRIMARY_CONTAINER = '#C9879A';
const ON_PRIMARY = '#FFFFFF';
const TERTIARY = '#994530';
const SURFACE_LOW = '#F9F2EF';
const OUTLINE_VARIANT = '#D5C2C5';

const EMOJI_OPTIONS = ['✦', '◆', '◇', '⌂', '✧', '★', '♦', '❋', '✿', '❀', '✂', '⊕'];
// Category color swatches using Stitch palette
const COLOR_OPTIONS = [PRIMARY, PRIMARY_CONTAINER, TERTIARY, '#625E5A', '#C9879A', '#994530'];

export default function TrackScreen() {
  const { orders } = useOrders();
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories();
  const { colors } = useTheme();
  const { profile } = useProfile();
  const symbol = getCurrencySymbol(profile.currency);
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;

  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('✦');
  const [newColor, setNewColor] = useState(PRIMARY_CONTAINER);
  const [revenueView, setRevenueView] = useState<'month' | 'all'>('month');

  const categoryStats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return categories.map((cat) => {
      const catOrders = orders.filter((o) => o.craftCategory === cat.name);
      const activeCount = catOrders.filter((o) =>
        ['request', 'accepted', 'shipped'].includes(o.status)
      ).length;
      const monthRevenue = catOrders
        .filter((o) => o.status === 'delivered' && o.isPaid && new Date(o.createdAt) >= monthStart)
        .reduce((sum, o) => sum + o.askingPrice, 0);
      const totalRevenue = catOrders
        .filter((o) => o.status === 'delivered' && o.isPaid)
        .reduce((sum, o) => sum + o.askingPrice, 0);

      return { ...cat, activeCount, monthRevenue, totalRevenue, totalOrders: catOrders.length };
    });
  }, [categories, orders]);

  const revenueByCategory = useMemo(() => {
    const result: Record<string, number> = {};
    categoryStats.forEach((c) => {
      result[c.name] = revenueView === 'month' ? c.monthRevenue : c.totalRevenue;
    });
    return result;
  }, [categoryStats, revenueView]);

  const [addingCategory, setAddingCategory] = useState(false);

  const handleAddCategory = async () => {
    if (!newName.trim()) return;
    setAddingCategory(true);
    try {
      setShowAddModal(false);
      await addCategory({ name: newName.trim(), emoji: newEmoji, color: newColor });
      setNewName('');
      setNewEmoji('✦');
      setNewColor(PRIMARY_CONTAINER);
    } catch (e) {
      Alert.alert('Error', 'Could not add category. Please try again.');
      setShowAddModal(true);
    } finally {
      setAddingCategory(false);
    }
  };

  const handleDeleteCategory = (cat: CraftCategory) => {
    Alert.alert(
      'Delete Category',
      `Delete "${cat.name}"? Orders in this category won't be affected.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteCategory(cat.id),
        },
      ]
    );
  };

  // Adaptive category card width
  const cardWidth = isTablet ? (width >= 840 ? '31%' : '47%') : '47%';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={[styles.screenTitle, { color: colors.text }]}>Craft Tracking</Text>

        {/* Revenue Chart */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.subText }]}>Revenue by Category</Text>
            <View style={[styles.toggleRow, { backgroundColor: colors.cardBorder }]}>
              {(['month', 'all'] as const).map((v) => (
                <TouchableOpacity
                  key={v}
                  style={[styles.toggle, revenueView === v && { backgroundColor: colors.card }]}
                  onPress={() => setRevenueView(v)}
                >
                  <Text style={[styles.toggleText, { color: colors.subText }, revenueView === v && { color: colors.text, fontWeight: '600' }]}>
                    {v === 'month' ? 'Month' : 'All Time'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <RevenueByCategoryChart data={revenueByCategory} colors={colors} currencySymbol={symbol} />
        </View>

        {/* Category Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.subText }]}>Categories</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <Text style={styles.addButtonText}>+ Add</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.categoryGrid}>
            {categoryStats.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryCard, { backgroundColor: colors.card, borderColor: colors.cardBorder, borderLeftColor: cat.color, width: cardWidth as any }]}
                onLongPress={() => handleDeleteCategory(cat)}
                activeOpacity={0.85}
              >
                <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                <Text style={[styles.categoryName, { color: colors.text }]}>{cat.name}</Text>
                <Text style={[styles.categoryOrders, { color: colors.subText }]}>
                  {cat.totalOrders} order{cat.totalOrders !== 1 ? 's' : ''}
                </Text>
                {cat.activeCount > 0 && (
                  <View style={[styles.activeBadge, { backgroundColor: `${cat.color}22` }]}>
                    <Text style={[styles.activeText, { color: cat.color }]}>
                      {cat.activeCount} active
                    </Text>
                  </View>
                )}
                {(revenueView === 'month' ? cat.monthRevenue : cat.totalRevenue) > 0 && (
                  <Text style={[styles.categoryRevenue, { color: cat.color }]}>
                    {symbol}{(revenueView === 'month' ? cat.monthRevenue : cat.totalRevenue).toFixed(0)}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Add Category Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.bg }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>New Category</Text>

            <TextInput
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.cardBorder, color: colors.text }]}
              placeholder="Category name"
              placeholderTextColor={colors.subText}
              value={newName}
              onChangeText={setNewName}
            />

            <Text style={[styles.inputLabel, { color: colors.subText }]}>Emoji</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.emojiRow}>
              {EMOJI_OPTIONS.map((e) => (
                <TouchableOpacity
                  key={e}
                  style={[styles.emojiOption, { borderColor: colors.cardBorder }, newEmoji === e && styles.emojiOptionActive]}
                  onPress={() => setNewEmoji(e)}
                >
                  <Text style={styles.emojiText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.inputLabel, { color: colors.subText }]}>Color</Text>
            <View style={styles.colorRow}>
              {COLOR_OPTIONS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: c },
                    newColor === c && styles.colorSwatchActive,
                  ]}
                  onPress={() => setNewColor(c)}
                />
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: colors.cardBorder }]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={[styles.cancelText, { color: colors.subText }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveButton, addingCategory && { opacity: 0.6 }]} onPress={handleAddCategory} disabled={addingCategory}>
                <Text style={styles.saveText}>{addingCategory ? 'Adding…' : 'Add Category'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 24,
  },
  screenTitle: {
    fontSize: 26,
    fontFamily: 'PlayfairDisplay',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  section: {
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'DMSans',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 4,
    borderRadius: BorderRadius.full,
    padding: 2,
  },
  toggle: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  toggleText: {
    fontSize: 11,
    fontFamily: 'DMSans',
  },
  addButton: {
    backgroundColor: PRIMARY_CONTAINER,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  addButtonText: {
    fontSize: 12,
    fontFamily: 'DMSans',
    color: ON_PRIMARY,
    fontWeight: '600',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryCard: {
    width: '47%',
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    borderLeftWidth: 4,
    gap: 4,
  },
  categoryEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 13,
    fontFamily: 'DMSans',
    fontWeight: '600',
  },
  categoryOrders: {
    fontSize: 11,
    fontFamily: 'DMSans',
  },
  activeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginTop: 2,
  },
  activeText: {
    fontSize: 10,
    fontFamily: 'DMMono',
  },
  categoryRevenue: {
    fontSize: 16,
    fontFamily: 'PlayfairDisplay-Bold',
    fontWeight: '600',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'PlayfairDisplay',
  },
  input: {
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontFamily: 'DMSans',
    fontSize: 15,
    borderWidth: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: 'DMSans',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  emojiRow: {
    maxHeight: 44,
  },
  emojiOption: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.sm,
    marginRight: 6,
    borderWidth: 1,
  },
  emojiOptionActive: {
    borderColor: PRIMARY,
    backgroundColor: 'rgba(134,77,95,0.07)',
  },
  emojiText: {
    fontSize: 20,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 10,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  colorSwatchActive: {
    borderWidth: 3,
    borderColor: '#1D1B1A',
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  cancelButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  cancelText: {
    fontFamily: 'DMSans',
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
    padding: Spacing.md,
    borderRadius: BorderRadius.pill,
    backgroundColor: PRIMARY,
    alignItems: 'center',
  },
  saveText: {
    fontFamily: 'DMSans',
    color: ON_PRIMARY,
    fontWeight: '600',
    fontSize: 15,
  },
});
