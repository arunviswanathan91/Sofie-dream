import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { OrdersProvider } from '../context/OrdersContext';
import { ProfileProvider } from '../context/ProfileContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';

SplashScreen.preventAutoHideAsync();

// Stitch "Warm Artisan Editorial" splash screen shown while fonts load
function StitchSplashScreen() {
  return (
    <View style={splash.container}>
      {/* Decorative orb — top left */}
      <View style={[splash.orb, splash.orbTopLeft]} pointerEvents="none" />
      {/* Decorative orb — bottom right */}
      <View style={[splash.orb, splash.orbBottomRight]} pointerEvents="none" />

      {/* Center content */}
      <View style={splash.centerContent}>
        {/* Hoop logo */}
        <Animated.View entering={FadeInDown.delay(0).duration(600)} style={splash.hoopOuter}>
          <View style={splash.hoopInner}>
            <Text style={splash.hoopMark}>✦</Text>
          </View>
        </Animated.View>

        {/* App name */}
        <Animated.Text entering={FadeInDown.delay(120).duration(600)} style={splash.title}>
          Sofi Dream ✦
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text entering={FadeInDown.delay(200).duration(600)} style={splash.subtitle}>
          Handmade with love ✦
        </Animated.Text>
      </View>

      {/* Bottom quote card */}
      <Animated.View entering={FadeInDown.delay(320).duration(700)} style={splash.quoteCard}>
        <Text style={splash.quoteText}>"Every stitch tells a story."</Text>
        <View style={splash.quoteDots}>
          <View style={splash.dot} />
          <View style={[splash.dot, splash.dotWide]} />
          <View style={splash.dot} />
        </View>
      </Animated.View>
    </View>
  );
}

// Inner layout reads theme colors
function InnerLayout() {
  const router = useRouter();
  const { colors } = useTheme();

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as {
        screen?: string;
        orderId?: string;
      };
      if (data?.screen === 'OrderDetail' && data?.orderId) {
        router.push(`/order/${data.orderId}` as never);
      } else if (data?.screen === 'Reports') {
        router.push('/reports' as never);
      }
    });
    return () => subscription.remove();
  }, [router]);

  return (
    <>
      <StatusBar style={colors.isDark ? 'light' : 'dark'} backgroundColor={colors.header} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'slide_from_right',
          gestureEnabled: true,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="order/new" options={{ presentation: 'modal', headerShown: false, animation: 'fade_from_bottom' }} />
        <Stack.Screen name="order/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="order/edit/[id]" options={{ presentation: 'modal', headerShown: false, animation: 'fade_from_bottom' }} />
        <Stack.Screen name="customers/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="reports/index" options={{ headerShown: false }} />
        <Stack.Screen name="notifications" options={{ presentation: 'modal', headerShown: false, animation: 'fade_from_bottom' }} />
        <Stack.Screen name="backup/index" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlayfairDisplay: require('../assets/fonts/PlayfairDisplay-Regular.ttf'),
    'PlayfairDisplay-Bold': require('../assets/fonts/PlayfairDisplay-Bold.ttf'),
    DMSans: require('../assets/fonts/DMSans-Regular.ttf'),
    'DMSans-Medium': require('../assets/fonts/DMSans-Medium.ttf'),
    'DMSans-Bold': require('../assets/fonts/DMSans-Bold.ttf'),
    DMMono: require('../assets/fonts/DMMono-Regular.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return <StitchSplashScreen />;
  }

  return (
    <ThemeProvider>
      <OrdersProvider>
        <ProfileProvider>
          <InnerLayout />
        </ProfileProvider>
      </OrdersProvider>
    </ThemeProvider>
  );
}

const splash = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Decorative gradient orbs
  orb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.18,
  },
  orbTopLeft: {
    width: 220,
    height: 220,
    top: -60,
    left: -60,
    backgroundColor: '#864D5F',
  },
  orbBottomRight: {
    width: 260,
    height: 260,
    bottom: -80,
    right: -80,
    backgroundColor: '#994530',
  },
  // Center hero
  centerContent: {
    alignItems: 'center',
    gap: 12,
  },
  // Hoop logo
  hoopOuter: {
    width: 192,
    height: 192,
    borderRadius: 96,
    borderWidth: 10,
    borderColor: '#D7B49E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#864D5F',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 6,
    marginBottom: 8,
  },
  hoopInner: {
    width: 148,
    height: 148,
    borderRadius: 74,
    backgroundColor: '#F3ECEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hoopMark: {
    fontSize: 48,
    color: '#864D5F',
  },
  // Title & subtitle — use system font here since custom fonts may not be
  // loaded yet; they will load and the real app will use PlayfairDisplay.
  title: {
    fontSize: 32,
    color: '#3D2B1F',
    letterSpacing: 0.5,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    color: '#514346',
    fontStyle: 'italic',
    letterSpacing: 0.3,
  },
  // Bottom quote card
  quoteCard: {
    position: 'absolute',
    bottom: 60,
    left: 32,
    right: 32,
    backgroundColor: 'rgba(255,217,226,0.25)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#864D5F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  quoteText: {
    fontSize: 14,
    color: '#514346',
    fontStyle: 'italic',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  quoteDots: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#D7B49E',
  },
  dotWide: {
    width: 18,
  },
});
