import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { getGoogleSession, backupToGoogleDrive } from './backup';
import { isFirebaseConfigured } from './firebase';

const BACKGROUND_BACKUP_TASK = 'BACKGROUND_GOOGLE_DRIVE_BACKUP';

// 1. Define the task
TaskManager.defineTask(BACKGROUND_BACKUP_TASK, async () => {
  try {
    const session = await getGoogleSession();
    if (session && session.token) {
      console.log('[BackgroundFetch] Starting auto-backup to Google Drive...');
      await backupToGoogleDrive(session.token);
      return BackgroundFetch.BackgroundFetchResult.NewData;
    }
    return BackgroundFetch.BackgroundFetchResult.NoData;
  } catch (error) {
    console.error('[BackgroundFetch] Backup failed:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// 2. Register the task
export async function registerBackgroundBackupTask() {
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_BACKUP_TASK);
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_BACKUP_TASK, {
        minimumInterval: 60 * 60 * 24, // 24 hours in seconds
        stopOnTerminate: false, // android only
        startOnBoot: true, // android only
      });
      console.log('[BackgroundFetch] Task registered: every 24 hours');
    }
  } catch (err) {
    console.error('[BackgroundFetch] Registration failed:', err);
  }
}
