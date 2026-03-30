import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Spacing } from '../lib/theme';
import { useTheme } from '../context/ThemeContext';

interface Props {
  title: string;
  action?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, action, onAction }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {action && (
        <TouchableOpacity onPress={onAction}>
          <Text style={[styles.action, { color: colors.primary }]}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  title: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay',
    fontWeight: '700',
  },
  action: {
    fontSize: 13,
    fontFamily: 'DMSans',
  },
});
