import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface Props {
  onPress: () => void;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function FAB({ onPress }: Props) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.88, { damping: 8 }, () => {
      scale.value = withSpring(1, { damping: 8 });
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <AnimatedTouchable style={[styles.fab, animatedStyle]} onPress={handlePress} activeOpacity={0.9}>
      <View style={styles.inner}>
        <Text style={styles.icon}>+</Text>
        <Text style={styles.label}>New Order</Text>
      </View>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    height: 52,
    borderRadius: 999,
    paddingHorizontal: 24,
    backgroundColor: '#994530',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(153,69,48,0.35)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 8,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    fontSize: 22,
    color: '#FFFFFF',
    lineHeight: 26,
    fontWeight: '300',
  },
  label: {
    fontSize: 13,
    fontFamily: 'DMSans',
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
});
