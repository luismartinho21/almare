import { Linking, Platform } from 'react-native';
import { Appointment, SalonBranch } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REMINDERS_STORAGE_KEY = '@almare_scheduled_reminders';

export interface ScheduledReminder {
  id: string;
  appointmentId: string;
  branch: SalonBranch;
  clientName: string;
  clientPhone: string;
  serviceName: string;
  staffName: string;
  date: string;
  timeSlot: string;
  notifyAt: string; // ISO string
  notified: boolean;
}

/**
 * Returns the Date object for the appointment
 */
export function getAppointmentDateTime(dateStr: string, timeSlotStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hours, minutes] = timeSlotStr.split(':').map(Number);
  return new Date(year, (month || 1) - 1, day || 1, hours || 0, minutes || 0, 0);
}

/**
 * Calculates exactly 2 hours before the appointment
 */
export function getTwoHoursBeforeDateTime(dateStr: string, timeSlotStr: string): Date {
  const appDate = getAppointmentDateTime(dateStr, timeSlotStr);
  return new Date(appDate.getTime() - 2 * 60 * 60 * 1000);
}

/**
 * Formats time as HH:MM
 */
export function formatTimeHHMM(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Formats date as DD/MM/YYYY
 */
export function formatDatePT(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

/**
 * Formats a Date to iCalendar local datetime format: YYYYMMDDTHHMMSS
 */
function toICSLocalDateTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

/**
 * Formats a Date to Google Calendar UTC string: YYYYMMDDTHHMMSSZ
 */
function toGoogleCalendarUTC(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Builds the .ics file content with an integrated 2-hour before alarm
 */
export function buildICSContent(
  appointment: Appointment,
  shopName: string,
  shopAddress: string
): string {
  const startDate = getAppointmentDateTime(appointment.date, appointment.timeSlot);
  const durationMin = appointment.serviceDuration || 30;
  const endDate = new Date(startDate.getTime() + durationMin * 60 * 1000);

  const startStr = toICSLocalDateTime(startDate);
  const endStr = toICSLocalDateTime(endDate);
  const nowStr = toICSLocalDateTime(new Date());

  const branchLabel = appointment.branch === 'barber' ? 'Barber' : 'Beauty';
  const title = `Almare ${branchLabel} - ${appointment.serviceName}`;
  const description = `Marcação Almare ${branchLabel}\\nCliente: ${appointment.clientName}\\nProfissional: ${appointment.staffName}\\nServiço: ${appointment.serviceName}\\nValor: ${appointment.servicePrice} €\\nData: ${formatDatePT(appointment.date)} às ${appointment.timeSlot}`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Almare Salons//PT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:almare-${appointment.id}-${Date.now()}@almare.pt`,
    `DTSTAMP:${nowStr}`,
    `DTSTART:${startStr}`,
    `DTEND:${endStr}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${shopAddress}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    `DESCRIPTION:Lembrete: A sua marcação na Almare é daqui a 2 horas (${appointment.timeSlot})!`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Downloads or opens the .ics file for Apple Calendar, Android Calendar, Outlook, etc.
 */
export function addToDeviceCalendar(
  appointment: Appointment,
  shopName: string,
  shopAddress: string
): boolean {
  try {
    const icsData = buildICSContent(appointment, shopName, shopAddress);

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `marcacao-almare-${appointment.date}.ics`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      return true;
    } else {
      const uri = `data:text/calendar;charset=utf-8,${encodeURIComponent(icsData)}`;
      Linking.openURL(uri).catch(() => {
        // Fallback to Google Calendar if data: fails
        openGoogleCalendar(appointment, shopName, shopAddress);
      });
      return true;
    }
  } catch (err) {
    console.error('Error downloading .ics calendar:', err);
    return false;
  }
}

/**
 * Opens Google Calendar event creation with 2h-prior alert note
 */
export function openGoogleCalendar(
  appointment: Appointment,
  shopName: string,
  shopAddress: string
): void {
  const startDate = getAppointmentDateTime(appointment.date, appointment.timeSlot);
  const durationMin = appointment.serviceDuration || 30;
  const endDate = new Date(startDate.getTime() + durationMin * 60 * 1000);

  const startUTC = toGoogleCalendarUTC(startDate);
  const endUTC = toGoogleCalendarUTC(endDate);

  const branchLabel = appointment.branch === 'barber' ? 'Barber' : 'Beauty';
  const title = encodeURIComponent(`Almare ${branchLabel} - ${appointment.serviceName}`);
  const details = encodeURIComponent(
    `Marcação confirmada no ${shopName} para ${appointment.clientName} com ${appointment.staffName}.\nServiço: ${appointment.serviceName}\nValor: ${appointment.servicePrice} €\n⏰ Lembrete: 2 horas antes!`
  );
  const location = encodeURIComponent(shopAddress);

  const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startUTC}/${endUTC}&details=${details}&location=${location}`;
  Linking.openURL(url);
}

/**
 * Requests device/browser notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') {
      return true;
    }
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
  }
  return false;
}

/**
 * Schedules a local/browser reminder notification for 2 hours before the appointment
 */
export async function scheduleTwoHourReminder(
  appointment: Appointment,
  shopName: string
): Promise<{ success: boolean; notifyAt: Date; message: string }> {
  const notifyAt = getTwoHoursBeforeDateTime(appointment.date, appointment.timeSlot);
  const now = new Date();
  const branchLabel = appointment.branch === 'barber' ? 'Barber' : 'Beauty';

  // Request browser permission if available
  let permissionGranted = false;
  if (typeof window !== 'undefined' && 'Notification' in window) {
    permissionGranted = await requestNotificationPermission();
  }

  // Load existing scheduled reminders
  const raw = await AsyncStorage.getItem(REMINDERS_STORAGE_KEY);
  let reminders: ScheduledReminder[] = raw ? JSON.parse(raw) : [];

  // Remove existing reminder for this appointment if any
  reminders = reminders.filter(r => r.appointmentId !== appointment.id);

  const newReminder: ScheduledReminder = {
    id: `rem-${Date.now()}`,
    appointmentId: appointment.id,
    branch: appointment.branch,
    clientName: appointment.clientName,
    clientPhone: appointment.clientPhone,
    serviceName: appointment.serviceName,
    staffName: appointment.staffName,
    date: appointment.date,
    timeSlot: appointment.timeSlot,
    notifyAt: notifyAt.toISOString(),
    notified: false,
  };

  reminders.push(newReminder);
  await AsyncStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(reminders));

  const delayMs = notifyAt.getTime() - now.getTime();
  const timeStr = formatTimeHHMM(notifyAt);
  const dateStr = formatDatePT(appointment.date);

  // If in web browser, schedule timeout if within reasonable range (e.g. today or next hours)
  if (permissionGranted && delayMs > 0 && delayMs < 24 * 60 * 60 * 1000) {
    setTimeout(() => {
      try {
        new Notification(`⏰ Almare ${branchLabel} - Lembrete`, {
          body: `Olá ${appointment.clientName}! A sua marcação para ${appointment.serviceName} com ${appointment.staffName} é hoje às ${appointment.timeSlot} (daqui a 2 horas). Esperamos por si!`,
          icon: '/assets/logo.jpg',
        });
      } catch (e) {
        console.error('Error firing timeout notification:', e);
      }
    }, delayMs);
  }

  let message = `Lembrete agendado para ${dateStr} às ${timeStr} (2 horas antes da marcação).`;
  if (delayMs <= 0) {
    message = `A marcação é em menos de 2 horas (${appointment.timeSlot}). Enviaremos o alerta imediatamente.`;
    if (permissionGranted && typeof window !== 'undefined' && 'Notification' in window) {
      try {
        new Notification(`⏰ Almare ${branchLabel} - Lembrete de Marcação`, {
          body: `Olá ${appointment.clientName}! Tem marcação para ${appointment.serviceName} hoje às ${appointment.timeSlot}!`,
          icon: '/assets/logo.jpg',
        });
      } catch (e) {
        // ignore
      }
    }
  }

  return { success: true, notifyAt, message };
}

/**
 * Checks all stored scheduled reminders and triggers any that are due
 */
export async function checkAndTriggerDueReminders(
  onReminderTriggered?: (reminder: ScheduledReminder) => void
): Promise<ScheduledReminder[]> {
  try {
    const raw = await AsyncStorage.getItem(REMINDERS_STORAGE_KEY);
    if (!raw) return [];

    const reminders: ScheduledReminder[] = JSON.parse(raw);
    const now = new Date().getTime();
    let updated = false;
    const triggeredList: ScheduledReminder[] = [];

    for (const rem of reminders) {
      if (!rem.notified) {
        const notifyTime = new Date(rem.notifyAt).getTime();
        // If notify time has passed and appointment is not far in the past (within 4 hours)
        const appTime = getAppointmentDateTime(rem.date, rem.timeSlot).getTime();
        if (now >= notifyTime && now <= appTime + 60 * 60 * 1000) {
          rem.notified = true;
          updated = true;
          triggeredList.push(rem);

          const branchLabel = rem.branch === 'barber' ? 'Barber' : 'Beauty';
          if (
            typeof window !== 'undefined' &&
            'Notification' in window &&
            Notification.permission === 'granted'
          ) {
            try {
              new Notification(`⏰ Almare ${branchLabel} - Lembrete de Marcação`, {
                body: `Olá ${rem.clientName}! A sua marcação para ${rem.serviceName} com ${rem.staffName} é hoje às ${rem.timeSlot} (daqui a 2 horas).`,
                icon: '/assets/logo.jpg',
              });
            } catch (e) {
              console.error('Error firing due notification:', e);
            }
          }

          if (onReminderTriggered) {
            onReminderTriggered(rem);
          }
        } else if (now > appTime + 24 * 60 * 60 * 1000) {
          // Expired more than 1 day ago
          rem.notified = true;
          updated = true;
        }
      }
    }

    if (updated) {
      await AsyncStorage.setItem(REMINDERS_STORAGE_KEY, JSON.stringify(reminders));
    }

    return triggeredList;
  } catch (err) {
    console.error('Error in checkAndTriggerDueReminders:', err);
    return [];
  }
}

/**
 * Generates the WhatsApp link for the gestor to notify the client 2 hours before
 */
export function getGestorNotifyClientWhatsAppUrl(
  appointment: Appointment,
  shopName: string
): string {
  const isBarber = appointment.branch === 'barber';
  const salonName = isBarber ? 'Almare Barber Shop' : 'Almare Beauty Salon';
  const text = encodeURIComponent(
    `Olá ${appointment.clientName}! 👋 Lembramos que tem marcação hoje às ${appointment.timeSlot} no ${salonName} para ${appointment.serviceName} com ${appointment.staffName}. Por favor compareça com alguns minutos de antecedência. Qualquer imprevisto, responda a esta mensagem. Até já!`
  );

  const cleanPhone = appointment.clientPhone.replace(/\D/g, '');
  const fullPhone = cleanPhone.startsWith('351') ? cleanPhone : `351${cleanPhone}`;
  return `https://wa.me/${fullPhone}?text=${text}`;
}
