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
  Alert,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { StaffMember, Service } from '../types';
import { Theme } from '../constants/theme';
import { getGestorNotifyClientWhatsAppUrl } from '../utils/reminderHelper';

type GestorTab = 'appointments' | 'services' | 'schedules';

export const GestorBarberView: React.FC = () => {
  const {
    appointments,
    updateAppointmentStatus,
    staff,
    updateStaffMember,
    services,
    addService,
    updateService,
    deleteService,
  } = useApp();

  const [activeTab, setActiveTab] = useState<GestorTab>('appointments');
  const [dateFilter, setDateFilter] = useState<'today' | 'custom' | 'past' | 'future' | 'all'>('today');
  const [customDate, setCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('ALL');

  // Services management states
  const [catFilter, setCatFilter] = useState<string>('TODOS');
  const [serviceModalVisible, setServiceModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [newServCat, setNewServCat] = useState('Cortes');
  const [newServName, setNewServName] = useState('');
  const [newServDesc, setNewServDesc] = useState('');
  const [newServPrice, setNewServPrice] = useState('18');
  const [newServDur, setNewServDur] = useState('30');
  const [hasExtras, setHasExtras] = useState(false);
  const [selectedExtraIds, setSelectedExtraIds] = useState<string[]>([]);
  const [showInlineNewExtra, setShowInlineNewExtra] = useState(false);
  const [inlineExtraName, setInlineExtraName] = useState('');
  const [inlineExtraPrice, setInlineExtraPrice] = useState('5');
  const [inlineExtraDur, setInlineExtraDur] = useState('10');

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

  const activeStaffMember = useMemo(
    () => barberStaff.find(s => s.id === selectedStaffFilter),
    [barberStaff, selectedStaffFilter]
  );

  // Filter Barber appointments by Branch, Date, Staff, and Search query
  const barberAppointments = useMemo(() => {
    return appointments.filter(app => {
      if (app.branch !== 'barber') return false;

      // Filter by Date
      if (dateFilter === 'today' && app.date !== todayStr) return false;
      if (dateFilter === 'custom' && app.date !== customDate) return false;
      if (dateFilter === 'past' && app.date >= todayStr) return false;
      if (dateFilter === 'future' && app.date <= todayStr) return false;
      // 'all' passes through all dates

      // Filter by Staff
      if (selectedStaffFilter !== 'ALL' && app.staffId !== selectedStaffFilter) return false;

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = app.clientName.toLowerCase().includes(query);
        const matchPhone = app.clientPhone.includes(query);
        const matchService = app.serviceName.toLowerCase().includes(query);
        const matchStaff = app.staffName.toLowerCase().includes(query);
        return matchName || matchPhone || matchService || matchStaff;
      }
      return true;
    });
  }, [appointments, dateFilter, todayStr, customDate, selectedStaffFilter, searchQuery]);

  // Statistics dynamically calculated for the currently active filters
  const stats = useMemo(() => {
    const totalCount = barberAppointments.length;
    const confirmedCount = barberAppointments.filter(a => a.status === 'confirmed').length;
    const completedCount = barberAppointments.filter(a => a.status === 'completed').length;
    const cancelledCount = barberAppointments.filter(a => a.status === 'cancelled').length;
    const totalRevenue = barberAppointments
      .filter(a => a.status !== 'cancelled')
      .reduce((acc, a) => acc + (a.servicePrice || 0), 0);

    return {
      totalCount,
      confirmedCount,
      completedCount,
      cancelledCount,
      totalRevenue,
    };
  }, [barberAppointments]);

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

  // Barber services and extras
  const barberServices = useMemo(() => {
    return services.filter(s => s.branch === 'barber');
  }, [services]);

  const barberExtras = useMemo(() => {
    return barberServices.filter(s => s.category.toLowerCase() === 'extras');
  }, [barberServices]);

  const filteredBarberServices = useMemo(() => {
    if (catFilter === 'TODOS') return barberServices;
    return barberServices.filter(s => s.category === catFilter);
  }, [barberServices, catFilter]);

  const barberCategories = useMemo(() => {
    const defaultCats = ['Cortes', 'Barbas', 'Signature', 'Extras'];
    const dynamicCats = Array.from(new Set(barberServices.map(s => s.category)));
    const merged = Array.from(new Set([...defaultCats, ...dynamicCats]));
    return ['TODOS', ...merged];
  }, [barberServices]);

  const handleToggleExtraId = (extraId: string) => {
    setSelectedExtraIds(prev =>
      prev.includes(extraId) ? prev.filter(id => id !== extraId) : [...prev, extraId]
    );
  };

  const handleOpenCreateService = () => {
    setEditingService(null);
    setNewServCat('Cortes');
    setNewServName('');
    setNewServDesc('');
    setNewServPrice('18');
    setNewServDur('30');
    setHasExtras(false);
    setSelectedExtraIds([]);
    setShowInlineNewExtra(false);
    setServiceModalVisible(true);
  };

  const handleOpenEditService = (service: Service) => {
    setEditingService(service);
    setNewServCat(service.category);
    setNewServName(service.name);
    setNewServDesc(service.description || '');
    setNewServPrice(String(service.price));
    setNewServDur(String(service.durationMinutes));
    setHasExtras(!!(service.compatibleExtraIds && service.compatibleExtraIds.length > 0));
    setSelectedExtraIds(service.compatibleExtraIds || []);
    setShowInlineNewExtra(false);
    setServiceModalVisible(true);
  };

  const handleCreateInlineExtra = async () => {
    if (!inlineExtraName.trim()) {
      Alert.alert('Atenção', 'Introduza o nome do extra.');
      return;
    }
    const created = await addService({
      branch: 'barber',
      category: 'Extras',
      name: inlineExtraName.trim(),
      description: 'Extra opcional para barbearia.',
      price: parseFloat(inlineExtraPrice.replace(',', '.')) || 5,
      durationMinutes: parseInt(inlineExtraDur, 10) || 10,
      iconName: '',
    });
    setSelectedExtraIds(prev => [...prev, created.id]);
    setInlineExtraName('');
    setShowInlineNewExtra(false);
  };

  const handleSaveService = async () => {
    if (!newServName.trim()) {
      Alert.alert('Atenção', 'Introduza o nome do serviço.');
      return;
    }

    const priceNum = parseFloat(newServPrice.replace(',', '.')) || 0;
    const durNum = parseInt(newServDur, 10) || 15;

    if (editingService) {
      await updateService({
        ...editingService,
        name: newServName.trim(),
        category: newServCat.trim() || 'Cortes',
        description: newServDesc.trim(),
        price: priceNum,
        durationMinutes: durNum,
        compatibleExtraIds: hasExtras ? selectedExtraIds : [],
      });
    } else {
      await addService({
        branch: 'barber',
        category: newServCat.trim() || 'Cortes',
        name: newServName.trim(),
        description: newServDesc.trim() || 'Serviço de excelência Almare Barber.',
        price: priceNum,
        durationMinutes: durNum,
        iconName: '',
        compatibleExtraIds: hasExtras ? selectedExtraIds : [],
      });
    }

    setServiceModalVisible(false);
    setEditingService(null);
  };

  const handleDeleteService = (service: Service) => {
    Alert.alert(
      'Eliminar Serviço',
      `Tem a certeza de que deseja eliminar o serviço "${service.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteService(service.id);
          },
        },
      ]
    );
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

      {/* Tabs: Agenda & Marcações | Serviços & Extras | Horários da Equipa */}
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
          style={[styles.tabBtn, activeTab === 'services' && styles.tabBtnActive]}
          onPress={() => setActiveTab('services')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'services' && styles.tabBtnTextActive]}>
            Serviços & Extras ({barberServices.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'schedules' && styles.tabBtnActive]}
          onPress={() => setActiveTab('schedules')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'schedules' && styles.tabBtnTextActive]}>
            Horários ({barberStaff.length})
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
                <Text style={styles.statNumber}>{stats.totalCount}</Text>
                <Text style={styles.statLabel}>
                  {dateFilter === 'today' ? 'Marcações Hoje' : 'Total no Filtro'}
                </Text>
              </View>

              <View style={styles.statCard}>
                <Text style={[styles.statNumber, { color: Theme.colors.barber.accent }]}>
                  {stats.totalRevenue.toFixed(0)} €
                </Text>
                <Text style={styles.statLabel}>Faturamento</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={[styles.statNumber, { color: '#10B981' }]}>
                  {stats.completedCount > 0 ? stats.completedCount : stats.confirmedCount}
                </Text>
                <Text style={styles.statLabel}>
                  {stats.completedCount > 0 ? 'Concluídos' : 'Confirmados'}
                </Text>
              </View>
            </View>

            {/* Individual Staff Summary Card (when filtering by a specific professional) */}
            {activeStaffMember && (
              <View style={styles.staffSummaryCard}>
                <View style={styles.staffSummaryHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.staffSummaryTitle}>
                      Produção: {activeStaffMember.name}
                    </Text>
                    <Text style={styles.staffSummarySub}>
                      {activeStaffMember.roleTitle} •{' '}
                      {dateFilter === 'today'
                        ? `Hoje (${todayStr})`
                        : dateFilter === 'custom'
                        ? `Data: ${customDate}`
                        : dateFilter === 'past'
                        ? 'Marcações Passadas'
                        : dateFilter === 'future'
                        ? 'Próximas Marcações'
                        : 'Histórico Completo'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.clearStaffBtn}
                    onPress={() => setSelectedStaffFilter('ALL')}
                  >
                    <Text style={styles.clearStaffBtnText}>Ver Todos</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.staffSummaryGrid}>
                  <View style={styles.staffSummaryCol}>
                    <Text style={styles.staffSummaryNumber}>{stats.totalCount}</Text>
                    <Text style={styles.staffSummaryLabel}>Marcações</Text>
                  </View>
                  <View style={styles.staffSummaryCol}>
                    <Text style={[styles.staffSummaryNumber, { color: '#10B981' }]}>
                      {stats.completedCount}
                    </Text>
                    <Text style={styles.staffSummaryLabel}>Concluídos</Text>
                  </View>
                  <View style={styles.staffSummaryCol}>
                    <Text style={[styles.staffSummaryNumber, { color: Theme.colors.barber.accent }]}>
                      {stats.totalRevenue.toFixed(2)} €
                    </Text>
                    <Text style={styles.staffSummaryLabel}>Total Faturado</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Filter Toolbar */}
            <View style={styles.toolbar}>
              {/* Date Filters Pills */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateFilterScroll}>
                <TouchableOpacity
                  style={[styles.dateFilterPill, dateFilter === 'today' && styles.dateFilterPillActive]}
                  onPress={() => setDateFilter('today')}
                >
                  <Text style={[styles.dateFilterPillText, dateFilter === 'today' && styles.dateFilterPillTextActive]}>
                    Hoje ({todayStr})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.dateFilterPill, dateFilter === 'custom' && styles.dateFilterPillActive]}
                  onPress={() => setDateFilter('custom')}
                >
                  <Text style={[styles.dateFilterPillText, dateFilter === 'custom' && styles.dateFilterPillTextActive]}>
                    Por Data {dateFilter === 'custom' ? `(${customDate})` : ''}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.dateFilterPill, dateFilter === 'past' && styles.dateFilterPillActive]}
                  onPress={() => setDateFilter('past')}
                >
                  <Text style={[styles.dateFilterPillText, dateFilter === 'past' && styles.dateFilterPillTextActive]}>
                    Passadas / Feitas
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.dateFilterPill, dateFilter === 'future' && styles.dateFilterPillActive]}
                  onPress={() => setDateFilter('future')}
                >
                  <Text style={[styles.dateFilterPillText, dateFilter === 'future' && styles.dateFilterPillTextActive]}>
                    Futuras
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.dateFilterPill, dateFilter === 'all' && styles.dateFilterPillActive]}
                  onPress={() => setDateFilter('all')}
                >
                  <Text style={[styles.dateFilterPillText, dateFilter === 'all' && styles.dateFilterPillTextActive]}>
                    Histórico Completo
                  </Text>
                </TouchableOpacity>
              </ScrollView>

              {/* Day Navigator (when specific date filter is selected) */}
              {dateFilter === 'custom' && (
                <View style={styles.customDateNavRow}>
                  <TouchableOpacity
                    style={styles.customDateNavBtn}
                    onPress={() => {
                      const d = new Date(customDate);
                      d.setDate(d.getDate() - 1);
                      setCustomDate(d.toISOString().split('T')[0]);
                    }}
                  >
                    <Text style={styles.customDateNavBtnText}>◀ Dia Anterior</Text>
                  </TouchableOpacity>

                  <View style={styles.customDateCenterBox}>
                    <Text style={styles.customDateCenterText}>{customDate}</Text>
                    {customDate === todayStr && (
                      <Text style={styles.customDateTodayBadge}>Hoje</Text>
                    )}
                  </View>

                  <TouchableOpacity
                    style={styles.customDateNavBtn}
                    onPress={() => {
                      const d = new Date(customDate);
                      d.setDate(d.getDate() + 1);
                      setCustomDate(d.toISOString().split('T')[0]);
                    }}
                  >
                    <Text style={styles.customDateNavBtnText}>Dia Seguinte ▶</Text>
                  </TouchableOpacity>
                </View>
              )}

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
                    {app.notes ? <Text style={styles.notesText}>Nota: &quot;{app.notes}&quot;</Text> : null}
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
        {/* TAB 2: SERVIÇOS & EXTRAS (BARBER) */}
        {/* ============================================================ */}
        {activeTab === 'services' && (
          <View>
            <View style={styles.servicesHeaderRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.sectionTitle}>Serviços e Extras Barber</Text>
                <Text style={styles.sectionSub}>Adicione e edite os serviços do catálogo e respetivos extras</Text>
              </View>
              <TouchableOpacity
                style={styles.addServiceTopBtn}
                onPress={handleOpenCreateService}
              >
                <Text style={styles.addServiceTopBtnText}>+ Novo Serviço</Text>
              </TouchableOpacity>
            </View>

            {/* Category Filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              {barberCategories.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catFilterPill, catFilter === cat && styles.catFilterPillActive]}
                  onPress={() => setCatFilter(cat)}
                >
                  <Text style={[styles.catFilterPillText, catFilter === cat && styles.catFilterPillTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {filteredBarberServices.map(item => {
              const compatibleExtras = item.compatibleExtraIds && item.compatibleExtraIds.length > 0
                ? barberExtras.filter(e => item.compatibleExtraIds!.includes(e.id))
                : [];
              const isExtraItem = item.category.toLowerCase() === 'extras';

              return (
                <View key={item.id} style={styles.serviceManageCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.serviceManageName}>{item.name}</Text>
                    <Text style={styles.serviceManageSub}>
                      {item.category} • {item.price.toFixed(2)} € • {item.durationMinutes} min
                    </Text>
                    {item.description ? (
                      <Text style={styles.serviceManageDesc}>{item.description}</Text>
                    ) : null}

                    {compatibleExtras.length > 0 ? (
                      <View style={styles.serviceAttachedExtrasBox}>
                        <Text style={styles.serviceAttachedExtrasTitle}>
                          Extras compatíveis no drop-down ({compatibleExtras.length}):
                        </Text>
                        {compatibleExtras.map(ex => (
                          <Text key={ex.id} style={styles.serviceAttachedExtraItem}>
                            • {ex.name} (+{ex.price.toFixed(2)} €)
                          </Text>
                        ))}
                      </View>
                    ) : !isExtraItem ? (
                      <Text style={styles.serviceNoExtrasText}>
                        Sem extras associados (serviço simples)
                      </Text>
                    ) : (
                      <View style={styles.extraTagBadge}>
                        <Text style={styles.extraTagBadgeText}>Item de Extra</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.serviceActionsCol}>
                    <TouchableOpacity
                      style={styles.editServiceBtn}
                      onPress={() => handleOpenEditService(item)}
                    >
                      <Text style={styles.editServiceBtnText}>Editar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteServiceBtn}
                      onPress={() => handleDeleteService(item)}
                    >
                      <Text style={styles.deleteServiceBtnText}>Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ============================================================ */}
        {/* TAB 3: DEFINIR HORÁRIOS DA EQUIPA */}
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

      {/* Modal: Adicionar / Editar Serviço Barber */}
      <Modal visible={serviceModalVisible} transparent animationType="slide" onRequestClose={() => setServiceModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setServiceModalVisible(false)}>
          <Pressable style={[styles.modalBody, { maxHeight: '90%' }]} onPress={e => e.stopPropagation()}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {editingService ? 'Editar Serviço Barber' : 'Novo Serviço Barber'}
              </Text>
              <Text style={styles.modalSub}>
                {editingService
                  ? 'Modifique os detalhes, preço ou extras compatíveis deste serviço.'
                  : 'Configure um novo serviço para ficar disponível nas marcações online.'}
              </Text>

              {/* Nome do Serviço */}
              <View style={styles.serviceFieldGroup}>
                <Text style={styles.serviceFieldLabel}>Nome do Serviço *</Text>
                <TextInput
                  style={styles.serviceInput}
                  value={newServName}
                  onChangeText={setNewServName}
                  placeholder="Ex: Corte Degradê Almare"
                  placeholderTextColor="#71717A"
                />
              </View>

              {/* Categoria */}
              <View style={styles.serviceFieldGroup}>
                <Text style={styles.serviceFieldLabel}>Categoria</Text>
                <View style={styles.categoryPillRow}>
                  {['Cortes', 'Barbas', 'Signature', 'Extras'].map(cat => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.categorySelectPill, newServCat === cat && styles.categorySelectPillActive]}
                      onPress={() => setNewServCat(cat)}
                    >
                      <Text
                        style={[
                          styles.categorySelectPillText,
                          newServCat === cat && styles.categorySelectPillTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={[styles.serviceInput, { marginTop: 6 }]}
                  value={newServCat}
                  onChangeText={setNewServCat}
                  placeholder="Ou escreva outra categoria..."
                  placeholderTextColor="#71717A"
                />
              </View>

              {/* Preço e Duração */}
              <View style={styles.formGrid}>
                <View style={styles.formCol}>
                  <Text style={styles.serviceFieldLabel}>Preço (€) *</Text>
                  <TextInput
                    style={styles.serviceInput}
                    value={newServPrice}
                    onChangeText={setNewServPrice}
                    keyboardType="numeric"
                    placeholder="18"
                    placeholderTextColor="#71717A"
                  />
                </View>

                <View style={styles.formCol}>
                  <Text style={styles.serviceFieldLabel}>Duração (min) *</Text>
                  <TextInput
                    style={styles.serviceInput}
                    value={newServDur}
                    onChangeText={setNewServDur}
                    keyboardType="numeric"
                    placeholder="30"
                    placeholderTextColor="#71717A"
                  />
                </View>
              </View>

              {/* Descrição */}
              <View style={styles.serviceFieldGroup}>
                <Text style={styles.serviceFieldLabel}>Descrição Curta</Text>
                <TextInput
                  style={[styles.serviceInput, { height: 60, textAlignVertical: 'top' }]}
                  value={newServDesc}
                  onChangeText={setNewServDesc}
                  multiline
                  placeholder="Detalhes ou produtos incluídos no serviço..."
                  placeholderTextColor="#71717A"
                />
              </View>

              {/* Extras Compatíveis (Apenas para serviços que não são já 'Extras') */}
              {newServCat.toLowerCase() !== 'extras' && (
                <View style={styles.extrasSectionContainer}>
                  <Text style={styles.serviceFieldLabel}>
                    Inclui Extras Opcionais no Drop-down?
                  </Text>
                  <Text style={styles.extrasSectionNotice}>
                    Se ativado, ao clicar neste serviço na marcação online, abre-se uma aba com extras rápidos que somam valor e tempo.
                  </Text>

                  <View style={styles.toggleRow}>
                    <TouchableOpacity
                      style={[styles.toggleBtn, !hasExtras && styles.toggleBtnActive]}
                      onPress={() => setHasExtras(false)}
                    >
                      <Text style={[styles.toggleBtnText, !hasExtras && styles.toggleBtnTextActive]}>
                        Não (Simples)
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.toggleBtn, hasExtras && styles.toggleBtnActive]}
                      onPress={() => setHasExtras(true)}
                    >
                      <Text style={[styles.toggleBtnText, hasExtras && styles.toggleBtnTextActive]}>
                        Sim (Com Extras)
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {hasExtras && (
                    <View style={styles.extrasConfigBox}>
                      <Text style={styles.extrasSubTitle}>
                        Selecione os extras compatíveis:
                      </Text>

                      {barberExtras.length === 0 ? (
                        <Text style={styles.noExtrasNotice}>
                          Não tem itens na categoria &quot;Extras&quot;. Pode criar um agora mesmo abaixo:
                        </Text>
                      ) : (
                        barberExtras.map(extra => {
                          const isChecked = selectedExtraIds.includes(extra.id);
                          return (
                            <TouchableOpacity
                              key={extra.id}
                              style={[
                                styles.extraCheckRow,
                                isChecked && styles.extraCheckRowChecked,
                              ]}
                              onPress={() => handleToggleExtraId(extra.id)}
                            >
                              <View style={[styles.checkboxBox, isChecked && styles.checkboxBoxChecked]}>
                                {isChecked && <Text style={styles.checkboxCheck}>✓</Text>}
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.extraCheckName}>{extra.name}</Text>
                                <Text style={styles.extraCheckDetails}>
                                  +{extra.price.toFixed(2)} € • +{extra.durationMinutes} min
                                </Text>
                              </View>
                            </TouchableOpacity>
                          );
                        })
                      )}

                      {/* Criar Extra inline */}
                      {!showInlineNewExtra ? (
                        <TouchableOpacity
                          style={styles.addInlineExtraBtn}
                          onPress={() => setShowInlineNewExtra(true)}
                        >
                          <Text style={styles.addInlineExtraBtnText}>+ Criar Novo Extra Aqui</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.inlineCreateBox}>
                          <Text style={styles.inlineCreateTitle}>Novo Item Extra:</Text>
                          <TextInput
                            style={styles.serviceInput}
                            placeholder="Nome do Extra (Ex: Lavagem Especial)"
                            placeholderTextColor="#71717A"
                            value={inlineExtraName}
                            onChangeText={setInlineExtraName}
                          />
                          <View style={[styles.formGrid, { marginTop: 6 }]}>
                            <View style={styles.formCol}>
                              <Text style={styles.modalFieldLabelMini}>Preço (€)</Text>
                              <TextInput
                                style={styles.serviceInput}
                                placeholder="5"
                                placeholderTextColor="#71717A"
                                keyboardType="numeric"
                                value={inlineExtraPrice}
                                onChangeText={setInlineExtraPrice}
                              />
                            </View>
                            <View style={styles.formCol}>
                              <Text style={styles.modalFieldLabelMini}>Minutos</Text>
                              <TextInput
                                style={styles.serviceInput}
                                placeholder="10"
                                placeholderTextColor="#71717A"
                                keyboardType="numeric"
                                value={inlineExtraDur}
                                onChangeText={setInlineExtraDur}
                              />
                            </View>
                          </View>
                          <View style={styles.inlineActionRow}>
                            <TouchableOpacity
                              style={styles.inlineConfirmBtn}
                              onPress={handleCreateInlineExtra}
                            >
                              <Text style={styles.inlineConfirmBtnText}>Adicionar Extra</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.inlineCancelBtn}
                              onPress={() => setShowInlineNewExtra(false)}
                            >
                              <Text style={styles.inlineCancelBtnText}>Cancelar</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              )}

              {/* Botões do Modal */}
              <TouchableOpacity style={styles.saveScheduleBtn} onPress={handleSaveService}>
                <Text style={styles.saveScheduleBtnText}>
                  {editingService ? 'Guardar Alterações' : 'Criar Serviço'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => {
                  setServiceModalVisible(false);
                  setEditingService(null);
                }}
              >
                <Text style={styles.cancelModalBtnText}>Cancelar</Text>
              </TouchableOpacity>
            </ScrollView>
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
  staffSummaryCard: {
    backgroundColor: '#16161D',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  staffSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  staffSummaryTitle: {
    color: '#F4F4F5',
    fontSize: 14,
    fontWeight: '900',
  },
  staffSummarySub: {
    color: Theme.colors.barber.accent,
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  clearStaffBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  clearStaffBtnText: {
    color: '#D4D4D8',
    fontSize: 11,
    fontWeight: '700',
  },
  staffSummaryGrid: {
    flexDirection: 'row',
    backgroundColor: '#101015',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#24242C',
  },
  staffSummaryCol: {
    flex: 1,
    alignItems: 'center',
  },
  staffSummaryNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  staffSummaryLabel: {
    fontSize: 10,
    color: '#A1A1AA',
    fontWeight: '600',
    marginTop: 2,
  },
  dateFilterScroll: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  dateFilterPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#18181C',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  dateFilterPillActive: {
    backgroundColor: Theme.colors.barber.accent,
    borderColor: Theme.colors.barber.accent,
  },
  dateFilterPillText: {
    color: '#A1A1AA',
    fontSize: 11,
    fontWeight: '700',
  },
  dateFilterPillTextActive: {
    color: '#0D0D11',
    fontWeight: '900',
  },
  customDateNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#18181C',
    padding: 8,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  customDateNavBtn: {
    backgroundColor: '#24242C',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  customDateNavBtnText: {
    color: '#E4E4E7',
    fontSize: 11,
    fontWeight: '700',
  },
  customDateCenterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customDateCenterText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  customDateTodayBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    color: '#10B981',
    fontSize: 9,
    fontWeight: '900',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#30303D',
    backgroundColor: '#1E1E26',
    marginHorizontal: 4,
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
    marginBottom: 4,
  },
  sectionSub: {
    color: '#9CA3AF',
    fontSize: 11,
    marginBottom: 12,
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
  // Services & Extras Styles
  servicesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  addServiceTopBtn: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },
  addServiceTopBtnText: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '900',
  },
  catFilterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#1E1E24',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#2F2F38',
  },
  catFilterPillActive: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
  },
  catFilterPillText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '700',
  },
  catFilterPillTextActive: {
    color: '#111827',
  },
  serviceManageCard: {
    backgroundColor: '#18181C',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#27272A',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  serviceManageName: {
    color: '#F4F4F5',
    fontSize: 15,
    fontWeight: '800',
  },
  serviceManageSub: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  serviceManageDesc: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 4,
    lineHeight: 16,
  },
  serviceAttachedExtrasBox: {
    marginTop: 8,
    backgroundColor: '#202026',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#2E2E38',
  },
  serviceAttachedExtrasTitle: {
    color: '#D4AF37',
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  serviceAttachedExtraItem: {
    color: '#E5E7EB',
    fontSize: 11,
    lineHeight: 16,
  },
  serviceNoExtrasText: {
    color: '#71717A',
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 6,
  },
  extraTagBadge: {
    backgroundColor: '#2E2A1E',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#78601C',
  },
  extraTagBadgeText: {
    color: '#FDE68A',
    fontSize: 10,
    fontWeight: '800',
  },
  serviceActionsCol: {
    marginLeft: 10,
    gap: 6,
    alignItems: 'flex-end',
  },
  editServiceBtn: {
    backgroundColor: '#272730',
    borderWidth: 1,
    borderColor: '#D4AF37',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editServiceBtnText: {
    color: '#D4AF37',
    fontSize: 11,
    fontWeight: '800',
  },
  deleteServiceBtn: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteServiceBtnText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
  },
  serviceFieldGroup: {
    marginBottom: 12,
  },
  serviceFieldLabel: {
    color: '#E5E7EB',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  serviceInput: {
    backgroundColor: '#24242A',
    borderColor: '#383842',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#FFF',
    fontSize: 13,
  },
  categoryPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  categorySelectPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#202026',
    borderWidth: 1,
    borderColor: '#32323D',
  },
  categorySelectPillActive: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
  },
  categorySelectPillText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '700',
  },
  categorySelectPillTextActive: {
    color: '#111827',
  },
  extrasSectionContainer: {
    backgroundColor: '#1E1E24',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2F2F3A',
    marginBottom: 14,
  },
  extrasSectionNotice: {
    color: '#9CA3AF',
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  extrasConfigBox: {
    backgroundColor: '#15151A',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#282833',
  },
  extrasSubTitle: {
    color: '#D4AF37',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  noExtrasNotice: {
    color: '#71717A',
    fontSize: 11,
    marginBottom: 8,
  },
  extraCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 4,
    backgroundColor: '#202026',
  },
  extraCheckRowChecked: {
    backgroundColor: '#2C2A1E',
    borderWidth: 1,
    borderColor: '#63521D',
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#71717A',
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: '#D4AF37',
    borderColor: '#D4AF37',
  },
  checkboxCheck: {
    color: '#111827',
    fontSize: 11,
    fontWeight: '900',
  },
  extraCheckName: {
    color: '#F4F4F5',
    fontSize: 12,
    fontWeight: '700',
  },
  extraCheckDetails: {
    color: '#9CA3AF',
    fontSize: 10,
  },
  addInlineExtraBtn: {
    backgroundColor: '#24242A',
    paddingVertical: 7,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#383844',
  },
  addInlineExtraBtnText: {
    color: '#D4AF37',
    fontSize: 11,
    fontWeight: '800',
  },
  inlineCreateBox: {
    marginTop: 8,
    backgroundColor: '#202026',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#32323E',
  },
  inlineCreateTitle: {
    color: '#D4AF37',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 6,
  },
  modalFieldLabelMini: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 2,
  },
  inlineActionRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  inlineConfirmBtn: {
    flex: 1,
    backgroundColor: '#D4AF37',
    paddingVertical: 7,
    borderRadius: 6,
    alignItems: 'center',
  },
  inlineConfirmBtnText: {
    color: '#111827',
    fontSize: 11,
    fontWeight: '800',
  },
  inlineCancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    alignItems: 'center',
  },
  inlineCancelBtnText: {
    color: '#9CA3AF',
    fontSize: 11,
  },
});
