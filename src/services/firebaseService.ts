import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  Unsubscribe,
} from 'firebase/firestore';
import {
  FirebaseCredentials,
  DEFAULT_FIREBASE_CONFIG,
  loadStoredFirebaseConfig,
  isFirebaseConfigured,
} from '../config/firebaseConfig';
import { Appointment, Service, StaffMember, BusinessConfig, ClientHistoryNote } from '../types';
import {
  saveAppointments,
  saveServices,
  saveStaff,
  saveBusinessConfig,
} from '../storage/storageHelper';

let appInstance: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;
let activeConfig: FirebaseCredentials = DEFAULT_FIREBASE_CONFIG;
let isConnected = false;

// Callbacks for real-time status updates
type ConnectionStatusCallback = (status: { connected: boolean; projectId: string }) => void;
const statusListeners = new Set<ConnectionStatusCallback>();

export const onCloudStatusChange = (cb: ConnectionStatusCallback) => {
  statusListeners.add(cb);
  cb({ connected: isConnected, projectId: activeConfig.projectId });
  return () => {
    statusListeners.delete(cb);
  };
};

const notifyStatus = () => {
  statusListeners.forEach(cb => cb({ connected: isConnected, projectId: activeConfig.projectId }));
};

/**
 * Initializes Firebase using stored credentials or default config.
 */
export const initFirebaseCloud = async (): Promise<boolean> => {
  try {
    const creds = await loadStoredFirebaseConfig();
    activeConfig = creds;

    if (!isFirebaseConfigured(creds)) {
      isConnected = false;
      notifyStatus();
      return false;
    }

    if (!getApps().length) {
      appInstance = initializeApp(creds);
    } else {
      appInstance = getApp();
    }

    dbInstance = getFirestore(appInstance);
    isConnected = true;
    notifyStatus();
    return true;
  } catch (err) {
    console.warn('[Firebase Cloud] Initialization error:', err);
    isConnected = false;
    notifyStatus();
    return false;
  }
};

export const getIsCloudConnected = (): boolean => isConnected;
export const getActiveCloudConfig = (): FirebaseCredentials => activeConfig;

// =========================================================================
// REAL-TIME FIRESTORE SUBSCRIPTIONS
// =========================================================================

/**
 * Subscribes in real-time to Appointments collection.
 * Any change on mobile or PC triggers this listener immediately (<1s).
 */
export const subscribeToCloudAppointments = (
  onData: (appointments: Appointment[]) => void,
  initialLocal: Appointment[]
): Unsubscribe | null => {
  if (!dbInstance || !isConnected) return null;

  try {
    const colRef = collection(dbInstance, 'appointments');
    const unsub = onSnapshot(
      colRef,
      async snapshot => {
        if (snapshot.empty && initialLocal.length > 0) {
          // Cloud collection is empty: Seed from local initial appointments
          for (const item of initialLocal) {
            await setDoc(doc(dbInstance!, 'appointments', item.id), item);
          }
          return;
        }

        const items: Appointment[] = [];
        snapshot.forEach(docSnap => {
          items.push(docSnap.data() as Appointment);
        });

        // Sort appointments descending by date / time
        items.sort((a, b) => (b.date + b.timeSlot).localeCompare(a.date + a.timeSlot));

        // Save to local backup storage
        await saveAppointments(items);
        onData(items);
      },
      err => {
        console.warn('[Firebase Cloud] appointments listener error:', err);
      }
    );
    return unsub;
  } catch (e) {
    console.error('[Firebase Cloud] Failed to subscribe to appointments:', e);
    return null;
  }
};

/**
 * Subscribes in real-time to Services & Extras collection.
 */
export const subscribeToCloudServices = (
  onData: (services: Service[]) => void,
  initialLocal: Service[]
): Unsubscribe | null => {
  if (!dbInstance || !isConnected) return null;

  try {
    const colRef = collection(dbInstance, 'services');
    const unsub = onSnapshot(
      colRef,
      async snapshot => {
        if (snapshot.empty && initialLocal.length > 0) {
          // Cloud is empty: Seed from local services
          for (const s of initialLocal) {
            await setDoc(doc(dbInstance!, 'services', s.id), s);
          }
          return;
        }

        const items: Service[] = [];
        snapshot.forEach(docSnap => {
          items.push(docSnap.data() as Service);
        });

        await saveServices(items);
        onData(items);
      },
      err => {
        console.warn('[Firebase Cloud] services listener error:', err);
      }
    );
    return unsub;
  } catch (e) {
    console.error('[Firebase Cloud] Failed to subscribe to services:', e);
    return null;
  }
};

/**
 * Subscribes in real-time to Staff collection.
 */
