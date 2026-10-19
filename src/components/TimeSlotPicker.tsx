import React, { useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Appointment, SalonBranch, StaffMember } from '../types';
import { Theme } from '../constants/theme';

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
}

// Horários do salão: 09:00 às 12:00 e das 14:00 às 19:00 (Terça a Sábado)
export const MORNING_SLOTS = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];
export const AFTERNOON_SLOTS = ['14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'];
export const ALL_WORKING_SLOTS = [...MORNING_SLOTS, ...AFTERNOON_SLOTS];

export const isSalonOpenDay = (dateStr: string): boolean => {
  const d = new Date(dateStr + 'T00:00:00');
  const day = d.getDay(); // 0 = Domingo, 1 = Segunda
  return day !== 0 && day !== 1;
};

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

  // Check if a staff member is available for a given slot on selectedDate
  const isStaffAvailableForSlot = (staff: StaffMember, slot: string, date: string): boolean => {
    if (!isSalonOpenDay(date)) return false;

    // Check staff working hours and lunch break
    const start = staff.workingHours?.start || '09:00';
    const end = staff.workingHours?.end || '19:00';
    const lunchStart = staff.workingHours?.lunchStart || '12:00';
    const lunchEnd = staff.workingHours?.lunchEnd || '14:00';

    const isMorning = slot >= start && slot < lunchStart;
    const isAfternoon = slot >= lunchEnd && slot < end;

    if (!isMorning && !isAfternoon) {
      return false;
    }

    // Check existing appointments
    const hasApp = appointments.some(
      app =>
        app.status !== 'cancelled' &&
        app.date === date &&
        app.timeSlot === slot &&
        app.staffId === staff.id
    );

    return !hasApp;
  };

  // Find occupied slots for selected date
  const occupiedSlots = useMemo(() => {
    const occupiedSet = new Set<string>();

    if (!isCurrentDateOpen) {
      // Salão fechado neste dia (Domingo ou Segunda)
      ALL_WORKING_SLOTS.forEach(slot => occupiedSet.add(slot));
      return occupiedSet;
    }

    ALL_WORKING_SLOTS.forEach(slot => {
      if (isNoPreference) {
        // Sem preferência: ocupado apenas se nenhum staff estiver livre
        const hasFreeStaff = branchStaff.some(s => isStaffAvailableForSlot(s, slot, selectedDate));
        if (!hasFreeStaff) {
          occupiedSet.add(slot);
        }
      } else if (staffMember) {
        // Profissional específico
        if (!isStaffAvailableForSlot(staffMember, slot, selectedDate)) {
          occupiedSet.add(slot);
        }
      } else {
        const hasFreeStaff = branchStaff.some(s => isStaffAvailableForSlot(s, slot, selectedDate));
        if (!hasFreeStaff) {
          occupiedSet.add(slot);
        }
      }
    });

    return occupiedSet;
  }, [ALL_WORKING_SLOTS, isCurrentDateOpen, isNoPreference, branchStaff, staffMember, appointments, selectedDate]);

  // If selected slot is occupied, auto-pick first available
  useEffect(() => {
    if (occupiedSlots.has(selectedTimeSlot)) {
      const firstFree = ALL_WORKING_SLOTS.find(slot => !occupiedSlots.has(slot));
      if (firstFree) {
        onSelectTimeSlot(firstFree);
      }
    }
  }, [occupiedSlots, selectedDate, staffMember, isNoPreference]);

  return (
    <View style={styles.container}>
      <View style={styles.headerInfoRow}>
        <Text style={[styles.sectionTitle, { color: isBarber ? '#F3F4F6' : '#111827' }]}>
          Escolha a Data
        </Text>
        <Text style={[styles.scheduleBadge, { color: accentColor }]}>
          Terça a Sábado: 09:00-12:00 e 14:00-19:00
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
          {/* Section: Manhã (09:00 - 12:00) */}
          <View style={styles.shiftSection}>
            <View style={styles.shiftHeaderRow}>
              <Text style={[styles.shiftTitle, { color: isBarber ? '#F3F4F6' : '#111827' }]}>
                Manhã (09:00 às 12:00)
              </Text>
              <Text style={[styles.shiftHint, { color: isBarber ? '#9CA3AF' : '#6B7280' }]}>
                {isNoPreference
                  ? 'Vagas disponíveis com qualquer profissional'
                  : staffMember
                  ? `Vagas de ${staffMember.name}`
                  : 'Vagas'}
              </Text>
            </View>

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
          </View>

          {/* Pause / Lunch Notice */}
          <View style={styles.lunchNoticeRow}>
            <Text style={[styles.lunchNoticeText, { color: isBarber ? '#71717A' : '#9CA3AF' }]}>
              Pausa de Almoço: 12:00 às 14:00
            </Text>
          </View>

          {/* Section: Tarde (14:00 - 19:00) */}
          <View style={styles.shiftSection}>
            <View style={styles.shiftHeaderRow}>
              <Text style={[styles.shiftTitle, { color: isBarber ? '#F3F4F6' : '#111827' }]}>
                Tarde (14:00 às 19:00)
              </Text>
            </View>

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
  headerInfoRow: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  scheduleBadge: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
    letterSpacing: 0.3,
  },
  dateScroll: {
    marginBottom: 12,
  },
  dateCard: {
    width: 68,
    height: 76,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
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
    fontSize: 20,
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
  lunchNoticeRow: {
    paddingVertical: 6,
    alignItems: 'center',
    marginBottom: 10,
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
