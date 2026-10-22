import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { Theme } from '../constants/theme';

interface PinAccessModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PinAccessModal: React.FC<PinAccessModalProps> = ({ visible, onClose }) => {
  const { config, setRole, setActiveBranch } = useApp();
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  useEffect(() => {
    if (visible) {
      setPin('');
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [visible]);

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      setErrorMsg('');

      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    if (pin.length > 0) {
      setPin(prev => prev.slice(0, -1));
      setErrorMsg('');
    }
  };

  const handleClear = () => {
    setPin('');
    setErrorMsg('');
  };

  const verifyPin = (enteredPin: string) => {
    const pins = config.pins || {
      adminPin: '9999',
      gestorBarberPin: '1111',
      gestorBeautyPin: '2222',
      staffPin: '3333',
    };

    if (enteredPin === pins.adminPin) {
      setSuccessMsg('Acesso concedido: Administrador');
      setTimeout(() => {
        setRole('admin');
        onClose();
      }, 500);
    } else if (enteredPin === pins.gestorBarberPin) {
      setSuccessMsg('Acesso concedido: Gestor Barber');
      setTimeout(() => {
        setActiveBranch('barber');
        setRole('gestor_barber');
        onClose();
      }, 500);
    } else if (enteredPin === pins.gestorBeautyPin) {
      setSuccessMsg('Acesso concedido: Gestor Beauty');
      setTimeout(() => {
        setActiveBranch('beauty');
        setRole('gestor_beauty');
        onClose();
      }, 500);
    } else if (enteredPin === pins.staffPin) {
      setSuccessMsg('Acesso concedido: Equipa / Staff');
      setTimeout(() => {
        setRole('staff');
        onClose();
      }, 500);
    } else {
      setErrorMsg('PIN incorreto. Tente novamente.');
      setTimeout(() => {
        setPin('');
      }, 600);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={e => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>ÁREA PROFISSIONAL</Text>
            <Text style={styles.subtitle}>
              Introduza o PIN de 4 dígitos para aceder ao portal da equipa.
            </Text>
          </View>

          {/* Dots Indicator */}
          <View style={styles.dotsRow}>
            {[0, 1, 2, 3].map(idx => {
              const isFilled = pin.length > idx;
              return (
                <View
                  key={idx}
                  style={[
                    styles.dot,
                    isFilled && styles.dotFilled,
                    errorMsg ? styles.dotError : null,
                    successMsg ? styles.dotSuccess : null,
                  ]}
                />
              );
            })}
          </View>

          {/* Feedback messages */}
          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
          {successMsg ? <Text style={styles.successText}>{successMsg}</Text> : null}
          {!errorMsg && !successMsg ? <View style={{ height: 20 }} /> : null}

          {/* Numeric Keypad */}
          <View style={styles.keypad}>
            {[
              ['1', '2', '3'],
              ['4', '5', '6'],
              ['7', '8', '9'],
              ['C', '0', '⌫'],
            ].map((row, rIdx) => (
              <View key={rIdx} style={styles.keypadRow}>
                {row.map(k => {
                  const isAction = k === 'C' || k === '⌫';
                  return (
                    <TouchableOpacity
                      key={k}
                      style={[styles.keyBtn, isAction && styles.keyBtnAction]}
                      onPress={() => {
                        if (k === 'C') handleClear();
                        else if (k === '⌫') handleBackspace();
                        else handleKeyPress(k);
                      }}
                      activeOpacity={0.6}
                    >
                      <Text style={[styles.keyText, isAction && styles.keyTextAction]}>
                        {k}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>

          {/* Cancel button */}
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.cancelBtnText}>Voltar ao Modo Cliente</Text>
          </TouchableOpacity>
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
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#13131A',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2A2A38',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: '#E2B755',
    letterSpacing: 2,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    gap: 16,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4B5563',
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: '#E2B755',
    borderColor: '#E2B755',
    transform: [{ scale: 1.1 }],
  },
  dotError: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  dotSuccess: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '700',
    marginBottom: 10,
    height: 20,
  },
  successText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '700',
    marginBottom: 10,
    height: 20,
  },
  keypad: {
    width: '100%',
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  keyBtn: {
    width: 68,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#1C1C26',
    borderWidth: 1,
    borderColor: '#2E2E3E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyBtnAction: {
    backgroundColor: '#171720',
    borderColor: '#262634',
  },
  keyText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  keyTextAction: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  cancelBtnText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
  },
});
