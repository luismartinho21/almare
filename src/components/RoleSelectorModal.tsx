import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { Theme } from '../constants/theme';

interface RoleSelectorModalProps {
  visible: boolean;
  onClose: () => void;
}

export const RoleSelectorModal: React.FC<RoleSelectorModalProps> = ({ visible, onClose }) => {
  const { role, setRole, setActiveBranch } = useApp();

  const handleSelectRole = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole === 'gestor_barber') {
      setActiveBranch('barber');
    } else if (newRole === 'gestor_beauty') {
      setActiveBranch('beauty');
    }
    onClose();
  };

  const rolesList: { role: UserRole; title: string; desc: string; icon: string }[] = [
    {
      role: 'client',
      title: 'Cliente (Modo Marcação)',
      desc: 'Marcar serviços no Barber ou Beauty com nome e telemóvel.',
      icon: '📱',
    },
    {
      role: 'gestor_barber',
      title: 'Gestor Almare Barber',
      desc: 'Ver agenda de barba/cabelo, gerir profissionais e horários.',
      icon: '💈',
    },
    {
      role: 'gestor_beauty',
      title: 'Gestor Almare Beauty',
      desc: 'Ver agenda de beleza/cabelo/unhas, controlar vagas e estatísticas.',
      icon: '💅',
    },
    {
      role: 'staff',
      title: 'Staff / Funcionário',
      desc: 'Ver horários e aceder ao histórico de clientes (últimos 3 meses).',
      icon: '✂️',
    },
    {
      role: 'admin',
      title: 'Administrador (Configs)',
      desc: 'Gerir dados da empresa, lista global de serviços e profissionais.',
      icon: '⚙️',
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
          <Text style={styles.modalTitle}>Selecionar Modo de Acesso</Text>
          <Text style={styles.modalSub}>
            Escolha como pretende navegar na aplicação Almare:
          </Text>

          {rolesList.map((item) => {
            const isSelected = role === item.role;
            return (
              <TouchableOpacity
                key={item.role}
                style={[styles.roleCard, isSelected && styles.roleCardSelected]}
                onPress={() => handleSelectRole(item.role)}
                activeOpacity={0.7}
              >
                <Text style={styles.roleIcon}>{item.icon}</Text>
                <View style={styles.roleInfo}>
                  <Text style={[styles.roleTitleText, isSelected && styles.roleTitleSelected]}>
                    {item.title}
                  </Text>
                  <Text style={styles.roleDescText}>{item.desc}</Text>
                </View>
                {isSelected && <Text style={styles.checkMark}>✓</Text>}
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Fechar</Text>
          </TouchableOpacity>
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
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1E1E24',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 480,
    borderWidth: 1,
    borderColor: Theme.colors.brandSecondary,
  },
  modalTitle: {
    color: Theme.colors.brandSecondary,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalSub: {
    color: '#9CA3AF',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A32',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  roleCardSelected: {
    borderColor: Theme.colors.brandSecondary,
    backgroundColor: '#353540',
  },
  roleIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  roleInfo: {
    flex: 1,
  },
  roleTitleText: {
    color: '#F3F4F6',
    fontSize: 15,
    fontWeight: '700',
  },
  roleTitleSelected: {
    color: Theme.colors.brandSecondary,
  },
  roleDescText: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  checkMark: {
    color: Theme.colors.brandSecondary,
    fontSize: 18,
    fontWeight: '900',
    marginLeft: 8,
  },
  closeButton: {
    marginTop: 10,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#111116',
    borderRadius: 10,
  },
  closeButtonText: {
    color: '#D1D5DB',
    fontWeight: '600',
    fontSize: 14,
  },
});
