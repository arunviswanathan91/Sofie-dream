import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { useOrders } from '../../hooks/useOrders';
import { useReports } from '../../hooks/useReports';
import { useProfile } from '../../hooks/useProfile';
import { useTheme } from '../../context/ThemeContext';
import { OrderCard } from '../../components/OrderCard';
import { CountdownTimer } from '../../components/CountdownTimer';
import { FAB } from '../../components/FAB';
import { getCurrencySymbol } from '../../lib/theme';

// Design tokens — Stitch "Warm Artisan Editorial"
const T = {
  bg: '#FFF8F5',
  surfaceLow: '#F9F2EF',
  surfaceContainer: '#F3ECEA',
  surfaceHigh: '#EDE7E4',
  surfaceHighest: '#E8E1DE',
  surfaceLowest: '#FFFFFF',
  primary: '#864D5F',
  primaryContainer: '#C9879A',
  primaryFixed: '#FFD9E2',
  onPrimary: '#FFFFFF',
  tertiary: '#994530',
  tertiaryFixed: '#FFDAD2',
  secondary: '#625E5A',
  secondaryContainer: '#E8E1DC',
  secondaryFixed: '#E8E1DC',
  text: '#1D1B1A',
  subText: '#514346',
  outline: '#837376',
  outlineVariant: '#D5C2C5',
  error: '#BA1A1A',
};

const QUOTES = [
  { text: 'Build something people want.', author: 'Paul Graham' },
  { text: 'Done is better than perfect.', author: 'Sheryl Sandberg' },
  { text: 'Make something wonderful and put it in the world.', author: 'Steve Jobs' },
  { text: 'Chase the vision, not the money; the money will end up following you.', author: 'Tony Hsieh' },
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { text: 'Create with the heart; build with the mind.', author: 'Criss Jami' },
  { text: 'Every master was once a beginner. Every pro was once an amateur.', author: 'Robin Sharma' },
  { text: 'Quality is not an act, it is a habit.', author: 'Aristotle' },
  { text: 'Make each day your masterpiece.', author: 'John Wooden' },
  { text: 'Your craft is your fingerprint — no one else can make what you make.', author: '' },
  { text: 'The best way to predict the future is to create it.', author: 'Peter Drucker' },
  { text: 'Small businesses are the backbone of our economy.', author: 'Barack Obama' },
  { text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', author: 'Winston Churchill' },
  { text: 'The craft of making is where soul meets skill.', author: '' },
  { text: 'Start where you are. Use what you have. Do what you can.', author: 'Arthur Ashe' },
];

function getDailyQuote() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return QUOTES[dayOfYear % QUOTES.length];
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Good night';
}

function firstName(name: string): string {
  const words = name.trim().split(/\s+/);
  return words[0] ?? name;
}