export const subscribeToCloudStaff = (
  onData: (staff: StaffMember[]) => void,
  initialLocal: StaffMember[]
): Unsubscribe | null => {
  if (!dbInstance || !isConnected) return null;

  try {
    const colRef = collection(dbInstance, 'staff');
    const unsub = onSnapshot(
      colRef,
      async snapshot => {
        if (snapshot.empty && initialLocal.length > 0) {
          // Cloud is empty: Seed from local staff
          for (const m of initialLocal) {
            await setDoc(doc(dbInstance!, 'staff', m.id), m);
          }
          return;
        }

        const items: StaffMember[] = [];
        snapshot.forEach(docSnap => {
          items.push(docSnap.data() as StaffMember);
        });

        await saveStaff(items);
        onData(items);
      },
      err => {
        console.warn('[Firebase Cloud] staff listener error:', err);
      }
    );
    return unsub;
  } catch (e) {
    console.error('[Firebase Cloud] Failed to subscribe to staff:', e);
    return null;
  }
};

/**
 * Subscribes in real-time to Business Configuration document.
 */
export const subscribeToCloudConfig = (
  onData: (config: BusinessConfig) => void,
  initialLocal: BusinessConfig
): Unsubscribe | null => {
  if (!dbInstance || !isConnected) return null;

  try {
    const docRef = doc(dbInstance, 'settings', 'businessConfig');
    const unsub = onSnapshot(
      docRef,
      async docSnap => {
        if (!docSnap.exists()) {
          // Seed initial config to cloud
          await setDoc(docRef, initialLocal);
          return;
        }

        const conf = docSnap.data() as BusinessConfig;
        await saveBusinessConfig(conf);
        onData(conf);
      },
      err => {
        console.warn('[Firebase Cloud] config listener error:', err);
      }
    );
    return unsub;
  } catch (e) {
    console.error('[Firebase Cloud] Failed to subscribe to config:', e);
    return null;
  }
};

// =========================================================================
// CLOUD MUTATION HELPERS
// =========================================================================

export const cloudSaveAppointment = async (appointment: Appointment): Promise<void> => {
  if (!dbInstance || !isConnected) return;
  try {
    await setDoc(doc(dbInstance, 'appointments', appointment.id), appointment);
  } catch (e) {
    console.warn('[Firebase Cloud] Failed to save appointment to cloud:', e);
  }
};

export const cloudSaveService = async (service: Service): Promise<void> => {
  if (!dbInstance || !isConnected) return;
  try {
    await setDoc(doc(dbInstance, 'services', service.id), service);
  } catch (e) {
    console.warn('[Firebase Cloud] Failed to save service to cloud:', e);
  }
};

export const cloudDeleteService = async (id: string): Promise<void> => {
  if (!dbInstance || !isConnected) return;
  try {
    await deleteDoc(doc(dbInstance, 'services', id));
  } catch (e) {
    console.warn('[Firebase Cloud] Failed to delete service from cloud:', e);
  }
};

export const cloudSaveStaffMember = async (member: StaffMember): Promise<void> => {
  if (!dbInstance || !isConnected) return;
  try {
    await setDoc(doc(dbInstance, 'staff', member.id), member);
  } catch (e) {
    console.warn('[Firebase Cloud] Failed to save staff to cloud:', e);
  }
};

export const cloudDeleteStaffMember = async (id: string): Promise<void> => {
  if (!dbInstance || !isConnected) return;
  try {
    await deleteDoc(doc(dbInstance, 'staff', id));
  } catch (e) {
    console.warn('[Firebase Cloud] Failed to delete staff from cloud:', e);
  }
};

export const cloudSaveConfig = async (config: BusinessConfig): Promise<void> => {
  if (!dbInstance || !isConnected) return;
  try {
    await setDoc(doc(dbInstance, 'settings', 'businessConfig'), config);
  } catch (e) {
    console.warn('[Firebase Cloud] Failed to save config to cloud:', e);
  }
};

/**
 * Seeds all local data up to Firestore immediately (One-click Cloud Sync).
 */
export const syncAllLocalToCloud = async (
  appointments: Appointment[],
  services: Service[],
  staff: StaffMember[],
  config: BusinessConfig
): Promise<{ success: boolean; count: number; error?: string }> => {
  if (!dbInstance || !isConnected) {
    return { success: false, count: 0, error: 'Firebase não está conectado ou configurado.' };
  }

  try {
    let count = 0;
    for (const a of appointments) {
      await setDoc(doc(dbInstance, 'appointments', a.id), a);
      count++;
    }
    for (const s of services) {
      await setDoc(doc(dbInstance, 'services', s.id), s);
      count++;
    }
    for (const st of staff) {
      await setDoc(doc(dbInstance, 'staff', st.id), st);
      count++;
    }
    await setDoc(doc(dbInstance, 'settings', 'businessConfig'), config);
    count++;

    return { success: true, count };
  } catch (e: any) {
    return { success: false, count: 0, error: e?.message || 'Erro ao sincronizar com a nuvem' };
  }
};
