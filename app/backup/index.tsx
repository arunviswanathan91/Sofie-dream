/**
 * Data Backup screen.
 *
 * Three backup destinations:
 *   1. Local  — export .json to phone, import from file (no login needed)
 *   2. Google Drive — OAuth via expo-auth-session, stores in AppDataFolder
 *   3. Microsoft OneDrive — OAuth via expo-auth-session, stores in AppFolder
 *
 * OAuth client IDs must be set in .env:
 *   EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB        (Web OAuth 2.0 client, add sofi-dream://auth as redirect)
 *   EXPO_PUBLIC_MICROSOFT_CLIENT_ID         (Azure app registration client ID)
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Switch,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
// FIX: Only import the main package — do NOT use 'expo-auth-session/providers/google'
// because Metro bundler does not reliably resolve package subpath exports in production.
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { useTheme } from '../../context/ThemeContext';
import type { ThemeColors } from '../../context/ThemeContext';
import { Spacing, BorderRadius } from '../../lib/theme';
import {
  GOOGLE_CLIENT_ID_WEB, MICROSOFT_CLIENT_ID,
  exportLocalBackup, importLocalBackup, getLastLocalBackupDate,
  saveGoogleSession, getGoogleSession, clearGoogleSession,
  fetchGoogleUserInfo, backupToGoogleDrive, restoreFromGoogleDrive, getLastGDriveDate,
  saveMicrosoftSession, getMicrosoftSession, clearMicrosoftSession,
  fetchMicrosoftUserInfo, backupToOneDrive, restoreFromOneDrive, getLastOneDriveDate,
  formatBackupDate,
} from '../../lib/backup';
import {
  registerDailyBackup,
  unregisterDailyBackup,
  isDailyBackupEnabled,
} from '../../lib/autoBackup';

// ─── OAuth Discovery Documents ────────────────────────────────────────────────
const GOOGLE_DISCOVERY: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

const MS_DISCOVERY: AuthSession.DiscoveryDocument = {
  authorizationEndpoint:
    'https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize',
  tokenEndpoint:
    'https://login.microsoftonline.com/consumers/oauth2/v2.0/token',
};

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function BackupScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  // FIX: maybeCompleteAuthSession must run inside a React lifecycle, not at module level
  useEffect(() => {
    WebBrowser.maybeCompleteAuthSession();
  }, []);

  const [lastLocal, setLastLocal] = useState<string | null>(null);
  const [lastGDrive, setLastGDrive] = useState<string | null>(null);
  const [lastOneDrive, setLastOneDrive] = useState<string | null>(null);
  const [busyLocal, setBusyLocal] = useState<'export' | 'import' | null>(null);

  useEffect(() => {
    (async () => {
      const [local, gdrive, onedrive] = await Promise.all([
        getLastLocalBackupDate(),
        getLastGDriveDate(),
        getLastOneDriveDate(),
      ]);
      setLastLocal(local);
      setLastGDrive(gdrive);
      setLastOneDrive(onedrive);
    })();
  }, []);

  const handleLocalExport = useCallback(async () => {
    setBusyLocal('export');
    try {
      await exportLocalBackup();
      setLastLocal(await getLastLocalBackupDate());
    } catch (e: any) {
      if (e.message !== 'cancelled') Alert.alert('Export failed', e.message);
    } finally {
      setBusyLocal(null);
    }
  }, []);

  const handleLocalImport = useCallback(async () => {
    Alert.alert(
      'Restore from file',
      'This will replace all current data with the backup. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore', style: 'destructive',
          onPress: async () => {
            setBusyLocal('import');
            try {
              const { count } = await importLocalBackup();
              Alert.alert('Restored', `${count} orders loaded from backup.`);
            } catch (e: any) {
              if (e.message !== 'cancelled') Alert.alert('Restore failed', e.message);
            } finally {
              setBusyLocal(null);
            }
          },
        },
      ],
    );
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.bg }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[s.backPill, { backgroundColor: colors.surfaceContainer }]}
        >
          <Text style={[s.backTxt, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[s.title, { color: colors.text }]}>Data Backup</Text>
        <View style={{ width: 72 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ── Local Backup ───────────────────────────────────────────────── */}
        <Section label="Local Backup" colors={colors}>
          <Text style={[s.sectionNote, { color: colors.subText }]}>
            Save a backup file to your phone. Restore it any time, or copy it
            to any cloud storage manually.
          </Text>
          <ActionRow
            icon="💾" title="Export to Phone"
            subtitle="Creates sofie-backup-YYYY-MM-DD.json"
            loading={busyLocal === 'export'}
            onPress={handleLocalExport}
            buttonLabel="Export"
            colors={colors}
          />
          <ActionRow
            icon="📂" title="Restore from File"
            subtitle="Pick a previously exported backup"
            loading={busyLocal === 'import'}
            onPress={handleLocalImport}
            buttonLabel="Restore"
            destructive
            colors={colors}
          />
          <LastBackupBadge label="Last local backup" date={lastLocal} colors={colors} />
        </Section>

        {/* ── Google Drive ────────────────────────────────────────────────── */}
        {/* FIX: GoogleSection is a separate component that owns its own hook. */}
        <GoogleSection
          colors={colors}
          lastGDrive={lastGDrive}
          onLastGDriveChange={setLastGDrive}
        />

        {/* ── Microsoft OneDrive ──────────────────────────────────────────── */}
        <OneDriveSection
          colors={colors}
          lastOneDrive={lastOneDrive}
          onLastOneDriveChange={setLastOneDrive}
        />

        <Text style={[s.privacyNote, { color: colors.subText }]}>
          Cloud backups use app-specific private folders. Google Drive stores
          files in AppDataFolder (not visible in Drive UI). OneDrive stores
          files in Apps/Sofi Dream. No other files are ever accessed.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Google Drive section (owns its own useAuthRequest hook) ──────────────────
