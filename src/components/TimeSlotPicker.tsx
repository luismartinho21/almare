import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Appointment, SalonBranch, StaffMember } from '../types';
import { Theme } from '../constants/theme';

interface TimeSlotPickerProps {
  branch: SalonBranch;
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  selectedTimeSlot: string; // HH:MM
  onSelectTimeSlot: (slot: string) => void;
  staffMember?: StaffMember;
  appointments: Appointment[];
}

export const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  branch,
  selectedDate,
  onSelectDate,
  selectedTimeSlot,
  onSelectTimeSlot,
  staffMember,
  appointments,
}) => {
  const isBarber = branch === 'barber';
  const accentColor = isBarber ? Theme.colors.barber.accent : Theme.colors.beauty.accent;

  // Generate next 7 available dates
  const nextDays = useMemo(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);

      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const fullStr = `${yyyy}-${mm}-${dd}`;

      const weekDay = d.toLocaleDateString('pt-PT', { weekday: 'short' });
      const dayNum = d.getDate();
      const monthStr = d.toLocaleDateString('pt-PT', { month: 'short' });

      dates.push({
        fullStr,
        weekDay: weekDay.toUpperCase(),
        dayNum,
        monthStr,
        isToday: i === 0,
      });
    }
    return dates;
  }, []);

  // Standard time slots: 09:30 to 19:30 every 30 minutes
  const allTimeSlots = [
    '09:30', '10:00', '10:30', '11:00', '11:30', '12:00',
    '12:30', '14:00', '14:30', '15:00', '15:30', '16:00',
    '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  ];

  // Find occupied slots for selected date & staff
  const occupiedSlots = useMemo(() => {
    const occupiedSet = new Set<string>();
    appointments.forEach(app => {
      if (app.date === selectedDate && app.status !== 'cancelled') {
        if (!staffMember || app.staffId === staffMember.id) {
          occupiedSet.add(app.timeSlot);
        }
      }
    });
    return occupiedSet;
  }, [appointments, selectedDate, staffMember]);

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: isBarber ? '#F3F4F6' : '#111827' }]}>
        📅 1. Escolha a Data
      </Text>

      {/* Date Horizontal Picker */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
        {nextDays.map((item) => {
          const isSelected = selectedDate === item.fullStr;
          return (
            <TouchableOpacity
              key={item.fullStr}
              style={[
                styles.dateCard,
                isBarber ? styles.dateCardBarber : styles.dateCardBeauty,
                isSelected && { backgroundColor: accentColor, borderColor: accentColor },
              ]}
              onPress={() => onSelectDate(item.fullStr)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.dateWeekDay,
                  { color: isSelected ? '#111' : isBarber ? '#A1A1AA' : '#6B7280' },
                ]}
              >
                {item.isToday ? 'HOJE' : item.weekDay}
              </Text>
              <Text
                style={[
                  styles.dateDayNum,
                  { color: isSelected ? '#111' : isBarber ? '#FFFFFF' : '#1F2937' },
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
                {item.monthStr}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Time Slot Matrix */}
      <Text style={[styles.sectionTitle, { color: isBarber ? '#F3F4F6' : '#111827', marginTop: 16 }]}>
        ⏰ 2. Escolha o Horário Disponível
      </Text>

      <View style={styles.slotsGrid}>
        {allTimeSlots.map((slot) => {
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
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 10,
  },
  dateScroll: {
    marginBottom: 8,
  },
  dateCard: {
    width: 64,
    height: 74,
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
    opacity: 0.5,
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
