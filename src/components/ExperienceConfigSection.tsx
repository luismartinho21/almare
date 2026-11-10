import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SalonBranch, ServiceExperienceConfig } from '../types';
import { Theme } from '../constants/theme';

interface ExperienceConfigSectionProps {
  branch: SalonBranch;
  isExperience: boolean;
  expConfigDraft?: ServiceExperienceConfig;
  isPersonalized: boolean;
  onSelectNormal: () => void;
  onSelectExperience: () => void;
  onOpenEditor: () => void;
}

export const ExperienceConfigSection: React.FC<ExperienceConfigSectionProps> = ({
  branch,
  isExperience,
  expConfigDraft,
  isPersonalized,
  onSelectNormal,
  onSelectExperience,
  onOpenEditor,
}) => {
  const isBarber = branch === 'barber';
  const accentColor = isBarber ? Theme.colors.barber.accent : Theme.colors.beauty.badge;
  const restaurants = expConfigDraft?.restaurants || [];

  return (
    <View
      style={[
        styles.container,
        isBarber ? styles.containerBarber : styles.containerBeauty,
      ]}
    >
      <Text style={[styles.label, { color: isBarber ? '#F4F4F5' : '#1F2937' }]}>
        ✨ Experiência Exclusiva (Restaurantes & Menus)
      </Text>
      <Text style={[styles.hint, { color: isBarber ? '#A1A1AA' : '#6B7280' }]}>
        Ao ativar, este serviço pede ao cliente para escolher um restaurante parceiro e menu. Pode personalizar restaurantes e menus para cada serviço criado.
      </Text>

      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[
            styles.toggleBtn,
            isBarber ? styles.toggleBtnBarber : styles.toggleBtnBeauty,
            !isExperience && {
              backgroundColor: accentColor,
              borderColor: accentColor,
            },
          ]}
          onPress={onSelectNormal}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.toggleBtnText,
              { color: !isExperience ? (isBarber ? '#000' : '#FFF') : isBarber ? '#D4D4D8' : '#4B5563' },
            ]}
          >
            Serviço Normal
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleBtn,
            isBarber ? styles.toggleBtnBarber : styles.toggleBtnBeauty,
            isExperience && {
              backgroundColor: accentColor,
              borderColor: accentColor,
            },
          ]}
          onPress={onSelectExperience}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.toggleBtnText,
              { color: isExperience ? (isBarber ? '#000' : '#FFF') : isBarber ? '#D4D4D8' : '#4B5563' },
            ]}
          >
            ✨ Experiência Exclusiva
          </Text>
        </TouchableOpacity>
      </View>

      {isExperience && (
        <View
          style={[
            styles.summaryBox,
            isBarber ? styles.summaryBoxBarber : styles.summaryBoxBeauty,
            { borderColor: isPersonalized ? accentColor : '#F59E0B' },
          ]}
        >
          {!isPersonalized || restaurants.length === 0 ? (
            <Text style={[styles.pendingText, { color: isBarber ? '#FCD34D' : '#B45309' }]}>
              ⚠️ Personalização pendente: defina os restaurantes parceiros e menus para este serviço.
            </Text>
          ) : (
            <View>
              <Text style={[styles.summaryTitle, { color: accentColor }]}>
                ✓ {expConfigDraft?.title || 'Experiência Configurada'} ({restaurants.length} Restaurante{restaurants.length === 1 ? '' : 's'})
              </Text>
              {restaurants.map(r => (
                <View key={r.id} style={styles.restLine}>
                  <Text
                    style={[styles.restName, { color: isBarber ? '#F4F4F5' : '#111827' }]}
                    numberOfLines={1}
                  >
                    🍽️ {r.name}
                  </Text>
                  <Text
                    style={[styles.restMenus, { color: isBarber ? '#A1A1AA' : '#4B5563' }]}
                    numberOfLines={2}
                  >
                    Menus ({r.menus.length}): {r.menus.map(m => m.name).join(' • ')}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.editBtn,
              {
                backgroundColor: isPersonalized
                  ? isBarber
                    ? '#272732'
                    : '#FAF5E8'
                  : accentColor,
                borderColor: accentColor,
              },
            ]}
            onPress={onOpenEditor}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.editBtnText,
                {
                  color: isPersonalized
                    ? accentColor
                    : isBarber
                    ? '#000'
                    : '#FFF',
                },
              ]}
            >
              {isPersonalized
                ? '✏️ Editar Restaurantes Parceiros & Menus'
                : '✨ Personalizar Restaurantes & Menus Agora'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  containerBarber: {
    backgroundColor: '#181820',
    borderColor: '#2E2E3A',
  },
  containerBeauty: {
    backgroundColor: '#FCF9F2',
    borderColor: '#E6D7B8',
  },
  label: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  hint: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 10,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  toggleBtnBarber: {
    backgroundColor: '#101015',
    borderColor: '#3F3F46',
  },
  toggleBtnBeauty: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DDD2BA',
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  summaryBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  summaryBoxBarber: {
    backgroundColor: '#111117',
  },
  summaryBoxBeauty: {
    backgroundColor: '#FFFFFF',
  },
  pendingText: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  restLine: {
    marginBottom: 5,
  },
  restName: {
    fontSize: 12,
    fontWeight: '700',
  },
  restMenus: {
    fontSize: 10,
    marginTop: 1,
  },
  editBtn: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  editBtnText: {
    fontSize: 12,
    fontWeight: '900',
  },
});
