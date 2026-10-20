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
import { Theme } from '../constants/theme';
import { getGestorNotifyClientWhatsAppUrl } from '../utils/reminderHelper';

export const GestorBeautyView: React.FC = () => {
  const {
    appointments,
    updateAppointmentStatus,
    staff,
    services,
    addService,
    deleteService,
  } = useApp();

  const [activeSection, setActiveSection] = useState<'appointments' | 'services'>('appointments');
  const [dateFilter, setDateFilter] = useState<'today' | 'all'>('today');
  const [searchQuery, setSearchQuery] = useState('');

  // Services management states
  const [catFilter, setCatFilter] = useState<string>('TODOS');
  const [serviceModalVisible, setServiceModalVisible] = useState(false);
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

  const todayStr = new Date().toISOString().split('T')[0];

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

  const handleToggleExtraId = (extraId: string) => {
    setSelectedExtraIds(prev =>
      prev.includes(extraId) ? prev.filter(id => id !== extraId) : [...prev, extraId]
    );
  };

  const handleCreateInlineExtra = async () => {
    if (!inlineExtraName.trim()) {
      alert('Introduza o nome do extra.');
      return;
    }
    const created = await addService({
      branch: 'beauty',
      category: 'Extras',
      name: inlineExtraName.trim(),
      description: 'Extra opcional para serviços de beleza.',
      price: parseFloat(inlineExtraPrice) || 5,
      durationMinutes: parseInt(inlineExtraDur, 10) || 10,
      iconName: 'sparkles',
    });
    setSelectedExtraIds(prev => [...prev, created.id]);
    setInlineExtraName('');
    setShowInlineNewExtra(false);
  };

  const handleCreateService = async () => {
    if (!newServName.trim()) {
      alert('Introduza o nome do serviço.');
      return;
    }
    await addService({
      branch: 'beauty',
      category: newServCat,
      name: newServName.trim(),
      description: newServDesc.trim() || 'Serviço de excelência Almare Beauty.',
      price: parseFloat(newServPrice) || 20,
      durationMinutes: parseInt(newServDur, 10) || 45,
      iconName: 'scissors',
      compatibleExtraIds: hasExtras ? selectedExtraIds : [],
    });

    setNewServName('');
    setNewServDesc('');
    setHasExtras(false);
    setSelectedExtraIds([]);
    setShowInlineNewExtra(false);
    setServiceModalVisible(false);
  };

  // Filter Beauty appointments
  const beautyAppointments = useMemo(() => {
    return appointments.filter(app => {
      if (app.branch !== 'beauty') return false;
      if (dateFilter === 'today' && app.date !== todayStr) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = app.clientName.toLowerCase().includes(query);
        const matchPhone = app.clientPhone.includes(query);
        const matchService = app.serviceName.toLowerCase().includes(query);
        return matchName || matchPhone || matchService;
      }
      return true;
    });
  }, [appointments, dateFilter, todayStr, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const todayApps = appointments.filter(a => a.branch === 'beauty' && a.date === todayStr);
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
          style={[styles.topTabBtn, activeSection === 'appointments' && styles.topTabBtnActive]}
          onPress={() => setActiveSection('appointments')}
        >
          <Text
            style={[
              styles.topTabBtnText,
              activeSection === 'appointments' && styles.topTabBtnTextActive,
            ]}
          >
            Agenda ({beautyAppointments.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.topTabBtn, activeSection === 'services' && styles.topTabBtnActive]}
          onPress={() => setActiveSection('services')}
        >
          <Text
            style={[
              styles.topTabBtnText,
              activeSection === 'services' && styles.topTabBtnTextActive,
            ]}
          >
            Serviços & Extras ({beautyServices.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeSection === 'appointments' ? (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* KPI Stat Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalToday}</Text>
            <Text style={styles.statLabel}>Marcações Hoje</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: Theme.colors.beauty.badge }]}>
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

          {/* Search Bar */}
          <TextInput
            style={styles.searchInput}
            placeholder="Pesquisar por cliente, telemóvel ou serviço..."
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
                {app.notes ? <Text style={styles.notesText}>Nota: "{app.notes}"</Text> : null}
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
      </ScrollView>
      ) : (
        /* SERVICES & EXTRAS MANAGEMENT */
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.servicesHeaderRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.sectionTitle}>Serviços e Extras Beauty</Text>
              <Text style={styles.sectionSub}>Configure os serviços e defina se incluem extras no menu drop-down</Text>
            </View>
            <TouchableOpacity
              style={styles.addServiceTopBtn}
              onPress={() => setServiceModalVisible(true)}
            >
              <Text style={styles.addServiceTopBtnText}>+ Novo Serviço</Text>
            </TouchableOpacity>
          </View>

          {/* Category Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
            {['TODOS', 'Manicure / Pedicure', 'Head-Spa', 'Tratamentos', 'Signature', 'Extras'].map(cat => (
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

                <TouchableOpacity
                  style={styles.deleteServiceBtn}
                  onPress={() => deleteService(item.id)}
                >
                  <Text style={styles.deleteServiceBtnText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Add Service Modal for Beauty */}
      <Modal visible={serviceModalVisible} transparent animationType="slide" onRequestClose={() => setServiceModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setServiceModalVisible(false)}>
          <Pressable style={[styles.modalContent, { maxHeight: '90%' }]} onPress={e => e.stopPropagation()}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Novo Serviço Beauty</Text>

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

              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleCreateService}>
                <Text style={styles.modalSaveBtnText}>Criar Serviço</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setServiceModalVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancelar</Text>
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
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#F3E8FF',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 10,
    color: '#6B7280',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  toggleBtnActive: {
    backgroundColor: Theme.colors.beauty.primary,
    borderColor: Theme.colors.beauty.primary,
  },
  toggleBtnText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '700',
  },
  toggleBtnTextActive: {
    color: '#FFF',
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#1F2937',
    fontSize: 13,
  },
  sectionTitle: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  sectionSub: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  emptyState: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    color: '#1F2937',
    fontSize: 15,
    fontWeight: '700',
  },
  emptySub: {
    color: '#6B7280',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  appCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FBCFE8',
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
  },
  topTabBtnActive: {
    borderBottomWidth: 2,
    borderBottomColor: Theme.colors.beauty.badge,
  },
  topTabBtnText: {
    color: '#E5D5DA',
    fontSize: 12,
    fontWeight: '700',
  },
  topTabBtnTextActive: {
    color: Theme.colors.beauty.badge,
  },
  servicesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addServiceTopBtn: {
    backgroundColor: Theme.colors.beauty.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addServiceTopBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
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
    backgroundColor: Theme.colors.beauty.primary,
    borderColor: Theme.colors.beauty.primary,
  },
  catFilterPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
  },
  catFilterPillTextActive: {
    color: '#FFF',
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
  deleteServiceBtn: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  deleteServiceBtnText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
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
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#3B1C26',
    textAlign: 'center',
    marginBottom: 14,
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
    backgroundColor: Theme.colors.beauty.primary,
  },
  modalCatPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4B5563',
  },
  modalCatPillTextActive: {
    color: '#FFF',
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
    backgroundColor: Theme.colors.beauty.primary,
    borderColor: Theme.colors.beauty.primary,
  },
  toggleOptionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  toggleOptionTextActive: {
    color: '#FFF',
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
    backgroundColor: Theme.colors.beauty.primary,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
    marginRight: 6,
  },
  inlineSaveBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
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
    backgroundColor: Theme.colors.beauty.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  modalSaveBtnText: {
    color: '#FFF',
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
