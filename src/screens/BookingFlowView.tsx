import React, { useState, useMemo, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { Service, StaffMember, Appointment } from '../types';
import { useApp } from '../context/AppContext';
import { Theme } from '../constants/theme';
import { ServiceCard } from '../components/ServiceCard';
import { StaffCard } from '../components/StaffCard';
import { TimeSlotPicker } from '../components/TimeSlotPicker';
import { BookingModal } from '../components/BookingModal';
import { BookingSuccessModal } from '../components/BookingSuccessModal';
import {
  getFreeStaffForInterval,
  isStaffAvailableForInterval,
  isSalonOpenDay,
  ALL_WORKING_SLOTS,
} from '../utils/scheduleHelper';

interface BookingFlowViewProps {
  onBackToHome: () => void;
}

type BookingStep = 1 | 2;

export const BookingFlowView: React.FC<BookingFlowViewProps> = ({ onBackToHome }) => {
  const { activeBranch, services, staff, appointments, createAppointment } = useApp();

  const isBarber = activeBranch === 'barber';
  const accentColor = isBarber ? Theme.colors.barber.accent : Theme.colors.beauty.accent;

  // Fluxo de agendamento em 2 passos integrados:
  // 1: Serviços -> 2: Profissional & Horário integrado
  const [currentStep, setCurrentStep] = useState<BookingStep>(1);

  // Fade in de entrada suave e sereno
  const enterFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enterFadeAnim, {
      toValue: 1,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [enterFadeAnim]);

  // Filter services by branch
  const branchServices = useMemo(() => {
    return services.filter(s => s.branch === activeBranch);
  }, [services, activeBranch]);

  // Separate regular services and extras
  const extraServices = useMemo(() => {
    return branchServices.filter(s => s.category.toLowerCase() === 'extras');
  }, [branchServices]);

  const regularServices = useMemo(() => {
    return branchServices.filter(s => s.category.toLowerCase() !== 'extras');
  }, [branchServices]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    regularServices.forEach(s => set.add(s.category));
    return ['TODOS', ...Array.from(set)];
  }, [regularServices]);

  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);

  // Staff selection state:
  // Can be a specific staff member OR "sem preferência"
  const branchStaff = useMemo(() => {
    return staff.filter(s => s.branch === activeBranch);
  }, [staff, activeBranch]);

  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [isNoPreference, setIsNoPreference] = useState<boolean>(false);

  useEffect(() => {
    setSelectedServices([]);
    setSelectedStaff(null);
    setIsNoPreference(false);
    setSelectedTimeSlot('');
  }, [activeBranch]);

  // Toggle service selection
  const handleToggleService = (service: Service) => {
    setSelectedServices(prev => {
      const exists = prev.some(s => s.id === service.id);
      if (exists) {
        if (service.compatibleExtraIds && service.compatibleExtraIds.length > 0) {
          return prev.filter(s => s.id !== service.id && !service.compatibleExtraIds!.includes(s.id));
        }
        return prev.filter(s => s.id !== service.id);
      } else {
        return [...prev, service];
      }
    });
  };

  const totalPrice = useMemo(() => {
    return selectedServices.reduce((sum, s) => sum + s.price, 0);
  }, [selectedServices]);

  const totalDuration = useMemo(() => {
    return selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0);
  }, [selectedServices]);

  // Dates & Time
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');

  // Modals
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Appointment | null>(null);

  const filteredServices = useMemo(() => {
    if (selectedCategory === 'TODOS') return regularServices;
    return regularServices.filter(s => s.category === selectedCategory);
  }, [regularServices, selectedCategory]);

  // Check if a specific slot is available for a staff member or whole team
  const checkSlotAvailability = (targetStaff: StaffMember | null, noPref: boolean, slot: string): boolean => {
    if (!isSalonOpenDay(selectedDate) || !slot) return false;
    if (noPref) {
      return getFreeStaffForInterval(branchStaff, slot, totalDuration, selectedDate, appointments).length > 0;
    }
    if (targetStaff) {
      return isStaffAvailableForInterval(targetStaff, slot, totalDuration, selectedDate, appointments);
    }
    return false;
  };

  // Check if a staff member or team has AT LEAST ONE available slot on selectedDate
  const hasAnyAvailableSlot = (targetStaff: StaffMember | null, noPref: boolean): boolean => {
    if (!isSalonOpenDay(selectedDate)) return false;
    return ALL_WORKING_SLOTS.some(slot => checkSlotAvailability(targetStaff, noPref, slot));
  };

  // Determine effective staff for checkout based on accumulated duration
  const getEffectiveStaff = (): StaffMember => {
    if (!isNoPreference && selectedStaff) {
      return selectedStaff;
    }
    const freeList = getFreeStaffForInterval(
      branchStaff,
      selectedTimeSlot,
      totalDuration,
      selectedDate,
      appointments
    );
    return freeList[0] || branchStaff[0];
  };

  const handleOpenCheckout = (staffTarget?: StaffMember | null, noPref?: boolean) => {
    if (selectedServices.length === 0) {
      alert('Por favor, selecione pelo menos um serviço.');
      return;
    }
    const checkNoPref = noPref ?? isNoPreference;
    const checkStaff = staffTarget ?? selectedStaff;
    if (!checkStaff && !checkNoPref) {
      alert('Por favor, selecione um profissional para consultar e confirmar o horário.');
      return;
    }
    if (!isSalonOpenDay(selectedDate)) {
      alert('O salão encontra-se encerrado na data selecionada. Por favor escolha um dia de Terça a Sábado.');
      return;
    }
    if (!selectedTimeSlot) {
      alert('Por favor, selecione uma vaga de horário disponível.');
      return;
    }
    const isFree = checkSlotAvailability(checkStaff, checkNoPref, selectedTimeSlot);
    if (!isFree) {
      alert('O horário pretendido está indisponível ou já se encontra ocupado. Por favor escolha outra vaga.');
      return;
    }
    setBookingModalVisible(true);
  };

  const handleConfirmBooking = async (clientName: string, clientPhone: string, notes?: string) => {
    const effectiveStaff = getEffectiveStaff();
    if (selectedServices.length === 0 || !effectiveStaff) return;

    if (!isSalonOpenDay(selectedDate) || !selectedTimeSlot) {
      alert('Por favor selecione uma data e horário válidos.');
      return;
    }

    const isFree = checkSlotAvailability(effectiveStaff, isNoPreference, selectedTimeSlot);
    if (!isFree) {
      alert('A vaga selecionada já se encontra ocupada ou indisponível. Por favor escolha outro horário.');
      return;
    }

    const bookingNotes = isNoPreference
      ? `${notes ? notes + ' | ' : ''}(Sem preferência de profissional)`
      : notes;

    const created = await createAppointment(
      activeBranch,
      clientName,
      clientPhone,
      selectedServices,
      effectiveStaff,
      selectedDate,
      selectedTimeSlot,
      bookingNotes
    );

    setBookingModalVisible(false);
    setConfirmedBooking(created);
  };

  return (
    <Animated.View
      style={[
        styles.container,
        isBarber ? styles.bgBarber : styles.bgBeauty,
        { opacity: enterFadeAnim },
      ]}
    >
      {/* Step Indicator Bar (2 passos apenas) */}
      <View style={[styles.stepBar, isBarber ? styles.stepBarBarber : styles.stepBarBeauty]}>
        <TouchableOpacity
          style={[styles.stepTab, currentStep === 1 && { borderBottomColor: accentColor, borderBottomWidth: 2 }]}
          onPress={() => setCurrentStep(1)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.stepTabText,
              { color: currentStep === 1 ? accentColor : isBarber ? '#71717A' : '#9CA3AF' },
            ]}
          >
            {currentStep > 1 ? '✓ ' : ''}1. Serviços
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.stepTab,
            currentStep === 2 && { borderBottomColor: accentColor, borderBottomWidth: 2 },
          ]}
          onPress={() => {
            if (selectedServices.length > 0) setCurrentStep(2);
          }}
          disabled={selectedServices.length === 0}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.stepTabText,
              {
                color:
                  currentStep === 2
                    ? accentColor
                    : selectedServices.length > 0
                    ? isBarber
                      ? '#D1D5DB'
                      : '#374151'
                    : isBarber
                    ? '#52525B'
                    : '#D1D5DB',
              },
            ]}
          >
            2. Profissional & Horário
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ============================================================ */}
        {/* STEP 1: SERVIÇOS (1 ou mais) */}
        {/* ============================================================ */}
        {currentStep === 1 && (
          <View>
            <View style={styles.sectionTitleRow}>
              <View>
                <TouchableOpacity onPress={onBackToHome} style={{ marginBottom: 4 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: accentColor }}>← Voltar ao Início</Text>
                </TouchableOpacity>
                <Text style={[styles.stepHeader, { color: isBarber ? '#F3F4F6' : '#111827' }]}>
                  1. Selecione os Serviços
                </Text>
              </View>
              {selectedServices.length > 0 && (
                <TouchableOpacity onPress={() => setSelectedServices([])}>
                  <Text style={styles.clearText}>Limpar ({selectedServices.length})</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Selected Services Counter Bar */}
            {selectedServices.length > 0 && (
              <View style={styles.selectedSectionContainer}>
                <View style={[styles.summaryPill, { backgroundColor: isBarber ? '#272730' : '#F7F2E7' }]}>
                  <Text
                    style={[
                      styles.summaryPillText,
                      { color: isBarber ? Theme.colors.barber.accent : Theme.colors.beauty.accent },
                    ]}
                  >
                    {selectedServices.length}{' '}
                    {selectedServices.length === 1 ? 'Serviço Selecionado' : 'Serviços Selecionados'}:{' '}
                    <Text style={{ fontWeight: '900' }}>{totalPrice.toFixed(2)} €</Text> ({totalDuration} min)
                  </Text>
                </View>
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

            {/* Service Cards List com extras específicos compatíveis */}
            {filteredServices.map(service => {
              const isSelected = selectedServices.some(s => s.id === service.id);
              let compatibleExtras: Service[] = [];
              if (Array.isArray(service.compatibleExtraIds)) {
                if (service.compatibleExtraIds.length > 0) {
                  compatibleExtras = extraServices.filter(e => service.compatibleExtraIds!.includes(e.id));
                }
              } else {
                if (service.branch === 'beauty') {
                  const cat = service.category.toLowerCase();
                  if (cat.includes('manicure') || cat.includes('pedicure') || cat.includes('unhas')) {
                    compatibleExtras = extraServices.filter(e => e.id === 'be-ext3' || e.id === 'be-ext5');
                  } else if (cat.includes('head-spa')) {
                    compatibleExtras = extraServices.filter(e => e.id === 'be-ext1' || e.id === 'be-ext2');
                  } else if (cat.includes('tratamento')) {
                    compatibleExtras = extraServices.filter(e => e.id === 'be-ext1' || e.id === 'be-ext2' || e.id === 'be-ext4');
                  } else {
                    compatibleExtras = extraServices;
                  }
                } else {
                  compatibleExtras = extraServices;
                }
              }
              const selectedExtrasForThisCard = selectedServices.filter(s =>
                compatibleExtras.some(e => e.id === s.id)
              );

              return (
                <ServiceCard
                  key={service.id}
                  service={service}
                  branch={activeBranch}
                  isSelected={isSelected}
                  onToggleSelect={handleToggleService}
                  availableExtras={compatibleExtras}
                  selectedExtras={selectedExtrasForThisCard}
                  onToggleExtra={handleToggleService}
                />
              );
            })}

            {/* Button to proceed to Step 2 */}
            <TouchableOpacity
              style={[
                styles.proceedBtn,
                { backgroundColor: selectedServices.length > 0 ? accentColor : '#4B5563' },
              ]}
              onPress={() => {
                if (selectedServices.length > 0) setCurrentStep(2);
              }}
              disabled={selectedServices.length === 0}
              activeOpacity={0.8}
            >
              <Text style={styles.proceedBtnText}>
                {selectedServices.length > 0
                  ? `Continuar para Escolha do Profissional & Horário • ${totalPrice.toFixed(2)} €`
                  : 'Selecione 1 ou mais Serviços para Continuar'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ============================================================ */}
        {/* STEP 2: PROFISSIONAL & HORÁRIO (COMO OS EXTRAS) */}
        {/* ============================================================ */}
        {currentStep === 2 && (
          <View>
            <View style={styles.sectionTitleRow}>
              <View>
                <TouchableOpacity onPress={() => setCurrentStep(1)} style={{ marginBottom: 4 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: accentColor }}>← Alterar Serviços</Text>
                </TouchableOpacity>
                <Text style={[styles.stepHeader, { color: isBarber ? '#F3F4F6' : '#111827' }]}>
                  2. Profissional & Horário
                </Text>
              </View>
            </View>

            <Text style={[styles.stepSubHint, { color: isBarber ? '#9CA3AF' : '#6B7280' }]}>
              Selecione o profissional pretendido. O seu horário abre diretamente no cartão para escolher o dia e a vaga disponível.
            </Text>

            {/* Current Summary Banner */}
            <View
              style={[
                styles.bookingSummaryBanner,
                isBarber ? styles.summaryBannerBarber : styles.summaryBannerBeauty,
              ]}
            >
              <View style={styles.summaryBannerRow}>
                <Text style={[styles.summaryBannerLabel, { color: accentColor }]}>SERVIÇOS ({selectedServices.length}):</Text>
                <Text
                  style={[styles.summaryBannerValue, { color: isBarber ? '#FFFFFF' : '#111827' }]}
                  numberOfLines={1}
                >
                  {selectedServices.map(s => s.name).join(' + ')}
                </Text>
              </View>

              <View style={styles.summaryBannerRow}>
                <Text style={[styles.summaryBannerLabel, { color: accentColor }]}>TOTAL:</Text>
                <Text style={[styles.summaryBannerValue, { color: isBarber ? '#FFFFFF' : '#111827' }]}>
                  {totalPrice.toFixed(2)} € • {totalDuration} min acumulados
                </Text>
              </View>
            </View>

            {/* Opção 1: Sem preferência (Abre o horário no próprio cartão, como os extras) */}
            {(() => {
              const isSlotAvailable = checkSlotAvailability(null, true, selectedTimeSlot);
              const hasSlots = hasAnyAvailableSlot(null, true);

              return (
                <StaffCard
                  isNoPreference={true}
                  branch={activeBranch}
                  isSelected={isNoPreference}
                  selectedDate={selectedDate}
                  onSelect={() => {
                    if (isNoPreference) {
                      setIsNoPreference(false);
                      setSelectedTimeSlot('');
                    } else {
                      setIsNoPreference(true);
                      setSelectedStaff(null);
                      setSelectedTimeSlot('');
                    }
                  }}
                  selectedScheduleLabel={isNoPreference && isSlotAvailable ? `${selectedDate} às ${selectedTimeSlot}` : undefined}
                  scheduleNode={
                    <View>
                      <TimeSlotPicker
                        branch={activeBranch}
                        selectedDate={selectedDate}
                        onSelectDate={d => {
                          setSelectedDate(d);
                          setSelectedTimeSlot('');
                        }}
                        selectedTimeSlot={selectedTimeSlot}
                        onSelectTimeSlot={ts => setSelectedTimeSlot(ts)}
                        staffMember={null}
                        isNoPreference={true}
                        branchStaff={branchStaff}
                        appointments={appointments}
                        durationMinutes={totalDuration}
                      />

                      {/* Proceed to checkout button */}
                      <TouchableOpacity
                        style={[
                          styles.proceedBtn,
                          {
                            backgroundColor: isSlotAvailable ? accentColor : isBarber ? '#22222B' : '#E5E7EB',
                            borderColor: isSlotAvailable ? accentColor : isBarber ? '#353545' : '#D1D5DB',
                            borderWidth: 1,
                            opacity: isSlotAvailable ? 1 : 0.65,
                          },
                        ]}
                        disabled={!isSlotAvailable}
                        onPress={() => handleOpenCheckout(null, true)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.proceedBtnText,
                            {
                              color: isSlotAvailable
                                ? (isBarber ? '#111827' : '#FFFFFF')
                                : (isBarber ? '#9CA3AF' : '#6B7280'),
                            },
                          ]}
                        >
                          {!isSalonOpenDay(selectedDate)
                            ? 'Salão Encerrado nesta Data'
                            : !hasSlots
                            ? 'Agenda Completa • Sem Vagas Disponíveis'
                            : !selectedTimeSlot
                            ? 'Selecione uma Vaga Disponível Acima'
                            : `Finalizar Marcação • ${selectedDate} às ${selectedTimeSlot} (${totalPrice.toFixed(2)} €)`}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  }
                />
              );
            })()}

            {/* Opção 2..N: Membros da equipa (Abrem os horários no próprio cartão como os extras) */}
            {branchStaff.map(s => {
              const isSelected = !isNoPreference && selectedStaff?.id === s.id;
              const isSlotAvailable = checkSlotAvailability(s, false, selectedTimeSlot);
              const hasSlots = hasAnyAvailableSlot(s, false);

              return (
                <StaffCard
                  key={s.id}
                  staff={s}
                  branch={activeBranch}
                  isSelected={isSelected}
                  selectedDate={selectedDate}
                  onSelect={() => {
                    if (isSelected) {
                      setSelectedStaff(null);
                      setSelectedTimeSlot('');
                    } else {
                      setSelectedStaff(s);
                      setIsNoPreference(false);
                      setSelectedTimeSlot('');
                    }
                  }}
                  selectedScheduleLabel={isSelected && isSlotAvailable ? `${selectedDate} às ${selectedTimeSlot}` : undefined}
                  scheduleNode={
                    <View>
                      <TimeSlotPicker
                        branch={activeBranch}
                        selectedDate={selectedDate}
                        onSelectDate={d => {
                          setSelectedDate(d);
                          setSelectedTimeSlot('');
                        }}
                        selectedTimeSlot={selectedTimeSlot}
                        onSelectTimeSlot={ts => setSelectedTimeSlot(ts)}
                        staffMember={s}
                        isNoPreference={false}
                        branchStaff={branchStaff}
                        appointments={appointments}
                        durationMinutes={totalDuration}
                      />

                      {/* Proceed to checkout button */}
                      <TouchableOpacity
                        style={[
                          styles.proceedBtn,
                          {
                            backgroundColor: isSlotAvailable ? accentColor : isBarber ? '#22222B' : '#E5E7EB',
                            borderColor: isSlotAvailable ? accentColor : isBarber ? '#353545' : '#D1D5DB',
                            borderWidth: 1,
                            opacity: isSlotAvailable ? 1 : 0.65,
                          },
                        ]}
                        disabled={!isSlotAvailable}
                        onPress={() => handleOpenCheckout(s, false)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.proceedBtnText,
                            {
                              color: isSlotAvailable
                                ? (isBarber ? '#111827' : '#FFFFFF')
                                : (isBarber ? '#9CA3AF' : '#6B7280'),
                            },
                          ]}
                        >
                          {!isSalonOpenDay(selectedDate)
                            ? 'Salão Encerrado nesta Data'
                            : !hasSlots
                            ? 'Agenda Completa • Sem Vagas Disponíveis'
                            : !selectedTimeSlot
                            ? 'Selecione uma Vaga Disponível Acima'
                            : `Finalizar Marcação com ${s.name} • ${selectedDate} às ${selectedTimeSlot} (${totalPrice.toFixed(2)} €)`}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  }
                />
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Booking Modal */}
      <BookingModal
        visible={bookingModalVisible}
        onClose={() => setBookingModalVisible(false)}
        branch={activeBranch}
        selectedServices={selectedServices}
        staff={getEffectiveStaff()}
        isNoPreference={isNoPreference}
        date={selectedDate}
        timeSlot={selectedTimeSlot}
        onConfirmBooking={handleConfirmBooking}
      />

      {/* Success Modal */}
      <BookingSuccessModal
        visible={!!confirmedBooking}
        appointment={confirmedBooking}
        onClose={() => {
          setConfirmedBooking(null);
          setCurrentStep(1);
          setSelectedServices([]);
          setSelectedStaff(null);
          setIsNoPreference(false);
          setSelectedTimeSlot('');
          onBackToHome();
        }}
      />
    </Animated.View>
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
    backgroundColor: '#FAF7F2',
  },
  /* Step Bar */
  stepBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  stepBarBarber: {
    backgroundColor: '#141419',
    borderBottomColor: '#272730',
  },
  stepBarBeauty: {
    backgroundColor: '#FAF7F0',
    borderBottomColor: '#E6D7B8',
  },
  stepTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  stepTabText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
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
  stepSubHint: {
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 17,
  },
  clearText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  selectedSectionContainer: {
    marginBottom: 14,
  },
  summaryPill: {
    padding: 10,
    borderRadius: 10,
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
    borderColor: '#E6D7B8',
  },
  categoryTabText: {
    fontSize: 12,
    fontWeight: '800',
  },
  /* Booking Summary Banner */
  bookingSummaryBanner: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
  },
  summaryBannerBarber: {
    backgroundColor: '#1A1A22',
    borderColor: '#2D2D3A',
  },
  summaryBannerBeauty: {
    backgroundColor: '#FAF7F0',
    borderColor: '#E6D7B8',
  },
  summaryBannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 2,
  },
  summaryBannerLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  summaryBannerValue: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
    marginLeft: 10,
  },
  proceedBtn: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  proceedBtnText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '900',
  },
});
