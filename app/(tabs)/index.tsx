import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Modal,
  TextInput,
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

// Colors driven by useTheme()

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
function CircularProgress({ progress, size = 80, trackColor, progressColor, labelColor }: {
  progress: number;
  size?: number;
  trackColor: string;
  progressColor: string;
  labelColor: string;
}) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View style={{ alignItems: 'center', gap: 4 }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={trackColor} strokeWidth={strokeWidth} fill="none" strokeOpacity={0.3} />
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={progressColor} strokeWidth={strokeWidth} fill="none" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </Svg>
      <Text style={[styles.circleProgressLabel, { color: labelColor }]}>TODAY</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { orders, loading, updateOrder } = useOrders();
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

  // Circular progress — average completionPercent of all non-cancelled/delivered orders
  const progressPercent = useMemo(() => {
    const active = orders.filter((o) => o.status !== 'cancelled' && o.status !== 'delivered');
    if (active.length === 0) return shippedCount > 0 ? 100 : 0;
    const avg = active.reduce((sum, o) => sum + (o.completionPercent ?? 0), 0) / active.length;
    return Math.min(Math.round(avg), 100);
  }, [orders, shippedCount]);

  const c = colors;

  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressEdits, setProgressEdits] = useState<Record<string, number>>({});
  const [savingProgress, setSavingProgress] = useState(false);

  const activeForProgress = useMemo(
    () => orders.filter((o) => o.status !== 'cancelled' && o.status !== 'delivered'),
    [orders]
  );

  const openProgressModal = () => {
    const init: Record<string, number> = {};
    activeForProgress.forEach((o) => { init[o.id] = o.completionPercent ?? 0; });
    setProgressEdits(init);
    setShowProgressModal(true);
  };

  const saveProgress = async () => {
    setSavingProgress(true);
    for (const order of activeForProgress) {
      const newPct = progressEdits[order.id] ?? order.completionPercent ?? 0;
      if (newPct !== (order.completionPercent ?? 0)) {
        await updateOrder(order.id, { completionPercent: newPct });
      }
    }
    setSavingProgress(false);
    setShowProgressModal(false);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: c.subText }]}>Loading your studio...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}>
      {/* Top bar with notification bell */}
      <View style={[styles.topBar, { backgroundColor: c.bg }]}>
        <Text style={[styles.topBarTitle, { color: c.primary }]}>Artisan Studio</Text>
        <TouchableOpacity
          style={[styles.topBarBell, { backgroundColor: c.surfaceLow }]}
          onPress={() => router.push('/notifications')}
          activeOpacity={0.7}
        >
          <Text style={styles.topBarBellIcon}>🔔</Text>
          {requestCount > 0 && (
            <View style={[styles.bellDot, { backgroundColor: c.accent, borderColor: c.bg }]} />
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
          <Text style={[styles.greeting, { color: c.text }]}>
            {getGreeting()}, {firstName(profile.name)} ☀️
          </Text>
          <Text style={[styles.greetingSubtitle, { color: c.subText }]}>Your atelier is ready for today's creations.</Text>
          <View style={[styles.greetingDivider, { backgroundColor: c.outlineVariant }]} />
        </Animated.View>

        {/* Quote Card + Circular Progress row */}
        <Animated.View entering={FadeInDown.delay(50).duration(400)} style={styles.quoteProgressRow}>
          <View style={[styles.quoteCard, { backgroundColor: c.surfaceLow }]}>
            <Text style={[styles.quoteDecorChar, { color: c.primary }]}>"</Text>
            <Text style={[styles.quoteText, { color: c.text }]}>"{dailyQuote.text}"</Text>
            {dailyQuote.author ? (
              <Text style={[styles.quoteAuthor, { color: c.subText }]}>— {dailyQuote.author}</Text>
            ) : null}
          </View>
          <TouchableOpacity style={styles.circleProgressWrapper} onPress={openProgressModal} activeOpacity={0.7}>
            <CircularProgress
              progress={progressPercent}
              size={72}
              trackColor={c.outlineVariant}
              progressColor={c.accent}
              labelColor={c.subText}
            />
            <Text style={[styles.circleProgressValue, { color: c.accent }]}>{progressPercent}%</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Stats Grid 2x2 */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={[styles.statsGrid, isTablet && styles.statsGridTablet]}
        >
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: c.primaryContainer }]}
            onPress={() => router.push('/(tabs)/orders')}
            activeOpacity={0.85}
          >
            <Text style={[styles.statIcon, { color: c.onPrimary }]}>✏</Text>
            <Text style={[styles.statValue, { color: c.onPrimary }]}>{activeOrders}</Text>
            <Text style={[styles.statLabel, { color: c.onPrimary, opacity: 0.8 }]}>ACTIVE ORDERS</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: c.accentContainer }]}
            onPress={() => router.push('/(tabs)/orders')}
            activeOpacity={0.85}
          >
            <Text style={[styles.statIcon, { color: c.accent }]}>⏱</Text>
            <Text style={[styles.statValue, { color: c.text }]}>{String(dueThisWeek).padStart(2, '0')}</Text>
            <Text style={[styles.statLabel, { color: c.subText }]}>DUE THIS WEEK</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: c.surfaceContainer }]}
            onPress={() => router.push('/(tabs)/orders')}
            activeOpacity={0.85}
          >
            <Text style={[styles.statIcon, { color: c.subText }]}>📦</Text>
            <Text style={[styles.statValue, { color: c.text }]}>{String(shippedCount).padStart(2, '0')}</Text>
            <Text style={[styles.statLabel, { color: c.subText }]}>SHIPPED</Text>
          </TouchableOpacity>

          <View style={[styles.statCard, { backgroundColor: c.surfaceHigh }]}>
            <Text style={[styles.statIcon, { color: c.outline }]}>💰</Text>
            <Text style={[styles.statValue, { color: c.text }]}>
              {getCurrencySymbol(profile.currency)}{monthRevenue.toFixed(0)}
            </Text>
            <Text style={[styles.statLabel, { color: c.subText }]}>REVENUE</Text>
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
              style={[styles.quickActionPrimary, { backgroundColor: c.primary }]}
              onPress={() => router.push('/order/new')}
              activeOpacity={0.85}
            >
              <Text style={[styles.quickActionPrimaryText, { color: c.onPrimary }]}>+ New Order</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickActionSecondary, { backgroundColor: c.surfaceHighest }]}
              onPress={() => router.push('/order/new')}
              activeOpacity={0.85}
            >
              <Text style={[styles.quickActionSecondaryText, { color: c.text }]}>Add Customer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickActionSecondary, { backgroundColor: c.surfaceHighest }]}
              onPress={() => router.push('/reports')}
              activeOpacity={0.85}
            >
              <Text style={[styles.quickActionSecondaryText, { color: c.text }]}>View Reports</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.quickActionSecondary, { backgroundColor: c.surfaceHighest }]}
              onPress={() => router.push('/backup')}
              activeOpacity={0.85}
            >
              <Text style={[styles.quickActionSecondaryText, { color: c.text }]}>Export PDF</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>

        {/* Needs Attention section */}
        {urgentOrders.length > 0 && (
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: c.text }]}>Needs Attention</Text>
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
                      { borderLeftColor: isOverdue ? c.error : c.accent },
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
              <Text style={[styles.sectionTitle, { color: c.text }]}>In Progress</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/orders')}>
                <Text style={[styles.sectionAction, { color: c.primary }]}>See all</Text>
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
                  style={[styles.miniCard, { backgroundColor: c.surfaceLowest }]}
                  onPress={() => router.push(`/order/${order.id}`)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.miniCardRibbon, { backgroundColor: c.primary }]} />
                  <View style={styles.miniCardContent}>
                    {order.craftCategory ? (
                      <View style={[styles.miniCategoryBadge, { backgroundColor: c.surfaceContainer }]}>
                        <Text style={styles.miniCategoryEmoji}>{order.craftCategory.charAt(0)}</Text>
                        <Text style={[styles.miniCategoryText, { color: c.subText }]} numberOfLines={1}>{order.craftCategory}</Text>
                      </View>
                    ) : (
                      <Text style={styles.miniCategory}>✦</Text>
                    )}
                    <Text style={[styles.miniName, { color: c.text }]} numberOfLines={2}>{order.orderName}</Text>
                    <Text style={[styles.miniCustomer, { color: c.subText }]}>{order.customerName}</Text>
                    <CountdownTimer dueDate={order.dueDate} style={[styles.miniCountdown, { color: c.accent }]} />
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
              <Text style={[styles.sectionTitle, { color: c.text }]}>Recent Orders</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/orders')}>
                <Text style={[styles.sectionAction, { color: c.primary }]}>View All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.recentOrdersList}>
              {orders.slice(0, 3).map((order) => {
                const isUrgent = order.status === 'accepted' || order.status === 'request';
                const ribbonColor = isUrgent ? c.accent : (order.status === 'shipped' ? c.primary : c.outlineVariant);
                return (
                  <TouchableOpacity
                    key={order.id}
                    style={[styles.recentOrderCard, { backgroundColor: c.surfaceLowest }]}
                    onPress={() => router.push(`/order/${order.id}`)}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.recentRibbon, { backgroundColor: ribbonColor }]} />
                    <View style={styles.recentCardBody}>
                      <View style={styles.recentCardLeft}>
                        <Text style={[styles.recentOrderName, { color: c.text }]} numberOfLines={1}>{order.orderName}</Text>
                        <Text style={[styles.recentOrderSub, { color: c.subText }]}>#{order.id.slice(-6)} · {order.customerName}</Text>
                      </View>
                      <View style={styles.recentCardRight}>
                        <Text style={[styles.recentPrice, { color: c.text }]}>{getCurrencySymbol(order.currency)}{order.askingPrice.toFixed(2)}</Text>
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
            <Text style={[styles.emptyTitle, { color: c.text }]}>Your studio is ready</Text>
            <Text style={[styles.emptyBody, { color: c.subText }]}>
              Add your first order to start tracking your craft business
            </Text>
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: c.primary }]}
              onPress={() => router.push('/order/new')}
            >
              <Text style={styles.emptyButtonText}>Add first order →</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        <View style={{ height: insets.bottom + 100 }} />
      </ScrollView>

      <FAB onPress={() => router.push('/order/new')} />

      {/* Progress Edit Modal */}
      <Modal visible={showProgressModal} transparent animationType="slide" onRequestClose={() => setShowProgressModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: c.bg }]}>
            <Text style={[styles.modalTitle, { color: c.text }]}>Update Progress ✦</Text>
            {activeForProgress.length === 0 ? (
              <Text style={[styles.modalEmpty, { color: c.subText }]}>No active orders to update.</Text>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 320 }}>
                {activeForProgress.map((o) => (
                  <View key={o.id} style={[styles.progressRow, { borderBottomColor: c.outlineVariant }]}>
                    <Text style={[styles.progressOrderName, { color: c.text }]} numberOfLines={1}>{o.orderName}</Text>
                    <View style={styles.progressControls}>
                      <TouchableOpacity
                        style={[styles.progressBtn, { backgroundColor: c.surfaceContainer }]}
                        onPress={() => setProgressEdits((p) => ({ ...p, [o.id]: Math.max(0, (p[o.id] ?? 0) - 10) }))}
                      >
                        <Text style={[styles.progressBtnTxt, { color: c.text }]}>−</Text>
                      </TouchableOpacity>
                      <TextInput
                        style={[styles.progressInput, { backgroundColor: c.surfaceLow, color: c.text }]}
                        value={String(progressEdits[o.id] ?? 0)}
                        onChangeText={(v) => setProgressEdits((p) => ({ ...p, [o.id]: Math.min(100, Math.max(0, parseInt(v) || 0)) }))}
                        keyboardType="number-pad"
                        selectTextOnFocus
                      />
                      <Text style={[styles.progressPctLabel, { color: c.subText }]}>%</Text>
                      <TouchableOpacity
                        style={[styles.progressBtn, { backgroundColor: c.surfaceContainer }]}
                        onPress={() => setProgressEdits((p) => ({ ...p, [o.id]: Math.min(100, (p[o.id] ?? 0) + 10) }))}
                      >
                        <Text style={[styles.progressBtnTxt, { color: c.text }]}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalCancelBtn, { backgroundColor: c.surfaceHigh }]} onPress={() => setShowProgressModal(false)}>
                <Text style={[styles.modalCancelTxt, { color: c.subText }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, { backgroundColor: c.primaryContainer }, savingProgress && { opacity: 0.5 }]}
                onPress={saveProgress}
                disabled={savingProgress}
              >
                <Text style={[styles.modalSaveTxt, { color: c.onPrimary }]}>{savingProgress ? 'Saving…' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 12 },
  topBarTitle: { fontSize: 22, fontFamily: 'PlayfairDisplay', fontWeight: '700', letterSpacing: 0.5 },
  topBarBell: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  topBarBellIcon: { fontSize: 16 },
  bellDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, borderWidth: 1.5 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontFamily: 'PlayfairDisplay', fontSize: 16 },
  greetingSection: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 16 },
  greeting: { fontSize: 32, fontFamily: 'PlayfairDisplay', fontWeight: '700', marginBottom: 4, lineHeight: 40 },
  greetingSubtitle: { fontSize: 14, fontFamily: 'DMSans', fontWeight: '500', letterSpacing: -0.2, marginBottom: 12 },
  greetingDivider: { height: 1, opacity: 0.3, borderRadius: 1 },
  quoteProgressRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 20, gap: 12 },
  quoteCard: { flex: 1, borderRadius: 16, padding: 16, gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2, overflow: 'hidden', position: 'relative' },
  quoteDecorChar: { position: 'absolute', top: -16, left: 8, fontFamily: 'PlayfairDisplay', fontSize: 80, opacity: 0.06, lineHeight: 80 },
  quoteText: { fontSize: 13, fontFamily: 'PlayfairDisplay', lineHeight: 20, fontStyle: 'italic' },
  quoteAuthor: { fontSize: 11, fontFamily: 'DMSans', letterSpacing: 0.5 },
  circleProgressWrapper: { alignItems: 'center', justifyContent: 'center', position: 'relative', width: 80 },
  circleProgressLabel: { fontSize: 8, fontFamily: 'DMSans', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  circleProgressValue: { position: 'absolute', top: 22, fontSize: 14, fontFamily: 'DMMono', fontWeight: '700' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, marginBottom: 20, gap: 12 },
  statsGridTablet: { flexWrap: 'nowrap' },
  statCard: { flex: 1, minWidth: '45%', borderRadius: 16, padding: 16, gap: 4, shadowColor: '#2C2C2C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 16, elevation: 2 },
  statIcon: { fontSize: 22, marginBottom: 4 },
  statValue: { fontSize: 28, fontFamily: 'PlayfairDisplay', fontWeight: '700', lineHeight: 34 },
  statLabel: { fontSize: 10, fontFamily: 'DMSans', fontWeight: '600', textTransform: 'uppercase', letterSpacing: -0.3 },
  quickActionsScroll: { marginBottom: 20 },
  quickActionsContent: { paddingHorizontal: 16, gap: 10, alignItems: 'center' },
  quickActionPrimary: { borderRadius: 999, paddingHorizontal: 24, paddingVertical: 12, elevation: 4 },
  quickActionPrimaryText: { fontFamily: 'DMSans', fontSize: 14, fontWeight: '600' },
  quickActionSecondary: { borderRadius: 999, paddingHorizontal: 24, paddingVertical: 12 },
  quickActionSecondaryText: { fontFamily: 'DMSans', fontSize: 14, fontWeight: '600' },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 12 },
  sectionTitle: { fontSize: 22, fontFamily: 'PlayfairDisplay', fontWeight: '700' },
  sectionAction: { fontSize: 13, fontFamily: 'DMSans', fontWeight: '700' },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTablet: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tabletCard: { flex: 1, minWidth: 280 },
  attentionCardWrapper: { borderLeftWidth: 3, marginBottom: 8, borderRadius: 16 },
  horizontalScroll: { paddingHorizontal: 16, paddingBottom: 8, gap: 12, marginBottom: 20 },
  miniCard: { width: 200, borderRadius: 16, overflow: 'hidden', flexDirection: 'row', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  miniCardRibbon: { width: 4 },
  miniCardContent: { flex: 1, padding: 12, gap: 4 },
  miniCategoryBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, gap: 4, alignSelf: 'flex-start', marginBottom: 4, maxWidth: '100%' },
  miniCategoryEmoji: { fontSize: 12 },
  miniCategoryText: { fontSize: 10, fontFamily: 'DMSans', fontWeight: '600' },
  miniCategory: { fontSize: 18, marginBottom: 4 },
  miniName: { fontSize: 13, fontFamily: 'PlayfairDisplay', fontWeight: '700', lineHeight: 18 },
  miniCustomer: { fontSize: 11, fontFamily: 'DMSans' },
  miniCountdown: { fontSize: 11 },
  recentOrdersList: { paddingHorizontal: 16, gap: 12, marginBottom: 20 },
  recentOrderCard: { borderRadius: 16, flexDirection: 'row', overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 16, elevation: 2 },
  recentRibbon: { width: 4, alignSelf: 'stretch' },
  recentCardBody: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  recentCardLeft: { flex: 1 },
  recentOrderName: { fontSize: 16, fontFamily: 'PlayfairDisplay', fontWeight: '700', marginBottom: 4 },
  recentOrderSub: { fontSize: 12, fontFamily: 'DMSans' },
  recentCardRight: { alignItems: 'flex-end', flexShrink: 0 },
  recentPrice: { fontSize: 15, fontFamily: 'DMMono', fontWeight: '700', marginBottom: 2 },
  recentStatus: { fontSize: 10, fontFamily: 'DMSans', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  emptyState: { alignItems: 'center', paddingHorizontal: 32, paddingTop: 40, gap: 16 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 22, fontFamily: 'PlayfairDisplay', fontWeight: '700', textAlign: 'center' },
  emptyBody: { fontSize: 14, fontFamily: 'DMSans', textAlign: 'center', lineHeight: 22 },
  emptyButton: { borderRadius: 999, paddingHorizontal: 28, paddingVertical: 14, marginTop: 8 },
  emptyButtonText: { color: '#FFFFFF', fontFamily: 'DMSans', fontSize: 15, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 40 },
  modalTitle: { fontSize: 22, fontFamily: 'PlayfairDisplay', fontWeight: '700', marginBottom: 20 },
  modalEmpty: { fontFamily: 'DMSans', fontSize: 14, textAlign: 'center', paddingVertical: 20 },
  progressRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  progressOrderName: { flex: 1, fontSize: 14, fontFamily: 'DMSans', fontWeight: '600', marginRight: 12 },
  progressControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  progressBtnTxt: { fontFamily: 'DMSans', fontSize: 18, fontWeight: '700', lineHeight: 20 },
  progressInput: { width: 52, height: 38, borderRadius: 10, textAlign: 'center', fontFamily: 'DMMono', fontSize: 15, fontWeight: '700' },
  progressPctLabel: { fontSize: 13, fontFamily: 'DMSans', fontWeight: '600' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  modalCancelBtn: { flex: 1, borderRadius: 999, paddingVertical: 14, alignItems: 'center' },
  modalCancelTxt: { fontFamily: 'DMSans', fontSize: 14, fontWeight: '600' },
  modalSaveBtn: { flex: 1, borderRadius: 999, paddingVertical: 14, alignItems: 'center' },
  modalSaveTxt: { fontFamily: 'DMSans', fontSize: 14, fontWeight: '700' },
});
