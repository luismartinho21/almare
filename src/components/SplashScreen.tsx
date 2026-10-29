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
      duration: 4800, // Mais lento e sereno, permitindo apreciar o arranque
      easing: Easing.linear, // Movimento puramente linear, sem travar nem parar
      useNativeDriver: true,
    }).start(() => {
      onFinished();
    });
  }, [progress, onFinished]);

  // Escala puramente linear sem qualquer paragem ou alteração de velocidade
  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.70, 8.5],
  });

  // Opacidade contínua:
  // Surge suavemente no início (0 -> 1 em 20%), fica nítido e dissolve suavemente no fim
  const opacity = progress.interpolate({
    inputRange: [0, 0.20, 0.85, 1],
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
