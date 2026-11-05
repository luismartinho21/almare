import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FirebaseCredentials {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

const STORAGE_KEY = '@almare_cloud_firebase_config';

/**
 * Default Firebase Project configuration.
 * You can paste your Firebase Console Web configuration here,
 * or configure it directly in the Admin Panel inside the App.
 */
export const DEFAULT_FIREBASE_CONFIG: FirebaseCredentials = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: '',
};

export const loadStoredFirebaseConfig = async (): Promise<FirebaseCredentials> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.projectId && parsed.apiKey) {
        return parsed;
      }
    }
  } catch (e) {
    // ignore
  }
  return DEFAULT_FIREBASE_CONFIG;
};

export const saveStoredFirebaseConfig = async (config: FirebaseCredentials): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save Firebase credentials to storage:', e);
  }
};

export const isFirebaseConfigured = (config: FirebaseCredentials): boolean => {
  return Boolean(
    config.apiKey &&
    config.projectId &&
    config.apiKey.length > 5 &&
    config.projectId.length > 2
  );
};
