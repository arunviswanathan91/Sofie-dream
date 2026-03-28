import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useOrders } from '../../hooks/useOrders';
import { useTheme } from '../../context/ThemeContext';
import { OrderCard } from '../../components/OrderCard';
import { FAB } from '../../components/FAB';
import type { OrderStatus } from '../../types';

// Colors driven by useTheme()

type SortOption = 'dueDate' | 'createdAt' | 'price' | 'customer';

type FilterValue = OrderStatus | 'all' | 'unpaid';

const STATUS_FILTERS: { label: string; value: FilterValue }[] = [
  { label: 'All', value: 'all' },
  { label: 'Unpaid', value: 'unpaid' },
  { label: 'Request', value: 'request' },
  { label: 'Accepted', value: 'accepted' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
];

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: 'Due Date', value: 'dueDate' },
  { label: 'Created', value: 'createdAt' },
  { label: 'Price', value: 'price' },
  { label: 'Customer', value: 'customer' },
];

export default function OrdersScreen() {
  const router = useRouter();
  const { orders, loading } = useOrders();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;
  const numColumns = isTablet ? 2 : 1;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterValue>('all');
  const [sortBy, setSortBy] = useState<SortOption>('dueDate');

  // Count new requests for badge
  const requestCount = useMemo(
    () => orders.filter((o) => o.status === 'request').length,
    [orders]
  );

  const filtered = useMemo(() => {
    let result = [...orders];

    if (statusFilter === 'unpaid') {
      result = result.filter((o) => !o.isPaid && o.status !== 'cancelled');
    } else if (statusFilter !== 'all') {
      result = result.filter((o) => o.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.orderName.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'price':
          return b.askingPrice - a.askingPrice;
        case 'customer':
          return a.customerName.localeCompare(b.customerName);
        default:
          return 0;
      }
    });

    return result;
  }, [orders, search, statusFilter, sortBy]);

  const c = colors;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <Text style={[styles.headerTitle, { color: c.text }]}>Orders ✦</Text>
        {requestCount > 0 && (
          <View style={[styles.requestBadge, { backgroundColor: c.accent }]}>
            <Text style={styles.requestBadgeText}>{requestCount} new</Text>
          </View>
        )}
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: c.surfaceLow }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: c.text }]}
            placeholder="Search orders, customers, tags..."
            placeholderTextColor={c.outline}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Status Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersRow}
        contentContainerStyle={styles.filtersContent}
      >
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[
              styles.filterChip,
              { backgroundColor: statusFilter === f.value ? c.primary : c.surfaceHighest },
            ]}
            onPress={() => setStatusFilter(f.value)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterLabel, { color: statusFilter === f.value ? c.onPrimary : c.subText }]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sort row */}
      <View style={styles.sortRow}>
        <Text style={[styles.sortRowTitle, { color: c.primary }]}>Recent Orders</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sortContent}
        >
          {SORT_OPTIONS.map((s) => (
            <TouchableOpacity
              key={s.value}
              onPress={() => setSortBy(s.value)}
              style={[styles.sortBtn, sortBy === s.value && { backgroundColor: c.surfaceContainer }]}
            >
              <Text style={[styles.sortOption, { color: sortBy === s.value ? c.primary : c.subText }]}>
                {sortBy === s.value ? '⇅ ' : ''}{s.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Orders list */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: c.subText }]}>Loading orders...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>✦</Text>
          <Text style={[styles.emptyTitle, { color: c.text }]}>
            {search ? 'No matching orders' : 'No orders yet'}
          </Text>
          {!search && (
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: c.primary }]}
              onPress={() => router.push('/order/new')}
            >
              <Text style={styles.emptyButtonText}>Add your first order →</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          key={`orders-${numColumns}`}
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeInDown.delay(index * 40).duration(300)}
              style={isTablet ? styles.tabletItem : undefined}
            >
              <OrderCard order={item} />
            </Animated.View>
          )}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={isTablet ? styles.columnWrapper : undefined}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          style={styles.list}
        />
      )}

      <FAB onPress={() => router.push('/order/new')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4, gap: 12 },
  headerTitle: { fontSize: 28, fontFamily: 'PlayfairDisplay', fontWeight: '700', flex: 1 },
  requestBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  requestBadgeText: { fontSize: 11, fontFamily: 'DMSans', fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.5 },
  searchContainer: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  searchBar: { flexDirection: 'row', alignItems: 'center', borderRadius: 999, paddingHorizontal: 20, height: 52, gap: 10 },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontFamily: 'DMSans', fontSize: 14 },
  filtersRow: { maxHeight: 48, marginBottom: 4 },
  filtersContent: { paddingHorizontal: 16, gap: 10, alignItems: 'center' },
  filterChip: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 999 },
  filterLabel: { fontSize: 13, fontFamily: 'DMSans', fontWeight: '600' },
  sortRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  sortRowTitle: { fontSize: 18, fontFamily: 'PlayfairDisplay', fontWeight: '700', flexShrink: 0, marginRight: 8 },
  sortContent: { gap: 4, alignItems: 'center' },
  sortBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  sortOption: { fontSize: 11, fontFamily: 'DMSans', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 16, paddingBottom: 120, gap: 12 },
  columnWrapper: { gap: 12 },
  tabletItem: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontFamily: 'PlayfairDisplay', fontSize: 16 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 20, fontFamily: 'PlayfairDisplay', fontWeight: '700', textAlign: 'center' },
  emptyButton: { borderRadius: 999, paddingHorizontal: 28, paddingVertical: 14 },
  emptyButtonText: { color: '#FFFFFF', fontFamily: 'DMSans', fontSize: 14, fontWeight: '600' },
});
