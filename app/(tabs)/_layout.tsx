import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

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
          tabBarIcon: ({ focused, color, size }) => (
            <View style={[styles.tabIcon, focused && styles.tabIconFocused]}>
              <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
              <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>Home</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ focused, color, size }) => (
            <View style={[styles.tabIcon, focused && styles.tabIconFocused]}>
              <Ionicons name={focused ? 'list' : 'list-outline'} size={size} color={color} />
              <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>Orders</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="track"
        options={{
          title: 'Craft',
          tabBarIcon: ({ focused, color, size }) => (
            <View style={[styles.tabIcon, focused && styles.tabIconFocused]}>
              <Ionicons name={focused ? 'color-palette' : 'color-palette-outline'} size={size} color={color} />
              <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>Craft</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused, color, size }) => (
            <View style={[styles.tabIcon, focused && styles.tabIconFocused]}>
              <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} size={size} color={color} />
              <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>Settings</Text>
            </View>
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
