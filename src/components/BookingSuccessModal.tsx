import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Pressable, Linking } from 'react-native';
import { Appointment, SalonBranch } from '../types';
import { useApp } from '../context/AppContext';
import { Theme } from '../constants/theme';

interface BookingSuccessModalProps {
  visible: boolean;
  appointment: Appointment | null;
  onClose: () => void;
}

export const BookingSuccessModal: React.FC<BookingSuccessModalProps> = ({
  visible,
  appointment,
  onClose,
}) => {
  const { config } = useApp();
  if (!appointment) return null;

  const isBarber = appointment.branch === 'barber';
  const shopName = isBarber ? config.barberShopName : config.beautyShopName;
  const shopAddress = isBarber ? config.barberAddress : config.beautyAddress;
  const shopPhone = isBarber ? config.barberPhone : config.beautyPhone;

  const handleOpenWhatsApp = () => {
    const msg = encodeURIComponent(
      `Olá ${shopName}! Fiz uma marcação para ${appointment.serviceName} no dia ${appointment.date} às ${appointment.timeSlot} em nome de ${appointment.clientName}.`
    );
    const cleanPhone = shopPhone.replace(/\s+/g, '');
    Linking.openURL(`https://wa.me/${cleanPhone}?text=${msg}`);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={e => e.stopPropagation()}>
          <View style={styles.iconCircle}>
            <Text style={styles.checkIcon}>✓</Text>
          </View>

          <Text style={styles.title}>Marcação Confirmada!</Text>
          <Text style={styles.subTitle}>
            O horário de <Text style={styles.boldText}>{appointment.timeSlot}</Text> no dia{' '}
            <Text style={styles.boldText}>{appointment.date}</Text> ficou imediatamente reservado.
          </Text>

          {/* Appointment Ticket */}
          <View style={styles.ticketBox}>
            <View style={styles.ticketHeader}>
              <Text style={styles.ticketRef}>REF: #{appointment.id.toUpperCase()}</Text>
              <Text style={styles.ticketShop}>{shopName}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.ticketRow}>
              <Text style={styles.label}>Cliente:</Text>
              <Text style={styles.value}>{appointment.clientName} ({appointment.clientPhone})</Text>
            </View>

            <View style={styles.ticketRow}>
              <Text style={styles.label}>Serviço:</Text>
              <Text style={styles.value}>{appointment.serviceName} - {appointment.servicePrice} €</Text>
            </View>

            <View style={styles.ticketRow}>
              <Text style={styles.label}>Profissional:</Text>
              <Text style={styles.value}>{appointment.staffName}</Text>
            </View>

            <View style={styles.ticketRow}>
              <Text style={styles.label}>Localização:</Text>
              <Text style={styles.valueSmall}>{shopAddress}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.whatsappBtn} onPress={handleOpenWhatsApp}>
            <Text style={styles.whatsappBtnText}>💬 Contactar Salão via WhatsApp</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
            <Text style={styles.doneBtnText}>Concluído</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#1E1E24',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 440,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.brandSecondary,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  checkIcon: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: '900',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 6,
  },
  subTitle: {
    color: '#9CA3AF',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  boldText: {
    color: Theme.colors.brandSecondary,
    fontWeight: '700',
  },
  ticketBox: {
    backgroundColor: '#27272A',
    borderRadius: 14,
    padding: 16,
    width: '100%',
    marginBottom: 20,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketRef: {
    color: Theme.colors.brandSecondary,
    fontSize: 11,
    fontWeight: '800',
  },
  ticketShop: {
    color: '#E5E7EB',
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#3F3F46',
    marginVertical: 10,
  },
  ticketRow: {
    marginBottom: 8,
  },
  label: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600',
  },
  value: {
    color: '#F9FAFB',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 1,
  },
  valueSmall: {
    color: '#D1D5DB',
    fontSize: 12,
    marginTop: 1,
  },
  whatsappBtn: {
    backgroundColor: '#25D366',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  whatsappBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  doneBtn: {
    backgroundColor: Theme.colors.brandSecondary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '900',
  },
});
