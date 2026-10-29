import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Image, Dimensions, Easing } from 'react-native';
import { Theme } from '../constants/theme';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinished: () => void;
}

export function SplashScreen({ onFinished }: SplashScreenProps) {
  // Transição 100% contínua e LINEAR da entrada do Almare sem travar nem parar
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 5400, // Ainda mais suave, sereno e fluido
      easing: Easing.linear, // Movimento contínuo sem travar nem parar
      useNativeDriver: true,
    }).start(() => {
      onFinished();
    });
  }, [progress, onFinished]);

  // Escala ultra-suave na parte inicial:
  // Na primeira metade, aproxima-se com extrema suavidade (0.80 -> 1.25)
  // e de seguida expande suave e continuamente até 8.5
  const scale = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.80, 1.25, 8.5],
  });

  // Opacidade contínua e aveludada:
  // Fade in ultra-suave e gradual no início (0 -> 1 ao longo de 28%)
  const opacity = progress.interpolate({
    inputRange: [0, 0.28, 0.82, 1],
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
