import React from 'react';
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
                  : Theme.colors.beauty.primary,
              },
            ]}
            onPress={() => onToggleSelect(service)}
          >
            <Text
              style={[
                styles.selectBtnText,
                {
                  color:
                    isSelected || !isBarber
                      ? isSelected
                        ? '#111'
                        : '#FFF'
                      : '#F4F4F5',
                },
              ]}
            >
              {isSelected ? '✓ Selecionado' : '+ Adicionar'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* ABA DE EXTRAS (aparece quando o serviço é selecionado) */}
      {isSelected && availableExtras && availableExtras.length > 0 && onToggleExtra && (
        <View style={styles.extrasContainer}>
          <View style={styles.extrasDivider} />
          <Text style={[styles.extrasHeaderTitle, { color: accentColor }]}>
            EXTRAS DISPONÍVEIS (OPCIONAL):
          </Text>
          {availableExtras.map(extra => {
            const isExtraSelected = selectedExtras.some(e => e.id === extra.id);
            return (
              <TouchableOpacity
                key={extra.id}
                style={[
                  styles.extraRow,
                  isExtraSelected && {
                    backgroundColor: isBarber ? '#36342E' : '#FFF3D6',
                    borderColor: accentColor,
                  },
                ]}
                onPress={() => onToggleExtra(extra)}
                activeOpacity={0.7}
              >
                <View style={styles.extraCheckCircle}>
                  <Text
                    style={[
                      styles.extraCheckText,
                      { color: isExtraSelected ? accentColor : '#9CA3AF' },
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
                    <Text style={styles.extraDesc}>{extra.description}</Text>
                  ) : null}
                </View>
                <View style={styles.extraPriceBadge}>
                  <Text style={[styles.extraPriceText, { color: accentColor }]}>
                    +{extra.price.toFixed(2)} €
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
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
  /* ── ABA DE EXTRAS ── */
  extrasContainer: {
    marginTop: 12,
    paddingTop: 10,
  },
  extrasDivider: {
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.25)',
    marginBottom: 10,
  },
  extrasHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  extraRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: 6,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  extraCheckCircle: {
    width: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  extraCheckText: {
    fontSize: 15,
    fontWeight: '900',
  },
  extraName: {
    fontSize: 13,
    fontWeight: '700',
  },
  extraDesc: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 1,
  },
  extraPriceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  extraPriceText: {
    fontSize: 12,
    fontWeight: '800',
  },
});
