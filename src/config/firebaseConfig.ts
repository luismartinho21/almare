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
 * Credenciais definitivas de Produção do projeto Firebase Firestore (Almare).
 * A aplicação arranca automaticamente ligada a esta base de dados em todos
 * os telemóveis e computadores sem necessidade de configuração manual.
 */
export const DEFAULT_FIREBASE_CONFIG: FirebaseCredentials = {
  apiKey: 'AIzaSyBmW_MhPT22CWpXvQMw-S8fYLjnWUzJuIw',
  authDomain: 'almare-553e8.firebaseapp.com',
  projectId: 'almare-553e8',
  storageBucket: 'almare-553e8.firebasestorage.app',
  messagingSenderId: '982086416122',
  appId: '1:982086416122:web:47ed6463999ae67337fb43',
};

/**
 * Regras de Segurança do Firestore para Produção (substitui o Modo de Teste de 30 dias).
 * Garante acesso exclusivo e validado às coleções: appointments, services, staff e settings.
 */
export const PRODUCTION_FIRESTORE_RULES = `rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function isValidBranch(branch) {
      return branch is string && (branch == 'barber' || branch == 'beauty');
    }

    function isValidAppointmentStatus(status) {
      return status is string && (
        status == 'confirmed' ||
        status == 'completed' ||
        status == 'cancelled'
      );
    }

    function isValidAppointment(data, docId) {
      return data.keys().hasAll([
          'id', 'branch', 'clientName', 'clientPhone',
          'serviceId', 'serviceName', 'servicePrice', 'serviceDuration',
          'staffId', 'staffName', 'date', 'timeSlot', 'status'
        ])
        && data.id is string && data.id == docId
        && isValidBranch(data.branch)
        && data.clientName is string && data.clientName.size() >= 1 && data.clientName.size() <= 150
        && data.clientPhone is string && data.clientPhone.size() >= 3 && data.clientPhone.size() <= 50
        && data.serviceId is string && data.serviceId.size() >= 1
        && data.serviceName is string && data.serviceName.size() >= 1 && data.serviceName.size() <= 500
        && data.servicePrice is number && data.servicePrice >= 0 && data.servicePrice <= 10000
        && data.serviceDuration is number && data.serviceDuration > 0 && data.serviceDuration <= 1440
        && data.staffId is string && data.staffId.size() >= 1
        && data.staffName is string && data.staffName.size() >= 1 && data.staffName.size() <= 150
        && data.date is string && data.date.matches('^\\\\d{4}-\\\\d{2}-\\\\d{2}$')
        && data.timeSlot is string && data.timeSlot.matches('^\\\\d{2}:\\\\d{2}$')
        && isValidAppointmentStatus(data.status);
    }

    function isValidService(data, docId) {
      return data.keys().hasAll(['id', 'branch', 'category', 'name', 'price', 'durationMinutes'])
        && data.id is string && data.id == docId
        && isValidBranch(data.branch)
        && data.category is string && data.category.size() >= 1 && data.category.size() <= 100
        && data.name is string && data.name.size() >= 1 && data.name.size() <= 200
        && data.price is number && data.price >= 0 && data.price <= 10000
        && data.durationMinutes is number && data.durationMinutes > 0 && data.durationMinutes <= 1440;
    }

    function isValidStaff(data, docId) {
      return data.keys().hasAll(['id', 'branch', 'name', 'roleTitle', 'workingHours'])
        && data.id is string && data.id == docId
        && isValidBranch(data.branch)
        && data.name is string && data.name.size() >= 1 && data.name.size() <= 150
        && data.roleTitle is string && data.roleTitle.size() >= 1 && data.roleTitle.size() <= 150
        && data.workingHours is map;
    }

    function isValidBusinessConfig(data) {
      return data.keys().hasAll(['barberShopName', 'beautyShopName', 'pins'])
        && data.barberShopName is string && data.barberShopName.size() >= 1 && data.barberShopName.size() <= 150
        && data.beautyShopName is string && data.beautyShopName.size() >= 1 && data.beautyShopName.size() <= 150
        && data.pins is map;
    }

    match /appointments/{appointmentId} {
      allow read: if true;
      allow create, update: if isValidAppointment(request.resource.data, appointmentId);
      allow delete: if false;
    }

    match /services/{serviceId} {
      allow read: if true;
      allow create, update: if isValidService(request.resource.data, serviceId);
      allow delete: if true;
    }

    match /staff/{staffId} {
      allow read: if true;
      allow create, update: if isValidStaff(request.resource.data, staffId);
      allow delete: if true;
    }

    match /settings/{settingId} {
      allow read: if settingId == 'businessConfig';
      allow create, update: if settingId == 'businessConfig' && isValidBusinessConfig(request.resource.data);
      allow delete: if false;
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}`;

