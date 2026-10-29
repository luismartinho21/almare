import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  View,
  Image,
  Dimensions,
  Easing,
  TouchableWithoutFeedback,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinished: () => void;
}

export function SplashScreen({ onFinished }: SplashScreenProps) {
  // Fase 1: Zoom linear continuo ("vem tudo")
  const zoomProgress = useRef(new Animated.Value(0)).current;
  // Fase 2: Fade out do texto e centralização do "A" ao atingir o pico
  const textFadeProgress = useRef(new Animated.Value(0)).current;
  // Fase 3: Fade out final de saída para a página inicial
  const exitFadeProgress = useRef(new Animated.Value(1)).current;

  // Dimensões proporcionais extraídas da imagem oficial de alta resolução (1254x1254)
  const containerWidth = Math.min(width * 0.85, 380);
  const emblemHeight = containerWidth * (444 / 1254);
  const textHeight = containerWidth * (305 / 1254);
  const gap = containerWidth * (16 / 1254);
  const shiftY = (gap + textHeight) / 2;

  useEffect(() => {
    let isMounted = true;

    // 1. Zoom linear contínuo durante 3800ms à mesma velocidade suave
    Animated.timing(zoomProgress, {
      toValue: 1,
      duration: 3800,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();

    // 2. Transição do texto: ao aproximar-se do pico de zoom (3300ms),
    // o texto dissolve suavemente e o monograma "A" alinha-se ao centro perfeito
    const textFadeTimer = setTimeout(() => {
      if (!isMounted) return;
      Animated.timing(textFadeProgress, {
        toValue: 1,
        duration: 500,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
    }, 3300);

    // 3. Pausa de 3 segundos no maior zoom mostrando EXCLUSIVAMENTE o "A" sem texto:
    // O zoom atinge o pico aos 3800ms + 3000ms de permanência = 6800ms
    const exitTimer = setTimeout(() => {
      if (!isMounted) return;
      Animated.timing(exitFadeProgress, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start(() => {
        if (isMounted) {
          onFinished();
        }
      });
    }, 6800);

    return () => {
      isMounted = false;
      clearTimeout(textFadeTimer);
      clearTimeout(exitTimer);
    };
  }, [zoomProgress, textFadeProgress, exitFadeProgress, onFinished]);

  // Escala linear do arranque pequeno (0.35) até ao pico do maior zoom (1.80)
  const scale = zoomProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 1.8],
  });

  // Fade in inicial suave nos primeiros instantes
  const initialFade = zoomProgress.interpolate({
    inputRange: [0, 0.08],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // Dissolução do texto "ALMARE" ao chegar ao topo
  const textOpacity = textFadeProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  // Deslocamento vertical que traz o "A" para o centro absoluto do ecrã
  const emblemTranslateY = textFadeProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, shiftY],
  });

  return (
    <TouchableWithoutFeedback onPress={onFinished}>
      <Animated.View style={[styles.container, { opacity: exitFadeProgress }]}>
        <Animated.View
          style={[
            styles.zoomWrapper,
            {
              width: containerWidth,
              opacity: initialFade,
              transform: [{ scale }],
            },
          ]}
        >
          {/* Monograma "A" da Almare */}
          <Animated.View
            style={[
              styles.emblemWrapper,
              {
                width: containerWidth,
                height: emblemHeight,
                transform: [{ translateY: emblemTranslateY }],
              },
            ]}
          >
            <Image
              source={require('../../assets/splash_slice_emblem.png')}
              style={styles.image}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Espaço proporcional original entre o símbolo e o texto */}
          <View style={{ height: gap }} />

          {/* Texto "ALMARE" que se desvanece no maior zoom */}
          <Animated.View
            style={[
              styles.textWrapper,
              {
                width: containerWidth,
                height: textHeight,
                opacity: textOpacity,
              },
            ]}
          >
            <Image
              source={require('../../assets/splash_slice_text.png')}
              style={styles.image}
              resizeMode="contain"
            />
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </TouchableWithoutFeedback>
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
  zoomWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emblemWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
