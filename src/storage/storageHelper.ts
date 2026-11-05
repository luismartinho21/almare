import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appointment, Service, StaffMember, ClientHistoryNote, BusinessConfig } from '../types';
import { INITIAL_APPOINTMENTS, INITIAL_SERVICES, INITIAL_STAFF, INITIAL_BUSINESS_CONFIG, INITIAL_ROLE_PINS } from '../constants/mockData';

const KEYS = {
  APPOINTMENTS: '@almare_appointments',
  SERVICES: '@almare_services_v3',
  SERVICES_LEGACY: '@almare_services',
  DELETED_SERVICES: '@almare_deleted_services',
  STAFF: '@almare_staff',
  CLIENT_HISTORY: '@almare_client_history',
  CONFIG: '@almare_business_config',
};

// Memory fallback store if storage fails
let memoryStore: Record<string, string> = {};

const getItem = async (key: string): Promise<string | null> => {
  try {
    const val = await AsyncStorage.getItem(key);
    if (val !== null) return val;
  } catch (err) {
    // AsyncStorage failed, fall through to window.localStorage
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const val = window.localStorage.getItem(key);
      if (val !== null) return val;
    } catch (e) {
      // LocalStorage access restricted
    }
  }
  return memoryStore[key] || null;
};

const setItem = async (key: string, value: string): Promise<void> => {
  // Always update memory store immediately
  memoryStore[key] = value;

  try {
    await AsyncStorage.setItem(key, value);
  } catch (err) {
    console.warn(`[storageHelper] AsyncStorage.setItem failed for key ${key}:`, err);
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(key, value);
    } catch (err) {
      console.warn(`[storageHelper] window.localStorage.setItem failed for key ${key}:`, err);
      // If QuotaExceededError occurs, clean legacy keys
      try {
        window.localStorage.removeItem(KEYS.SERVICES_LEGACY);
      } catch (cleanErr) {
        // ignore
      }
    }
  }
};

// --- APPOINTMENTS ---
export const loadAppointments = async (): Promise<Appointment[]> => {
  const json = await getItem(KEYS.APPOINTMENTS);
  if (!json) {
    await saveAppointments(INITIAL_APPOINTMENTS);
    return INITIAL_APPOINTMENTS;
  }
  try {
    const stored: Appointment[] = JSON.parse(json);
    const storedIds = new Set(stored.map(a => a.id));
    const missing = INITIAL_APPOINTMENTS.filter(a => !storedIds.has(a.id));
    if (missing.length > 0) {
      const merged = [...stored, ...missing];
      await saveAppointments(merged);
      return merged;
    }
    return stored;
  } catch (e) {
    return INITIAL_APPOINTMENTS;
  }
};

export const saveAppointments = async (appointments: Appointment[]): Promise<void> => {
  await setItem(KEYS.APPOINTMENTS, JSON.stringify(appointments));
};

export const addAppointment = async (appointment: Appointment): Promise<Appointment[]> => {
  const existing = await loadAppointments();
  const updated = [appointment, ...existing];
  await saveAppointments(updated);
  return updated;
};

// Track IDs of user-deleted services to prevent them from resurrecting
export const trackDeletedServiceId = async (id: string): Promise<void> => {
  try {
    const raw = await getItem(KEYS.DELETED_SERVICES);
    const set: string[] = raw ? JSON.parse(raw) : [];
    if (!set.includes(id)) {
      set.push(id);
      await setItem(KEYS.DELETED_SERVICES, JSON.stringify(set));
    }
  } catch (e) {
    // ignore
  }
};

