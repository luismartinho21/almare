import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { StaffMember, SalonBranch } from '../types';
import { Theme } from '../constants/theme';

interface StaffCardProps {
  staff?: StaffMember;
  isNoPreference?: boolean;
  isSelected?: boolean;
  onSelect: () => void;
  branch: SalonBranch;
}

export const StaffCard: React.FC<StaffCardProps> = ({
  staff,
  isNoPreference,
  isSelected,
  onSelect,
  branch,
}) => {
  const isBarber = branch === 'barber';
  const accentColor = isBarber ? Theme.colors.barber.accent : Theme.colors.beauty.accent;

  if (isNoPreference) {
    return (
      <TouchableOpacity
        style={[
          styles.card,
          isBarber ? styles.cardBarber : styles.cardBeauty,
          isSelected && { borderColor: accentColor, borderWidth: 2 },
        ]}
        onPress={onSelect}
        activeOpacity={0.8}
      >
        <View style={styles.info}>
          <Text style={[styles.name, { color: isBarber ? '#F3F4F6' : '#111827' }]}>
            Sem preferência
          </Text>
          <Text style={[styles.role, { color: accentColor }]}>
            Qualquer profissional disponível
          </Text>
          <Text style={[styles.desc, { color: isBarber ? '#9CA3AF' : '#6B7280' }]}>
            Apresenta os horários disponíveis de todos os profissionais da equipa
          </Text>
        </View>

        <View style={styles.rightSection}>
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
  }

  if (!staff) return null;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isBarber ? styles.cardBarber : styles.cardBeauty,
        isSelected && { borderColor: accentColor, borderWidth: 2 },
      ]}
      onPress={onSelect}
      activeOpacity={0.8}
    >
      <View style={styles.info}>
        <Text style={[styles.name, { color: isBarber ? '#F3F4F6' : '#111827' }]}>
          {staff.name}
        </Text>
        <Text style={[styles.role, { color: accentColor }]}>
          {staff.roleTitle}
        </Text>

        {staff.specialties && staff.specialties.length > 0 && (
          <View style={styles.specialtiesRow}>
            {staff.specialties.map((spec, i) => (
              <View
                key={i}
                style={[
                  styles.tag,
                  { backgroundColor: isBarber ? '#27272A' : '#F7F2E7' },
                ]}
              >
                <Text
                  style={[
                    styles.tagText,
                    { color: isBarber ? '#D4D4D8' : '#78350F' },
                  ]}
                >
                  {spec}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.rightSection}>
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
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  cardBarber: {
    backgroundColor: '#1E1E24',
    borderColor: '#30303D',
  },
  cardBeauty: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5DCBA',
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  role: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  desc: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
  specialtiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  rightSection: {
    alignItems: 'center',
    justifyContent: 'center',
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
