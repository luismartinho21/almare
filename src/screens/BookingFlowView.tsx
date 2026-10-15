import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SalonBranch, Service, StaffMember, Appointment } from '../types';
import { useApp } from '../context/AppContext';
import { Theme } from '../constants/theme';
import { ServiceCard } from '../components/ServiceCard';
import { StaffCard } from '../components/StaffCard';
import { TimeSlotPicker } from '../components/TimeSlotPicker';
import { BookingModal } from '../components/BookingModal';
import { BookingSuccessModal } from '../components/BookingSuccessModal';

interface BookingFlowViewProps {
  onBackToHome: () => void;
}

export const BookingFlowView: React.FC<BookingFlowViewProps> = ({ onBackToHome }) => {
  const { activeBranch, services, staff, appointments, createAppointment } = useApp();

  const isBarber = activeBranch === 'barber';
  const accentColor = isBarber ? Theme.colors.barber.accent : Theme.colors.beauty.accent;

  // Filter services by branch
  const branchServices = useMemo(() => {
    return services.filter(s => s.branch === activeBranch);
  }, [services, activeBranch]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    branchServices.forEach(s => set.add(s.category));
    return ['TODOS', ...Array.from(set)];
  }, [branchServices]);

  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);

  // Toggle service selection (Multi-selection support)
  const handleToggleService = (service: Service) => {
    setSelectedServices(prev => {
      const exists = prev.some(s => s.id === service.id);
      if (exists) {
        return prev.filter(s => s.id !== service.id);
      } else {
        return [...prev, service];
      }
    });
  };

  // Sum total price & duration
  const totalPrice = useMemo(() => {
    return selectedServices.reduce((sum, s) => sum + s.price, 0);
  }, [selectedServices]);

  const totalDuration = useMemo(() => {
    return selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0);
  }, [selectedServices]);

  // Filter staff by branch
  const branchStaff = useMemo(() => {
    return staff.filter(s => s.branch === activeBranch);
  }, [staff, activeBranch]);

  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  // Dates & Time
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('11:00');

  // Modals
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Appointment | null>(null);

  const filteredServices = useMemo(() => {
    if (selectedCategory === 'TODOS') return branchServices;
    return branchServices.filter(s => s.category === selectedCategory);
  }, [branchServices, selectedCategory]);

  const handleOpenCheckout = () => {
    if (selectedServices.length === 0) {
      alert('Por favor, selecione pelo menos um serviço.');
      return;
    }
    const effectiveStaff = selectedStaff || branchStaff[0];
    setSelectedStaff(effectiveStaff);
    setBookingModalVisible(true);
  };

  const handleConfirmBooking = async (clientName: string, clientPhone: string, notes?: string) => {
    if (selectedServices.length === 0 || !selectedStaff) return;

    const created = await createAppointment(
      activeBranch,
      clientName,
      clientPhone,
      selectedServices,
      selectedStaff,
      selectedDate,
      selectedTimeSlot,
      notes
    );

    setBookingModalVisible(false);
    setConfirmedBooking(created);
  };

  return (
    <View style={[styles.container, isBarber ? styles.bgBarber : styles.bgBeauty]}>
      {/* Header Bar */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={onBackToHome}>
          <Text style={styles.backBtnText}>‹ Voltar aos Salões</Text>
        </TouchableOpacity>
        <Text style={[styles.branchTitle, { color: accentColor }]}>
          {isBarber ? '💈 ALMARE BARBER' : '💅 ALMARE BEAUTY'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Step 1: Multi-Services Selection */}
        <View style={styles.sectionTitleRow}>
          <Text style={[styles.stepHeader, { color: isBarber ? '#F3F4F6' : '#111827' }]}>
            1. Selecione os Serviços (1 ou mais)
          </Text>
          {selectedServices.length > 0 && (
            <TouchableOpacity onPress={() => setSelectedServices([])}>
              <Text style={styles.clearText}>Limpar ({selectedServices.length})</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Selected Services Counter Bar */}
        {selectedServices.length > 0 && (
          <View style={[styles.summaryPill, { backgroundColor: isBarber ? '#272730' : '#FCE7F3' }]}>
            <Text style={[styles.summaryPillText, { color: isBarber ? Theme.colors.barber.accent : Theme.colors.beauty.badge }]}>
              ✓ {selectedServices.length} {selectedServices.length === 1 ? 'Serviço Selecionado' : 'Serviços Selecionados'}:{' '}
              <Text style={{ fontWeight: '900' }}>{totalPrice.toFixed(2)} €</Text> ({totalDuration} min)
            </Text>
          </View>
        )}

        {/* Category Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {categories.map(cat => {
            const isCatSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryTab,
                  isBarber ? styles.categoryTabBarber : styles.categoryTabBeauty,
                  isCatSelected && { backgroundColor: accentColor, borderColor: accentColor },
                ]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryTabText,
                    { color: isCatSelected ? '#111' : isBarber ? '#D1D5DB' : '#374151' },
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Service Cards List */}
        {filteredServices.map(service => {
          const isSelected = selectedServices.some(s => s.id === service.id);
          return (
            <ServiceCard
              key={service.id}
              service={service}
              branch={activeBranch}
              isSelected={isSelected}
              onToggleSelect={handleToggleService}
            />
          );
        })}

        {/* Step 2: Staff */}
        <Text style={[styles.stepHeader, { color: isBarber ? '#F3F4F6' : '#111827', marginTop: 16 }]}>
          2. Selecione o Profissional
        </Text>

        {branchStaff.map(s => (
          <StaffCard
            key={s.id}
            staff={s}
            branch={activeBranch}
            isSelected={selectedStaff?.id === s.id}
            onSelect={st => setSelectedStaff(st)}
          />
        ))}

        {/* Step 3: Date & TimeSlot */}
        <Text style={[styles.stepHeader, { color: isBarber ? '#F3F4F6' : '#111827', marginTop: 16 }]}>
          3. Data e Horário
        </Text>

        <TimeSlotPicker
          branch={activeBranch}
          selectedDate={selectedDate}
          onSelectDate={d => setSelectedDate(d)}
          selectedTimeSlot={selectedTimeSlot}
          onSelectTimeSlot={ts => setSelectedTimeSlot(ts)}
          staffMember={selectedStaff || undefined}
          appointments={appointments}
        />

        {/* Action Button */}
        <TouchableOpacity
          style={[
            styles.proceedBtn,
            { backgroundColor: selectedServices.length > 0 ? accentColor : '#4B5563' },
          ]}
          onPress={handleOpenCheckout}
          disabled={selectedServices.length === 0}
          activeOpacity={0.8}
        >
          <Text style={styles.proceedBtnText}>
            {selectedServices.length > 0
              ? `Avançar • ${selectedServices.length} ${selectedServices.length === 1 ? 'Serviço' : 'Serviços'} • ${totalPrice.toFixed(2)} € (${totalDuration} min)`
              : 'Selecione 1 ou mais Serviços para Continuar'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Booking Modal (Input Nome + Telemóvel) */}
      <BookingModal
        visible={bookingModalVisible}
        onClose={() => setBookingModalVisible(false)}
        branch={activeBranch}
        selectedServices={selectedServices}
        staff={selectedStaff || (branchStaff[0] || null)}
        date={selectedDate}
        timeSlot={selectedTimeSlot}
        onConfirmBooking={handleConfirmBooking}
      />

      {/* Success Modal */}
      <BookingSuccessModal
        visible={!!confirmedBooking}
        appointment={confirmedBooking}
        onClose={() => setConfirmedBooking(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bgBarber: {
    backgroundColor: '#0D0D11',
  },
  bgBeauty: {
    backgroundColor: '#FAF5F7',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  backBtnText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '700',
  },
  branchTitle: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepHeader: {
    fontSize: 16,
    fontWeight: '800',
  },
  clearText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  summaryPill: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: 'center',
  },
  summaryPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  categoryScroll: {
    marginBottom: 12,
  },
  categoryTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  categoryTabBarber: {
    backgroundColor: '#1C1C22',
    borderColor: '#3F3F46',
  },
  categoryTabBeauty: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  categoryTabText: {
    fontSize: 12,
    fontWeight: '800',
  },
  proceedBtn: {
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  proceedBtnText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '900',
  },
});
