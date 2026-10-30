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
import { FinancialDashboard } from '../components/FinancialDashboard';

type GestorTab = 'management' | 'services' | 'staff';
type ManagementSubTab = 'appointments' | 'finance';

export const GestorBeautyView: React.FC = () => {
  const {
    appointments,
    updateAppointmentStatus,
    staff,
    generateStaffPin,
    addStaffMember,
    updateStaffMember,
    deleteStaffMember,
    services,
    addService,
    updateService,
    deleteService,
    renameCategory,
    deleteCategory,
  } = useApp();

  const [activeTab, setActiveTab] = useState<GestorTab>('management');
  const [managementSubTab, setManagementSubTab] = useState<ManagementSubTab>('appointments');
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
  const [inlineExtraCat, setInlineExtraCat] = useState('Extras');

  // Filter / Category customization states
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [manageFiltersModalVisible, setManageFiltersModalVisible] = useState(false);
  const [newFilterInput, setNewFilterInput] = useState('');
  const [editingFilterOldName, setEditingFilterOldName] = useState<string | null>(null);
  const [editingFilterNewName, setEditingFilterNewName] = useState('');

  // Staff management & availability states
  const [staffModalVisible, setStaffModalVisible] = useState(false);
  const [editingStaffMember, setEditingStaffMember] = useState<StaffMember | null>(null);
  const [staffPin, setStaffPin] = useState('');
  const [staffName, setStaffName] = useState('');
  const [staffRole, setStaffRole] = useState('Especialista Head-Spa');
  const [staffPhone, setStaffPhone] = useState('+351 910 000 000');
  const [staffStatus, setStaffStatus] = useState<'active' | 'leave' | 'vacation' | 'inactive'>('active');
  const [staffAbsenceNote, setStaffAbsenceNote] = useState('');
  const [staffUnavailableDates, setStaffUnavailableDates] = useState<string[]>([]);
  const [absenceStartDate, setAbsenceStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [absenceEndDate, setAbsenceEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Staff working hours & schedule
  const [staffStart, setStaffStart] = useState('09:00');
  const [staffEnd, setStaffEnd] = useState('19:00');
  const [staffLunchStart, setStaffLunchStart] = useState('12:00');
  const [staffLunchEnd, setStaffLunchEnd] = useState('14:00');
  const [staffWorkDays, setStaffWorkDays] = useState('Terça a Sábado');
  const [staffFeedbackMsg, setStaffFeedbackMsg] = useState('');

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
    const dynamicCats = Array.from(new Set(beautyServices.map(s => s.category).filter(Boolean)));
    const merged = Array.from(new Set([...defaultCats, ...dynamicCats, ...customCategories]));
    return ['TODOS', ...merged];
  }, [beautyServices, customCategories]);

  const getCategoryCount = (cat: string) => {
    if (cat === 'TODOS') return beautyServices.length;
    return beautyServices.filter(s => s.category.toLowerCase() === cat.toLowerCase()).length;
  };

  const handleAddNewFilter = () => {
    const name = newFilterInput.trim();
    if (!name) {
      Alert.alert('Atenção', 'Introduza o nome do filtro.');
      return;
    }
    if (beautyCategories.map(c => c.toLowerCase()).includes(name.toLowerCase())) {
      Alert.alert('Atenção', 'Este filtro já existe.');
      return;
    }
    setCustomCategories(prev => [...prev, name]);
    setNewServCat(name);
    setNewFilterInput('');
    Alert.alert('Sucesso', `Filtro "${name}" criado com sucesso! Já o pode associar aos seus serviços e extras.`);
  };

  const handleSaveRenameFilter = async (oldName: string) => {
    const newName = editingFilterNewName.trim();
    if (!newName) {
      Alert.alert('Atenção', 'O nome do filtro não pode estar vazio.');
      return;
    }
    if (newName.toLowerCase() === oldName.toLowerCase()) {
      setEditingFilterOldName(null);
      return;
    }
    await renameCategory('beauty', oldName, newName);
    setCustomCategories(prev => prev.map(c => (c.toLowerCase() === oldName.toLowerCase() ? newName : c)));
    if (catFilter.toLowerCase() === oldName.toLowerCase()) {
      setCatFilter(newName);
    }
    if (newServCat.toLowerCase() === oldName.toLowerCase()) {
      setNewServCat(newName);
    }
    setEditingFilterOldName(null);
    setEditingFilterNewName('');
    Alert.alert('Sucesso', `Filtro renomeado para "${newName}" com todos os serviços e extras associados atualizados!`);
  };

  const handleDeleteFilter = (filterName: string) => {
    const count = getCategoryCount(filterName);
    Alert.alert(
      'Eliminar Filtro',
      count > 0
        ? `O filtro "${filterName}" tem ${count} serviço(s) associado(s). Ao eliminar, estes serviços passarão para a categoria "Manicure / Pedicure". Deseja continuar?`
        : `Tem a certeza de que deseja eliminar o filtro "${filterName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            if (count > 0) {
              await deleteCategory('beauty', filterName, 'Manicure / Pedicure');
            }
            setCustomCategories(prev => prev.filter(c => c.toLowerCase() !== filterName.toLowerCase()));
            if (catFilter.toLowerCase() === filterName.toLowerCase()) {
              setCatFilter('TODOS');
            }
            if (newServCat.toLowerCase() === filterName.toLowerCase()) {
              setNewServCat('Manicure / Pedicure');
            }
          },
        },
      ]
    );
  };

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
      category: inlineExtraCat.trim() || 'Extras',
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

  const handleOpenCreateStaff = () => {
    const today = new Date().toISOString().split('T')[0];
    const nextPin = generateStaffPin('beauty');
    setEditingStaffMember(null);
    setStaffPin(nextPin);
    setStaffName('');
    setStaffRole('Especialista Head-Spa');
    setStaffPhone('+351 910 000 000');
    setStaffStatus('active');
    setStaffAbsenceNote('');
    setStaffUnavailableDates([]);
    setAbsenceStartDate(today);
    setAbsenceEndDate(today);
    setStaffStart('09:00');
    setStaffEnd('19:00');
    setStaffLunchStart('12:00');
    setStaffLunchEnd('14:00');
    setStaffWorkDays('Terça a Sábado');
    setStaffFeedbackMsg('');
    setStaffModalVisible(true);
  };

  const handleOpenEditStaff = (member: StaffMember) => {
    const today = new Date().toISOString().split('T')[0];
    setEditingStaffMember(member);
    setStaffPin(member.pin || generateStaffPin('beauty'));
    setStaffName(member.name);
    setStaffRole(member.roleTitle);
    setStaffPhone(member.phone || '+351 910 000 000');
    setStaffStatus(member.status || 'active');
    setStaffAbsenceNote(member.absenceNote || '');

    const unDates = member.unavailableDates ? [...member.unavailableDates].sort() : [];
    setStaffUnavailableDates(unDates);
    if (unDates.length > 0) {
      setAbsenceStartDate(unDates[0]);
      setAbsenceEndDate(unDates[unDates.length - 1]);
    } else {
      setAbsenceStartDate(today);
      setAbsenceEndDate(today);
    }

    setStaffStart(member.workingHours?.start || '09:00');
    setStaffEnd(member.workingHours?.end || '19:00');
    setStaffLunchStart(member.workingHours?.lunchStart || '12:00');
    setStaffLunchEnd(member.workingHours?.lunchEnd || '14:00');
    setStaffWorkDays(member.workDays || 'Terça a Sábado');
    setStaffFeedbackMsg('');
    setStaffModalVisible(true);
  };

  const handleApplyWorkingHoursPreset = (preset: 'standard' | 'morning' | 'afternoon') => {
    if (preset === 'standard') {
      setStaffStart('09:00');
      setStaffEnd('19:00');
      setStaffLunchStart('12:00');
      setStaffLunchEnd('14:00');
      setStaffWorkDays('Terça a Sábado');
    } else if (preset === 'morning') {
      setStaffStart('09:00');
      setStaffEnd('12:00');
      setStaffLunchStart('12:00');
      setStaffLunchEnd('12:00');
      setStaffWorkDays('Terça a Sábado');
    } else if (preset === 'afternoon') {
      setStaffStart('14:00');
      setStaffEnd('19:00');
      setStaffLunchStart('14:00');
      setStaffLunchEnd('14:00');
      setStaffWorkDays('Terça a Sábado');
    }
  };

  const handleApplyDateRangeAbsence = () => {
    const start = absenceStartDate.trim();
    const end = absenceEndDate.trim();

    if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
      Alert.alert('Formato Inválido', 'Por favor use o formato AAAA-MM-DD (ex: 2026-10-23).');
      return;
    }

    if (start > end) {
      Alert.alert('Datas Inválidas', 'A data de início deve ser anterior ou igual à data de fim.');
      return;
    }

    const dStart = new Date(start + 'T00:00:00');
    const dEnd = new Date(end + 'T00:00:00');
    const dates: string[] = [];
    const cur = new Date(dStart);

    while (cur <= dEnd) {
      dates.push(cur.toISOString().split('T')[0]);
      cur.setDate(cur.getDate() + 1);
    }

    setStaffUnavailableDates(dates);
    if (staffStatus === 'active') {
      setStaffStatus('leave');
    }
    if (!staffAbsenceNote.trim()) {
      const daysCount = dates.length;
      setStaffAbsenceNote(daysCount === 1 ? 'Ausência / Falta pontual' : `Baixa médica (${daysCount} dias)`);
    }
  };

  const handleRemoveUnavailableDate = (date: string) => {
    setStaffUnavailableDates(prev => prev.filter(d => d !== date));
  };

  const handleClearAllAbsences = () => {
    setStaffUnavailableDates([]);
    setStaffStatus('active');
    setStaffAbsenceNote('');
  };

  const handleSaveStaff = async () => {
    if (!staffName.trim()) {
      Alert.alert('Atenção', 'Introduza o nome da profissional.');
      return;
    }

    if (editingStaffMember) {
      await updateStaffMember({
        ...editingStaffMember,
        pin: staffPin.trim() || editingStaffMember.pin,
        name: staffName.trim(),
        roleTitle: staffRole.trim() || 'Especialista Beauty',
        phone: staffPhone.trim() || '+351 910 000 000',
        status: staffStatus,
        absenceNote: staffAbsenceNote.trim(),
        unavailableDates: staffUnavailableDates,
        workDays: staffWorkDays.trim() || 'Terça a Sábado',
        workingHours: {
          start: staffStart.trim() || '09:00',
          end: staffEnd.trim() || '19:00',
          lunchStart: staffLunchStart.trim() || '12:00',
          lunchEnd: staffLunchEnd.trim() || '14:00',
        },
      });
      setStaffFeedbackMsg(`Profissional ${staffName} atualizada com sucesso!`);
    } else {
      await addStaffMember({
        branch: 'beauty',
        pin: staffPin.trim() || undefined,
        name: staffName.trim(),
        roleTitle: staffRole.trim() || 'Especialista Head-Spa',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
        phone: staffPhone.trim() || '+351 910 000 000',
        rating: 5.0,
        specialties: ['Head-Spa', 'Manicure', 'Tratamentos'],
        status: staffStatus,
        absenceNote: staffAbsenceNote.trim(),
        unavailableDates: staffUnavailableDates,
        workDays: staffWorkDays.trim() || 'Terça a Sábado',
        workingHours: {
          start: staffStart.trim() || '09:00',
          end: staffEnd.trim() || '19:00',
          lunchStart: staffLunchStart.trim() || '12:00',
          lunchEnd: staffLunchEnd.trim() || '14:00',
        },
      });
      setStaffFeedbackMsg(`Profissional ${staffName} adicionada à equipa!`);
    }

    setTimeout(() => {
      setStaffModalVisible(false);
      setEditingStaffMember(null);
      setStaffFeedbackMsg('');
    }, 900);
  };

  const handleDeleteStaff = (member: StaffMember) => {
    Alert.alert(
      'Eliminar Funcionária',
      `Tem a certeza de que deseja remover "${member.name}" da equipa Beauty? As marcações existentes serão mantidas no histórico.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteStaffMember(member.id);
          },
        },
      ]
    );
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

      {/* Main Section Navigation Bar: Gestão | Serviços | Colaboradores */}
      <View style={styles.topTabBar}>
        <TouchableOpacity
          style={[styles.topTabBtn, activeTab === 'management' && styles.topTabBtnActive]}
          onPress={() => setActiveTab('management')}
        >
          <Text
            style={[
              styles.topTabBtnText,
              activeTab === 'management' && styles.topTabBtnTextActive,
            ]}
          >
            Gestão
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
            Serviços
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.topTabBtn, activeTab === 'staff' && styles.topTabBtnActive]}
          onPress={() => setActiveTab('staff')}
        >
          <Text
            style={[
              styles.topTabBtnText,
              activeTab === 'staff' && styles.topTabBtnTextActive,
            ]}
          >
            Colaboradores
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ============================================================ */}
        {/* ABA SUPERIOR 1: GESTÃO (MARCAÇÕES & FINANÇAS) */}
        {/* ============================================================ */}
        {activeTab === 'management' && (
          <View>
            {/* Sub-abas: Marcações | Finanças */}
            <View style={styles.subTabBar}>
              <TouchableOpacity
                style={[styles.subTabBtn, managementSubTab === 'appointments' && styles.subTabBtnActive]}
                onPress={() => setManagementSubTab('appointments')}
              >
                <Text style={[styles.subTabBtnText, managementSubTab === 'appointments' && styles.subTabBtnTextActive]}>
                  Marcações ({beautyAppointments.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.subTabBtn, managementSubTab === 'finance' && styles.subTabBtnActive]}
                onPress={() => setManagementSubTab('finance')}
              >
                <Text style={[styles.subTabBtnText, managementSubTab === 'finance' && styles.subTabBtnTextActive]}>
                  Finanças
                </Text>
              </TouchableOpacity>
            </View>

            {/* SUB-ABA: MARCAÇÕES */}
            {managementSubTab === 'appointments' && (
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

            {/* SUB-ABA: FINANÇAS */}
            {managementSubTab === 'finance' && (
              <FinancialDashboard initialBranch="beauty" variant="beauty" lockBranch={true} />
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

            {/* Category Filter & Manage Filters button */}
            <View style={styles.catFilterContainerRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                {beautyCategories.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.catFilterPill, catFilter === cat && styles.catFilterPillActive]}
                    onPress={() => setCatFilter(cat)}
                  >
                    <Text style={[styles.catFilterPillText, catFilter === cat && styles.catFilterPillTextActive]}>
                      {cat} ({getCategoryCount(cat)})
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                style={styles.manageFiltersTopBtn}
                onPress={() => setManageFiltersModalVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.manageFiltersTopBtnText}>⚙️ Filtros</Text>
              </TouchableOpacity>
            </View>

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
        {/* TAB 3: GESTÃO COMPLETA DE FUNCIONÁRIAS BEAUTY */}
        {/* ============================================================ */}
        {activeTab === 'staff' && (
          <View>
            <View style={styles.servicesHeaderRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.sectionTitle}>Equipa Beauty & Spa ({beautyStaff.length})</Text>
                <Text style={styles.sectionSub}>
                  Gerir especialistas, funções, horários, baixas médicas e faltas.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.addServiceTopBtn}
                onPress={handleOpenCreateStaff}
              >
                <Text style={styles.addServiceTopBtnText}>+ Nova Especialista</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.standardScheduleBanner}>
              <Text style={styles.standardScheduleLabel}>HORÁRIO GERAL DO SALÃO DEFINIDO</Text>
              <Text style={styles.standardScheduleTitle}>
                Terça a Sábado das 09:00 às 12:00 e das 14:00 às 19:00
              </Text>
              <Text style={styles.standardScheduleSub}>
                Baixas médicas ou faltas registadas bloqueiam automaticamente a marcação de clientes online.
              </Text>
            </View>

            {beautyStaff.map(member => {
              const isLeave = member.status === 'leave';
              const isVacation = member.status === 'vacation';
              const isInactive = member.status === 'inactive';
              const hasAbsenceNotice =
                isLeave ||
                isVacation ||
                isInactive ||
                (member.unavailableDates && member.unavailableDates.length > 0) ||
                Boolean(member.absenceNote);

              return (
                <View key={member.id} style={styles.scheduleConfigCard}>
                  <View style={styles.scheduleConfigHeader}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                        <Text style={styles.scheduleConfigName}>{member.name}</Text>
                        <View
                          style={[
                            styles.staffStatusBadge,
                            isLeave
                              ? styles.staffStatusBadgeLeave
                              : isVacation
                              ? styles.staffStatusBadgeVacation
                              : isInactive
                              ? styles.staffStatusBadgeInactive
                              : styles.staffStatusBadgeActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.staffStatusBadgeText,
                              isLeave
                                ? { color: '#B45309' }
                                : isVacation
                                ? { color: '#1D4ED8' }
                                : isInactive
                                ? { color: '#6B7280' }
                                : { color: '#047857' },
                            ]}
                          >
                            {isLeave
                              ? '⚠ Baixa Médica'
                              : isVacation
                              ? '🏖 Em Férias'
                              : isInactive
                              ? '✕ Inativa'
                              : '● No Ativo'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.scheduleConfigRole}>{member.roleTitle}</Text>
                      <Text style={styles.staffPhoneSub}>Tel: {member.phone || 'Sem contacto'}</Text>
                      
                      {/* Código de Acesso PIN */}
                      <View style={styles.staffPinDisplayBadge}>
                        <Text style={styles.staffPinDisplayIcon}>🔑</Text>
                        <Text style={styles.staffPinDisplayLabel}>Código PIN:</Text>
                        <View style={styles.staffPinValueBox}>
                          <Text style={styles.staffPinDisplayValue}>{member.pin || '2001'}</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {hasAbsenceNotice && (
                    <View style={styles.staffAbsenceNoticeBox}>
                      <Text style={styles.staffAbsenceNoticeTitle}>
                        {isLeave
                          ? 'ALERTA: BAIXA MÉDICA / AUSÊNCIA ATIVA'
                          : isVacation
                          ? 'ALERTA: PERÍODO DE FÉRIAS'
                          : 'AVISO DE INDISPONIBILIDADE'}
                      </Text>
                      {member.absenceNote ? (
                        <Text style={styles.staffAbsenceNoticeText}>&quot;{member.absenceNote}&quot;</Text>
                      ) : null}
                      {member.unavailableDates && member.unavailableDates.length > 0 ? (
                        <Text style={styles.staffBlockedDatesText}>
                          Datas de ausência bloqueadas ({member.unavailableDates.length}): {member.unavailableDates.join(', ')}
                        </Text>
                      ) : null}
                      <Text style={styles.staffBlockedHint}>
                        (As vagas desta especialista nestas datas ficam inacessíveis para as clientes)
                      </Text>
                    </View>
                  )}

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

                  <View style={styles.staffActionRow}>
                    <TouchableOpacity
                      style={styles.editStaffBtn}
                      onPress={() => handleOpenEditStaff(member)}
                    >
                      <Text style={styles.editStaffBtnText}>Editar / Disponibilidade</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteStaffBtn}
                      onPress={() => handleDeleteStaff(member)}
                    >
                      <Text style={styles.deleteStaffBtnText}>Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
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
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.label}>Filtro / Categoria *</Text>
                  <TouchableOpacity onPress={() => setManageFiltersModalVisible(true)}>
                    <Text style={styles.manageFiltersLinkText}>⚙️ Gerir Filtros</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.modalFieldHint}>
                  Define em que aba de filtro este serviço/extra vai aparecer para as clientes e na gestão.
                </Text>
                <View style={styles.modalCatRow}>
                  {beautyCategories.filter(c => c !== 'TODOS').map(cat => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.modalCatPill, newServCat.toLowerCase() === cat.toLowerCase() && styles.modalCatPillActive]}
                      onPress={() => setNewServCat(cat)}
                    >
                      <Text style={[styles.modalCatPillText, newServCat.toLowerCase() === cat.toLowerCase() && styles.modalCatPillTextActive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={[styles.input, { marginTop: 6 }]}
                  value={newServCat}
                  onChangeText={setNewServCat}
                  placeholder="Ou digite outro filtro personalizado..."
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

                      {/* Filtro / Categoria do Extra */}
                      <View style={{ marginBottom: 6 }}>
                        <Text style={styles.labelMini}>Filtro / Categoria do Extra:</Text>
                        <View style={[styles.modalCatRow, { marginTop: 2 }]}>
                          {['Extras', 'Tratamentos', 'Head-Spa', 'Signature'].map(cat => (
                            <TouchableOpacity
                              key={cat}
                              style={[styles.modalCatPill, inlineExtraCat.toLowerCase() === cat.toLowerCase() && styles.modalCatPillActive]}
                              onPress={() => setInlineExtraCat(cat)}
                            >
                              <Text style={[styles.modalCatPillText, inlineExtraCat.toLowerCase() === cat.toLowerCase() && styles.modalCatPillTextActive]}>
                                {cat}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                        <TextInput
                          style={[styles.input, { marginTop: 4 }]}
                          placeholder="Categoria (Ex: Extras, Tratamentos...)"
                          placeholderTextColor="#71717A"
                          value={inlineExtraCat}
                          onChangeText={setInlineExtraCat}
                        />
                      </View>

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

      {/* Modal: Gerir Filtros e Categorias Beauty */}
      <Modal visible={manageFiltersModalVisible} transparent animationType="slide" onRequestClose={() => setManageFiltersModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setManageFiltersModalVisible(false)}>
          <Pressable style={[styles.modalContent, { maxHeight: '88%' }]} onPress={e => e.stopPropagation()}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Gerir Filtros e Categorias</Text>
              <Text style={styles.modalSub}>
                Crie novos filtros ou renomeie filtros existentes. Ao renomear um filtro, todos os serviços e extras associados são atualizados automaticamente na aplicação.
              </Text>

              {/* Criar Novo Filtro */}
              <View style={styles.addNewFilterBox}>
                <Text style={styles.filterSectionLabel}>Criar Novo Filtro / Categoria:</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={newFilterInput}
                    onChangeText={setNewFilterInput}
                    placeholder="Ex: Noivas, Tratamentos Faciais..."
                    placeholderTextColor="#71717A"
                  />
                  <TouchableOpacity
                    style={styles.addFilterBtn}
                    onPress={handleAddNewFilter}
                  >
                    <Text style={styles.addFilterBtnText}>+ Adicionar</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Lista de Filtros Ativos */}
              <Text style={[styles.filterSectionLabel, { marginTop: 18 }]}>Filtros Ativos do Catálogo:</Text>
              {beautyCategories.filter(c => c !== 'TODOS').map(cat => {
                const count = getCategoryCount(cat);
                const isEditingThis = editingFilterOldName === cat;

                return (
                  <View key={cat} style={styles.filterRowItem}>
                    {isEditingThis ? (
                      <View style={{ flex: 1, flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                        <TextInput
                          style={[styles.input, { flex: 1 }]}
                          value={editingFilterNewName}
                          onChangeText={setEditingFilterNewName}
                          placeholder="Novo nome do filtro"
                          placeholderTextColor="#71717A"
                          autoFocus
                        />
                        <TouchableOpacity
                          style={styles.saveFilterNameBtn}
                          onPress={() => handleSaveRenameFilter(cat)}
                        >
                          <Text style={styles.saveFilterNameBtnText}>Guardar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.cancelFilterNameBtn}
                          onPress={() => setEditingFilterOldName(null)}
                        >
                          <Text style={styles.cancelFilterNameBtnText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.filterRowItemName}>{cat}</Text>
                          <Text style={styles.filterRowItemSub}>
                            {count} {count === 1 ? 'item associado' : 'itens associados'}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          <TouchableOpacity
                            style={styles.editFilterBtn}
                            onPress={() => {
                              setEditingFilterOldName(cat);
                              setEditingFilterNewName(cat);
                            }}
                          >
                            <Text style={styles.editFilterBtnText}>Renomear</Text>
                          </TouchableOpacity>
                          {cat !== 'Extras' && cat !== 'Manicure / Pedicure' && (
                            <TouchableOpacity
                              style={styles.deleteFilterBtn}
                              onPress={() => handleDeleteFilter(cat)}
                            >
                              <Text style={styles.deleteFilterBtnText}>Eliminar</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </>
                    )}
                  </View>
                );
              })}

              <TouchableOpacity
                style={[styles.modalCancelBtn, { marginTop: 20 }]}
                onPress={() => setManageFiltersModalVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>Concluir / Fechar</Text>
              </TouchableOpacity>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal: Adicionar / Editar Funcionária e Disponibilidade */}
      <Modal visible={staffModalVisible} transparent animationType="slide" onRequestClose={() => setStaffModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setStaffModalVisible(false)}>
          <Pressable style={[styles.modalContent, { maxHeight: '92%' }]} onPress={e => e.stopPropagation()}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {editingStaffMember ? `Editar ${editingStaffMember.name}` : 'Nova Especialista Beauty'}
              </Text>
              <Text style={styles.modalSub}>
                Configure o perfil profissional, horário de expediente e registe baixas médicas ou faltas.
              </Text>

              {/* Nome */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Nome da Especialista *</Text>
                <TextInput
                  style={styles.input}
                  value={staffName}
                  onChangeText={setStaffName}
                  placeholder="Ex: Beatriz Santos"
                  placeholderTextColor="#71717A"
                />
              </View>

              {/* Código de Acesso PIN */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Código de Acesso PIN (4 dígitos) *</Text>
                <Text style={styles.modalFieldHint}>
                  Código gerado automaticamente para a especialista aceder ao seu perfil individual e marcações.
                </Text>
                <TextInput
                  style={[styles.input, styles.modalPinInput]}
                  value={staffPin}
                  onChangeText={setStaffPin}
                  placeholder="Ex: 2004"
                  placeholderTextColor="#71717A"
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>

              {/* Função / Cargo */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Função / Especialidade *</Text>
                <View style={styles.modalCatRow}>
                  {['Head-Spa & Terapia', 'Manicure & Pedicure', 'Esteticista / Facial', 'Cabeleireira'].map(role => (
                    <TouchableOpacity
                      key={role}
                      style={[styles.modalCatPill, staffRole === role && styles.modalCatPillActive]}
                      onPress={() => setStaffRole(role)}
                    >
                      <Text
                        style={[
                          styles.modalCatPillText,
                          staffRole === role && styles.modalCatPillTextActive,
                        ]}
                      >
                        {role}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={[styles.input, { marginTop: 6 }]}
                  value={staffRole}
                  onChangeText={setStaffRole}
                  placeholder="Ou introduza outro cargo..."
                  placeholderTextColor="#71717A"
                />
              </View>

              {/* Telefone */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Contacto Telefónico</Text>
                <TextInput
                  style={styles.input}
                  value={staffPhone}
                  onChangeText={setStaffPhone}
                  placeholder="+351 910 000 000"
                  placeholderTextColor="#71717A"
                  keyboardType="phone-pad"
                />
              </View>

              {/* Estado da Funcionária */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Estado / Disponibilidade Geral</Text>
                <View style={styles.modalCatRow}>
                  {[
                    { key: 'active', label: '● No Ativo' },
                    { key: 'leave', label: '⚠ Baixa Médica' },
                    { key: 'vacation', label: '🏖 Em Férias' },
                    { key: 'inactive', label: '✕ Inativa' },
                  ].map(st => (
                    <TouchableOpacity
                      key={st.key}
                      style={[styles.modalCatPill, staffStatus === st.key && styles.modalCatPillActive]}
                      onPress={() => setStaffStatus(st.key as typeof staffStatus)}
                    >
                      <Text
                        style={[
                          styles.modalCatPillText,
                          staffStatus === st.key && styles.modalCatPillTextActive,
                        ]}
                      >
                        {st.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Gestão de Ausências e Baixas por Intervalo de Datas */}
              <View style={styles.extrasConfigBox}>
                <Text style={styles.extrasSubTitle}>Registar Período de Ausência / Baixa</Text>
                <Text style={styles.extrasSectionNotice}>
                  Selecione a data de início e de fim. As marcações de clientes neste intervalo ficarão bloqueadas automaticamente.
                </Text>

                <View style={styles.rowTwo}>
                  <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.labelMini}>Data Início (AAAA-MM-DD)</Text>
                    <TextInput
                      style={styles.input}
                      value={absenceStartDate}
                      onChangeText={setAbsenceStartDate}
                      placeholder="2026-10-23"
                      placeholderTextColor="#71717A"
                    />
                  </View>

                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <Text style={styles.labelMini}>Data Fim (AAAA-MM-DD)</Text>
                    <TextInput
                      style={styles.input}
                      value={absenceEndDate}
                      onChangeText={setAbsenceEndDate}
                      placeholder="2026-10-25"
                      placeholderTextColor="#71717A"
                    />
                  </View>
                </View>

                {/* Motivo de ausência */}
                <View style={{ marginBottom: 10 }}>
                  <Text style={styles.labelMini}>Motivo da Ausência / Baixa</Text>
                  <TextInput
                    style={styles.input}
                    value={staffAbsenceNote}
                    onChangeText={setStaffAbsenceNote}
                    placeholder="Ex: Baixa médica de 3 dias com atestado"
                    placeholderTextColor="#71717A"
                  />
                </View>

                {/* Botões de Ação para Ausência */}
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                  <TouchableOpacity
                    style={styles.applyDateRangeBtn}
                    onPress={handleApplyDateRangeAbsence}
                  >
                    <Text style={styles.applyDateRangeBtnText}>Bloquear Período Selecionado</Text>
                  </TouchableOpacity>

                  {staffUnavailableDates.length > 0 && (
                    <TouchableOpacity
                      style={styles.clearAbsenceBtn}
                      onPress={handleClearAllAbsences}
                    >
                      <Text style={styles.clearAbsenceBtnText}>Limpar / Reativar</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Visualização do período e das datas bloqueadas */}
                {staffUnavailableDates.length > 0 ? (
                  <View style={styles.blockedDatesContainer}>
                    <Text style={styles.extrasSubTitle}>
                      Período Bloqueado ({staffUnavailableDates.length} {staffUnavailableDates.length === 1 ? 'dia' : 'dias'}):
                    </Text>
                    <Text style={styles.staffBlockedDatesSummary}>
                      De {staffUnavailableDates[0]} até {staffUnavailableDates[staffUnavailableDates.length - 1]}
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>
                      {staffUnavailableDates.map(date => (
                        <View key={date} style={styles.blockedDateBadge}>
                          <Text style={styles.blockedDateBadgeText}>{date}</Text>
                          <TouchableOpacity onPress={() => handleRemoveUnavailableDate(date)}>
                            <Text style={styles.blockedDateRemove}>✕</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : (
                  <Text style={[styles.extrasSectionNotice, { marginTop: 8, fontStyle: 'italic' }]}>
                    Nenhum período de ausência bloqueado atualmente.
                  </Text>
                )}
              </View>

              {/* Horário de Trabalho e Presets */}
              <Text style={styles.presetTitle}>Horário de Expediente & Presets:</Text>
              <View style={styles.presetRow}>
                <TouchableOpacity
                  style={styles.presetBtn}
                  onPress={() => handleApplyWorkingHoursPreset('standard')}
                >
                  <Text style={styles.presetBtnText}>Padrão (09:00-12:00 / 14:00-19:00)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.presetBtn}
                  onPress={() => handleApplyWorkingHoursPreset('morning')}
                >
                  <Text style={styles.presetBtnText}>Só Manhã (09:00-12:00)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.presetBtn}
                  onPress={() => handleApplyWorkingHoursPreset('afternoon')}
                >
                  <Text style={styles.presetBtnText}>Só Tarde (14:00-19:00)</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formGrid}>
                <View style={styles.formCol}>
                  <Text style={styles.modalLabel}>Hora de Entrada</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={staffStart}
                    onChangeText={setStaffStart}
                    placeholder="09:00"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View style={styles.formCol}>
                  <Text style={styles.modalLabel}>Hora de Saída</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={staffEnd}
                    onChangeText={setStaffEnd}
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
                    value={staffLunchStart}
                    onChangeText={setStaffLunchStart}
                    placeholder="12:00"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                <View style={styles.formCol}>
                  <Text style={styles.modalLabel}>Fim Almoço</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={staffLunchEnd}
                    onChangeText={setStaffLunchEnd}
                    placeholder="14:00"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Dias de Trabalho</Text>
                <TextInput
                  style={styles.modalInput}
                  value={staffWorkDays}
                  onChangeText={setStaffWorkDays}
                  placeholder="Terça a Sábado"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              {staffFeedbackMsg ? (
                <Text style={styles.feedbackSuccessText}>{staffFeedbackMsg}</Text>
              ) : null}

              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveStaff}>
                <Text style={styles.modalSaveBtnText}>
                  {editingStaffMember ? 'Guardar Alterações da Especialista' : 'Criar Especialista'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setStaffModalVisible(false);
                  setEditingStaffMember(null);
                }}
              >
                <Text style={styles.modalCancelBtnText}>Fechar</Text>
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
  subTabBar: {
    flexDirection: 'row',
    backgroundColor: '#FCE7F3',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FBCFE8',
  },
  subTabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  subTabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F472B6',
  },
  subTabBtnText: {
    color: '#831843',
    fontSize: 13,
    fontWeight: '700',
  },
  subTabBtnTextActive: {
    color: '#111827',
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
  // Staff & Absence Management Styles
  staffStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  staffStatusBadgeActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  staffStatusBadgeLeave: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  staffStatusBadgeVacation: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  staffStatusBadgeInactive: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  staffStatusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  staffPhoneSub: {
    color: '#6B7280',
    fontSize: 11,
    marginTop: 2,
  },
  staffAbsenceNoticeBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    padding: 10,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  staffAbsenceNoticeTitle: {
    color: '#B45309',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  staffAbsenceNoticeText: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  staffBlockedDatesText: {
    color: '#374151',
    fontSize: 11,
    marginTop: 4,
    lineHeight: 16,
  },
  staffBlockedHint: {
    color: '#6B7280',
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 2,
  },
  staffActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
  },
  editStaffBtn: {
    backgroundColor: '#D4AF37',
    borderWidth: 1,
    borderColor: '#B8860B',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
  },
  editStaffBtnText: {
    color: '#111827',
    fontSize: 11,
    fontWeight: '800',
  },
  deleteStaffBtn: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
  },
  deleteStaffBtnText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '700',
  },
  applyDateRangeBtn: {
    backgroundColor: '#D4AF37',
    borderWidth: 1,
    borderColor: '#B8860B',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
  },
  applyDateRangeBtnText: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '900',
  },
  clearAbsenceBtn: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearAbsenceBtnText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '800',
  },
  staffBlockedDatesSummary: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },
  quickAbsenceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 6,
  },
  quickAbsenceBtn: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  quickAbsenceBtnText: {
    color: '#374151',
    fontSize: 11,
    fontWeight: '700',
  },
  quickAbsenceBtnHighlight: {
    backgroundColor: '#FFFBEB',
    borderColor: '#D4AF37',
  },
  addDatePillBtn: {
    backgroundColor: '#D4AF37',
    borderWidth: 1,
    borderColor: '#B8860B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addDatePillBtnText: {
    color: '#111827',
    fontSize: 11,
    fontWeight: '900',
  },
  blockedDatesContainer: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#F3E8FF',
    marginTop: 8,
  },
  blockedDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FCE7F3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#FBCFE8',
  },
  blockedDateBadgeText: {
    color: '#831843',
    fontSize: 11,
    fontWeight: '700',
  },
  blockedDateRemove: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '900',
    marginLeft: 6,
  },
  extrasSubTitle: {
    color: '#831843',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  extrasSectionNotice: {
    color: '#6B7280',
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 8,
  },
  labelMini: {
    fontSize: 11,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 4,
  },
  staffPinDisplayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF2F8',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#FBCFE8',
  },
  staffPinDisplayIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  staffPinDisplayLabel: {
    fontSize: 11,
    color: '#9D174D',
    fontWeight: '600',
    marginRight: 6,
  },
  staffPinValueBox: {
    backgroundColor: '#FCE7F3',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#EC4899',
  },
  staffPinDisplayValue: {
    fontSize: 12,
    color: '#BE185D',
    fontWeight: '900',
    letterSpacing: 2,
  },
  modalPinInput: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 4,
    color: '#BE185D',
    backgroundColor: '#FFF',
  },
  modalFieldHint: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 6,
    lineHeight: 15,
  },
  catFilterContainerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 8,
  },
  manageFiltersTopBtn: {
    backgroundColor: '#FDF2F8',
    borderWidth: 1,
    borderColor: '#EC4899',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manageFiltersTopBtnText: {
    color: '#BE185D',
    fontSize: 11,
    fontWeight: '800',
  },
  manageFiltersLinkText: {
    color: '#BE185D',
    fontSize: 11,
    fontWeight: '800',
  },
  addNewFilterBox: {
    backgroundColor: '#FDF2F8',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FCE7F3',
    marginTop: 6,
  },
  filterSectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#831843',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  addFilterBtn: {
    backgroundColor: '#BE185D',
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addFilterBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
  },
  filterRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#F3E8FF',
  },
  filterRowItemName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1F2937',
  },
  filterRowItemSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  editFilterBtn: {
    backgroundColor: '#FCE7F3',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FBCFE8',
  },
  editFilterBtnText: {
    color: '#BE185D',
    fontSize: 11,
    fontWeight: '700',
  },
  deleteFilterBtn: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
  },
  deleteFilterBtnText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '700',
  },
  saveFilterNameBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  saveFilterNameBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  cancelFilterNameBtn: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
  },
  cancelFilterNameBtnText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '900',
  },
});
