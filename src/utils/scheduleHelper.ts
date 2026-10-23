import { Appointment, StaffMember } from '../types';

export const MORNING_SLOTS = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];
export const AFTERNOON_SLOTS = [
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
  '17:30',
  '18:00',
  '18:30',
];
export const ALL_WORKING_SLOTS = [...MORNING_SLOTS, ...AFTERNOON_SLOTS];

/**
 * Converte string de hora 'HH:MM' para número total de minutos desde a meia-noite.
 */
export const timeToMinutes = (timeStr: string): number => {
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

/**
 * Converte minutos para string 'HH:MM'.
 */
export const minutesToTime = (mins: number): string => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/**
 * O salão abre de Terça a Sábado (Fechado Domingo=0 e Segunda=1).
 */
export const isSalonOpenDay = (dateStr: string): boolean => {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay();
  return day !== 0 && day !== 1;
};

/**
 * Verifica se um profissional está totalmente disponível durante o intervalo contínuo
 * exigido pelo serviço acumulado [slotStart, slotStart + durationMinutes].
 * 
 * Regras:
 * 1. O salão tem de estar aberto no dia.
 * 2. O intervalo tem de caber integralmente no turno de trabalho (Manhã: até às 12:00 / Tarde: até às 19:00).
 * 3. Nenhuma marcação ativa ou concluída (status !== 'cancelled') do profissional pode colidir no tempo.
 */
export const isStaffAvailableForInterval = (
  staff: StaffMember,
  slot: string,
  durationMinutes: number,
  date: string,
  appointments: Appointment[]
): boolean => {
  if (!isSalonOpenDay(date)) return false;

  // Se o profissional estiver inativo, de baixa ou férias
  if (staff.status === 'inactive' || staff.status === 'leave' || staff.status === 'vacation') {
    return false;
  }

  // Se o profissional estiver com falta / ausência programada nesta data
  if (staff.unavailableDates && staff.unavailableDates.includes(date)) {
    return false;
  }

  const duration = Math.max(durationMinutes || 30, 15);
  const slotStart = timeToMinutes(slot);
  const slotEnd = slotStart + duration;

  // Horários de trabalho do profissional e pausa de almoço
  const startMins = timeToMinutes(staff.workingHours?.start || '09:00');
  const endMins = timeToMinutes(staff.workingHours?.end || '19:00');
  const lunchStartMins = timeToMinutes(staff.workingHours?.lunchStart || '12:00');
  const lunchEndMins = timeToMinutes(staff.workingHours?.lunchEnd || '14:00');

  // Verificar se o intervalo completo cabe no turno da manhã ou no turno da tarde
  const fitsMorning = slotStart >= startMins && slotEnd <= lunchStartMins;
  const fitsAfternoon = slotStart >= lunchEndMins && slotEnd <= endMins;

  if (!fitsMorning && !fitsAfternoon) {
    return false;
  }

  // Verificar colisão com qualquer marcação existente (confirmada ou concluída)
  const hasConflict = appointments.some(app => {
    if (app.status === 'cancelled') return false;
    if (app.date !== date) return false;
    if (app.staffId !== staff.id) return false;

    const appStart = timeToMinutes(app.timeSlot);
    const appDuration = Math.max(app.serviceDuration || 30, 15);
    const appEnd = appStart + appDuration;

    // Colisão ocorre se os dois intervalos se cruzam: [slotStart, slotEnd) ∩ [appStart, appEnd) ≠ ∅
    const overlaps = slotStart < appEnd && slotEnd > appStart;
    return overlaps;
  });

  return !hasConflict;
};

/**
 * Devolve a lista de profissionais livres para o intervalo completo.
 */
export const getFreeStaffForInterval = (
  branchStaff: StaffMember[],
  slot: string,
  durationMinutes: number,
  date: string,
  appointments: Appointment[]
): StaffMember[] => {
  return branchStaff.filter(s =>
    isStaffAvailableForInterval(s, slot, durationMinutes, date, appointments)
  );
};

/**
 * Calcula o conjunto de slots ocupados/bloqueados para a data e duração solicitadas.
 */
export const getOccupiedSlots = ({
  date,
  durationMinutes,
  staffMember,
  isNoPreference,
  branchStaff,
  appointments,
}: {
  date: string;
  durationMinutes: number;
  staffMember?: StaffMember | null;
  isNoPreference: boolean;
  branchStaff: StaffMember[];
  appointments: Appointment[];
}): Set<string> => {
  const occupiedSet = new Set<string>();

  if (!isSalonOpenDay(date)) {
    ALL_WORKING_SLOTS.forEach(slot => occupiedSet.add(slot));
    return occupiedSet;
  }

  ALL_WORKING_SLOTS.forEach(slot => {
    if (isNoPreference) {
      // Sem preferência: ocupado se nenhum profissional estiver disponível para a duração acumulada
      const freeStaff = getFreeStaffForInterval(branchStaff, slot, durationMinutes, date, appointments);
      if (freeStaff.length === 0) {
        occupiedSet.add(slot);
      }
    } else if (staffMember) {
      // Profissional específico selecionado
      const available = isStaffAvailableForInterval(
        staffMember,
        slot,
        durationMinutes,
        date,
        appointments
      );
      if (!available) {
        occupiedSet.add(slot);
      }
    } else {
      const freeStaff = getFreeStaffForInterval(branchStaff, slot, durationMinutes, date, appointments);
      if (freeStaff.length === 0) {
        occupiedSet.add(slot);
      }
    }
  });

  return occupiedSet;
};
