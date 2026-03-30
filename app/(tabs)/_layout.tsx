import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface TabIconProps {
  name: keyof typeof Ionicons.glyphMap;
  label: string;
  focused: boolean;
  activeColor: string;
  inactiveColor: string;
}

function TabIcon({ name, label, focused, activeColor, inactiveColor }: TabIconProps) {
  const color = focused ? activeColor : inactiveColor;
  return (
    <View style={styles.tabIcon}>
      <Ionicons
        name={focused ? name : (`${name}-outline` as keyof typeof Ionicons.glyphMap)}
        size={24}
        color={color}
      />
      <Text style={[styles.tabLabel, { color }, focused && styles.tabLabelFocused]}>
        {label}
      </Text>
      {focused && <View style={[styles.dot, { backgroundColor: activeColor }]} />}
    </View>
  );
}

export default function TabsLayout() {
  const { colors } = useTheme();
  const activeColor = colors.accent;
  const inactiveColor = colors.subText + '99'; // ~60% opacity

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.cardBorder,
          borderTopWidth: 0.5,
          height: 72,
          paddingBottom: 12,
          paddingTop: 8,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="home" label="Home" focused={focused} activeColor={activeColor} inactiveColor={inactiveColor} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="list" label="Orders" focused={focused} activeColor={activeColor} inactiveColor={inactiveColor} />
          ),
        }}
      />
      <Tabs.Screen
        name="track"
        options={{
          title: 'Craft',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="color-palette" label="Craft" focused={focused} activeColor={activeColor} inactiveColor={inactiveColor} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="settings" label="Settings" focused={focused} activeColor={activeColor} inactiveColor={inactiveColor} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    minWidth: 56,
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: 'DMSans',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tabLabelFocused: {
    fontWeight: '700',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
});
