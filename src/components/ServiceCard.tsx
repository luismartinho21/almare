import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Service, SalonBranch } from '../types';
import { Theme } from '../constants/theme';

interface ServiceCardProps {
  service: Service;
  isSelected?: boolean;
  onToggleSelect: (service: Service) => void;
  branch: SalonBranch;
  availableExtras?: Service[];
  selectedExtras?: Service[];
  onToggleExtra?: (extra: Service) => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  isSelected,
  onToggleSelect,
  branch,
  availableExtras,
  selectedExtras = [],
  onToggleExtra,
}) => {
  const isBarber = branch === 'barber';
  const accentColor = isBarber ? Theme.colors.barber.accent : Theme.colors.beauty.accent;
  const [isDropdownOpen, setIsDropdownOpen] = useState(true);

  // Auto-open dropdown menu whenever service becomes selected
  useEffect(() => {
    if (isSelected) {
      setIsDropdownOpen(true);
    }
  }, [isSelected]);

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
        onPress={() => onToggleSelect(service)}
        activeOpacity={0.8}
      >
        <View style={styles.headerRow}>
          <View style={styles.titleArea}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.category, { color: accentColor }]}>
                {service.category.toUpperCase()}
              </Text>
              <Text style={[styles.name, { color: isBarber ? '#FFF' : '#111827' }]}>
                {service.name}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.priceTag,
              { backgroundColor: isBarber ? '#27272A' : '#F7F2E7' },
            ]}
          >
            <Text
              style={[
                styles.priceText,
                { color: isBarber ? Theme.colors.barber.accent : Theme.colors.beauty.badge },
              ]}
            >
              {service.price.toFixed(2)} €
            </Text>
          </View>
        </View>

        <Text style={[styles.description, { color: isBarber ? '#A1A1AA' : '#6B7280' }]}>
          {service.description}
        </Text>

        <View style={styles.footerRow}>
          <Text style={[styles.duration, { color: isBarber ? '#A1A1AA' : '#6B7280' }]}>
            {service.durationMinutes} min
          </Text>
          <TouchableOpacity
            style={[
              styles.selectBtn,
              {
                backgroundColor: isSelected
                  ? accentColor
                  : isBarber
                  ? '#27272A'
                  : '#F5E6B8',
                borderWidth: isSelected || isBarber ? 0 : 1,
                borderColor: '#D4AF37',
              },
            ]}
            onPress={() => onToggleSelect(service)}
          >
            <Text
              style={[
                styles.selectBtnText,
                {
                  color: isSelected
                    ? '#111'
                    : isBarber
                    ? '#F4F4F5'
                    : '#1F2937',
                },
              ]}
            >
              {isSelected ? '✓ Selecionado' : '+ Adicionar'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* MENU DROP-DOWN DE EXTRAS (aparece imediatamente abaixo quando o serviço é selecionado) */}
      {isSelected && availableExtras && availableExtras.length > 0 && onToggleExtra && (
        <View style={styles.extrasContainer}>
          <View style={styles.extrasDivider} />

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
                Extras Disponíveis ({availableExtras.length})
              </Text>
            </View>

            <View style={styles.dropdownHeaderRight}>
              {selectedExtras.length > 0 && (
                <View style={[styles.extraBadgeSelected, { backgroundColor: accentColor }]}>
                  <Text style={[styles.extraBadgeSelectedText, { color: isBarber ? '#000' : '#FFF' }]}>
                    ✓ {selectedExtras.length}
                  </Text>
                </View>
              )}
              <Text style={[styles.dropdownHint, { color: accentColor }]}>
                {isDropdownOpen ? 'Recolher ▲' : 'Ver Extras ▼'}
              </Text>
            </View>
          </TouchableOpacity>

          {isDropdownOpen && (
            <View style={styles.dropdownContent}>
              <Text style={[styles.dropdownSubtitle, { color: isBarber ? '#A1A1AA' : '#6B7280' }]}>
                Selecione extras para associar a este serviço:
              </Text>
              {availableExtras.map(extra => {
                const isExtraSelected = selectedExtras.some(e => e.id === extra.id);
                return (
                  <TouchableOpacity
                    key={extra.id}
                    style={[
                      styles.extraRow,
                      {
                        backgroundColor: isExtraSelected
                          ? (isBarber ? '#36342E' : '#FFF3D6')
                          : (isBarber ? '#202027' : '#FDFCFA'),
                        borderColor: isExtraSelected ? accentColor : (isBarber ? '#2E2E38' : '#E8E3D5'),
                      },
                    ]}
                    onPress={() => onToggleExtra(extra)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.extraCheckCircle,
                        isExtraSelected && {
                          backgroundColor: accentColor,
                          borderColor: accentColor,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.extraCheckText,
                          { color: isExtraSelected ? (isBarber ? '#000' : '#FFF') : '#9CA3AF' },
                        ]}
                      >
                        {isExtraSelected ? '✓' : '+'}
                      </Text>
                    </View>
                    <View style={{ flex: 1, marginHorizontal: 8 }}>
                      <Text style={[styles.extraName, { color: isBarber ? '#F3F4F6' : '#1F2937' }]}>
                        {extra.name}
                      </Text>
                      {extra.description ? (
                        <Text style={[styles.extraDesc, { color: isBarber ? '#9CA3AF' : '#6B7280' }]}>
                          {extra.description}
                        </Text>
                      ) : null}
                      <Text style={[styles.extraDuration, { color: isBarber ? '#71717A' : '#9CA3AF' }]}>
                        +{extra.durationMinutes} min
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.extraPriceBadge,
                        {
                          backgroundColor: isExtraSelected
                            ? accentColor
                            : (isBarber ? '#2D2D36' : '#EDE8DC'),
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.extraPriceText,
                          { color: isExtraSelected ? (isBarber ? '#000' : '#FFF') : accentColor },
                        ]}
                      >
                        +{extra.price.toFixed(2)} €
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
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
    backgroundColor: '#1C1C22',
    borderColor: '#2D2D38',
  },
  cardBeauty: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5DCBA',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleArea: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  category: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  priceTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priceText: {
    fontSize: 15,
    fontWeight: '800',
  },
  description: {
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  duration: {
    fontSize: 12,
    fontWeight: '600',
  },
  selectBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  selectBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  /* ── ABA DE EXTRAS / MENU DROP-DOWN ── */
  extrasContainer: {
    marginTop: 12,
    paddingTop: 8,
  },
  extrasDivider: {
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
  extraBadgeSelected: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  extraBadgeSelectedText: {
    fontSize: 10,
    fontWeight: '900',
  },
  dropdownContent: {
    marginTop: 4,
  },
  dropdownSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 2,
  },
  extraRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  extraCheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#9CA3AF',
  },
  extraCheckText: {
    fontSize: 13,
    fontWeight: '900',
  },
  extraName: {
    fontSize: 13,
    fontWeight: '700',
  },
  extraDesc: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  extraDuration: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  extraPriceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  extraPriceText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
