/**
 * Auto-backup — registers a daily background task that uploads to Google Drive.
 *
 * The background task runs once every 24 h (subject to OS battery/power policies).
 * If Google Drive is not configured / user is not signed in, the task silently exits.
 */
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getGoogleSession, backupToGoogleDrive } from './backup';

const TASK_NAME = 'SOFI_DAILY_BACKUP';
const KEY_ENABLED = 'sofi:bak:auto_enabled';

// ─── Task definition (must run at module load time, outside components) ───────
TaskManager.defineTask(TASK_NAME, async () => {
  try {
    const session = await getGoogleSession();
    if (!session) return BackgroundFetch.BackgroundFetchResult.NoData;
    await backupToGoogleDrive(session.token);
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (err) {
    console.warn('[AutoBackup] Daily backup failed:', err);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// ─── Public API ───────────────────────────────────────────────────────────────

export async function isDailyBackupEnabled(): Promise<boolean> {
  const val = await AsyncStorage.getItem(KEY_ENABLED);
  return val === 'true';
}

export async function registerDailyBackup(): Promise<void> {
  await BackgroundFetch.registerTaskAsync(TASK_NAME, {
    minimumInterval: 86400, // 24 hours in seconds
    stopOnTerminate: false,
    startOnBoot: true,
  });
  await AsyncStorage.setItem(KEY_ENABLED, 'true');
}

export async function unregisterDailyBackup(): Promise<void> {
  try {
    await BackgroundFetch.unregisterTaskAsync(TASK_NAME);
  } catch {
    // Task may not be registered — ignore
  }
  await AsyncStorage.setItem(KEY_ENABLED, 'false');
}
