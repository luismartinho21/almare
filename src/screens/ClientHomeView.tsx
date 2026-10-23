import React, { useEffect, useRef } from 'react';
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
  // Fade in de entrada dos 2 botões
  const buttonsFadeAnim = useRef(new Animated.Value(0)).current;

  // Valor de animação de 0 a 1 para o efeito livro rodando para dentro (fechar/folhear em direção ao centro)
  const beautyBookAnim = useRef(new Animated.Value(0)).current;
  const barberBookAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(buttonsFadeAnim, {
      toValue: 1,
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [buttonsFadeAnim]);

  // BEAUTY (Esquerda): Roda PARA DENTRO de forma suave e serena
  const handleBeautyPress = () => {
    Animated.timing(beautyBookAnim, {
      toValue: 1,
      duration: 1350,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      onSelectBranch('beauty');
    });
  };

  // BARBER (Direita): Roda PARA DENTRO de forma suave e serena
  const handleBarberPress = () => {
    Animated.timing(barberBookAnim, {
      toValue: 1,
      duration: 1350,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      onSelectBranch('barber');
    });
  };

  // BEAUTY INTERPOLATIONS (virar e afastar completamente para fora)
  const beautyRotateY = beautyBookAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '110deg'],
  });

  const beautyTranslateX = beautyBookAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, halfWidth * 1.4],
  });

  const beautyOpacity = beautyBookAnim.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [1, 0.6, 0],
  });

  // Fundo bege de Beauty ao abrir/rodar a folha
  const beautyBgFade = beautyBookAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  // BARBER INTERPOLATIONS (virar e afastar completamente para fora)
  const barberRotateY = barberBookAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-110deg'],
  });

  const barberTranslateX = barberBookAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -halfWidth * 1.4],
  });

  const barberOpacity = barberBookAnim.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [1, 0.6, 0],
  });

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

      <Animated.View style={[styles.cardsRow, { opacity: buttonsFadeAnim }]}>
        {/* BEAUTY — ESQUERDA (Branco e Dourado com interior Bege) */}
        <Animated.View
          style={[
            styles.cardWrapper,
            {
              backgroundColor: '#FAF7F2',
              opacity: beautyOpacity,
              transform: [
                { perspective: 1000 },
                { translateX: beautyTranslateX },
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
            activeOpacity={0.85}
          >
            {/* Silhueta subentendida da mulher a preto de vestido de frente */}
            <Image
              source={require('../../assets/woman_silhouette.png')}
              style={styles.womanSilhouette}
              resizeMode="contain"
            />
            <View style={styles.cardContent}>
              <Text style={styles.beautyTitle}>ALMARE</Text>
              <Text style={styles.beautySubtitle}>BEAUTY</Text>
              <View style={styles.beautyLine} />
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Lombada central dourada do livro */}
        <View style={styles.spineDivider} />

        {/* BARBER — DIREITA (Preto e Dourado) */}
        <Animated.View
          style={[
            styles.cardWrapper,
            {
              backgroundColor: '#1E1E28',
              opacity: barberOpacity,
              transform: [
                { perspective: 1000 },
                { translateX: barberTranslateX },
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
            activeOpacity={0.85}
          >
            {/* Silhueta subentendida do homem a branco de frente */}
            <Image
              source={require('../../assets/man_silhouette.png')}
              style={styles.manSilhouette}
              resizeMode="contain"
            />
            <View style={styles.cardContent}>
              <Text style={styles.barberTitle}>ALMARE</Text>
              <Text style={styles.barberSubtitle}>BARBER</Text>
              <View style={styles.barberLine} />
            </View>
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
  womanSilhouette: {
    position: 'absolute',
    bottom: '4%',
    width: '92%',
    height: '80%',
    opacity: 0.17, // Subentendido - subtil, elegante e sem atrapalhar o texto
    alignSelf: 'center',
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

  /* Lombada central do livro */
  spineDivider: {
    width: 2,
    backgroundColor: Theme.colors.brandSecondary,
    opacity: 0.7,
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
  manSilhouette: {
    position: 'absolute',
    bottom: '4%',
    width: '92%',
    height: '80%',
    opacity: 0.18, // Subentendido a branco sobre o fundo escuro
    alignSelf: 'center',
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
