import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  Pressable,
  Linking,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { StaffMember, ClientHistoryNote, Appointment } from '../types';
import { Theme } from '../constants/theme';

type StaffTab = 'personal' | 'team' | 'history';

export const StaffView: React.FC = () => {
  const { staff, appointments, clientHistory, addStaffNoteForClient, updateAppointmentStatus } = useApp();

  const [selectedStaffId, setSelectedStaffId] = useState<string>(staff[0]?.id || '');
  const [activeTab, setActiveTab] = useState<StaffTab>('personal');
  const [dateFilter, setDateFilter] = useState<'today' | 'tomorrow' | 'all'>('today');
  const [teamMemberFilter, setTeamMemberFilter] = useState<string>('ALL');
  const [historySearch, setHistorySearch] = useState('');

  // Add Note Modal
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [details, setDetails] = useState('');

  const currentStaff = useMemo(() => {
    return staff.find(s => s.id === selectedStaffId) || staff[0];
  }, [staff, selectedStaffId]);

  const isBarber = currentStaff?.branch === 'barber';
  const accentColor = isBarber ? Theme.colors.barber.accent : Theme.colors.beauty.accent;

  // Dates
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const targetDate = dateFilter === 'today' ? todayStr : dateFilter === 'tomorrow' ? tomorrowStr : null;

  // Colleagues in the same branch
  const teamMembers = useMemo(() => {
    if (!currentStaff) return [];
    return staff.filter(s => s.branch === currentStaff.branch);
  }, [staff, currentStaff]);

  // Personal appointments for current staff
  const personalAppointments = useMemo(() => {
    if (!currentStaff) return [];
    return appointments
      .filter(a => {
        if (a.staffId !== currentStaff.id) return false;
        if (a.status === 'cancelled') return false;
        if (targetDate && a.date !== targetDate) return false;
        return true;
      })
      .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
  }, [appointments, currentStaff, targetDate]);

  // Team appointments for the entire branch
  const teamAppointments = useMemo(() => {
    if (!currentStaff) return [];
    return appointments
      .filter(a => {
        if (a.branch !== currentStaff.branch) return false;
        if (a.status === 'cancelled') return false;
        if (teamMemberFilter !== 'ALL' && a.staffId !== teamMemberFilter) return false;
        if (targetDate && a.date !== targetDate) return false;
        return true;
      })
      .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
  }, [appointments, currentStaff, teamMemberFilter, targetDate]);

  // Client history filtered (last 3 months)
  const filteredHistory = useMemo(() => {
    return clientHistory.filter(item => {
      if (historySearch.trim()) {
        const query = historySearch.toLowerCase();
        const matchName = item.clientName.toLowerCase().includes(query);
        const matchPhone = item.clientPhone.includes(query);
        const matchDetails = item.details.toLowerCase().includes(query);
        return matchName || matchPhone || matchDetails;
      }
      return true;
    });
  }, [clientHistory, historySearch]);

  const handleSaveNote = async () => {
    if (!clientName.trim() || !clientPhone.trim() || !details.trim()) {
      alert('Preencha os campos obrigatórios.');
      return;
    }

    if (!currentStaff) return;

    await addStaffNoteForClient({
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      staffId: currentStaff.id,
      staffName: currentStaff.name,
      branch: currentStaff.branch,
      date: todayStr,
      serviceName: serviceName || 'Corte / Serviço Geral',
      details: details.trim(),
    });

    setClientName('');
    setClientPhone('');
    setServiceName('');
    setDetails('');
    setAddModalVisible(false);
  };

  const handleOpenWhatsApp = (phone: string, client: string) => {
    const cleanPhone = phone.replace(/\s+/g, '');
    const msg = encodeURIComponent(`Olá ${client}! A mensagem é da Almare sobre a sua marcação.`);
    Linking.openURL(`https://wa.me/${cleanPhone}?text=${msg}`);
  };

  return (
    <View style={styles.container}>
      {/* Top Header & Staff Identity Picker */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={[styles.headerTitle, { color: accentColor }]}>ÁREA DO FUNCIONÁRIO</Text>
          <Text style={styles.headerBranchBadge}>
            {isBarber ? 'ALMARE BARBER' : 'ALMARE BEAUTY'}
          </Text>
        </View>
        <Text style={styles.headerSub}>Selecione o seu perfil de atendimento:</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.staffPickerScroll}>
          {staff.map(s => {
            const isSelected = s.id === currentStaff?.id;
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
                <Text style={[styles.staffChipText, isSelected && { color: '#111', fontWeight: '900' }]}>
                  {s.name} ({s.branch === 'barber' ? 'Barber' : 'Beauty'})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 3 Main Tabs: Horário Pessoal | Horário da Equipa | Fichas & Histórico */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'personal' && styles.tabBtnActive]}
          onPress={() => setActiveTab('personal')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'personal' && styles.tabBtnTextActive]}>
            Horário Pessoal ({personalAppointments.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'team' && styles.tabBtnActive]}
          onPress={() => setActiveTab('team')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'team' && styles.tabBtnTextActive]}>
            Horário da Equipa ({teamAppointments.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'history' && styles.tabBtnActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'history' && styles.tabBtnTextActive]}>
            Fichas & Histórico
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ============================================================ */}
        {/* TAB 1: HORÁRIO PESSOAL E RESPETIVAS MARCAÇÕES */}
        {/* ============================================================ */}
        {activeTab === 'personal' && (
          <View>
            {/* Banner: Horário Definido pelo Gestor */}
            <View style={styles.scheduleBannerBox}>
              <View style={styles.scheduleBannerHeader}>
                <Text style={[styles.scheduleBannerLabel, { color: accentColor }]}>
                  HORÁRIO PESSOAL DEFINIDO PELO GESTOR
                </Text>
                <Text style={styles.scheduleBannerGestorTag}>Gestão Almare</Text>
              </View>

              <Text style={styles.scheduleStaffName}>{currentStaff?.name}</Text>
              <Text style={styles.scheduleStaffRole}>{currentStaff?.roleTitle}</Text>

              <View style={styles.hoursRow}>
                <View style={styles.hourPill}>
                  <Text style={styles.hourPillLabel}>Dias de Trabalho</Text>
                  <Text style={styles.hourPillVal}>{currentStaff?.workDays || 'Terça a Sábado'}</Text>
                </View>

                <View style={styles.hourPill}>
                  <Text style={styles.hourPillLabel}>Turno Manhã</Text>
                  <Text style={styles.hourPillVal}>
                    {currentStaff?.workingHours?.start || '09:00'} às{' '}
                    {currentStaff?.workingHours?.lunchStart || '12:00'}
                  </Text>
                </View>

                <View style={styles.hourPill}>
                  <Text style={styles.hourPillLabel}>Turno Tarde</Text>
                  <Text style={styles.hourPillVal}>
                    {currentStaff?.workingHours?.lunchEnd || '14:00'} às{' '}
                    {currentStaff?.workingHours?.end || '19:00'}
                  </Text>
                </View>
              </View>

              <Text style={styles.lunchNoticeText}>
                Pausa de almoço: {currentStaff?.workingHours?.lunchStart || '12:00'} às{' '}
                {currentStaff?.workingHours?.lunchEnd || '14:00'} • Domingo e Segunda: Folga
              </Text>
            </View>

            {/* Date Filter Toolbar */}
            <View style={styles.dateFilterRow}>
              <TouchableOpacity
                style={[styles.filterChip, dateFilter === 'today' && styles.filterChipActive]}
                onPress={() => setDateFilter('today')}
              >
                <Text style={[styles.filterChipText, dateFilter === 'today' && styles.filterChipTextActive]}>
                  Hoje ({todayStr})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterChip, dateFilter === 'tomorrow' && styles.filterChipActive]}
                onPress={() => setDateFilter('tomorrow')}
              >
                <Text style={[styles.filterChipText, dateFilter === 'tomorrow' && styles.filterChipTextActive]}>
                  Amanhã
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterChip, dateFilter === 'all' && styles.filterChipActive]}
                onPress={() => setDateFilter('all')}
              >
                <Text style={[styles.filterChipText, dateFilter === 'all' && styles.filterChipTextActive]}>
                  Todas as Datas
                </Text>
              </TouchableOpacity>
            </View>

            {/* Personal Appointments List */}
            <Text style={styles.sectionHeaderTitle}>
              As Minhas Marcações ({personalAppointments.length})
            </Text>

            {personalAppointments.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Sem marcações agendadas</Text>
                <Text style={styles.emptySub}>
                  Não tem clientes agendados para este período. O seu horário de atendimento está disponível para novas marcações.
                </Text>
              </View>
            ) : (
              personalAppointments.map(app => (
                <View key={app.id} style={styles.appointmentCard}>
                  <View style={styles.appCardTop}>
                    <View style={styles.appTimeBadge}>
                      <Text style={styles.appTimeText}>{app.timeSlot}</Text>
                      <Text style={styles.appDurationText}>({app.serviceDuration} min)</Text>
                    </View>

                    <View
                      style={[
                        styles.appStatusBadge,
                        app.status === 'completed'
                          ? styles.statusCompleted
                          : styles.statusConfirmed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.appStatusText,
                          app.status === 'completed'
                            ? { color: '#3B82F6' }
                            : { color: '#10B981' },
                        ]}
                      >
                        {app.status === 'completed' ? 'Concluído' : 'Confirmado'}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.appClientName}>{app.clientName}</Text>
                  <Text style={styles.appClientPhone}>{app.clientPhone}</Text>

                  <View style={styles.appDetailsBox}>
                    <Text style={styles.appServiceName}>{app.serviceName}</Text>
                    <Text style={styles.appDatePrice}>
                      Data: {app.date} • {app.servicePrice.toFixed(2)} €
                    </Text>
                    {app.notes ? (
                      <Text style={styles.appNotesText}>Nota: "{app.notes}"</Text>
                    ) : null}
                  </View>

                  <View style={styles.appActionsRow}>
                    <TouchableOpacity
                      style={styles.actionBtnWhatsApp}
                      onPress={() => handleOpenWhatsApp(app.clientPhone, app.clientName)}
                    >
                      <Text style={styles.actionBtnWhatsAppText}>WhatsApp</Text>
                    </TouchableOpacity>

                    {app.status === 'confirmed' && (
                      <TouchableOpacity
                        style={styles.actionBtnComplete}
                        onPress={() => updateAppointmentStatus(app.id, 'completed')}
                      >
                        <Text style={styles.actionBtnCompleteText}>Concluir</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={styles.actionBtnNote}
                      onPress={() => {
                        setClientName(app.clientName);
                        setClientPhone(app.clientPhone);
                        setServiceName(app.serviceName);
                        setAddModalVisible(true);
                      }}
                    >
                      <Text style={styles.actionBtnNoteText}>+ Ficha Técnica</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ============================================================ */}
        {/* TAB 2: HORÁRIO DA EQUIPA E RESPETIVAS MARCAÇÕES */}
        {/* ============================================================ */}
        {activeTab === 'team' && (
          <View>
            <View style={styles.teamOverviewBanner}>
              <Text style={[styles.teamOverviewLabel, { color: accentColor }]}>
                HORÁRIOS DA EQUIPA DEFINIDOS PELO GESTOR
              </Text>
              <Text style={styles.teamOverviewSub}>
                Escala de trabalho e agenda de todos os profissionais em {isBarber ? 'Almare Barber' : 'Almare Beauty'}:
              </Text>
            </View>

            {/* List of team members & their manager-defined working hours */}
            <View style={styles.teamGrid}>
              {teamMembers.map(member => {
                const memberAppsToday = appointments.filter(
                  a => a.staffId === member.id && a.date === todayStr && a.status !== 'cancelled'
                ).length;

                return (
                  <View key={member.id} style={styles.teamMemberCard}>
                    <View style={styles.teamMemberHeader}>
                      <Text style={styles.teamMemberName}>{member.name}</Text>
                      <View style={styles.teamMemberAppsCount}>
                        <Text style={styles.teamMemberAppsCountText}>{memberAppsToday} hoje</Text>
                      </View>
                    </View>
                    <Text style={[styles.teamMemberRole, { color: accentColor }]}>
                      {member.roleTitle}
                    </Text>

                    <View style={styles.teamMemberHours}>
                      <Text style={styles.teamMemberHoursText}>
                        Horário: {member.workingHours?.start || '09:00'} -{' '}
                        {member.workingHours?.lunchStart || '12:00'} /{' '}
                        {member.workingHours?.lunchEnd || '14:00'} -{' '}
                        {member.workingHours?.end || '19:00'}
                      </Text>
                      <Text style={styles.teamMemberDaysText}>
                        {member.workDays || 'Terça a Sábado'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Filter by Colleague */}
            <Text style={styles.filterSectionTitle}>Filtrar Marcações da Equipa:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.teamFilterScroll}>
              <TouchableOpacity
                style={[
                  styles.teamFilterChip,
                  teamMemberFilter === 'ALL' && styles.teamFilterChipActive,
                ]}
                onPress={() => setTeamMemberFilter('ALL')}
              >
                <Text
                  style={[
                    styles.teamFilterChipText,
                    teamMemberFilter === 'ALL' && styles.teamFilterChipTextActive,
                  ]}
                >
                  Toda a Equipa ({teamMembers.length})
                </Text>
              </TouchableOpacity>

              {teamMembers.map(m => (
                <TouchableOpacity
                  key={m.id}
                  style={[
                    styles.teamFilterChip,
                    teamMemberFilter === m.id && styles.teamFilterChipActive,
                  ]}
                  onPress={() => setTeamMemberFilter(m.id)}
                >
                  <Text
                    style={[
                      styles.teamFilterChipText,
                      teamMemberFilter === m.id && styles.teamFilterChipTextActive,
                    ]}
                  >
                    {m.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Date Filter Toolbar */}
            <View style={styles.dateFilterRow}>
              <TouchableOpacity
                style={[styles.filterChip, dateFilter === 'today' && styles.filterChipActive]}
                onPress={() => setDateFilter('today')}
              >
                <Text style={[styles.filterChipText, dateFilter === 'today' && styles.filterChipTextActive]}>
                  Hoje ({todayStr})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterChip, dateFilter === 'tomorrow' && styles.filterChipActive]}
                onPress={() => setDateFilter('tomorrow')}
              >
                <Text style={[styles.filterChipText, dateFilter === 'tomorrow' && styles.filterChipTextActive]}>
                  Amanhã
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterChip, dateFilter === 'all' && styles.filterChipActive]}
                onPress={() => setDateFilter('all')}
              >
                <Text style={[styles.filterChipText, dateFilter === 'all' && styles.filterChipTextActive]}>
                  Todas as Datas
                </Text>
              </TouchableOpacity>
            </View>

            {/* Team Appointments List */}
            <Text style={styles.sectionHeaderTitle}>
              Marcações da Equipa ({teamAppointments.length})
            </Text>

            {teamAppointments.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Sem marcações da equipa</Text>
                <Text style={styles.emptySub}>
                  Não existem marcações registadas para os filtros de profissional e data selecionados.
                </Text>
              </View>
            ) : (
              teamAppointments.map(app => (
                <View key={app.id} style={styles.appointmentCard}>
                  <View style={styles.appCardTop}>
                    <View style={styles.appTimeBadge}>
                      <Text style={styles.appTimeText}>{app.timeSlot}</Text>
                      <Text style={styles.appDurationText}>({app.serviceDuration} min)</Text>
                    </View>

                    <View style={styles.staffResponsibleBadge}>
                      <Text style={styles.staffResponsibleText}>{app.staffName}</Text>
                    </View>
                  </View>

                  <Text style={styles.appClientName}>{app.clientName}</Text>
                  <Text style={styles.appClientPhone}>{app.clientPhone}</Text>

                  <View style={styles.appDetailsBox}>
                    <Text style={styles.appServiceName}>{app.serviceName}</Text>
                    <Text style={styles.appDatePrice}>
                      Data: {app.date} • Valor: {app.servicePrice.toFixed(2)} €
                    </Text>
                    {app.notes ? (
                      <Text style={styles.appNotesText}>Nota: "{app.notes}"</Text>
                    ) : null}
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ============================================================ */}
        {/* TAB 3: HISTÓRICO E FICHAS TÉCNICAS (3 MESES) */}
        {/* ============================================================ */}
        {activeTab === 'history' && (
          <View>
            <View style={styles.historyHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionHeaderTitle}>Fichas Técnicas & Histórico</Text>
                <Text style={styles.historySub}>Guardado localmente no dispositivo (últimos 90 dias)</Text>
              </View>

              <TouchableOpacity
                style={[styles.newRecordBtn, { backgroundColor: accentColor }]}
                onPress={() => setAddModalVisible(true)}
              >
                <Text style={styles.newRecordBtnText}>+ Nova Ficha</Text>
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <TextInput
              style={styles.historySearchInput}
              placeholder="Pesquisar por cliente, telemóvel ou fórmula..."
              placeholderTextColor="#9CA3AF"
              value={historySearch}
              onChangeText={setHistorySearch}
            />

            {filteredHistory.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Sem fichas técnicas registadas</Text>
                <Text style={styles.emptySub}>
                  Registe as preferências, números de corte, colorações ou detalhes de tratamentos dos clientes.
                </Text>
              </View>
            ) : (
              filteredHistory.map(item => (
                <View key={item.id} style={styles.historyCard}>
                  <View style={styles.historyCardHeader}>
                    <Text style={styles.historyClientName}>{item.clientName}</Text>
                    <Text style={styles.historyDate}>{item.date}</Text>
                  </View>

                  <Text style={styles.historyClientPhone}>Tel: {item.clientPhone}</Text>
                  <Text style={[styles.historyService, { color: accentColor }]}>
                    Serviço: {item.serviceName}
                  </Text>

                  <View style={styles.historyDetailsBox}>
                    <Text style={styles.historyDetailsText}>{item.details}</Text>
                  </View>

                  <Text style={styles.historyAuthor}>Atendido por: {item.staffName}</Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Modal: Add Client Technical Note */}
      <Modal visible={addModalVisible} transparent animationType="slide" onRequestClose={() => setAddModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setAddModalVisible(false)}>
          <Pressable style={styles.modalBody} onPress={e => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Nova Ficha Técnica do Cliente</Text>
            <Text style={styles.modalSub}>
              Guarde os detalhes do corte, tamanho de pentes, tom de coloração ou produtos utilizados.
            </Text>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Nome do Cliente *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ex: Manuel Silva"
                placeholderTextColor="#71717A"
                value={clientName}
                onChangeText={setClientName}
              />
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Telemóvel *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ex: 912345678"
                placeholderTextColor="#71717A"
                keyboardType="phone-pad"
                value={clientPhone}
                onChangeText={setClientPhone}
              />
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Serviço Realizado</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ex: Fade Médio + Ritual Barba"
                placeholderTextColor="#71717A"
                value={serviceName}
                onChangeText={setServiceName}
              />
            </View>

            <View style={styles.modalField}>
              <Text style={styles.modalLabel}>Detalhes Técnicos / Notas *</Text>
              <TextInput
                style={[styles.modalInput, { height: 90, textAlignVertical: 'top' }]}
                placeholder="Ex: Pente 1.5 na transição, navalha nas patilhas, óleo de sândalo..."
                placeholderTextColor="#71717A"
                multiline
                value={details}
                onChangeText={setDetails}
              />
            </View>

            <TouchableOpacity
              style={[styles.modalSaveBtn, { backgroundColor: accentColor }]}
              onPress={handleSaveNote}
            >
              <Text style={styles.modalSaveBtnText}>Guardar Ficha Técnica</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setAddModalVisible(false)}
            >
              <Text style={styles.modalCancelBtnText}>Cancelar</Text>
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
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },
  headerBranchBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9CA3AF',
    backgroundColor: '#272730',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
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
    fontSize: 11,
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
  /* Schedule Banner Box */
  scheduleBannerBox: {
    backgroundColor: '#18181E',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#2E2E3A',
  },
  scheduleBannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  scheduleBannerLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  scheduleBannerGestorTag: {
    fontSize: 9,
    color: '#9CA3AF',
    fontWeight: '700',
  },
  scheduleStaffName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
  },
  scheduleStaffRole: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 1,
    marginBottom: 10,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  hourPill: {
    flex: 1,
    backgroundColor: '#272730',
    padding: 8,
    borderRadius: 8,
    marginRight: 6,
  },
  hourPillLabel: {
    fontSize: 9,
    color: '#9CA3AF',
    fontWeight: '700',
  },
  hourPillVal: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '800',
    marginTop: 2,
  },
  lunchNoticeText: {
    fontSize: 11,
    color: '#71717A',
    marginTop: 8,
    fontStyle: 'italic',
  },
  /* Date Filter Row */
  dateFilterRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  filterChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#18181E',
    alignItems: 'center',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#2E2E3A',
  },
  filterChipActive: {
    backgroundColor: '#272730',
    borderColor: '#D4AF37',
  },
  filterChipText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  emptyCard: {
    backgroundColor: '#18181E',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2E2E3A',
  },
  emptyTitle: {
    color: '#F4F4F5',
    fontSize: 14,
    fontWeight: '800',
  },
  emptySub: {
    color: '#71717A',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  /* Appointment Card */
  appointmentCard: {
    backgroundColor: '#18181E',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2E2E3A',
  },
  appCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  appTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appTimeText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    marginRight: 6,
  },
  appDurationText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  appStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusConfirmed: {
    backgroundColor: 'rgba(16,185,129,0.15)',
  },
  statusCompleted: {
    backgroundColor: 'rgba(59,130,246,0.15)',
  },
  appStatusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  staffResponsibleBadge: {
    backgroundColor: '#272730',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  staffResponsibleText: {
    color: '#D4AF37',
    fontSize: 11,
    fontWeight: '700',
  },
  appClientName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  appClientPhone: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 1,
  },
  appDetailsBox: {
    backgroundColor: '#22222A',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  appServiceName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F4F4F5',
  },
  appDatePrice: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  appNotesText: {
    fontSize: 11,
    color: '#FBBF24',
    marginTop: 4,
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
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionBtnWhatsAppText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  actionBtnComplete: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionBtnCompleteText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  actionBtnNote: {
    flex: 1,
    backgroundColor: '#272730',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  actionBtnNoteText: {
    color: '#E4E4E7',
    fontSize: 11,
    fontWeight: '700',
  },
  /* Team Overview */
  teamOverviewBanner: {
    backgroundColor: '#18181E',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2E2E3A',
  },
  teamOverviewLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  teamOverviewSub: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  teamGrid: {
    marginBottom: 14,
  },
  teamMemberCard: {
    backgroundColor: '#1C1C22',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#2E2E3A',
  },
  teamMemberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  teamMemberName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  teamMemberAppsCount: {
    backgroundColor: '#272730',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  teamMemberAppsCountText: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '700',
  },
  teamMemberRole: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  teamMemberHours: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  teamMemberHoursText: {
    fontSize: 11,
    color: '#D4D4D8',
    fontWeight: '600',
  },
  teamMemberDaysText: {
    fontSize: 10,
    color: '#71717A',
    marginTop: 1,
  },
  filterSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    marginBottom: 6,
  },
  teamFilterScroll: {
    marginBottom: 10,
  },
  teamFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#18181E',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#2E2E3A',
  },
  teamFilterChipActive: {
    backgroundColor: '#272730',
    borderColor: '#D4AF37',
  },
  teamFilterChipText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '700',
  },
  teamFilterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  /* History Tab */
  historyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  historySub: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  newRecordBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  newRecordBtnText: {
    color: '#111',
    fontSize: 12,
    fontWeight: '900',
  },
  historySearchInput: {
    backgroundColor: '#18181E',
    borderColor: '#2E2E3A',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#FFF',
    fontSize: 12,
    marginBottom: 12,
  },
  historyCard: {
    backgroundColor: '#18181E',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2E2E3A',
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historyClientName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  historyDate: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  historyClientPhone: {
    fontSize: 11,
    color: '#71717A',
    marginTop: 1,
  },
  historyService: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  historyDetailsBox: {
    backgroundColor: '#22222A',
    padding: 8,
    borderRadius: 6,
    marginVertical: 6,
  },
  historyDetailsText: {
    fontSize: 12,
    color: '#E4E4E7',
    lineHeight: 16,
  },
  historyAuthor: {
    fontSize: 10,
    color: '#71717A',
    fontStyle: 'italic',
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
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  modalSub: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
    marginBottom: 12,
  },
  modalField: {
    marginBottom: 10,
  },
  modalLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D4D4D8',
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
    fontSize: 12,
  },
  modalSaveBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  modalSaveBtnText: {
    color: '#111',
    fontSize: 13,
    fontWeight: '900',
  },
  modalCancelBtn: {
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  modalCancelBtnText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
});
