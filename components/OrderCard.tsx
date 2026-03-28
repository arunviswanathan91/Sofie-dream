import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { format, differenceInHours } from 'date-fns';
import { CountdownTimer } from './CountdownTimer';
import { TagChip } from './TagChip';
import { getCurrencySymbol } from '../lib/theme';
import { useTheme } from '../context/ThemeContext';
import type { Order } from '../types';

const CATEGORY_EMOJI: Record<string, string> = {
  'Embroidery': '🪡',
  'Knitting': '🧶',
  'Crochet': '🧵',
  'Macramé': '🪢',
  'Weaving': '🧵',
  'Cross-stitch': '✂️',
  'Quilting': '🪡',
  'Sewing': '🧵',
};

function getCategoryEmoji(category: string): string {
  for (const key of Object.keys(CATEGORY_EMOJI)) {
    if (category.toLowerCase().includes(key.toLowerCase())) {
      return CATEGORY_EMOJI[key];
    }
  }
  return '✦';
}

interface Props {
  order: Order;
  compact?: boolean;
}

export function OrderCard({ order, compact = false }: Props) {
  const router = useRouter();
  const { colors } = useTheme();
  const c = colors;

  const handlePress = () => {
    router.push(`/order/${order.id}`);
  };

  const symbol = getCurrencySymbol(order.currency);
  const isActive = ['accepted', 'request'].includes(order.status);
  const hoursUntilDue = differenceInHours(new Date(order.dueDate), new Date());
  const isUrgent = isActive && hoursUntilDue < 48 && hoursUntilDue >= 0;

  // Status ribbon colors — per theme
  const RIBBON_COLOR: Record<Order['status'], string> = {
    request: c.subText,
    accepted: c.primaryContainer,
    shipped: c.primary,
    delivered: c.accent,
    cancelled: c.outlineVariant,
  };

  const STATUS_BADGE: Record<Order['status'], { bg: string; text: string }> = {
    request: { bg: c.surfaceContainer, text: c.subText },
    accepted: { bg: c.primaryContainer, text: c.onPrimary },
    shipped: { bg: c.surfaceHigh, text: c.primary },
    delivered: { bg: c.accentContainer, text: c.accent },
    cancelled: { bg: c.surfaceHighest, text: c.outline },
  };

  const ribbonColor = isUrgent ? c.accent : RIBBON_COLOR[order.status];
  const badgeConfig = STATUS_BADGE[order.status];
  const categoryEmoji = order.craftCategory ? getCategoryEmoji(order.craftCategory) : '✦';

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: c.surfaceLowest }, compact && styles.cardCompact]}
      onPress={handlePress}
      activeOpacity={0.85}
    >
      {/* 4px left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: ribbonColor }]} />

      {/* Card body */}
      <View style={styles.body}>
        {/* Top row: title + badge */}
        <View style={styles.topRow}>
          <View style={styles.titleGroup}>
            <Text style={[styles.orderName, { color: c.text }]} numberOfLines={1}>
              {order.orderName}
            </Text>
            <Text style={[styles.orderMeta, { color: c.subText }]} numberOfLines={1}>
              #{order.id.slice(-6)} · {order.customerName}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: badgeConfig.bg }]}>
            <Text style={[styles.badgeText, { color: badgeConfig.text }]}>
              {order.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Middle row: category chip + price + deadline */}
        <View style={styles.middleRow}>
          {order.craftCategory ? (
            <View style={[styles.categoryChip, { backgroundColor: c.surfaceContainer }]}>
              <Text style={styles.categoryEmoji}>{categoryEmoji}</Text>
              <Text style={[styles.categoryLabel, { color: c.subText }]} numberOfLines={1}>
                {order.craftCategory}
              </Text>
            </View>
          ) : null}
          <View style={{ flex: 1 }} />
          <View style={styles.priceDeadlineGroup}>
            <Text style={[styles.price, { color: c.primary }]}>
              {symbol}{order.askingPrice.toFixed(0)}
            </Text>
            <Text style={[styles.dueDate, { color: c.subText }]}>
              Due {format(new Date(order.dueDate), 'MMM d')}
            </Text>
          </View>
        </View>

        {/* Countdown timer if urgent */}
        {isActive && (
          <View style={styles.countdownRow}>
            {isUrgent ? (
              <Text style={[styles.urgentCountdown, { color: c.accent }]}>
                ⚡ Urgent — <CountdownTimer dueDate={order.dueDate} style={[styles.urgentCountdownTimer, { color: c.accent }]} />
              </Text>
            ) : (
              <CountdownTimer dueDate={order.dueDate} style={[styles.countdown, { color: c.subText }]} />
            )}
          </View>
        )}

        {/* Tags scroll (non-compact only) */}
        {!compact && order.tags && order.tags.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tagsRow}
            keyboardShouldPersistTaps="always"
          >
            {order.tags.slice(0, 4).map((tag) => (
              <TagChip key={tag} label={tag} />
            ))}
          </ScrollView>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#1D1B1A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardCompact: { marginBottom: 8 },
  accentBar: { width: 4, alignSelf: 'stretch' },
  body: { flex: 1, padding: 16, gap: 10 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  titleGroup: { flex: 1, gap: 2 },
  orderName: { fontSize: 17, fontFamily: 'PlayfairDisplay', fontWeight: '700', lineHeight: 22 },
  orderMeta: { fontSize: 12, fontFamily: 'DMSans' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, alignSelf: 'flex-start', flexShrink: 0 },
  badgeText: { fontSize: 10, fontFamily: 'DMSans', fontWeight: '700', letterSpacing: 0.8 },
  middleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, gap: 4, maxWidth: 140 },
  categoryEmoji: { fontSize: 13 },
  categoryLabel: { fontSize: 11, fontFamily: 'DMSans', fontWeight: '600' },
  priceDeadlineGroup: { alignItems: 'flex-end', gap: 2 },
  price: { fontSize: 16, fontFamily: 'DMMono', fontWeight: '700' },
  dueDate: { fontSize: 12, fontFamily: 'DMSans' },
  countdownRow: { flexDirection: 'row', alignItems: 'center' },
  urgentCountdown: { fontSize: 12, fontFamily: 'DMSans', fontWeight: '600' },
  urgentCountdownTimer: { fontSize: 12, fontWeight: '600' },
  countdown: { fontSize: 12 },
  tagsRow: { marginTop: 2 },
});
