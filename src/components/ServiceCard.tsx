import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Service, SalonBranch } from '../types';
import { Theme } from '../constants/theme';

interface ServiceCardProps {
  service: Service;
  isSelected?: boolean;
  onToggleSelect: (service: Service) => void;
  branch: SalonBranch;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  isSelected,
  onToggleSelect,
  branch,
}) => {
  const isBarber = branch === 'barber';
  const accentColor = isBarber ? Theme.colors.barber.accent : Theme.colors.beauty.accent;

  const getCategoryIcon = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'cortes':
      case 'cabelo':
        return '✂️';
      case 'barba':
        return '🪒';
      case 'coloração':
        return '🎨';
      case 'estética':
      case 'tratamentos':
        return '✨';
      case 'unhas':
        return '💅';
      case 'combos':
        return '👑';
      default:
        return '💈';
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isBarber ? styles.cardBarber : styles.cardBeauty,
        isSelected && { borderColor: accentColor, borderWidth: 2, backgroundColor: isBarber ? '#272730' : '#FFF0F5' },
      ]}
      onPress={() => onToggleSelect(service)}
      activeOpacity={0.8}
    >
      <View style={styles.headerRow}>
        <View style={styles.titleArea}>
          <Text style={styles.icon}>{getCategoryIcon(service.category)}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.category, { color: accentColor }]}>
              {service.category.toUpperCase()}
            </Text>
            <Text style={[styles.name, { color: isBarber ? '#FFF' : '#111827' }]}>{service.name}</Text>
          </View>
        </View>

        <View style={[styles.priceTag, { backgroundColor: isBarber ? '#27272A' : '#FCE7F3' }]}>
          <Text style={[styles.priceText, { color: isBarber ? Theme.colors.barber.accent : Theme.colors.beauty.badge }]}>
            {service.price.toFixed(2)} €
          </Text>
        </View>
      </View>

      <Text style={[styles.description, { color: isBarber ? '#A1A1AA' : '#6B7280' }]}>
        {service.description}
      </Text>

      <View style={styles.footerRow}>
        <Text style={[styles.duration, { color: isBarber ? '#A1A1AA' : '#6B7280' }]}>
          ⏱️ {service.durationMinutes} min
        </Text>
        <TouchableOpacity
          style={[
            styles.selectBtn,
            { backgroundColor: isSelected ? accentColor : isBarber ? '#27272A' : Theme.colors.beauty.primary },
          ]}
          onPress={() => onToggleSelect(service)}
        >
          <Text style={[styles.selectBtnText, { color: isSelected || !isBarber ? (isSelected ? '#111' : '#FFF') : '#F4F4F5' }]}>
            {isSelected ? '✓ Selecionado' : '+ Adicionar'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
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
    backgroundColor: '#FFF8FA',
    borderColor: '#FBCFE8',
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
  icon: {
    fontSize: 24,
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
});
