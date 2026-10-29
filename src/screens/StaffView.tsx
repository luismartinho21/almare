import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { Appointment, StaffMember } from '../types';
import { Theme } from '../constants/theme';

export const StaffView: React.FC = () => {
  const {
    staff,
    appointments,
    updateAppointmentStatus,
    currentStaffId,
    setCurrentStaffId,
    currentStaffMember,
    setRole,
  } = useApp();

  const todayStr = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  // Selected date for "O Dia" view
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Active staff: either currently authenticated staff member or first fallback
  const activeStaff: StaffMember | null = useMemo(() => {
    if (currentStaffMember) return currentStaffMember;
    if (currentStaffId) {
      const found = staff.find(s => s.id === currentStaffId);
      if (found) return found;
    }
    return null;
  }, [currentStaffMember, currentStaffId, staff]);

  const accentColor = useMemo(() => {
    if (activeStaff) {
      return activeStaff.branch === 'barber' ? Theme.colors.barber.accent : Theme.colors.beauty.accent;
    }
    return Theme.colors.barber.accent;
  }, [activeStaff]);

  // Navigate dates
  const handlePrevDay = () => {
    const cur = new Date(selectedDate + 'T00:00:00');
    cur.setDate(cur.getDate() - 1);
    setSelectedDate(cur.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const cur = new Date(selectedDate + 'T00:00:00');
    cur.setDate(cur.getDate() + 1);
    setSelectedDate(cur.toISOString().split('T')[0]);
  };

  const handleGoToday = () => {
    setSelectedDate(todayStr);
  };

  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return '';
    if (dateStr === todayStr) return 'Hoje';

    const today = new Date(todayStr + 'T00:00:00');
    const target = new Date(dateStr + 'T00:00:00');

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    if (dateStr === tomorrow.toISOString().split('T')[0]) return 'Amanhã';

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (dateStr === yesterday.toISOString().split('T')[0]) return 'Ontem';

    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    const dayName = days[target.getDay()];
    const dayNum = target.getDate();
    const monthName = months[target.getMonth()];

    return `${dayName}, ${dayNum} ${monthName}`;
  };

  const formatFullDateDisplay = (dateStr: string) => {
    const target = new Date(dateStr + 'T00:00:00');
    const daysFull = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const monthsFull = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const dayOfWeek = daysFull[target.getDay()];
    const dayNum = target.getDate();
    const month = monthsFull[target.getMonth()];
    const year = target.getFullYear();

    const prefix = dateStr === todayStr ? 'Hoje • ' : '';
    return `${prefix}${dayOfWeek}, ${dayNum} de ${month} de ${year}`;
  };

  // Base list of appointments for this specific employee
  const employeeAppointments = useMemo(() => {
    if (!activeStaff) return [];
    return appointments.filter(app => app.staffId === activeStaff.id);
  }, [appointments, activeStaff]);

  // Appointments for the selected day
  const dayAppointments = useMemo(() => {
    return employeeAppointments
      .filter(a => a.date === selectedDate)
      .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
  }, [employeeAppointments, selectedDate]);

  // Daily statistics
  const dailyStats = useMemo(() => {
    const totalClients = dayAppointments.length;
    const completed = dayAppointments.filter(a => a.status === 'completed').length;
    const pending = dayAppointments.filter(a => a.status === 'confirmed').length;
    const cancelled = dayAppointments.filter(a => a.status === 'cancelled').length;
    const expectedRevenue = dayAppointments
      .filter(a => a.status !== 'cancelled')
      .reduce((acc, a) => acc + (a.servicePrice || 0), 0);

    return { totalClients, completed, pending, cancelled, expectedRevenue };
  }, [dayAppointments]);

  const handleOpenWhatsApp = (app: Appointment) => {
    const cleanPhone = app.clientPhone.replace(/\s+/g, '');
    const dateLabel = formatDateLabel(app.date);
    const text = encodeURIComponent(
      `Olá ${app.clientName}! Contacto do(a) seu(sua) profissional na Almare sobre a sua marcação para ${dateLabel} às ${app.timeSlot} (${app.serviceName}).`
    );
    Linking.openURL(`https://wa.me/${cleanPhone}?text=${text}`);
  };

  const handleLogout = () => {
    setCurrentStaffId(null);
    setRole('client');
  };

  // -------------------------------------------------------------
  // If no staff member is selected, show profile chooser
  // -------------------------------------------------------------
  if (!activeStaff) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: Theme.colors.barber.accent }]}>
            PERFIS DOS FUNCIONÁRIOS
          </Text>
          <Text style={styles.headerSub}>
            Selecione o seu perfil profissional para consultar a sua agenda diária e serviços:
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Equipa Barber Shop</Text>
          {staff
            .filter(s => s.branch === 'barber')
            .map(member => (
              <TouchableOpacity
                key={member.id}
                style={[styles.staffSelectCard, { borderColor: Theme.colors.barber.accent }]}
                onPress={() => setCurrentStaffId(member.id)}
                activeOpacity={0.8}
              >
                <View style={styles.staffSelectInfo}>
                  <Text style={styles.staffSelectName}>{member.name}</Text>
                  <Text style={styles.staffSelectRole}>{member.roleTitle}</Text>
                  <View style={styles.pinTag}>
                    <Text style={styles.pinTagText}>🔑 Código PIN: {member.pin || '1001'}</Text>
                  </View>
                </View>
                <View style={[styles.staffSelectBtn, { backgroundColor: Theme.colors.barber.accent }]}>
                  <Text style={styles.staffSelectBtnText}>Ver Agenda</Text>
                </View>
              </TouchableOpacity>
            ))}

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Equipa Beauty Salon</Text>
          {staff
            .filter(s => s.branch === 'beauty')
            .map(member => (
              <TouchableOpacity
                key={member.id}
                style={[styles.staffSelectCard, { borderColor: Theme.colors.beauty.accent }]}
                onPress={() => setCurrentStaffId(member.id)}
                activeOpacity={0.8}
              >
                <View style={styles.staffSelectInfo}>
                  <Text style={styles.staffSelectName}>{member.name}</Text>
                  <Text style={styles.staffSelectRole}>{member.roleTitle}</Text>
                  <View style={styles.pinTag}>
                    <Text style={styles.pinTagText}>🔑 Código PIN: {member.pin || '2001'}</Text>
                  </View>
                </View>
                <View style={[styles.staffSelectBtn, { backgroundColor: Theme.colors.beauty.accent }]}>
                  <Text style={styles.staffSelectBtnText}>Ver Agenda</Text>
                </View>
              </TouchableOpacity>
            ))}

          <TouchableOpacity style={styles.logoutFullBtn} onPress={handleLogout} activeOpacity={0.8}>
            <Text style={styles.logoutFullBtnText}>Voltar ao Menu Principal</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // -------------------------------------------------------------
  // Dedicated Individual Employee View:
  // "apenas com o dia, clientes e serviços de trabalho para cada um individual"
  // -------------------------------------------------------------
  return (
    <View style={styles.container}>
      {/* Employee Profile Header */}
      <View style={styles.header}>
        <View style={styles.profileHeaderRow}>
          <View style={styles.profileAvatarBox}>
            <Text style={[styles.profileAvatarText, { color: accentColor }]}>
              {activeStaff.name.charAt(0).toUpperCase()}
            </Text>
          </View>

          <View style={styles.profileInfoCol}>
            <Text style={styles.greetingText}>Olá,</Text>
            <Text style={[styles.profileName, { color: accentColor }]}>{activeStaff.name}</Text>
            <Text style={styles.profileRoleText}>
              {activeStaff.roleTitle} • {activeStaff.branch === 'barber' ? 'Almare Barber' : 'Almare Beauty'}
            </Text>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
            <Text style={styles.logoutBtnText}>Sair</Text>
          </TouchableOpacity>
        </View>

        {/* PIN Badge & Working Hours */}
        <View style={styles.profileDetailsRow}>
          <View style={styles.pinBadge}>
            <Text style={styles.pinBadgeIcon}>🔑</Text>
            <Text style={styles.pinBadgeLabel}>Código:</Text>
            <Text style={styles.pinBadgeValue}>{activeStaff.pin || '----'}</Text>
          </View>

          <View style={styles.hoursBadge}>
            <Text style={styles.hoursBadgeText}>
              🕒 {activeStaff.workingHours?.start || '09:00'} - {activeStaff.workingHours?.end || '19:00'}
            </Text>
          </View>
        </View>
      </View>

      {/* Date Navigation Bar: "O Dia" */}
      <View style={styles.dayNavContainer}>
        <View style={styles.dayNavHeader}>
          <Text style={[styles.dayNavSectionTitle, { color: accentColor }]}>O DIA DE TRABALHO</Text>
          {selectedDate !== todayStr && (
            <TouchableOpacity style={styles.todayQuickBtn} onPress={handleGoToday}>
              <Text style={styles.todayQuickBtnText}>Ir para Hoje</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.dayNavControls}>
          <TouchableOpacity style={styles.dayNavArrowBtn} onPress={handlePrevDay} activeOpacity={0.7}>
            <Text style={styles.dayNavArrowText}>◀</Text>
            <Text style={styles.dayNavSubText}>Anterior</Text>
          </TouchableOpacity>

          <View style={styles.dayNavDisplayBox}>
            <Text style={styles.dayNavLabelText}>{formatDateLabel(selectedDate)}</Text>
            <Text style={styles.dayNavFullDateText}>{formatFullDateDisplay(selectedDate)}</Text>
          </View>

          <TouchableOpacity style={styles.dayNavArrowBtn} onPress={handleNextDay} activeOpacity={0.7}>
            <Text style={styles.dayNavArrowText}>▶</Text>
            <Text style={styles.dayNavSubText}>Seguinte</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Daily Metrics Summary */}
      <View style={styles.statsSummaryRow}>
        <View style={styles.statMetricCard}>
          <Text style={styles.statMetricValue}>{dailyStats.totalClients}</Text>
          <Text style={styles.statMetricLabel}>Clientes Hoje</Text>
        </View>

        <View style={styles.statMetricCard}>
          <Text style={[styles.statMetricValue, { color: '#10B981' }]}>{dailyStats.completed}</Text>
          <Text style={styles.statMetricLabel}>Concluídos</Text>
        </View>

        <View style={styles.statMetricCard}>
          <Text style={[styles.statMetricValue, { color: '#F59E0B' }]}>{dailyStats.pending}</Text>
          <Text style={styles.statMetricLabel}>A Realizar</Text>
        </View>

        <View style={styles.statMetricCard}>
          <Text style={[styles.statMetricValue, { color: accentColor }]}>
            {dailyStats.expectedRevenue.toFixed(0)} €
          </Text>
          <Text style={styles.statMetricLabel}>Total Previsto</Text>
        </View>
      </View>

      {/* Clients & Work Services List */}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.listHeaderRow}>
          <Text style={styles.listHeaderTitle}>
            Clientes e Serviços Agendados ({dayAppointments.length})
          </Text>
        </View>

        {dayAppointments.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={styles.emptyTitle}>Sem marcações para este dia</Text>
            <Text style={styles.emptySub}>
              Não existem clientes agendados para {formatDateLabel(selectedDate).toLowerCase()} ({selectedDate}).
            </Text>
            {selectedDate !== todayStr && (
              <TouchableOpacity
                style={[styles.goTodayBtn, { backgroundColor: accentColor }]}
                onPress={handleGoToday}
              >
                <Text style={styles.goTodayBtnText}>Ver Marcações de Hoje</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          dayAppointments.map(app => {
            const isCompleted = app.status === 'completed';
            const isCancelled = app.status === 'cancelled';
            const isConfirmed = app.status === 'confirmed';

            return (
              <View
                key={app.id}
                style={[
                  styles.clientWorkCard,
                  isCompleted && styles.clientWorkCardCompleted,
                  isCancelled && styles.clientWorkCardCancelled,
                ]}
              >
                {/* Card Top: Horário e Estado */}
                <View style={styles.cardTopRow}>
                  <View style={styles.timeSlotBadge}>
                    <Text style={[styles.timeSlotText, { color: accentColor }]}>
                      {app.timeSlot}
                    </Text>
                    <Text style={styles.durationSubText}>({app.serviceDuration} min)</Text>
                  </View>

                  <View
                    style={[
                      styles.statusPill,
                      isCompleted && styles.statusPillCompleted,
                      isCancelled && styles.statusPillCancelled,
                      isConfirmed && styles.statusPillConfirmed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        isCompleted && { color: '#3B82F6' },
                        isCancelled && { color: '#EF4444' },
                        isConfirmed && { color: '#10B981' },
                      ]}
                    >
                      {isCompleted ? '✓ Concluído' : isCancelled ? '✕ Cancelado' : '● Agendado'}
                    </Text>
                  </View>
                </View>

                {/* Cliente */}
                <View style={styles.clientSection}>
                  <Text style={styles.clientLabel}>CLIENTE:</Text>
                  <Text style={styles.clientName}>{app.clientName}</Text>
                  <Text style={styles.clientPhone}>{app.clientPhone}</Text>
                </View>

                {/* Serviços de Trabalho */}
                <View style={styles.servicesBox}>
                  <Text style={styles.servicesBoxLabel}>SERVIÇO DE TRABALHO:</Text>
                  <Text style={styles.serviceTitle}>{app.serviceName}</Text>
                  <View style={styles.serviceMetaRow}>
                    <Text style={styles.serviceMetaItem}>Duração: {app.serviceDuration} minutos</Text>
                    <Text style={styles.serviceMetaDivider}>•</Text>
                    <Text style={[styles.serviceMetaItem, { color: accentColor, fontWeight: '800' }]}>
                      Valor: {app.servicePrice.toFixed(2)} €
                    </Text>
                  </View>

                  {app.notes ? (
                    <View style={styles.notesBox}>
                      <Text style={styles.notesLabel}>Nota do Cliente / Pedido:</Text>
                      <Text style={styles.notesText}>&quot;{app.notes}&quot;</Text>
                    </View>
                  ) : null}
                </View>

                {/* Botões de Ação */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={styles.whatsAppBtn}
                    onPress={() => handleOpenWhatsApp(app)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.whatsAppBtnText}>WhatsApp</Text>
                  </TouchableOpacity>

                  {isConfirmed && (
                    <TouchableOpacity
                      style={[styles.completeBtn, { backgroundColor: accentColor }]}
                      onPress={() => updateAppointmentStatus(app.id, 'completed')}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.completeBtnText}>✓ Concluir Serviço</Text>
                    </TouchableOpacity>
                  )}

                  {isCompleted && (
                    <View style={styles.completedIndicator}>
                      <Text style={styles.completedIndicatorText}>Serviço Finalizado</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D11',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: '#18181E',
    borderBottomWidth: 1,
    borderBottomColor: '#272730',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  headerSub: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    lineHeight: 17,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatarBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#272730',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#3F3F46',
  },
  profileAvatarText: {
    fontSize: 22,
    fontWeight: '900',
  },
  profileInfoCol: {
    flex: 1,
  },
  greetingText: {
    fontSize: 11,
    color: '#A1A1AA',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  profileName: {
    fontSize: 19,
    fontWeight: '900',
  },
  profileRoleText: {
    fontSize: 12,
    color: '#D4D4D8',
    marginTop: 2,
  },
  logoutBtn: {
    backgroundColor: '#272730',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  logoutBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '800',
  },
  profileDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  pinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22222A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3A3A46',
  },
  pinBadgeIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  pinBadgeLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
    marginRight: 4,
  },
  pinBadgeValue: {
    fontSize: 13,
    color: '#F4F4F5',
    fontWeight: '900',
    letterSpacing: 2,
  },
  hoursBadge: {
    backgroundColor: '#22222A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3A3A46',
  },
  hoursBadgeText: {
    fontSize: 11,
    color: '#D4D4D8',
    fontWeight: '600',
  },
  dayNavContainer: {
    backgroundColor: '#15151B',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#22222A',
  },
  dayNavHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayNavSectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  todayQuickBtn: {
    backgroundColor: '#272730',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  todayQuickBtnText: {
    color: '#F4F4F5',
    fontSize: 11,
    fontWeight: '700',
  },
  dayNavControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E1E26',
    borderRadius: 10,
    padding: 6,
  },
  dayNavArrowBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNavArrowText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  dayNavSubText: {
    color: '#71717A',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },
  dayNavDisplayBox: {
    alignItems: 'center',
    flex: 1,
  },
  dayNavLabelText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  dayNavFullDateText: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 2,
  },
  statsSummaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#111116',
    borderBottomWidth: 1,
    borderBottomColor: '#22222A',
    gap: 8,
  },
  statMetricCard: {
    flex: 1,
    backgroundColor: '#1A1A22',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A34',
  },
  statMetricValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#F4F4F5',
  },
  statMetricLabel: {
    fontSize: 9,
    color: '#71717A',
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  listHeaderRow: {
    marginBottom: 12,
  },
  listHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#D4D4D8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  clientWorkCard: {
    backgroundColor: '#18181E',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#272730',
  },
  clientWorkCardCompleted: {
    borderColor: '#1E3A5F',
    backgroundColor: '#121722',
    opacity: 0.9,
  },
  clientWorkCardCancelled: {
    borderColor: '#3F1D1D',
    backgroundColor: '#191214',
    opacity: 0.7,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#22222A',
    paddingBottom: 8,
  },
  timeSlotBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  timeSlotText: {
    fontSize: 22,
    fontWeight: '900',
  },
  durationSubText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillConfirmed: {
    backgroundColor: 'rgba(16,185,129,0.15)',
  },
  statusPillCompleted: {
    backgroundColor: 'rgba(59,130,246,0.15)',
  },
  statusPillCancelled: {
    backgroundColor: 'rgba(239,68,68,0.15)',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  clientSection: {
    marginBottom: 8,
  },
  clientLabel: {
    fontSize: 10,
    color: '#71717A',
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  clientName: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
  },
  clientPhone: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
    fontWeight: '600',
  },
  servicesBox: {
    backgroundColor: '#202028',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  servicesBoxLabel: {
    fontSize: 9,
    color: '#71717A',
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F4F4F5',
  },
  serviceMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  serviceMetaItem: {
    fontSize: 11,
    color: '#A1A1AA',
  },
  serviceMetaDivider: {
    color: '#52525B',
    fontSize: 10,
  },
  notesBox: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#2B2B36',
  },
  notesLabel: {
    fontSize: 10,
    color: '#FBBF24',
    fontWeight: '700',
  },
  notesText: {
    fontSize: 11,
    color: '#FDE68A',
    fontStyle: 'italic',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  whatsAppBtn: {
    flex: 1,
    backgroundColor: '#25D366',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  whatsAppBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  completeBtn: {
    flex: 1.3,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeBtnText: {
    color: '#111116',
    fontSize: 12,
    fontWeight: '900',
  },
  completedIndicator: {
    flex: 1.3,
    backgroundColor: '#1E293B',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  completedIndicatorText: {
    color: '#60A5FA',
    fontSize: 11,
    fontWeight: '800',
  },
  emptyCard: {
    backgroundColor: '#18181E',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#272730',
    marginTop: 10,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F4F4F5',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  goTodayBtn: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  goTodayBtnText: {
    color: '#111116',
    fontSize: 12,
    fontWeight: '800',
  },
  // Selection view styles
  sectionTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  staffSelectCard: {
    backgroundColor: '#18181E',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 4,
  },
  staffSelectInfo: {
    flex: 1,
  },
  staffSelectName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  staffSelectRole: {
    fontSize: 12,
    color: '#A1A1AA',
    marginTop: 2,
  },
  pinTag: {
    backgroundColor: '#272730',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginTop: 6,
  },
  pinTagText: {
    fontSize: 11,
    color: '#E4E4E7',
    fontWeight: '700',
  },
  staffSelectBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 10,
  },
  staffSelectBtnText: {
    color: '#111116',
    fontSize: 12,
    fontWeight: '900',
  },
  logoutFullBtn: {
    backgroundColor: '#272730',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutFullBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '800',
  },
});
