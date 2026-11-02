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

  // Fade in de entrada dos botões e silhuetas
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

  // BEAUTY INTERPOLATIONS (virar 180° ancorado na lombada como folha de livro)
  const beautyRotateY = beautyBookAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  // O conteúdo frontal (textos e silhueta) dissolve-se suavemente à medida que a capa vira de costas
  const beautyFrontContentOpacity = beautyBookAnim.interpolate({
    inputRange: [0, 0.42, 0.54, 1],
    outputRange: [1, 0.1, 0, 0],
  });

  // Camada que fecha completamente o lado direito a bege/branco (#FAF7F2) à medida que a folha aterra
  const beautyCoverRightOpacity = beautyBookAnim.interpolate({
    inputRange: [0, 0.48, 0.95, 1],
    outputRange: [0, 0, 1, 1],
  });

  // Símbolo Almare no meio ao fechar a folha (simétrico em ambos)
  const emblemOpacity = turningBranch === 'barber'
    ? barberBookAnim.interpolate({
        inputRange: [0, 0.44, 0.88, 1],
        outputRange: [0, 0, 1, 1],
      })
    : turningBranch === 'beauty'
    ? beautyBookAnim.interpolate({
        inputRange: [0, 0.44, 0.88, 1],
        outputRange: [0, 0, 1, 1],
      })
    : 0;

  const emblemScale = turningBranch === 'barber'
    ? barberBookAnim.interpolate({
        inputRange: [0, 0.44, 0.88, 1],
        outputRange: [0.82, 0.82, 1, 1],
      })
    : turningBranch === 'beauty'
    ? beautyBookAnim.interpolate({
        inputRange: [0, 0.44, 0.88, 1],
        outputRange: [0.82, 0.82, 1, 1],
      })
    : 1;

  // BARBER INTERPOLATIONS (virar -180° ancorado na lombada como folha de livro)
  const barberRotateY = barberBookAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-180deg'],
  });

  // O conteúdo frontal (textos e silhueta) dissolve-se suavemente à medida que a capa vira de costas
  const barberFrontContentOpacity = barberBookAnim.interpolate({
    inputRange: [0, 0.42, 0.54, 1],
    outputRange: [1, 0.1, 0, 0],
  });

  // Camada que fecha completamente o lado esquerdo a preto (#111116) à medida que a folha aterra
  const barberCoverLeftOpacity = barberBookAnim.interpolate({
    inputRange: [0, 0.48, 0.95, 1],
    outputRange: [0, 0, 1, 1],
  });

  return (
    <View style={styles.homeContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D11" />

      {/* Camada de fundo interior do livro ao abrir:
          Quando Beauty roda, fundo é 100% bege (#FAF7F2).
          Quando Barber roda, fundo é 100% preto (#111116).
          Sem divisão nem dobra a meio. */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor:
              turningBranch === 'beauty'
                ? '#FAF7F2'
                : turningBranch === 'barber'
                ? '#111116'
                : '#0D0D11',
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

      {/* Símbolo ALMARE centralizado no meio ao fechar a folha */}
      {turningBranch && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.centerEmblemWrapper,
            {
              opacity: emblemOpacity,
              transform: [{ scale: emblemScale }],
            },
          ]}
          pointerEvents="none"
        >
          <Image
            source={
              turningBranch === 'barber'
                ? require('../../assets/splash_logo_transparent.png')
                : require('../../assets/logo_beauty.png')
            }
            style={styles.centerEmblem}
            resizeMode="contain"
          />
        </Animated.View>
      )}

      <Animated.View style={[styles.cardsRow, { opacity: buttonsFadeAnim }]}>
        {/* BEAUTY — ESQUERDA (Branco com silhueta feminina de corpo inteiro e interior Bege) */}
        <Animated.View
          style={[
            styles.cardWrapper,
            {
              backgroundColor: '#FAF7F2',
              zIndex: turningBranch === 'beauty' ? 50 : 1,
              elevation: turningBranch === 'beauty' ? 50 : 1,
              transformOrigin: 'right center' as any,
              transform: [
                { perspective: 1800 },
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
            activeOpacity={0.88}
          >
            {/* Silhueta feminina de corpo inteiro subentendida de vestido */}
            <Animated.View
              style={[
                styles.silhouetteWrapper,
                { opacity: beautyFrontContentOpacity },
              ]}
              pointerEvents="none"
            >
              <Image
                source={require('../../assets/woman_silhouette.png')}
                style={styles.womanSilhouette}
                resizeMode="contain"
              />
            </Animated.View>

            {/* Conteúdo textual */}
            <Animated.View style={[styles.cardContent, { opacity: beautyFrontContentOpacity }]}>
              <Text style={styles.beautyTitle}>ALMARE</Text>
              <Text style={styles.beautySubtitle}>ESTÉTICA</Text>
              <View style={styles.beautyLine} />
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>

        {/* BARBER — DIREITA (Preto com silhueta masculina de corpo inteiro) */}
        <Animated.View
          style={[
            styles.cardWrapper,
            {
              backgroundColor: '#111116',
              zIndex: turningBranch === 'barber' ? 50 : 1,
              elevation: turningBranch === 'barber' ? 50 : 1,
              transformOrigin: 'left center' as any,
              transform: [
                { perspective: 1800 },
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
            activeOpacity={0.88}
          >
            {/* Silhueta masculina de corpo inteiro subentendida de frente */}
            <Animated.View
              style={[
                styles.silhouetteWrapper,
                { opacity: barberFrontContentOpacity },
              ]}
              pointerEvents="none"
            >
              <Image
                source={require('../../assets/man_silhouette.png')}
                style={styles.manSilhouette}
                resizeMode="contain"
              />
            </Animated.View>

            {/* Conteúdo textual */}
            <Animated.View style={[styles.cardContent, { opacity: barberFrontContentOpacity }]}>
              <Text style={styles.barberTitle}>ALMARE</Text>
              <Text style={styles.barberSubtitle}>BARBER</Text>
              <View style={styles.barberLine} />
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>

      {/* Lombada central sutil antes de escolher — desaparece IMEDIATAMENTE ao virar a página para não se ver qualquer dobra */}
      {!turningBranch && (
        <Animated.View
          style={[styles.spineDivider, { opacity: buttonsFadeAnim }]}
          pointerEvents="none"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  homeContainer: {
    flex: 1,
    backgroundColor: '#0D0D11',
  },
  leftCoverOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: halfWidth + 2,
    backgroundColor: '#111116',
    zIndex: 35,
  },
  rightCoverOverlay: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: halfWidth + 2,
    backgroundColor: '#FAF7F2',
    zIndex: 35,
  },
  centerEmblemWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 60,
  },
  centerEmblem: {
    width: Math.min(width * 0.72, 320),
    height: Math.min(width * 0.72, 320),
  },
  cardsRow: {
    flex: 1,
    flexDirection: 'row',
    overflow: 'visible',
  },
  cardWrapper: {
    flex: 1,
    height: '100%',
    overflow: 'visible',
  },

  /* BEAUTY — esquerda: fundo branco */
  beautyCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 0,
    position: 'relative',
    overflow: 'hidden',
  },

  /* BARBER — direita: fundo carvão/preto premium */
  barberCard: {
    flex: 1,
    backgroundColor: '#111116',
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 0,
    position: 'relative',
    overflow: 'hidden',
  },

  /* Silhuetas de corpo inteiro */
  silhouetteWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: '20%',
    paddingBottom: '4%',
    paddingHorizontal: '2%',
    zIndex: 1,
  },
  womanSilhouette: {
    width: '95%',
    height: '92%',
    opacity: 0.36,
  },
  manSilhouette: {
    width: '95%',
    height: '92%',
    opacity: 0.36,
  },

  /* Conteúdo textual das capas */
  cardContent: {
    position: 'absolute',
    top: '12%',
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

  /* Lombada central sutil antes do clique — posicionada de forma absoluta */
  spineDivider: {
    position: 'absolute',
    left: halfWidth - 0.75,
    top: 0,
    bottom: 0,
    width: 1.5,
    backgroundColor: '#D4AF37',
    opacity: 0.6,
    zIndex: 10,
  },
});
