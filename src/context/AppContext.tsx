import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  SalonBranch,
  UserRole,
  Service,
  StaffMember,
  Appointment,
  ClientHistoryNote,
  BusinessConfig,
} from '../types';
import {
  loadAppointments,
  addAppointment,
  saveAppointments,
  loadServices,
  saveServices,
  loadStaff,
  saveStaff,
  loadClientHistory,
  saveClientHistoryNote,
  loadBusinessConfig,
  saveBusinessConfig,
} from '../storage/storageHelper';
import { INITIAL_BUSINESS_CONFIG } from '../constants/mockData';

interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  activeBranch: SalonBranch;
  setActiveBranch: (branch: SalonBranch) => void;

  services: Service[];
  staff: StaffMember[];
  appointments: Appointment[];
  clientHistory: ClientHistoryNote[];
  config: BusinessConfig;

  // Multi-service appointment creation
  createAppointment: (
    branch: SalonBranch,
    clientName: string,
    clientPhone: string,
    selectedServices: Service[],
    staffMember: StaffMember,
    date: string,
    timeSlot: string,
    notes?: string
  ) => Promise<Appointment>;

  updateAppointmentStatus: (id: string, status: Appointment['status']) => Promise<void>;
  addStaffNoteForClient: (note: Omit<ClientHistoryNote, 'id' | 'createdAt'>) => Promise<void>;
  
  // Admin actions
  addService: (newService: Omit<Service, 'id'>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  addStaffMember: (newStaff: Omit<StaffMember, 'id'>) => Promise<void>;
  deleteStaffMember: (id: string) => Promise<void>;
  updateConfig: (newConfig: BusinessConfig) => Promise<void>;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>('client');
  const [activeBranch, setActiveBranch] = useState<SalonBranch>('barber');

  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clientHistory, setClientHistory] = useState<ClientHistoryNote[]>([]);
  const [config, setConfig] = useState<BusinessConfig>(INITIAL_BUSINESS_CONFIG);

  const refreshData = async () => {
    const loadedApps = await loadAppointments();
    const loadedServs = await loadServices();
    const loadedStaff = await loadStaff();
    const loadedHist = await loadClientHistory();
    const loadedConf = await loadBusinessConfig();

    setAppointments(loadedApps);
    setServices(loadedServs);
    setStaff(loadedStaff);
    setClientHistory(loadedHist);
    setConfig(loadedConf);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const createAppointment = async (
    branch: SalonBranch,
    clientName: string,
    clientPhone: string,
    selectedServices: Service[],
    staffMember: StaffMember,
    date: string,
    timeSlot: string,
    notes?: string
  ): Promise<Appointment> => {
    const totalPrice = selectedServices.reduce((acc, s) => acc + s.price, 0);
    const totalDuration = selectedServices.reduce((acc, s) => acc + s.durationMinutes, 0);
    const joinedNames = selectedServices.map(s => s.name).join(' + ');
    const primaryId = selectedServices[0]?.id || 'custom';

    const newBooking: Appointment = {
      id: `app-${Date.now()}`,
      branch,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      serviceId: primaryId,
      serviceName: joinedNames,
      servicePrice: totalPrice,
      serviceDuration: totalDuration,
      servicesList: selectedServices,
      staffId: staffMember.id,
      staffName: staffMember.name,
      date,
      timeSlot,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      notes: notes || '',
    };

    const updated = await addAppointment(newBooking);
    setAppointments(updated);
    return newBooking;
  };

  const updateAppointmentStatus = async (id: string, status: Appointment['status']) => {
    const updated = appointments.map(app => (app.id === id ? { ...app, status } : app));
    await saveAppointments(updated);
    setAppointments(updated);
  };

  const addStaffNoteForClient = async (noteData: Omit<ClientHistoryNote, 'id' | 'createdAt'>) => {
    const newNote: ClientHistoryNote = {
      ...noteData,
      id: `hist-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updated = await saveClientHistoryNote(newNote);
    setClientHistory(updated);
  };

  const addService = async (newService: Omit<Service, 'id'>) => {
    const created: Service = { ...newService, id: `serv-${Date.now()}` };
    const updated = [...services, created];
    await saveServices(updated);
    setServices(updated);
  };

  const deleteService = async (id: string) => {
    const updated = services.filter(s => s.id !== id);
    await saveServices(updated);
    setServices(updated);
  };

  const addStaffMember = async (newStaff: Omit<StaffMember, 'id'>) => {
    const created: StaffMember = { ...newStaff, id: `staff-${Date.now()}` };
    const updated = [...staff, created];
    await saveStaff(updated);
    setStaff(updated);
  };

  const deleteStaffMember = async (id: string) => {
    const updated = staff.filter(s => s.id !== id);
    await saveStaff(updated);
    setStaff(updated);
  };

  const updateConfig = async (newConfig: BusinessConfig) => {
    await saveBusinessConfig(newConfig);
    setConfig(newConfig);
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        activeBranch,
        setActiveBranch,
        services,
        staff,
        appointments,
        clientHistory,
        config,
        createAppointment,
        updateAppointmentStatus,
        addStaffNoteForClient,
        addService,
        deleteService,
        addStaffMember,
        deleteStaffMember,
        updateConfig,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
