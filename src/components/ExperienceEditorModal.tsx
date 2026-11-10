import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
} from 'react-native';
import {
  SalonBranch,
  ServiceExperienceConfig,
  ExperienceRestaurant,
  ExperienceMenuItem,
} from '../types';
import { Theme } from '../constants/theme';
import { DEFAULT_ROMANCE_EXPERIENCE_RESTAURANTS } from '../constants/mockData';

interface ExperienceEditorModalProps {
  visible: boolean;
  branch: SalonBranch;
  serviceName: string;
  initialConfig?: ServiceExperienceConfig;
  onSave: (config: ServiceExperienceConfig) => void;
  onClose: () => void;
}

const cloneRestaurantsWithFreshIds = (
  source: ExperienceRestaurant[]
): ExperienceRestaurant[] => {
  const ts = Date.now();
  return source.map((r, rIdx) => ({
    ...r,
    id: r.id && !r.id.startsWith('rest-') ? r.id : `rest-${ts}-${rIdx}`,
    menus: (r.menus || []).map((m, mIdx) => ({
      ...m,
      id: m.id && !m.id.startsWith('menu-') ? m.id : `menu-${ts}-${rIdx}-${mIdx}`,
    })),
  }));
};

const createEmptyMenu = (index: number): ExperienceMenuItem => ({
  id: `menu-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  name: `Menu ${index}`,
  description: '',
  priceSupplement: 0,
});

const createEmptyRestaurant = (index: number): ExperienceRestaurant => ({
  id: `rest-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  name: '',
  cuisine: '',
  location: '',
  description: '',
  menus: [createEmptyMenu(1)],
});

export const ExperienceEditorModal: React.FC<ExperienceEditorModalProps> = props => {
  if (!props.visible) return null;
  return <ExperienceEditorContent {...props} />;
};

