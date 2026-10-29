import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Image, Dimensions, Easing } from 'react-native';
import { Theme } from '../constants/theme';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinished: () => void;
}

export function SplashScreen({ onFinished }: SplashScreenProps) {
  // Transição 100% LINEAR e com o mesmo movimento lento constante por todo o tempo
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 4800, // Duração lenta, serena e uniforme
      easing: Easing.linear, // 100% linear: velocidade rigorosamente constante do início ao fim
      useNativeDriver: true,
    }).start(() => {
      onFinished();
    });
  }, [progress, onFinished]);

  // Escala 100% linear com a mesma velocidade lenta por todo o percurso (sem acelerações)
  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 5.2],
  });

  // Opacidade suave e equilibrada
  const opacity = progress.interpolate({
    inputRange: [0, 0.16, 0.84, 1],
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
