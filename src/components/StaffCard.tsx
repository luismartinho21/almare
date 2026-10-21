import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { StaffMember, SalonBranch } from '../types';
import { Theme } from '../constants/theme';

interface StaffCardProps {
  staff?: StaffMember;
  isNoPreference?: boolean;
  isSelected?: boolean;
  onSelect: () => void;
  branch: SalonBranch;
  scheduleNode?: React.ReactNode;
  selectedScheduleLabel?: string;
}

export const StaffCard: React.FC<StaffCardProps> = ({
  staff,
  isNoPreference,
  isSelected,
  onSelect,
  branch,
  scheduleNode,
  selectedScheduleLabel,
}) => {
  const isBarber = branch === 'barber';
  const accentColor = isBarber ? Theme.colors.barber.accent : Theme.colors.beauty.accent;
  const [isDropdownOpen, setIsDropdownOpen] = useState(true);

  // Auto-open dropdown menu whenever staff card becomes selected
  useEffect(() => {
    if (isSelected) {
      setIsDropdownOpen(true);
    }
  }, [isSelected]);

  const targetName = isNoPreference ? 'Sem preferência' : staff?.name || 'Profissional';
  const dropdownTitle = isNoPreference
    ? 'Horários Disponíveis (Equipa Completa)'
    : `Horários de ${staff?.name}`;

  return (
    <View
      style={[
        styles.card,
        isBarber ? styles.cardBarber : styles.cardBeauty,
        isSelected && {
          borderColor: accentColor,
          borderWidth: 2,
          backgroundColor: isBarber ? '#272730' : '#FFFDF5',
        },
      ]}
    >
      <TouchableOpacity
        onPress={onSelect}
        activeOpacity={0.8}
        style={styles.cardHeaderArea}
      >
        <View style={styles.info}>
          <Text style={[styles.name, { color: isBarber ? '#F3F4F6' : '#111827' }]}>
            {targetName}
          </Text>
          <Text style={[styles.role, { color: accentColor }]}>
            {isNoPreference ? 'Qualquer profissional disponível' : staff?.roleTitle}
          </Text>
          <Text style={[styles.desc, { color: isBarber ? '#9CA3AF' : '#6B7280' }]}>
            {isNoPreference
              ? 'Apresenta as vagas de todos os profissionais da equipa'
              : staff?.specialties && staff.specialties.length > 0
              ? staff.specialties.join(' • ')
              : 'Profissional de excelência'}
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

      {/* DROPDOWN DE HORÁRIOS E DISPONIBILIDADE (ESTILO IDÊNTICO AOS EXTRAS) */}
      {isSelected && scheduleNode && (
        <View style={styles.scheduleContainer}>
          <View style={styles.scheduleDivider} />

          <TouchableOpacity
            style={[
              styles.dropdownHeader,
              {
                backgroundColor: isBarber ? '#1E1E26' : '#FAF6EC',
                borderColor: accentColor,
              },
            ]}
            onPress={() => setIsDropdownOpen(prev => !prev)}
            activeOpacity={0.7}
          >
            <View style={styles.dropdownHeaderLeft}>
              <Text style={[styles.dropdownChevron, { color: accentColor }]}>
                {isDropdownOpen ? '▼' : '▶'}
              </Text>
              <Text style={[styles.dropdownHeaderTitle, { color: isBarber ? '#FFF' : '#1F2937' }]}>
                {dropdownTitle}
              </Text>
            </View>

            <View style={styles.dropdownHeaderRight}>
              {selectedScheduleLabel ? (
                <View style={[styles.scheduleBadgeSelected, { backgroundColor: accentColor }]}>
                  <Text style={[styles.scheduleBadgeSelectedText, { color: isBarber ? '#000' : '#FFF' }]}>
                    ✓ {selectedScheduleLabel}
                  </Text>
                </View>
              ) : null}
              <Text style={[styles.dropdownHint, { color: accentColor }]}>
                {isDropdownOpen ? 'Recolher ▲' : 'Ver Horários ▼'}
              </Text>
            </View>
          </TouchableOpacity>

          {isDropdownOpen && (
            <View style={styles.dropdownContent}>
              {scheduleNode}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardBarber: {
    backgroundColor: '#1E1E24',
    borderColor: '#30303D',
  },
  cardBeauty: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5DCBA',
  },
  cardHeaderArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  /* ── ABA DE HORÁRIOS / MENU DROP-DOWN ── */
  scheduleContainer: {
    marginTop: 12,
    paddingTop: 8,
  },
  scheduleDivider: {
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.25)',
    marginBottom: 10,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  dropdownHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdownChevron: {
    fontSize: 12,
    fontWeight: '900',
    marginRight: 8,
  },
  dropdownHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  dropdownHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownHint: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 6,
  },
  scheduleBadgeSelected: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  scheduleBadgeSelectedText: {
    fontSize: 10,
    fontWeight: '900',
  },
  dropdownContent: {
    marginTop: 4,
  },
});
