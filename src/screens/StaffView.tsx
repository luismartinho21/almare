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
import { StaffMember, ClientHistoryNote } from '../types';
import { Theme } from '../constants/theme';

export const StaffView: React.FC = () => {
  const { staff, appointments, clientHistory, addStaffNoteForClient } = useApp();

  const [selectedStaffId, setSelectedStaffId] = useState<string>(staff[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'schedule' | 'history'>('schedule');
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

  const todayStr = new Date().toISOString().split('T')[0];

  // My schedule today
  const mySchedule = useMemo(() => {
    if (!currentStaff) return [];
    return appointments.filter(
      a => a.staffId === currentStaff.id && a.date === todayStr && a.status !== 'cancelled'
    );
  }, [appointments, currentStaff, todayStr]);

  // Client history filtered (last 3 months, filterable by client name/phone)
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

  return (
    <View style={styles.container}>
      {/* Top Header & Staff Picker */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>✂️ ÁREA DO FUNCIONÁRIO</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.staffPickerScroll}>
          {staff.map(s => {
            const isSelected = s.id === currentStaff?.id;
            return (
              <TouchableOpacity
                key={s.id}
                style={[styles.staffChip, isSelected && styles.staffChipSelected]}
                onPress={() => setSelectedStaffId(s.id)}
              >
                <Text style={[styles.staffChipText, isSelected && styles.staffChipTextSelected]}>
                  {s.name} ({s.branch === 'barber' ? 'Barber' : 'Beauty'})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Tab Navigation */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'schedule' && styles.tabBtnActive]}
          onPress={() => setActiveTab('schedule')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'schedule' && styles.tabBtnTextActive]}>
            📅 Agenda de Hoje ({mySchedule.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'history' && styles.tabBtnActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabBtnText, activeTab === 'history' && styles.tabBtnTextActive]}>
            📂 Histórico (3 Meses)
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'schedule' ? (
          /* MY DAILY SCHEDULE */
          <View>
            <Text style={styles.sectionTitle}>
              Marcações de Hoje para {currentStaff?.name}
            </Text>

            {mySchedule.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>☕</Text>
                <Text style={styles.emptyTitle}>Sem marcações agendadas para hoje</Text>
                <Text style={styles.emptySub}>
                  Aproveite para consultar o histórico de clientes ou preparar o posto de trabalho.
                </Text>
              </View>
            ) : (
              mySchedule.map(app => (
                <View key={app.id} style={styles.scheduleCard}>
                  <View style={styles.cardTimeRow}>
                    <Text style={styles.slotText}>⏰ {app.timeSlot}</Text>
                    <Text style={styles.durationText}>({app.serviceDuration} min)</Text>
                  </View>

                  <Text style={styles.clientNameText}>{app.clientName}</Text>
                  <Text style={styles.clientPhoneText}>📞 {app.clientPhone}</Text>

                  <View style={styles.serviceBox}>
                    <Text style={styles.serviceTitle}>{app.serviceName}</Text>
                    {app.notes ? <Text style={styles.notesText}>📝 Nota: "{app.notes}"</Text> : null}
                  </View>

                  <TouchableOpacity
                    style={styles.addNoteBtn}
                    onPress={() => {
                      setClientName(app.clientName);
                      setClientPhone(app.clientPhone);
                      setServiceName(app.serviceName);
                      setAddModalVisible(true);
                    }}
                  >
                    <Text style={styles.addNoteBtnText}>+ Registar Ficha do Corte / Serviço</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        ) : (
          /* 3 MONTHS CLIENT HISTORY (SAVED LOCALLY) */
          <View>
            <View style={styles.historyHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>Fichas & Histórico do Equipamento</Text>
                <Text style={styles.sectionSub}>Guardado localmente no dispositivo (últimos 90 dias)</Text>
              </View>

              <TouchableOpacity
                style={styles.newRecordBtn}
                onPress={() => setAddModalVisible(true)}
              >
                <Text style={styles.newRecordBtnText}>+ Nova Ficha</Text>
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <TextInput
              style={styles.historySearchInput}
              placeholder="🔍 Pesquisar por nome do cliente ou telemóvel..."
              placeholderTextColor="#9CA3AF"
              value={historySearch}
              onChangeText={setHistorySearch}
            />

            {filteredHistory.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>📜</Text>
                <Text style={styles.emptyTitle}>Sem fichas no histórico local</Text>
                <Text style={styles.emptySub}>
                  Registe o estilo do corte, tipo de lâmina ou cor do cabelo dos seus clientes.
                </Text>
              </View>
            ) : (
              filteredHistory.map(note => (
                <View key={note.id} style={styles.historyCard}>
                  <View style={styles.historyCardHeader}>
                    <Text style={styles.historyClientName}>{note.clientName}</Text>
                    <Text style={styles.historyDate}>{note.date}</Text>
                  </View>

                  <Text style={styles.historyClientPhone}>📞 {note.clientPhone}</Text>

                  <View style={styles.historyDetailsBox}>
                    <Text style={styles.historyServiceTitle}>✂️ {note.serviceName}</Text>
                    <Text style={styles.historyDetailsText}>{note.details}</Text>
                    <Text style={styles.historyStaffName}>Registado por: {note.staffName}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Add Client Note Modal */}
      <Modal visible={addModalVisible} transparent animationType="slide" onRequestClose={() => setAddModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setAddModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Registar Histórico do Cliente</Text>
            <Text style={styles.modalSub}>
              Os detalhes serão guardados no armazenamento local do dispositivo para rápida consulta nos próximos 3 meses.
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nome do Cliente *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: João Silva"
                placeholderTextColor="#9CA3AF"
                value={clientName}
                onChangeText={setClientName}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Telemóvel *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 912345678"
                placeholderTextColor="#9CA3AF"
                keyboardType="phone-pad"
                value={clientPhone}
                onChangeText={setClientPhone}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Serviço Efetuado</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Corte Fade + Barba Ritual"
                placeholderTextColor="#9CA3AF"
                value={serviceName}
                onChangeText={setServiceName}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Detalhes do Corte / Tratamento *</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Ex: Lâmina #1.5 nos lados com degradê a navalha. Tesoura no topo com textura. Óleo de eucalipto na barba."
                placeholderTextColor="#9CA3AF"
                multiline
                value={details}
                onChangeText={setDetails}
              />
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveNote}>
              <Text style={styles.saveBtnText}>Guardar Ficha no Equipamento</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setAddModalVisible(false)}>
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
    marginBottom: 10,
  },
  staffPickerScroll: {
    flexDirection: 'row',
  },
  staffChip: {
    backgroundColor: '#27272A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  staffChipSelected: {
    backgroundColor: Theme.colors.brandSecondary,
    borderColor: Theme.colors.brandSecondary,
  },
  staffChipText: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '700',
  },
  staffChipTextSelected: {
    color: '#111827',
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
    fontSize: 13,
    fontWeight: '700',
  },
  tabBtnTextActive: {
    color: Theme.colors.brandSecondary,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    color: '#F4F4F5',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  sectionSub: {
    color: '#9CA3AF',
    fontSize: 11,
    marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: '#18181C',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    marginTop: 10,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    color: '#F3F4F6',
    fontSize: 15,
    fontWeight: '700',
  },
  emptySub: {
    color: '#9CA3AF',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  scheduleCard: {
    backgroundColor: '#18181C',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  cardTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  slotText: {
    color: Theme.colors.brandSecondary,
    fontSize: 16,
    fontWeight: '900',
    marginRight: 8,
  },
  durationText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  clientNameText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  clientPhoneText: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 2,
    marginBottom: 8,
  },
  serviceBox: {
    backgroundColor: '#27272A',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  serviceTitle: {
    color: '#F3F4F6',
    fontSize: 14,
    fontWeight: '700',
  },
  notesText: {
    color: Theme.colors.brandSecondary,
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  addNoteBtn: {
    backgroundColor: '#27272A',
    borderColor: Theme.colors.brandSecondary,
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  addNoteBtnText: {
    color: Theme.colors.brandSecondary,
    fontSize: 13,
    fontWeight: '800',
  },
  historyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  newRecordBtn: {
    backgroundColor: Theme.colors.brandSecondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  newRecordBtnText: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '900',
  },
  historySearchInput: {
    backgroundColor: '#18181C',
    borderColor: '#27272A',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#FFF',
    fontSize: 13,
    marginBottom: 14,
  },
  historyCard: {
    backgroundColor: '#18181C',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyClientName: {
    color: '#F3F4F6',
    fontSize: 16,
    fontWeight: '800',
  },
  historyDate: {
    color: '#9CA3AF',
    fontSize: 11,
  },
  historyClientPhone: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
    marginBottom: 8,
  },
  historyDetailsBox: {
    backgroundColor: '#27272A',
    padding: 10,
    borderRadius: 8,
  },
  historyServiceTitle: {
    color: Theme.colors.brandSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  historyDetailsText: {
    color: '#E5E7EB',
    fontSize: 13,
    lineHeight: 18,
  },
  historyStaffName: {
    color: '#9CA3AF',
    fontSize: 10,
    marginTop: 6,
    textAlign: 'right',
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
  },
  modalSub: {
    color: '#9CA3AF',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  fieldGroup: {
    marginBottom: 10,
  },
  label: {
    color: '#E5E7EB',
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
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '900',
  },
  cancelModalBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  cancelModalBtnText: {
    color: '#9CA3AF',
    fontSize: 13,
  },
});
