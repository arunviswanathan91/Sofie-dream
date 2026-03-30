import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Spacing, BorderRadius } from '../lib/theme';
import { useTheme } from '../context/ThemeContext';

interface Props {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  onPress?: () => void;
  accentColor?: string;
}

export function StatTile({ label, value, prefix = '', suffix = '', onPress, accentColor }: Props) {
  const { colors } = useTheme();
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    animatedValue.value = withTiming(value, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [value]);

  const dotColor = accentColor ?? colors.primary;

  return (
    <TouchableOpacity
      style={[styles.tile, { backgroundColor: colors.surfaceLow }]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.8 : 1}
    >
      {/* Accent indicator dot */}
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text style={[styles.value, { color: colors.text }]}>
        {prefix}{value.toFixed(value % 1 === 0 ? 0 : 2)}{suffix}
      </Text>
      <Text style={[styles.label, { color: colors.subText }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    borderRadius: BorderRadius.card,
    padding: Spacing.md,
    alignItems: 'flex-start',
    marginHorizontal: 3,
    shadowColor: 'rgba(0,0,0,0.03)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  value: {
    fontSize: 28,
    fontFamily: 'PlayfairDisplay',
    fontWeight: '700',
    marginBottom: 4,
  },
  label: {
    fontSize: 10,
    fontFamily: 'DMSans',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
