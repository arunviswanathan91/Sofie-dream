import React, { useEffect, useRef, useState } from 'react';
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
import type { Order } from '../types';

// Design tokens
const T = {
  bg: '#FFF8F5',
  surfaceLowest: '#FFFFFF',
  surfaceContainer: '#F3ECEA',
  primary: '#864D5F',
  primaryContainer: '#C9879A',
  tertiary: '#994530',
  secondary: '#625E5A',
  secondaryContainer: '#E8E1DC',
  text: '#1D1B1A',
  subText: '#514346',
  outline: '#837376',
  outlineVariant: '#D5C2C5',
};

// Status ribbon colors
const RIBBON_COLOR: Record<Order['status'], string> = {
  request: T.secondary,
  accepted: T.primaryContainer,
  shipped: T.primary,
  delivered: T.tertiary,
  cancelled: T.outlineVariant,
};

// Status badge config
const STATUS_BADGE: Record<Order['status'], { bg: string; text: string }> = {
  request: { bg: T.secondaryContainer, text: T.secondary },
  accepted: { bg: T.primaryContainer, text: '#522232' },
  shipped: { bg: '#EDE7E4', text: T.primary },
  delivered: { bg: '#FFDAD2', text: T.tertiary },
  cancelled: { bg: '#E8E1DE', text: T.outline },
};

// Category emoji map
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

  const handlePress = () => {
    router.push(`/order/${order.id}`);
  };

  const symbol = getCurrencySymbol(order.currency);
  const isActive = ['accepted', 'request'].includes(order.status);
  const hoursUntilDue = differenceInHours(new Date(order.dueDate), new Date());
  const isUrgent = isActive && hoursUntilDue < 48 && hoursUntilDue >= 0;

  const ribbonColor = isUrgent ? T.tertiary : RIBBON_COLOR[order.status];
  const badgeConfig = STATUS_BADGE[order.status];
  const categoryEmoji = order.craftCategory ? getCategoryEmoji(order.craftCategory) : '✦';

  return (
    <TouchableOpacity
      style={[styles.card, compact && styles.cardCompact]}
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
            <Text style={styles.orderName} numberOfLines={1}>
              {order.orderName}
            </Text>
            <Text style={styles.orderMeta} numberOfLines={1}>
              #{order.id.slice(-6)} · {order.customerName}
            </Text>
          </View>
          {/* Status badge pill */}
          <View style={[styles.badge, { backgroundColor: badgeConfig.bg }]}>
            <Text style={[styles.badgeText, { color: badgeConfig.text }]}>
              {order.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Middle row: category chip + price + deadline */}
        <View style={styles.middleRow}>
          {order.craftCategory ? (
            <View style={styles.categoryChip}>
              <Text style={styles.categoryEmoji}>{categoryEmoji}</Text>
              <Text style={styles.categoryLabel} numberOfLines={1}>
                {order.craftCategory}
              </Text>
            </View>
          ) : null}
          <View style={{ flex: 1 }} />
          <View style={styles.priceDeadlineGroup}>
            <Text style={styles.price}>
              {symbol}{order.askingPrice.toFixed(0)}
            </Text>
            <Text style={styles.dueDate}>
              Due {format(new Date(order.dueDate), 'MMM d')}
            </Text>
          </View>
        </View>

        {/* Countdown timer if urgent */}
        {isActive && (
          <View style={styles.countdownRow}>
            {isUrgent ? (
              <Text style={styles.urgentCountdown}>
                ⚡ Urgent — <CountdownTimer dueDate={order.dueDate} style={styles.urgentCountdownTimer} />
              </Text>
            ) : (
              <CountdownTimer dueDate={order.dueDate} style={styles.countdown} />
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
    backgroundColor: T.surfaceLowest,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#1D1B1A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardCompact: {
    marginBottom: 8,
  },
  accentBar: {
    width: 4,
    alignSelf: 'stretch',
  },
  body: {
    flex: 1,
    padding: 16,
    gap: 10,
  },
  // Top row
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  titleGroup: {
    flex: 1,
    gap: 2,
  },
  orderName: {
    fontSize: 17,
    fontFamily: 'PlayfairDisplay',
    fontWeight: '700',
    color: T.text,
    lineHeight: 22,
  },
  orderMeta: {
    fontSize: 12,
    fontFamily: 'DMSans',
    color: T.subText,
  },
  // Status badge
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
    flexShrink: 0,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'DMSans',
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  // Middle row
  middleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3ECEA',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
    maxWidth: 140,
  },
  categoryEmoji: {
    fontSize: 13,
  },
  categoryLabel: {
    fontSize: 11,
    fontFamily: 'DMSans',
    color: T.subText,
    fontWeight: '600',
  },
  priceDeadlineGroup: {
    alignItems: 'flex-end',
    gap: 2,
  },
  price: {
    fontSize: 16,
    fontFamily: 'DMMono',
    fontWeight: '700',
    color: T.primary,
  },
  dueDate: {
    fontSize: 12,
    fontFamily: 'DMSans',
    color: T.subText,
  },
  // Countdown
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  urgentCountdown: {
    fontSize: 12,
    fontFamily: 'DMSans',
    fontWeight: '600',
    color: T.tertiary,
  },
  urgentCountdownTimer: {
    fontSize: 12,
    color: T.tertiary,
    fontWeight: '600',
  },
  countdown: {
    fontSize: 12,
    color: T.subText,
  },
  // Tags
  tagsRow: {
    marginTop: 2,
  },
});
