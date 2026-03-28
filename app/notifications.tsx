import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Switch, TextInput, KeyboardAvoidingView,
  Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotifications } from '../hooks/useNotifications';
import { useTheme } from '../context/ThemeContext';
import { DEFAULT_NOTIFICATION_PREFS } from '../types';
import { Colors, Spacing, BorderRadius } from '../lib/theme';

const DAY_OPTIONS = [
  { label: 'Sun', value: 0 }, { label: 'Mon', value: 1 }, { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 }, { label: 'Thu', value: 4 }, { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { prefs, loading, updatePrefs, testNotification } = useNotifications();
  const { colors } = useTheme();
  const c = colors;

  // Section icon color configs — computed inside component so c.xxx is in scope
  const SEC_ICONS: Record<string, { icon: string; bg: string }> = {
    Master: { icon: '🔔', bg: c.accentContainer },
    'Due-Date Alerts': { icon: '⏱', bg: c.accentContainer },
    'Daily Digest': { icon: '☀️', bg: '#FFF3E0' },
    'Weekly Summary': { icon: '📅', bg: c.surfaceHigh },
    'Shipping Reminders': { icon: '📦', bg: c.surfaceContainer },
    'Payment Reminders': { icon: '💰', bg: c.surfaceContainer },
  };

  // Local draft state — only committed on Save
  const [draft, setDraft] = useState({ ...prefs });
  const [initialized, setInitialized] = useState(false);

  // Local text fields
  const [dueAlertTime, setDueAlertTime] = useState(prefs.dueSoonAlerts.time);
  const [digestTime, setDigestTime] = useState(prefs.dailyDigest.time);
  const [weeklyTime, setWeeklyTime] = useState(prefs.weeklySummary.time);
  const [shipDays, setShipDays] = useState(String(prefs.shippingReminder.daysAfterAccepted));
  const [payDays, setPayDays] = useState(String(prefs.paymentReminder.daysAfterDelivery));

  // Sync draft once context finishes loading (avoids stale defaults)
  useEffect(() => {
    if (!loading && !initialized) {
      setDraft({ ...prefs });
      setDueAlertTime(prefs.dueSoonAlerts.time);
      setDigestTime(prefs.dailyDigest.time);
      setWeeklyTime(prefs.weeklySummary.time);
      setShipDays(String(prefs.shippingReminder.daysAfterAccepted));
      setPayDays(String(prefs.paymentReminder.daysAfterDelivery));
      setInitialized(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, initialized]);

  const set = useCallback(<K extends keyof typeof draft>(key: K, val: (typeof draft)[K]) => {
    setDraft((d) => ({ ...d, [key]: val }));
  }, []);

  const toggleDayInterval = (day: number) => {
    const curr = draft.dueSoonAlerts.intervals;
    const next = curr.includes(day)
      ? curr.filter((d) => d !== day)
      : [...curr, day].sort((a, b) => a - b);
    set('dueSoonAlerts', { ...draft.dueSoonAlerts, intervals: next });
  };

  const handleSave = async () => {
    const shipN = Math.max(1, parseInt(shipDays) || 3);
    const payN = Math.max(1, parseInt(payDays) || 2);
    const finalPrefs = {
      ...draft,
      dueSoonAlerts: { ...draft.dueSoonAlerts, time: dueAlertTime.trim() || '09:00' },
      dailyDigest: { ...draft.dailyDigest, time: digestTime.trim() || '08:00' },
      weeklySummary: { ...draft.weeklySummary, time: weeklyTime.trim() || '09:00' },
      shippingReminder: { ...draft.shippingReminder, daysAfterAccepted: shipN },
      paymentReminder: { ...draft.paymentReminder, daysAfterDelivery: payN },
    };
    await updatePrefs(finalPrefs);
    Alert.alert('Saved', 'Notification preferences saved.');
  };

  const handleResetDefaults = () => {
    Alert.alert(
      'Reset to Defaults',
      'This will restore all notification settings to their defaults.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            const d = DEFAULT_NOTIFICATION_PREFS;
            setDraft({ ...d });
            setDueAlertTime(d.dueSoonAlerts.time);
            setDigestTime(d.dailyDigest.time);
            setWeeklyTime(d.weeklySummary.time);
            setShipDays(String(d.shippingReminder.daysAfterAccepted));
            setPayDays(String(d.paymentReminder.daysAfterDelivery));
            await updatePrefs(d);
            Alert.alert('Done', 'Settings reset to defaults.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[s.container, { backgroundColor: c.bg }]}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: c.bg }]}>
        <TouchableOpacity onPress={() => router.back()} style={[s.backPill, { backgroundColor: c.surfaceContainer }]} hitSlop={12}>
          <Text style={[s.backChevron, { color: c.primary }]}>‹</Text>
          <Text style={[s.back, { color: c.primary }]}>Back</Text>
        </TouchableOpacity>
        <Text style={[s.headerTitle, { color: c.text }]}>Notifications</Text>
        <TouchableOpacity onPress={handleSave} style={[s.saveHeaderBtn, { backgroundColor: c.primaryContainer }]} hitSlop={8}>
          <Text style={[s.saveHeaderTxt, { color: c.onPrimary }]}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* Decorative hoop motif at top of content */}
      <View style={s.hoopMotifRow}>
        <View style={[s.hoopCircle, { backgroundColor: c.accentContainer, shadowColor: c.primary }]}>
          <Text style={s.hoopEmoji}>🪡</Text>
        </View>
        <View style={s.hoopMotifText}>
          <Text style={[s.hoopMotifTitle, { color: c.text }]}>Notification Preferences</Text>
          <Text style={[s.hoopMotifSub, { color: c.subText }]}>Stay on top of every stitch</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        >
          {/* Master */}
          <Sec title="Master" secIcons={SEC_ICONS} colors={c}>
            <Row
              label="Enable all notifications"
              value={draft.enabled}
              onChange={(v) => set('enabled', v)}
              colors={c}
            />
          </Sec>

          {/* Due alerts */}
          <Sec title="Due-Date Alerts" secIcons={SEC_ICONS} colors={c}>
            <Row
              label="Remind me before due dates"
              value={draft.dueSoonAlerts.enabled}
              onChange={(v) => set('dueSoonAlerts', { ...draft.dueSoonAlerts, enabled: v })}
              colors={c}
            />
            {draft.dueSoonAlerts.enabled && (
              <>
                <Lbl colors={c}>Days before due (tap to toggle)</Lbl>
                <View style={s.chips}>
                  {[1, 2, 3, 5, 7, 14].map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[s.chip, { backgroundColor: c.surfaceContainer }, draft.dueSoonAlerts.intervals.includes(d) && { backgroundColor: c.primaryContainer }]}
                      onPress={() => toggleDayInterval(d)}
                    >
                      <Text style={[s.chipTxt, { color: c.subText }, draft.dueSoonAlerts.intervals.includes(d) && { color: c.onPrimary, fontWeight: '600' }]}>{d}d</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Lbl colors={c}>Alert time (HH:MM)</Lbl>
                <TextInput
                  style={[s.input, { backgroundColor: c.surfaceContainer, color: c.text }]}
                  value={dueAlertTime}
                  onChangeText={setDueAlertTime}
                  placeholder="09:00"
                  placeholderTextColor={c.outline}
                  keyboardType="numbers-and-punctuation"
                />
              </>
            )}
          </Sec>

          {/* Daily digest */}
          <Sec title="Daily Digest" secIcons={SEC_ICONS} colors={c}>
            <Row
              label="Morning summary"
              sublabel="Active orders, what's due, revenue"
              value={draft.dailyDigest.enabled}
              onChange={(v) => set('dailyDigest', { ...draft.dailyDigest, enabled: v })}
              colors={c}
            />
            {draft.dailyDigest.enabled && (
              <>
                <Lbl colors={c}>Send at (HH:MM)</Lbl>
                <TextInput
                  style={[s.input, { backgroundColor: c.surfaceContainer, color: c.text }]}
                  value={digestTime}
                  onChangeText={setDigestTime}
                  placeholder="08:00"
                  placeholderTextColor={c.outline}
                  keyboardType="numbers-and-punctuation"
                />
              </>
            )}
          </Sec>

          {/* Weekly summary */}
          <Sec title="Weekly Summary" secIcons={SEC_ICONS} colors={c}>
            <Row
              label="Weekly recap"
              sublabel="Revenue, completed orders, upcoming"
              value={draft.weeklySummary.enabled}
              onChange={(v) => set('weeklySummary', { ...draft.weeklySummary, enabled: v })}
              colors={c}
            />
            {draft.weeklySummary.enabled && (
              <>
                <Lbl colors={c}>Day of week</Lbl>
                <View style={s.chips}>
                  {DAY_OPTIONS.map((d) => (
                    <TouchableOpacity
                      key={d.value}
                      style={[s.chip, { backgroundColor: c.surfaceContainer }, draft.weeklySummary.dayOfWeek === d.value && { backgroundColor: c.primaryContainer }]}
                      onPress={() => set('weeklySummary', { ...draft.weeklySummary, dayOfWeek: d.value })}
                    >
                      <Text style={[s.chipTxt, { color: c.subText }, draft.weeklySummary.dayOfWeek === d.value && { color: c.onPrimary, fontWeight: '600' }]}>{d.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Lbl colors={c}>Send at (HH:MM)</Lbl>
                <TextInput
                  style={[s.input, { backgroundColor: c.surfaceContainer, color: c.text }]}
                  value={weeklyTime}
                  onChangeText={setWeeklyTime}
                  placeholder="09:00"
                  placeholderTextColor={c.outline}
                  keyboardType="numbers-and-punctuation"
                />
              </>
            )}
          </Sec>

          {/* Shipping */}
          <Sec title="Shipping Reminders" secIcons={SEC_ICONS} colors={c}>
            <Row
              label="Remind me to ship accepted orders"
              value={draft.shippingReminder.enabled}
              onChange={(v) => set('shippingReminder', { ...draft.shippingReminder, enabled: v })}
              colors={c}
            />
            {draft.shippingReminder.enabled && (
              <>
                <Lbl colors={c}>Days after accepting order</Lbl>
                <TextInput
                  style={[s.input, { backgroundColor: c.surfaceContainer, color: c.text }]}
                  value={shipDays}
                  onChangeText={setShipDays}
                  keyboardType="number-pad"
                  placeholder="3"
                  placeholderTextColor={c.outline}
                />
              </>
            )}
          </Sec>

          {/* Payment */}
          <Sec title="Payment Reminders" secIcons={SEC_ICONS} colors={c}>
            <Row
              label="Remind me about unpaid orders"
              value={draft.paymentReminder.enabled}
              onChange={(v) => set('paymentReminder', { ...draft.paymentReminder, enabled: v })}
              colors={c}
            />
            {draft.paymentReminder.enabled && (
              <>
                <Lbl colors={c}>Days after delivery if unpaid</Lbl>
                <TextInput
                  style={[s.input, { backgroundColor: c.surfaceContainer, color: c.text }]}
                  value={payDays}
                  onChangeText={setPayDays}
                  keyboardType="number-pad"
                  placeholder="2"
                  placeholderTextColor={c.outline}
                />
              </>
            )}
          </Sec>

          {/* Test + Reset */}
          <View style={s.actions}>
            <TouchableOpacity style={[s.testBtn, { backgroundColor: c.surfaceContainer }]} onPress={testNotification}>
              <Text style={[s.testTxt, { color: c.primary }]}>Send Test Notification</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.resetBtn, { backgroundColor: c.surfaceHigh }]} onPress={handleResetDefaults}>
              <Text style={[s.resetTxt, { color: c.subText }]}>Reset to Defaults</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Sticky save bar */}
      <View style={[s.stickyBar, { paddingBottom: insets.bottom + 8, borderTopColor: c.outlineVariant, backgroundColor: c.bg }]}>
        <TouchableOpacity style={[s.stickySave, { backgroundColor: c.primaryContainer }]} onPress={handleSave}>
          <Text style={[s.stickySaveTxt, { color: c.onPrimary }]}>Save Preferences</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function Sec({ title, children, secIcons, colors: c }: { title: string; children: React.ReactNode; secIcons: Record<string, { icon: string; bg: string }>; colors: any }) {
  const iconConfig = secIcons[title] ?? { icon: '⚙', bg: c.surfaceContainer };
  return (
    <View style={s.section}>
      <View style={s.secHeaderRow}>
        <View style={[s.secIconBg, { backgroundColor: iconConfig.bg }]}>
          <Text style={s.secIconEmoji}>{iconConfig.icon}</Text>
        </View>
        <Text style={[s.sectionTitle, { color: c.text }]}>{title}</Text>
      </View>
      <View style={[s.card, { backgroundColor: c.card }]}>{children}</View>
    </View>
  );
}

function Row({ label, sublabel, value, onChange, colors: c }: {
  label: string; sublabel?: string; value: boolean; onChange: (v: boolean) => void; colors: any;
}) {
  return (
    <View style={s.row}>
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={[s.rowLabel, { color: c.text }]}>{label}</Text>
        {sublabel && <Text style={[s.rowSub, { color: c.subText }]}>{sublabel}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: c.outlineVariant, true: c.primaryContainer }}
        thumbColor={c.card}
      />
    </View>
  );
}

function Lbl({ children, colors: c }: { children: string; colors: any }) {
  return <Text style={[s.fieldLbl, { color: c.subText }]}>{children}</Text>;
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    gap: 2,
  },
  backChevron: {
    fontSize: 20,
    lineHeight: 20,
    fontWeight: '300',
    marginTop: -1,
  },
  back: {
    fontSize: 13,
    fontFamily: 'DMSans',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay',
    fontWeight: '700',
  },
  saveHeaderBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
  saveHeaderTxt: {
    fontFamily: 'DMSans',
    fontSize: 13,
    fontWeight: '700',
  },

  // Hoop motif
  hoopMotifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 14,
  },
  hoopCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#D7B49E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  hoopEmoji: {
    fontSize: 24,
  },
  hoopMotifText: {
    flex: 1,
  },
  hoopMotifTitle: {
    fontSize: 16,
    fontFamily: 'PlayfairDisplay',
    fontWeight: '700',
    marginBottom: 2,
  },
  hoopMotifSub: {
    fontSize: 12,
    fontFamily: 'DMSans',
    fontStyle: 'italic',
  },

  // Section
  section: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  secHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  secIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secIconEmoji: {
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'PlayfairDisplay',
    fontWeight: '700',
  },
  card: {
    borderRadius: 16,
    padding: 16,
    gap: 8,
    shadowColor: 'rgba(0,0,0,0.03)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  rowLabel: {
    fontSize: 14,
    fontFamily: 'DMSans',
  },
  rowSub: {
    fontSize: 12,
    fontFamily: 'DMSans',
    marginTop: 2,
  },

  fieldLbl: {
    fontSize: 11,
    fontFamily: 'DMSans',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 8,
    marginBottom: 4,
  },

  // pill-shaped time input
  input: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontFamily: 'DMMono',
    fontSize: 15,
  },

  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipTxt: {
    fontSize: 12,
    fontFamily: 'DMMono',
  },

  actions: {
    paddingHorizontal: 16,
    marginTop: 24,
    gap: 10,
  },
  testBtn: {
    borderRadius: 999,
    padding: 16,
    alignItems: 'center',
  },
  testTxt: {
    fontFamily: 'DMSans',
    fontSize: 14,
    fontWeight: '600',
  },
  resetBtn: {
    borderRadius: 999,
    padding: 16,
    alignItems: 'center',
  },
  resetTxt: {
    fontFamily: 'DMSans',
    fontSize: 14,
    fontWeight: '600',
  },

  stickyBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  stickySave: {
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: 'center',
  },
  stickySaveTxt: {
    fontFamily: 'DMSans',
    fontSize: 15,
    fontWeight: '700',
  },
});
