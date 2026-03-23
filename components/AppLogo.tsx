import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  showSubtitle?: boolean;
}

const SIZES = {
  sm: { hoop: 56, inner: 40, mark: 20, name: 13, subtitle: 11 },
  md: { hoop: 80, inner: 58, mark: 28, name: 16, subtitle: 12 },
  lg: { hoop: 120, inner: 88, mark: 42, name: 22, subtitle: 13 },
};

export function AppLogo({ size = 'md', showName = true, showSubtitle = false }: Props) {
  const sz = SIZES[size];

  return (
    <View style={styles.wrapper}>
      {/* Wooden hoop outer ring */}
      <View
        style={[
          styles.hoopOuter,
          {
            width: sz.hoop,
            height: sz.hoop,
            borderRadius: sz.hoop / 2,
          },
        ]}
      >
        {/* Inner circle */}
        <View
          style={[
            styles.hoopInner,
            {
              width: sz.inner,
              height: sz.inner,
              borderRadius: sz.inner / 2,
            },
          ]}
        >
          <Text style={[styles.mark, { fontSize: sz.mark }]}>✦</Text>
        </View>
      </View>

      {showName && (
        <Text style={[styles.name, { fontSize: sz.name }]}>Sofi Dream ✦</Text>
      )}
      {showSubtitle && (
        <Text style={[styles.subtitle, { fontSize: sz.subtitle }]}>Handmade with love ✦</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: 8,
  },
  hoopOuter: {
    borderWidth: 8,
    borderColor: '#D7B49E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#864D5F',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 3,
  },
  hoopInner: {
    backgroundColor: '#F3ECEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: {
    color: '#864D5F',
    fontFamily: 'PlayfairDisplay',
  },
  name: {
    fontFamily: 'PlayfairDisplay',
    color: '#3D2B1F',
    letterSpacing: 1,
  },
  subtitle: {
    fontFamily: 'DMSans',
    color: '#514346',
    fontStyle: 'italic',
    letterSpacing: 0.3,
  },
});
