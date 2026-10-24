import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';
import { Theme } from '../constants/theme';
import { salonSound } from '../utils/soundHelper';

interface HeaderProps {
  onOpenRoleModal?: () => void;
  onOpenPinModal?: () => void;
  onGoHome?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenRoleModal, onOpenPinModal, onGoHome }) => {
  const { role, activeBranch } = useApp();
  const [isPlaying, setIsPlaying] = useState(salonSound.isPlaying());
  const [isMuted, setIsMuted] = useState(salonSound.getIsMuted());

  useEffect(() => {
    return salonSound.subscribe((playing, muted) => {
      setIsPlaying(playing);
      setIsMuted(muted);
    });
  }, []);

  const handleToggleSound = () => {
    salonSound.toggleMute();
  };

  const getRoleLabel = () => {
    switch (role) {
      case 'client': return 'Cliente';
      case 'gestor_barber': return 'Gestor Barber';
      case 'gestor_beauty': return 'Gestor Beauty';
      case 'staff': return 'Staff';
      case 'admin': return 'Admin';
      default: return 'Perfil';
    }
  };

  const isBarber = activeBranch === 'barber';

  return (
    <View style={[styles.container, isBarber ? styles.barberBg : styles.beautyBg]}>
      <View style={styles.topRow}>
        {/* Texto do logo — Toque rápido volta ao Home. Toque mantido (1.2s) abre o PIN de Acesso restrito */}
        <TouchableOpacity
          style={styles.logoBtn}
          onPress={onGoHome}
          onLongPress={onOpenPinModal}
          delayLongPress={1200}
          activeOpacity={0.8}
        >
          <View style={styles.logoTextContainer}>
            <Text style={[styles.logoTitle, { color: isBarber ? Theme.colors.brandSecondary : '#B8860B' }]}>
              ALMARE
            </Text>
            <Text style={[styles.logoSubtitle, { color: isBarber ? '#D1D5DB' : '#4B5563' }]}>
              BARBEARIA & ESTÉTICA
            </Text>
          </View>
        </TouchableOpacity>

        {/* Controlos à direita: Botão de Som de Salão + Ações de Gestão/Staff */}
        <View style={styles.rightActionsRow}>
          <TouchableOpacity
            style={[
              styles.soundBtn,
              isBarber ? styles.soundBtnBarber : styles.soundBtnBeauty,
              isMuted && styles.soundBtnMuted,
            ]}
            onPress={handleToggleSound}
            activeOpacity={0.75}
          >
            <Text style={styles.soundBtnIcon}>
              {isMuted ? '🔇' : '🔊'}
            </Text>
            <Text
              style={[
                styles.soundBtnText,
                { color: isBarber ? (isMuted ? '#9CA3AF' : '#E5E7EB') : (isMuted ? '#6B7280' : '#1F2937') },
              ]}
            >
              {isMuted ? 'Mudo' : 'Som'}
            </Text>
          </TouchableOpacity>

          {/* Os botões de Staff/Gestor só aparecem se o utilizador já estiver autenticado (NÃO para clientes) */}
          {role !== 'client' ? (
            <View style={styles.roleActionsRow}>
              <TouchableOpacity
                style={[
                  styles.roleBadge,
                  {
                    backgroundColor: isBarber ? 'rgba(212, 175, 55, 0.18)' : '#F2ECE1',
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

              <TouchableOpacity
                style={[
                  styles.logoutBtn,
                  {
                    backgroundColor: isBarber ? '#281717' : '#FDE8E8',
                    borderColor: isBarber ? '#EF4444' : '#F87171',
                  },
                ]}
                onPress={onGoHome}
                activeOpacity={0.8}
              >
                <Text style={styles.logoutBtnText}>Sair ✕</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
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
    backgroundColor: '#FAF7F2', // Mesmo tom de bege (branco sujo)
    borderBottomColor: '#E8E1D5',
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
  rightActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  soundBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  soundBtnBarber: {
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  soundBtnBeauty: {
    backgroundColor: '#F7F3EC',
    borderColor: '#D4AF37',
  },
  soundBtnMuted: {
    opacity: 0.65,
    borderColor: '#9CA3AF',
  },
  soundBtnIcon: {
    fontSize: 12,
  },
  soundBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  roleActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleBadge: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 18,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  logoutBtn: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 18,
  },
  logoutBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#EF4444',
  },
});
