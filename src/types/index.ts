export type SalonBranch = 'barber' | 'beauty';

export type UserRole = 'client' | 'gestor_barber' | 'gestor_beauty' | 'staff' | 'admin';

export interface Service {
  id: string;
  branch: SalonBranch;
  category: string;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  iconName: string;
}

export interface StaffMember {
  id: string;
  branch: SalonBranch;
  name: string;
  roleTitle: string;
  avatar: string;
  phone: string;
  rating: number;
  specialties: string[];
  workingHours: {
    start: string; // e.g. "09:00"
    end: string;   // e.g. "19:00"
    lunchStart?: string; // e.g. "12:00"
    lunchEnd?: string;   // e.g. "14:00"
  };
  workDays?: string; // e.g. "Terça a Sábado"
}

export type AppointmentStatus = 'confirmed' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  branch: SalonBranch;
  clientName: string;
  clientPhone: string;
  serviceId: string;       // Primary service ID (or joined)
  serviceName: string;     // Joined names of all selected services
  servicePrice: number;    // Grand total price (€)
  serviceDuration: number; // Grand total duration (min)
  servicesList?: Service[]; // Full array of selected services
  staffId: string;
  staffName: string;
  date: string; // YYYY-MM-DD
  timeSlot: string; // HH:MM
  status: AppointmentStatus;
  createdAt: string;
  notes?: string;
  reminderEnabled?: boolean;
  reminderNotified?: boolean;
}

export interface ClientHistoryNote {
  id: string;
  clientName: string;
  clientPhone: string;
  staffId: string;
  staffName: string;
  branch: SalonBranch;
  date: string; // YYYY-MM-DD
  serviceName: string;
  details: string; // Details of haircut / hair color / treatment
  createdAt: string;
}

export interface BusinessConfig {
  barberShopName: string;
  barberAddress: string;
  barberPhone: string;
  barberOpenDays: string;
  beautyShopName: string;
  beautyAddress: string;
  beautyPhone: string;
  beautyOpenDays: string;
  slotIntervalMinutes: number;
}
