import React, { useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Appointment, SalonBranch, StaffMember } from '../types';
import { Theme } from '../constants/theme';
import {
  MORNING_SLOTS,
  AFTERNOON_SLOTS,
  ALL_WORKING_SLOTS,
  isSalonOpenDay,
  getOccupiedSlots,
  timeToMinutes,
  minutesToTime,
  getStaffShiftType,
  getStaffAbsenceInfoForDate,
} from '../utils/scheduleHelper';

// Re-exportar para retrocompatibilidade
export { MORNING_SLOTS, AFTERNOON_SLOTS, ALL_WORKING_SLOTS, isSalonOpenDay };

interface TimeSlotPickerProps {
  branch: SalonBranch;
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  selectedTimeSlot: string; // HH:MM
  onSelectTimeSlot: (slot: string) => void;
  staffMember?: StaffMember | null;
  isNoPreference?: boolean;
  branchStaff: StaffMember[];
  appointments: Appointment[];
  durationMinutes?: number;
}

export const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  branch,
  selectedDate,
  onSelectDate,
  selectedTimeSlot,
  onSelectTimeSlot,
  staffMember,
  isNoPreference = false,
  branchStaff,
  appointments,
  durationMinutes = 30,
}) => {
  const isBarber = branch === 'barber';
  const accentColor = isBarber ? Theme.colors.barber.accent : Theme.colors.beauty.accent;

  // Generate next 10 days
  const nextDays = useMemo(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 10; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);

      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const fullStr = `${yyyy}-${mm}-${dd}`;

      const dayOfWeek = d.getDay();
      const isOpen = dayOfWeek !== 0 && dayOfWeek !== 1; // Terça a Sábado

      const weekDay = d.toLocaleDateString('pt-PT', { weekday: 'short' });
      const dayNum = d.getDate();
      const monthStr = d.toLocaleDateString('pt-PT', { month: 'short' });

      dates.push({
        fullStr,
        weekDay: weekDay.toUpperCase().replace('.', ''),
        dayNum,
        monthStr: monthStr.replace('.', ''),
        isToday: i === 0,
        isOpen,
      });
    }
    return dates;
  }, []);

  const isCurrentDateOpen = useMemo(() => {
    return isSalonOpenDay(selectedDate);
  }, [selectedDate]);

  // Find occupied slots for selected date considering accumulated service duration
  const occupiedSlots = useMemo(() => {
    return getOccupiedSlots({
      date: selectedDate,
      durationMinutes,
      staffMember,
      isNoPreference,
      branchStaff,
      appointments,
    });
  }, [selectedDate, durationMinutes, staffMember, isNoPreference, branchStaff, appointments]);

  const availableSlots = useMemo(() => {
    if (!isCurrentDateOpen) return [];
    return ALL_WORKING_SLOTS.filter(slot => !occupiedSlots.has(slot));
  }, [isCurrentDateOpen, occupiedSlots]);

  const isAllOccupied = isCurrentDateOpen && availableSlots.length === 0;

  // Se o salão estiver fechado ou todos os horários estiverem ocupados (agenda completa), limpa o slot.
  // Caso contrário, se o slot atual for nulo/vazio ou estiver ocupado, seleciona a primeira vaga verdadeiramente livre.
  useEffect(() => {
    if (!isCurrentDateOpen || availableSlots.length === 0) {
      if (selectedTimeSlot !== '') {
        onSelectTimeSlot('');
      }
      return;
    }

    if (!selectedTimeSlot || occupiedSlots.has(selectedTimeSlot)) {
      onSelectTimeSlot(availableSlots[0]);
    }
  }, [isCurrentDateOpen, availableSlots, occupiedSlots, selectedDate, staffMember, isNoPreference]);

  // Calculate ending time for the selected slot based on accumulated duration
  const slotEndTime = useMemo(() => {
    if (!selectedTimeSlot) return '';
    const startMins = timeToMinutes(selectedTimeSlot);
    return minutesToTime(startMins + durationMinutes);
  }, [selectedTimeSlot, durationMinutes]);

  const targetStaffName = isNoPreference
    ? 'Qualquer profissional disponível'
    : staffMember?.name || 'Profissional';

  const shiftType = useMemo(() => {
    if (!staffMember) return 'all_day';
    return getStaffShiftType(staffMember);
  }, [staffMember]);

  const absenceInfo = useMemo(() => {
    if (!staffMember) return null;
    return getStaffAbsenceInfoForDate(staffMember, selectedDate);
  }, [staffMember, selectedDate]);

  return (
    <View style={styles.container}>
      {/* Target Staff & Accumulated Duration Banner */}
      <View style={[styles.durationBanner, isBarber ? styles.durationBannerBarber : styles.durationBannerBeauty]}>
        <View style={styles.durationBannerHeader}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={[styles.durationBannerStaff, { color: accentColor }]}>
              {targetStaffName.toUpperCase()}
            </Text>
            {!isNoPreference && staffMember && (
              <Text style={{ fontSize: 11, fontWeight: '700', marginTop: 2, color: isBarber ? '#E5E7EB' : '#374151' }}>
                {absenceInfo?.isAbsent ? (
                  <Text style={{ color: '#EF4444', fontWeight: '900' }}>
                    ✕ TEMPORARIAMENTE INDISPONÍVEL
                  </Text>
                ) : shiftType === 'morning_only' ? (
                  <Text style={{ color: isBarber ? '#FBBF24' : '#D97706', fontWeight: '800' }}>
                    TURNO: APENAS MANHÃ ({staffMember.workingHours?.start || '09:00'} ÀS {staffMember.workingHours?.end || '12:00'})
                  </Text>
                ) : shiftType === 'afternoon_only' ? (
                  <Text style={{ color: isBarber ? '#60A5FA' : '#2563EB', fontWeight: '800' }}>
                    TURNO: APENAS TARDE ({staffMember.workingHours?.start || '14:00'} ÀS {staffMember.workingHours?.end || '19:00'})
                  </Text>
                ) : (
                  <Text style={{ color: isBarber ? '#A1A1AA' : '#6B7280' }}>
                    TURNO: MANHÃ E TARDE (09:00 ÀS 19:00)
                  </Text>
                )}
              </Text>
            )}
          </View>

          <View style={[styles.durationBadge, { backgroundColor: accentColor }]}>
            <Text style={styles.durationBadgeText}>{durationMinutes} MIN ACUMULADOS</Text>
          </View>
        </View>

        <Text style={[styles.durationBannerSub, { color: isBarber ? '#D1D5DB' : '#4B5563' }]}>
          {selectedTimeSlot && !occupiedSlots.has(selectedTimeSlot) ? (
            <>
              Horário selecionado:{' '}
              <Text style={{ fontWeight: '800', color: accentColor }}>
                {selectedTimeSlot} às {slotEndTime}
              </Text>{' '}
              ({durationMinutes} min contínuos de atendimento)
            </>
          ) : (
            <Text
              style={{
                color: isAllOccupied || !isCurrentDateOpen ? '#EF4444' : isBarber ? '#D1D5DB' : '#4B5563',
                fontWeight: '700',
              }}
            >
              {!isCurrentDateOpen
                ? 'Salão encerrado nesta data'
                : absenceInfo?.isAbsent
                ? `Profissional temporariamente ausente (${absenceInfo.label})`
                : isAllOccupied
                ? 'Agenda Completa • Sem vagas livres nesta data'
                : `Selecione uma vaga disponível abaixo (${durationMinutes} min contínuos)`}
            </Text>
          )}
        </Text>
      </View>

      <View style={styles.headerInfoRow}>
        <Text style={[styles.sectionTitle, { color: isBarber ? '#F3F4F6' : '#111827' }]}>
          1. Escolha a Data
        </Text>
        <Text style={[styles.scheduleBadge, { color: accentColor }]}>
          Ter a Sáb: 09:00-12:00 e 14:00-19:00
        </Text>
      </View>

      {/* Date Horizontal Picker */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
        {nextDays.map(item => {
          const isSelected = selectedDate === item.fullStr;
          return (
            <TouchableOpacity
              key={item.fullStr}
              style={[
                styles.dateCard,
                isBarber ? styles.dateCardBarber : styles.dateCardBeauty,
                !item.isOpen && styles.dateCardClosed,
                isSelected && { backgroundColor: accentColor, borderColor: accentColor },
              ]}
              onPress={() => onSelectDate(item.fullStr)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.dateWeekDay,
                  {
                    color: isSelected
                      ? '#111'
                      : !item.isOpen
                      ? '#EF4444'
                      : isBarber
                      ? '#A1A1AA'
                      : '#6B7280',
                  },
                ]}
              >
                {item.isToday ? 'HOJE' : item.weekDay}
              </Text>
              <Text
                style={[
                  styles.dateDayNum,
                  {
                    color: isSelected
                      ? '#111'
                      : !item.isOpen
                      ? '#71717A'
                      : isBarber
                      ? '#FFFFFF'
                      : '#1F2937',
                  },
                ]}
              >
                {item.dayNum}
              </Text>
              <Text
                style={[
                  styles.dateMonth,
                  { color: isSelected ? '#111' : isBarber ? '#71717A' : '#9CA3AF' },
                ]}
              >
                {item.isOpen ? item.monthStr : 'Fechado'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* When salon is closed on selected date */}
      {!isCurrentDateOpen ? (
        <View style={[styles.closedNoticeBox, isBarber ? styles.closedBoxBarber : styles.closedBoxBeauty]}>
          <Text style={styles.closedNoticeTitle}>Salão Encerrado nesta data</Text>
          <Text style={styles.closedNoticeSub}>
            O salão encontra-se aberto de Terça a Sábado, das 09:00 às 12:00 e das 14:00 às 19:00.
            Por favor, selecione uma data de Terça a Sábado acima.
          </Text>
        </View>
      ) : (
        <>
          {/* Se o profissional estiver temporariamente de baixa ou ausente nesta data */}
          {absenceInfo?.isAbsent ? (
            <View
              style={[
                styles.closedNoticeBox,
                isBarber ? styles.closedBoxBarber : styles.closedBoxBeauty,
                {
                  borderColor: '#EF4444',
                  marginBottom: 16,
                  backgroundColor: isBarber
                    ? 'rgba(239, 68, 68, 0.12)'
                    : '#FEF2F2',
                },
              ]}
            >
              <Text
                style={[
                  styles.closedNoticeTitle,
                  { color: '#EF4444' },
                ]}
              >
                ✕ Profissional Indisponível nesta data
              </Text>
              <Text style={[styles.closedNoticeSub, { color: isBarber ? '#F3F4F6' : '#1F2937', fontWeight: '800', marginTop: 4 }]}>
                {targetStaffName} encontra-se ausente nesta data.
              </Text>
              {absenceInfo.periodText ? (
                <Text style={[styles.closedNoticeSub, { color: isBarber ? '#E5E7EB' : '#1F2937', fontWeight: '700', marginTop: 4 }]}>
                  Duração da ausência: {absenceInfo.periodText}
                </Text>
              ) : null}
              {absenceInfo.returnDate ? (
                <Text style={[styles.closedNoticeSub, { color: isBarber ? '#FDE68A' : '#92400E', fontWeight: '900', marginTop: 3 }]}>
                  Previsão de regresso ao salão: {absenceInfo.returnDate}
                </Text>
              ) : null}
              <Text style={[styles.closedNoticeSub, { color: isBarber ? '#9CA3AF' : '#6B7280', marginTop: 8, fontStyle: 'italic' }]}>
                Dica: Selecione uma data a partir de {absenceInfo.returnDate || 'outra data'} no calendário acima ou escolha a opção &quot;Sem preferência&quot; para ser atendido por outro profissional da equipa.
              </Text>
            </View>
          ) : isAllOccupied ? (
            <View
              style={[
                styles.closedNoticeBox,
                isBarber ? styles.closedBoxBarber : styles.closedBoxBeauty,
                { borderColor: '#EF4444', marginBottom: 16, backgroundColor: isBarber ? '#2A1818' : '#FEF2F2' },
              ]}
            >
              <Text style={[styles.closedNoticeTitle, { color: '#EF4444' }]}>
                ⚠️ Agenda Completa nesta Data
              </Text>
              <Text style={[styles.closedNoticeSub, { color: isBarber ? '#FCA5A5' : '#991B1B' }]}>
                {isNoPreference
                  ? `Todos os profissionais da equipa estão ocupados ou sem vagas contínuas de ${durationMinutes} min nesta data.`
                  : `${targetStaffName} não tem vagas livres para ${durationMinutes} min no dia selecionado.`}
                {'\n\n'}Por favor, selecione outra data acima no calendário ou escolha outro profissional.
              </Text>
            </View>
          ) : null}

          {/* Section: Manhã (09:00 - 12:00) */}
          <View style={styles.shiftSection}>
            <View style={styles.shiftHeaderRow}>
              <Text style={[styles.shiftTitle, { color: isBarber ? '#F3F4F6' : '#111827' }]}>
                2. Manhã (09:00 às 12:00)
              </Text>
              {shiftType === 'afternoon_only' ? (
                <View style={[styles.shiftNoticeTag, { backgroundColor: isBarber ? 'rgba(59, 130, 246, 0.15)' : '#DBEAFE' }]}>
                  <Text style={[styles.shiftNoticeTagText, { color: isBarber ? '#60A5FA' : '#2563EB' }]}>
                    Turno da Tarde
                  </Text>
                </View>
              ) : (
                <Text style={[styles.shiftHint, { color: isBarber ? '#9CA3AF' : '#6B7280' }]}>
                  Vagas disponíveis para {durationMinutes} min
                </Text>
              )}
            </View>

            {shiftType === 'afternoon_only' ? (
              <View style={[styles.shiftOffNoticeBox, isBarber ? styles.shiftOffBarber : styles.shiftOffBeauty]}>
                <Text style={[styles.shiftOffNoticeText, { color: isBarber ? '#A1A1AA' : '#6B7280' }]}>
                  {targetStaffName} atende exclusivamente no período da tarde ({staffMember?.workingHours?.start || '14:00'} às {staffMember?.workingHours?.end || '19:00'}).
                </Text>
              </View>
            ) : (
              <View style={styles.slotsGrid}>
                {MORNING_SLOTS.map(slot => {
                  const isOccupied = occupiedSlots.has(slot);
                  const isSelected = selectedTimeSlot === slot;

                  return (
                    <TouchableOpacity
                      key={slot}
                      disabled={isOccupied}
                      style={[
                        styles.slotBtn,
                        isBarber ? styles.slotBtnBarber : styles.slotBtnBeauty,
                        isOccupied && styles.slotBtnOccupied,
                        isSelected && { backgroundColor: accentColor, borderColor: accentColor },
                      ]}
                      onPress={() => onSelectTimeSlot(slot)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.slotText,
                          { color: isSelected ? '#111' : isBarber ? '#F3F4F6' : '#111827' },
                          isOccupied && styles.slotTextOccupied,
                        ]}
                      >
                        {slot}
                      </Text>
                      {isOccupied && <Text style={styles.occupiedBadge}>Ocupado</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Pause / Lunch Notice (apenas exibido se o profissional trabalhar nos dois turnos) */}
          {shiftType === 'all_day' && (
            <View style={styles.lunchNoticeRow}>
              <Text style={[styles.lunchNoticeText, { color: isBarber ? '#71717A' : '#9CA3AF' }]}>
                Pausa de Almoço: 12:00 às 14:00
              </Text>
            </View>
          )}

          {/* Section: Tarde (14:00 - 19:00) */}
          <View style={styles.shiftSection}>
            <View style={styles.shiftHeaderRow}>
              <Text style={[styles.shiftTitle, { color: isBarber ? '#F3F4F6' : '#111827' }]}>
                3. Tarde (14:00 às 19:00)
              </Text>
              {shiftType === 'morning_only' ? (
                <View style={[styles.shiftNoticeTag, { backgroundColor: isBarber ? 'rgba(212, 175, 55, 0.15)' : '#FEF3C7' }]}>
                  <Text style={[styles.shiftNoticeTagText, { color: isBarber ? '#FBBF24' : '#D97706' }]}>
                    Turno da Manhã
                  </Text>
                </View>
              ) : (
                <Text style={[styles.shiftHint, { color: isBarber ? '#9CA3AF' : '#6B7280' }]}>
                  Vagas disponíveis para {durationMinutes} min
                </Text>
              )}
            </View>

            {shiftType === 'morning_only' ? (
              <View style={[styles.shiftOffNoticeBox, isBarber ? styles.shiftOffBarber : styles.shiftOffBeauty]}>
                <Text style={[styles.shiftOffNoticeText, { color: isBarber ? '#A1A1AA' : '#6B7280' }]}>
                  {targetStaffName} atende exclusivamente no período da manhã ({staffMember?.workingHours?.start || '09:00'} às {staffMember?.workingHours?.end || '12:00'}).
                </Text>
              </View>
            ) : (
              <View style={styles.slotsGrid}>
                {AFTERNOON_SLOTS.map(slot => {
                  const isOccupied = occupiedSlots.has(slot);
                  const isSelected = selectedTimeSlot === slot;

                  return (
                    <TouchableOpacity
                      key={slot}
                      disabled={isOccupied}
                      style={[
                        styles.slotBtn,
                        isBarber ? styles.slotBtnBarber : styles.slotBtnBeauty,
                        isOccupied && styles.slotBtnOccupied,
                        isSelected && { backgroundColor: accentColor, borderColor: accentColor },
                      ]}
                      onPress={() => onSelectTimeSlot(slot)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.slotText,
                          { color: isSelected ? '#111' : isBarber ? '#F3F4F6' : '#111827' },
                          isOccupied && styles.slotTextOccupied,
                        ]}
                      >
                        {slot}
                      </Text>
                      {isOccupied && <Text style={styles.occupiedBadge}>Ocupado</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  durationBanner: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
  },
  durationBannerBarber: {
    backgroundColor: '#18181F',
    borderColor: '#2D2D38',
  },
  durationBannerBeauty: {
    backgroundColor: '#F5EFE6',
    borderColor: '#DFD2C0',
  },
  durationBannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  durationBannerStaff: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  durationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  durationBadgeText: {
    color: '#111827',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  durationBannerSub: {
    fontSize: 12,
    lineHeight: 16,
  },
  headerInfoRow: {
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  scheduleBadge: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  dateScroll: {
    marginBottom: 12,
  },
  dateCard: {
    width: 66,
    height: 74,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1,
  },
  dateCardBarber: {
    backgroundColor: '#1C1C22',
    borderColor: '#2E2E3A',
  },
  dateCardBeauty: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  dateCardClosed: {
    opacity: 0.6,
  },
  dateWeekDay: {
    fontSize: 10,
    fontWeight: '800',
  },
  dateDayNum: {
    fontSize: 19,
    fontWeight: '900',
    marginVertical: 1,
  },
  dateMonth: {
    fontSize: 10,
    fontWeight: '600',
  },
  closedNoticeBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 10,
    alignItems: 'center',
  },
  closedBoxBarber: {
    backgroundColor: '#1C1C22',
    borderColor: '#3F3F46',
  },
  closedBoxBeauty: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FCE7F3',
  },
  closedNoticeTitle: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  closedNoticeSub: {
    color: '#9CA3AF',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  shiftSection: {
    marginBottom: 10,
  },
  shiftHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  shiftTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  shiftHint: {
    fontSize: 11,
  },
  shiftNoticeTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  shiftNoticeTagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  shiftOffNoticeBox: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shiftOffBarber: {
    backgroundColor: '#18181D',
    borderColor: '#2E2E3A',
  },
  shiftOffBeauty: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  shiftOffNoticeText: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  lunchNoticeRow: {
    paddingVertical: 4,
    alignItems: 'center',
    marginBottom: 8,
  },
  lunchNoticeText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  slotBtn: {
    width: '31%',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
  },
  slotBtnBarber: {
    backgroundColor: '#1E1E24',
    borderColor: '#30303D',
  },
  slotBtnBeauty: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  slotBtnOccupied: {
    backgroundColor: '#262626',
    borderColor: '#3F3F46',
    opacity: 0.45,
  },
  slotText: {
    fontSize: 14,
    fontWeight: '700',
  },
  slotTextOccupied: {
    color: '#71717A',
    textDecorationLine: 'line-through',
  },
  occupiedBadge: {
    fontSize: 8,
    color: '#EF4444',
    fontWeight: '800',
    marginTop: 2,
  },
});
