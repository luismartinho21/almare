import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Linking,
  ScrollView,
  Alert,
} from 'react-native';
import { Appointment } from '../types';
import { useApp } from '../context/AppContext';
import { Theme } from '../constants/theme';
import {
  getTwoHoursBeforeDateTime,
  formatTimeHHMM,
  formatDatePT,
  addToDeviceCalendar,
  openGoogleCalendar,
  scheduleTwoHourReminder,
} from '../utils/reminderHelper';

interface BookingSuccessModalProps {
  visible: boolean;
  appointment: Appointment | null;
  onClose: () => void;
}

export const BookingSuccessModal: React.FC<BookingSuccessModalProps> = ({
  visible,
  appointment,
  onClose,
}) => {
  const { config, updateAppointmentReminder } = useApp();
  const [reminderActive, setReminderActive] = useState<boolean>(true);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [showCalendarMenu, setShowCalendarMenu] = useState<boolean>(false);

  if (!appointment) return null;

  const isBarber = appointment.branch === 'barber';
  const shopName = isBarber ? config.barberShopName : config.beautyShopName;
  const shopAddress = isBarber ? config.barberAddress : config.beautyAddress;
  const shopPhone = isBarber ? config.barberPhone : config.beautyPhone;
  const accentColor = isBarber ? Theme.colors.barber.accent : Theme.colors.beauty.badge;

  const twoHoursBeforeObj = getTwoHoursBeforeDateTime(appointment.date, appointment.timeSlot);
  const twoHoursBeforeTime = formatTimeHHMM(twoHoursBeforeObj);
  const appointmentDatePT = formatDatePT(appointment.date);

  const handleOpenWhatsApp = () => {
    const msg = encodeURIComponent(
      `Olá ${shopName}! Fiz uma marcação para ${appointment.serviceName} no dia ${appointment.date} às ${appointment.timeSlot} em nome de ${appointment.clientName}.`
    );
    const cleanPhone = shopPhone.replace(/\s+/g, '');
    Linking.openURL(`https://wa.me/${cleanPhone}?text=${msg}`);
  };

  const handleToggleReminder = async () => {
    try {
      const nextState = !reminderActive;
      setReminderActive(nextState);
      await updateAppointmentReminder(appointment.id, nextState);

      if (nextState) {
        const res = await scheduleTwoHourReminder(appointment, shopName);
        setFeedbackMsg(`✓ Notificação ativa: alerta agendado para as ${twoHoursBeforeTime} (2h antes).`);
      } else {
        setFeedbackMsg('Lembrete automático desativado.');
      }
    } catch (e) {
      setFeedbackMsg('Erro ao atualizar lembrete.');
    }
  };

  const handleAddDeviceCalendar = () => {
    const ok = addToDeviceCalendar(appointment, shopName, shopAddress);
    if (ok) {
      setFeedbackMsg(`✓ Ficheiro de calendário com alarme 2h antes (${twoHoursBeforeTime}) pronto!`);
      setShowCalendarMenu(false);
    }
  };

  const handleOpenGoogleCalendar = () => {
    openGoogleCalendar(appointment, shopName, shopAddress);
    setFeedbackMsg(`✓ Google Calendar aberto para a marcação.`);
    setShowCalendarMenu(false);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[
            styles.card,
            isBarber ? styles.cardBarber : styles.cardBeauty,
          ]}
          onPress={e => e.stopPropagation()}
        >
          <ScrollView
            contentContainerStyle={styles.scrollInner}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.iconCircle}>
              <Text style={styles.checkIcon}>✓</Text>
            </View>

            <Text style={[styles.title, isBarber ? styles.titleBarber : styles.titleBeauty]}>
              Marcação Confirmada!
            </Text>
            <Text style={[styles.subTitle, isBarber ? styles.subTitleBarber : styles.subTitleBeauty]}>
              O horário de <Text style={[styles.boldText, { color: accentColor }]}>{appointment.timeSlot}</Text> no dia{' '}
              <Text style={[styles.boldText, { color: accentColor }]}>{appointmentDatePT}</Text> ficou reservado.
            </Text>

            {/* Appointment Ticket */}
            <View
              style={[
                styles.ticketBox,
                isBarber ? styles.ticketBoxBarber : styles.ticketBoxBeauty,
              ]}
            >
              <View style={styles.ticketHeader}>
                <Text style={[styles.ticketRef, { color: accentColor }]}>
                  REF: #{appointment.id.toUpperCase()}
                </Text>
                <Text style={[styles.ticketShop, isBarber ? styles.ticketShopBarber : styles.ticketShopBeauty]}>
                  {shopName}
                </Text>
              </View>

              <View style={[styles.divider, isBarber ? styles.dividerBarber : styles.dividerBeauty]} />

              <View style={styles.ticketRow}>
                <Text style={styles.label}>Cliente:</Text>
                <Text style={[styles.value, isBarber ? styles.valueBarber : styles.valueBeauty]}>
                  {appointment.clientName} ({appointment.clientPhone})
                </Text>
              </View>

              <View style={styles.ticketRow}>
                <Text style={styles.label}>Serviço:</Text>
                <Text style={[styles.value, isBarber ? styles.valueBarber : styles.valueBeauty]}>
                  {appointment.serviceName} - {appointment.servicePrice} €
                </Text>
              </View>

              <View style={styles.ticketRow}>
                <Text style={styles.label}>Profissional:</Text>
                <Text style={[styles.value, isBarber ? styles.valueBarber : styles.valueBeauty]}>
                  {appointment.staffName}
                </Text>
              </View>

              <View style={styles.ticketRow}>
                <Text style={styles.label}>Localização:</Text>
                <Text style={[styles.valueSmall, isBarber ? styles.valueSmallBarber : styles.valueSmallBeauty]}>
                  {shopAddress}
                </Text>
              </View>
            </View>

            {/* REMINDER & NOTIFICATION BOX */}
            <View
              style={[
                styles.reminderCard,
                isBarber ? styles.reminderCardBarber : styles.reminderCardBeauty,
              ]}
            >
              <View style={styles.reminderCardHeader}>
                <Text style={styles.reminderCardIcon}>🔔</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.reminderCardTitle, { color: accentColor }]}>
                    LEMBRETE 2 HORAS ANTES
                  </Text>
                  <Text style={[styles.reminderCardSub, isBarber ? styles.reminderCardSubBarber : styles.reminderCardSubBeauty]}>
                    Notificação automática às <Text style={{ fontWeight: '800' }}>{twoHoursBeforeTime}</Text> do dia {appointmentDatePT}.
                  </Text>
                </View>
              </View>

              {/* Toggle reminder button */}
              <TouchableOpacity
                style={[
                  styles.reminderToggleBtn,
                  reminderActive
                    ? (isBarber ? styles.reminderToggleBtnActiveBarber : styles.reminderToggleBtnActiveBeauty)
                    : styles.reminderToggleBtnInactive,
                ]}
                onPress={handleToggleReminder}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.reminderToggleBtnText,
                    reminderActive
                      ? { color: '#0D0D11' }
                      : { color: isBarber ? '#9CA3AF' : '#6B7280' },
                  ]}
                >
                  {reminderActive
                    ? `✓ Notificação 2h Antes Ativada (${twoHoursBeforeTime})`
                    : '➕ Ativar Notificação 2 Horas Antes'}
                </Text>
              </TouchableOpacity>

              {/* Add to Calendar / Reminders button */}
              <View style={styles.calendarActionWrapper}>
                <TouchableOpacity
                  style={[
                    styles.calendarBtn,
                    isBarber ? styles.calendarBtnBarber : styles.calendarBtnBeauty,
                  ]}
                  onPress={() => setShowCalendarMenu(prev => !prev)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.calendarBtnText, { color: isBarber ? '#F8FAFC' : '#1F2937' }]}>
                    📅 Adicionar aos Lembretes / Calendário {showCalendarMenu ? '▲' : '▼'}
                  </Text>
                </TouchableOpacity>

                {showCalendarMenu && (
                  <View
                    style={[
                      styles.calendarDropdown,
                      isBarber ? styles.calendarDropdownBarber : styles.calendarDropdownBeauty,
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.dropdownOption}
                      onPress={handleAddDeviceCalendar}
                    >
                      <Text style={[styles.dropdownOptionText, isBarber ? styles.dropdownTextBarber : styles.dropdownTextBeauty]}>
                        📱 Calendário do Telemóvel (Apple / Android / .ics)
                      </Text>
                      <Text style={styles.dropdownOptionHint}>
                        Inclui alarme programado 2 horas antes
                      </Text>
                    </TouchableOpacity>

                    <View style={[styles.dropdownDivider, isBarber ? styles.dividerBarber : styles.dividerBeauty]} />

                    <TouchableOpacity
                      style={styles.dropdownOption}
                      onPress={handleOpenGoogleCalendar}
                    >
                      <Text style={[styles.dropdownOptionText, isBarber ? styles.dropdownTextBarber : styles.dropdownTextBeauty]}>
                        🌐 Google Calendar
                      </Text>
                      <Text style={styles.dropdownOptionHint}>
                        Abre diretamente no Google Agenda
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {feedbackMsg && (
                <View style={styles.feedbackBox}>
                  <Text style={styles.feedbackText}>{feedbackMsg}</Text>
                </View>
              )}
            </View>

            {/* WhatsApp Contact */}
            <TouchableOpacity style={styles.whatsappBtn} onPress={handleOpenWhatsApp} activeOpacity={0.85}>
              <Text style={styles.whatsappBtnText}>💬 Contactar Salão via WhatsApp</Text>
            </TouchableOpacity>

            {/* Done Button */}
            <TouchableOpacity
              style={[
                styles.doneBtn,
                { backgroundColor: accentColor },
              ]}
              onPress={onClose}
              activeOpacity={0.85}
            >
              <Text style={styles.doneBtnText}>Concluído</Text>
            </TouchableOpacity>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 460,
    maxHeight: '92%',
    borderWidth: 1.5,
  },
  cardBarber: {
    backgroundColor: '#18181E',
    borderColor: '#D4AF37',
  },
  cardBeauty: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E6D5AC',
  },
  scrollInner: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  checkIcon: {
    color: '#FFF',
    fontSize: 30,
    fontWeight: '900',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
    textAlign: 'center',
  },
  titleBarber: {
    color: '#FFFFFF',
  },
  titleBeauty: {
    color: '#1F2937',
  },
  subTitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  subTitleBarber: {
    color: '#A1A1AA',
  },
  subTitleBeauty: {
    color: '#6B7280',
  },
  boldText: {
    fontWeight: '800',
  },
  ticketBox: {
    borderRadius: 14,
    padding: 14,
    width: '100%',
    marginBottom: 14,
  },
  ticketBoxBarber: {
    backgroundColor: '#27272F',
  },
  ticketBoxBeauty: {
    backgroundColor: '#FFFDF5',
    borderWidth: 1,
    borderColor: '#F3E8C8',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketRef: {
    fontSize: 11,
    fontWeight: '800',
  },
  ticketShop: {
    fontSize: 12,
    fontWeight: '700',
  },
  ticketShopBarber: {
    color: '#E5E7EB',
  },
  ticketShopBeauty: {
    color: '#374151',
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  dividerBarber: {
    backgroundColor: '#3F3F4A',
  },
  dividerBeauty: {
    backgroundColor: '#E5E7EB',
  },
  ticketRow: {
    marginBottom: 6,
  },
  label: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600',
  },
  value: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 1,
  },
  valueBarber: {
    color: '#F9FAFB',
  },
  valueBeauty: {
    color: '#111827',
  },
  valueSmall: {
    fontSize: 12,
    marginTop: 1,
  },
  valueSmallBarber: {
    color: '#D1D5DB',
  },
  valueSmallBeauty: {
    color: '#4B5563',
  },

  /* Reminder Card */
  reminderCard: {
    width: '100%',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
  },
  reminderCardBarber: {
    backgroundColor: '#202029',
    borderColor: '#3D3418',
  },
  reminderCardBeauty: {
    backgroundColor: '#FFF8F0',
    borderColor: '#F3D299',
  },
  reminderCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  reminderCardIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  reminderCardTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  reminderCardSub: {
    fontSize: 11,
    marginTop: 2,
  },
  reminderCardSubBarber: {
    color: '#CBD5E1',
  },
  reminderCardSubBeauty: {
    color: '#4B5563',
  },
  reminderToggleBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  reminderToggleBtnActiveBarber: {
    backgroundColor: '#D4AF37',
  },
  reminderToggleBtnActiveBeauty: {
    backgroundColor: '#E6C065',
  },
  reminderToggleBtnInactive: {
    backgroundColor: '#374151',
  },
  reminderToggleBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },

  /* Calendar Actions */
  calendarActionWrapper: {
    width: '100%',
  },
  calendarBtn: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  calendarBtnBarber: {
    backgroundColor: '#272733',
    borderColor: '#D4AF37',
  },
  calendarBtnBeauty: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D4AF37',
  },
  calendarBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  calendarDropdown: {
    marginTop: 6,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
  },
  calendarDropdownBarber: {
    backgroundColor: '#1E1E28',
    borderColor: '#3F3F4A',
  },
  calendarDropdownBeauty: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  dropdownOption: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  dropdownOptionText: {
    fontSize: 12,
    fontWeight: '800',
  },
  dropdownTextBarber: {
    color: '#F4F4F5',
  },
  dropdownTextBeauty: {
    color: '#1F2937',
  },
  dropdownOptionHint: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  dropdownDivider: {
    height: 1,
    marginVertical: 4,
  },

  feedbackBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 8,
    alignItems: 'center',
  },
  feedbackText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },

  whatsappBtn: {
    backgroundColor: '#25D366',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  whatsappBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  doneBtn: {
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#0D0D11',
    fontSize: 14,
    fontWeight: '900',
  },
});
