import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Image, Dimensions, Easing } from 'react-native';
import { Theme } from '../constants/theme';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinished: () => void;
}

export function SplashScreen({ onFinished }: SplashScreenProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    // Animação cinematográfica super fluida:
    // 1) O logo surge do fundo (scale 0.65 -> 1.15) aproximando-se com fade in suave
    // 2) Fica um breve instante no centro
    // 3) SAÍDA: O logo vem o MÁXIMO PARA FORA (expande gigante até scale 8.5, ultrapassando totalmente os limites do ecrã)
    Animated.sequence([
      // FASE 1: Entrada do logo aproximando-se com fade in elegante (1300ms)
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 1200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1.15,
          duration: 1400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      // FASE 2: Breve instante no centro para apreciação da marca (450ms)
      Animated.delay(450),
      // FASE 3: SAÍDA DA IMAGEM INICIAL -> VEM O MÁXIMO PARA FORA (expansão suave e serena em direção ao ecrã)
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 1350,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 8.5, // Vem o máximo para fora ultrapassando todos os limites do ecrã
          duration: 1400,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      onFinished();
    });
  }, [opacity, scale, onFinished]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.logoWrapper,
          {
            opacity,
            transform: [{ scale }],
          },
        ]}
      >
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.bgDark,
    alignItems: 'center',
    justifyContent: 'center',
    width,
    height,
    overflow: 'hidden',
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: Math.min(width * 0.85, 380),
    height: Math.min(width * 0.85, 380),
  },
  logo: {
    width: '100%',
    height: '100%',
  },
});
