import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SalonBranch } from '../types';
import { Theme } from '../constants/theme';

interface ClientHomeViewProps {
  onSelectBranch: (branch: SalonBranch) => void;
  onOpenPinModal?: () => void;
}

const { width } = Dimensions.get('window');
const halfWidth = width / 2;

export const ClientHomeView: React.FC<ClientHomeViewProps> = ({ onSelectBranch, onOpenPinModal }) => {
  // Lado atualmente a folhear ('beauty' ou 'barber') para passar garantidamente por cima
  const [turningBranch, setTurningBranch] = useState<'beauty' | 'barber' | null>(null);

  // Fade in de entrada dos 2 botões
  const buttonsFadeAnim = useRef(new Animated.Value(0)).current;

  // Valor de animação de 0 a 1 para o efeito livro rodando para dentro (fechar/folhear em direção ao centro)
  const beautyBookAnim = useRef(new Animated.Value(0)).current;
  const barberBookAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(buttonsFadeAnim, {
      toValue: 1,
      duration: 1100,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [buttonsFadeAnim]);

  // BEAUTY (Esquerda): Roda e fecha completamente sobre o lado direito (180°)
  const handleBeautyPress = () => {
    setTurningBranch('beauty');
    Animated.timing(beautyBookAnim, {
      toValue: 1,
      duration: 2200,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      onSelectBranch('beauty');
    });
  };

  // BARBER (Direita): Roda e fecha completamente sobre o lado esquerdo (-180°)
  const handleBarberPress = () => {
    setTurningBranch('barber');
    Animated.timing(barberBookAnim, {
      toValue: 1,
      duration: 2200,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      onSelectBranch('barber');
    });
  };

  // BEAUTY INTERPOLATIONS (virar 180° e fechar completamente sobre o lado direito)
  const beautyRotateY = beautyBookAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const beautyTranslateX = beautyBookAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, halfWidth],
  });

  // O conteúdo frontal (textos) dissolve-se suavemente à medida que a capa vira de costas
  const beautyFrontContentOpacity = beautyBookAnim.interpolate({
    inputRange: [0, 0.45, 0.55, 1],
    outputRange: [1, 0.2, 0, 0],
  });

  // Camada que fecha completamente o lado direito a bege/branco (#FAF7F2) à medida que a folha aterra
  const beautyCoverRightOpacity = beautyBookAnim.interpolate({
    inputRange: [0, 0.45, 0.9, 1],
    outputRange: [0, 0.2, 1, 1],
  });

  // Fundo bege de Beauty ao abrir/rodar a folha
  const beautyBgFade = beautyBookAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  // BARBER INTERPOLATIONS (virar -180° e fechar completamente sobre o lado esquerdo)
  const barberRotateY = barberBookAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-180deg'],
  });

  const barberTranslateX = barberBookAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -halfWidth],
  });

  // O conteúdo frontal (textos) dissolve-se suavemente à medida que a capa vira de costas
  const barberFrontContentOpacity = barberBookAnim.interpolate({
    inputRange: [0, 0.45, 0.55, 1],
    outputRange: [1, 0.2, 0, 0],
  });

  // Camada que fecha completamente o lado esquerdo a preto (#111116) à medida que a folha aterra
  const barberCoverLeftOpacity = barberBookAnim.interpolate({
    inputRange: [0, 0.45, 0.9, 1],
    outputRange: [0, 0.2, 1, 1],
  });

  // Desvanecimento suave da lombada central dourada quando o livro fecha
  const spineOpacity = turningBranch === 'barber'
    ? barberBookAnim.interpolate({ inputRange: [0, 0.35, 0.65], outputRange: [1, 0.4, 0] })
    : turningBranch === 'beauty'
    ? beautyBookAnim.interpolate({ inputRange: [0, 0.35, 0.65], outputRange: [1, 0.4, 0] })
    : 1;

  return (
    <View style={styles.homeContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D11" />

      {/* Camada de fundo interior do livro: lado esquerdo bege (#FAF7F2), lado direito escuro (#0D0D11) */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.underlayRow}>
          <View style={styles.beautyUnderlay} />
          <View style={styles.barberUnderlay} />
        </View>
      </View>

      {/* Ao rodar a mulher, o fundo global transita suavemente para o tom bege (#FAF7F2) */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: '#FAF7F2',
            opacity: beautyBgFade,
          },
        ]}
        pointerEvents="none"
      />

      {/* Camada que fecha completamente o lado esquerdo a preto quando Barber é selecionado */}
      <Animated.View
        style={[
          styles.leftCoverOverlay,
          {
            opacity: barberCoverLeftOpacity,
          },
        ]}
        pointerEvents="none"
      />

      {/* Camada que fecha completamente o lado direito a branco/bege quando Beauty é selecionado */}
      <Animated.View
        style={[
          styles.rightCoverOverlay,
          {
            opacity: beautyCoverRightOpacity,
          },
        ]}
        pointerEvents="none"
      />

      <Animated.View style={[styles.cardsRow, { opacity: buttonsFadeAnim }]}>
        {/* BEAUTY — ESQUERDA (Branco e Dourado com interior Bege) */}
        <Animated.View
          style={[
            styles.cardWrapper,
            {
              backgroundColor: '#FAF7F2',
              zIndex: turningBranch === 'beauty' ? 50 : 1,
              elevation: turningBranch === 'beauty' ? 50 : 1,
              transform: [
                { perspective: 1200 },
                { translateX: beautyTranslateX },
                { rotateY: beautyRotateY },
              ],
            },
            turningBranch === 'beauty' && styles.cardTurningBeauty,
          ]}
        >
          <TouchableOpacity
            style={styles.beautyCard}
            onPress={handleBeautyPress}
            onLongPress={onOpenPinModal}
            delayLongPress={1200}
            activeOpacity={0.85}
          >
            <Animated.View style={[styles.cardContent, { opacity: beautyFrontContentOpacity }]}>
              <Text style={styles.beautyTitle}>ALMARE</Text>
              <Text style={styles.beautySubtitle}>ESTÉTICA</Text>
              <View style={styles.beautyLine} />

              {/* Rosto feminino por baixo de estética */}
              <View style={styles.faceWrapper}>
                <Image
                  source={require('../../assets/woman_face.png')}
                  style={styles.womanFace}
                  resizeMode="contain"
                />
              </View>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>

        {/* Lombada central dourada do livro */}
        <Animated.View style={[styles.spineDivider, { opacity: spineOpacity }]} />

        {/* BARBER — DIREITA (Preto e Dourado) */}
        <Animated.View
          style={[
            styles.cardWrapper,
            {
              backgroundColor: '#111116',
              zIndex: turningBranch === 'barber' ? 50 : 1,
              elevation: turningBranch === 'barber' ? 50 : 1,
              transform: [
                { perspective: 1200 },
                { translateX: barberTranslateX },
                { rotateY: barberRotateY },
              ],
            },
            turningBranch === 'barber' && styles.cardTurningBarber,
          ]}
        >
          <TouchableOpacity
            style={styles.barberCard}
            onPress={handleBarberPress}
            onLongPress={onOpenPinModal}
            delayLongPress={1200}
            activeOpacity={0.85}
          >
            <Animated.View style={[styles.cardContent, { opacity: barberFrontContentOpacity }]}>
              <Text style={styles.barberTitle}>ALMARE</Text>
              <Text style={styles.barberSubtitle}>BARBER</Text>
              <View style={styles.barberLine} />

              {/* Rosto masculino por baixo de barber */}
              <View style={styles.faceWrapper}>
                <Image
                  source={require('../../assets/man_face.png')}
                  style={styles.manFace}
                  resizeMode="contain"
                />
              </View>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  homeContainer: {
    flex: 1,
    backgroundColor: '#0D0D11',
  },
  underlayRow: {
    flex: 1,
    flexDirection: 'row',
  },
  beautyUnderlay: {
    flex: 1,
    backgroundColor: '#FAF7F2',
  },
  barberUnderlay: {
    flex: 1,
    backgroundColor: '#0D0D11',
  },
  leftCoverOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: halfWidth,
    backgroundColor: '#111116',
    zIndex: 35,
  },
  rightCoverOverlay: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: halfWidth,
    backgroundColor: '#FAF7F2',
    zIndex: 35,
  },
  cardsRow: {
    flex: 1,
    flexDirection: 'row',
  },
  cardWrapper: {
    flex: 1,
    height: '100%',
  },
  /* BEAUTY — esquerda: fundo branco */
  beautyCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 0.5,
    borderRightColor: '#E2E8F0',
    position: 'relative',
    overflow: 'hidden',
  },
  faceWrapper: {
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  womanFace: {
    width: Math.min(halfWidth * 0.72, 160),
    height: Math.min(halfWidth * 0.72, 160),
    opacity: 0.88,
  },
  manFace: {
    width: Math.min(halfWidth * 0.72, 160),
    height: Math.min(halfWidth * 0.72, 160),
    opacity: 0.88,
  },
  cardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  beautyTitle: {
    color: '#B8860B',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 5,
  },
  beautySubtitle: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 8,
    marginTop: 2,
  },
  beautyLine: {
    marginTop: 14,
    width: 32,
    height: 1.5,
    backgroundColor: '#B8860B',
  },

  cardTurningBeauty: {
    shadowColor: '#000',
    shadowOffset: { width: 10, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 20,
  },
  cardTurningBarber: {
    shadowColor: '#000',
    shadowOffset: { width: -10, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 20,
  },

  /* Lombada central do livro */
  spineDivider: {
    width: 2,
    backgroundColor: Theme.colors.brandSecondary,
    opacity: 0.7,
    zIndex: 5,
  },

  /* BARBER — direita: fundo carvão/preto premium */
  barberCard: {
    flex: 1,
    backgroundColor: '#111116',
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 0.5,
    borderLeftColor: '#272733',
    position: 'relative',
    overflow: 'hidden',
  },

  barberTitle: {
    color: '#D4AF37',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 5,
  },
  barberSubtitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 8,
    marginTop: 2,
  },
  barberLine: {
    marginTop: 14,
    width: 32,
    height: 1.5,
    backgroundColor: '#D4AF37',
  },
});
