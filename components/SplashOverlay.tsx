import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';

interface Props {
  onFinish: () => void;
}

const { width } = Dimensions.get('window');

export function SplashOverlay({ onFinish }: Props) {
  const { colors } = useTheme();

  const containerOpacity = useSharedValue(1);
  const logoScale = useSharedValue(0.7);
  const logoOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(20);
  const quoteOpacity = useSharedValue(0);
  const quoteY = useSharedValue(30);

  useEffect(() => {
    // Logo animation
    logoOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    logoScale.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.back(1.1)) });

    // Title fades in
    titleOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));
    titleY.value = withDelay(400, withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }));

    // Quote fades in
    quoteOpacity.value = withDelay(700, withTiming(1, { duration: 500 }));
    quoteY.value = withDelay(700, withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }));

    // Fade out entire overlay after 2200ms
    containerOpacity.value = withDelay(
      2200,
      withTiming(0, { duration: 600, easing: Easing.in(Easing.cubic) }, (finished) => {
        if (finished) runOnJS(onFinish)();
      })
    );
  }, []);

  const containerStyle = useAnimatedStyle(() => ({ opacity: containerOpacity.value }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));
  const quoteStyle = useAnimatedStyle(() => ({
    opacity: quoteOpacity.value,
    transform: [{ translateY: quoteY.value }],
  }));

  return (
    <Animated.View style={[styles.container, { backgroundColor: colors.bg }, containerStyle]} pointerEvents="none">
      {/* Decorative blobs */}
      <View style={[styles.blob, styles.blobTopLeft, { backgroundColor: colors.primary }]} />
      <View style={[styles.blob, styles.blobBottomRight, { backgroundColor: colors.accent }]} />

      {/* Center content */}
      <View style={styles.center}>
        {/* Embroidery Hoop Logo */}
        <Animated.View style={[styles.hoopWrapper, logoStyle]}>
          <View style={[styles.hoopOuter, { borderColor: colors.outlineVariant, shadowColor: colors.primary }]}>
            <View style={[styles.hoopInner, { backgroundColor: colors.card }]}>
              <Text style={styles.hoopEmoji}>🪡</Text>
            </View>
          </View>
          {/* Needle accent */}
          <View style={[styles.needle, { backgroundColor: colors.outlineVariant }]} />
        </Animated.View>

        {/* Title */}
        <Animated.View style={[styles.titleGroup, titleStyle]}>
          <Text style={[styles.title, { color: colors.text }]}>Sofi Dream ✦</Text>
          <Text style={[styles.tagline, { color: colors.subText }]}>Handmade with love ✦</Text>
        </Animated.View>
      </View>

      {/* Bottom quote card */}
      <Animated.View style={[styles.quoteCard, { backgroundColor: colors.primaryContainer + '55', shadowColor: colors.primary }, quoteStyle]}>
        <Text style={[styles.quoteIcon, { color: colors.primary }]}>"</Text>
        <Text style={[styles.quoteText, { color: colors.text }]}>Every stitch tells a story.</Text>
        <View style={styles.quoteDivider}>
          <View style={[styles.divLine, { width: 32, opacity: 0.2, backgroundColor: colors.primary }]} />
          <View style={[styles.divLine, { width: 8, backgroundColor: colors.primary }]} />
          <View style={[styles.divLine, { width: 8, opacity: 0.2, backgroundColor: colors.primary }]} />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 80,
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.04,
  },
  blobTopLeft: {
    width: width * 0.5,
    height: width * 0.5,
    top: -width * 0.15,
    left: -width * 0.2,
  },
  blobBottomRight: {
    width: width * 0.4,
    height: width * 0.4,
    bottom: -width * 0.1,
    right: -width * 0.1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  hoopWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hoopOuter: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 30,
    elevation: 8,
  },
  hoopInner: {
    width: '88%',
    height: '88%',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hoopEmoji: {
    fontSize: 64,
  },
  needle: {
    position: 'absolute',
    right: -8,
    top: '50%',
    width: 2,
    height: 60,
    borderRadius: 1,
    transform: [{ translateY: -30 }, { rotate: '35deg' }],
  },
  titleGroup: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: 'PlayfairDisplay',
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  tagline: {
    fontFamily: 'DMSans',
    fontSize: 13,
    fontStyle: 'italic',
    letterSpacing: 1.5,
    opacity: 0.7,
  },
  quoteCard: {
    width: width - 48,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  quoteIcon: {
    fontFamily: 'PlayfairDisplay',
    fontSize: 32,
    opacity: 0.5,
    lineHeight: 32,
  },
  quoteText: {
    fontFamily: 'PlayfairDisplay',
    fontSize: 18,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 28,
  },
  quoteDivider: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    marginTop: 4,
  },
  divLine: {
    height: 2,
    borderRadius: 1,
  },
});
