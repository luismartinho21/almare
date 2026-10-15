import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { StaffMember, SalonBranch } from '../types';
import { Theme } from '../constants/theme';

interface StaffCardProps {
  staff: StaffMember;
  isSelected?: boolean;
  onSelect: (staff: StaffMember) => void;
  branch: SalonBranch;
}

export const StaffCard: React.FC<StaffCardProps> = ({ staff, isSelected, onSelect, branch }) => {
  const isBarber = branch === 'barber';
  const accentColor = isBarber ? Theme.colors.barber.accent : Theme.colors.beauty.accent;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isBarber ? styles.cardBarber : styles.cardBeauty,
        isSelected && { borderColor: accentColor, borderWidth: 2 },
      ]}
      onPress={() => onSelect(staff)}
      activeOpacity={0.8}
    >
      <Image source={{ uri: staff.avatar }} style={styles.avatar} />

      <View style={styles.info}>
        <Text style={[styles.name, { color: isBarber ? '#F3F4F6' : '#111827' }]}>{staff.name}</Text>
        <Text style={[styles.role, { color: accentColor }]}>{staff.roleTitle}</Text>

        <View style={styles.specialtiesRow}>
          {staff.specialties.slice(0, 2).map((spec, i) => (
            <View key={i} style={[styles.tag, { backgroundColor: isBarber ? '#27272A' : '#FCE7F3' }]}>
              <Text style={[styles.tagText, { color: isBarber ? '#D4D4D8' : '#9D174D' }]}>
                {spec}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.rightSection}>
        <Text style={styles.ratingText}>⭐ {staff.rating.toFixed(1)}</Text>
        <View
          style={[
            styles.selectRadio,
            isSelected && { backgroundColor: accentColor, borderColor: accentColor },
          ]}
        >
          {isSelected && <Text style={styles.radioCheck}>✓</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  cardBarber: {
    backgroundColor: '#1E1E24',
    borderColor: '#30303D',
  },
  cardBeauty: {
    backgroundColor: '#FFFFFF',
    borderColor: '#F3E8FF',
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginRight: 12,
    backgroundColor: '#333',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
  },
  role: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  specialtiesRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 6,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 50,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F59E0B',
  },
  selectRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCheck: {
    color: '#111',
    fontSize: 12,
    fontWeight: '900',
  },
});
