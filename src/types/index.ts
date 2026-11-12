export type SalonBranch = 'barber' | 'beauty';

export type UserRole = 'client' | 'gestor_barber' | 'gestor_beauty' | 'staff' | 'admin';

export interface ExperienceMenuItem {
  id: string;
  name: string;
  description: string;
  priceSupplement?: number;
}

export interface ExperienceRestaurant {
  id: string;
  name: string;
  cuisine: string;
  location: string;
  description: string;
  image?: string;
  menus: ExperienceMenuItem[];
}

export interface ServiceExperienceConfig {
  enabled: boolean;
  title: string; // Ex: "Experiência Romântica com Jantar"
  instruction?: string;
  restaurants: ExperienceRestaurant[];
}

export interface BookingExperienceSelection {
  serviceId: string;
  restaurantId: string;
  restaurantName: string;
  menuId: string;
  menuName: string;
  priceSupplement?: number;
  notes?: string;
}

export interface Service {
  id: string;
  branch: SalonBranch;
  category: string;
  name: string;
  description: string; // Descrição curta que aparece no cartão principal
  longDescription?: string; // Descrição completa que aparece ao clicar em "Saber mais"
  price: number;
  durationMinutes: number;
  iconName: string;
  compatibleExtraIds?: string[]; // IDs dos extras específicos que podem ser associados a este serviço
  experienceConfig?: ServiceExperienceConfig; // Configuração especial de experiência (ex: restaurante e menu)
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
  status?: 'active' | 'leave' | 'vacation' | 'inactive'; // e.g. ativo, de baixa, férias, inativo
  absenceNote?: string; // e.g. "Baixa médica por 3 dias", "Férias"
  unavailableDates?: string[]; // Datas específicas de ausência (YYYY-MM-DD)
  pin?: string; // Código de acesso pessoal único do colaborador (4 dígitos)
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
  experienceSelection?: BookingExperienceSelection; // Detalhes do restaurante e menu escolhidos
  linkedAppointmentId?: string; // ID da marcação espelho no ramo oposto (Experiência a 2)
  isExperiencePartnerSlot?: boolean; // Bloqueio automático do acompanhante no outro ramo
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

export interface RolePinsConfig {
  adminPin: string;         // Default: '9999'
  gestorBarberPin: string;  // Default: '1111'
  gestorBeautyPin: string;  // Default: '2222'
  staffPin: string;         // Default: '3333'
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
  pins: RolePinsConfig;
}
