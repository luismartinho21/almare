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
  Image,
  Platform,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { StaffMember, Service, ServiceExperienceConfig } from '../types';
import { Theme } from '../constants/theme';
import { getGestorNotifyClientWhatsAppUrl } from '../utils/reminderHelper';
import { FinancialDashboard } from '../components/FinancialDashboard';
import { compressImageFile } from '../utils/imageHelper';
import { ExperienceConfigSection } from '../components/ExperienceConfigSection';
import { ExperienceEditorModal } from '../components/ExperienceEditorModal';

type GestorTab = 'management' | 'services' | 'staff';
type ManagementSubTab = 'appointments' | 'finance';

const DEFAULT_BARBER_AVATAR = 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200';
const BARBER_AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
];

export const GestorBarberView: React.FC = () => {
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
    cloudConnected,
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
  const [newServCat, setNewServCat] = useState('Cortes');
  const [newServName, setNewServName] = useState('');
  const [newServDesc, setNewServDesc] = useState('');
  const [newServLongDesc, setNewServLongDesc] = useState('');
  const [newServPrice, setNewServPrice] = useState('18');
  const [newServDur, setNewServDur] = useState('30');
  const [hasExtras, setHasExtras] = useState(false);
  const [selectedExtraIds, setSelectedExtraIds] = useState<string[]>([]);
  const [isExperience, setIsExperience] = useState<boolean>(false);
  const [expConfigDraft, setExpConfigDraft] = useState<ServiceExperienceConfig | undefined>(undefined);
  const [expEditorVisible, setExpEditorVisible] = useState<boolean>(false);
  const [expPersonalized, setExpPersonalized] = useState<boolean>(false);
  const [showInlineNewExtra, setShowInlineNewExtra] = useState(false);
  const [inlineExtraName, setInlineExtraName] = useState('');
  const [inlineExtraDesc, setInlineExtraDesc] = useState('');
  const [inlineExtraLongDesc, setInlineExtraLongDesc] = useState('');
  const [inlineExtraPrice, setInlineExtraPrice] = useState('5');
  const [inlineExtraDur, setInlineExtraDur] = useState('10');
  const [inlineExtraCat, setInlineExtraCat] = useState('Extras');

  // Filter / Category customization states
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [manageFiltersModalVisible, setManageFiltersModalVisible] = useState(false);
  const [newFilterInput, setNewFilterInput] = useState('');
  const [editingFilterOldName, setEditingFilterOldName] = useState<string | null>(null);
  const [editingFilterNewName, setEditingFilterNewName] = useState('');

  // Confirmation modal states for deletions (100% reliable on web & mobile)
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmData, setConfirmData] = useState<{
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => Promise<void> | void;
  } | null>(null);

  // Staff management & availability states
  const [staffModalVisible, setStaffModalVisible] = useState(false);
  const [editingStaffMember, setEditingStaffMember] = useState<StaffMember | null>(null);
  const [staffPin, setStaffPin] = useState('');
  const [staffAvatar, setStaffAvatar] = useState(DEFAULT_BARBER_AVATAR);
  const [staffName, setStaffName] = useState('');
  const [staffRole, setStaffRole] = useState('Barbeiro Especialista');
  const [staffPhone, setStaffPhone] = useState('+351 910 000 000');
  const [staffStatus, setStaffStatus] = useState<'active' | 'inactive'>('active');
  const [staffAbsenceNote, setStaffAbsenceNote] = useState('');
  const [staffUnavailableDates, setStaffUnavailableDates] = useState<string[]>([]);
  const [absenceStartDate, setAbsenceStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [absenceEndDate, setAbsenceEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Staff working hours & schedule (padrão: 09:30 - 12:30 e 14:00 - 19:00)
  const [staffStart, setStaffStart] = useState('09:30');
  const [staffEnd, setStaffEnd] = useState('19:00');
  const [staffLunchStart, setStaffLunchStart] = useState('12:30');
  const [staffLunchEnd, setStaffLunchEnd] = useState('14:00');
  const [staffWorkDays, setStaffWorkDays] = useState('Terça a Sábado');
  const [staffFeedbackMsg, setStaffFeedbackMsg] = useState('');

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

  const handlePickAvatarFile = () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e: any) => {
        const file = e.target?.files?.[0];
        if (file) {
          try {
            // Compress and resize to 240x240 thumbnail (~15-25KB) to prevent storage quota issues
            const compressed = await compressImageFile(file, 240, 240, 0.82);
            if (compressed) {
              setStaffAvatar(compressed);
            }
          } catch (err) {
            console.error('Error compressing avatar image:', err);
            Alert.alert('Erro', 'Não foi possível carregar a imagem selecionada.');
          }
        }
      };
      input.click();
    } else {
      Alert.alert('Carregar Foto', 'Introduza o link da imagem no campo abaixo.');
    }
  };

  const handleOpenCreateStaff = () => {
    const today = new Date().toISOString().split('T')[0];
    const nextPin = generateStaffPin('barber');
    setEditingStaffMember(null);
    setStaffPin(nextPin);
    setStaffAvatar(DEFAULT_BARBER_AVATAR);
    setStaffName('');
    setStaffRole('Barbeiro Especialista');
    setStaffStatus('active');
    setStaffAbsenceNote('');
    setStaffUnavailableDates([]);
    setAbsenceStartDate(today);
    setAbsenceEndDate(today);
    setStaffStart('09:30');
    setStaffEnd('19:00');
    setStaffLunchStart('12:30');
    setStaffLunchEnd('14:00');
    setStaffWorkDays('Terça a Sábado');
    setStaffFeedbackMsg('');
    setStaffModalVisible(true);
  };

  const handleOpenEditStaff = (member: StaffMember) => {
    const today = new Date().toISOString().split('T')[0];
    setEditingStaffMember(member);
    setStaffPin(member.pin || generateStaffPin('barber'));
    setStaffAvatar(member.avatar || DEFAULT_BARBER_AVATAR);
    setStaffName(member.name);
    setStaffRole(member.roleTitle);
    setStaffStatus(member.status === 'inactive' ? 'inactive' : 'active');
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

    setStaffStart(member.workingHours?.start || '09:30');
    setStaffEnd(member.workingHours?.end || '19:00');
    setStaffLunchStart(member.workingHours?.lunchStart || '12:30');
    setStaffLunchEnd(member.workingHours?.lunchEnd || '14:00');
    setStaffWorkDays(member.workDays || 'Terça a Sábado');
    setStaffFeedbackMsg('');
    setStaffModalVisible(true);
  };

  const handleApplyWorkingHoursPreset = (preset: 'standard' | 'morning' | 'afternoon') => {
    if (preset === 'standard') {
      setStaffStart('09:30');
      setStaffEnd('19:00');
      setStaffLunchStart('12:30');
      setStaffLunchEnd('14:00');
      setStaffWorkDays('Terça a Sábado');
    } else if (preset === 'morning') {
      setStaffStart('09:30');
      setStaffEnd('12:30');
      setStaffLunchStart('12:30');
      setStaffLunchEnd('12:30');
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
      Alert.alert('Atenção', 'Introduza o nome do profissional.');
      return;
    }

    if (editingStaffMember) {
      await updateStaffMember({
        ...editingStaffMember,
        pin: staffPin.trim() || editingStaffMember.pin,
        avatar: staffAvatar.trim() || DEFAULT_BARBER_AVATAR,
        name: staffName.trim(),
        roleTitle: staffRole.trim() || 'Barbeiro Especialista',
        phone: '',
        status: staffStatus,
        absenceNote: staffAbsenceNote.trim(),
        unavailableDates: staffUnavailableDates,
        workDays: staffWorkDays.trim() || 'Terça a Sábado',
        workingHours: {
          start: staffStart.trim() || '09:30',
          end: staffEnd.trim() || '19:00',
          lunchStart: staffLunchStart.trim() || '12:30',
          lunchEnd: staffLunchEnd.trim() || '14:00',
        },
      });
      setStaffFeedbackMsg(`Barbeiro ${staffName} atualizado com sucesso!`);
    } else {
      await addStaffMember({
        branch: 'barber',
        pin: staffPin.trim() || undefined,
        name: staffName.trim(),
        roleTitle: staffRole.trim() || 'Barbeiro Especialista',
        avatar: staffAvatar.trim() || DEFAULT_BARBER_AVATAR,
        phone: '',
        rating: 5.0,
        specialties: ['Corte Clássico', 'Barba Terapia', 'Degradê'],
        status: staffStatus,
        absenceNote: staffAbsenceNote.trim(),
        unavailableDates: staffUnavailableDates,
        workDays: staffWorkDays.trim() || 'Terça a Sábado',
        workingHours: {
          start: staffStart.trim() || '09:30',
          end: staffEnd.trim() || '19:00',
          lunchStart: staffLunchStart.trim() || '12:30',
          lunchEnd: staffLunchEnd.trim() || '14:00',
        },
      });
      setStaffFeedbackMsg(`Barbeiro ${staffName} adicionado à equipa!`);
    }

    setTimeout(() => {
      setStaffModalVisible(false);
      setEditingStaffMember(null);
      setStaffFeedbackMsg('');
    }, 900);
  };

  const handleDeleteStaff = (member: StaffMember) => {
    setConfirmData({
      title: 'Eliminar Barbeiro',
      message: `Tem a certeza de que deseja remover "${member.name}" da equipa de barbeiros? As marcações existentes serão mantidas no histórico.`,
      confirmLabel: 'Eliminar Barbeiro',
      onConfirm: async () => {
        await deleteStaffMember(member.id);
      },
    });
    setConfirmModalVisible(true);
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
    const defaultCats = ['Cortes', 'Barbas', 'Signature', 'Experiências', 'Extras'];
    const dynamicCats = Array.from(new Set(barberServices.map(s => s.category).filter(Boolean)));
    const merged = Array.from(new Set([...defaultCats, ...dynamicCats, ...customCategories]));
    return ['TODOS', ...merged];
  }, [barberServices, customCategories]);

  const getCategoryCount = (cat: string) => {
    if (cat === 'TODOS') return barberServices.length;
    return barberServices.filter(s => s.category.toLowerCase() === cat.toLowerCase()).length;
  };

  const handleAddNewFilter = () => {
    const name = newFilterInput.trim();
    if (!name) {
      Alert.alert('Atenção', 'Introduza o nome do filtro.');
      return;
    }
    if (barberCategories.map(c => c.toLowerCase()).includes(name.toLowerCase())) {
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
    await renameCategory('barber', oldName, newName);
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
    setConfirmData({
      title: 'Eliminar Filtro',
      message: count > 0
        ? `O filtro "${filterName}" tem ${count} serviço(s) associado(s). Ao eliminar, estes serviços passarão para a categoria "Cortes". Deseja continuar?`
        : `Tem a certeza de que deseja eliminar o filtro "${filterName}"?`,
      confirmLabel: 'Eliminar Filtro',
      onConfirm: async () => {
        if (count > 0) {
          await deleteCategory('barber', filterName, 'Cortes');
        }
        setCustomCategories(prev => prev.filter(c => c.toLowerCase() !== filterName.toLowerCase()));
        if (catFilter.toLowerCase() === filterName.toLowerCase()) {
          setCatFilter('TODOS');
        }
        if (newServCat.toLowerCase() === filterName.toLowerCase()) {
          setNewServCat('Cortes');
        }
      },
    });
    setConfirmModalVisible(true);
  };

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
    setNewServLongDesc('');
    setNewServPrice('18');
    setNewServDur('30');
    setHasExtras(false);
    setSelectedExtraIds([]);
    setIsExperience(false);
    setExpConfigDraft(undefined);
    setExpPersonalized(false);
    setShowInlineNewExtra(false);
    setInlineExtraDesc('');
    setInlineExtraLongDesc('');
    setServiceModalVisible(true);
  };

  const handleOpenEditService = (service: Service) => {
    setEditingService(service);
    setNewServCat(service.category);
    setNewServName(service.name);
    setNewServDesc(service.description || '');
    setNewServLongDesc(service.longDescription || '');
    setNewServPrice(String(service.price));
    setNewServDur(String(service.durationMinutes));
    setHasExtras(!!(service.compatibleExtraIds && service.compatibleExtraIds.length > 0));
    setSelectedExtraIds(service.compatibleExtraIds || []);
    setIsExperience(!!service.experienceConfig?.enabled);
    setExpConfigDraft(
      service.experienceConfig
        ? JSON.parse(JSON.stringify(service.experienceConfig))
        : undefined
    );
    setExpPersonalized(!!service.experienceConfig?.enabled);
    setShowInlineNewExtra(false);
    setInlineExtraDesc('');
    setInlineExtraLongDesc('');
    setServiceModalVisible(true);
  };

  const handleCreateInlineExtra = async () => {
    if (!inlineExtraName.trim()) {
      Alert.alert('Atenção', 'Introduza o nome do extra.');
      return;
    }
    const created = await addService({
      branch: 'barber',
      category: inlineExtraCat.trim() || 'Extras',
      name: inlineExtraName.trim(),
      description: inlineExtraDesc.trim() || 'Extra de precisão e qualidade Almare Barber.',
      longDescription: inlineExtraLongDesc.trim() || inlineExtraDesc.trim(),
      price: parseFloat(inlineExtraPrice.replace(',', '.')) || 5,
      durationMinutes: parseInt(inlineExtraDur, 10) || 10,
      iconName: '',
    });
    setSelectedExtraIds(prev => [...prev, created.id]);
    setInlineExtraName('');
    setInlineExtraDesc('');
    setInlineExtraLongDesc('');
    setShowInlineNewExtra(false);
  };

  const handleSaveService = async () => {
    if (!newServName.trim()) {
      Alert.alert('Atenção', 'Introduza o nome do serviço.');
      return;
    }

    if (isExperience && (!expPersonalized || !expConfigDraft || expConfigDraft.restaurants.length === 0)) {
      Alert.alert(
        'Personalizar Experiência',
        'Para guardar um serviço com Experiência Exclusiva, personalize primeiro os restaurantes parceiros e os respetivos menus.'
      );
      setExpEditorVisible(true);
      return;
    }

    const priceNum = parseFloat(newServPrice.replace(',', '.')) || 0;
    const durNum = parseInt(newServDur, 10) || 15;

    const experienceConfig = isExperience ? expConfigDraft : undefined;

    if (editingService) {
      await updateService({
        ...editingService,
        name: newServName.trim(),
        category: newServCat.trim() || 'Cortes',
        description: newServDesc.trim(),
        longDescription: newServLongDesc.trim(),
        price: priceNum,
        durationMinutes: durNum,
        compatibleExtraIds: hasExtras ? selectedExtraIds : [],
        experienceConfig,
      });
    } else {
      await addService({
        branch: 'barber',
        category: newServCat.trim() || 'Cortes',
        name: newServName.trim(),
        description: newServDesc.trim() || 'Serviço de excelência Almare Barber.',
        longDescription: newServLongDesc.trim(),
        price: priceNum,
        durationMinutes: durNum,
        iconName: '',
        compatibleExtraIds: hasExtras ? selectedExtraIds : [],
        experienceConfig,
      });
    }

    setServiceModalVisible(false);
    setEditingService(null);
  };

  const handleDeleteService = (service: Service) => {
    const isExtra = service.category.toLowerCase() === 'extras';
    setConfirmData({
      title: isExtra ? 'Eliminar Extra' : 'Eliminar Serviço',
      message: `Tem a certeza de que deseja eliminar "${service.name}"?`,
      confirmLabel: 'Eliminar',
      onConfirm: async () => {
        await deleteService(service.id);
      },
    });
    setConfirmModalVisible(true);
  };

  return (
    <View style={styles.container}>
      {/* Dashboard Top Header */}
      <View style={styles.header}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.headerTitle}>PAINEL DE GESTÃO - BARBER</Text>
          <Text style={styles.headerSub}>Almare Barber Shop • Acesso Exclusivo Gestor</Text>
        </View>
        <View style={[styles.cloudBadge, cloudConnected ? styles.cloudBadgeConnected : styles.cloudBadgeLocal]}>
          <Text style={styles.cloudBadgeText}>{cloudConnected ? '🟢 Nuvem Ativa' : '🟡 Modo Local'}</Text>
        </View>
      </View>

      {/* Tabs: Gestão | Serviços | Colaboradores */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'management' && styles.tabBtnActive]}
          onPress={() => setActiveTab('management')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'management' && styles.tabBtnTextActive]}>
            Gestão
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'services' && styles.tabBtnActive]}
          onPress={() => setActiveTab('services')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'services' && styles.tabBtnTextActive]}>
            Serviços
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'staff' && styles.tabBtnActive]}
          onPress={() => setActiveTab('staff')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'staff' && styles.tabBtnTextActive]}>
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
                  Marcações ({barberAppointments.length})
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
                    {app.experienceSelection ? (
                      <View style={{ marginTop: 6, padding: 8, borderRadius: 8, backgroundColor: '#22222B', borderWidth: 1, borderColor: '#D4AF37' }}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: '#D4AF37' }}>
                          🍽️ EXPERIÊNCIA: {app.experienceSelection.restaurantName}
                        </Text>
                        <Text style={{ fontSize: 11, color: '#E4E4E7', marginTop: 2 }}>
                          Menu Selecionado: {app.experienceSelection.menuName}
                        </Text>
                      </View>
                    ) : null}
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

            {/* SUB-ABA: FINANÇAS */}
            {managementSubTab === 'finance' && (
              <FinancialDashboard initialBranch="barber" variant="dark" lockBranch={true} />
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

            {/* Category Filter & Manage Filters button */}
            <View style={styles.catFilterContainerRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                {barberCategories.map(cat => (
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

                    {item.experienceConfig?.enabled ? (
                      <View style={{ marginTop: 6, padding: 8, borderRadius: 8, backgroundColor: '#252117', borderWidth: 1, borderColor: '#D4AF37' }}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: '#D4AF37' }}>
                          ✨ EXPERIÊNCIA EXCLUSIVA • {item.experienceConfig.restaurants.length} RESTAURANTE(S)
                        </Text>
                        {item.experienceConfig.restaurants.map(r => (
                          <Text key={r.id} style={{ fontSize: 10, color: '#E4E4E7', marginTop: 2 }}>
                            • {r.name} ({r.menus.length} menus)
                          </Text>
                        ))}
                      </View>
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
        {/* TAB 3: GESTÃO COMPLETA DE FUNCIONÁRIOS (BARBER) */}
        {/* ============================================================ */}
        {activeTab === 'staff' && (
          <View>
            <View style={styles.servicesHeaderRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.sectionTitle}>Equipa de Barbeiros ({barberStaff.length})</Text>
                <Text style={styles.sectionSub}>
                  Gerir barbeiros, funções, horários, baixas médicas e faltas.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.addServiceTopBtn}
                onPress={handleOpenCreateStaff}
              >
                <Text style={styles.addServiceTopBtnText}>+ Novo Barbeiro</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.standardScheduleBanner}>
              <Text style={styles.standardScheduleLabel}>HORÁRIO GERAL DO SALÃO DEFINIDO</Text>
              <Text style={styles.standardScheduleTitle}>
                Terça a Sábado das 09:30 às 12:30 e das 14:00 às 19:00
              </Text>
              <Text style={styles.standardScheduleSub}>
                Baixas médicas ou faltas registadas bloqueiam automaticamente a marcação de clientes online.
              </Text>
            </View>

            {barberStaff.map(member => {
              const isInactive = member.status === 'inactive';
              const hasBlockedDates = member.unavailableDates && member.unavailableDates.length > 0;

              return (
                <View key={member.id} style={styles.scheduleConfigCard}>
                  <View style={styles.scheduleConfigHeader}>
                    {/* Foto de Rosto do Barbeiro */}
                    <View style={styles.managerStaffAvatarContainer}>
                      {member.avatar ? (
                        <Image source={{ uri: member.avatar }} style={styles.managerStaffAvatarImg} resizeMode="cover" />
                      ) : (
                        <View style={styles.managerStaffAvatarPlaceholder}>
                          <Text style={styles.managerStaffAvatarInitial}>{member.name.charAt(0).toUpperCase()}</Text>
                        </View>
                      )}
                    </View>

                    <View style={{ flex: 1, marginRight: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                        <Text style={styles.scheduleConfigName}>{member.name}</Text>
                        <View
                          style={[
                            styles.staffStatusBadge,
                            isInactive
                              ? styles.staffStatusBadgeInactive
                              : styles.staffStatusBadgeActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.staffStatusBadgeText,
                              isInactive
                                ? { color: '#A1A1AA' }
                                : { color: '#10B981' },
                            ]}
                          >
                            {isInactive ? '✕ Inativo' : '● Ativo'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.scheduleConfigRole}>{member.roleTitle}</Text>
                      
                      {/* Código de Acesso PIN */}
                      <View style={styles.staffPinDisplayBadge}>
                        <Text style={styles.staffPinDisplayIcon}>🔑</Text>
                        <Text style={styles.staffPinDisplayLabel}>Código PIN:</Text>
                        <View style={styles.staffPinValueBox}>
                          <Text style={styles.staffPinDisplayValue}>{member.pin || '1001'}</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {hasBlockedDates && (
                    <View style={styles.staffAbsenceNoticeBox}>
                      <Text style={styles.staffAbsenceNoticeTitle}>
                        AVISO: DATAS BLOQUEADAS ({member.unavailableDates!.length} {member.unavailableDates!.length === 1 ? 'dia' : 'dias'})
                      </Text>
                      <Text style={styles.staffBlockedDatesText}>
                        Datas: {member.unavailableDates!.join(', ')}
                      </Text>
                      <Text style={styles.staffBlockedHint}>
                        (As vagas deste profissional nestas datas ficam inacessíveis para os clientes)
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
                        {member.workingHours?.start || '09:30'} - {member.workingHours?.lunchStart || '12:30'}
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
                    Pausa de almoço: {member.workingHours?.lunchStart || '12:30'} às{' '}
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

      {/* Modal: Adicionar / Editar Funcionário e Disponibilidade */}
      <Modal visible={staffModalVisible} transparent animationType="slide" onRequestClose={() => setStaffModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setStaffModalVisible(false)}>
          <Pressable style={[styles.modalBody, { maxHeight: '92%' }]} onPress={e => e.stopPropagation()}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {editingStaffMember ? `Editar ${editingStaffMember.name}` : 'Novo Barbeiro'}
              </Text>
              <Text style={styles.modalSub}>
                Configure o perfil profissional, horário de expediente e registe baixas médicas ou faltas.
              </Text>

              {/* Nome */}
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Nome do Barbeiro *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={staffName}
                  onChangeText={setStaffName}
                  placeholder="Ex: Diogo Silva"
                  placeholderTextColor="#71717A"
                />
              </View>

              {/* Código de Acesso PIN */}
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Código de Acesso PIN (4 dígitos) *</Text>
                <Text style={styles.modalFieldHint}>
                  Código gerado automaticamente para o barbeiro aceder ao seu perfil individual e marcações.
                </Text>
                <TextInput
                  style={[styles.modalInput, styles.modalPinInput]}
                  value={staffPin}
                  onChangeText={setStaffPin}
                  placeholder="Ex: 1004"
                  placeholderTextColor="#71717A"
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>

              {/* Função / Cargo */}
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Função / Cargo *</Text>
                <View style={styles.categoryPillRow}>
                  {['Master Barber', 'Barbeiro Especialista', 'Barbeiro', 'Colorista Masculino'].map(role => (
                    <TouchableOpacity
                      key={role}
                      style={[styles.categorySelectPill, staffRole === role && styles.categorySelectPillActive]}
                      onPress={() => setStaffRole(role)}
                    >
                      <Text
                        style={[
                          styles.categorySelectPillText,
                          staffRole === role && styles.categorySelectPillTextActive,
                        ]}
                      >
                        {role}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={[styles.modalInput, { marginTop: 6 }]}
                  value={staffRole}
                  onChangeText={setStaffRole}
                  placeholder="Ou introduza outro cargo..."
                  placeholderTextColor="#71717A"
                />
              </View>

              {/* Foto de Perfil / Rosto */}
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Foto de Rosto do Barbeiro</Text>
                <Text style={styles.modalFieldHint}>
                  A foto será visível pelos clientes ao escolher o profissional e no perfil do colaborador.
                </Text>

                <View style={styles.avatarPickerContainer}>
                  <View style={styles.avatarPreviewBox}>
                    {staffAvatar ? (
                      <Image source={{ uri: staffAvatar }} style={styles.avatarPreviewImg} resizeMode="cover" />
                    ) : (
                      <View style={styles.avatarPreviewPlaceholder}>
                        <Text style={styles.avatarPreviewInitial}>
                          {staffName ? staffName.charAt(0).toUpperCase() : 'B'}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={{ flex: 1, gap: 8 }}>
                    <TouchableOpacity style={styles.uploadPhotoBtn} onPress={handlePickAvatarFile}>
                      <Text style={styles.uploadPhotoBtnText}>📷 Carregar Foto do Dispositivo</Text>
                    </TouchableOpacity>

                    <Text style={styles.modalFieldLabelMini}>Ou escolha uma sugestão:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                      {BARBER_AVATAR_PRESETS.map((preset, idx) => (
                        <TouchableOpacity
                          key={idx}
                          onPress={() => setStaffAvatar(preset)}
                          style={[
                            styles.avatarPresetThumbBtn,
                            staffAvatar === preset && styles.avatarPresetThumbBtnActive,
                          ]}
                        >
                          <Image source={{ uri: preset }} style={styles.avatarPresetThumbImg} resizeMode="cover" />
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                <TextInput
                  style={[styles.modalInput, { marginTop: 8, fontSize: 12 }]}
                  value={staffAvatar}
                  onChangeText={setStaffAvatar}
                  placeholder="Ou cole aqui o link (URL) da imagem..."
                  placeholderTextColor="#71717A"
                />
              </View>

              {/* Estado do Funcionário */}
              <View style={styles.modalField}>
                <Text style={styles.modalLabel}>Estado / Disponibilidade Geral</Text>
                <View style={styles.categoryPillRow}>
                  {[
                    { key: 'active', label: '● Ativo' },
                    { key: 'inactive', label: '✕ Inativo' },
                  ].map(st => (
                    <TouchableOpacity
                      key={st.key}
                      style={[styles.categorySelectPill, staffStatus === st.key && styles.categorySelectPillActive]}
                      onPress={() => setStaffStatus(st.key as typeof staffStatus)}
                    >
                      <Text
                        style={[
                          styles.categorySelectPillText,
                          staffStatus === st.key && styles.categorySelectPillTextActive,
                        ]}
                      >
                        {st.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Gestão de Ausências e Baixas por Intervalo de Datas */}
              <View style={styles.extrasSectionContainer}>
                <Text style={styles.serviceFieldLabel}>Registar Período de Ausência / Baixa</Text>
                <Text style={styles.extrasSectionNotice}>
                  Selecione a data de início e de fim. As marcações de clientes neste intervalo ficarão bloqueadas automaticamente.
                </Text>

                <View style={styles.formGrid}>
                  <View style={styles.formCol}>
                    <Text style={styles.modalFieldLabelMini}>Data Início (AAAA-MM-DD)</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={absenceStartDate}
                      onChangeText={setAbsenceStartDate}
                      placeholder="2026-10-23"
                      placeholderTextColor="#71717A"
                    />
                  </View>

                  <View style={styles.formCol}>
                    <Text style={styles.modalFieldLabelMini}>Data Fim (AAAA-MM-DD)</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={absenceEndDate}
                      onChangeText={setAbsenceEndDate}
                      placeholder="2026-10-25"
                      placeholderTextColor="#71717A"
                    />
                  </View>
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
                  <Text style={styles.presetBtnText}>Padrão (09:30-12:30 / 14:00-19:00)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.presetBtn}
                  onPress={() => handleApplyWorkingHoursPreset('morning')}
                >
                  <Text style={styles.presetBtnText}>Só Manhã (09:30-12:30)</Text>
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
                    placeholder="09:30"
                    placeholderTextColor="#71717A"
                  />
                </View>

                <View style={styles.formCol}>
                  <Text style={styles.modalLabel}>Hora de Saída</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={staffEnd}
                    onChangeText={setStaffEnd}
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
                    value={staffLunchStart}
                    onChangeText={setStaffLunchStart}
                    placeholder="12:30"
                    placeholderTextColor="#71717A"
                  />
                </View>

                <View style={styles.formCol}>
                  <Text style={styles.modalLabel}>Fim Almoço</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={staffLunchEnd}
                    onChangeText={setStaffLunchEnd}
                    placeholder="14:00"
                    placeholderTextColor="#71717A"
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
                  placeholderTextColor="#71717A"
                />
              </View>

              {staffFeedbackMsg ? (
                <Text style={styles.feedbackSuccessText}>{staffFeedbackMsg}</Text>
              ) : null}

              <TouchableOpacity style={styles.saveScheduleBtn} onPress={handleSaveStaff}>
                <Text style={styles.saveScheduleBtnText}>
                  {editingStaffMember ? 'Guardar Alterações do Barbeiro' : 'Criar Barbeiro'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => {
                  setStaffModalVisible(false);
                  setEditingStaffMember(null);
                }}
              >
                <Text style={styles.cancelModalBtnText}>Fechar</Text>
              </TouchableOpacity>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal: Adicionar / Editar Serviço Barber */}
      <Modal visible={serviceModalVisible && !expEditorVisible} transparent animationType="slide" onRequestClose={() => setServiceModalVisible(false)}>
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

              {/* Categoria / Filtro */}
              <View style={styles.serviceFieldGroup}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.serviceFieldLabel}>Filtro / Categoria *</Text>
                  <TouchableOpacity onPress={() => setManageFiltersModalVisible(true)}>
                    <Text style={styles.manageFiltersLinkText}>⚙️ Gerir Filtros</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.modalFieldHint}>
                  Define em que aba de filtro este serviço/extra vai aparecer para os clientes e na gestão.
                </Text>
                <View style={styles.categoryPillRow}>
                  {barberCategories.filter(c => c !== 'TODOS').map(cat => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.categorySelectPill, newServCat.toLowerCase() === cat.toLowerCase() && styles.categorySelectPillActive]}
                      onPress={() => {
                        setNewServCat(cat);
                        if (cat.toLowerCase() === 'experiências' && !isExperience) {
                          setIsExperience(true);
                          setExpEditorVisible(true);
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.categorySelectPillText,
                          newServCat.toLowerCase() === cat.toLowerCase() && styles.categorySelectPillTextActive,
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
                  placeholder="Ou digite outro filtro personalizado..."
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

              {/* 1. Descrição Curta */}
              <View style={styles.serviceFieldGroup}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.serviceFieldLabel}>1. Descrição Curta (Cartão Principal)</Text>
                  <Text style={{ fontSize: 10, color: '#A1A1AA' }}>Aparece pequena no cartão</Text>
                </View>
                <TextInput
                  style={[styles.serviceInput, { height: 45 }]}
                  value={newServDesc}
                  onChangeText={setNewServDesc}
                  placeholder="Ex: Corte à tesoura ou máquina, lavagem premium e styling final."
                  placeholderTextColor="#71717A"
                />
              </View>

              {/* 2. Saber Mais / Descrição Completa */}
              <View style={styles.serviceFieldGroup}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.serviceFieldLabel}>2. Saber Mais (Descrição Completa)</Text>
                  <Text style={{ fontSize: 10, color: '#D4AF37' }}>ℹ️ Visível no botão Saber Mais</Text>
                </View>
                <Text style={styles.modalFieldHint}>
                  Texto completo e detalhado apresentado quando o cliente clica em "Saber mais" (tanto no telemóvel como no PC).
                </Text>
                <TextInput
                  style={[styles.serviceInput, { height: 80, textAlignVertical: 'top', paddingTop: 8 }]}
                  value={newServLongDesc}
                  onChangeText={setNewServLongDesc}
                  multiline
                  placeholder="Explique os benefícios, técnicas e produtos usados em detalhe..."
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

                          {/* Filtro / Categoria do Extra */}
                          <View style={{ marginTop: 8 }}>
                            <Text style={styles.modalFieldLabelMini}>Filtro / Categoria do Extra:</Text>
                            <View style={[styles.categoryPillRow, { marginTop: 4 }]}>
                              {['Extras', 'Cortes', 'Barbas', 'Signature'].map(cat => (
                                <TouchableOpacity
                                  key={cat}
                                  style={[styles.categorySelectPill, inlineExtraCat.toLowerCase() === cat.toLowerCase() && styles.categorySelectPillActive]}
                                  onPress={() => setInlineExtraCat(cat)}
                                >
                                  <Text style={[styles.categorySelectPillText, inlineExtraCat.toLowerCase() === cat.toLowerCase() && styles.categorySelectPillTextActive]}>
                                    {cat}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                            <TextInput
                              style={[styles.serviceInput, { marginTop: 4 }]}
                              placeholder="Categoria (Ex: Extras, Tratamentos...)"
                              placeholderTextColor="#71717A"
                              value={inlineExtraCat}
                              onChangeText={setInlineExtraCat}
                            />
                          </View>

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

                          {/* 1. Descrição Curta do Extra */}
                          <View style={{ marginTop: 6 }}>
                            <Text style={styles.modalFieldLabelMini}>1. Descrição Curta do Extra:</Text>
                            <TextInput
                              style={[styles.serviceInput, { height: 42, marginTop: 4 }]}
                              placeholder="Aparece pequena no drop-down..."
                              placeholderTextColor="#71717A"
                              value={inlineExtraDesc}
                              onChangeText={setInlineExtraDesc}
                            />
                          </View>

                          {/* 2. Saber Mais do Extra (Descrição Completa) */}
                          <View style={{ marginTop: 6 }}>
                            <Text style={styles.modalFieldLabelMini}>2. Saber Mais do Extra (Completa):</Text>
                            <TextInput
                              style={[styles.serviceInput, { height: 60, textAlignVertical: 'top', marginTop: 4, paddingTop: 6 }]}
                              placeholder="Aparece quando o cliente clica em 'Saber mais' neste extra..."
                              placeholderTextColor="#71717A"
                              multiline
                              value={inlineExtraLongDesc}
                              onChangeText={setInlineExtraLongDesc}
                            />
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

              {/* Experiência Especial (Restaurantes & Menus Editáveis) */}
              <ExperienceConfigSection
                branch="barber"
                isExperience={isExperience}
                expConfigDraft={expConfigDraft}
                isPersonalized={expPersonalized}
                onSelectNormal={() => setIsExperience(false)}
                onSelectExperience={() => {
                  setIsExperience(true);
                  if (newServCat === 'Cortes' || !newServCat) {
                    setNewServCat('Experiências');
                  }
                  if (!expPersonalized) {
                    setExpEditorVisible(true);
                  }
                }}
                onOpenEditor={() => setExpEditorVisible(true)}
              />

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

      {/* Modal: Editor de Experiência (Restaurantes Parceiros & Menus) */}
      <ExperienceEditorModal
        visible={expEditorVisible}
        branch="barber"
        serviceName={newServName}
        initialConfig={expConfigDraft}
        onSave={updatedConfig => {
          setExpConfigDraft(updatedConfig);
          setExpPersonalized(true);
          setExpEditorVisible(false);
        }}
        onClose={() => setExpEditorVisible(false)}
      />

      {/* Modal: Gerir Filtros e Categorias Barber */}
      <Modal visible={manageFiltersModalVisible} transparent animationType="slide" onRequestClose={() => setManageFiltersModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setManageFiltersModalVisible(false)}>
          <Pressable style={[styles.modalBody, { maxHeight: '88%' }]} onPress={e => e.stopPropagation()}>
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
                    style={[styles.modalInput, { flex: 1 }]}
                    value={newFilterInput}
                    onChangeText={setNewFilterInput}
                    placeholder="Ex: Noivos, Coloração..."
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
              {barberCategories.filter(c => c !== 'TODOS').map(cat => {
                const count = getCategoryCount(cat);
                const isEditingThis = editingFilterOldName === cat;

                return (
                  <View key={cat} style={styles.filterRowItem}>
                    {isEditingThis ? (
                      <View style={{ flex: 1, flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                        <TextInput
                          style={[styles.modalInput, { flex: 1 }]}
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
                          {cat !== 'Extras' && cat !== 'Cortes' && (
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
                style={[styles.cancelModalBtn, { marginTop: 20 }]}
                onPress={() => setManageFiltersModalVisible(false)}
              >
                <Text style={styles.cancelModalBtnText}>Concluir / Fechar</Text>
              </TouchableOpacity>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal de Confirmação In-App Universal (Compatível com Web/Android/iOS) */}
      <Modal visible={confirmModalVisible && !!confirmData} transparent animationType="fade" onRequestClose={() => setConfirmModalVisible(false)}>
        <Pressable style={styles.confirmModalOverlay} onPress={() => setConfirmModalVisible(false)}>
          <Pressable style={styles.confirmModalBox} onPress={e => e.stopPropagation()}>
            <Text style={styles.confirmModalTitle}>{confirmData?.title || ''}</Text>
            <Text style={styles.confirmModalMessage}>{confirmData?.message || ''}</Text>
            <View style={styles.confirmModalActions}>
              <TouchableOpacity
                style={styles.confirmCancelBtn}
                onPress={() => setConfirmModalVisible(false)}
              >
                <Text style={styles.confirmCancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmDeleteBtn}
                onPress={async () => {
                  setConfirmModalVisible(false);
                  if (confirmData?.onConfirm) {
                    await confirmData.onConfirm();
                  }
                }}
              >
                <Text style={styles.confirmDeleteBtnText}>{confirmData?.confirmLabel || 'Eliminar'}</Text>
              </TouchableOpacity>
            </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cloudBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  cloudBadgeConnected: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderColor: '#10B981',
  },
  cloudBadgeLocal: {
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderColor: '#F59E0B',
  },
  cloudBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E4E4E7',
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
  subTabBar: {
    flexDirection: 'row',
    backgroundColor: '#16161D',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2415',
  },
  subTabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  subTabBtnActive: {
    backgroundColor: '#D4AF37',
  },
  subTabBtnText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '700',
  },
  subTabBtnTextActive: {
    color: '#0D0D11',
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
  managerDescriptionBox: {
    backgroundColor: '#1E1E26',
    borderWidth: 1,
    borderColor: '#2F2F3B',
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
  },
  managerDescriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  managerDescriptionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D4AF37',
    letterSpacing: 0.3,
  },
  managerEditDescBtn: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#2A2A38',
    borderWidth: 1,
    borderColor: '#3F3F50',
  },
  managerEditDescBtnText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#F3F4F6',
  },
  managerDescriptionContent: {
    fontSize: 11,
    color: '#D4D4D8',
    lineHeight: 15,
  },
  managerDescriptionEmpty: {
    color: '#F59E0B',
    fontStyle: 'italic',
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
  // Staff & Absence Management Styles
  staffStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  staffStatusBadgeActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  staffStatusBadgeLeave: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  staffStatusBadgeVacation: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  staffStatusBadgeInactive: {
    backgroundColor: 'rgba(113, 113, 122, 0.15)',
    borderColor: 'rgba(113, 113, 122, 0.3)',
  },
  staffStatusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  staffPhoneSub: {
    color: '#A1A1AA',
    fontSize: 11,
    marginTop: 2,
  },
  staffAbsenceNoticeBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: 8,
    padding: 10,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  staffAbsenceNoticeTitle: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  staffAbsenceNoticeText: {
    color: '#FDE68A',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  staffBlockedDatesText: {
    color: '#E5E7EB',
    fontSize: 11,
    marginTop: 4,
    lineHeight: 16,
  },
  staffBlockedHint: {
    color: '#9CA3AF',
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
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
  },
  deleteStaffBtnText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
  },
  applyDateRangeBtn: {
    backgroundColor: '#D4AF37',
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
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearAbsenceBtnText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '800',
  },
  staffBlockedDatesSummary: {
    color: '#FDE68A',
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
    backgroundColor: '#272732',
    borderWidth: 1,
    borderColor: '#3F3F4D',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  quickAbsenceBtnText: {
    color: '#E4E4E7',
    fontSize: 11,
    fontWeight: '700',
  },
  quickAbsenceBtnHighlight: {
    backgroundColor: '#2E2614',
    borderColor: '#D4AF37',
  },
  addDatePillBtn: {
    backgroundColor: '#D4AF37',
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
    backgroundColor: '#15151A',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#282833',
    marginTop: 8,
  },
  blockedDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#242430',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#383848',
  },
  blockedDateBadgeText: {
    color: '#F4F4F5',
    fontSize: 11,
    fontWeight: '700',
  },
  blockedDateRemove: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '900',
    marginLeft: 6,
  },
  staffPinDisplayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E26',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#383848',
  },
  staffPinDisplayIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  staffPinDisplayLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
    marginRight: 6,
  },
  staffPinValueBox: {
    backgroundColor: '#2A2616',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#D4AF37',
  },
  staffPinDisplayValue: {
    fontSize: 12,
    color: '#D4AF37',
    fontWeight: '900',
    letterSpacing: 2,
  },
  modalPinInput: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 4,
    color: '#D4AF37',
  },
  modalFieldHint: {
    fontSize: 11,
    color: '#9CA3AF',
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
    backgroundColor: '#272732',
    borderWidth: 1,
    borderColor: '#D4AF37',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manageFiltersTopBtnText: {
    color: '#D4AF37',
    fontSize: 11,
    fontWeight: '800',
  },
  manageFiltersLinkText: {
    color: '#D4AF37',
    fontSize: 11,
    fontWeight: '800',
  },
  addNewFilterBox: {
    backgroundColor: '#1E1E26',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2F2F3C',
    marginTop: 6,
  },
  filterSectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E4E4E7',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  addFilterBtn: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addFilterBtnText: {
    color: '#111',
    fontSize: 12,
    fontWeight: '900',
  },
  filterRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#181820',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#292936',
  },
  filterRowItemName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  filterRowItemSub: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  editFilterBtn: {
    backgroundColor: '#2A2A38',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3D3D4E',
  },
  editFilterBtnText: {
    color: '#D4AF37',
    fontSize: 11,
    fontWeight: '700',
  },
  deleteFilterBtn: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  deleteFilterBtnText: {
    color: '#EF4444',
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
    backgroundColor: '#272732',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
  },
  cancelFilterNameBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '900',
  },
  managerStaffAvatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    marginRight: 10,
    borderWidth: 1.5,
    borderColor: '#D4AF37',
    backgroundColor: '#272732',
  },
  managerStaffAvatarImg: {
    width: '100%',
    height: '100%',
  },
  managerStaffAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#272732',
  },
  managerStaffAvatarInitial: {
    color: '#D4AF37',
    fontSize: 18,
    fontWeight: '800',
  },
  avatarPickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 8,
  },
  avatarPreviewBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#D4AF37',
    backgroundColor: '#272732',
  },
  avatarPreviewImg: {
    width: '100%',
    height: '100%',
  },
  avatarPreviewPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPreviewInitial: {
    color: '#D4AF37',
    fontSize: 24,
    fontWeight: '800',
  },
  uploadPhotoBtn: {
    backgroundColor: 'rgba(212,175,55,0.15)',
    borderWidth: 1,
    borderColor: '#D4AF37',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  uploadPhotoBtnText: {
    color: '#D4AF37',
    fontSize: 12,
    fontWeight: '700',
  },
  avatarPresetThumbBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    borderColor: '#3F3F46',
    overflow: 'hidden',
  },
  avatarPresetThumbBtnActive: {
    borderColor: '#D4AF37',
    borderWidth: 2.5,
  },
  avatarPresetThumbImg: {
    width: '100%',
    height: '100%',
  },
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmModalBox: {
    backgroundColor: '#1E1E24',
    borderWidth: 1,
    borderColor: '#3F3F46',
    borderRadius: 14,
    padding: 20,
    width: '100%',
    maxWidth: 420,
  },
  confirmModalTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10,
  },
  confirmModalMessage: {
    color: '#A1A1AA',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  confirmModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  confirmCancelBtn: {
    backgroundColor: '#272732',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  confirmCancelBtnText: {
    color: '#D4D4D8',
    fontSize: 13,
    fontWeight: '600',
  },
  confirmDeleteBtn: {
    backgroundColor: '#EF4444',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  confirmDeleteBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