const normalizeCredentials = (rawConfig: Partial<FirebaseCredentials> | null | undefined): FirebaseCredentials => {
  if (!rawConfig || !rawConfig.projectId || !rawConfig.apiKey) {
    return DEFAULT_FIREBASE_CONFIG;
  }

  const projectId = rawConfig.projectId.trim();
  const apiKey = rawConfig.apiKey.trim();

  if (!projectId || !apiKey) {
    return DEFAULT_FIREBASE_CONFIG;
  }

  // Se for o projeto de produção padrão, garante todos os campos preenchidos
  if (projectId === DEFAULT_FIREBASE_CONFIG.projectId) {
    return {
      apiKey: apiKey || DEFAULT_FIREBASE_CONFIG.apiKey,
      projectId: DEFAULT_FIREBASE_CONFIG.projectId,
      authDomain: rawConfig.authDomain?.trim() || DEFAULT_FIREBASE_CONFIG.authDomain,
      storageBucket: rawConfig.storageBucket?.trim() || DEFAULT_FIREBASE_CONFIG.storageBucket,
      messagingSenderId: rawConfig.messagingSenderId?.trim() || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
      appId: rawConfig.appId?.trim() || DEFAULT_FIREBASE_CONFIG.appId,
    };
  }

  return {
    apiKey,
    projectId,
    authDomain: rawConfig.authDomain?.trim() || `${projectId}.firebaseapp.com`,
    storageBucket: rawConfig.storageBucket?.trim() || `${projectId}.firebasestorage.app`,
    messagingSenderId: rawConfig.messagingSenderId?.trim() || '',
    appId: rawConfig.appId?.trim() || '',
  };
};

export const loadStoredFirebaseConfig = async (): Promise<FirebaseCredentials> => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (isFirebaseConfigured(parsed)) {
        return normalizeCredentials(parsed);
      }
    }
  } catch {
    // Fallback para localStorage na Web se AsyncStorage falhar
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (isFirebaseConfigured(parsed)) {
          return normalizeCredentials(parsed);
        }
      }
    } catch {
      // ignore
    }
  }

  return DEFAULT_FIREBASE_CONFIG;
};

export const saveStoredFirebaseConfig = async (config: FirebaseCredentials): Promise<void> => {
  const normalized = normalizeCredentials(config);
  const serialized = JSON.stringify(normalized);
  try {
    await AsyncStorage.setItem(STORAGE_KEY, serialized);
  } catch (e) {
    console.warn('Failed to save Firebase credentials to AsyncStorage:', e);
  }
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY, serialized);
    } catch {
      // ignore
    }
  }
};

export const resetToDefaultFirebaseConfig = async (): Promise<FirebaseCredentials> => {
  await saveStoredFirebaseConfig(DEFAULT_FIREBASE_CONFIG);
  return DEFAULT_FIREBASE_CONFIG;
};

export const isFirebaseConfigured = (config: Partial<FirebaseCredentials> | null | undefined): boolean => {
  return Boolean(
    config &&
    typeof config.apiKey === 'string' &&
    typeof config.projectId === 'string' &&
    config.apiKey.trim().length > 10 &&
    config.projectId.trim().length > 2
  );
};
