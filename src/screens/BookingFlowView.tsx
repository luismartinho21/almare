import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
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

type BookingStep = 1 | 2 | 3;

export const BookingFlowView: React.FC<BookingFlowViewProps> = ({ onBackToHome }) => {
  const { activeBranch, services, staff, appointments, createAppointment } = useApp();

  const isBarber = activeBranch === 'barber';
  const accentColor = isBarber ? Theme.colors.barber.accent : Theme.colors.beauty.accent;

  // Current Step in the booking flow:
  // 1: Serviços -> 2: Profissional (Staff / Sem preferência) -> 3: Agendamento (Data & Horário)
  const [currentStep, setCurrentStep] = useState<BookingStep>(1);

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
  const [isExtrasExpanded, setIsExtrasExpanded] = useState<boolean>(false);

  // Staff selection state:
  // Can be a specific staff member OR "sem preferência"
  const branchStaff = useMemo(() => {
    return staff.filter(s => s.branch === activeBranch);
  }, [staff, activeBranch]);

  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [isNoPreference, setIsNoPreference] = useState<boolean>(true);

  // Toggle service selection
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

  const selectedExtrasCount = useMemo(() => {
    return selectedServices.filter(s => s.category.toLowerCase() === 'extras').length;
  }, [selectedServices]);

  const totalPrice = useMemo(() => {
    return selectedServices.reduce((sum, s) => sum + s.price, 0);
  }, [selectedServices]);

  const totalDuration = useMemo(() => {
    return selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0);
  }, [selectedServices]);

  // Dates & Time
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('11:00');

  // Modals
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Appointment | null>(null);

  const filteredServices = useMemo(() => {
    if (selectedCategory === 'TODOS') return regularServices;
    return regularServices.filter(s => s.category === selectedCategory);
  }, [regularServices, selectedCategory]);

  // Helper: Find free staff members for a specific slot on selectedDate
  const getFreeStaffForSlot = (slot: string, date: string): StaffMember[] => {
    return branchStaff.filter(s => {
      if (s.workingHours && (slot < s.workingHours.start || slot >= s.workingHours.end)) {
        return false;
      }
      const hasApp = appointments.some(
        a =>
          a.status !== 'cancelled' &&
          a.date === date &&
          a.timeSlot === slot &&
          a.staffId === s.id
      );
      return !hasApp;
    });
  };

  // Determine effective staff for checkout
  const getEffectiveStaff = (): StaffMember => {
    if (!isNoPreference && selectedStaff) {
      return selectedStaff;
    }
    const freeList = getFreeStaffForSlot(selectedTimeSlot, selectedDate);
    return freeList[0] || branchStaff[0];
  };

  const handleOpenCheckout = () => {
    if (selectedServices.length === 0) {
      alert('Por favor, selecione pelo menos um serviço.');
      return;
    }
    setBookingModalVisible(true);
  };

  const handleConfirmBooking = async (clientName: string, clientPhone: string, notes?: string) => {
    const effectiveStaff = getEffectiveStaff();
    if (selectedServices.length === 0 || !effectiveStaff) return;

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

  const handleBack = () => {
    if (currentStep === 3) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(1);
    } else {
      onBackToHome();
    }
  };

  return (
    <View style={[styles.container, isBarber ? styles.bgBarber : styles.bgBeauty]}>
      {/* Top Header: logo centrado tocável */}
      <TouchableOpacity style={styles.topLogoHeader} onPress={handleBack} activeOpacity={0.9}>
        <Image
          source={require('../../assets/logo.jpg')}
          style={styles.topLogoImg}
          resizeMode="contain"
        />
      </TouchableOpacity>

      {/* Step Indicator Bar */}
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
            {currentStep > 2 ? '✓ ' : ''}2. Profissional
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.stepTab,
            currentStep === 3 && { borderBottomColor: accentColor, borderBottomWidth: 2 },
          ]}
          onPress={() => {
            if (selectedServices.length > 0) setCurrentStep(3);
          }}
          disabled={selectedServices.length === 0}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.stepTabText,
              {
                color:
                  currentStep === 3
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
            3. Horário
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
              <Text style={[styles.stepHeader, { color: isBarber ? '#F3F4F6' : '#111827' }]}>
                1. Selecione os Serviços
              </Text>
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
                    ✓ {selectedServices.length}{' '}
                    {selectedServices.length === 1 ? 'Serviço Selecionado' : 'Serviços Selecionados'}:{' '}
                    <Text style={{ fontWeight: '900' }}>{totalPrice.toFixed(2)} €</Text> ({totalDuration} min)
                  </Text>
                </View>

                {/* Extras Accordion */}
                {extraServices.length > 0 && (
                  <View
                    style={[
                      styles.extrasAccordion,
                      isBarber ? styles.extrasAccordionBarber : styles.extrasAccordionBeauty,
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.extrasAccordionHeader}
                      onPress={() => setIsExtrasExpanded(prev => !prev)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.extrasHeaderLeft}>
                        <View>
                          <Text style={[styles.extrasHeaderTitle, { color: isBarber ? '#F3F4F6' : '#1F2937' }]}>
                            Adicionar Extras (Opcional)
                          </Text>
                          <Text style={styles.extrasHeaderSub}>
                            {selectedExtrasCount > 0
                              ? `${selectedExtrasCount} extra(s) adicionado(s)`
                              : 'Toque para ver tratamentos e cuidados extra'}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.extrasHeaderRight}>
                        {selectedExtrasCount > 0 && (
                          <View style={[styles.extrasBadge, { backgroundColor: accentColor }]}>
                            <Text style={styles.extrasBadgeText}>+{selectedExtrasCount}</Text>
                          </View>
                        )}
                        <Text style={[styles.extrasChevron, { color: accentColor }]}>
                          {isExtrasExpanded ? '▲' : '▼'}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* Dropdown Content */}
                    {isExtrasExpanded && (
                      <View style={styles.extrasDropdownBody}>
                        <Text style={styles.extrasInfoHint}>
                          Selecione extras para complementar o seu serviço:
                        </Text>

                        {extraServices.map(extra => {
                          const isExtraSelected = selectedServices.some(s => s.id === extra.id);
                          return (
                            <TouchableOpacity
                              key={extra.id}
                              style={[
                                styles.extraRowItem,
                                isExtraSelected && {
                                  backgroundColor: isBarber ? 'rgba(212, 175, 55, 0.15)' : '#FCE7F3',
                                  borderColor: accentColor,
                                },
                              ]}
                              onPress={() => handleToggleService(extra)}
                              activeOpacity={0.7}
                            >
                              <View style={styles.extraRowInfo}>
                                <Text style={[styles.extraRowName, { color: isBarber ? '#FFFFFF' : '#111827' }]}>
                                  {extra.name}
                                </Text>
                                <Text style={styles.extraRowDesc} numberOfLines={2}>
                                  {extra.description}
                                </Text>
                                <Text style={styles.extraRowDuration}>
                                  +{extra.durationMinutes} min
                                </Text>
                              </View>

                              <View style={styles.extraRowAction}>
                                <Text style={[styles.extraRowPrice, { color: accentColor }]}>
                                  +{extra.price.toFixed(2)} €
                                </Text>
                                <View
                                  style={[
                                    styles.extraCheckCircle,
                                    isExtraSelected && { backgroundColor: accentColor, borderColor: accentColor },
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.extraCheckText,
                                      { color: isExtraSelected ? '#111' : isBarber ? '#71717A' : '#9CA3AF' },
                                    ]}
                                  >
                                    {isExtraSelected ? '✓' : '+'}
                                  </Text>
                                </View>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>
                )}
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
                  ? `Continuar para Escolha do Profissional • ${totalPrice.toFixed(2)} €`
                  : 'Selecione 1 ou mais Serviços para Continuar'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ============================================================ */}
        {/* STEP 2: SELECIONE O PROFISSIONAL (STAFF) */}
        {/* ============================================================ */}
        {currentStep === 2 && (
          <View>
            <View style={styles.sectionTitleRow}>
              <Text style={[styles.stepHeader, { color: isBarber ? '#F3F4F6' : '#111827' }]}>
                2. Selecione o Profissional
              </Text>
              <TouchableOpacity onPress={() => setCurrentStep(1)}>
                <Text style={[styles.backStepText, { color: accentColor }]}>Voltar a Serviços</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.stepSubHint, { color: isBarber ? '#9CA3AF' : '#6B7280' }]}>
              Escolha quem irá realizar o seu atendimento ou selecione sem preferência para ver todas as vagas disponíveis.
            </Text>

            {/* Option 1: Sem preferência */}
            <StaffCard
              isNoPreference={true}
              branch={activeBranch}
              isSelected={isNoPreference}
              onSelect={() => {
                setIsNoPreference(true);
                setSelectedStaff(null);
                setCurrentStep(3);
              }}
            />

            {/* Option 2..N: Branch Staff Members */}
            {branchStaff.map(s => (
              <StaffCard
                key={s.id}
                staff={s}
                branch={activeBranch}
                isSelected={!isNoPreference && selectedStaff?.id === s.id}
                onSelect={() => {
                  setSelectedStaff(s);
                  setIsNoPreference(false);
                  setCurrentStep(3);
                }}
              />
            ))}

            {/* Proceed Button */}
            <TouchableOpacity
              style={[styles.proceedBtn, { backgroundColor: accentColor }]}
              onPress={() => setCurrentStep(3)}
              activeOpacity={0.8}
            >
              <Text style={styles.proceedBtnText}>
                Continuar para Data e Horário →
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ============================================================ */}
        {/* STEP 3: AGENDAMENTO POSSÍVEL (DATA E HORÁRIO) */}
        {/* ============================================================ */}
        {currentStep === 3 && (
          <View>
            <View style={styles.sectionTitleRow}>
              <Text style={[styles.stepHeader, { color: isBarber ? '#F3F4F6' : '#111827' }]}>
                3. Data e Horário Disponível
              </Text>
              <TouchableOpacity onPress={() => setCurrentStep(2)}>
                <Text style={[styles.backStepText, { color: accentColor }]}>Mudar Profissional</Text>
              </TouchableOpacity>
            </View>

            {/* Current Summary Banner */}
            <View
              style={[
                styles.bookingSummaryBanner,
                isBarber ? styles.summaryBannerBarber : styles.summaryBannerBeauty,
              ]}
            >
              <View style={styles.summaryBannerRow}>
                <Text style={[styles.summaryBannerLabel, { color: accentColor }]}>SERVIÇOS:</Text>
                <Text
                  style={[styles.summaryBannerValue, { color: isBarber ? '#FFFFFF' : '#111827' }]}
                  numberOfLines={1}
                >
                  {selectedServices.map(s => s.name).join(' + ')}
                </Text>
              </View>

              <View style={styles.summaryBannerRow}>
                <Text style={[styles.summaryBannerLabel, { color: accentColor }]}>PROFISSIONAL:</Text>
                <Text style={[styles.summaryBannerValue, { color: isBarber ? '#FFFFFF' : '#111827' }]}>
                  {isNoPreference
                    ? 'Sem preferência (Qualquer profissional disponível)'
                    : selectedStaff?.name || 'Profissional da equipa'}
                </Text>
              </View>

              <View style={styles.summaryBannerRow}>
                <Text style={[styles.summaryBannerLabel, { color: accentColor }]}>TOTAL:</Text>
                <Text style={[styles.summaryBannerValue, { color: isBarber ? '#FFFFFF' : '#111827' }]}>
                  {totalPrice.toFixed(2)} € ({totalDuration} min)
                </Text>
              </View>
            </View>

            {/* TimeSlotPicker */}
            <TimeSlotPicker
              branch={activeBranch}
              selectedDate={selectedDate}
              onSelectDate={d => setSelectedDate(d)}
              selectedTimeSlot={selectedTimeSlot}
              onSelectTimeSlot={ts => setSelectedTimeSlot(ts)}
              staffMember={isNoPreference ? null : selectedStaff}
              isNoPreference={isNoPreference}
              branchStaff={branchStaff}
              appointments={appointments}
            />

            {/* Checkout CTA Button */}
            <TouchableOpacity
              style={[styles.proceedBtn, { backgroundColor: accentColor }]}
              onPress={handleOpenCheckout}
              activeOpacity={0.8}
            >
              <Text style={styles.proceedBtnText}>
                Finalizar Marcação • {selectedDate} às {selectedTimeSlot}
              </Text>
            </TouchableOpacity>
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
          onBackToHome();
        }}
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
    backgroundColor: '#FAF7F2',
  },
  topLogoHeader: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D0D11',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#22222A',
  },
  topLogoImg: {
    width: 140,
    height: 90,
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
    fontSize: 12,
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
  backStepText: {
    fontSize: 12,
    fontWeight: '700',
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
  /* Accordion / Extras Tray */
  extrasAccordion: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  extrasAccordionBarber: {
    backgroundColor: '#18181E',
    borderColor: '#3F3F46',
  },
  extrasAccordionBeauty: {
    backgroundColor: '#FAF7F0',
    borderColor: '#E6D7B8',
  },
  extrasAccordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  extrasHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  extrasHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  extrasHeaderSub: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 1,
  },
  extrasHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  extrasBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
  },
  extrasBadgeText: {
    color: '#111',
    fontSize: 11,
    fontWeight: '900',
  },
  extrasChevron: {
    fontSize: 12,
    fontWeight: '900',
  },
  extrasDropdownBody: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    padding: 12,
  },
  extrasInfoHint: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  extraRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  extraRowInfo: {
    flex: 1,
    marginRight: 10,
  },
  extraRowName: {
    fontSize: 13,
    fontWeight: '700',
  },
  extraRowDesc: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
    lineHeight: 15,
  },
  extraRowDuration: {
    fontSize: 10,
    color: '#71717A',
    marginTop: 4,
  },
  extraRowAction: {
    alignItems: 'flex-end',
  },
  extraRowPrice: {
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 4,
  },
  extraCheckCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#71717A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  extraCheckText: {
    fontSize: 12,
    fontWeight: '900',
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
    marginBottom: 12,
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