function GoogleSection({
  colors, lastGDrive, onLastGDriveChange,
}: { colors: ThemeColors; lastGDrive: string | null; onLastGDriveChange: (d: string | null) => void }) {
  const [googleUser, setGoogleUser] = useState<string | null>(null);
  const [busy, setBusy] = useState<'backup' | 'restore' | null>(null);
  const [autoBackup, setAutoBackup] = useState(false);

  const redirectUri = useMemo(
    () => AuthSession.makeRedirectUri({ scheme: 'sofi-dream', path: 'auth' }),
    [],
  );

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID_WEB,
      scopes: ['profile', 'email', 'https://www.googleapis.com/auth/drive.appdata'],
      redirectUri,
      responseType: AuthSession.ResponseType.Token,
      usePKCE: false,
    },
    // Always pass the discovery document — if the client ID was missing at
    // bundle time (e.g. release APK built without env vars loaded) the sign-in
    // button still renders and the error surfaces at auth time, not at startup.
    GOOGLE_DISCOVERY,
  );

  useEffect(() => {
    getGoogleSession().then((s) => { if (s) setGoogleUser(s.email); });
    isDailyBackupEnabled().then(setAutoBackup);
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      const token = response.authentication?.accessToken ?? response.params?.access_token;
      if (!token) return;
      (async () => {
        try {
          const email = await fetchGoogleUserInfo(token);
          await saveGoogleSession(token, email);
          setGoogleUser(email);
        } catch {
          Alert.alert('Google Sign-in', 'Signed in but could not fetch account info.');
        }
      })();
    } else if (response?.type === 'error') {
      Alert.alert('Google Sign-in failed', response.error?.message ?? 'Unknown error');
    }
  }, [response]);

  const handleBackup = useCallback(async () => {
    const session = await getGoogleSession();
    if (!session) return;
    setBusy('backup');
    try {
      await backupToGoogleDrive(session.token);
      const date = await getLastGDriveDate();
      onLastGDriveChange(date);
      Alert.alert('Backed up', 'Your data is saved to Google Drive.');
    } catch (e: any) { Alert.alert('Google Drive backup failed', e.message); }
    finally { setBusy(null); }
  }, [onLastGDriveChange]);

  const handleRestore = useCallback(async () => {
    const session = await getGoogleSession();
    if (!session) return;
    Alert.alert('Restore from Google Drive',
      'This will replace all current data with the Drive backup. Continue?',
      [{ text: 'Cancel', style: 'cancel' },
       { text: 'Restore', style: 'destructive', onPress: async () => {
          setBusy('restore');
          try {
            const { count } = await restoreFromGoogleDrive(session.token);
            Alert.alert('Restored', `${count} orders loaded from Google Drive.`);
          } catch (e: any) { Alert.alert('Restore failed', e.message); }
          finally { setBusy(null); }
       }}]);
  }, []);

  const handleSignOut = useCallback(async () => {
    await unregisterDailyBackup();
    setAutoBackup(false);
    await clearGoogleSession();
    setGoogleUser(null);
  }, []);

  const handleAutoBackupToggle = useCallback(async (value: boolean) => {
    setAutoBackup(value);
    if (value) {
      await registerDailyBackup();
    } else {
      await unregisterDailyBackup();
    }
  }, []);

  return (
    <Section label="Google Drive" colors={colors}>
      {googleUser ? (
        <>
          <SignedInBadge email={googleUser} onSignOut={handleSignOut} colors={colors} />
          <ActionRow
            icon="☁️" title="Backup to Drive"
            subtitle="Saves to private AppDataFolder"
            loading={busy === 'backup'}
            onPress={handleBackup}
            buttonLabel="Backup"
            colors={colors}
          />
          <ActionRow
            icon="⬇️" title="Restore from Drive"
            subtitle="Overwrites current data"
            loading={busy === 'restore'}
            onPress={handleRestore}
            buttonLabel="Restore"
            destructive
            colors={colors}
          />
          <AutoBackupRow
            enabled={autoBackup}
            onToggle={handleAutoBackupToggle}
            colors={colors}
          />
          <LastBackupBadge label="Last Drive backup" date={lastGDrive} colors={colors} />
        </>
      ) : (
        <SignInButton
          label="Sign in with Google"
          icon="G"
          iconColor="#EA4335"
          loading={!request}
          onPress={() => promptAsync()}
          colors={colors}
        />
      )}
    </Section>
  );
}

