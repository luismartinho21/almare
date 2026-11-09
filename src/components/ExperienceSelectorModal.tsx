import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { Service, SalonBranch, BookingExperienceSelection, ExperienceRestaurant, ExperienceMenuItem } from '../types';
import { Theme } from '../constants/theme';

interface ExperienceSelectorModalProps {
  visible: boolean;
  service: Service | null;
  branch: SalonBranch;
  currentSelection?: BookingExperienceSelection | null;
  onConfirm: (selection: BookingExperienceSelection) => void;
  onClose: () => void;
}

export const ExperienceSelectorModal: React.FC<ExperienceSelectorModalProps> = ({
  visible,
  service,
  branch,
  currentSelection,
  onConfirm,
  onClose,
}) => {
  const isBarber = branch === 'barber';
  const accentColor = isBarber ? Theme.colors.barber.accent : Theme.colors.beauty.accent;

  const restaurants: ExperienceRestaurant[] = service?.experienceConfig?.restaurants || [];

  const [selectedRestId, setSelectedRestId] = useState<string>('');
  const [selectedMenuId, setSelectedMenuId] = useState<string>('');

  useEffect(() => {
    if (visible && service) {
      if (currentSelection && currentSelection.serviceId === service.id) {
        setSelectedRestId(currentSelection.restaurantId);
        setSelectedMenuId(currentSelection.menuId);
      } else {
        // Default to first restaurant if none selected
        if (restaurants.length > 0 && !selectedRestId) {
          setSelectedRestId(restaurants[0].id);
          setSelectedMenuId(restaurants[0].menus[0]?.id || '');
        }
      }
    }
  }, [visible, service, currentSelection]);

  if (!visible || !service || !service.experienceConfig?.enabled) return null;

  const activeRestaurant = restaurants.find(r => r.id === selectedRestId);
  const activeMenu = activeRestaurant?.menus.find(m => m.id === selectedMenuId);

  const handleSelectRestaurant = (rest: ExperienceRestaurant) => {
    setSelectedRestId(rest.id);
    // If current selected menu doesn't belong to this restaurant, default to its first menu
    const hasSameMenu = rest.menus.some(m => m.id === selectedMenuId);
    if (!hasSameMenu) {
      setSelectedMenuId(rest.menus[0]?.id || '');
    }
  };

  const handleConfirm = () => {
    if (!activeRestaurant || !activeMenu) return;
    onConfirm({
      serviceId: service.id,
      restaurantId: activeRestaurant.id,
      restaurantName: activeRestaurant.name,
      menuId: activeMenu.id,
      menuName: activeMenu.name,
      notes: `${activeRestaurant.name} • ${activeMenu.name}`,
    });
  };

  const isComplete = !!(activeRestaurant && activeMenu);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[
            styles.modalContainer,
            isBarber ? styles.modalBarber : styles.modalBeauty,
          ]}
          onPress={e => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <View style={[styles.badgePill, { backgroundColor: isBarber ? '#2D2D38' : '#F5E6B8' }]}>
                <Text style={[styles.badgePillText, { color: accentColor }]}>
                  ✨ EXPERIÊNCIA EXCLUSIVA ALMARE
                </Text>
              </View>
              <Text style={[styles.title, { color: isBarber ? '#FFF' : '#111827' }]}>
                {service.name}
              </Text>
              <Text style={[styles.subtitle, { color: isBarber ? '#A1A1AA' : '#6B7280' }]}>
                {service.experienceConfig.instruction ||
                  'Para avançar, selecione 1 de 3 restaurantes parceiros e o menu que mais aprecia:'}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={[styles.closeBtnText, { color: isBarber ? '#9CA3AF' : '#6B7280' }]}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.bodyScroll} showsVerticalScrollIndicator={false}>
            {/* ETAPA 1: ESCOLHER RESTAURANTE */}
            <View style={styles.stepSection}>
              <View style={styles.stepTitleRow}>
                <View style={[styles.stepNumberBadge, { backgroundColor: accentColor }]}>
                  <Text style={[styles.stepNumberText, { color: isBarber ? '#000' : '#FFF' }]}>1</Text>
                </View>
                <Text style={[styles.stepTitle, { color: isBarber ? '#F3F4F6' : '#1F2937' }]}>
                  Escolha 1 de 3 Restaurantes Parceiros *
                </Text>
              </View>

              <View style={styles.restaurantsGrid}>
                {restaurants.map((rest, idx) => {
                  const isSelected = rest.id === selectedRestId;
                  return (
                    <TouchableOpacity
                      key={rest.id}
                      style={[
                        styles.restCard,
                        isBarber ? styles.restCardBarber : styles.restCardBeauty,
                        isSelected && {
                          borderColor: accentColor,
                          borderWidth: 2,
                          backgroundColor: isBarber ? '#2C2B36' : '#FFF9EC',
                        },
                      ]}
                      onPress={() => handleSelectRestaurant(rest)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.restCardHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.restTag, { color: accentColor }]}>
                            OPÇÃO {idx + 1} • {rest.cuisine.toUpperCase()}
                          </Text>
                          <Text style={[styles.restName, { color: isBarber ? '#FFF' : '#111827' }]}>
                            {rest.name}
                          </Text>
                          <Text style={[styles.restLocation, { color: isBarber ? '#9CA3AF' : '#6B7280' }]}>
                            📍 {rest.location}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.radioCircle,
                            isSelected && { backgroundColor: accentColor, borderColor: accentColor },
                          ]}
                        >
                          {isSelected && <Text style={styles.radioCheck}>✓</Text>}
                        </View>
                      </View>
                      <Text style={[styles.restDesc, { color: isBarber ? '#D4D4D8' : '#4B5563' }]}>
                        {rest.description}
                      </Text>
                      <View style={styles.restCardFooter}>
                        <Text style={[styles.menusAvailableCount, { color: accentColor }]}>
                          🍽️ {rest.menus.length} Menus disponíveis para escolha
                        </Text>
                        <Text style={[styles.selectStatusText, { color: isSelected ? accentColor : (isBarber ? '#71717A' : '#9CA3AF') }]}>
                          {isSelected ? '✓ Selecionado' : 'Tocar para Escolher'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* ETAPA 2: ESCOLHER MENU DO RESTAURANTE */}
            <View style={[styles.stepSection, { marginTop: 16 }]}>
              <View style={styles.stepTitleRow}>
                <View style={[styles.stepNumberBadge, { backgroundColor: accentColor }]}>
                  <Text style={[styles.stepNumberText, { color: isBarber ? '#000' : '#FFF' }]}>2</Text>
                </View>
                <Text style={[styles.stepTitle, { color: isBarber ? '#F3F4F6' : '#1F2937' }]}>
                  Escolha o Menu Pretendido *
                </Text>
              </View>

              {!activeRestaurant ? (
                <View style={[styles.placeholderBox, { borderColor: isBarber ? '#333' : '#E5E7EB' }]}>
                  <Text style={[styles.placeholderText, { color: isBarber ? '#9CA3AF' : '#6B7280' }]}>
                    👉 Selecione primeiro um restaurante acima para desbloquear as opções de menu.
                  </Text>
                </View>
              ) : (
                <View>
                  <Text style={[styles.activeRestNotice, { color: isBarber ? '#D4AF37' : Theme.colors.beauty.badge }]}>
                    A apresentar os menus de: <Text style={{ fontWeight: '800' }}>{activeRestaurant.name}</Text>
                  </Text>
                  <View style={styles.menusList}>
                    {activeRestaurant.menus.map((menu, mIdx) => {
                      const isMenuSelected = menu.id === selectedMenuId;
                      return (
                        <TouchableOpacity
                          key={menu.id}
                          style={[
                            styles.menuCard,
                            isBarber ? styles.menuCardBarber : styles.menuCardBeauty,
                            isMenuSelected && {
                              borderColor: accentColor,
                              borderWidth: 2,
                              backgroundColor: isBarber ? '#32313D' : '#FFF7E6',
                            },
                          ]}
                          onPress={() => setSelectedMenuId(menu.id)}
                          activeOpacity={0.8}
                        >
                          <View style={styles.menuHeaderRow}>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.menuPillLabel, { color: accentColor }]}>
                                MENU {mIdx + 1}
                              </Text>
                              <Text style={[styles.menuTitle, { color: isBarber ? '#FFF' : '#111827' }]}>
                                {menu.name}
                              </Text>
                            </View>
                            <View
                              style={[
                                styles.radioCircle,
                                isMenuSelected && { backgroundColor: accentColor, borderColor: accentColor },
                              ]}
                            >
                              {isMenuSelected && <Text style={styles.radioCheck}>✓</Text>}
                            </View>
                          </View>
                          <Text style={[styles.menuDesc, { color: isBarber ? '#E4E4E7' : '#374151' }]}>
                            {menu.description}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Footer with Confirm Button */}
          <View style={[styles.footer, isBarber ? styles.footerBarber : styles.footerBeauty]}>
            <View style={styles.summaryLine}>
              <Text style={[styles.summaryLabel, { color: isBarber ? '#9CA3AF' : '#6B7280' }]}>
                Seleção Atual:
              </Text>
              <Text
                style={[styles.summaryValue, { color: accentColor }]}
                numberOfLines={1}
              >
                {activeRestaurant ? activeRestaurant.name.split('•')[0].trim() : 'Nenhum'} •{' '}
                {activeMenu ? activeMenu.name : 'Sem menu'}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.confirmBtn,
                {
                  backgroundColor: isComplete ? accentColor : (isBarber ? '#2C2C36' : '#E5E7EB'),
                  borderColor: isComplete ? accentColor : (isBarber ? '#3D3D4E' : '#D1D5DB'),
                  opacity: isComplete ? 1 : 0.65,
                },
              ]}
              disabled={!isComplete}
              onPress={handleConfirm}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.confirmBtnText,
                  { color: isComplete ? (isBarber ? '#000' : '#111') : (isBarber ? '#9CA3AF' : '#6B7280') },
                ]}
              >
                {isComplete
                  ? '✓ Confirmar Restaurante & Menu da Experiência'
                  : 'Selecione Restaurante e Menu para Confirmar'}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 620,
    maxHeight: '92%',
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  modalBarber: {
    backgroundColor: '#191922',
    borderColor: '#383848',
  },
  modalBeauty: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E8DCB8',
  },
  header: {
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 175, 55, 0.2)',
  },
  badgePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
  },
  closeBtnText: {
    fontSize: 18,
    fontWeight: '700',
  },
  bodyScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  stepSection: {
    marginBottom: 8,
  },
  stepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  stepNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '900',
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  restaurantsGrid: {
    gap: 10,
  },
  restCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  restCardBarber: {
    backgroundColor: '#21212B',
    borderColor: '#2E2E3C',
  },
  restCardBeauty: {
    backgroundColor: '#FAF7F0',
    borderColor: '#EAE1CF',
  },
  restCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  restTag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  restName: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  restLocation: {
    fontSize: 11,
    marginTop: 2,
  },
  restDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
  },
  restCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.15)',
    paddingTop: 6,
  },
  menusAvailableCount: {
    fontSize: 11,
    fontWeight: '700',
  },
  selectStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  radioCheck: {
    fontSize: 12,
    fontWeight: '900',
    color: '#000',
  },
  placeholderBox: {
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  activeRestNotice: {
    fontSize: 12,
    marginBottom: 8,
  },
  menusList: {
    gap: 8,
  },
  menuCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  menuCardBarber: {
    backgroundColor: '#22222E',
    borderColor: '#2F2F40',
  },
  menuCardBeauty: {
    backgroundColor: '#FAF8F2',
    borderColor: '#EAE3D2',
  },
  menuHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  menuPillLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 1,
  },
  menuDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.2)',
  },
  footerBarber: {
    backgroundColor: '#191922',
  },
  footerBeauty: {
    backgroundColor: '#FFFFFF',
  },
  summaryLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: '800',
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  confirmBtn: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
