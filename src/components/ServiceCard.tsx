import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Service, SalonBranch, BookingExperienceSelection } from '../types';
import { Theme } from '../constants/theme';

interface ServiceCardProps {
  service: Service;
  isSelected?: boolean;
  onToggleSelect: (service: Service) => void;
  branch: SalonBranch;
  availableExtras?: Service[];
  selectedExtras?: Service[];
  onToggleExtra?: (extra: Service) => void;
  experienceSelection?: BookingExperienceSelection | null;
  onOpenExperienceSelector?: (service: Service) => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  isSelected,
  onToggleSelect,
  branch,
  availableExtras,
  selectedExtras = [],
  onToggleExtra,
  experienceSelection,
  onOpenExperienceSelector,
}) => {
  const isBarber = branch === 'barber';
  const accentColor = isBarber ? Theme.colors.barber.accent : Theme.colors.beauty.accent;
  const isExperience = !!(service.experienceConfig?.enabled);
  const [isDropdownOpen, setIsDropdownOpen] = useState(true);
  const [showServiceDetails, setShowServiceDetails] = useState(false);
  const [expandedExtraIds, setExpandedExtraIds] = useState<string[]>([]);

  const toggleExtraExpanded = (extraId: string) => {
    setExpandedExtraIds(prev =>
      prev.includes(extraId) ? prev.filter(id => id !== extraId) : [...prev, extraId]
    );
  };

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
        {isExperience && (
          <View style={[styles.experienceTagBadge, { backgroundColor: isBarber ? '#2B2515' : '#FEF3C7', borderColor: accentColor }]}>
            <Text style={[styles.experienceTagBadgeText, { color: accentColor }]}>
              ✨ {service.experienceConfig?.title ? service.experienceConfig.title.toUpperCase() : 'EXPERIÊNCIA EXCLUSIVA • RESTAURANTE & MENU'}
            </Text>
          </View>
        )}

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

        <View style={styles.actionRowMiddle}>
          <Text
            style={[styles.description, { color: isBarber ? '#A1A1AA' : '#6B7280' }]}
            numberOfLines={showServiceDetails ? undefined : 2}
          >
            {service.description || 'Serviço personalizado com foco na excelência e bem-estar Almare.'}
          </Text>

          {/* Botão Saber Mais do Serviço Principal */}
          <TouchableOpacity
            style={[
              styles.saberMaisBtn,
              {
                borderColor: showServiceDetails ? accentColor : (isBarber ? '#3F3F4E' : '#E5DEC9'),
                backgroundColor: showServiceDetails
                  ? (isBarber ? '#2C2B36' : '#FAF6EE')
                  : 'transparent',
              },
            ]}
            onPress={() => setShowServiceDetails(prev => !prev)}
            activeOpacity={0.7}
          >
            <Text style={[styles.saberMaisBtnText, { color: accentColor }]}>
              {showServiceDetails ? 'Ocultar detalhes ▲' : 'ℹ️ Saber mais ▼'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Caixa expandida de Saber Mais com descrição rica */}
        {showServiceDetails && (
          <View
            style={[
              styles.detailsBox,
              {
                backgroundColor: isBarber ? '#22222B' : '#FAF7F0',
                borderColor: isBarber ? '#353545' : '#E8E2D2',
              },
            ]}
          >
            <View style={styles.detailsHeader}>
              <Text style={[styles.detailsBadge, { color: accentColor }]}>
                ℹ️ O QUE ESTÁ INCLUÍDO NESTE SERVIÇO:
              </Text>
            </View>
            <Text style={[styles.detailsText, { color: isBarber ? '#E4E4E7' : '#374151' }]}>
              {service.longDescription || service.description || 'Procedimento realizado com os melhores produtos profissionais e atendimento minucioso de alta qualidade Almare.'}
            </Text>
            <View style={styles.detailsMetaRow}>
              <View style={[styles.detailsMetaPill, { backgroundColor: isBarber ? '#2D2D38' : '#EFE9DA' }]}>
                <Text style={[styles.detailsMetaPillText, { color: isBarber ? '#D4D4D8' : '#4B5563' }]}>
                  ⏱ {service.durationMinutes} minutos
                </Text>
              </View>
              <View style={[styles.detailsMetaPill, { backgroundColor: isBarber ? '#2D2D38' : '#EFE9DA' }]}>
                <Text style={[styles.detailsMetaPillText, { color: isBarber ? '#D4D4D8' : '#4B5563' }]}>
                  🏷 {service.category}
                </Text>
              </View>
              <View style={[styles.detailsMetaPill, { backgroundColor: isBarber ? '#2D2D38' : '#EFE9DA' }]}>
                <Text style={[styles.detailsMetaPillText, { color: accentColor, fontWeight: '800' }]}>
                  💳 {service.price.toFixed(2)} €
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Caixa de status da experiência romântica selecionada */}
        {isSelected && isExperience && (
          <View
            style={[
              styles.experienceStatusBox,
              {
                backgroundColor: isBarber ? '#22212B' : '#FFFDF5',
                borderColor: experienceSelection ? accentColor : '#F59E0B',
              },
            ]}
          >
            <View style={styles.experienceStatusHeader}>
              <Text style={[styles.experienceStatusTitle, { color: experienceSelection ? accentColor : '#F59E0B' }]}>
                {experienceSelection ? '✓ RESTAURANTE & MENU SELECIONADOS' : '⚠️ ESCOLHA OBRIGATÓRIA'}
              </Text>
              <TouchableOpacity
                style={[
                  styles.experienceActionBtn,
                  {
                    backgroundColor: experienceSelection ? (isBarber ? '#2C2B38' : '#FAF6EE') : accentColor,
                    borderColor: accentColor,
                  },
                ]}
                onPress={() => onOpenExperienceSelector?.(service)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.experienceActionBtnText,
                    { color: experienceSelection ? accentColor : (isBarber ? '#000' : '#111') },
                  ]}
                >
                  {experienceSelection ? 'Alterar ✏️' : 'Escolher Restaurante & Menu 🍽️'}
                </Text>
              </TouchableOpacity>
            </View>

            {experienceSelection ? (
              <View style={styles.experienceSelectedDetails}>
                <Text style={[styles.experienceSelectedText, { color: isBarber ? '#F4F4F5' : '#1F2937' }]}>
                  🍽️ <Text style={{ fontWeight: '800' }}>{experienceSelection.restaurantName}</Text>
                </Text>
                <Text style={[styles.experienceSelectedSub, { color: isBarber ? '#D4D4D8' : '#4B5563' }]}>
                  📋 <Text style={{ fontWeight: '700' }}>{experienceSelection.menuName}</Text>
                  {experienceSelection.priceSupplement && experienceSelection.priceSupplement > 0
                    ? ` (+${experienceSelection.priceSupplement.toFixed(2)} €)`
                    : ''}
                </Text>
              </View>
            ) : (
              <Text style={[styles.experienceWarningText, { color: isBarber ? '#FCA5A5' : '#B45309' }]}>
                Para concluir esta experiência, selecione 1 de {service.experienceConfig?.restaurants?.length || 1} restaurante(s) parceiro(s) e o menu pretendido.
              </Text>
            )}
          </View>
        )}

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
                const isExtraExpanded = expandedExtraIds.includes(extra.id);

                return (
                  <View key={extra.id} style={styles.extraItemWrapper}>
                    <TouchableOpacity
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
                          <Text
                            style={[styles.extraDesc, { color: isBarber ? '#9CA3AF' : '#6B7280' }]}
                            numberOfLines={1}
                          >
                            {extra.description}
                          </Text>
                        ) : null}
                        <Text style={[styles.extraDuration, { color: isBarber ? '#71717A' : '#9CA3AF' }]}>
                          +{extra.durationMinutes} min
                        </Text>
                      </View>

                      {/* Botão Saber Mais do Extra */}
                      <TouchableOpacity
                        style={[
                          styles.extraSaberMaisBtn,
                          {
                            borderColor: isExtraExpanded ? accentColor : (isBarber ? '#3F3F4E' : '#DFD7C4'),
                            backgroundColor: isExtraExpanded
                              ? (isBarber ? '#2D2D38' : '#F4EEE0')
                              : 'transparent',
                          },
                        ]}
                        onPress={() => toggleExtraExpanded(extra.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.extraSaberMaisText, { color: accentColor }]}>
                          {isExtraExpanded ? 'Ocultar ▲' : 'ℹ️ Saber mais'}
                        </Text>
                      </TouchableOpacity>

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

                    {/* Caixa de detalhes expandida do Extra */}
                    {isExtraExpanded && (
                      <View
                        style={[
                          styles.extraExpandedDetailsBox,
                          {
                            backgroundColor: isBarber ? '#1A1A22' : '#F8F4EA',
                            borderColor: isBarber ? '#30303D' : '#E2D9C2',
                          },
                        ]}
                      >
                        <Text style={[styles.extraExpandedHeader, { color: accentColor }]}>
                          ℹ️ SOBRE O EXTRA: {extra.name.toUpperCase()}
                        </Text>
                        <Text style={[styles.extraExpandedDesc, { color: isBarber ? '#D4D4D8' : '#374151' }]}>
                          {extra.longDescription || extra.description || 'Extra complementar de qualidade premium para potenciar e enriquecer o resultado do seu serviço.'}
                        </Text>
                        <View style={styles.extraExpandedMetaRow}>
                          <Text style={[styles.extraExpandedMetaText, { color: isBarber ? '#A1A1AA' : '#6B7280' }]}>
                            ⏱ Adiciona: +{extra.durationMinutes} minutos ao tempo total
                          </Text>
                          <Text style={[styles.extraExpandedMetaText, { color: accentColor, fontWeight: '700' }]}>
                            • Valor adicional: +{extra.price.toFixed(2)} €
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
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
    lineHeight: 18,
    flex: 1,
    marginRight: 8,
  },
  actionRowMiddle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 2,
    flexWrap: 'wrap',
    gap: 6,
  },
  saberMaisBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  saberMaisBtnText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  detailsBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailsBadge: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  detailsText: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
  },
  detailsMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  detailsMetaPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  detailsMetaPillText: {
    fontSize: 11,
    fontWeight: '600',
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
  extraItemWrapper: {
    marginBottom: 8,
  },
  extraSaberMaisBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    marginRight: 6,
  },
  extraSaberMaisText: {
    fontSize: 10,
    fontWeight: '800',
  },
  extraExpandedDetailsBox: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: -4,
    marginBottom: 6,
    marginLeft: 12,
    marginRight: 4,
  },
  extraExpandedHeader: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  extraExpandedDesc: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 6,
  },
  extraExpandedMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  extraExpandedMetaText: {
    fontSize: 10,
    fontWeight: '600',
  },
  experienceTagBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 8,
  },
  experienceTagBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  experienceStatusBox: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  experienceStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    flexWrap: 'wrap',
    gap: 6,
  },
  experienceStatusTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  experienceActionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  experienceActionBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  experienceSelectedDetails: {
    marginTop: 4,
    gap: 2,
  },
  experienceSelectedText: {
    fontSize: 13,
  },
  experienceSelectedSub: {
    fontSize: 12,
  },
  experienceWarningText: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 2,
  },
});
