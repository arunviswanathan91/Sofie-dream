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
import { useTheme } from '../../context/ThemeContext';
import { OrderCard } from '../../components/OrderCard';

export default function CustomerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { customers } = useCustomers();
  const { orders } = useOrders();
  const { colors } = useTheme();
  const c = colors;

  const customer = useMemo(() => customers.find((cu) => cu.id === id), [customers, id]);
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
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
        <View style={styles.notFound}>
          <Text style={[styles.notFoundText, { color: c.subText }]}>Customer not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const avatarInitial = customer.name.trim().charAt(0).toUpperCase();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      {/* Header with chevron back button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backPill, { backgroundColor: c.surfaceContainer }]} activeOpacity={0.7}>
          <Text style={[styles.backChevron, { color: c.primary }]}>‹</Text>
          <Text style={[styles.backText, { color: c.primary }]}>Back</Text>
        </TouchableOpacity>
        <View style={{ width: 72 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero profile card */}
        <Animated.View entering={FadeInDown.delay(0).duration(400)} style={[styles.heroCard, { backgroundColor: c.accentContainer, shadowColor: c.primary }]}>
          {/* Decorative background blob */}
          <View style={[styles.heroBlobTop, { backgroundColor: c.primary }]} />
          <View style={[styles.heroBlobBottom, { backgroundColor: c.accent }]} />

          {/* Avatar */}
          <View style={styles.avatarWrapper}>
            <View style={[styles.avatar, { backgroundColor: c.primaryContainer, shadowColor: c.primary }]}>
              <Text style={styles.avatarText}>{avatarInitial}</Text>
            </View>
            {/* Verified badge */}
            <View style={[styles.verifiedBadge, { backgroundColor: c.accent, borderColor: c.accentContainer }]}>
              <Text style={styles.verifiedText}>✓</Text>
            </View>
          </View>

          {/* Customer name */}
          <Text style={[styles.customerName, { color: c.onPrimary }]}>{customer.name}</Text>

          {/* Verified client label */}
          <View style={[styles.verifiedChip, { backgroundColor: c.primaryContainer + '30' }]}>
            <Text style={[styles.verifiedChipText, { color: c.primary }]}>✓ Verified client</Text>
          </View>

          {customer.instagram && (
            <Text style={[styles.instagram, { color: c.subText }]}>{customer.instagram}</Text>
          )}

          {/* Location placeholder */}
          {customer.address ? (
            <Text style={[styles.location, { color: c.subText }]}>📍 {customer.address}</Text>
          ) : null}

          {/* Stats row — animated */}
          <Animated.View entering={FadeInDown.delay(150).duration(400)} style={[styles.statsRow, { backgroundColor: c.card, shadowColor: c.primary }]}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: c.text }]}>{customer.totalOrders}</Text>
              <Text style={[styles.statLabel, { color: c.subText }]}>Orders</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: c.outlineVariant }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: c.primary }]}>
                €{customer.totalSpent.toFixed(2)}
              </Text>
              <Text style={[styles.statLabel, { color: c.subText }]}>Total Spent</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: c.outlineVariant }]} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: c.accent }]}>
                {completedOrders}
              </Text>
              <Text style={[styles.statLabel, { color: c.subText }]}>Completed</Text>
            </View>
          </Animated.View>
        </Animated.View>

        {/* Contact Info */}
        {(customer.address || customer.phone || customer.instagram) && (
          <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: c.text }]}>Contact</Text>
            <View style={[styles.contactCard, { backgroundColor: c.card }]}>
              {customer.address ? (
                <View style={[styles.infoRow, { borderBottomColor: c.outlineVariant }]}>
                  <Text style={[styles.infoLabel, { color: c.subText }]}>Address</Text>
                  <Text style={[styles.infoValue, { color: c.text }]}>{customer.address}</Text>
                </View>
              ) : null}
              {customer.phone ? (
                <View style={[styles.infoRow, { borderBottomColor: c.outlineVariant }]}>
                  <Text style={[styles.infoLabel, { color: c.subText }]}>Phone</Text>
                  <Text style={[styles.infoValue, { color: c.text }]}>{customer.phone}</Text>
                </View>
              ) : null}
              {customer.instagram ? (
                <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                  <Text style={[styles.infoLabel, { color: c.subText }]}>Instagram</Text>
                  <Text style={[styles.infoValue, { color: c.text }]}>{customer.instagram}</Text>
                </View>
              ) : null}
            </View>
          </Animated.View>
        )}

        {/* Order history */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section}>
          {/* Section title with count badge */}
          <View style={styles.orderHistoryHeader}>
            <Text style={[styles.sectionTitle, { color: c.text }]}>Order History</Text>
            <View style={[styles.orderCountBadge, { backgroundColor: c.accent }]}>
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
            <View style={[styles.emptyOrders, { backgroundColor: c.surfaceLow }]}>
              <Text style={[styles.emptyText, { color: c.subText }]}>No orders yet</Text>
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
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    fontFamily: 'DMSans',
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
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 4,
  },
  backChevron: {
    fontSize: 22,
    lineHeight: 22,
    marginTop: -1,
    fontWeight: '300',
  },
  backText: {
    fontSize: 13,
    fontFamily: 'DMSans',
    fontWeight: '600',
  },

  // Hero card
  heroCard: {
    alignItems: 'center',
    padding: 24,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 24,
    overflow: 'hidden',
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
    opacity: 0.06,
  },
  heroBlobBottom: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
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
    justifyContent: 'center',
    alignItems: 'center',
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
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
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
    marginBottom: 6,
    textAlign: 'center',
  },
  verifiedChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 8,
  },
  verifiedChipText: {
    fontSize: 11,
    fontFamily: 'DMSans',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  instagram: {
    fontSize: 13,
    fontFamily: 'DMSans',
    marginBottom: 4,
  },
  location: {
    fontSize: 12,
    fontFamily: 'DMSans',
    marginBottom: 16,
  },
  // Stats row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginTop: 8,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignSelf: 'stretch',
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
  },
  statLabel: {
    fontSize: 10,
    fontFamily: 'DMSans',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  statDivider: {
    width: 1,
    height: 36,
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
  },
  orderCountBadge: {
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
  },
  infoLabel: {
    fontSize: 11,
    fontFamily: 'DMSans',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'DMSans',
    flex: 2,
    textAlign: 'right',
  },

  // Empty orders
  emptyOrders: {
    paddingVertical: 24,
    alignItems: 'center',
    borderRadius: 16,
  },
  emptyText: {
    fontFamily: 'DMSans',
    fontSize: 14,
  },
});
