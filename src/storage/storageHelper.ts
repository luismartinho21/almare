import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appointment, Service, StaffMember, ClientHistoryNote, BusinessConfig } from '../types';
import { INITIAL_APPOINTMENTS, INITIAL_SERVICES, INITIAL_STAFF, INITIAL_BUSINESS_CONFIG } from '../constants/mockData';

const KEYS = {
  APPOINTMENTS: '@almare_appointments',
  SERVICES: '@almare_services',
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
    return memoryStore[key] || null;
  } catch (err) {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return memoryStore[key] || null;
  }
};

const setItem = async (key: string, value: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (err) {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
    memoryStore[key] = value;
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
    return JSON.parse(json);
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

// --- SERVICES ---
export const loadServices = async (): Promise<Service[]> => {
  const json = await getItem(KEYS.SERVICES);
  if (!json) {
    await saveServices(INITIAL_SERVICES);
    return INITIAL_SERVICES;
  }
  try {
    const stored: Service[] = JSON.parse(json);
    // Ensure any newly added initial services (like extras) exist
    const storedIds = new Set(stored.map(s => s.id));
    const missing = INITIAL_SERVICES.filter(s => !storedIds.has(s.id));
    if (missing.length > 0) {
      const merged = [...stored, ...missing];
      await saveServices(merged);
      return merged;
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
    return JSON.parse(json);
  } catch (e) {
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
    return JSON.parse(json);
  } catch (e) {
    return INITIAL_BUSINESS_CONFIG;
  }
};

export const saveBusinessConfig = async (config: BusinessConfig): Promise<void> => {
  await setItem(KEYS.CONFIG, JSON.stringify(config));
};
