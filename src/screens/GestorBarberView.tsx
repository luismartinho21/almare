import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Linking,
  Modal,
  Pressable,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { StaffMember } from '../types';
import { Theme } from '../constants/theme';
import { getGestorNotifyClientWhatsAppUrl } from '../utils/reminderHelper';

type GestorTab = 'appointments' | 'schedules';

export const GestorBarberView: React.FC = () => {
  const { appointments, updateAppointmentStatus, staff, updateStaffWorkingHours, updateStaffMember } = useApp();

  const [activeTab, setActiveTab] = useState<GestorTab>('appointments');
  const [dateFilter, setDateFilter] = useState<'today' | 'all'>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('ALL');

  // Edit Schedule Modal
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [editStart, setEditStart] = useState('09:00');
  const [editEnd, setEditEnd] = useState('19:00');
  const [editLunchStart, setEditLunchStart] = useState('12:00');
  const [editLunchEnd, setEditLunchEnd] = useState('14:00');
  const [editWorkDays, setEditWorkDays] = useState('Terça a Sábado');
  const [feedbackMsg, setFeedbackMsg] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const barberStaff = useMemo(() => staff.filter(s => s.branch === 'barber'), [staff]);

  // Filter Barber appointments
  const barberAppointments = useMemo(() => {
    return appointments.filter(app => {
      if (app.branch !== 'barber') return false;
      if (dateFilter === 'today' && app.date !== todayStr) return false;
      if (selectedStaffFilter !== 'ALL' && app.staffId !== selectedStaffFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = app.clientName.toLowerCase().includes(query);
        const matchPhone = app.clientPhone.includes(query);
        const matchService = app.serviceName.toLowerCase().includes(query);
        return matchName || matchPhone || matchService;
      }
      return true;
    });
  }, [appointments, dateFilter, todayStr, selectedStaffFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const todayApps = appointments.filter(a => a.branch === 'barber' && a.date === todayStr);
    const confirmedCount = todayApps.filter(a => a.status === 'confirmed').length;
    const totalRevenue = todayApps
      .filter(a => a.status !== 'cancelled')
      .reduce((acc, a) => acc + a.servicePrice, 0);

    return {
      totalToday: todayApps.length,
      confirmedToday: confirmedCount,
      revenueToday: totalRevenue,
    };
  }, [appointments, todayStr]);

  const handleOpenEditSchedule = (member: StaffMember) => {
    setEditingStaff(member);
    setEditStart(member.workingHours?.start || '09:00');
    setEditEnd(member.workingHours?.end || '19:00');
    setEditLunchStart(member.workingHours?.lunchStart || '12:00');
    setEditLunchEnd(member.workingHours?.lunchEnd || '14:00');
    setEditWorkDays(member.workDays || 'Terça a Sábado');
    setFeedbackMsg('');
  };

  const handleApplyPreset = (preset: 'standard' | 'morning' | 'afternoon') => {
    if (preset === 'standard') {
      setEditStart('09:00');
      setEditEnd('19:00');
      setEditLunchStart('12:00');
      setEditLunchEnd('14:00');
      setEditWorkDays('Terça a Sábado');
    } else if (preset === 'morning') {
      setEditStart('09:00');
      setEditEnd('13:00');
      setEditLunchStart('13:00');
      setEditLunchEnd('13:00');
      setEditWorkDays('Terça a Sábado');
    } else if (preset === 'afternoon') {
      setEditStart('14:00');
      setEditEnd('19:00');
      setEditLunchStart('14:00');
      setEditLunchEnd('14:00');
      setEditWorkDays('Terça a Sábado');
    }
  };

  const handleSaveSchedule = async () => {
    if (!editingStaff) return;

    const updatedMember: StaffMember = {
      ...editingStaff,
      workDays: editWorkDays.trim() || 'Terça a Sábado',
      workingHours: {
        start: editStart.trim() || '09:00',
        end: editEnd.trim() || '19:00',
        lunchStart: editLunchStart.trim() || '12:00',
        lunchEnd: editLunchEnd.trim() || '14:00',
      },
    };

    await updateStaffMember(updatedMember);
    setFeedbackMsg(`Horário de ${editingStaff.name} atualizado com sucesso!`);
    setTimeout(() => {
      setEditingStaff(null);
      setFeedbackMsg('');
    }, 1200);
  };

  return (
    <View style={styles.container}>
      {/* Dashboard Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>PAINEL DE GESTÃO - BARBER</Text>
          <Text style={styles.headerSub}>Almare Barber Shop • Acesso Exclusivo Gestor</Text>
        </View>
      </View>

      {/* Tabs: Agenda & Marcações | Horários da Equipa */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'appointments' && styles.tabBtnActive]}
          onPress={() => setActiveTab('appointments')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'appointments' && styles.tabBtnTextActive]}>
            Marcações ({barberAppointments.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'schedules' && styles.tabBtnActive]}
          onPress={() => setActiveTab('schedules')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'schedules' && styles.tabBtnTextActive]}>
            Definir Horários da Equipa ({barberStaff.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ============================================================ */}
        {/* TAB 1: AGENDA & MARCAÇÕES */}
        {/* ============================================================ */}
        {activeTab === 'appointments' && (
          <View>
            {/* KPI Stat Cards */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statNumber}>{stats.totalToday}</Text>
                <Text style={styles.statLabel}>Marcações Hoje</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={[styles.statNumber, { color: Theme.colors.barber.accent }]}>
                  {stats.revenueToday.toFixed(0)} €
                </Text>
                <Text style={styles.statLabel}>Faturamento Estimado</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={[styles.statNumber, { color: '#10B981' }]}>{stats.confirmedToday}</Text>
                <Text style={styles.statLabel}>Vagas Confirmadas</Text>
              </View>
            </View>

            {/* Filter Toolbar */}
            <View style={styles.toolbar}>
              <View style={styles.dateToggleRow}>
                <TouchableOpacity
                  style={[styles.toggleBtn, dateFilter === 'today' && styles.toggleBtnActive]}
                  onPress={() => setDateFilter('today')}
                >
                  <Text style={[styles.toggleBtnText, dateFilter === 'today' && styles.toggleBtnTextActive]}>
                    Hoje ({todayStr})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.toggleBtn, dateFilter === 'all' && styles.toggleBtnActive]}
                  onPress={() => setDateFilter('all')}
                >
                  <Text style={[styles.toggleBtnText, dateFilter === 'all' && styles.toggleBtnTextActive]}>
                    Todas as Datas
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Staff Filter */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.staffFilterScroll}>
                <TouchableOpacity
                  style={[styles.staffFilterChip, selectedStaffFilter === 'ALL' && styles.staffFilterChipActive]}
                  onPress={() => setSelectedStaffFilter('ALL')}
                >
                  <Text
                    style={[
                      styles.staffFilterChipText,
                      selectedStaffFilter === 'ALL' && styles.staffFilterChipTextActive,
                    ]}
                  >
                    Todos os Barbeiros
                  </Text>
                </TouchableOpacity>

                {barberStaff.map(s => (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.staffFilterChip, selectedStaffFilter === s.id && styles.staffFilterChipActive]}
                    onPress={() => setSelectedStaffFilter(s.id)}
                  >
                    <Text
                      style={[
                        styles.staffFilterChipText,
                        selectedStaffFilter === s.id && styles.staffFilterChipTextActive,
                      ]}
                    >
                      {s.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Search Bar */}
              <TextInput
                style={styles.searchInput}
                placeholder="Pesquisar por cliente, telemóvel ou serviço..."
                placeholderTextColor="#71717A"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Appointments List Header */}
            <Text style={styles.sectionTitle}>
              Agenda de Marcações ({barberAppointments.length})
            </Text>

            {barberAppointments.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>Sem marcações encontradas</Text>
                <Text style={styles.emptySub}>
                  Não existem marcações registadas para os filtros selecionados.
                </Text>
              </View>
            ) : (
              barberAppointments.map(app => (
                <View key={app.id} style={styles.appCard}>
                  <View style={styles.appCardHeader}>
                    <View style={styles.timeBadge}>
                      <Text style={styles.timeBadgeText}>{app.timeSlot}</Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        app.status === 'confirmed' && { backgroundColor: 'rgba(16,185,129,0.2)' },
                        app.status === 'completed' && { backgroundColor: 'rgba(59,130,246,0.2)' },
                        app.status === 'cancelled' && { backgroundColor: 'rgba(239,68,68,0.2)' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          app.status === 'confirmed' && { color: '#10B981' },
                          app.status === 'completed' && { color: '#3B82F6' },
                          app.status === 'cancelled' && { color: '#EF4444' },
                        ]}
                      >
                        {app.status === 'confirmed'
                          ? 'Confirmado'
                          : app.status === 'completed'
                          ? 'Concluído'
                          : 'Cancelado'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.clientName}>{app.clientName}</Text>
                  <Text style={styles.clientPhone}>Tel: {app.clientPhone}</Text>

                  <View style={styles.detailsBox}>
                    <Text style={styles.serviceName}>{app.serviceName}</Text>
                    <Text style={styles.staffName}>Profissional: {app.staffName}</Text>
                    <Text style={styles.priceDuration}>
                      {app.servicePrice.toFixed(2)} € • {app.serviceDuration} min • Data: {app.date}
                    </Text>
                    {app.notes ? <Text style={styles.notesText}>Nota: "{app.notes}"</Text> : null}
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.actionsRow}>
                    {app.status === 'confirmed' && (
                      <TouchableOpacity
                        style={styles.notifyBtn}
                        onPress={() => {
                          const url = getGestorNotifyClientWhatsAppUrl(app, 'Almare Barber Shop');
                          Linking.openURL(url);
                        }}
                      >
                        <Text style={styles.notifyBtnText}>WhatsApp</Text>
                      </TouchableOpacity>
                    )}

                    {app.status === 'confirmed' && (
                      <TouchableOpacity
                        style={styles.completeBtn}
                        onPress={() => updateAppointmentStatus(app.id, 'completed')}
                      >
                        <Text style={styles.completeBtnText}>Concluir</Text>
                      </TouchableOpacity>
                    )}

                    {app.status !== 'cancelled' && (
                      <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={() => updateAppointmentStatus(app.id, 'cancelled')}
                      >
                        <Text style={styles.cancelBtnText}>Cancelar</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ============================================================ */}
        {/* TAB 2: DEFINIR HORÁRIOS DA EQUIPA */}
        {/* ============================================================ */}
        {activeTab === 'schedules' && (
          <View>
            <View style={styles.standardScheduleBanner}>
              <Text style={styles.standardScheduleLabel}>HORÁRIO GERAL DO SALÃO DEFINIDO</Text>
              <Text style={styles.standardScheduleTitle}>
                Terça a Sábado das 09:00 às 12:00 e das 14:00 às 19:00
              </Text>
              <Text style={styles.standardScheduleSub}>
                O gestor pode personalizar individualmente a escala de cada barbeiro abaixo.
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Escala da Equipa de Barbeiros ({barberStaff.length})</Text>

            {barberStaff.map(member => (
              <View key={member.id} style={styles.scheduleConfigCard}>
                <View style={styles.scheduleConfigHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.scheduleConfigName}>{member.name}</Text>
                    <Text style={styles.scheduleConfigRole}>{member.roleTitle}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.editScheduleBtn}
                    onPress={() => handleOpenEditSchedule(member)}
                  >
                    <Text style={styles.editScheduleBtnText}>Definir Horário</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.scheduleValuesBox}>
                  <View style={styles.scheduleValueCol}>
                    <Text style={styles.scheduleValueLabel}>Dias Ativos</Text>
                    <Text style={styles.scheduleValueText}>{member.workDays || 'Terça a Sábado'}</Text>
                  </View>

                  <View style={styles.scheduleValueCol}>
                    <Text style={styles.scheduleValueLabel}>Manhã</Text>
                    <Text style={styles.scheduleValueText}>
                      {member.workingHours?.start || '09:00'} - {member.workingHours?.lunchStart || '12:00'}
                    </Text>
                  </View>

                  <View style={styles.scheduleValueCol}>
                    <Text style={styles.scheduleValueLabel}>Tarde</Text>
                    <Text style={styles.scheduleValueText}>
                      {member.workingHours?.lunchEnd || '14:00'} - {member.workingHours?.end || '19:00'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.schedulePauseHint}>
                  Pausa de almoço: {member.workingHours?.lunchStart || '12:00'} às{' '}
                  {member.workingHours?.lunchEnd || '14:00'}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Modal: Editar Horário do Funcionário */}
      <Modal visible={!!editingStaff} transparent animationType="slide" onRequestClose={() => setEditingStaff(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setEditingStaff(null)}>
          <Pressable style={styles.modalBody} onPress={e => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Definir Horário de {editingStaff?.name}</Text>
            <Text style={styles.modalSub}>
              Configuração oficial do gestor para vagas de agendamento e visibilidade do staff.
            </Text>

            {/* Presets Rápidos */}
            <Text style={styles.presetTitle}>Predefinições Rápidas:</Text>
            <View style={styles.presetRow}>
              <TouchableOpacity
                style={styles.presetBtn}
                onPress={() => handleApplyPreset('standard')}
              >
                <Text style={styles.presetBtnText}>Padrão (09:00-12:00 / 14:00-19:00)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetBtn}
                onPress={() => handleApplyPreset('morning')}
              >
                <Text style={styles.presetBtnText}>Só Manhã (09:00-13:00)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.presetBtn}
                onPress={() => handleApplyPreset('afternoon')}
              >
                <Text style={styles.presetBtnText}>Só Tarde (14:00-19:00)</Text>
              </TouchableOpacity>
            </View>

            {/* Campos de Horário */}
            <View style={styles.formGrid}>
              <View style={styles.formCol}>
                <Text style={styles.modalLabel}>Hora de Entrada</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editStart}
                  onChangeText={setEditStart}
                  placeholder="09:00"
                  placeholderTextColor="#71717A"
                />
              </View>

              <View style={styles.formCol}>
                <Text style={styles.modalLabel}>Hora de Saída</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editEnd}
                  onChangeText={setEditEnd}
                  placeholder="19:00"
                  placeholderTextColor="#71717A"
                />
              </View>
            </View>

            <View style={styles.formGrid}>
              <View style={styles.formCol}>
                <Text style={styles.modalLabel}>Início Almoço</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editLunchStart}
                  onChangeText={setEditLunchStart}
                  placeholder="12:00"
                  placeholderTextColor="#71717A"
                />
              </View>

              <View style={styles.formCol}>
                <Text style={styles.modalLabel}>Fim Almoço</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editLunchEnd}
                  onChangeText={setEditLunchEnd}
                  placeholder="14:00"
                  placeholderTextColor="#71717A"
                />
              </View>
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Dias de Trabalho</Text>
              <TextInput
                style={styles.modalInput}
                value={editWorkDays}
                onChangeText={setEditWorkDays}
                placeholder="Terça a Sábado"
                placeholderTextColor="#71717A"
              />
            </View>

            {feedbackMsg ? <Text style={styles.feedbackSuccessText}>{feedbackMsg}</Text> : null}

            <TouchableOpacity style={styles.saveScheduleBtn} onPress={handleSaveSchedule}>
              <Text style={styles.saveScheduleBtnText}>Guardar Horário do Funcionário</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setEditingStaff(null)}>
              <Text style={styles.cancelModalBtnText}>Fechar</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D11',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#18181C',
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
  },
  headerTitle: {
    color: Theme.colors.barber.accent,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  headerSub: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 2,
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
    borderBottomColor: '#D4AF37',
  },
  tabBtnText: {
    color: '#71717A',
    fontSize: 12,
    fontWeight: '700',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#18181C',
    padding: 12,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#27272A',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F4F4F5',
  },
  statLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  toolbar: {
    marginBottom: 16,
  },
  dateToggleRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#18181C',
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  toggleBtnActive: {
    backgroundColor: Theme.colors.barber.accent,
    borderColor: Theme.colors.barber.accent,
  },
  toggleBtnText: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '700',
  },
  toggleBtnTextActive: {
    color: '#111827',
  },
  staffFilterScroll: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  staffFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#18181C',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  staffFilterChipActive: {
    backgroundColor: '#272730',
    borderColor: '#D4AF37',
  },
  staffFilterChipText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '700',
  },
  staffFilterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  searchInput: {
    backgroundColor: '#18181C',
    borderColor: '#27272A',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#FFF',
    fontSize: 13,
  },
  sectionTitle: {
    color: '#F4F4F5',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 10,
  },
  emptyState: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#18181C',
    borderRadius: 14,
  },
  emptyTitle: {
    color: '#F3F4F6',
    fontSize: 15,
    fontWeight: '700',
  },
  emptySub: {
    color: '#71717A',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  appCard: {
    backgroundColor: '#18181C',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  appCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeBadge: {
    backgroundColor: '#272730',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timeBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  clientName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  clientPhone: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 1,
  },
  detailsBox: {
    backgroundColor: '#202026',
    borderRadius: 10,
    padding: 10,
    marginVertical: 10,
  },
  serviceName: {
    color: '#E5E7EB',
    fontSize: 13,
    fontWeight: '700',
  },
  staffName: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  priceDuration: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 2,
  },
  notesText: {
    color: '#FBBF24',
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  notifyBtn: {
    backgroundColor: '#25D366',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  notifyBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  completeBtn: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
  },
  completeBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  cancelBtn: {
    backgroundColor: '#272730',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  cancelBtnText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
  },
  /* Tab 2: Schedules Styles */
  standardScheduleBanner: {
    backgroundColor: '#18181E',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#3D3418',
  },
  standardScheduleLabel: {
    color: '#D4AF37',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  standardScheduleTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 3,
  },
  standardScheduleSub: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 2,
  },
  scheduleConfigCard: {
    backgroundColor: '#18181E',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  scheduleConfigHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  scheduleConfigName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  scheduleConfigRole: {
    color: '#D4AF37',
    fontSize: 12,
    marginTop: 1,
  },
  editScheduleBtn: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editScheduleBtnText: {
    color: '#111',
    fontSize: 11,
    fontWeight: '800',
  },
  scheduleValuesBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#22222A',
    borderRadius: 8,
    padding: 10,
  },
  scheduleValueCol: {
    flex: 1,
  },
  scheduleValueLabel: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '600',
  },
  scheduleValueText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  schedulePauseHint: {
    color: '#71717A',
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 8,
  },
  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalBody: {
    backgroundColor: '#18181E',
    borderRadius: 16,
    padding: 18,
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  modalSub: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 2,
    marginBottom: 12,
  },
  presetTitle: {
    color: '#D4AF37',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 6,
  },
  presetRow: {
    marginBottom: 12,
    gap: 6,
  },
  presetBtn: {
    backgroundColor: '#272730',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  presetBtnText: {
    color: '#D4D4D8',
    fontSize: 11,
    fontWeight: '700',
  },
  formGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  formCol: {
    flex: 1,
  },
  modalField: {
    marginBottom: 10,
  },
  modalLabel: {
    color: '#D4D4D8',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: '#272730',
    borderColor: '#3F3F46',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    color: '#FFF',
    fontSize: 13,
  },
  feedbackSuccessText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  saveScheduleBtn: {
    backgroundColor: '#D4AF37',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  saveScheduleBtnText: {
    color: '#111',
    fontSize: 13,
    fontWeight: '900',
  },
  cancelModalBtn: {
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  cancelModalBtnText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
});
