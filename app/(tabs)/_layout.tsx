import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface TabIconProps {
  emoji: string;
  label: string;
  focused: boolean;
}

function TabIcon({ emoji, label, focused }: TabIconProps) {
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconFocused]}>
      <Text style={styles.tabEmoji}>{emoji}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
    </View>
  );
}

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'rgba(255,248,245,0.92)',
          borderTopWidth: 0,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          height: 72,
          paddingBottom: 8,
          paddingTop: 8,
          shadowColor: '#864D5F',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 16,
          elevation: 8,
          position: 'absolute',
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#994530',
        tabBarInactiveTintColor: 'rgba(134,77,95,0.4)',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="⌂" label="Home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="✦" label="Orders" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="track"
        options={{
          title: 'Craft',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="◆" label="Craft" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="◇" label="Settings" focused={focused} />
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
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 2,
    minWidth: 64,
  },
  tabIconFocused: {
    backgroundColor: 'rgba(153,69,48,0.08)',
  },
  tabEmoji: {
    fontSize: 18,
    lineHeight: 22,
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: 'DMSans',
    color: 'rgba(134,77,95,0.4)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tabLabelFocused: {
    color: '#994530',
    fontWeight: '600',
  },
});