// Circular Progress SVG component
function CircularProgress({ progress, size = 80 }: { progress: number; size?: number }) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View style={{ alignItems: 'center', gap: 4 }}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={T.outlineVariant}
          strokeWidth={strokeWidth}
          fill="none"
          strokeOpacity={0.3}
        />
        {/* Progress arc */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={T.tertiary}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text style={styles.circleProgressLabel}>TODAY</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { orders, loading } = useOrders();
  const { profile } = useProfile();
  const { colors } = useTheme();
  const { dashboardStats } = useReports(orders, 'month');
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;

  const { activeOrders, dueThisWeek, shippedCount, monthRevenue, urgentOrders } = dashboardStats;

  const activeAccepted = useMemo(
    () => orders.filter((o) => o.status === 'accepted').slice(0, 8),
    [orders]
  );

  const requestCount = useMemo(
    () => orders.filter((o) => o.status === 'request').length,
    [orders]
  );

  const dailyQuote = getDailyQuote();

  // Circular progress calculation
  const progressPercent = activeOrders > 0
    ? Math.min(Math.round((shippedCount / (activeOrders + shippedCount)) * 100), 100)
    : 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading your studio...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top bar with notification bell */}
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Artisan Studio</Text>
        <TouchableOpacity
          style={styles.topBarBell}
          onPress={() => router.push('/notifications')}
          activeOpacity={0.7}
        >
          <Text style={styles.topBarBellIcon}>🔔</Text>
          {requestCount > 0 && (
            <View style={styles.bellDot} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Greeting */}
        <Animated.View entering={FadeInDown.delay(0).duration(400)} style={styles.greetingSection}>
          <Text style={styles.greeting}>
            {getGreeting()}, {firstName(profile.name)} ☀️
          </Text>
          <Text style={styles.greetingSubtitle}>Your atelier is ready for today's creations.</Text>
          {/* Thin gradient divider */}
          <View style={styles.greetingDivider} />
        </Animated.View>

        {/* Quote Card + Circular Progress row */}
        <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.quoteProgressRow}>
          <View style={styles.quoteCard}>
            {/* Decorative large quotation mark */}
            <Text style={styles.quoteDecorChar}>"</Text>
            <Text style={styles.quoteText}>"{dailyQuote.text}"</Text>
            {dailyQuote.author ? (
              <Text style={styles.quoteAuthor}>— {dailyQuote.author}</Text>
            ) : null}
          </View>
          {/* Circular progress */}
          <View style={styles.circleProgressWrapper}>
            <CircularProgress progress={progressPercent} size={72} />
            <Text style={styles.circleProgressValue}>{progressPercent}%</Text>
          </View>
        </Animated.View>

        {/* Stats Grid 2x2 */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={[styles.statsGrid, isTablet && styles.statsGridTablet]}
        >
          {/* Active Orders — primaryFixed tonal */}
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: T.primaryFixed }]}
            onPress={() => router.push('/(tabs)/orders')}
            activeOpacity={0.85}
          >
            <Text style={[styles.statIcon, { color: T.primary }]}>✏</Text>
            <Text style={[styles.statValue, { color: '#360B1C' }]}>{activeOrders}</Text>
            <Text style={[styles.statLabel, { color: '#360B1C' }]}>ACTIVE ORDERS</Text>
          </TouchableOpacity>

          {/* Due This Week — tertiaryFixed tonal */}
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: T.tertiaryFixed }]}
            onPress={() => router.push('/(tabs)/orders')}
            activeOpacity={0.85}
          >
            <Text style={[styles.statIcon, { color: T.tertiary }]}>⏱</Text>
            <Text style={[styles.statValue, { color: '#3C0700' }]}>{String(dueThisWeek).padStart(2, '0')}</Text>
            <Text style={[styles.statLabel, { color: '#3C0700' }]}>DUE THIS WEEK</Text>
          </TouchableOpacity>

          {/* Shipped — secondaryFixed tonal */}
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: T.secondaryFixed }]}
            onPress={() => router.push('/(tabs)/orders')}
            activeOpacity={0.85}
          >
            <Text style={[styles.statIcon, { color: T.secondary }]}>📦</Text>
            <Text style={[styles.statValue, { color: '#1E1B18' }]}>{String(shippedCount).padStart(2, '0')}</Text>
            <Text style={[styles.statLabel, { color: '#1E1B18' }]}>SHIPPED</Text>
          </TouchableOpacity>

          {/* Revenue — surfaceHigh tonal */}
          <View style={[styles.statCard, { backgroundColor: T.surfaceHigh }]}>
            <Text style={[styles.statIcon, { color: T.outline }]}>💰</Text>
            <Text style={[styles.statValue, { color: T.text }]}>
              {getCurrencySymbol(profile.currency)}{monthRevenue.toFixed(0)}
            </Text>
            <Text style={[styles.statLabel, { color: T.subText }]}>REVENUE</Text>
          </View>
        </Animated.View>

        {/* Quick Actions Pill Row */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickActionsContent}
            style={styles.quickActionsScroll}
          >
            <TouchableOpacity
              style={styles.quickActionPrimary}
              onPress={() => router.push('/order/new')}
              activeOpacity={0.85}
            >
              <Text style={styles.quickActionPrimaryText}>+ New Order</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionSecondary} activeOpacity={0.85}>
              <Text style={styles.quickActionSecondaryText}>Add Customer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionSecondary}
              onPress={() => router.push('/(tabs)/orders')}
              activeOpacity={0.85}
            >
              <Text style={styles.quickActionSecondaryText}>View Reports</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionSecondary} activeOpacity={0.85}>
              <Text style={styles.quickActionSecondaryText}>Export PDF</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>

        {/* Needs Attention section */}
        {urgentOrders.length > 0 && (
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Needs Attention</Text>
            </View>
            <View style={[styles.section, isTablet && styles.sectionTablet]}>
              {urgentOrders.map((order, i) => {
                const isOverdue = new Date(order.dueDate) < new Date();
                return (
                  <Animated.View
                    key={order.id}
                    entering={FadeInDown.delay(250 + i * 60).duration(350)}
                    style={[
                      styles.attentionCardWrapper,
                      { borderLeftColor: isOverdue ? T.error + '40' : T.tertiary },
                      isTablet ? styles.tabletCard : undefined,
                    ]}
                  >
                    <OrderCard order={order} />
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* In Progress horizontal strip */}
        {activeAccepted.length > 0 && (
          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>In Progress</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/orders')}>
                <Text style={styles.sectionAction}>See all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {activeAccepted.map((order) => (
                <TouchableOpacity
                  key={order.id}
                  style={styles.miniCard}
                  onPress={() => router.push(`/order/${order.id}`)}
                  activeOpacity={0.85}
                >
                  {/* Left status ribbon */}
                  <View style={[styles.miniCardRibbon, { backgroundColor: T.primary }]} />
                  <View style={styles.miniCardContent}>
                    {/* Category badge */}
                    {order.craftCategory ? (
                      <View style={styles.miniCategoryBadge}>
                        <Text style={styles.miniCategoryEmoji}>
                          {order.craftCategory.charAt(0)}
                        </Text>
                        <Text style={styles.miniCategoryText} numberOfLines={1}>
                          {order.craftCategory}
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.miniCategory}>✦</Text>
                    )}
                    <Text style={styles.miniName} numberOfLines={2}>
                      {order.orderName}
                    </Text>
                    <Text style={styles.miniCustomer}>{order.customerName}</Text>
                    <CountdownTimer dueDate={order.dueDate} style={styles.miniCountdown} />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Recent Orders */}
        {orders.length > 0 && (
          <Animated.View entering={FadeInDown.delay(350).duration(400)}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Recent Orders</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/orders')}>
                <Text style={styles.sectionAction}>View All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.recentOrdersList}>
              {orders.slice(0, 3).map((order) => {
                const isUrgent = order.status === 'accepted' || order.status === 'request';
                const ribbonColor = isUrgent ? T.tertiary : (order.status === 'shipped' ? T.primary : T.outlineVariant);
                return (
                  <TouchableOpacity
                    key={order.id}
                    style={styles.recentOrderCard}
                    onPress={() => router.push(`/order/${order.id}`)}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.recentRibbon, { backgroundColor: ribbonColor }]} />
                    <View style={styles.recentCardBody}>
                      <View style={styles.recentCardLeft}>
                        <Text style={styles.recentOrderName} numberOfLines={1}>{order.orderName}</Text>
                        <Text style={styles.recentOrderSub}>#{order.id.slice(-6)} · {order.customerName}</Text>
                      </View>
                      <View style={styles.recentCardRight}>
                        <Text style={styles.recentPrice}>{getCurrencySymbol(order.currency)}{order.askingPrice.toFixed(2)}</Text>
                        <Text style={[styles.recentStatus, { color: ribbonColor }]}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        )}

        {orders.length === 0 && (
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>✦</Text>
            <Text style={styles.emptyTitle}>Your studio is ready</Text>
            <Text style={styles.emptyBody}>
              Add your first order to start tracking your craft business
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/order/new')}
            >
              <Text style={styles.emptyButtonText}>Add first order →</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        <View style={{ height: insets.bottom + 100 }} />
      </ScrollView>

      <FAB onPress={() => router.push('/order/new')} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.bg,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: T.bg,
  },
  topBarTitle: {
    fontSize: 22,
    fontFamily: 'PlayfairDisplay',
    fontWeight: '700',
    color: T.primary,
    letterSpacing: 0.5,
  },
  topBarBell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: T.surfaceLow,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  topBarBellIcon: {
    fontSize: 16,
  },
  bellDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: T.tertiary,
    borderWidth: 1.5,
    borderColor: T.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'PlayfairDisplay',
    fontSize: 16,
    color: T.subText,
  },
  // Greeting
  greetingSection: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 32,
    fontFamily: 'PlayfairDisplay',
    fontWeight: '700',
    color: T.text,
    marginBottom: 4,
    lineHeight: 40,
  },
  greetingSubtitle: {
    fontSize: 14,
    fontFamily: 'DMSans',
    color: T.subText,
    fontWeight: '500',
    letterSpacing: -0.2,
    marginBottom: 12,
  },
  greetingDivider: {
    height: 1,
    backgroundColor: T.outlineVariant,
    opacity: 0.3,
    borderRadius: 1,
  },
  // Quote + progress row
  quoteProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 20,
    gap: 12,
  },
  quoteCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    backgroundColor: T.surfaceLow,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  quoteDecorChar: {
    position: 'absolute',
    top: -16,
    left: 8,
    fontFamily: 'PlayfairDisplay',
    fontSize: 80,
    color: T.primary,
    opacity: 0.06,
    lineHeight: 80,
  },
  quoteText: {
    fontSize: 13,
    fontFamily: 'PlayfairDisplay',
    lineHeight: 20,
    fontStyle: 'italic',
    color: T.text,
  },
  quoteAuthor: {
    fontSize: 11,
    fontFamily: 'DMSans',
    letterSpacing: 0.5,
    color: T.subText,
  },
  // Circular progress
  circleProgressWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: 80,
  },
  circleProgressLabel: {
    fontSize: 8,
    fontFamily: 'DMSans',
    fontWeight: '700',
    color: T.subText,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  circleProgressValue: {
    position: 'absolute',
    top: 22,
    fontSize: 14,
    fontFamily: 'DMMono',
    fontWeight: '700',
    color: T.tertiary,
  },
  // Stats 2x2 grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 12,
  },
  statsGridTablet: {
    flexWrap: 'nowrap',
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 16,
    padding: 16,
    gap: 4,
    shadowColor: '#2C2C2C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 2,
  },
  statIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 28,
    fontFamily: 'PlayfairDisplay',
    fontWeight: '700',
    lineHeight: 34,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: 'DMSans',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: -0.3,
  },
  // Quick actions
  quickActionsScroll: {
    marginBottom: 20,
  },
  quickActionsContent: {
    paddingHorizontal: 16,
    gap: 10,
    alignItems: 'center',
  },
  quickActionPrimary: {
    backgroundColor: T.primary,
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 12,
    shadowColor: T.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  quickActionPrimaryText: {
    color: '#FFFFFF',
    fontFamily: 'DMSans',
    fontSize: 14,
    fontWeight: '600',
  },
  quickActionSecondary: {
    backgroundColor: T.surfaceHighest,
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  quickActionSecondaryText: {
    color: T.text,
    fontFamily: 'DMSans',
    fontSize: 14,
    fontWeight: '600',
  },
  // Section headers
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: 'PlayfairDisplay',
    fontWeight: '700',
    color: T.text,
  },
  sectionAction: {
    fontSize: 13,
    fontFamily: 'DMSans',
    fontWeight: '700',
    color: T.primary,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTablet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tabletCard: {
    flex: 1,
    minWidth: 280,
  },
  // Needs attention wrapper with left border
  attentionCardWrapper: {
    borderLeftWidth: 4,
    borderLeftColor: T.tertiary,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 4,
  },
  // Horizontal mini cards
  horizontalScroll: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 12,
    marginBottom: 20,
  },
  miniCard: {
    width: 200,
    borderRadius: 16,
    backgroundColor: T.surfaceLowest,
    overflow: 'hidden',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  miniCardRibbon: {
    width: 4,
  },
  miniCardContent: {
    flex: 1,
    padding: 12,
    gap: 4,
  },
  miniCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3ECEA',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
    maxWidth: '100%',
  },
  miniCategoryEmoji: {
    fontSize: 12,
  },
  miniCategoryText: {
    fontSize: 10,
    fontFamily: 'DMSans',
    color: T.subText,
    fontWeight: '600',
  },
  miniCategory: {
    fontSize: 18,
    marginBottom: 4,
  },
  miniName: {
    fontSize: 13,
    fontFamily: 'PlayfairDisplay',
    fontWeight: '700',
    color: T.text,
    lineHeight: 18,
  },
  miniCustomer: {
    fontSize: 11,
    fontFamily: 'DMSans',
    color: T.subText,
  },
  miniCountdown: {
    fontSize: 11,
    color: T.tertiary,
  },
  // Recent orders list
  recentOrdersList: {
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 20,
  },
  recentOrderCard: {
    backgroundColor: T.surfaceLowest,
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
    elevation: 2,
  },
  recentRibbon: {
    width: 4,
    alignSelf: 'stretch',
  },
  recentCardBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  recentCardLeft: {
    flex: 1,
  },
  recentOrderName: {
    fontSize: 16,
    fontFamily: 'PlayfairDisplay',
    fontWeight: '700',
    color: T.text,
    marginBottom: 4,
  },
  recentOrderSub: {
    fontSize: 12,
    fontFamily: 'DMSans',
    color: T.subText,
  },
  recentCardRight: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  recentPrice: {
    fontSize: 15,
    fontFamily: 'DMMono',
    fontWeight: '700',
    color: T.text,
    marginBottom: 2,
  },
  recentStatus: {
    fontSize: 10,
    fontFamily: 'DMSans',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 40,
    gap: 16,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: 'PlayfairDisplay',
    fontWeight: '700',
    color: T.text,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 14,
    fontFamily: 'DMSans',
    color: T.subText,
    textAlign: 'center',
    lineHeight: 22,
  },
  emptyButton: {
    backgroundColor: T.primary,
    borderRadius: 999,
    paddingHorizontal: 28,
    paddingVertical: 14,
    marginTop: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontFamily: 'DMSans',
    fontSize: 15,
    fontWeight: '600',
  },
});
