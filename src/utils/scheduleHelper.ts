import { Appointment, StaffMember } from '../types';

export const MORNING_SLOTS = ['09:30', '10:00', '10:30', '11:00', '11:30', '12:00'];
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
 * Retorna a data de hoje formatada em 'YYYY-MM-DD' com base no fuso horário local.
 */
export const getTodayDateString = (refDate: Date = new Date()): string => {
  const yyyy = refDate.getFullYear();
  const mm = String(refDate.getMonth() + 1).padStart(2, '0');
  const dd = String(refDate.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Retorna a hora atual em minutos desde a meia-noite (hora local).
 */
export const getCurrentTimeMinutes = (refDate: Date = new Date()): number => {
  return refDate.getHours() * 60 + refDate.getMinutes();
};

/**
 * Verifica se um determinado horário ('HH:MM') numa determinada data ('YYYY-MM-DD')
 * já se encontra no passado em relação ao momento atual.
 */
export const isSlotInPast = (slot: string, date: string, refDate: Date = new Date()): boolean => {
  const todayStr = getTodayDateString(refDate);
  if (date < todayStr) return true;
  if (date > todayStr) return false;

  // No dia de hoje, qualquer horário que já começou ou passou é considerado no passado
  const currentMins = getCurrentTimeMinutes(refDate);
  const slotMins = timeToMinutes(slot);
  return slotMins <= currentMins;
};

/**
 * Retorna a data inicial ideal para o agendamento:
 * Se hoje ainda estiver aberto e com horários futuros por decorrer (antes das 18:30), retorna hoje.
 * Se hoje já tiver fechado ou for dia encerrado (Dom/Seg), retorna o próximo dia aberto.
 */
export const getInitialBookingDate = (refDate: Date = new Date()): string => {
  const todayStr = getTodayDateString(refDate);
  const currentMins = getCurrentTimeMinutes(refDate);
  const lastSlotMins = timeToMinutes('18:30');

  if (isSalonOpenDay(todayStr) && currentMins < lastSlotMins) {
    return todayStr;
  }

  for (let i = 1; i <= 10; i++) {
    const next = new Date(refDate);
    next.setDate(refDate.getDate() + i);
    const nextStr = getTodayDateString(next);
    if (isSalonOpenDay(nextStr)) {
      return nextStr;
    }
  }

  return todayStr;
};

export type StaffShiftType = 'all_day' | 'morning_only' | 'afternoon_only' | 'off';

/**
 * Determina o tipo de turno de trabalho de um profissional (Apenas Manhã, Apenas Tarde, ou Dia Completo).
 */
export const getStaffShiftType = (staff: StaffMember): StaffShiftType => {
  const startMins = timeToMinutes(staff.workingHours?.start || '09:30');
  const endMins = timeToMinutes(staff.workingHours?.end || '19:00');
  const lunchStartMins = staff.workingHours?.lunchStart ? timeToMinutes(staff.workingHours.lunchStart) : 750;
  const lunchEndMins = staff.workingHours?.lunchEnd ? timeToMinutes(staff.workingHours.lunchEnd) : 840;

  const morningEnd = Math.min(endMins, lunchStartMins);
  const hasMorning = startMins < morningEnd;

  const afternoonStart = Math.max(startMins, lunchEndMins);
  const hasAfternoon = afternoonStart < endMins;

  if (hasMorning && hasAfternoon) return 'all_day';
  if (hasMorning && !hasAfternoon) return 'morning_only';
  if (!hasMorning && hasAfternoon) return 'afternoon_only';
  return 'off';
};

export interface StaffAbsenceInfo {
  isAbsent: boolean;
  type: 'leave' | 'vacation' | 'inactive' | 'none';
  label: string;
  reason?: string;
  periodText?: string;
  returnDate?: string;
}

/**
 * Devolve informações detalhadas de ausência (baixa médica, férias, motivo e tempo) para uma data.
 */
export const getStaffAbsenceInfoForDate = (
  staff: StaffMember,
  dateStr: string
): StaffAbsenceInfo => {
  const isDateUnavailable = !!(staff.unavailableDates && staff.unavailableDates.includes(dateStr));
  const hasSpecificDates = !!(staff.unavailableDates && staff.unavailableDates.length > 0);

  if (hasSpecificDates) {
    if (!isDateUnavailable) {
      return { isAbsent: false, type: 'none', label: 'Disponível' };
    }
  } else {
    if (staff.status !== 'inactive' && staff.status !== 'leave' && staff.status !== 'vacation') {
      return { isAbsent: false, type: 'none', label: 'Disponível' };
    }
  }

  const type = staff.status === 'inactive' ? 'inactive' : 'leave';
  const label = 'Indisponível';

  let periodText: string | undefined;
  let returnDate: string | undefined;

  if (hasSpecificDates) {
    const sorted = [...staff.unavailableDates!].sort();
    const start = sorted[0];
    const end = sorted[sorted.length - 1];
    const daysCount = sorted.length;

    const formatPt = (dStr: string) => {
      const parts = dStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dStr;
    };

    periodText =
      daysCount === 1
        ? `Data: ${formatPt(start)} (1 dia)`
        : `De ${formatPt(start)} a ${formatPt(end)} (${daysCount} dias)`;

    try {
      const endDateObj = new Date(end + 'T00:00:00');
      endDateObj.setDate(endDateObj.getDate() + 1);
      const ry = endDateObj.getFullYear();
      const rm = String(endDateObj.getMonth() + 1).padStart(2, '0');
      const rd = String(endDateObj.getDate()).padStart(2, '0');
      returnDate = `${rd}/${rm}/${ry}`;
    } catch {
      // ignore
    }
  }

  return {
    isAbsent: true,
    type,
    label,
    periodText,
    returnDate,
  };
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
 * 2. O profissional não pode estar de baixa, férias ou com ausência na data.
 * 3. O intervalo tem de caber integralmente no turno de trabalho (Manhã ou Tarde).
 * 4. Nenhuma marcação ativa ou concluída (status !== 'cancelled') do profissional pode colidir no tempo.
 */
export const isStaffAvailableForInterval = (
  staff: StaffMember,
  slot: string,
  durationMinutes: number,
  date: string,
  appointments: Appointment[],
  refDate: Date = new Date()
): boolean => {
  if (!isSalonOpenDay(date)) return false;

  // Se o horário já passou em relação ao momento atual (no dia de hoje ou dias passados)
  if (isSlotInPast(slot, date, refDate)) {
    return false;
  }

  // Se o profissional estiver inativo
  if (staff.status === 'inactive') {
    return false;
  }

  // Se o profissional tiver datas específicas de ausência registadas (baixa médica, férias)
  if (staff.unavailableDates && staff.unavailableDates.length > 0) {
    if (staff.unavailableDates.includes(date)) {
      return false;
    }
  } else if (staff.status === 'leave' || staff.status === 'vacation') {
    // Ausência geral sem datas específicas delimitadas
    return false;
  }

  const duration = Math.max(durationMinutes || 30, 15);
  const slotStart = timeToMinutes(slot);
  const slotEnd = slotStart + duration;

  // Horários de trabalho do profissional e pausa de almoço
  const startMins = timeToMinutes(staff.workingHours?.start || '09:30');
  const endMins = timeToMinutes(staff.workingHours?.end || '19:00');
  const lunchStartMins = staff.workingHours?.lunchStart ? timeToMinutes(staff.workingHours.lunchStart) : 750;
  const lunchEndMins = staff.workingHours?.lunchEnd ? timeToMinutes(staff.workingHours.lunchEnd) : 840;

  // Turno da Manhã: desde startMins até ao fim da manhã (min entre endMins e lunchStartMins)
  const morningEnd = Math.min(endMins, lunchStartMins);
  const fitsMorning = startMins < morningEnd && slotStart >= startMins && slotEnd <= morningEnd;

  // Turno da Tarde: desde o início da tarde (max entre startMins e lunchEndMins) até endMins
  const afternoonStart = Math.max(startMins, lunchEndMins);
  const fitsAfternoon = afternoonStart < endMins && slotStart >= afternoonStart && slotEnd <= endMins;

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
  appointments: Appointment[],
  refDate: Date = new Date()
): StaffMember[] => {
  return branchStaff.filter(s =>
    isStaffAvailableForInterval(s, slot, durationMinutes, date, appointments, refDate)
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
  refDate = new Date(),
}: {
  date: string;
  durationMinutes: number;
  staffMember?: StaffMember | null;
  isNoPreference: boolean;
  branchStaff: StaffMember[];
  appointments: Appointment[];
  refDate?: Date;
}): Set<string> => {
  const occupiedSet = new Set<string>();

  if (!isSalonOpenDay(date)) {
    ALL_WORKING_SLOTS.forEach(slot => occupiedSet.add(slot));
    return occupiedSet;
  }

  ALL_WORKING_SLOTS.forEach(slot => {
    // Horários no passado ficam automaticamente marcados como ocupados/indisponíveis
    if (isSlotInPast(slot, date, refDate)) {
      occupiedSet.add(slot);
      return;
    }

    if (isNoPreference) {
      // Sem preferência: ocupado se nenhum profissional estiver disponível para a duração acumulada
      const freeStaff = getFreeStaffForInterval(branchStaff, slot, durationMinutes, date, appointments, refDate);
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
        appointments,
        refDate
      );
      if (!available) {
        occupiedSet.add(slot);
      }
    } else {
      const freeStaff = getFreeStaffForInterval(branchStaff, slot, durationMinutes, date, appointments, refDate);
      if (freeStaff.length === 0) {
        occupiedSet.add(slot);
      }
    }
  });

  return occupiedSet;
};
