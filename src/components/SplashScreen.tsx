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
    // 1) O logo surge do fundo (scale 0.6 -> 1.25) aproximando-se do utilizador até aos limites do ecrã com fade in suave
    // 2) Seguidamente, continua a expandir suavemente (scale 1.25 -> 1.5) enquanto desvanece suavemente (fade out)
    Animated.sequence([
      // FASE 1: Vem em direção ao utilizador até cobrir/atingir os limites do ecrã (2400ms)
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 1800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1.25,
          duration: 2500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      // FASE 2: Fica um instante no pico de impacto (500ms)
      Animated.delay(400),
      // FASE 3: Desvanece suavemente em fade out fluído (1800ms) continuando a respirar
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 1600,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1.45,
          duration: 1600,
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
          source={require('../../assets/logo.jpg')}
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