export const getDeletedServiceIds = async (): Promise<Set<string>> => {
  try {
    const raw = await getItem(KEYS.DELETED_SERVICES);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch (e) {
    return new Set();
  }
};

// --- SERVICES ---
export const loadServices = async (): Promise<Service[]> => {
  let json = await getItem(KEYS.SERVICES);
  if (!json) {
    // Check legacy key
    json = await getItem(KEYS.SERVICES_LEGACY);
  }
  if (!json) {
    await saveServices(INITIAL_SERVICES);
    return INITIAL_SERVICES;
  }
  try {
    let stored: Service[] = JSON.parse(json);
    let changed = false;

    // Map of initial services by id
    const initialMap = new Map<string, Service>(INITIAL_SERVICES.map(s => [s.id, s]));

    // Reconcile stored services: ensure updated compatibleExtraIds and categories from INITIAL_SERVICES
    stored = stored.map(s => {
      const initial = initialMap.get(s.id);
      if (initial) {
        let itemUpdated = false;
        const newObj = { ...s };

        if (!newObj.compatibleExtraIds || newObj.compatibleExtraIds.length === 0) {
          if (initial.compatibleExtraIds && initial.compatibleExtraIds.length > 0) {
            newObj.compatibleExtraIds = initial.compatibleExtraIds;
            itemUpdated = true;
          }
        }

        if (s.branch === 'beauty' && (s.category === 'Cabelo' || s.category === 'Combos')) {
          newObj.category = initial.category;
          itemUpdated = true;
        }

        if (itemUpdated) {
          changed = true;
          return newObj;
        }
      }
      return s;
    });

    // Ensure any newly added initial services exist, BUT exclude any explicitly deleted by the user
    const deletedIds = await getDeletedServiceIds();
    const storedIds = new Set(stored.map(s => s.id));
    const missing = INITIAL_SERVICES.filter(s => !storedIds.has(s.id) && !deletedIds.has(s.id));
    if (missing.length > 0) {
      stored = [...stored, ...missing];
      changed = true;
    }

    if (changed || !(await getItem(KEYS.SERVICES))) {
      await saveServices(stored);
    }
    return stored;
  } catch (e) {
    return INITIAL_SERVICES;
  }
};

export const saveServices = async (services: Service[]): Promise<void> => {
  await setItem(KEYS.SERVICES, JSON.stringify(services));
};

// --- STAFF ---
export const loadStaff = async (): Promise<StaffMember[]> => {
  const json = await getItem(KEYS.STAFF);
  if (!json) {
    await saveStaff(INITIAL_STAFF);
    return INITIAL_STAFF;
  }
  try {
    const list: StaffMember[] = JSON.parse(json);
    let updated = false;
    const patched = list.map((s, idx) => {
      let member = { ...s };
      if (!member.pin) {
        updated = true;
        const base = member.branch === 'barber' ? 1000 : 2000;
        member.pin = String(base + idx + 1);
      }
      // Migrate default hours to 09:30/12:30 & 14:00/19:00
      if (member.workingHours?.start === '09:00' || member.workingHours?.lunchStart === '12:00') {
        updated = true;
        member.workingHours = {
          ...member.workingHours,
          start: '09:30',
          lunchStart: '12:30',
          lunchEnd: '14:00',
          end: '19:00',
        };
      }
      // Auto-heal: If member has an oversized raw base64 avatar (> 75KB), sanitize it to avoid QuotaExceededError
      if (member.avatar && member.avatar.startsWith('data:image') && member.avatar.length > 75000) {
        updated = true;
        const defaultAv =
          member.branch === 'barber'
            ? 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200'
            : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200';
        member.avatar = defaultAv;
      }
      return member;
    });
    if (updated) {
      try {
        await saveStaff(patched);
      } catch (e) {
        console.warn('Could not auto-save patched staff:', e);
      }
    }
    return patched;
  } catch (e) {
    console.error('Failed to parse staff from storage:', e);
    return INITIAL_STAFF;
  }
};

export const saveStaff = async (staff: StaffMember[]): Promise<void> => {
  await setItem(KEYS.STAFF, JSON.stringify(staff));
};

// --- CLIENT HISTORY (Staff 3 months local store) ---
export const loadClientHistory = async (): Promise<ClientHistoryNote[]> => {
  const json = await getItem(KEYS.CLIENT_HISTORY);
  if (!json) return [];
  try {
    const list: ClientHistoryNote[] = JSON.parse(json);
    // Filter history older than 90 days (3 months)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const validHistory = list.filter(item => new Date(item.date) >= ninetyDaysAgo);
    return validHistory;
  } catch (e) {
    return [];
  }
};

export const saveClientHistoryNote = async (note: ClientHistoryNote): Promise<ClientHistoryNote[]> => {
  const existing = await loadClientHistory();
  const updated = [note, ...existing];
  await setItem(KEYS.CLIENT_HISTORY, JSON.stringify(updated));
  return updated;
};

// --- BUSINESS CONFIG ---
export const loadBusinessConfig = async (): Promise<BusinessConfig> => {
  const json = await getItem(KEYS.CONFIG);
  if (!json) {
    await saveBusinessConfig(INITIAL_BUSINESS_CONFIG);
    return INITIAL_BUSINESS_CONFIG;
  }
  try {
    const parsed = JSON.parse(json);
    const updatedConfig: BusinessConfig = {
      ...INITIAL_BUSINESS_CONFIG,
      ...parsed,
      barberOpenDays: (parsed.barberOpenDays || INITIAL_BUSINESS_CONFIG.barberOpenDays).replace('09:00 - 12:00', '09:30 - 12:30'),
      beautyOpenDays: (parsed.beautyOpenDays || INITIAL_BUSINESS_CONFIG.beautyOpenDays).replace('09:00 - 12:00', '09:30 - 12:30'),
      pins: {
        ...INITIAL_ROLE_PINS,
        ...(parsed.pins || {}),
      },
    };
    return updatedConfig;
  } catch (e) {
    return INITIAL_BUSINESS_CONFIG;
  }
};

export const saveBusinessConfig = async (config: BusinessConfig): Promise<void> => {
  await setItem(KEYS.CONFIG, JSON.stringify(config));
};
