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
} from 'react-native';
import { useApp } from '../context/AppContext';
import { SalonBranch, Service, Appointment } from '../types';
import { Theme } from '../constants/theme';
import { FinancialDashboard } from '../components/FinancialDashboard';

export const AdminConfigView: React.FC = () => {
  const {
    config,
    updateConfig,
    services,
    addService,
    updateService,
    deleteService,
    staff,
    addStaffMember,
    deleteStaffMember,
    appointments,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'revenue' | 'general' | 'services' | 'staff'>('revenue');

  // General Config State
  const [barberName, setBarberName] = useState(config.barberShopName);
  const [barberAddr, setBarberAddr] = useState(config.barberAddress);
  const [barberPhone, setBarberPhone] = useState(config.barberPhone);
  const [barberHours, setBarberHours] = useState(config.barberOpenDays);

  const [beautyName, setBeautyName] = useState(config.beautyShopName);
  const [beautyAddr, setBeautyAddr] = useState(config.beautyAddress);
  const [beautyPhone, setBeautyPhone] = useState(config.beautyPhone);
  const [beautyHours, setBeautyHours] = useState(config.beautyOpenDays);

  // Security & Access PINs
  const [adminPin, setAdminPin] = useState(config.pins?.adminPin || '9999');
  const [barberPin, setBarberPin] = useState(config.pins?.gestorBarberPin || '1111');
  const [beautyPin, setBeautyPin] = useState(config.pins?.gestorBeautyPin || '2222');
  const [staffPin, setStaffPin] = useState(config.pins?.staffPin || '3333');

  const [saveSuccess, setSaveSuccess] = useState(false);

  // Services Tab Filter
  const [servicesBranchFilter, setServicesBranchFilter] = useState<'all' | 'barber' | 'beauty'>('all');

  // New Service Modal State
  const [serviceModalVisible, setServiceModalVisible] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [newServBranch, setNewServBranch] = useState<SalonBranch>('barber');
  const [newServCat, setNewServCat] = useState('Cortes');
  const [newServName, setNewServName] = useState('');
  const [newServDesc, setNewServDesc] = useState('');
  const [newServPrice, setNewServPrice] = useState('20');
  const [newServDur, setNewServDur] = useState('30');

  // Extras toggle & selection state for new service
  const [hasExtras, setHasExtras] = useState(false);
  const [selectedExtraIds, setSelectedExtraIds] = useState<string[]>([]);

  // Inline creation of a new extra
  const [showInlineNewExtra, setShowInlineNewExtra] = useState(false);
  const [inlineExtraName, setInlineExtraName] = useState('');
  const [inlineExtraPrice, setInlineExtraPrice] = useState('5');
  const [inlineExtraDur, setInlineExtraDur] = useState('10');

  // New Staff Modal State
  const [staffModalVisible, setStaffModalVisible] = useState(false);
  const [newStaffBranch, setNewStaffBranch] = useState<SalonBranch>('barber');
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('Master Barber');
  const [newStaffPhone, setNewStaffPhone] = useState('');

  // Available extras for the currently chosen branch
  const availableBranchExtras = useMemo(() => {
    return services.filter(s => s.branch === newServBranch && s.category.toLowerCase() === 'extras');
  }, [services, newServBranch]);

  // Filtered services for management view
  const displayedServices = useMemo(() => {
    if (servicesBranchFilter === 'all') return services;
    return services.filter(s => s.branch === servicesBranchFilter);
  }, [services, servicesBranchFilter]);







  const handleBranchChangeForNewService = (branch: SalonBranch) => {
    setNewServBranch(branch);
    setNewServCat(branch === 'barber' ? 'Cortes' : 'Manicure / Pedicure');
    setSelectedExtraIds([]);
    setShowInlineNewExtra(false);
  };

  const handleToggleExtraId = (extraId: string) => {
    setSelectedExtraIds(prev =>
      prev.includes(extraId) ? prev.filter(id => id !== extraId) : [...prev, extraId]
    );
  };

  const handleCreateInlineExtra = async () => {
    if (!inlineExtraName.trim()) {
      alert('Introduza o nome do novo extra.');
      return;
    }
    const createdExtra = await addService({
      branch: newServBranch,
      category: 'Extras',
      name: inlineExtraName.trim(),
      description: `Extra opcional para ${newServBranch === 'barber' ? 'Barber' : 'Beauty'}.`,
      price: parseFloat(inlineExtraPrice) || 5,
      durationMinutes: parseInt(inlineExtraDur, 10) || 10,
      iconName: 'sparkles',
    });

    // Automatically select the newly created extra
    setSelectedExtraIds(prev => [...prev, createdExtra.id]);
    setInlineExtraName('');
    setShowInlineNewExtra(false);
  };

  const handleSaveGeneralConfig = async () => {
    await updateConfig({
      ...config,
      barberShopName: barberName,
      barberAddress: barberAddr,
      barberPhone,
      barberOpenDays: barberHours,
      beautyShopName: beautyName,
      beautyAddress: beautyAddr,
      beautyPhone,
      beautyOpenDays: beautyHours,
      pins: {
        adminPin: adminPin.trim() || '9999',
        gestorBarberPin: barberPin.trim() || '1111',
        gestorBeautyPin: beautyPin.trim() || '2222',
        staffPin: staffPin.trim() || '3333',
      },
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleOpenCreateService = () => {
    setEditingService(null);
    setNewServBranch('barber');
    setNewServCat('Cortes');
    setNewServName('');
    setNewServDesc('');
    setNewServPrice('20');
    setNewServDur('30');
    setHasExtras(false);
    setSelectedExtraIds([]);
    setShowInlineNewExtra(false);
    setServiceModalVisible(true);
  };

  const handleOpenEditService = (service: Service) => {
    setEditingService(service);
    setNewServBranch(service.branch);
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

  const handleSaveService = async () => {
    if (!newServName.trim()) {
      alert('Introduza o nome do serviço.');
      return;
    }

    const priceNum = parseFloat(newServPrice.replace(',', '.')) || 15;
    const durNum = parseInt(newServDur, 10) || 30;

    if (editingService) {
      await updateService({
        ...editingService,
        branch: newServBranch,
        category: newServCat.trim() || (newServBranch === 'barber' ? 'Cortes' : 'Manicure / Pedicure'),
        name: newServName.trim(),
        description: newServDesc.trim(),
        price: priceNum,
        durationMinutes: durNum,
        compatibleExtraIds: hasExtras ? selectedExtraIds : [],
      });
    } else {
      await addService({
        branch: newServBranch,
        category: newServCat.trim() || (newServBranch === 'barber' ? 'Cortes' : 'Manicure / Pedicure'),
        name: newServName.trim(),
        description: newServDesc.trim() || 'Serviço de alta qualidade Almare.',
        price: priceNum,
        durationMinutes: durNum,
        iconName: '',
        compatibleExtraIds: hasExtras ? selectedExtraIds : [],
      });
    }

    setEditingService(null);
    setServiceModalVisible(false);
  };

  const handleCreateStaff = async () => {
    if (!newStaffName.trim()) {
      alert('Introduza o nome do profissional.');
      return;
    }
    await addStaffMember({
      branch: newStaffBranch,
      name: newStaffName.trim(),
      roleTitle: newStaffRole.trim() || 'Especialista',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      phone: newStaffPhone || '+351 910 000 000',
      rating: 5.0,
      specialties: ['Atendimento VIP'],
      workingHours: { start: '09:30', end: '19:30' },
    });

    setNewStaffName('');
    setStaffModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>PAINEL ADMINISTRADOR (RECEITA & CONFIGS)</Text>
        <Text style={styles.headerSub}>Visão financeira global e gestão dos estabelecimentos Almare</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'revenue' && styles.tabBtnActive]}
          onPress={() => setActiveTab('revenue')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'revenue' && styles.tabBtnTextActive]}>
            Receita (€)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'general' && styles.tabBtnActive]}
          onPress={() => setActiveTab('general')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'general' && styles.tabBtnTextActive]}>
            Lojas & PINs
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'services' && styles.tabBtnActive]}
          onPress={() => setActiveTab('services')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'services' && styles.tabBtnTextActive]}>
            Serviços ({services.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'staff' && styles.tabBtnActive]}
          onPress={() => setActiveTab('staff')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'staff' && styles.tabBtnTextActive]}>
            Equipa ({staff.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'revenue' ? (
          <FinancialDashboard initialBranch="all" variant="dark" />
        ) : activeTab === 'general' ? (
          /* GENERAL CONFIGS */
          <View>
            {saveSuccess ? (
              <View style={styles.successBanner}>
                <Text style={styles.successBannerText}>Configurações guardadas com sucesso!</Text>
              </View>
            ) : null}

            {/* Barber Shop Settings */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Configuração Almare Barber</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Nome do Estabelecimento</Text>
                <TextInput style={styles.input} value={barberName} onChangeText={setBarberName} />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Endereço Físico</Text>
                <TextInput style={styles.input} value={barberAddr} onChangeText={setBarberAddr} />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Telemóvel / WhatsApp de Contacto</Text>
                <TextInput style={styles.input} value={barberPhone} onChangeText={setBarberPhone} />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Horário de Funcionamento</Text>
                <TextInput style={styles.input} value={barberHours} onChangeText={setBarberHours} />
              </View>
            </View>

            {/* Beauty Shop Settings */}
            <View style={styles.sectionCard}>
              <Text style={[styles.sectionTitle, { color: '#F472B6' }]}>Configuração Almare Beauty</Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Nome do Estabelecimento</Text>
                <TextInput style={styles.input} value={beautyName} onChangeText={setBeautyName} />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Endereço Físico</Text>
                <TextInput style={styles.input} value={beautyAddr} onChangeText={setBeautyAddr} />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Telemóvel / WhatsApp de Contacto</Text>
                <TextInput style={styles.input} value={beautyPhone} onChangeText={setBeautyPhone} />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Horário de Funcionamento</Text>
                <TextInput style={styles.input} value={beautyHours} onChangeText={setBeautyHours} />
              </View>
            </View>

            {/* Security & Access PINs */}
            <View style={styles.sectionCard}>
              <Text style={[styles.sectionTitle, { color: '#E2B755' }]}>
                Segurança & Códigos de Acesso (PINs)
              </Text>
              <Text style={styles.sectionSub}>
                Estes códigos de 4 dígitos protegem os portais de gestão e staff. Para abrir o teclado de PIN na app, basta manter premido o logotipo ALMARE durante 1.2 segundos.
              </Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>PIN Administrador (Acesso Total)</Text>
                <TextInput
                  style={styles.input}
                  value={adminPin}
                  onChangeText={setAdminPin}
                  maxLength={4}
                  keyboardType="numeric"
                  placeholder="9999"
                  placeholderTextColor="#71717A"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>PIN Gestor Barber</Text>
                <TextInput
                  style={styles.input}
                  value={barberPin}
                  onChangeText={setBarberPin}
                  maxLength={4}
                  keyboardType="numeric"
                  placeholder="1111"
                  placeholderTextColor="#71717A"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>PIN Gestor Beauty</Text>
                <TextInput
                  style={styles.input}
                  value={beautyPin}
                  onChangeText={setBeautyPin}
                  maxLength={4}
                  keyboardType="numeric"
                  placeholder="2222"
                  placeholderTextColor="#71717A"
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>PIN Staff / Colaborador</Text>
                <TextInput
                  style={styles.input}
                  value={staffPin}
                  onChangeText={setStaffPin}
                  maxLength={4}
                  keyboardType="numeric"
                  placeholder="3333"
                  placeholderTextColor="#71717A"
                />
              </View>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveGeneralConfig}>
              <Text style={styles.saveBtnText}>Guardar Alterações Globais</Text>
            </TouchableOpacity>
          </View>
        ) : activeTab === 'services' ? (
          /* SERVICES CONFIG */
          <View>
            <View style={styles.actionHeaderRow}>
              <Text style={styles.sectionTitle}>Catálogo de Serviços</Text>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={handleOpenCreateService}
              >
                <Text style={styles.addBtnText}>+ Novo Serviço</Text>
              </TouchableOpacity>
            </View>

            {/* Branch Filter Pills */}
            <View style={styles.servicesFilterRow}>
              <TouchableOpacity
                style={[
                  styles.filterPill,
                  servicesBranchFilter === 'all' && styles.filterPillActive,
                ]}
                onPress={() => setServicesBranchFilter('all')}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    servicesBranchFilter === 'all' && styles.filterPillTextActive,
                  ]}
                >
                  Todos ({services.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterPill,
                  servicesBranchFilter === 'barber' && styles.filterPillActive,
                ]}
                onPress={() => setServicesBranchFilter('barber')}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    servicesBranchFilter === 'barber' && styles.filterPillTextActive,
                  ]}
                >
                  Barber ({services.filter(s => s.branch === 'barber').length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterPill,
                  servicesBranchFilter === 'beauty' && styles.filterPillActive,
                ]}
                onPress={() => setServicesBranchFilter('beauty')}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    servicesBranchFilter === 'beauty' && styles.filterPillTextActive,
                  ]}
                >
                  Beauty ({services.filter(s => s.branch === 'beauty').length})
                </Text>
              </TouchableOpacity>
            </View>

            {displayedServices.map(item => {
              const hasCompatibleExtras = item.compatibleExtraIds && item.compatibleExtraIds.length > 0;
              const isExtraItem = item.category.toLowerCase() === 'extras';

              return (
                <View key={item.id} style={styles.itemRow}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                      <Text style={styles.itemTitle}>
                        {item.name}
                      </Text>
                      <View
                        style={[
                          styles.branchBadge,
                          {
                            backgroundColor:
                              item.branch === 'barber' ? '#2A2A35' : 'rgba(212,175,55,0.15)',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.branchBadgeText,
                            {
                              color:
                                item.branch === 'barber'
                                  ? Theme.colors.barber.accent
                                  : Theme.colors.beauty.badge,
                            },
                          ]}
                        >
                          {item.branch === 'barber' ? 'Barber' : 'Beauty'}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.itemSub}>
                      {item.category} • {item.price.toFixed(2)} € • {item.durationMinutes} min
                    </Text>

                    {hasCompatibleExtras ? (
                      <View style={styles.extrasCountBadge}>
                        <Text style={styles.extrasCountBadgeText}>
                          {item.compatibleExtraIds!.length} extras disponíveis
                        </Text>
                      </View>
                    ) : isExtraItem ? (
                      <View style={[styles.extrasCountBadge, { backgroundColor: '#312E81' }]}>
                        <Text style={[styles.extrasCountBadgeText, { color: '#C7D2FE' }]}>
                          Item de Extra
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.itemActions}>
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => handleOpenEditService(item)}
                    >
                      <Text style={styles.editBtnText}>Editar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => deleteService(item.id)}
                    >
                      <Text style={styles.deleteBtnText}>Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          /* STAFF CONFIG */
          <View>
            <View style={styles.actionHeaderRow}>
              <Text style={styles.sectionTitle}>Equipa & Profissionais</Text>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => setStaffModalVisible(true)}
              >
                <Text style={styles.addBtnText}>+ Novo Profissional</Text>
              </TouchableOpacity>
            </View>

            {staff.map(item => (
              <View key={item.id} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>
                    {item.name} ({item.branch === 'barber' ? 'Barber' : 'Beauty'})
                  </Text>
                  <Text style={styles.itemSub}>
                    {item.roleTitle} • Avaliação: {item.rating} • {item.phone}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => deleteStaffMember(item.id)}
                >
                  <Text style={styles.deleteBtnText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add / Edit Service Modal */}
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
                {editingService ? 'Editar Serviço' : 'Adicionar Novo Serviço'}
              </Text>

              {/* Branch Selector */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Ramo / Salão</Text>
                <View style={styles.branchSelectRow}>
                  <TouchableOpacity
                    style={[styles.branchTab, newServBranch === 'barber' && styles.branchTabActive]}
                    onPress={() => handleBranchChangeForNewService('barber')}
                  >
                    <Text style={styles.branchTabText}>Barber</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.branchTab, newServBranch === 'beauty' && styles.branchTabActive]}
                    onPress={() => handleBranchChangeForNewService('beauty')}
                  >
                    <Text style={styles.branchTabText}>Beauty</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Service Name */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Nome do Serviço *</Text>
                <TextInput
                  style={styles.input}
                  value={newServName}
                  onChangeText={setNewServName}
                  placeholder={newServBranch === 'barber' ? 'Ex: Corte Skin Fade' : 'Ex: Head-Spa Holístico'}
                  placeholderTextColor="#71717A"
                />
              </View>

              {/* Category Pills & Input */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Categoria do Serviço</Text>
                <View style={styles.catPillRow}>
                  {(newServBranch === 'barber'
                    ? ['Cortes', 'Barbas', 'Signature', 'Extras']
                    : ['Manicure / Pedicure', 'Head-Spa', 'Tratamentos', 'Signature', 'Extras']
                  ).map(cat => (
                    <TouchableOpacity
                      key={cat}
                      style={[styles.catPill, newServCat === cat && styles.catPillActive]}
                      onPress={() => setNewServCat(cat)}
                    >
                      <Text style={[styles.catPillText, newServCat === cat && styles.catPillTextActive]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={[styles.input, { marginTop: 6 }]}
                  value={newServCat}
                  onChangeText={setNewServCat}
                  placeholder="Ou digite outra categoria personalizada"
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
                  placeholder="Descreva o que inclui o serviço..."
                  placeholderTextColor="#71717A"
                />
              </View>

              {/* EXTRAS CONFIGURATION */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Inclui Extras Disponíveis para o Cliente?</Text>
                <View style={styles.extrasToggleRow}>
                  <TouchableOpacity
                    style={[styles.extrasToggleBtn, !hasExtras && styles.extrasToggleBtnActive]}
                    onPress={() => setHasExtras(false)}
                  >
                    <Text style={[styles.extrasToggleText, !hasExtras && styles.extrasToggleTextActive]}>
                      Não (Sem extras)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.extrasToggleBtn, hasExtras && styles.extrasToggleBtnActive]}
                    onPress={() => setHasExtras(true)}
                  >
                    <Text style={[styles.extrasToggleText, hasExtras && styles.extrasToggleTextActive]}>
                      Sim (Associar Extras)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {hasExtras && (
                <View style={styles.extrasSelectContainer}>
                  <Text style={styles.extrasSelectTitle}>
                    Selecione os extras que vão aparecer no menu drop-down deste serviço:
                  </Text>

                  {availableBranchExtras.length === 0 ? (
                    <Text style={styles.noExtrasText}>
                      Ainda não existem extras em {newServBranch === 'barber' ? 'Barber' : 'Beauty'}. Crie um novo abaixo:
                    </Text>
                  ) : (
                    <View style={styles.extraChipsGrid}>
                      {availableBranchExtras.map(extra => {
                        const isSelected = selectedExtraIds.includes(extra.id);
                        return (
                          <TouchableOpacity
                            key={extra.id}
                            style={[styles.extraChip, isSelected && styles.extraChipSelected]}
                            onPress={() => handleToggleExtraId(extra.id)}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.extraChipText, isSelected && styles.extraChipTextSelected]}>
                              {isSelected ? '✓ ' : '+ '}
                              {extra.name} (+{extra.price.toFixed(2)} €)
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  {/* Inline creation of new extra */}
                  {!showInlineNewExtra ? (
                    <TouchableOpacity
                      style={styles.newInlineExtraBtn}
                      onPress={() => setShowInlineNewExtra(true)}
                    >
                      <Text style={styles.newInlineExtraBtnText}>+ Criar e Adicionar Outro Extra</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.inlineExtraForm}>
                      <Text style={styles.inlineExtraTitle}>
                        Novo Extra para {newServBranch === 'barber' ? 'Barber' : 'Beauty'}:
                      </Text>
                      <TextInput
                        style={[styles.input, { marginBottom: 6 }]}
                        placeholder="Nome do Extra (Ex: Ampola Nutritiva)"
                        placeholderTextColor="#71717A"
                        value={inlineExtraName}
                        onChangeText={setInlineExtraName}
                      />
                      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                        <TextInput
                          style={[styles.input, { flex: 1 }]}
                          placeholder="Preço € (Ex: 6)"
                          placeholderTextColor="#71717A"
                          keyboardType="numeric"
                          value={inlineExtraPrice}
                          onChangeText={setInlineExtraPrice}
                        />
                        <TextInput
                          style={[styles.input, { flex: 1 }]}
                          placeholder="Duração min (Ex: 10)"
                          placeholderTextColor="#71717A"
                          keyboardType="numeric"
                          value={inlineExtraDur}
                          onChangeText={setInlineExtraDur}
                        />
                      </View>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity style={styles.inlineSaveBtn} onPress={handleCreateInlineExtra}>
                          <Text style={styles.inlineSaveBtnText}>Adicionar Extra à Lista</Text>
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

      {/* Add Staff Modal */}
      <Modal visible={staffModalVisible} transparent animationType="slide" onRequestClose={() => setStaffModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setStaffModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Adicionar Novo Profissional</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Ramo / Salão</Text>
              <View style={styles.branchSelectRow}>
                <TouchableOpacity
                  style={[styles.branchTab, newStaffBranch === 'barber' && styles.branchTabActive]}
                  onPress={() => setNewStaffBranch('barber')}
                >
                  <Text style={styles.branchTabText}>Barber</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.branchTab, newStaffBranch === 'beauty' && styles.branchTabActive]}
                  onPress={() => setNewStaffBranch('beauty')}
                >
                  <Text style={styles.branchTabText}>Beauty</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nome Completo *</Text>
              <TextInput style={styles.input} value={newStaffName} onChangeText={setNewStaffName} placeholder="Ex: Diogo Martins" placeholderTextColor="#71717A" />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Título / Cargo</Text>
              <TextInput style={styles.input} value={newStaffRole} onChangeText={setNewStaffRole} placeholder="Ex: Senior Barber" placeholderTextColor="#71717A" />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Telemóvel do Colaborador</Text>
              <TextInput style={styles.input} value={newStaffPhone} onChangeText={setNewStaffPhone} placeholder="Ex: +351 913 000 111" placeholderTextColor="#71717A" />
            </View>

            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleCreateStaff}>
              <Text style={styles.modalSaveBtnText}>Registar Colaborador</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setStaffModalVisible(false)}>
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
    backgroundColor: '#18181C',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
  },
  headerTitle: {
    color: Theme.colors.brandSecondary,
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
    backgroundColor: '#18181C',
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabBtnActive: {
    borderBottomWidth: 2,
    borderBottomColor: Theme.colors.brandSecondary,
  },
  tabBtnText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
  },
  tabBtnTextActive: {
    color: Theme.colors.brandSecondary,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  successBanner: {
    backgroundColor: '#10B981',
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
    alignItems: 'center',
  },
  successBannerText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
  },
  sectionCard: {
    backgroundColor: '#18181C',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  sectionTitle: {
    color: Theme.colors.brandSecondary,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  sectionSub: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 14,
    lineHeight: 18,
  },
  fieldGroup: {
    marginBottom: 12,
  },
  label: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#27272A',
    borderColor: '#3F3F46',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#FFF',
    fontSize: 13,
  },
  saveBtn: {
    backgroundColor: Theme.colors.brandSecondary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  saveBtnText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '900',
  },
  actionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  addBtn: {
    backgroundColor: Theme.colors.brandSecondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '900',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#18181C',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  itemTitle: {
    color: '#F3F4F6',
    fontSize: 14,
    fontWeight: '700',
  },
  itemSub: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  itemActions: {
    flexDirection: 'column',
    gap: 6,
    marginLeft: 8,
    alignItems: 'flex-end',
  },
  editBtn: {
    backgroundColor: 'rgba(212, 175, 55, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    minWidth: 64,
  },
  editBtnText: {
    color: Theme.colors.brandSecondary,
    fontSize: 11,
    fontWeight: '800',
  },
  deleteBtn: {
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    minWidth: 64,
  },
  deleteBtnText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#18181C',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Theme.colors.brandSecondary,
  },
  modalTitle: {
    color: Theme.colors.brandSecondary,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 14,
  },
  branchSelectRow: {
    flexDirection: 'row',
  },
  branchTab: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#27272A',
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 6,
  },
  branchTabActive: {
    backgroundColor: Theme.colors.brandSecondary,
  },
  branchTabText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  rowTwo: {
    flexDirection: 'row',
  },
  modalSaveBtn: {
    backgroundColor: Theme.colors.brandSecondary,
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
    color: '#9CA3AF',
    fontSize: 13,
  },
  servicesFilterRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1E1E24',
    borderWidth: 1,
    borderColor: '#2E2E38',
    marginRight: 8,
  },
  filterPillActive: {
    backgroundColor: Theme.colors.brandSecondary,
    borderColor: Theme.colors.brandSecondary,
  },
  filterPillText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
  },
  filterPillTextActive: {
    color: '#111',
    fontWeight: '800',
  },
  branchBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  branchBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  extrasCountBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(212,175,55,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  extrasCountBadgeText: {
    color: Theme.colors.brandSecondary,
    fontSize: 11,
    fontWeight: '800',
  },
  catPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  catPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#27272A',
    borderWidth: 1,
    borderColor: '#3F3F46',
    marginRight: 6,
    marginBottom: 6,
  },
  catPillActive: {
    backgroundColor: Theme.colors.brandSecondary,
    borderColor: Theme.colors.brandSecondary,
  },
  catPillText: {
    color: '#D1D5DB',
    fontSize: 11,
    fontWeight: '700',
  },
  catPillTextActive: {
    color: '#111827',
    fontWeight: '900',
  },
  extrasToggleRow: {
    flexDirection: 'row',
  },
  extrasToggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#27272A',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3F3F46',
    marginRight: 6,
  },
  extrasToggleBtnActive: {
    backgroundColor: Theme.colors.brandSecondary,
    borderColor: Theme.colors.brandSecondary,
  },
  extrasToggleText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '700',
  },
  extrasToggleTextActive: {
    color: '#111',
    fontWeight: '800',
  },
  extrasSelectContainer: {
    backgroundColor: '#222228',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  extrasSelectTitle: {
    color: Theme.colors.brandSecondary,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
  },
  noExtrasText: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 8,
  },
  extraChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  extraChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#1C1C22',
    borderWidth: 1,
    borderColor: '#3F3F46',
    marginRight: 6,
    marginBottom: 6,
  },
  extraChipSelected: {
    backgroundColor: 'rgba(212,175,55,0.25)',
    borderColor: Theme.colors.brandSecondary,
  },
  extraChipText: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '700',
  },
  extraChipTextSelected: {
    color: Theme.colors.brandSecondary,
    fontWeight: '800',
  },
  newInlineExtraBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Theme.colors.brandSecondary,
    backgroundColor: 'transparent',
  },
  newInlineExtraBtnText: {
    color: Theme.colors.brandSecondary,
    fontSize: 11,
    fontWeight: '800',
  },
  inlineExtraForm: {
    backgroundColor: '#18181C',
    padding: 10,
    borderRadius: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  inlineExtraTitle: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  inlineSaveBtn: {
    flex: 1,
    backgroundColor: Theme.colors.brandSecondary,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    marginRight: 8,
  },
  inlineSaveBtnText: {
    color: '#111',
    fontSize: 12,
    fontWeight: '800',
  },
  inlineCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  inlineCancelBtnText: {
    color: '#9CA3AF',
    fontSize: 12,
  },

  /* ============================================================ */
  /* REVENUE & FINANCIAL DASHBOARD STYLES */
  /* ============================================================ */
  liveSyncBanner: {
    backgroundColor: '#121E18',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#065F46',
  },
  liveSyncHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  liveSyncTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#10B981',
    letterSpacing: 1,
  },
  liveSyncSub: {
    fontSize: 12,
    color: '#A7F3D0',
    lineHeight: 18,
  },
  revenueKpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  kpiCard: {
    width: '48.5%',
    backgroundColor: '#18181C',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  kpiCardHighlight: {
    borderColor: 'rgba(212,175,55,0.4)',
    backgroundColor: '#1B1A1E',
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },
  kpiSub: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  branchComparisonCard: {
    backgroundColor: '#18181C',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  branchRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  branchStatBoxBarber: {
    flex: 1,
    backgroundColor: '#141418',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2B755',
  },
  branchNameBarber: {
    color: '#E2B755',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },
  branchValueBarber: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },
  branchSubBarber: {
    color: '#9CA3AF',
    fontSize: 11,
  },
  branchStatBoxBeauty: {
    flex: 1,
    backgroundColor: '#141418',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F472B6',
  },
  branchNameBeauty: {
    color: '#F472B6',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },
  branchValueBeauty: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },
  branchSubBeauty: {
    color: '#9CA3AF',
    fontSize: 11,
  },
  filterSectionCard: {
    backgroundColor: '#18181C',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  filterHeaderTitle: {
    color: '#F3F4F6',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10,
  },
  filterGroupLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  filterPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  filterChip: {
    backgroundColor: '#222228',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#30303A',
  },
  filterChipActive: {
    backgroundColor: '#E2B755',
    borderColor: '#E2B755',
  },
  filterChipText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: '#111827',
    fontWeight: '800',
  },
  revenueSearchInput: {
    backgroundColor: '#111116',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2F2F3D',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFF',
    fontSize: 12,
  },
  staffRankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#25252E',
  },
  staffRankInfo: {
    flex: 1,
    paddingRight: 10,
  },
  staffRankName: {
    color: '#F3F4F6',
    fontSize: 13,
    fontWeight: '800',
  },
  miniBranchBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  staffRankSub: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 2,
  },
  staffRankTotal: {
    color: '#E2B755',
    fontSize: 15,
    fontWeight: '900',
  },
  receiptHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  totalBadgeBox: {
    backgroundColor: 'rgba(226,183,85,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2B755',
  },
  totalBadgeText: {
    color: '#E2B755',
    fontSize: 12,
    fontWeight: '800',
  },
  emptyStateBox: {
    backgroundColor: '#141418',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#262630',
    marginTop: 10,
  },
  emptyStateTitle: {
    color: '#D1D5DB',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyStateSub: {
    color: '#6B7280',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  receiptItem: {
    backgroundColor: '#141418',
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#2A2A35',
  },
  receiptTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  branchTag: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  receiptDateTime: {
    color: '#D1D5DB',
    fontSize: 11,
    fontWeight: '700',
  },
  completedBadge: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  completedBadgeText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
  },
  receiptMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptClientName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  receiptClientPhone: {
    color: '#9CA3AF',
    fontSize: 11,
    marginBottom: 4,
  },
  receiptService: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '600',
  },
  receiptStaff: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 2,
  },
  receiptNotes: {
    color: '#71717A',
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 2,
  },
  receiptPriceBox: {
    backgroundColor: 'rgba(226,183,85,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(226,183,85,0.4)',
    alignItems: 'flex-end',
  },
  receiptPrice: {
    color: '#E2B755',
    fontSize: 16,
    fontWeight: '900',
  },
});
