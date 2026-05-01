/**
 * ProfileContext — singleton shared state for business profile.
 * Wraps the app at the root level so every screen sees the same
 * profile and mutations are instantly reflected everywhere.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { getLocalProfile, saveLocalProfile } from '../lib/localStore';
import { DEFAULT_BUSINESS_PROFILE } from '../types';
import type { BusinessProfile } from '../types';

interface ProfileContextValue {
  profile: BusinessProfile;
  loading: boolean;
  saveProfile: (updates: Partial<BusinessProfile>) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<BusinessProfile>(DEFAULT_BUSINESS_PROFILE);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!isFirebaseConfigured) {
      getLocalOrdersProfile();
      return;
    }

    if (!user) {
      setProfile(DEFAULT_BUSINESS_PROFILE);
      setLoading(false);
      return;
    }

    const docRef = doc(db, 'users', user.uid, 'settings', 'profile');
    const unsubscribe = onSnapshot(
      docRef,
      (snap) => {
        if (snap.exists()) {
          setProfile({ ...DEFAULT_BUSINESS_PROFILE, ...(snap.data() as Partial<BusinessProfile>) });
        }
        setLoading(false);
      },
      () => {
        getLocalOrdersProfile();
      }
    );
    return unsubscribe;
  }, [user]);

  const getLocalOrdersProfile = async () => {
    const p = await getLocalProfile();
    setProfile(p);
    setLoading(false);
  };

  const saveProfile = useCallback(
    async (updates: Partial<BusinessProfile>): Promise<void> => {
      const next = { ...profile, ...updates };
      setProfile(next);
      await saveLocalProfile(next);
      if (isFirebaseConfigured && user) {
        await setDoc(doc(db, 'users', user.uid, 'settings', 'profile'), next, { merge: true });
      }
    },
    [profile, user]
  );

  return (
    <ProfileContext.Provider value={{ profile, loading, saveProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfileContext() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfileContext must be used inside <ProfileProvider>');
  return ctx;
}
