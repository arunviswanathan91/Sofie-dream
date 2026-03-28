import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Switch, Alert, KeyboardAvoidingView, Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNotifications } from '../../hooks/useNotifications';
import { useProfile } from '../../hooks/useProfile';
import { useTheme } from '../../context/ThemeContext';
import type { AppTheme } from '../../types';

const THEMES: { label: string; value: AppTheme; bg: string; text: string; desc: string }[] = [
  { label: 'System Default', value: 'system', bg: '#888888', text: '#FFFFFF', desc: 'Follows device dark/light mode' },
  { label: 'Warm Cream', value: 'warm-cream', bg: '#FAF7F2', text: '#3D2B1F', desc: 'Default warm tone' },
  { label: 'Dark Walnut', value: 'dark-walnut', bg: '#2A1F17', text: '#F5EDE3', desc: 'Dark, rich brown' },
  { label: 'Soft Sage', value: 'soft-sage', bg: '#EAF0EA', text: '#2D402D', desc: 'Calm green' },
  { label: 'Lavender', value: 'lavender', bg: '#F0EAF8', text: '#3D2D52', desc: 'Gentle purple' },
];

const CURRENCIES = ['EUR', 'GBP', 'USD', 'CHF', 'INR', 'SEK', 'PLN'];

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { prefs, updatePrefs, testNotification } = useNotifications();
  const { profile, saveProfile } = useProfile();
  const { theme: activeTheme, setTheme: setGlobalTheme, colors } = useTheme();
  const c = colors;
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;

  const [name, setName] = useState(profile.name);
  const [tagline, setTagline] = useState(profile.tagline ?? '');
  const [address, setAddress] = useState(profile.address ?? '');
  const [gstNumber, setGstNumber] = useState(profile.gstNumber ?? '');
  const [currency, setCurrency] = useState(profile.currency);
  const [theme, setTheme] = useState<AppTheme>(profile.theme);
  const [saving, setSaving] = useState(false);

  // Sync local state when profile loads from storage
  useEffect(() => {
    setName(profile.name);
    setTagline(profile.tagline ?? '');
    setAddress(profile.address ?? '');
    setGstNumber(profile.gstNumber ?? '');
    setCurrency(profile.currency);
    setTheme(profile.theme);
  }, [profile.name, profile.tagline, profile.address, profile.gstNumber, profile.currency, profile.theme]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveProfile({
        name: name.trim() || 'Sofi Dream',
        tagline: tagline.trim(),
        address: address.trim() || undefined,
        gstNumber: gstNumber.trim() || undefined,
        currency,
        theme,
        timezone: profile.timezone,
      });
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch (e) {
      Alert.alert('Error', 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleThemeSelect = async (t: AppTheme) => {
    setTheme(t);
    setGlobalTheme(t);
    await saveProfile({ ...profile, theme: t });
  };

  // Get avatar initial
  const avatarInitial = (name || 'S').trim().charAt(0).toUpperCase();

  return (
    <SafeAreaView style={[s.container, { backgroundColor: c.bg }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
        >
          {/* Page title */}
          <Text style={[s.pageTitle, { color: c.text }]}>Settings</Text>

          {/* Profile Hero Header */}
          <View style={[s.profileHero, { backgroundColor: c.accentContainer }]}>
            <View style={[s.profileHeroBg, { backgroundColor: c.primary }]} />
            <View style={s.profileHeroContent}>
              {/* Avatar circle */}
              <View style={[s.avatar, { backgroundColor: c.primaryContainer, shadowColor: c.primary }]}>
                <Text style={s.avatarText}>{avatarInitial}</Text>
              </View>
              <View style={s.profileHeroInfo}>
                <Text style={[s.profileHeroName, { color: c.onPrimary }]}>{name || 'Sofi Dream'}</Text>
                <Text style={[s.profileHeroTagline, { color: c.subText }]}>
                  {tagline || 'Handmade with love ✦'}
                </Text>
              </View>
              <TouchableOpacity
                style={[s.profileEditBtn, { backgroundColor: c.primary }]}
                onPress={handleSave}
                activeOpacity={0.8}
              >
                <Text style={s.profileEditBtnText}>Edit</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Business Profile */}
          <Sec title="Business Profile" icon="🏪" iconBg={c.accentContainer} colors={c}>
            <Lbl colors={c}>Business Name</Lbl>
            <TextInput style={[s.input, { backgroundColor: c.card, color: c.text }]} value={name} onChangeText={setName} placeholder="Your business name" placeholderTextColor={c.outline} />
            <Lbl colors={c}>Tagline</Lbl>
            <TextInput style={[s.input, { backgroundColor: c.card, color: c.text }]} value={tagline} onChangeText={setTagline} placeholder="Handmade with love ✦" placeholderTextColor={c.outline} />
            <Lbl colors={c}>Business Address (for invoices)</Lbl>
            <TextInput
              style={[s.input, s.multiline, { backgroundColor: c.card, color: c.text }]}
              value={address}
              onChangeText={setAddress}
              placeholder="Street, City, Country"
              placeholderTextColor={c.outline}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />
            <Lbl colors={c}>GST / Tax Number (optional)</Lbl>
            <TextInput style={[s.input, { backgroundColor: c.card, color: c.text }]} value={gstNumber} onChangeText={setGstNumber} placeholder="e.g. 22AAAAA0000A1Z5" placeholderTextColor={c.outline} autoCapitalize="characters" />
            <Lbl colors={c}>Default Currency</Lbl>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} keyboardShouldPersistTaps="always">
              {CURRENCIES.map((cur) => (
                <TouchableOpacity key={cur} style={[s.chip, { backgroundColor: c.surfaceHighest }, currency === cur && { backgroundColor: c.primary }]} onPress={() => setCurrency(cur)}>
                  <Text style={[s.chipTxt, { color: c.subText }, currency === cur && s.chipTxtOn]}>{cur}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={[s.saveBtn, { backgroundColor: c.primaryContainer }, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
              <Text style={s.saveTxt}>{saving ? 'Saving…' : 'Save Profile'}</Text>
            </TouchableOpacity>
          </Sec>

          {/* App Theme */}
          <Sec title="App Theme" icon="🎨" iconBg={c.accentContainer} colors={c}>
            <Text style={[s.themeHint, { color: c.subText }]}>Tap to apply instantly — changes the whole app</Text>

            {/* Full theme grid */}
            <View style={[s.themeGrid, isTablet && s.themeGridTablet]}>
              {THEMES.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  style={[
                    s.themeCard,
                    isTablet && s.themeCardTablet,
                    { backgroundColor: t.bg },
                    (theme === t.value || activeTheme === t.value) && [s.themeCardOn, { borderColor: c.primary }],
                  ]}
                  onPress={() => handleThemeSelect(t.value)}
                  activeOpacity={0.85}
                >
                  <Text style={[s.themeLbl, { color: t.text }]}>{t.label}</Text>
                  <Text style={[s.themeDesc, { color: t.text, opacity: 0.6 }]}>{t.desc}</Text>
                  {(theme === t.value || activeTheme === t.value) && (
                    <Text style={[s.themeCheck, { color: t.text }]}>✓ Active</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </Sec>

          {/* Notifications */}
          <Sec title="Notifications" icon="🔔" iconBg={c.surfaceContainer} colors={c}>
            <SRow label="Enable Notifications" colors={c} right={
              <Switch
                value={prefs.enabled}
                onValueChange={(v) => updatePrefs({ enabled: v })}
                trackColor={{ false: c.outlineVariant, true: c.primaryContainer }}
                thumbColor="#FFFFFF"
              />
            } />
            <SRow label="Daily Digest" colors={c} right={
              <Switch
                value={prefs.dailyDigest.enabled}
                onValueChange={(v) => updatePrefs({ dailyDigest: { ...prefs.dailyDigest, enabled: v } })}
                trackColor={{ false: c.outlineVariant, true: c.primaryContainer }}
                thumbColor="#FFFFFF"
              />
            } />
            <SRow label="Due Date Alerts" colors={c} right={
              <Switch
                value={prefs.dueSoonAlerts.enabled}
                onValueChange={(v) => updatePrefs({ dueSoonAlerts: { ...prefs.dueSoonAlerts, enabled: v } })}
                trackColor={{ false: c.outlineVariant, true: c.primaryContainer }}
                thumbColor="#FFFFFF"
              />
            } />
            <TouchableOpacity style={[s.testBtn, { borderColor: c.primaryContainer }]} onPress={testNotification}>
              <Text style={[s.testTxt, { color: c.primary }]}>Send Test Notification</Text>
            </TouchableOpacity>
          </Sec>

          {/* Quick Links */}
          <Sec title="More" icon="⬡" iconBg={c.surfaceHigh} colors={c}>
            <SRow label="Notification Preferences" colors={c} right={<Text style={[s.arrow, { color: c.subText }]}>›</Text>} onPress={() => router.push('/notifications')} />
            <SRow label="Craft Categories" colors={c} right={<Text style={[s.arrow, { color: c.subText }]}>›</Text>} onPress={() => router.push('/(tabs)/track')} />
            <SRow label="Inventory" colors={c} right={<Text style={[s.arrow, { color: c.subText }]}>›</Text>} onPress={() => router.push('/inventory')} />
            <SRow label="Reports & Export" colors={c} right={<Text style={[s.arrow, { color: c.subText }]}>›</Text>} onPress={() => router.push('/reports')} />
            <SRow label="Data Backup" colors={c} right={<Text style={[s.arrow, { color: c.subText }]}>›</Text>} onPress={() => router.push('/backup')} />
          </Sec>

          {/* About */}
          <Sec title="About" icon="ℹ" iconBg={c.surfaceContainer} colors={c}>
            <SRow label="Version" colors={c} right={<Text style={[s.meta, { color: c.subText }]}>1.0.0</Text>} />
            <SRow label="Made with" colors={c} right={<Text style={[s.meta, { color: c.subText }]}>✦ for Sofie</Text>} />
          </Sec>

          {/* Sign out */}
          <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
            <TouchableOpacity style={[s.signOutBtn, { backgroundColor: c.surfaceLow }]}>
              <Text style={[s.signOutTxt, { color: c.error }]}>Sign Out</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Sec({ title, icon, iconBg, children, colors: c }: { title: string; icon?: string; iconBg?: string; children: React.ReactNode; colors: any }) {
  return (
    <View style={s.section}>
      <View style={s.secHeaderRow}>
        {icon && (
          <View style={[s.secIconBg, { backgroundColor: iconBg ?? c.surfaceContainer }]}>
            <Text style={s.secIcon}>{icon}</Text>
          </View>
        )}
        <Text style={[s.secTitle, { color: c.text }]}>{title}</Text>
      </View>
      <View style={[s.secCard, { backgroundColor: c.surfaceLow }]}>
        {children}
      </View>
    </View>
  );
}

function Lbl({ children, colors: c }: { children: string; colors: any }) {
  return <Text style={[s.lbl, { color: c.subText }]}>{children}</Text>;
}

function SRow({ label, right, onPress, colors: c }: { label: string; right: React.ReactNode; onPress?: () => void; colors: any }) {
  return (
    <TouchableOpacity style={[s.sRow, { backgroundColor: c.card }]} onPress={onPress} disabled={!onPress} activeOpacity={onPress ? 0.7 : 1}>
      <Text style={[s.sRowLbl, { color: c.text }]}>{label}</Text>
      {right}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 28,
    fontFamily: 'PlayfairDisplay',
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  // Profile hero header
  profileHero: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
    padding: 20,
  },
  profileHeroBg: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    opacity: 0.05,
  },
  profileHeroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarText: {
    fontSize: 24,
    fontFamily: 'PlayfairDisplay',
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileHeroInfo: {
    flex: 1,
  },
  profileHeroName: {
    fontSize: 18,
    fontFamily: 'PlayfairDisplay',
    fontWeight: '700',
    marginBottom: 2,
  },
  profileHeroTagline: {
    fontSize: 12,
    fontFamily: 'DMSans',
    fontStyle: 'italic',
  },
  profileEditBtn: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexShrink: 0,
  },
  profileEditBtnText: {
    fontSize: 12,
    fontFamily: 'DMSans',
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Section
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  secHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  secIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secIcon: {
    fontSize: 16,
  },
  secTitle: {
    fontSize: 18,
    fontFamily: 'PlayfairDisplay',
    fontWeight: '700',
  },
  secCard: {
    borderRadius: 16,
    padding: 8,
    gap: 2,
  },
  lbl: {
    fontSize: 11,
    fontFamily: 'DMSans',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 5,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontFamily: 'DMSans',
    fontSize: 15,
    marginBottom: 4,
  },
  multiline: {
    minHeight: 64,
    paddingTop: 12,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    marginRight: 8,
  },
  chipTxt: {
    fontSize: 13,
    fontFamily: 'DMSans',
    fontWeight: '600',
  },
  chipTxtOn: {
    color: '#FFFFFF',
  },
  saveBtn: {
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  saveTxt: {
    color: '#FFFFFF',
    fontFamily: 'DMSans',
    fontSize: 15,
    fontWeight: '700',
  },
  // Full theme grid
  themeHint: {
    fontSize: 12,
    fontFamily: 'DMSans',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  themeGridTablet: {
    gap: 12,
  },
  themeCard: {
    width: '47%',
    height: 80,
    borderRadius: 16,
    padding: 12,
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeCardTablet: {
    width: '23%',
    height: 90,
  },
  themeCardOn: {
    borderWidth: 2,
  },
  themeLbl: {
    fontSize: 13,
    fontFamily: 'DMSans',
    fontWeight: '600',
  },
  themeDesc: {
    fontSize: 10,
    fontFamily: 'DMSans',
  },
  themeCheck: {
    fontSize: 11,
    fontFamily: 'DMSans',
  },
  sRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 2,
  },
  sRowLbl: {
    fontSize: 15,
    fontFamily: 'DMSans',
  },
  arrow: {
    fontSize: 22,
  },
  meta: {
    fontSize: 13,
    fontFamily: 'DMSans',
  },
  testBtn: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
    marginHorizontal: 4,
  },
  testTxt: {
    fontFamily: 'DMSans',
    fontSize: 13,
    fontWeight: '600',
  },
  signOutBtn: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  signOutTxt: {
    fontFamily: 'DMSans',
    fontSize: 15,
    fontWeight: '600',
  },
});
