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
import { Appointment } from '../types';
import { Theme } from '../constants/theme';

type TimeFilter = 'today' | 'future' | 'past';

export const StaffView: React.FC = () => {
  const { staff, appointments, updateAppointmentStatus } = useApp();

  // Selected staff member ID ('ALL' or specific staff ID)
  const [selectedStaffId, setSelectedStaffId] = useState<string>('ALL');
  // Branch filter for staff selector ('all' | 'barber' | 'beauty')
  const [branchFilter, setBranchFilter] = useState<'all' | 'barber' | 'beauty'>('all');
  // Active Tab: Hoje (o dia) | Futuro | Passado
  const [activeTab, setActiveTab] = useState<TimeFilter>('today');

  const todayStr = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  const formatDateLabel = (dateStr: string) => {
    if (!dateStr) return '';
    if (dateStr === todayStr) return 'Hoje';

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    if (dateStr === tomorrowStr) return 'Amanhã';

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    if (dateStr === yesterdayStr) return 'Ontem';

    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  // Staff members matching branch filter
  const filteredStaffList = useMemo(() => {
    if (branchFilter === 'all') return staff;
    return staff.filter(s => s.branch === branchFilter);
  }, [staff, branchFilter]);

  const currentStaff = useMemo(() => {
    if (selectedStaffId === 'ALL') return null;
    return staff.find(s => s.id === selectedStaffId) || null;
  }, [staff, selectedStaffId]);

  const accentColor = useMemo(() => {
    if (currentStaff) {
      return currentStaff.branch === 'barber' ? Theme.colors.barber.accent : Theme.colors.beauty.accent;
    }
    if (branchFilter === 'beauty') return Theme.colors.beauty.accent;
    return Theme.colors.barber.accent;
  }, [currentStaff, branchFilter]);

  // Base list of appointments filtered by selected staff member / branch
  const staffAppointments = useMemo(() => {
    return appointments.filter(app => {
      if (selectedStaffId !== 'ALL' && app.staffId !== selectedStaffId) {
        return false;
      }
      if (selectedStaffId === 'ALL' && branchFilter !== 'all' && app.branch !== branchFilter) {
        return false;
      }
      return true;
    });
  }, [appointments, selectedStaffId, branchFilter]);

  // Filtered by Period: Hoje (o dia), Futuro, Passado
  const todayAppointments = useMemo(() => {
    return staffAppointments
      .filter(a => a.date === todayStr && a.status !== 'cancelled')
      .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
  }, [staffAppointments, todayStr]);

  const futureAppointments = useMemo(() => {
    return staffAppointments
      .filter(a => a.date > todayStr && a.status !== 'cancelled')
      .sort((a, b) => {
        const dateComp = a.date.localeCompare(b.date);
        if (dateComp !== 0) return dateComp;
        return a.timeSlot.localeCompare(b.timeSlot);
      });
  }, [staffAppointments, todayStr]);

  const pastAppointments = useMemo(() => {
    return staffAppointments
      .filter(a => a.date < todayStr || a.status === 'cancelled')
      .sort((a, b) => {
        const dateComp = b.date.localeCompare(a.date); // Most recent past first
        if (dateComp !== 0) return dateComp;
        return b.timeSlot.localeCompare(a.timeSlot);
      });
  }, [staffAppointments, todayStr]);

  const currentList = useMemo(() => {
    switch (activeTab) {
      case 'today':
        return todayAppointments;
      case 'future':
        return futureAppointments;
      case 'past':
        return pastAppointments;
      default:
        return todayAppointments;
    }
  }, [activeTab, todayAppointments, futureAppointments, pastAppointments]);

  const handleOpenWhatsApp = (app: Appointment) => {
    const cleanPhone = app.clientPhone.replace(/\s+/g, '');
    const dateLabel = formatDateLabel(app.date);
    const text = encodeURIComponent(
      `Olá ${app.clientName}! Contacto da Almare sobre a sua marcação para ${dateLabel} às ${app.timeSlot} (${app.serviceName}).`
    );
    Linking.openURL(`https://wa.me/${cleanPhone}?text=${text}`);
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={[styles.headerTitle, { color: accentColor }]}>MARCAÇÕES DO STAFF</Text>
          <View style={styles.branchBadgesRow}>
            <TouchableOpacity
              style={[
                styles.branchBadgeBtn,
                branchFilter === 'all' && styles.branchBadgeBtnActive,
              ]}
              onPress={() => setBranchFilter('all')}
            >
              <Text style={[styles.branchBadgeText, branchFilter === 'all' && styles.branchBadgeTextActive]}>
                Todos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.branchBadgeBtn,
                branchFilter === 'barber' && styles.branchBadgeBtnActive,
              ]}
              onPress={() => setBranchFilter('barber')}
            >
              <Text style={[styles.branchBadgeText, branchFilter === 'barber' && styles.branchBadgeTextActive]}>
                Barber
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.branchBadgeBtn,
                branchFilter === 'beauty' && styles.branchBadgeBtnActive,
              ]}
              onPress={() => setBranchFilter('beauty')}
            >
              <Text style={[styles.branchBadgeText, branchFilter === 'beauty' && styles.branchBadgeTextActive]}>
                Beauty
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.headerSub}>Selecione o profissional para ver as suas marcações:</Text>

        {/* Staff Members Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.staffPickerScroll}>
          <TouchableOpacity
            style={[
              styles.staffChip,
              selectedStaffId === 'ALL' && { backgroundColor: accentColor, borderColor: accentColor },
            ]}
            onPress={() => setSelectedStaffId('ALL')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.staffChipText,
                selectedStaffId === 'ALL' && { color: '#111', fontWeight: '900' },
              ]}
            >
              Toda a Equipa
            </Text>
          </TouchableOpacity>

          {filteredStaffList.map(s => {
            const isSelected = s.id === selectedStaffId;
            return (
              <TouchableOpacity
                key={s.id}
                style={[
                  styles.staffChip,
                  isSelected && { backgroundColor: accentColor, borderColor: accentColor },
                ]}
                onPress={() => setSelectedStaffId(s.id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.staffChipText,
                    isSelected && { color: '#111', fontWeight: '900' },
                  ]}
                >
                  {s.name} ({s.branch === 'barber' ? 'Barber' : 'Beauty'})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Selected Staff Info Bar */}
      <View style={styles.currentStaffBar}>
        <View style={styles.currentStaffInfo}>
          <Text style={styles.currentStaffName}>
            {currentStaff ? currentStaff.name : 'Toda a Equipa'}
          </Text>
          <Text style={styles.currentStaffRole}>
            {currentStaff
              ? `${currentStaff.roleTitle} • ${currentStaff.branch === 'barber' ? 'Almare Barber' : 'Almare Beauty'}`
              : `A visualizar todos os profissionais (${filteredStaffList.length} membros)`}
          </Text>
        </View>
      </View>

      {/* 3 Main Tabs: Hoje (o dia) | Futuro | Passado */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'today' && [styles.tabBtnActive, { borderBottomColor: accentColor }]]}
          onPress={() => setActiveTab('today')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'today' && styles.tabBtnTextActive]}>
            Hoje ({todayAppointments.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'future' && [styles.tabBtnActive, { borderBottomColor: accentColor }]]}
          onPress={() => setActiveTab('future')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'future' && styles.tabBtnTextActive]}>
            Futuro ({futureAppointments.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'past' && [styles.tabBtnActive, { borderBottomColor: accentColor }]]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'past' && styles.tabBtnTextActive]}>
            Passado ({pastAppointments.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Appointments List */}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {currentList.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              {activeTab === 'today'
                ? 'Sem marcações para hoje'
                : activeTab === 'future'
                ? 'Sem marcações futuras'
                : 'Sem marcações no histórico passado'}
            </Text>
            <Text style={styles.emptySub}>
              {activeTab === 'today'
                ? 'Não existem clientes agendados para a data de hoje com o filtro selecionado.'
                : activeTab === 'future'
                ? 'Não há novos agendamentos marcados para datas futuras.'
                : 'Não existem registos de marcações anteriores.'}
            </Text>
          </View>
        ) : (
          currentList.map(app => {
            const isCompleted = app.status === 'completed';
            const isCancelled = app.status === 'cancelled';
            const dateLabel = formatDateLabel(app.date);

            return (
              <View key={app.id} style={styles.appointmentCard}>
                {/* Header Row: Horário & Badge de Data / Profissional */}
                <View style={styles.appCardTop}>
                  <View style={styles.timeContainer}>
                    <Text style={[styles.appTimeSlot, { color: accentColor }]}>
                      {app.timeSlot}
                    </Text>
                    <Text style={styles.appDuration}>
                      ({app.serviceDuration} min)
                    </Text>
                  </View>

                  <View style={styles.dateAndStaffContainer}>
                    <View style={styles.dateBadge}>
                      <Text style={styles.dateBadgeText}>{dateLabel}</Text>
                    </View>
                    <View
                      style={[
                        styles.appStatusBadge,
                        isCompleted
                          ? styles.statusCompleted
                          : isCancelled
                          ? styles.statusCancelled
                          : styles.statusConfirmed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.appStatusText,
                          isCompleted
                            ? { color: '#3B82F6' }
                            : isCancelled
                            ? { color: '#EF4444' }
                            : { color: '#10B981' },
                        ]}
                      >
                        {isCompleted ? 'Concluído' : isCancelled ? 'Cancelado' : 'Confirmado'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Staff member responsible (very helpful when viewing All or verifying) */}
                <View style={styles.staffRow}>
                  <Text style={styles.staffLabel}>Profissional:</Text>
                  <Text style={styles.staffNameText}>
                    {app.staffName} ({app.branch === 'barber' ? 'Barber' : 'Beauty'})
                  </Text>
                </View>

                {/* Client info */}
                <View style={styles.clientSection}>
                  <Text style={styles.appClientName}>{app.clientName}</Text>
                  <Text style={styles.appClientPhone}>{app.clientPhone}</Text>
                </View>

                {/* Service details */}
                <View style={styles.appDetailsBox}>
                  <Text style={styles.appServiceName}>{app.serviceName}</Text>
                  <Text style={styles.appPriceText}>
                    Valor: {app.servicePrice.toFixed(2)} € • Data: {app.date}
                  </Text>
                  {app.notes ? (
                    <Text style={styles.appNotesText}>Nota: &quot;{app.notes}&quot;</Text>
                  ) : null}
                </View>

                {/* Actions */}
                <View style={styles.appActionsRow}>
                  <TouchableOpacity
                    style={styles.actionBtnWhatsApp}
                    onPress={() => handleOpenWhatsApp(app)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.actionBtnWhatsAppText}>WhatsApp</Text>
                  </TouchableOpacity>

                  {app.status === 'confirmed' && (
                    <TouchableOpacity
                      style={styles.actionBtnComplete}
                      onPress={() => updateAppointmentStatus(app.id, 'completed')}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.actionBtnCompleteText}>Concluir</Text>
                    </TouchableOpacity>
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
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: '#18181E',
    borderBottomWidth: 1,
    borderBottomColor: '#272730',
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  branchBadgesRow: {
    flexDirection: 'row',
    backgroundColor: '#272730',
    borderRadius: 8,
    padding: 2,
  },
  branchBadgeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  branchBadgeBtnActive: {
    backgroundColor: '#3F3F46',
  },
  branchBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  branchBadgeTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  headerSub: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 6,
    marginBottom: 6,
  },
  staffPickerScroll: {
    flexDirection: 'row',
    marginTop: 2,
  },
  staffChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#272730',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  staffChipText: {
    color: '#D4D4D8',
    fontSize: 12,
    fontWeight: '700',
  },
  currentStaffBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#141419',
    borderBottomWidth: 1,
    borderBottomColor: '#22222A',
  },
  currentStaffInfo: {
    flexDirection: 'column',
  },
  currentStaffName: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  currentStaffRole: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#141419',
    borderBottomWidth: 1,
    borderBottomColor: '#272730',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  tabBtnText: {
    color: '#71717A',
    fontSize: 12,
    fontWeight: '700',
  },
  tabBtnTextActive: {
    color: '#F4F4F5',
    fontWeight: '900',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyCard: {
    backgroundColor: '#18181E',
    padding: 32,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2E2E3A',
    marginTop: 16,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  emptyTitle: {
    color: '#F4F4F5',
    fontSize: 15,
    fontWeight: '800',
  },
  emptySub: {
    color: '#71717A',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    maxWidth: 280,
  },
  appointmentCard: {
    backgroundColor: '#18181E',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2E2E3A',
  },
  appCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#24242E',
    marginBottom: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  appTimeSlot: {
    fontSize: 20,
    fontWeight: '900',
    marginRight: 6,
  },
  appDuration: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  dateAndStaffContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateBadge: {
    backgroundColor: '#272730',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dateBadgeText: {
    color: '#D4D4D8',
    fontSize: 11,
    fontWeight: '700',
  },
  appStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusConfirmed: {
    backgroundColor: 'rgba(16,185,129,0.15)',
  },
  statusCompleted: {
    backgroundColor: 'rgba(59,130,246,0.15)',
  },
  statusCancelled: {
    backgroundColor: 'rgba(239,68,68,0.15)',
  },
  appStatusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  staffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  staffLabel: {
    fontSize: 11,
    color: '#71717A',
    marginRight: 4,
    fontWeight: '600',
  },
  staffNameText: {
    fontSize: 12,
    color: '#E4E4E7',
    fontWeight: '800',
  },
  clientSection: {
    marginVertical: 4,
  },
  appClientName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  appClientPhone: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
    fontWeight: '600',
  },
  appDetailsBox: {
    backgroundColor: '#22222A',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  appServiceName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F4F4F5',
  },
  appPriceText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 3,
  },
  appNotesText: {
    fontSize: 11,
    color: '#FBBF24',
    marginTop: 5,
    fontStyle: 'italic',
  },
  appActionsRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 8,
  },
  actionBtnWhatsApp: {
    flex: 1,
    backgroundColor: '#25D366',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionBtnWhatsAppText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  actionBtnComplete: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionBtnCompleteText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
