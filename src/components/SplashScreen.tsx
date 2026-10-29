import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Image, Dimensions, Easing } from 'react-native';
import { Theme } from '../constants/theme';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinished: () => void;
}

export function SplashScreen({ onFinished }: SplashScreenProps) {
  // Transição 100% contínua sem parar a meio, lenta, majestosa e super fluida
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 3800, // Duração lenta, serena e fluida
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      onFinished();
    });
  }, [progress, onFinished]);

  // Escala contínua sem paragens:
  // Começa subtil em 0.65, aproxima-se continuamente e expande até 9.0 ultrapassando o ecrã
  const scale = progress.interpolate({
    inputRange: [0, 0.45, 0.75, 1],
    outputRange: [0.65, 1.15, 2.3, 9.0],
  });

  // Opacidade contínua:
  // Fade in suave inicial (0 -> 1), mantém-se 100% nítido e dissolve suavemente na expansão final
  const opacity = progress.interpolate({
    inputRange: [0, 0.22, 0.74, 1],
    outputRange: [0, 1, 1, 0],
  });

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
          source={require('../../assets/splash_logo.jpeg')}
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
    backgroundColor: '#000000',
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
