import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useCustomers } from '../../hooks/useCustomers';
import { useOrders } from '../../hooks/useOrders';
import { OrderCard } from '../../components/OrderCard';

// Design tokens — Stitch "Warm Artisan Editorial"
const T = {
  bg: '#FFF8F5',
  surfaceLow: '#F9F2EF',
  surfaceContainer: '#F3ECEA',
  surfaceHigh: '#EDE7E4',
  surfaceLowest: '#FFFFFF',
  primary: '#864D5F',
  primaryContainer: '#C9879A',
  primaryFixed: '#FFD9E2',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#522232',
  tertiary: '#994530',
  tertiaryFixed: '#FFDAD2',
  secondary: '#625E5A',
  text: '#1D1B1A',
  subText: '#514346',
  outline: '#837376',
  outlineVariant: '#D5C2C5',
};

export default function CustomerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { customers } = useCustomers();
  const { orders } = useOrders();

  const customer = useMemo(() => customers.find((c) => c.id === id), [customers, id]);
  const customerOrders = useMemo(
    () => orders.filter((o) => o.customerName === customer?.name),
    [orders, customer]
  );

  const completedOrders = useMemo(
    () => customerOrders.filter((o) => o.status === 'delivered' || o.status === 'shipped').length,
    [customerOrders]
  );

  if (!customer) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Customer not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const avatarInitial = customer.name.trim().charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with chevron back button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backPill} activeOpacity={0.7}>
          <Text style={styles.backChevron}>‹</Text>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <View style={{ width: 72 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero profile card */}
        <Animated.View entering={FadeInDown.delay(0).duration(400)} style={styles.heroCard}>
          {/* Decorative background blob */}
          <View style={styles.heroBlobTop} />
          <View style={styles.heroBlobBottom} />

          {/* Avatar */}
          <View style={styles.avatarWrapper}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{avatarInitial}</Text>
            </View>
            {/* Verified badge */}
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓</Text>
            </View>
          </View>

          {/* Customer name */}
          <Text style={styles.customerName}>{customer.name}</Text>

          {/* Verified client label */}
          <View style={styles.verifiedChip}>
            <Text style={styles.verifiedChipText}>✓ Verified client</Text>
          </View>

          {customer.instagram && (
            <Text style={styles.instagram}>{customer.instagram}</Text>
          )}

          {/* Location placeholder */}
          {customer.address ? (
            <Text style={styles.location}>📍 {customer.address}</Text>
          ) : null}

          {/* Stats row — animated */}
          <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{customer.totalOrders}</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: T.primary }]}>
                €{customer.totalSpent.toFixed(2)}
              </Text>
              <Text style={styles.statLabel}>Total Spent</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: T.tertiary }]}>
                {completedOrders}
              </Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
          </Animated.View>
        </Animated.View>

        {/* Contact Info */}
        {(customer.address || customer.phone || customer.instagram) && (
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.section}>
            <Text style={styles.sectionTitle}>Contact</Text>
            <View style={styles.contactCard}>
              {customer.address ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Address</Text>
                  <Text style={styles.infoValue}>{customer.address}</Text>
                </View>
              ) : null}
              {customer.phone ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={styles.infoValue}>{customer.phone}</Text>
                </View>
              ) : null}
              {customer.instagram ? (
                <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.infoLabel}>Instagram</Text>
                  <Text style={styles.infoValue}>{customer.instagram}</Text>
                </View>
              ) : null}
            </View>
          </Animated.View>
        )}

        {/* Order history */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section}>
          {/* Section title with count badge */}
          <View style={styles.orderHistoryHeader}>
            <Text style={styles.sectionTitle}>Order History</Text>
            <View style={styles.orderCountBadge}>
              <Text style={styles.orderCountText}>{customerOrders.length}</Text>
            </View>
          </View>
          {customerOrders.map((order, index) => (
            <Animated.View
              key={order.id}
              entering={FadeInDown.delay(250 + index * 50).duration(300)}
            >
              <OrderCard order={order} />
            </Animated.View>
          ))}
          {customerOrders.length === 0 && (
            <View style={styles.emptyOrders}>
              <Text style={styles.emptyText}>No orders yet</Text>
            </View>
          )}
        </Animated.View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.bg,
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    fontFamily: 'DMSans',
    color: T.subText,
    fontSize: 15,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.surfaceContainer,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 4,
  },
  backChevron: {
    fontSize: 22,
    color: T.primary,
    lineHeight: 22,
    marginTop: -1,
    fontWeight: '300',
  },
  backText: {
    fontSize: 13,
    fontFamily: 'DMSans',
    color: T.primary,
    fontWeight: '600',
  },

  // Hero card
  heroCard: {
    alignItems: 'center',
    padding: 24,
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: T.primaryFixed,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: T.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  heroBlobTop: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: T.primary,
    opacity: 0.06,
  },
  heroBlobBottom: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: T.tertiary,
    opacity: 0.04,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: T.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: T.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarText: {
    fontSize: 34,
    color: '#FFFFFF',
    fontFamily: 'PlayfairDisplay',
    fontWeight: '700',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: T.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: T.primaryFixed,
  },
  verifiedText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  customerName: {
    fontSize: 28,
    fontFamily: 'PlayfairDisplay',
    fontWeight: '700',
    color: T.onPrimaryContainer,
    marginBottom: 6,
    textAlign: 'center',
  },
  verifiedChip: {
    backgroundColor: T.primaryContainer + '30',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 8,
  },
  verifiedChipText: {
    fontSize: 11,
    fontFamily: 'DMSans',
    fontWeight: '700',
    color: T.primary,
    letterSpacing: 0.5,
  },
  instagram: {
    fontSize: 13,
    fontFamily: 'DMSans',
    color: T.subText,
    marginBottom: 4,
  },
  location: {
    fontSize: 12,
    fontFamily: 'DMSans',
    color: T.subText,
    marginBottom: 16,
  },
  // Stats row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginTop: 8,
    backgroundColor: T.surfaceLowest,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignSelf: 'stretch',
    shadowColor: T.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontFamily: 'PlayfairDisplay',
    fontWeight: '700',
    color: T.text,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: 'DMSans',
    color: T.subText,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: T.outlineVariant,
  },

  // Sections
  section: {
    paddingHorizontal: 16,
    paddingTop: 8,
    marginBottom: 8,
  },
  orderHistoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay',
    fontWeight: '700',
    color: T.text,
  },
  orderCountBadge: {
    backgroundColor: T.tertiary,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  orderCountText: {
    fontSize: 12,
    fontFamily: 'DMSans',
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Contact card
  contactCard: {
    backgroundColor: T.surfaceLowest,
    borderRadius: 16,
    padding: 16,
    shadowColor: 'rgba(0,0,0,0.03)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: T.outlineVariant,
  },
  infoLabel: {
    fontSize: 11,
    fontFamily: 'DMSans',
    color: T.subText,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'DMSans',
    color: T.text,
    flex: 2,
    textAlign: 'right',
  },

  // Empty orders
  emptyOrders: {
    paddingVertical: 24,
    alignItems: 'center',
    backgroundColor: T.surfaceLow,
    borderRadius: 16,
  },
  emptyText: {
    fontFamily: 'DMSans',
    color: T.subText,
    fontSize: 14,
  },
});
