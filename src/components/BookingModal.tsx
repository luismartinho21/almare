import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  ScrollView,
} from 'react-native';
import { SalonBranch, Service, StaffMember } from '../types';
import { Theme } from '../constants/theme';

interface BookingModalProps {
  visible: boolean;
  onClose: () => void;
  branch: SalonBranch;
  selectedServices: Service[];
  staff: StaffMember | null;
  date: string;
  timeSlot: string;
  onConfirmBooking: (clientName: string, clientPhone: string, notes?: string) => Promise<void>;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  visible,
  onClose,
  branch,
  selectedServices,
  staff,
  date,
  timeSlot,
  onConfirmBooking,
}) => {
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isBarber = branch === 'barber';
  const accentColor = isBarber ? Theme.colors.barber.accent : Theme.colors.beauty.accent;

  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0);

  const handleSubmit = async () => {
    if (!clientName.trim()) {
      setErrorMsg('Por favor, introduza o seu nome.');
      return;
    }
    if (!clientPhone.trim() || clientPhone.trim().length < 9) {
      setErrorMsg('Por favor, introduza um número de telemóvel válido (ex: 912345678).');
      return;
    }

    setErrorMsg('');
    setLoading(true);
    try {
      await onConfirmBooking(clientName, clientPhone, notes);
      setClientName('');
      setClientPhone('');
      setNotes('');
    } catch (e) {
      setErrorMsg('Erro ao guardar marcação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (selectedServices.length === 0 || !staff) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={e => e.stopPropagation()}>
          <Text style={[styles.title, { color: isBarber ? '#F3F4F6' : '#111827' }]}>
            Finalizar Marcação
          </Text>
          <Text style={styles.subtitle}>
            Basta indicar o seu nome e telemóvel para confirmar a vaga instantaneamente.
          </Text>

          {/* Booking Summary Box with Multi-Services */}
          <View style={[styles.summaryBox, { backgroundColor: isBarber ? '#27272A' : '#FFF5F7' }]}>
            <Text style={[styles.summaryHeaderTitle, { color: accentColor }]}>
              📋 SERVIÇOS SELECIONADOS ({selectedServices.length}):
            </Text>

            <ScrollView style={{ maxHeight: 110 }} nestedScrollEnabled>
              {selectedServices.map((s, idx) => (
                <View key={s.id || idx} style={styles.serviceItemRow}>
                  <Text style={[styles.summaryService, { color: isBarber ? '#F4F4F5' : '#1F2937' }]}>
                    • {s.name} ({s.durationMinutes} min)
                  </Text>
                  <Text style={[styles.servicePrice, { color: isBarber ? Theme.colors.barber.accent : Theme.colors.beauty.badge }]}>
                    {s.price.toFixed(2)} €
                  </Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TOTAL A PAGAR NO SALÃO:</Text>
              <Text style={[styles.totalValue, { color: accentColor }]}>
                {totalPrice.toFixed(2)} € <Text style={{ fontSize: 11, color: '#9CA3AF' }}>({totalDuration} min)</Text>
              </Text>
            </View>

            <Text style={styles.summaryStaff}>👤 Profissional: {staff.name}</Text>
            <Text style={styles.summaryDateTime}>
              📅 Data: {date} às {timeSlot}
            </Text>
          </View>

          {errorMsg ? <Text style={styles.errorText}>⚠️ {errorMsg}</Text> : null}

          {/* Form Fields */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>O seu Nome *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: João Silva"
              placeholderTextColor="#9CA3AF"
              value={clientName}
              onChangeText={setClientName}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Número de Telemóvel *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 912 345 678"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              value={clientPhone}
              onChangeText={setClientPhone}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Notas ou Preferências (Opcional)</Text>
            <TextInput
              style={[styles.input, { height: 50, textAlignVertical: 'top' }]}
              placeholder="Ex: Preferência fade baixo..."
              placeholderTextColor="#9CA3AF"
              multiline
              value={notes}
              onChangeText={setNotes}
            />
          </View>

          {/* Buttons */}
          <TouchableOpacity
            style={[styles.confirmBtn, { backgroundColor: accentColor }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#111" />
            ) : (
              <Text style={styles.confirmBtnText}>Confirmar Marcação ({totalPrice.toFixed(2)} €)</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Voltar atrás</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#18181B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#3F3F46',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
    marginTop: 2,
  },
  summaryBox: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  summaryHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  serviceItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  summaryService: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  servicePrice: {
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#3F3F46',
    marginVertical: 6,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  totalLabel: {
    color: '#E5E7EB',
    fontSize: 11,
    fontWeight: '800',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '900',
  },
  summaryStaff: {
    fontSize: 12,
    color: '#D1D5DB',
    marginTop: 2,
  },
  summaryDateTime: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
    marginTop: 1,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
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
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontSize: 13,
  },
  confirmBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  confirmBtnText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '900',
  },
  cancelBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  cancelBtnText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
  },
});
