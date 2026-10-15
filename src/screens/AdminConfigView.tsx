import React, { useState } from 'react';
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
import { SalonBranch, Service, StaffMember } from '../types';
import { Theme } from '../constants/theme';

export const AdminConfigView: React.FC = () => {
  const {
    config,
    updateConfig,
    services,
    addService,
    deleteService,
    staff,
    addStaffMember,
    deleteStaffMember,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'general' | 'services' | 'staff'>('general');

  // General Config State
  const [barberName, setBarberName] = useState(config.barberShopName);
  const [barberAddr, setBarberAddr] = useState(config.barberAddress);
  const [barberPhone, setBarberPhone] = useState(config.barberPhone);
  const [barberHours, setBarberHours] = useState(config.barberOpenDays);

  const [beautyName, setBeautyName] = useState(config.beautyShopName);
  const [beautyAddr, setBeautyAddr] = useState(config.beautyAddress);
  const [beautyPhone, setBeautyPhone] = useState(config.beautyPhone);
  const [beautyHours, setBeautyHours] = useState(config.beautyOpenDays);

  const [saveSuccess, setSaveSuccess] = useState(false);

  // New Service Modal State
  const [serviceModalVisible, setServiceModalVisible] = useState(false);
  const [newServBranch, setNewServBranch] = useState<SalonBranch>('barber');
  const [newServCat, setNewServCat] = useState('Cortes');
  const [newServName, setNewServName] = useState('');
  const [newServDesc, setNewServDesc] = useState('');
  const [newServPrice, setNewServPrice] = useState('20');
  const [newServDur, setNewServDur] = useState('30');

  // New Staff Modal State
  const [staffModalVisible, setStaffModalVisible] = useState(false);
  const [newStaffBranch, setNewStaffBranch] = useState<SalonBranch>('barber');
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('Master Barber');
  const [newStaffPhone, setNewStaffPhone] = useState('');

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
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleCreateService = async () => {
    if (!newServName.trim()) {
      alert('Introduza o nome do serviço.');
      return;
    }
    await addService({
      branch: newServBranch,
      category: newServCat,
      name: newServName.trim(),
      description: newServDesc.trim() || 'Serviço de alta qualidade Almaria.',
      price: parseFloat(newServPrice) || 15,
      durationMinutes: parseInt(newServDur, 10) || 30,
      iconName: 'scissors',
    });

    setNewServName('');
    setNewServDesc('');
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
        <Text style={styles.headerTitle}>⚙️ PAINEL ADMINISTRADOR (CONFIGS)</Text>
        <Text style={styles.headerSub}>Gerir dados das marcas, catálogo de serviços e equipa</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'general' && styles.tabBtnActive]}
          onPress={() => setActiveTab('general')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'general' && styles.tabBtnTextActive]}>
            🏬 Lojas & Contactos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'services' && styles.tabBtnActive]}
          onPress={() => setActiveTab('services')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'services' && styles.tabBtnTextActive]}>
            ✂️ Serviços ({services.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'staff' && styles.tabBtnActive]}
          onPress={() => setActiveTab('staff')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'staff' && styles.tabBtnTextActive]}>
            👥 Colaboradores ({staff.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'general' ? (
          /* GENERAL CONFIGS */
          <View>
            {saveSuccess ? (
              <View style={styles.successBanner}>
                <Text style={styles.successBannerText}>✓ Configurações guardadas com sucesso!</Text>
              </View>
            ) : null}

            {/* Barber Shop Settings */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>💈 Configuração Almare Barber</Text>

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
              <Text style={[styles.sectionTitle, { color: '#F472B6' }]}>💅 Configuração Almare Beauty</Text>

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
                onPress={() => setServiceModalVisible(true)}
              >
                <Text style={styles.addBtnText}>+ Novo Serviço</Text>
              </TouchableOpacity>
            </View>

            {services.map(item => (
              <View key={item.id} style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>
                    {item.branch === 'barber' ? '💈' : '💅'} {item.name}
                  </Text>
                  <Text style={styles.itemSub}>
                    {item.category} • {item.price.toFixed(2)} € • {item.durationMinutes} min
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => deleteService(item.id)}
                >
                  <Text style={styles.deleteBtnText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            ))}
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
                    👤 {item.name} ({item.branch === 'barber' ? 'Barber' : 'Beauty'})
                  </Text>
                  <Text style={styles.itemSub}>
                    {item.roleTitle} • ⭐ {item.rating} • {item.phone}
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

      {/* Add Service Modal */}
      <Modal visible={serviceModalVisible} transparent animationType="slide" onRequestClose={() => setServiceModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setServiceModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Adicionar Novo Serviço</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Ramo / Salão</Text>
              <View style={styles.branchSelectRow}>
                <TouchableOpacity
                  style={[styles.branchTab, newServBranch === 'barber' && styles.branchTabActive]}
                  onPress={() => setNewServBranch('barber')}
                >
                  <Text style={styles.branchTabText}>💈 Barber</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.branchTab, newServBranch === 'beauty' && styles.branchTabActive]}
                  onPress={() => setNewServBranch('beauty')}
                >
                  <Text style={styles.branchTabText}>💅 Beauty</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nome do Serviço *</Text>
              <TextInput style={styles.input} value={newServName} onChangeText={setNewServName} placeholder="Ex: Corte Skin Fade" placeholderTextColor="#71717A" />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Categoria</Text>
              <TextInput style={styles.input} value={newServCat} onChangeText={setNewServCat} />
            </View>

            <View style={styles.rowTwo}>
              <View style={[styles.fieldGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.label}>Preço (€)</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={newServPrice} onChangeText={setNewServPrice} />
              </View>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Duração (min)</Text>
                <TextInput style={styles.input} keyboardType="numeric" value={newServDur} onChangeText={setNewServDur} />
              </View>
            </View>

            <TouchableOpacity style={styles.modalSaveBtn} onPress={handleCreateService}>
              <Text style={styles.modalSaveBtnText}>Criar Serviço</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setServiceModalVisible(false)}>
              <Text style={styles.modalCancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
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
                  <Text style={styles.branchTabText}>💈 Barber</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.branchTab, newStaffBranch === 'beauty' && styles.branchTabActive]}
                  onPress={() => setNewStaffBranch('beauty')}
                >
                  <Text style={styles.branchTabText}>💅 Beauty</Text>
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
  deleteBtn: {
    backgroundColor: 'rgba(239,68,68,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
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
});
