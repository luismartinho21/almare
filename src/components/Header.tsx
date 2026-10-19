import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';
import { Theme } from '../constants/theme';

interface HeaderProps {
  onOpenRoleModal: () => void;
  onGoHome?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenRoleModal, onGoHome }) => {
  const { role, activeBranch } = useApp();

  const getRoleLabel = () => {
    switch (role) {
      case 'client': return '👤 Cliente';
      case 'gestor_barber': return '💈 Gestor Barber';
      case 'gestor_beauty': return '💅 Gestor Beauty';
      case 'staff': return '✂️ Staff / Funcionário';
      case 'admin': return '⚙️ Admin';
      default: return 'Perfil';
    }
  };

  const isBarber = activeBranch === 'barber';

  return (
    <View style={[styles.container, isBarber ? styles.barberBg : styles.beautyBg]}>
      <View style={styles.topRow}>
        {/* Texto do logo — clicável para ir ao Home */}
        <TouchableOpacity style={styles.logoBtn} onPress={onGoHome} activeOpacity={0.8}>
          <View style={styles.logoTextContainer}>
            <Text style={[styles.logoTitle, { color: isBarber ? Theme.colors.brandSecondary : '#B8860B' }]}>
              ALMARE
            </Text>
            <Text style={[styles.logoSubtitle, { color: isBarber ? '#D1D5DB' : '#4B5563' }]}>
              BARBEARIA ✕ ESTÉTICA
            </Text>
          </View>
        </TouchableOpacity>

        {/* Role Badge Button */}
        <TouchableOpacity
          style={[
            styles.roleBadge,
            {
              backgroundColor: isBarber ? 'rgba(212, 175, 55, 0.18)' : '#FFFDF0',
              borderColor: isBarber ? Theme.colors.brandSecondary : '#D4AF37',
            },
          ]}
          onPress={onOpenRoleModal}
          activeOpacity={0.8}
        >
          <Text style={[styles.roleBadgeText, { color: isBarber ? Theme.colors.brandSecondary : '#996515' }]}>
            {getRoleLabel()}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 44,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  barberBg: {
    backgroundColor: '#0D0D11', // Black for Homens
    borderBottomColor: '#2A2415',
  },
  beautyBg: {
    backgroundColor: '#FFFFFF', // White for Mulheres
    borderBottomColor: '#E6D5AC',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoTextContainer: {
    justifyContent: 'center',
  },
  logoTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
  },
  logoSubtitle: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: -2,
  },
  roleBadge: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
