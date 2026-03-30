import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BorderRadius } from '../lib/theme';
import { useTheme } from '../context/ThemeContext';

interface Props {
  label: string;
  onRemove?: () => void;
  onPress?: () => void;
  selected?: boolean;
  color?: string;
}

export function TagChip({ label, onRemove, onPress, selected, color }: Props) {
  const { colors } = useTheme();

  const bg = color
    ? `${color}22`
    : selected
    ? `${colors.primaryContainer}33`
    : colors.surfaceContainer;
  const textColor = color ?? (selected ? colors.primary : colors.subText);

  return (
    <TouchableOpacity
      style={[styles.chip, { backgroundColor: bg }]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress && !onRemove}
    >
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      {onRemove && (
        <Text style={[styles.remove, { color: textColor }]} onPress={onRemove}>
          {' ×'}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
    marginRight: 6,
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    fontFamily: 'DMSans',
    letterSpacing: 0.3,
  },
  remove: {
    fontSize: 14,
    fontFamily: 'DMSans',
    lineHeight: 16,
  },
});
