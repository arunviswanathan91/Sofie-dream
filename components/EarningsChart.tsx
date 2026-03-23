import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Spacing } from '../lib/theme';
import type { ThemeColors } from '../context/ThemeContext';

// Stitch "Warm Artisan Editorial" chart tokens
const CHART_PRIMARY = '#864D5F';
const CHART_PRIMARY_FILL = 'rgba(134,77,95,0.08)';
const CHART_BAR = '#C9879A';
const CHART_SURFACE = '#F9F2EF';
const CHART_GRID = '#D5C2C5';
const CHART_LABEL = '#514346';

interface LineProps {
  data: { date: string; amount: number }[];
  title?: string;
  colors: ThemeColors;
}

interface BarProps {
  data: Record<string, number>;
  title?: string;
  colors: ThemeColors;
  currencySymbol?: string;
}

export function RevenueLineChart({ data, title }: LineProps) {
  const { width } = useWindowDimensions();
  const chartWidth = width - 48;

  const labels = data.map((d) => {
    const parts = d.date.split('-');
    return `${parts[1]}/${parts[2]}`;
  }).filter((_, i) => i % Math.ceil(data.length / 6) === 0 || i === data.length - 1);

  const values = data.map((d) => d.amount);
  const hasData = values.some((v) => v > 0);

  if (!hasData) {
    return (
      <View style={[styles.emptyChart, { backgroundColor: CHART_SURFACE }]}>
        <Text style={[styles.emptyText, { color: CHART_LABEL }]}>No revenue data yet</Text>
      </View>
    );
  }

  const chartConfig = {
    backgroundGradientFrom: CHART_SURFACE,
    backgroundGradientTo: CHART_SURFACE,
    color: (opacity = 1) => `rgba(134,77,95,${opacity})`,
    fillShadowGradient: CHART_PRIMARY,
    fillShadowGradientOpacity: 0.08,
    labelColor: () => CHART_LABEL,
    strokeWidth: 2,
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: CHART_PRIMARY,
    },
    propsForBackgroundLines: {
      stroke: CHART_GRID,
      strokeDasharray: '4',
      strokeOpacity: 0.5,
    },
  };

  return (
    <View>
      {title && <Text style={[styles.chartTitle, { color: '#514346' }]}>{title}</Text>}
      <LineChart
        data={{
          labels,
          datasets: [{ data: values }],
        }}
        width={chartWidth}
        height={160}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
        withDots={false}
        withInnerLines={false}
      />
    </View>
  );
}

export function RevenueByCategoryChart({ data, title, currencySymbol = '€' }: BarProps) {
  const { width } = useWindowDimensions();
  const chartWidth = width - 48;

  const entries = Object.entries(data).sort(([, a], [, b]) => b - a).slice(0, 5);

  if (entries.length === 0) {
    return (
      <View style={[styles.emptyChart, { backgroundColor: CHART_SURFACE }]}>
        <Text style={[styles.emptyText, { color: CHART_LABEL }]}>No category data yet</Text>
      </View>
    );
  }

  const labels = entries.map(([k]) => k.slice(0, 8));
  const values = entries.map(([, v]) => v);

  const barChartConfig = {
    backgroundGradientFrom: CHART_SURFACE,
    backgroundGradientTo: CHART_SURFACE,
    color: (opacity = 1) => `rgba(201,135,154,${opacity})`,
    labelColor: () => CHART_LABEL,
    strokeWidth: 2,
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: CHART_BAR,
    },
    propsForBackgroundLines: {
      stroke: CHART_GRID,
      strokeDasharray: '4',
      strokeOpacity: 0.5,
    },
  };

  return (
    <View>
      {title && <Text style={[styles.chartTitle, { color: '#514346' }]}>{title}</Text>}
      <BarChart
        data={{
          labels,
          datasets: [{ data: values }],
        }}
        width={chartWidth}
        height={160}
        chartConfig={barChartConfig}
        style={styles.chart}
        showValuesOnTopOfBars
        yAxisLabel={currencySymbol}
        yAxisSuffix=""
        fromZero
      />
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    borderRadius: 16,
    marginVertical: Spacing.sm,
  },
  chartTitle: {
    fontSize: 13,
    fontFamily: 'DMSans',
    color: CHART_LABEL,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  emptyChart: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    marginVertical: Spacing.sm,
    backgroundColor: CHART_SURFACE,
  },
  emptyText: {
    fontFamily: 'DMSans',
    fontSize: 13,
    color: CHART_LABEL,
  },
});