// ─── OneDrive section (owns its own useAuthRequest hook) ──────────────────────
function OneDriveSection({
  colors, lastOneDrive, onLastOneDriveChange,
}: { colors: ThemeColors; lastOneDrive: string | null; onLastOneDriveChange: (d: string | null) => void }) {
  const [msUser, setMsUser] = useState<string | null>(null);
  const [busy, setBusy] = useState<'backup' | 'restore' | null>(null);

  const redirectUri = useMemo(
    () => AuthSession.makeRedirectUri({ scheme: 'sofi-dream', path: 'auth' }),
    [],
  );

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: MICROSOFT_CLIENT_ID || 'unconfigured',
      scopes: ['openid', 'profile', 'email', 'offline_access', 'files.readwrite.appfolder'],
      redirectUri,
      usePKCE: true,
    },
    MICROSOFT_CLIENT_ID ? MS_DISCOVERY : null,
  );

  useEffect(() => {
    getMicrosoftSession().then((s) => { if (s) setMsUser(s.email); });
  }, []);

  useEffect(() => {
    if (response?.type === 'success' && request) {
      (async () => {
        try {
          const tokenRes = await AuthSession.exchangeCodeAsync(
            {
              clientId: MICROSOFT_CLIENT_ID,
              code: response.params.code,
              redirectUri,
              extraParams: { code_verifier: request.codeVerifier ?? '' },
            },
            MS_DISCOVERY,
          );
          const email = await fetchMicrosoftUserInfo(tokenRes.accessToken);
          await saveMicrosoftSession(tokenRes.accessToken, email);
          setMsUser(email);
        } catch (e: any) {
          Alert.alert('Microsoft Sign-in failed', e.message ?? 'Unknown error');
        }
      })();
    } else if (response?.type === 'error') {
      Alert.alert('Microsoft Sign-in failed', response.error?.message ?? 'Unknown error');
    }
  }, [response]);

  const handleBackup = useCallback(async () => {
    const session = await getMicrosoftSession();
    if (!session) return;
    setBusy('backup');
    try {
      await backupToOneDrive(session.token);
      const date = await getLastOneDriveDate();
      onLastOneDriveChange(date);
      Alert.alert('Backed up', 'Your data is saved to OneDrive.');
    } catch (e: any) { Alert.alert('OneDrive backup failed', e.message); }
    finally { setBusy(null); }
  }, [onLastOneDriveChange]);

  const handleRestore = useCallback(async () => {
    const session = await getMicrosoftSession();
    if (!session) return;
    Alert.alert('Restore from OneDrive',
      'This will replace all current data with the OneDrive backup. Continue?',
      [{ text: 'Cancel', style: 'cancel' },
       { text: 'Restore', style: 'destructive', onPress: async () => {
          setBusy('restore');
          try {
            const { count } = await restoreFromOneDrive(session.token);
            Alert.alert('Restored', `${count} orders loaded from OneDrive.`);
          } catch (e: any) { Alert.alert('Restore failed', e.message); }
          finally { setBusy(null); }
       }}]);
  }, []);

  const handleSignOut = useCallback(async () => {
    await clearMicrosoftSession();
    setMsUser(null);
  }, []);

  return (
    <Section label="Microsoft OneDrive" colors={colors}>
      {!MICROSOFT_CLIENT_ID ? (
        <ConfigNote
          text="Set EXPO_PUBLIC_MICROSOFT_CLIENT_ID in your .env to enable OneDrive backup. Register an app in Azure Portal and add sofi-dream://auth as a redirect URI."
          colors={colors}
        />
      ) : msUser ? (
        <>
          <SignedInBadge email={msUser} onSignOut={handleSignOut} colors={colors} />
          <ActionRow
            icon="☁️" title="Backup to OneDrive"
            subtitle="Saves to private AppFolder"
            loading={busy === 'backup'}
            onPress={handleBackup}
            buttonLabel="Backup"
            colors={colors}
          />
          <ActionRow
            icon="⬇️" title="Restore from OneDrive"
            subtitle="Overwrites current data"
            loading={busy === 'restore'}
            onPress={handleRestore}
            buttonLabel="Restore"
            destructive
            colors={colors}
          />
          <LastBackupBadge label="Last OneDrive backup" date={lastOneDrive} colors={colors} />
        </>
      ) : (
        <SignInButton
          label="Sign in with Microsoft"
          icon="M"
          iconColor="#00A4EF"
          loading={!request}
          onPress={() => promptAsync()}
          colors={colors}
        />
      )}
    </Section>
  );
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function Section({ label, children, colors }: { label: string; children: React.ReactNode; colors: ThemeColors }) {
  return (
    <View style={s.section}>
      <Text style={[s.secLabel, { color: colors.text }]}>{label}</Text>
      <View style={[s.card, { backgroundColor: colors.surfaceLowest }]}>
        {children}
      </View>
    </View>
  );
}

