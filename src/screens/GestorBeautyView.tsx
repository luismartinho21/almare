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
import { Service, StaffMember } from '../types';
import { Theme } from '../constants/theme';
import { getGestorNotifyClientWhatsAppUrl } from '../utils/reminderHelper';

export const GestorBeautyView: React.FC = () => {
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

  const [activeTab, setActiveTab] = useState<'appointments' | 'services' | 'schedules'>('appointments');
  const [dateFilter, setDateFilter] = useState<'today' | 'custom' | 'past' | 'future' | 'all'>('today');
  const [customDate, setCustomDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('ALL');

  // Services management states
  const [catFilter, setCatFilter] = useState<string>('TODOS');
  const [serviceModalVisible, setServiceModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [newServCat, setNewServCat] = useState('Manicure / Pedicure');
  const [newServName, setNewServName] = useState('');
  const [newServDesc, setNewServDesc] = useState('');
  const [newServPrice, setNewServPrice] = useState('25');
  const [newServDur, setNewServDur] = useState('45');
  const [hasExtras, setHasExtras] = useState(false);
  const [selectedExtraIds, setSelectedExtraIds] = useState<string[]>([]);
  const [showInlineNewExtra, setShowInlineNewExtra] = useState(false);
  const [inlineExtraName, setInlineExtraName] = useState('');
  const [inlineExtraPrice, setInlineExtraPrice] = useState('6');
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

  const beautyStaff = useMemo(() => staff.filter(s => s.branch === 'beauty'), [staff]);

  const activeStaffMember = useMemo(
    () => beautyStaff.find(s => s.id === selectedStaffFilter),
    [beautyStaff, selectedStaffFilter]
  );

  // Beauty services and extras
  const beautyServices = useMemo(() => {
    return services.filter(s => s.branch === 'beauty');
  }, [services]);

  const beautyExtras = useMemo(() => {
    return beautyServices.filter(s => s.category.toLowerCase() === 'extras');
  }, [beautyServices]);

  const filteredBeautyServices = useMemo(() => {
    if (catFilter === 'TODOS') return beautyServices;
    return beautyServices.filter(s => s.category === catFilter);
  }, [beautyServices, catFilter]);

  const beautyCategories = useMemo(() => {
    const defaultCats = ['Manicure / Pedicure', 'Head-Spa', 'Tratamentos', 'Signature', 'Extras'];
    const dynamicCats = Array.from(new Set(beautyServices.map(s => s.category)));
    const merged = Array.from(new Set([...defaultCats, ...dynamicCats]));
    return ['TODOS', ...merged];
  }, [beautyServices]);

  const handleToggleExtraId = (extraId: string) => {
    setSelectedExtraIds(prev =>
      prev.includes(extraId) ? prev.filter(id => id !== extraId) : [...prev, extraId]
    );
  };

  const handleOpenCreateService = () => {
    setEditingService(null);
    setNewServCat('Manicure / Pedicure');
    setNewServName('');
    setNewServDesc('');
    setNewServPrice('25');
    setNewServDur('45');
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
      branch: 'beauty',
      category: 'Extras',
      name: inlineExtraName.trim(),
      description: 'Extra opcional para serviços de beleza.',
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
    const durNum = parseInt(newServDur, 10) || 45;

    if (editingService) {
      await updateService({
        ...editingService,
        name: newServName.trim(),
        category: newServCat.trim() || 'Manicure / Pedicure',
        description: newServDesc.trim(),
        price: priceNum,
        durationMinutes: durNum,
        compatibleExtraIds: hasExtras ? selectedExtraIds : [],
      });
    } else {
      await addService({
        branch: 'beauty',
        category: newServCat.trim() || 'Manicure / Pedicure',
        name: newServName.trim(),
        description: newServDesc.trim() || 'Serviço de excelência Almare Beauty.',
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

  // Filter Beauty appointments by Branch, Date, Staff, and Search query
  const beautyAppointments = useMemo(() => {
    return appointments.filter(app => {
      if (app.branch !== 'beauty') return false;

      // Filter by Date
      if (dateFilter === 'today' && app.date !== todayStr) return false;
      if (dateFilter === 'custom' && app.date !== customDate) return false;
      if (dateFilter === 'past' && app.date >= todayStr) return false;
      if (dateFilter === 'future' && app.date <= todayStr) return false;

      // Filter by Staff
      if (selectedStaffFilter !== 'ALL' && app.staffId !== selectedStaffFilter) return false;

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

  // Dynamic Statistics
  const stats = useMemo(() => {
    const totalCount = beautyAppointments.length;
    const confirmedCount = beautyAppointments.filter(a => a.status === 'confirmed').length;
    const completedCount = beautyAppointments.filter(a => a.status === 'completed').length;
    const cancelledCount = beautyAppointments.filter(a => a.status === 'cancelled').length;
    const totalRevenue = beautyAppointments
      .filter(a => a.status !== 'cancelled')
      .reduce((acc, a) => acc + (a.servicePrice || 0), 0);

    return {
      totalCount,
      confirmedCount,
      completedCount,
      cancelledCount,
      totalRevenue,
    };
  }, [beautyAppointments]);

  return (
    <View style={styles.container}>
      {/* Dashboard Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PAINEL DE GESTÃO - BEAUTY</Text>
        <Text style={styles.headerSub}>Almare Beauty Salon • Acesso Exclusivo Gestor</Text>
      </View>

      {/* Main Section Navigation Bar */}
      <View style={styles.topTabBar}>
        <TouchableOpacity
          style={[styles.topTabBtn, activeTab === 'appointments' && styles.topTabBtnActive]}
          onPress={() => setActiveTab('appointments')}
        >
          <Text
            style={[
              styles.topTabBtnText,
              activeTab === 'appointments' && styles.topTabBtnTextActive,
            ]}
          >
            Agenda ({beautyAppointments.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.topTabBtn, activeTab === 'services' && styles.topTabBtnActive]}
          onPress={() => setActiveTab('services')}
        >
          <Text
            style={[
              styles.topTabBtnText,
              activeTab === 'services' && styles.topTabBtnTextActive,
            ]}
          >
            Serviços & Extras ({beautyServices.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.topTabBtn, activeTab === 'schedules' && styles.topTabBtnActive]}
          onPress={() => setActiveTab('schedules')}
        >
          <Text
            style={[
              styles.topTabBtnText,
              activeTab === 'schedules' && styles.topTabBtnTextActive,
            ]}
          >
            Horários ({beautyStaff.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ============================================================ */}
        {/* TAB 1: AGENDA & MARCAÇÕES BEAUTY */}
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
                <Text style={[styles.statNumber, { color: Theme.colors.beauty.badge }]}>
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

            {/* Individual Staff Summary Card (when filtering by a specific specialist) */}
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
                    <Text style={styles.clearStaffBtnText}>Ver Todas</Text>
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
                    <Text style={[styles.staffSummaryNumber, { color: '#3B1C26' }]}>
                      {stats.totalRevenue.toFixed(2)} €
                    </Text>
                    <Text style={styles.staffSummaryLabel}>Total Faturado</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Filter Toolbar */}
            <View style={styles.toolbar}>
              {/* Date Filter Pills */}
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

              {/* Day Navigator (when specific date is selected) */}
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

              {/* Staff Filter Scroll */}
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
                    Todas as Especialistas
                  </Text>
                </TouchableOpacity>

                {beautyStaff.map(s => (
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
                placeholder="Pesquisar por cliente, telemóvel, serviço ou especialista..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Appointments List Header */}
            <Text style={styles.sectionTitle}>
              Agenda de Beleza ({beautyAppointments.length})
            </Text>

            {beautyAppointments.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>Sem marcações de beleza encontradas</Text>
                <Text style={styles.emptySub}>
                  Não existem agendamentos para os filtros selecionados.
                </Text>
              </View>
            ) : (
              beautyAppointments.map(app => (
                <View key={app.id} style={styles.appCard}>
                  <View style={styles.appCardHeader}>
                    <View style={styles.timeBadge}>
                      <Text style={styles.timeBadgeText}>{app.timeSlot}</Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        app.status === 'confirmed' && { backgroundColor: '#D1FAE5' },
                        app.status === 'completed' && { backgroundColor: '#DBEAFE' },
                        app.status === 'cancelled' && { backgroundColor: '#FEE2E2' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          app.status === 'confirmed' && { color: '#047857' },
                          app.status === 'completed' && { color: '#1D4ED8' },
                          app.status === 'cancelled' && { color: '#B91C1C' },
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
                  <Text style={styles.clientPhone}>{app.clientPhone}</Text>

                  <View style={styles.detailsBox}>
                    <Text style={styles.serviceName}>{app.serviceName}</Text>
                    <Text style={styles.staffName}>Especialista: {app.staffName}</Text>
                    <Text style={styles.priceDuration}>
                      {app.servicePrice} € • {app.serviceDuration} min • Data: {app.date}
                    </Text>
                    {app.notes ? <Text style={styles.notesText}>Nota: &quot;{app.notes}&quot;</Text> : null}
                    <View style={styles.reminderStatusRow}>
                      <Text style={styles.reminderStatusText}>
                        Lembrete 2h: {app.reminderEnabled !== false ? 'Ativo (notificação programada)' : 'Inativo'}
                      </Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.actionsRow}>
                    {app.status === 'confirmed' && (
                      <TouchableOpacity
                        style={styles.notifyBtn}
                        onPress={() => {
                          const url = getGestorNotifyClientWhatsAppUrl(app, 'Almare Beauty Salon');
                          Linking.openURL(url);
                        }}
                      >
                        <Text style={styles.notifyBtnText}>Notificar Cliente (2h)</Text>
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
        {/* TAB 2: SERVIÇOS & EXTRAS BEAUTY */}
        {/* ============================================================ */}
        {activeTab === 'services' && (
          <View>
            <View style={styles.servicesHeaderRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.sectionTitle}>Serviços e Extras Beauty</Text>
                <Text style={styles.sectionSub}>Configure os serviços e defina se incluem extras no menu drop-down</Text>
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
              {beautyCategories.map(cat => (
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

            {filteredBeautyServices.map(item => {
              const compatibleExtras = item.compatibleExtraIds && item.compatibleExtraIds.length > 0
                ? beautyExtras.filter(e => item.compatibleExtraIds!.includes(e.id))
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
                          Extras que abrem no drop-down ({compatibleExtras.length}):
                        </Text>
                        {compatibleExtras.map(ex => (
                          <Text key={ex.id} style={styles.serviceAttachedExtraItem}>
                            • {ex.name} (+{ex.price.toFixed(2)} €)
                          </Text>
                        ))}
                      </View>
                    ) : !isExtraItem ? (
                      <Text style={styles.serviceNoExtrasText}>
                        Sem extras associados (não abre menu drop-down)
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
        {/* TAB 3: DEFINIR HORÁRIOS DA EQUIPA BEAUTY */}
        {/* ============================================================ */}
        {activeTab === 'schedules' && (
          <View>
            <View style={styles.standardScheduleBanner}>
              <Text style={styles.standardScheduleLabel}>HORÁRIO GERAL DO SALÃO DEFINIDO</Text>
              <Text style={styles.standardScheduleTitle}>
                Terça a Sábado das 09:00 às 12:00 e das 14:00 às 19:00
              </Text>
              <Text style={styles.standardScheduleSub}>
                A gestora pode personalizar individualmente a escala de cada especialista abaixo.
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Escala da Equipa Beauty ({beautyStaff.length})</Text>

            {beautyStaff.map(member => (
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

      {/* Add / Edit Service Modal for Beauty */}
      <Modal
        visible={serviceModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setServiceModalVisible(false);
          setEditingService(null);
        }}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => {
            setServiceModalVisible(false);
            setEditingService(null);
          }}
        >
          <Pressable style={[styles.modalContent, { maxHeight: '90%' }]} onPress={e => e.stopPropagation()}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {editingService ? 'Editar Serviço Beauty' : 'Novo Serviço Beauty'}
              </Text>

              {/* Service Name */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Nome do Serviço *</Text>
                <TextInput
                  style={styles.input}
                  value={newServName}
                  onChangeText={setNewServName}
                  placeholder="Ex: Ritual Head-Spa Holístico"
                  placeholderTextColor="#71717A"
                />
              </View>

              {/* Category Pills & Input */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Categoria</Text>
                <View style={styles.modalCatRow}>
                  {['Manicure / Pedicure', 'Head-Spa', 'Tratamentos', 'Signature', 'Extras'].map(cat => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.modalCatPill, newServCat === cat && styles.modalCatPillActive]}
                      onPress={() => setNewServCat(cat)}
                    >
                      <Text style={[styles.modalCatPillText, newServCat === cat && styles.modalCatPillTextActive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={[styles.input, { marginTop: 6 }]}
                  value={newServCat}
                  onChangeText={setNewServCat}
                  placeholder="Ou digite outra categoria"
                  placeholderTextColor="#71717A"
                />
              </View>

              {/* Price & Duration */}
              <View style={styles.rowTwo}>
                <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Preço (€)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={newServPrice}
                    onChangeText={setNewServPrice}
                  />
                </View>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Duração (min)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={newServDur}
                    onChangeText={setNewServDur}
                  />
                </View>
              </View>

              {/* Description */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Descrição do Serviço</Text>
                <TextInput
                  style={[styles.input, { height: 60 }]}
                  multiline
                  value={newServDesc}
                  onChangeText={setNewServDesc}
                  placeholder="Detalhes do que inclui o tratamento..."
                  placeholderTextColor="#71717A"
                />
              </View>

              {/* EXTRAS TOGGLE */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Inclui Extras Disponíveis?</Text>
                <View style={styles.toggleRow}>
                  <TouchableOpacity
                    style={[styles.toggleOptionBtn, !hasExtras && styles.toggleOptionBtnActive]}
                    onPress={() => setHasExtras(false)}
                  >
                    <Text style={[styles.toggleOptionText, !hasExtras && styles.toggleOptionTextActive]}>
                      Não (Sem extras)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.toggleOptionBtn, hasExtras && styles.toggleOptionBtnActive]}
                    onPress={() => setHasExtras(true)}
                  >
                    <Text style={[styles.toggleOptionText, hasExtras && styles.toggleOptionTextActive]}>
                      Sim (Associar Extras)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {hasExtras && (
                <View style={styles.extrasConfigBox}>
                  <Text style={styles.extrasConfigTitle}>
                    Selecione os extras que vão aparecer no menu drop-down deste serviço:
                  </Text>

                  {beautyExtras.length === 0 ? (
                    <Text style={styles.noExtrasHelp}>Ainda não há extras de Beauty criados. Crie um novo abaixo:</Text>
                  ) : (
                    <View style={styles.extrasChipGrid}>
                      {beautyExtras.map(extra => {
                        const isSelected = selectedExtraIds.includes(extra.id);
                        return (
                          <TouchableOpacity
                            key={extra.id}
                            style={[styles.extraSelectChip, isSelected && styles.extraSelectChipActive]}
                            onPress={() => handleToggleExtraId(extra.id)}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.extraSelectChipText, isSelected && styles.extraSelectChipTextActive]}>
                              {isSelected ? '✓ ' : '+ '}
                              {extra.name} (+{extra.price.toFixed(2)} €)
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  {!showInlineNewExtra ? (
                    <TouchableOpacity
                      style={styles.inlineCreateExtraBtn}
                      onPress={() => setShowInlineNewExtra(true)}
                    >
                      <Text style={styles.inlineCreateExtraBtnText}>+ Criar Outro Extra</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.inlineExtraContainer}>
                      <Text style={styles.inlineExtraHeader}>Novo Extra Beauty:</Text>
                      <TextInput
                        style={[styles.input, { marginBottom: 6 }]}
                        placeholder="Nome do Extra (Ex: Ampola Colagénio)"
                        placeholderTextColor="#71717A"
                        value={inlineExtraName}
                        onChangeText={setInlineExtraName}
                      />
                      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                        <TextInput
                          style={[styles.input, { flex: 1 }]}
                          placeholder="Preço €"
                          placeholderTextColor="#71717A"
                          keyboardType="numeric"
                          value={inlineExtraPrice}
                          onChangeText={setInlineExtraPrice}
                        />
                        <TextInput
                          style={[styles.input, { flex: 1 }]}
                          placeholder="Duração min"
                          placeholderTextColor="#71717A"
                          keyboardType="numeric"
                          value={inlineExtraDur}
                          onChangeText={setInlineExtraDur}
                        />
                      </View>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity style={styles.inlineSaveBtn} onPress={handleCreateInlineExtra}>
                          <Text style={styles.inlineSaveBtnText}>Adicionar Extra</Text>
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

              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveService}>
                <Text style={styles.modalSaveBtnText}>
                  {editingService ? 'Guardar Alterações' : 'Criar Serviço'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setServiceModalVisible(false);
                  setEditingService(null);
                }}
              >
                <Text style={styles.modalCancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal: Editar Horário da Especialista Beauty */}
      <Modal visible={!!editingStaff} transparent animationType="slide" onRequestClose={() => setEditingStaff(null)}>
        <Pressable style={styles.modalOverlay} onPress={() => setEditingStaff(null)}>
          <Pressable style={styles.modalBody} onPress={e => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Definir Horário de {editingStaff?.name}</Text>
            <Text style={styles.modalSub}>
              Configuração oficial da gestora para vagas de agendamento e escala da especialista.
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
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formCol}>
                <Text style={styles.modalLabel}>Hora de Saída</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editEnd}
                  onChangeText={setEditEnd}
                  placeholder="19:00"
                  placeholderTextColor="#9CA3AF"
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
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formCol}>
                <Text style={styles.modalLabel}>Fim Almoço</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editLunchEnd}
                  onChangeText={setEditLunchEnd}
                  placeholder="14:00"
                  placeholderTextColor="#9CA3AF"
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
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {feedbackMsg ? <Text style={styles.feedbackSuccessText}>{feedbackMsg}</Text> : null}

            {/* Botões de Ação */}
            <TouchableOpacity style={styles.saveScheduleBtn} onPress={handleSaveSchedule}>
              <Text style={styles.saveScheduleBtnText}>Guardar Escala Oficial</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setEditingStaff(null)}>
              <Text style={styles.cancelModalBtnText}>Cancelar</Text>
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
    backgroundColor: '#FAF5F7',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#3B1C26',
    borderBottomWidth: 1,
    borderBottomColor: '#5B2136',
  },
  headerTitle: {
    color: '#FBCFE8',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  headerSub: {
    color: '#F472B6',
    fontSize: 11,
    marginTop: 2,
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
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#FCE7F3',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 3,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  staffSummaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FBCFE8',
    shadowColor: '#3B1C26',
    shadowOpacity: 0.06,
    shadowRadius: 5,
  },
  staffSummaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  staffSummaryTitle: {
    color: '#3B1C26',
    fontSize: 14,
    fontWeight: '900',
  },
  staffSummarySub: {
    color: Theme.colors.beauty.badge,
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  clearStaffBtn: {
    backgroundColor: '#FDF2F8',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FBCFE8',
  },
  clearStaffBtnText: {
    color: '#BE185D',
    fontSize: 11,
    fontWeight: '700',
  },
  staffSummaryGrid: {
    flexDirection: 'row',
    backgroundColor: '#FFF5F7',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#FCE7F3',
  },
  staffSummaryCol: {
    flex: 1,
    alignItems: 'center',
  },
  staffSummaryNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1F2937',
  },
  staffSummaryLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '600',
    marginTop: 2,
  },
  toolbar: {
    marginBottom: 16,
  },
  dateFilterScroll: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  dateFilterPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#FFF',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dateFilterPillActive: {
    backgroundColor: '#FCE7F3',
    borderWidth: 1.5,
    borderColor: '#BE185D',
  },
  dateFilterPillText: {
    color: '#4B5563',
    fontSize: 11,
    fontWeight: '700',
  },
  dateFilterPillTextActive: {
    color: '#111827',
    fontWeight: '900',
  },
  customDateNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 8,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FCE7F3',
  },
  customDateNavBtn: {
    backgroundColor: '#FDF2F8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  customDateNavBtnText: {
    color: '#BE185D',
    fontSize: 11,
    fontWeight: '700',
  },
  customDateCenterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customDateCenterText: {
    color: '#3B1C26',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  customDateTodayBadge: {
    backgroundColor: '#D1FAE5',
    color: '#047857',
    fontSize: 9,
    fontWeight: '900',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  staffFilterScroll: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  staffFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#FFF',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  staffFilterChipActive: {
    backgroundColor: '#FCE7F3',
    borderWidth: 1.5,
    borderColor: '#BE185D',
  },
  staffFilterChipText: {
    color: '#4B5563',
    fontSize: 11,
    fontWeight: '700',
  },
  staffFilterChipTextActive: {
    color: '#111827',
    fontWeight: '900',
  },
  searchInput: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#111827',
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#3B1C26',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  sectionSub: {
    fontSize: 11,
    color: '#831843',
    marginTop: 2,
    marginBottom: 10,
  },
  emptyState: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCE7F3',
  },
  emptyTitle: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '800',
  },
  emptySub: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  appCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FCE7F3',
  },
  appCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeBadge: {
    backgroundColor: '#FCE7F3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timeBadgeText: {
    color: Theme.colors.beauty.badge,
    fontSize: 12,
    fontWeight: '800',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  clientName: {
    color: '#1F2937',
    fontSize: 17,
    fontWeight: '800',
  },
  clientPhone: {
    color: '#6B7280',
    fontSize: 13,
    marginTop: 2,
    marginBottom: 10,
  },
  detailsBox: {
    backgroundColor: '#FFF5F7',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  serviceName: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '700',
  },
  staffName: {
    color: '#4B5563',
    fontSize: 12,
    marginTop: 4,
  },
  priceDuration: {
    color: '#6B7280',
    fontSize: 11,
    marginTop: 4,
  },
  notesText: {
    color: Theme.colors.beauty.badge,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  completeBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  completeBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  cancelBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  cancelBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  notifyBtn: {
    backgroundColor: '#25D366',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  notifyBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  reminderStatusRow: {
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#FBCFE8',
  },
  reminderStatusText: {
    color: Theme.colors.beauty.badge,
    fontSize: 11,
    fontWeight: '700',
  },
  topTabBar: {
    flexDirection: 'row',
    backgroundColor: '#3B1C26',
    borderBottomWidth: 1,
    borderBottomColor: '#5B2136',
  },
  topTabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  topTabBtnActive: {
    borderBottomColor: '#FBCFE8',
  },
  topTabBtnText: {
    color: '#E5D5DA',
    fontSize: 12,
    fontWeight: '700',
  },
  topTabBtnTextActive: {
    color: '#FBCFE8',
    fontWeight: '900',
  },
  servicesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addServiceTopBtn: {
    backgroundColor: '#D4AF37',
    borderWidth: 1,
    borderColor: '#B8860B',
    paddingHorizontal: 12,
    paddingVertical: 8,
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
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 6,
  },
  catFilterPillActive: {
    backgroundColor: '#FCE7F3',
    borderWidth: 1.5,
    borderColor: '#BE185D',
  },
  catFilterPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
  },
  catFilterPillTextActive: {
    color: '#111827',
    fontWeight: '900',
  },
  serviceManageCard: {
    backgroundColor: '#FFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F3E8FF',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  serviceManageName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1F2937',
  },
  serviceManageSub: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.beauty.badge,
    marginTop: 2,
  },
  serviceManageDesc: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 15,
  },
  serviceAttachedExtrasBox: {
    backgroundColor: '#FFFDF5',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  serviceAttachedExtrasTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 4,
  },
  serviceAttachedExtraItem: {
    fontSize: 11,
    color: '#78350F',
    fontWeight: '600',
    lineHeight: 16,
  },
  serviceNoExtrasText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 6,
  },
  extraTagBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6,
  },
  extraTagBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7C3AED',
  },
  serviceActionsCol: {
    flexDirection: 'column',
    gap: 6,
    marginLeft: 8,
    alignItems: 'flex-end',
  },
  editServiceBtn: {
    backgroundColor: 'rgba(219, 39, 119, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(219, 39, 119, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    minWidth: 64,
  },
  editServiceBtnText: {
    color: '#DB2777',
    fontSize: 11,
    fontWeight: '700',
  },
  deleteServiceBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    minWidth: 64,
  },
  deleteServiceBtnText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '700',
  },
  standardScheduleBanner: {
    backgroundColor: '#FDF2F8',
    borderWidth: 1,
    borderColor: '#FBCFE8',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  standardScheduleLabel: {
    color: '#BE185D',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  standardScheduleTitle: {
    color: '#3B1C26',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 3,
  },
  standardScheduleSub: {
    color: '#831843',
    fontSize: 11,
    marginTop: 2,
  },
  scheduleConfigCard: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#FCE7F3',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  scheduleConfigHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  scheduleConfigName: {
    color: '#3B1C26',
    fontSize: 15,
    fontWeight: '800',
  },
  scheduleConfigRole: {
    color: Theme.colors.beauty.badge,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  editScheduleBtn: {
    backgroundColor: '#FDF2F8',
    borderWidth: 1,
    borderColor: '#FBCFE8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editScheduleBtnText: {
    color: '#BE185D',
    fontSize: 11,
    fontWeight: '800',
  },
  scheduleValuesBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF5F7',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  scheduleValueCol: {
    flex: 1,
  },
  scheduleValueLabel: {
    color: '#831843',
    fontSize: 10,
    fontWeight: '700',
  },
  scheduleValueText: {
    color: '#1F2937',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  schedulePauseHint: {
    color: '#9CA3AF',
    fontSize: 10,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  modalBody: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#3B1C26',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalSub: {
    color: '#6B7280',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 14,
  },
  presetTitle: {
    color: '#374151',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  presetBtn: {
    backgroundColor: '#FDF2F8',
    borderWidth: 1,
    borderColor: '#FBCFE8',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  presetBtnText: {
    color: '#BE185D',
    fontSize: 10,
    fontWeight: '700',
  },
  formGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  formCol: {
    flex: 1,
  },
  modalLabel: {
    color: '#374151',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    color: '#111827',
    fontSize: 12,
  },
  modalField: {
    marginBottom: 10,
  },
  feedbackSuccessText: {
    color: '#047857',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    marginVertical: 6,
  },
  saveScheduleBtn: {
    backgroundColor: '#D4AF37',
    borderWidth: 1,
    borderColor: '#B8860B',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  saveScheduleBtnText: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '900',
  },
  cancelModalBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 2,
  },
  cancelModalBtnText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '700',
  },
  fieldGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#111827',
  },
  modalCatRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  modalCatPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    marginRight: 6,
    marginBottom: 6,
  },
  modalCatPillActive: {
    backgroundColor: '#D4AF37',
    borderWidth: 1,
    borderColor: '#B8860B',
  },
  modalCatPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
  },
  modalCatPillTextActive: {
    color: '#111827',
    fontWeight: '900',
  },
  rowTwo: {
    flexDirection: 'row',
  },
  toggleRow: {
    flexDirection: 'row',
  },
  toggleOptionBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  toggleOptionBtnActive: {
    backgroundColor: '#D4AF37',
    borderColor: '#B8860B',
  },
  toggleOptionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  toggleOptionTextActive: {
    color: '#111827',
    fontWeight: '900',
  },
  extrasConfigBox: {
    backgroundColor: '#FFFDF5',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  extrasConfigTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#92400E',
    marginBottom: 8,
  },
  noExtrasHelp: {
    fontSize: 12,
    color: '#B45309',
    marginBottom: 8,
  },
  extrasChipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  extraSelectChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 6,
    marginBottom: 6,
  },
  extraSelectChipActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#D97706',
  },
  extraSelectChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
  },
  extraSelectChipTextActive: {
    color: '#92400E',
    fontWeight: '800',
  },
  inlineCreateExtraBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D97706',
    backgroundColor: '#FFF',
  },
  inlineCreateExtraBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  inlineExtraContainer: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 10,
    borderRadius: 8,
    marginTop: 6,
  },
  inlineExtraHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#374151',
    marginBottom: 6,
  },
  inlineSaveBtn: {
    flex: 1,
    backgroundColor: '#D4AF37',
    borderWidth: 1,
    borderColor: '#B8860B',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    marginRight: 6,
  },
  inlineSaveBtnText: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '900',
  },
  inlineCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  inlineCancelBtnText: {
    color: '#6B7280',
    fontSize: 12,
  },
  modalSaveBtn: {
    backgroundColor: '#D4AF37',
    borderWidth: 1,
    borderColor: '#B8860B',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  modalSaveBtnText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '900',
  },
  modalCancelBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  modalCancelBtnText: {
    color: '#6B7280',
    fontSize: 13,
  },
});
