import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { OrdersProvider } from '../context/OrdersContext';
import { ProfileProvider } from '../context/ProfileContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { registerBackgroundBackupTask } from '../lib/backgroundBackup';

SplashScreen.preventAutoHideAsync();

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Register background tasks
    registerBackgroundBackupTask();
  }, []);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === 'login';

    if (!user && !inAuthGroup) {
      // Redirect to the login page if they are not logged in
      router.replace('/login');
    } else if (user && inAuthGroup) {
      // Redirect away from the login page if they are logged in
      router.replace('/(tabs)');
    }
  }, [user, segments, loading]);

  return <>{children}</>;
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
        <Stack.Screen name="login" options={{ headerShown: false }} />
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
    return null;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthGuard>
          <OrdersProvider>
            <ProfileProvider>
              <InnerLayout />
            </ProfileProvider>
          </OrdersProvider>
        </AuthGuard>
      </AuthProvider>
    </ThemeProvider>
  );
}