function ActionRow({ icon, title, subtitle, loading, onPress, buttonLabel, destructive, colors }: {
  icon: string; title: string; subtitle: string;
  loading: boolean; onPress: () => void; buttonLabel: string;
  destructive?: boolean; colors: ThemeColors;
}) {
  return (
    <View style={[s.actionRow, { borderTopColor: colors.outlineVariant }]}>
      <Text style={s.actionIcon}>{icon}</Text>
      <View style={s.actionText}>
        <Text style={[s.actionTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[s.actionSub, { color: colors.subText }]}>{subtitle}</Text>
      </View>
      <TouchableOpacity
        onPress={onPress}
        disabled={loading}
        style={[
          s.actionBtn,
          { backgroundColor: destructive ? colors.surfaceHigh : colors.primaryContainer },
          loading && { opacity: 0.5 },
        ]}
      >
        {loading
          ? <ActivityIndicator color={colors.onPrimary} size="small" />
          : <Text style={[s.actionBtnTxt, { color: destructive ? colors.subText : colors.onPrimary }]}>
              {buttonLabel}
            </Text>}
      </TouchableOpacity>
    </View>
  );
}

function AutoBackupRow({ enabled, onToggle, colors }: {
  enabled: boolean; onToggle: (v: boolean) => void; colors: ThemeColors;
}) {
  return (
    <View style={[s.actionRow, { borderTopColor: colors.outlineVariant }]}>
      <Text style={s.actionIcon}>🔄</Text>
      <View style={s.actionText}>
        <Text style={[s.actionTitle, { color: colors.text }]}>Auto Daily Backup</Text>
        <Text style={[s.actionSub, { color: colors.subText }]}>Backs up automatically every day</Text>
      </View>
      <Switch
        value={enabled}
        onValueChange={onToggle}
        trackColor={{ false: colors.outlineVariant, true: colors.primary }}
        thumbColor={colors.onPrimary}
      />
    </View>
  );
}

function SignInButton({ label, icon, iconColor, loading, onPress, colors }: {
  label: string; icon: string; iconColor: string;
  loading: boolean; onPress: () => void; colors: ThemeColors;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      style={[s.signInBtn, { backgroundColor: colors.surfaceContainer }]}
      activeOpacity={0.75}
    >
      <Text style={[s.signInIcon, { color: iconColor }]}>{icon}</Text>
      <Text style={[s.signInLabel, { color: colors.text }]}>{label}</Text>
      {loading && (
        <ActivityIndicator color={colors.subText} size="small" style={{ marginLeft: 8 }} />
      )}
    </TouchableOpacity>
  );
}

function SignedInBadge({ email, onSignOut, colors }: {
  email: string; onSignOut: () => void; colors: ThemeColors;
}) {
  return (
    <View style={[s.signedRow, { borderBottomColor: colors.outlineVariant }]}>
      <Text style={[s.checkmark, { color: colors.primary }]}>✓</Text>
      <Text style={[s.signedEmail, { color: colors.text }]} numberOfLines={1}>{email}</Text>
      <TouchableOpacity
        onPress={onSignOut}
        style={[s.signOutBtn, { backgroundColor: colors.error + '18' }]}
      >
        <Text style={[s.signOutTxt, { color: colors.error }]}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

function LastBackupBadge({ label, date, colors }: { label: string; date: string | null; colors: ThemeColors }) {
  return (
    <Text style={[s.lastDate, { color: colors.subText }]}>
      {label}: {formatBackupDate(date)}
    </Text>
  );
}

function ConfigNote({ text, colors }: { text: string; colors: ThemeColors }) {
  return (
    <View style={[s.configNote, { backgroundColor: colors.surfaceLow }]}>
      <Text style={s.configNoteIcon}>⚙️</Text>
      <Text style={[s.configNoteTxt, { color: colors.subText }]}>{text}</Text>
    </View>
  );
}

// ─── Static styles (layout only — colors are applied inline) ──────────────────
const s = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: 12,
  },
  backPill: {
    borderRadius: BorderRadius.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  backTxt: { fontSize: 13, fontFamily: 'DMSans', fontWeight: '600' },
  title: { fontSize: 20, fontFamily: 'PlayfairDisplay', fontWeight: '700', textAlign: 'center' },

  scroll: { paddingBottom: 48 },

  section: { paddingHorizontal: Spacing.md, marginTop: Spacing.lg },
  secLabel: {
    fontSize: 20,
    fontFamily: 'PlayfairDisplay',
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  card: {
    borderRadius: BorderRadius.card,
    overflow: 'hidden',
    shadowColor: 'rgba(0,0,0,0.03)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },

  sectionNote: {
    fontSize: 13,
    fontFamily: 'DMSans',
    lineHeight: 19,
    padding: Spacing.md,
  },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionIcon: { fontSize: 22, marginRight: 12 },
  actionText: { flex: 1 },
  actionTitle: { fontSize: 14, fontFamily: 'DMSans', fontWeight: '600' },
  actionSub: { fontSize: 12, fontFamily: 'DMSans', marginTop: 2 },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.pill,
    minWidth: 72,
    alignItems: 'center',
  },
  actionBtnTxt: { fontFamily: 'DMSans', fontSize: 13, fontWeight: '700' },

  signInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: Spacing.md,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.pill,
  },
  signInIcon: { fontSize: 18, fontWeight: '700', marginRight: 10, fontFamily: 'DMMono' },
  signInLabel: { fontSize: 15, fontFamily: 'DMSans', fontWeight: '600' },

  signedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  checkmark: { fontSize: 16, marginRight: 8 },
  signedEmail: { flex: 1, fontSize: 13, fontFamily: 'DMSans' },
  signOutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.pill,
  },
  signOutTxt: { fontSize: 12, fontFamily: 'DMSans', fontWeight: '700' },

  lastDate: {
    fontSize: 11,
    fontFamily: 'DMMono',
    padding: Spacing.md,
    paddingTop: 8,
  },

  configNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    margin: Spacing.md,
    padding: 12,
    borderRadius: BorderRadius.card,
  },
  configNoteIcon: { fontSize: 16, marginRight: 8, marginTop: 1 },
  configNoteTxt: { flex: 1, fontSize: 12, fontFamily: 'DMSans', lineHeight: 18 },

  privacyNote: {
    fontSize: 11,
    fontFamily: 'DMSans',
    lineHeight: 17,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
});
