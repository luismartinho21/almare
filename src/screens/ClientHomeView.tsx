import React, { useState, useEffect } from 'react';
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
  Linking,
  Platform,
} from 'react-native';
import { SalonBranch } from '../types';
import { PrivacyPolicyModal } from '../components/PrivacyPolicyModal';

interface ClientHomeViewProps {
  onSelectBranch: (branch: SalonBranch) => void;
  onOpenPinModal?: () => void;
}

const { width } = Dimensions.get('window');

export const ClientHomeView: React.FC<ClientHomeViewProps> = ({ onSelectBranch, onOpenPinModal }) => {
  // Lado atualmente a folhear ('beauty' ou 'barber')
  const [turningBranch, setTurningBranch] = useState<'beauty' | 'barber' | null>(null);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [canShowInstallBtn, setCanShowInstallBtn] = useState<boolean>(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
    const isStandalone =
      window.matchMedia?.('(display-mode: standalone)')?.matches ||
      (window.navigator as any)?.standalone === true;
    return !isStandalone;
  });

  // Fade in de entrada inicial
  const [buttonsFadeAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onInstalled = () => setCanShowInstallBtn(false);
    window.addEventListener('almare-app-installed', onInstalled);
    return () => window.removeEventListener('almare-app-installed', onInstalled);
  }, []);

  const handleInstallAppPress = async () => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const promptEvent = (window as any).__almareInstallPrompt;
    if (promptEvent) {
      promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice?.outcome === 'accepted') {
        (window as any).__almareInstallPrompt = null;
        setCanShowInstallBtn(false);
      }
      return;
    }

    const ua = window.navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    if (isIOS) {
      window.alert(
        'Para instalar a App Almare no iPhone/iPad:\n\n1. Toque no botão Partilhar (⬆️) na barra do Safari\n2. Escolha "Adicionar ao Ecrã Principal"'
      );
    } else {
      window.alert(
        'Para instalar a App Almare no seu dispositivo:\n\nAbra o menu do navegador (⋮) e selecione "Instalar aplicação" ou "Adicionar ao ecrã principal".'
      );
    }
  };

  // Valor de animação de 0 a 1 para o fecho tipo livro
  const [beautyBookAnim] = useState(() => new Animated.Value(0));
  const [barberBookAnim] = useState(() => new Animated.Value(0));

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
    if (turningBranch) return;
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
    if (turningBranch) return;
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
        {/* BEAUTY — ESQUERDA (Bege com silhueta feminina de corpo inteiro) */}
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
              <Text style={styles.barberSubtitle}>BARBEARIA</Text>
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

      {/* Botão discreto de Política de Privacidade, Livro de Reclamações & Direitos */}
      {!turningBranch && (
        <Animated.View
          style={[styles.privacyFooterWrapper, { opacity: buttonsFadeAnim }]}
          pointerEvents="box-none"
        >
          <View style={styles.footerPillsRow}>
            {canShowInstallBtn && (
              <TouchableOpacity
                style={[styles.privacyPillBtn, styles.installPillBtn]}
                onPress={handleInstallAppPress}
                activeOpacity={0.85}
              >
                <Text style={[styles.privacyPillText, styles.installPillText]}>
                  📲 Instalar App
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.privacyPillBtn}
              onPress={() => setPrivacyModalVisible(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.privacyPillText}>
                🔒 Privacidade & Cancelamento
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.privacyPillBtn}
              onPress={() => {
                const url = 'https://www.livroreclamacoes.pt/Inicio/';
                if (Platform.OS === 'web' && typeof window !== 'undefined') {
                  window.open(url, '_blank', 'noopener,noreferrer');
                } else {
                  Linking.openURL(url);
                }
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.privacyPillText}>
                📖 Livro de Reclamações
              </Text>
            </TouchableOpacity>
          </View>

          </Animated.View>
      )}

      <PrivacyPolicyModal
        visible={privacyModalVisible}
        onClose={() => setPrivacyModalVisible(false)}
      />
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
    width: Math.min(width * 0.56, 240),
    height: Math.min(width * 0.56, 240),
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

  /* BEAUTY — esquerda: fundo bege limpo sem qualquer rebordo */
  beautyCard: {
    flex: 1,
    backgroundColor: '#FAF7F2',
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
    paddingTop: '22%',
    paddingBottom: '8%',
    paddingHorizontal: '7%',
    zIndex: 1,
  },
  womanSilhouette: {
    width: '80%',
    height: '78%',
    opacity: 0.36,
  },
  manSilhouette: {
    width: '80%',
    height: '78%',
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
    fontSize: 18.5,
    fontWeight: '900',
    letterSpacing: 4.5,
  },
  beautySubtitle: {
    color: '#1F2937',
    fontSize: 11.5,
    fontWeight: '400',
    letterSpacing: 7,
    marginTop: 2,
  },
  beautyLine: {
    marginTop: 11,
    width: 26,
    height: 1.5,
    backgroundColor: '#B8860B',
  },

  barberTitle: {
    color: '#D4AF37',
    fontSize: 18.5,
    fontWeight: '900',
    letterSpacing: 4.5,
  },
  barberSubtitle: {
    color: '#F8FAFC',
    fontSize: 11.5,
    fontWeight: '400',
    letterSpacing: 4.5,
    marginTop: 2,
  },
  barberLine: {
    marginTop: 11,
    width: 26,
    height: 1.5,
    backgroundColor: '#D4AF37',
  },
  privacyFooterWrapper: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    alignItems: 'center',
    zIndex: 30,
  },
  footerPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  privacyPillBtn: {
    backgroundColor: 'rgba(13, 13, 17, 0.84)',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.45)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  privacyPillText: {
    color: '#E5E7EB',
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  installPillBtn: {
    borderColor: '#D4AF37',
    backgroundColor: '#D4AF37',
  },
  installPillText: {
    color: '#0D0D11',
    fontWeight: '800',
  },
  rightsBadge: {
    marginTop: 5,
    backgroundColor: 'rgba(13, 13, 17, 0.55)',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 10,
  },
  rightsText: {
    color: 'rgba(229, 231, 235, 0.65)',
    fontSize: 9.5,
    fontWeight: '500',
    letterSpacing: 0.4,
  },
});
