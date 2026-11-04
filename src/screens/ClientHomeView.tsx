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

interface ClientHomeViewProps {
  onSelectBranch: (branch: SalonBranch) => void;
  onOpenPinModal?: () => void;
}

const { width } = Dimensions.get('window');

export const ClientHomeView: React.FC<ClientHomeViewProps> = ({ onSelectBranch, onOpenPinModal }) => {
  // Lado atualmente a folhear ('beauty' ou 'barber')
  const [turningBranch, setTurningBranch] = useState<'beauty' | 'barber' | null>(null);

  // Fade in de entrada inicial
  const buttonsFadeAnim = useRef(new Animated.Value(0)).current;

  // Valor de animação de 0 a 1 para o fecho tipo livro
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

  // BEAUTY INTERPOLATIONS
  const beautyRotateY = beautyBookAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const beautyFrontContentOpacity = beautyBookAnim.interpolate({
    inputRange: [0, 0.38, 0.5, 1],
    outputRange: [1, 0.1, 0, 0],
  });

  // Transição do lado oposto (Barber) para o tom Bege quando Beauty roda,
  // eliminando qualquer linha divisória ou contraste a meio
  const beautyUnderlayFade = beautyBookAnim.interpolate({
    inputRange: [0, 0.45],
    outputRange: [0, 1],
  });

  // BARBER INTERPOLATIONS
  const barberRotateY = barberBookAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-180deg'],
  });

  const barberFrontContentOpacity = barberBookAnim.interpolate({
    inputRange: [0, 0.38, 0.5, 1],
    outputRange: [1, 0.1, 0, 0],
  });

  // Transição do lado oposto (Beauty) para o tom Preto quando Barber roda,
  // eliminando qualquer linha divisória ou contraste a meio
  const barberUnderlayFade = barberBookAnim.interpolate({
    inputRange: [0, 0.45],
    outputRange: [0, 1],
  });

  // Símbolo Almare no centro da capa fechada
  const emblemOpacity = turningBranch === 'barber'
    ? barberBookAnim.interpolate({
        inputRange: [0, 0.45, 0.85, 1],
        outputRange: [0, 0, 1, 1],
      })
    : turningBranch === 'beauty'
    ? beautyBookAnim.interpolate({
        inputRange: [0, 0.45, 0.85, 1],
        outputRange: [0, 0, 1, 1],
      })
    : 0;

  const emblemScale = turningBranch === 'barber'
    ? barberBookAnim.interpolate({
        inputRange: [0, 0.45, 0.85, 1],
        outputRange: [0.85, 0.85, 1, 1],
      })
    : turningBranch === 'beauty'
    ? beautyBookAnim.interpolate({
        inputRange: [0, 0.45, 0.85, 1],
        outputRange: [0.85, 0.85, 1, 1],
      })
    : 1;

  return (
    <View style={styles.homeContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D11" />

      {/* Camada de fundo global unificada ao rodar:
          Sem divisão nem dobra a meio */}
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
              transformOrigin: 'right center' as any,
              transform: [
                { perspective: 1800 },
                { rotateY: beautyRotateY },
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.beautyCard}
            onPress={handleBeautyPress}
            onLongPress={onOpenPinModal}
            delayLongPress={1200}
            activeOpacity={0.88}
          >
            {/* Silhueta feminina de corpo inteiro */}
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

            {/* Overlay que unifica o fundo da capa estacionária ao virar, eliminando qualquer dobra ou contraste divisório */}
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: '#111116',
                  opacity: barberUnderlayFade,
                  zIndex: 3,
                },
              ]}
              pointerEvents="none"
            />
          </TouchableOpacity>
        </Animated.View>

        {/* BARBER — DIREITA (Preto com silhueta masculina de corpo inteiro) */}
        <Animated.View
          style={[
            styles.cardWrapper,
            {
              backgroundColor: '#111116',
              zIndex: turningBranch === 'barber' ? 50 : 1,
              transformOrigin: 'left center' as any,
              transform: [
                { perspective: 1800 },
                { rotateY: barberRotateY },
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.barberCard}
            onPress={handleBarberPress}
            onLongPress={onOpenPinModal}
            delayLongPress={1200}
            activeOpacity={0.88}
          >
            {/* Silhueta masculina de corpo inteiro */}
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

            {/* Overlay que unifica o fundo da capa estacionária ao virar, eliminando qualquer dobra ou contraste divisório */}
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: '#FAF7F2',
                  opacity: beautyUnderlayFade,
                  zIndex: 3,
                },
              ]}
              pointerEvents="none"
            />
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

  /* BEAUTY — esquerda: fundo branco limpo sem qualquer rebordo */
  beautyCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    position: 'relative',
    overflow: 'hidden',
  },

  /* BARBER — direita: fundo carvão/preto premium sem qualquer rebordo */
  barberCard: {
    flex: 1,
    backgroundColor: '#111116',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
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
});