const ExperienceEditorContent: React.FC<ExperienceEditorModalProps> = ({
  visible,
  branch,
  serviceName,
  initialConfig,
  onSave,
  onClose,
}) => {
  const isBarber = branch === 'barber';
  const accentColor = isBarber ? Theme.colors.barber.accent : Theme.colors.beauty.accent;

  const [restaurants, setRestaurants] = useState<ExperienceRestaurant[]>(() => {
    if (initialConfig?.restaurants && initialConfig.restaurants.length > 0) {
      return JSON.parse(JSON.stringify(initialConfig.restaurants)) as ExperienceRestaurant[];
    }
    return cloneRestaurantsWithFreshIds(DEFAULT_ROMANCE_EXPERIENCE_RESTAURANTS);
  });

  const [title, setTitle] = useState(
    () => initialConfig?.title || 'Experiência Exclusiva com Restaurante & Menu'
  );
  const [instruction, setInstruction] = useState(
    () =>
      initialConfig?.instruction ||
      'Para avançar, selecione 1 dos restaurantes parceiros e o menu que mais aprecia:'
  );
  const [expandedRestId, setExpandedRestId] = useState<string | null>(
    () => restaurants[0]?.id || null
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLoadRomanceTemplate = () => {
    const seeded = cloneRestaurantsWithFreshIds(DEFAULT_ROMANCE_EXPERIENCE_RESTAURANTS);
    setRestaurants(seeded);
    setExpandedRestId(seeded[0]?.id || null);
    setErrorMsg(null);
  };

  const handleAddRestaurant = () => {
    const newRest = createEmptyRestaurant(restaurants.length + 1);
    setRestaurants(prev => [...prev, newRest]);
    setExpandedRestId(newRest.id);
    setErrorMsg(null);
  };

  const handleDeleteRestaurant = (restId: string) => {
    setRestaurants(prev => {
      const filtered = prev.filter(r => r.id !== restId);
      if (expandedRestId === restId) {
        setExpandedRestId(filtered[0]?.id || null);
      }
      return filtered;
    });
  };

  const handleUpdateRestaurantField = (
    restId: string,
    field: keyof Omit<ExperienceRestaurant, 'id' | 'menus'>,
    value: string
  ) => {
    setRestaurants(prev =>
      prev.map(r => (r.id === restId ? { ...r, [field]: value } : r))
    );
  };

  const handleAddMenu = (restId: string) => {
    setRestaurants(prev =>
      prev.map(r => {
        if (r.id !== restId) return r;
        return {
          ...r,
          menus: [...r.menus, createEmptyMenu(r.menus.length + 1)],
        };
      })
    );
  };

  const handleDeleteMenu = (restId: string, menuId: string) => {
    setRestaurants(prev =>
      prev.map(r => {
        if (r.id !== restId) return r;
        return {
          ...r,
          menus: r.menus.filter(m => m.id !== menuId),
        };
      })
    );
  };

  const handleUpdateMenuField = (
    restId: string,
    menuId: string,
    field: 'name' | 'description' | 'priceSupplement',
    value: string
  ) => {
    setRestaurants(prev =>
      prev.map(r => {
        if (r.id !== restId) return r;
        return {
          ...r,
          menus: r.menus.map(m => {
            if (m.id !== menuId) return m;
            if (field === 'priceSupplement') {
              const parsed = parseFloat(value.replace(',', '.'));
              return { ...m, priceSupplement: isNaN(parsed) ? 0 : parsed };
            }
            return { ...m, [field]: value };
          }),
        };
      })
    );
  };

  const handleSave = () => {
    if (restaurants.length === 0) {
      setErrorMsg('Adicione pelo menos 1 restaurante parceiro para esta experiência.');
      return;
    }

    for (let i = 0; i < restaurants.length; i++) {
      const rest = restaurants[i];
      if (!rest.name.trim()) {
        setExpandedRestId(rest.id);
        setErrorMsg(`Indique o nome do Restaurante ${i + 1}.`);
        return;
      }
      if (!rest.menus || rest.menus.length === 0) {
        setExpandedRestId(rest.id);
        setErrorMsg(`O restaurante "${rest.name}" precisa de pelo menos 1 menu disponível.`);
        return;
      }
      for (let j = 0; j < rest.menus.length; j++) {
        if (!rest.menus[j].name.trim()) {
          setExpandedRestId(rest.id);
          setErrorMsg(`Indique o nome do Menu ${j + 1} no restaurante "${rest.name}".`);
          return;
        }
      }
    }

    const cleanedRestaurants: ExperienceRestaurant[] = restaurants.map(r => ({
      ...r,
      name: r.name.trim(),
      cuisine: r.cuisine.trim() || 'Gastronomia Selecionada',
      location: r.location.trim() || 'Parceiro Oficial Almare',
      description: r.description.trim() || 'Espaço selecionado com ambiente reservado.',
      menus: r.menus.map(m => ({
        ...m,
        name: m.name.trim(),
        description: m.description.trim() || 'Menu exclusivo de degustação incluído na experiência.',
        priceSupplement: m.priceSupplement && m.priceSupplement > 0 ? m.priceSupplement : 0,
      })),
    }));

    onSave({
      enabled: true,
      title: title.trim() || 'Experiência Exclusiva com Restaurante & Menu',
      instruction:
        instruction.trim() ||
        `Para avançar, selecione 1 de ${cleanedRestaurants.length} restaurante(s) parceiro(s) e o menu que mais aprecia:`,
      restaurants: cleanedRestaurants,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[
            styles.modalCard,
            isBarber ? styles.modalBarber : styles.modalBeauty,
          ]}
          onPress={e => e.stopPropagation()}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={[styles.badgeText, { color: accentColor }]}>
                ✨ PERSONALIZAR EXPERIÊNCIA EXCLUSIVA
              </Text>
              <Text style={[styles.title, { color: isBarber ? '#FFF' : '#111827' }]}>
                {serviceName?.trim() ? serviceName : 'Novo Serviço de Experiência'}
              </Text>
              <Text style={[styles.subtitle, { color: isBarber ? '#A1A1AA' : '#6B7280' }]}>
                Edite os restaurantes parceiros e os respetivos menus desta experiência.
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={[styles.closeBtnText, { color: isBarber ? '#9CA3AF' : '#6B7280' }]}>
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          {errorMsg ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>⚠️ {errorMsg}</Text>
            </View>
          ) : null}

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Configuração Geral */}
            <View
              style={[
                styles.sectionBox,
                isBarber ? styles.sectionBoxBarber : styles.sectionBoxBeauty,
              ]}
            >
              <Text style={[styles.sectionHeader, { color: accentColor }]}>
                1. TÍTULO & INSTRUÇÃO PARA O CLIENTE
              </Text>

              <Text style={[styles.fieldLabel, { color: isBarber ? '#E4E4E7' : '#374151' }]}>
                Nome / Etiqueta da Experiência *
              </Text>
              <TextInput
                style={[styles.input, isBarber ? styles.inputBarber : styles.inputBeauty]}
                value={title}
                onChangeText={setTitle}
                placeholder="Ex: Experiência Romântica com Jantar"
                placeholderTextColor="#71717A"
              />

              <Text style={[styles.fieldLabel, { color: isBarber ? '#E4E4E7' : '#374151', marginTop: 10 }]}>
                Instrução exibida ao cliente
              </Text>
              <TextInput
                style={[
                  styles.input,
                  isBarber ? styles.inputBarber : styles.inputBeauty,
                  { height: 54, textAlignVertical: 'top', paddingTop: 8 },
                ]}
                value={instruction}
                onChangeText={setInstruction}
                multiline
                placeholder="Ex: Escolha 1 de 3 restaurantes parceiros e o menu pretendido..."
                placeholderTextColor="#71717A"
              />
            </View>

            {/* Barra de Restaurantes */}
            <View style={styles.restaurantsToolbar}>
              <Text style={[styles.sectionHeader, { color: accentColor, marginBottom: 0 }]}>
                2. RESTAURANTES PARCEIROS ({restaurants.length})
              </Text>
              <View style={styles.toolbarActions}>
                <TouchableOpacity
                  style={[styles.miniBtn, { borderColor: isBarber ? '#3F3F46' : '#D1D5DB' }]}
                  onPress={handleLoadRomanceTemplate}
                >
                  <Text style={[styles.miniBtnText, { color: isBarber ? '#D4D4D8' : '#4B5563' }]}>
                    ↺ Modelo 3 Rest.
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.miniBtn, { backgroundColor: accentColor, borderColor: accentColor }]}
                  onPress={handleAddRestaurant}
                >
                  <Text style={[styles.miniBtnText, { color: isBarber ? '#000' : '#FFF', fontWeight: '800' }]}>
                    + Restaurante
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Lista de Restaurantes Editáveis */}
            {restaurants.map((rest, rIdx) => {
              const isExpanded = expandedRestId === rest.id;
              return (
                <View
                  key={rest.id}
                  style={[
                    styles.restCard,
                    isBarber ? styles.restCardBarber : styles.restCardBeauty,
                    isExpanded && { borderColor: accentColor },
                  ]}
                >
                  {/* Cabeçalho colapsável do restaurante */}
                  <TouchableOpacity
                    style={styles.restHeaderRow}
                    onPress={() => setExpandedRestId(isExpanded ? null : rest.id)}
                    activeOpacity={0.75}
                  >
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={[styles.restIndexLabel, { color: accentColor }]}>
                        RESTAURANTE {rIdx + 1} • {rest.menus.length} MENU(S)
                      </Text>
                      <Text
                        style={[styles.restHeaderName, { color: isBarber ? '#FFF' : '#111827' }]}
                        numberOfLines={1}
                      >
                        {rest.name.trim() || '(Toque para dar nome ao restaurante)'}
                      </Text>
                    </View>
                    <View style={styles.restHeaderBtns}>
                      <Text style={[styles.expandBadgeText, { color: accentColor }]}>
                        {isExpanded ? '▲ Fechar' : '✏️ Editar'}
                      </Text>
                      <TouchableOpacity
                        style={styles.deleteIconBtn}
                        onPress={() => handleDeleteRestaurant(rest.id)}
                      >
                        <Text style={styles.deleteIconText}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>

                  {/* Formulário expandido do Restaurante + Menus */}
                  {isExpanded && (
                    <View style={styles.restExpandedBody}>
                      <Text style={[styles.fieldLabel, { color: isBarber ? '#E4E4E7' : '#374151' }]}>
                        Nome do Restaurante *
                      </Text>
                      <TextInput
                        style={[styles.input, isBarber ? styles.inputBarber : styles.inputBeauty]}
                        value={rest.name}
                        onChangeText={val => handleUpdateRestaurantField(rest.id, 'name', val)}
                        placeholder="Ex: Mare Nostrum • Vista Mar"
                        placeholderTextColor="#71717A"
                      />

                      <View style={styles.twoColRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.fieldLabel, { color: isBarber ? '#E4E4E7' : '#374151' }]}>
                            Tipo de Cozinha
                          </Text>
                          <TextInput
                            style={[styles.input, isBarber ? styles.inputBarber : styles.inputBeauty]}
                            value={rest.cuisine}
                            onChangeText={val => handleUpdateRestaurantField(rest.id, 'cuisine', val)}
                            placeholder="Ex: Mediterrânica"
                            placeholderTextColor="#71717A"
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.fieldLabel, { color: isBarber ? '#E4E4E7' : '#374151' }]}>
                            Localização
                          </Text>
                          <TextInput
                            style={[styles.input, isBarber ? styles.inputBarber : styles.inputBeauty]}
                            value={rest.location}
                            onChangeText={val => handleUpdateRestaurantField(rest.id, 'location', val)}
                            placeholder="Ex: Chiado, Lisboa"
                            placeholderTextColor="#71717A"
                          />
                        </View>
                      </View>

                      <Text style={[styles.fieldLabel, { color: isBarber ? '#E4E4E7' : '#374151', marginTop: 8 }]}>
                        Descrição do Ambiente / Restaurante
                      </Text>
                      <TextInput
                        style={[
                          styles.input,
                          isBarber ? styles.inputBarber : styles.inputBeauty,
                          { height: 54, textAlignVertical: 'top', paddingTop: 8 },
                        ]}
                        value={rest.description}
                        onChangeText={val => handleUpdateRestaurantField(rest.id, 'description', val)}
                        multiline
                        placeholder="Descreva a vista, ambiente e conceito do restaurante..."
                        placeholderTextColor="#71717A"
                      />

                      {/* Subsecção: Menus deste Restaurante */}
                      <View
                        style={[
                          styles.menusSection,
                          { borderTopColor: isBarber ? '#2E2E3A' : '#E6D7B8' },
                        ]}
                      >
                        <View style={styles.menusHeaderRow}>
                          <Text style={[styles.menusTitle, { color: accentColor }]}>
                            🍽️ MENUS DISPONÍVEIS ({rest.menus.length})
                          </Text>
                          <TouchableOpacity
                            style={[styles.addMenuBtn, { borderColor: accentColor }]}
                            onPress={() => handleAddMenu(rest.id)}
                          >
                            <Text style={[styles.addMenuBtnText, { color: accentColor }]}>
                              + Novo Menu
                            </Text>
                          </TouchableOpacity>
                        </View>

                        {rest.menus.map((menu, mIdx) => (
                          <View
                            key={menu.id}
                            style={[
                              styles.menuItemBox,
                              isBarber ? styles.menuItemBoxBarber : styles.menuItemBoxBeauty,
                            ]}
                          >
                            <View style={styles.menuItemTop}>
                              <Text style={[styles.menuBadgeLabel, { color: accentColor }]}>
                                MENU {mIdx + 1}
                              </Text>
                              <TouchableOpacity onPress={() => handleDeleteMenu(rest.id, menu.id)}>
                                <Text style={styles.deleteMenuLink}>Remover ✕</Text>
                              </TouchableOpacity>
                            </View>

                            <View style={styles.twoColRow}>
                              <View style={{ flex: 2 }}>
                                <Text style={[styles.miniLabel, { color: isBarber ? '#A1A1AA' : '#6B7280' }]}>
                                  Nome do Menu *
                                </Text>
                                <TextInput
                                  style={[styles.input, isBarber ? styles.inputBarber : styles.inputBeauty]}
                                  value={menu.name}
                                  onChangeText={val => handleUpdateMenuField(rest.id, menu.id, 'name', val)}
                                  placeholder="Ex: Menu Sinfonia do Mar"
                                  placeholderTextColor="#71717A"
                                />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={[styles.miniLabel, { color: isBarber ? '#A1A1AA' : '#6B7280' }]}>
                                  Suplemento (€)
                                </Text>
                                <TextInput
                                  style={[styles.input, isBarber ? styles.inputBarber : styles.inputBeauty]}
                                  value={menu.priceSupplement ? String(menu.priceSupplement) : '0'}
                                  onChangeText={val =>
                                    handleUpdateMenuField(rest.id, menu.id, 'priceSupplement', val)
                                  }
                                  keyboardType="numeric"
                                  placeholder="0"
                                  placeholderTextColor="#71717A"
                                />
                              </View>
                            </View>

                            <Text style={[styles.miniLabel, { color: isBarber ? '#A1A1AA' : '#6B7280', marginTop: 6 }]}>
                              Pratos / Descrição do Menu
                            </Text>
                            <TextInput
                              style={[
                                styles.input,
                                isBarber ? styles.inputBarber : styles.inputBeauty,
                                { height: 52, textAlignVertical: 'top', paddingTop: 8 },
                              ]}
                              value={menu.description}
                              onChangeText={val =>
                                handleUpdateMenuField(rest.id, menu.id, 'description', val)
                              }
                              multiline
                              placeholder="Entrada • Prato Principal • Sobremesa..."
                              placeholderTextColor="#71717A"
                            />
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>

          {/* Footer Save / Cancel */}
          <View style={[styles.footer, isBarber ? styles.footerBarber : styles.footerBeauty]}>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: accentColor }]}
              onPress={handleSave}
              activeOpacity={0.85}
            >
              <Text style={[styles.saveBtnText, { color: isBarber ? '#000' : '#FFF' }]}>
                ✓ Guardar Personalização da Experiência
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={[styles.cancelBtnText, { color: isBarber ? '#9CA3AF' : '#6B7280' }]}>
                Cancelar
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
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  modalCard: {
    width: '100%',
    maxWidth: 680,
    maxHeight: '92%',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
  },
  modalBarber: {
    backgroundColor: '#14141A',
    borderColor: '#2E2E3A',
  },
  modalBeauty: {
    backgroundColor: '#FAF7F0',
    borderColor: '#E6D7B8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 10,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    fontSize: 18,
    fontWeight: '700',
  },
  errorBanner: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#7F1D1D',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  errorBannerText: {
    color: '#FEE2E2',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollArea: {
    paddingHorizontal: 16,
  },
  sectionBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  sectionBoxBarber: {
    backgroundColor: '#1C1C24',
    borderColor: '#2E2E3A',
  },
  sectionBoxBeauty: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E6D7B8',
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  miniLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 3,
  },
  input: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    borderWidth: 1,
  },
  inputBarber: {
    backgroundColor: '#0E0E12',
    borderColor: '#3F3F46',
    color: '#FFF',
  },
  inputBeauty: {
    backgroundColor: '#FAF8F5',
    borderColor: '#DDD2BA',
    color: '#111827',
  },
  restaurantsToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  toolbarActions: {
    flexDirection: 'row',
    gap: 8,
  },
  miniBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  miniBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  restCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  restCardBarber: {
    backgroundColor: '#1B1B24',
    borderColor: '#2E2E3A',
  },
  restCardBeauty: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E6D7B8',
  },
  restHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  restIndexLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  restHeaderName: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  restHeaderBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  expandBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  deleteIconBtn: {
    padding: 4,
  },
  deleteIconText: {
    fontSize: 14,
  },
  restExpandedBody: {
    padding: 12,
    paddingTop: 4,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  menusSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  menusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  menusTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  addMenuBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  addMenuBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  menuItemBox: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  menuItemBoxBarber: {
    backgroundColor: '#13131A',
    borderColor: '#2D2D3A',
  },
  menuItemBoxBeauty: {
    backgroundColor: '#FAF7F0',
    borderColor: '#E6D7B8',
  },
  menuItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  menuBadgeLabel: {
    fontSize: 10,
    fontWeight: '900',
  },
  deleteMenuLink: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '700',
  },
  footer: {
    padding: 14,
    borderTopWidth: 1,
  },
  footerBarber: {
    backgroundColor: '#14141A',
    borderTopColor: '#2E2E3A',
  },
  footerBeauty: {
    backgroundColor: '#FAF7F0',
    borderTopColor: '#E6D7B8',
  },
  saveBtn: {
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '900',
  },
  cancelBtn: {
    marginTop: 8,
    paddingVertical: 6,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
