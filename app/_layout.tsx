import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { OrdersProvider } from '../context/OrdersContext';
import { ProfileProvider } from '../context/ProfileContext';
import { NotificationsProvider } from '../context/NotificationsContext';
import { InventoryProvider } from '../context/InventoryContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { SplashOverlay } from '../components/SplashOverlay';
import { isDailyBackupEnabled, registerDailyBackup } from '../lib/autoBackup';
import { getGoogleSession } from '../lib/backup';

SplashScreen.preventAutoHideAsync();

// Inner layout reads theme colors
function InnerLayout() {
  const router = useRouter();
  const { colors } = useTheme();
  const [showSplash, setShowSplash] = useState(true);

  // Re-register daily backup task after app restarts
  useEffect(() => {
    (async () => {
      const [enabled, session] = await Promise.all([isDailyBackupEnabled(), getGoogleSession()]);
      if (enabled && session) {
        registerDailyBackup().catch(() => {});
      }
    })();
  }, []);

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
    <View style={{ flex: 1 }}>
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
        <Stack.Screen name="inventory/index" options={{ headerShown: false }} />
        <Stack.Screen name="inventory/new" options={{ presentation: 'modal', headerShown: false, animation: 'fade_from_bottom' }} />
        <Stack.Screen name="inventory/[id]" options={{ headerShown: false }} />
      </Stack>

      {/* Animated splash overlay — sits on top of everything */}
      {showSplash && (
        <SplashOverlay onFinish={() => setShowSplash(false)} />
      )}
    </View>
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
    return null;
  }

  return (
    <ThemeProvider>
      <OrdersProvider>
        <ProfileProvider>
          <NotificationsProvider>
            <InventoryProvider>
              <InnerLayout />
            </InventoryProvider>
          </NotificationsProvider>
        </ProfileProvider>
      </OrdersProvider>
    </ThemeProvider>
  );
}
