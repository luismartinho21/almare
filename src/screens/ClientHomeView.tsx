import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Linking } from 'react-native';
import { SalonBranch } from '../types';
import { useApp } from '../context/AppContext';
import { Theme } from '../constants/theme';

interface ClientHomeViewProps {
  onSelectBranch: (branch: SalonBranch) => void;
}

export const ClientHomeView: React.FC<ClientHomeViewProps> = ({ onSelectBranch }) => {
  const { config } = useApp();

  const handleOpenMap = (address: string) => {
    const query = encodeURIComponent(address);
    Linking.openURL(`https://maps.google.com/?q=${query}`);
  };

  const galleryImages = [
    {
      url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400',
      title: 'Corte Fade & Barba',
      category: 'Homens • Preto & Dourado',
      tagBg: '#D4AF37',
      tagColor: '#0D0D11',
    },
    {
      url: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400',
      title: 'Brushing & Styling',
      category: 'Mulheres • Branco & Dourado',
      tagBg: '#FFFDF5',
      tagColor: '#996515',
    },
    {
      url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400',
      title: 'Ritual Barba a Navalha',
      category: 'Homens • Preto & Dourado',
      tagBg: '#D4AF37',
      tagColor: '#0D0D11',
    },
    {
      url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400',
      title: 'Verniz Gel & Nail Art',
      category: 'Mulheres • Branco & Dourado',
      tagBg: '#FFFDF5',
      tagColor: '#996515',
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Top Hero Logo Header */}
      <View style={styles.heroHeader}>
        <Image
          source={require('../../assets/logo.jpg')}
          style={styles.heroLogo}
          resizeMode="contain"
        />
        <Text style={styles.brandTitle}>ALMARE</Text>
        <Text style={styles.brandSub}>BARBEARIA ✕ ESTÉTICA</Text>
        <Text style={styles.brandDesc}>
          Experiência de luxo personalizada para <Text style={styles.goldText}>Homens</Text> (Preto & Dourado) e para{' '}
          <Text style={styles.goldLightText}>Mulheres</Text> (Branco & Dourado).
        </Text>
      </View>

      {/* SPLIT SCREEN DUAL BANNER: HOMENS (PRETO & DOURADO) | MULHERES (BRANCO & DOURADO) */}
      <View style={styles.splitBannerRow}>
        {/* LEFT CARD: HOMENS (PRETO E DOURADO) */}
        <TouchableOpacity
          style={styles.splitLeftCard}
          onPress={() => onSelectBranch('barber')}
          activeOpacity={0.9}
        >
          <View style={styles.goldBadgeBarber}>
            <Text style={styles.goldBadgeBarberText}>HOMENS</Text>
          </View>
          <Text style={styles.splitIcon}>💈</Text>
          <Text style={styles.splitTitleBarber}>ALMARE BARBER</Text>
          <Text style={styles.splitThemeTagBarber}>✦ PRETO & DOURADO ✦</Text>
          <Text style={styles.splitSubBarber}>Cabelo & Barba</Text>
          <Text style={styles.splitDescBarber}>Fade, Barba a Navalha & Rituais VIP</Text>
          <View style={styles.splitBtnBarber}>
            <Text style={styles.splitBtnTextBarber}>AGENDAR ›</Text>
          </View>
        </TouchableOpacity>

        {/* RIGHT CARD: MULHERES (BRANCO E DOURADO) */}
        <TouchableOpacity
          style={styles.splitRightCard}
          onPress={() => onSelectBranch('beauty')}
          activeOpacity={0.9}
        >
          <View style={styles.goldBadgeBeauty}>
            <Text style={styles.goldBadgeBeautyText}>MULHERES</Text>
          </View>
          <Text style={styles.splitIcon}>💅</Text>
          <Text style={styles.splitTitleBeauty}>ALMARE BEAUTY</Text>
          <Text style={styles.splitThemeTagBeauty}>✦ BRANCO & DOURADO ✦</Text>
          <Text style={styles.splitSubBeauty}>Cabelo, Estética & Unhas</Text>
          <Text style={styles.splitDescBeauty}>Coloração, Brushing & Hydra-Facial</Text>
          <View style={styles.splitBtnBeauty}>
            <Text style={styles.splitBtnTextBeauty}>AGENDAR ›</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ============================================================== */}
      {/* SCROLL DOWN CONTENT: GALERIA, HISTÓRIA & CONTACTOS */}
      {/* ============================================================== */}

      {/* SECTION 1: GALERIA DE TRABALHOS & SERVIÇOS */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>📸</Text>
          <View>
            <Text style={styles.sectionTitle}>GALERIA DE SERVIÇOS</Text>
            <Text style={styles.sectionSubtitle}>Inspiração & Trabalhos no Espaço Almare</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryScroll}>
          {galleryImages.map((img, index) => (
            <View key={index} style={styles.galleryCard}>
              <Image source={{ uri: img.url }} style={styles.galleryImg} />
              <View style={styles.galleryOverlay}>
                <View style={[styles.galleryTag, { backgroundColor: img.tagBg }]}>
                  <Text style={[styles.galleryTagText, { color: img.tagColor }]}>{img.category}</Text>
                </View>
                <Text style={styles.galleryTitle}>{img.title}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* SECTION 2: A NOSSA HISTÓRIA */}
      <View style={styles.aboutCard}>
        <Text style={styles.aboutBadge}>A NOSSA ESSÊNCIA</Text>
        <Text style={styles.aboutTitle}>Conceito & História Almare</Text>
        <Text style={styles.aboutText}>
          A <Text style={{ color: Theme.colors.brandSecondary, fontWeight: '700' }}>Almare</Text> nasceu da paixão pela excelência no atendimento e pelo cuidado personalizado. Criámos um conceito duplo exclusivo: um santuário <Text style={{ color: '#D4AF37', fontWeight: '800' }}>Preto & Dourado</Text> para Homens, e uma atmosfera refinada <Text style={{ color: '#E6D5AC', fontWeight: '800' }}>Branco & Dourado</Text> para Mulheres.
        </Text>
        <Text style={styles.aboutQuote}>
          "O detalhe não é apenas um pormenor — é a nossa assinatura."
        </Text>
      </View>

      {/* SECTION 3: LOCALIZAÇÃO & CONTACTOS */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>📍</Text>
          <View>
            <Text style={styles.sectionTitle}>CONTACTOS & LOCALIZAÇÃO</Text>
            <Text style={styles.sectionSubtitle}>Visite os nossos espaços em Lisboa</Text>
          </View>
        </View>

        {/* BARBER LOCATION CARD (PRETO E DOURADO) */}
        <View style={styles.contactCardBarber}>
          <View style={styles.contactHeader}>
            <Text style={styles.contactShopTitleBarber}>💈 Almare Barber (Homens)</Text>
            <TouchableOpacity onPress={() => handleOpenMap(config.barberAddress)}>
              <Text style={styles.mapLinkBarber}>🗺️ Ver no Mapa</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.contactAddressBarber}>📍 {config.barberAddress}</Text>
          <Text style={styles.contactPhoneBarber}>📞 {config.barberPhone}</Text>
          <Text style={styles.contactHoursBarber}>🕒 {config.barberOpenDays}</Text>
        </View>

        {/* BEAUTY LOCATION CARD (BRANCO E DOURADO) */}
        <View style={styles.contactCardBeauty}>
          <View style={styles.contactHeader}>
            <Text style={styles.contactShopTitleBeauty}>💅 Almare Beauty (Mulheres)</Text>
            <TouchableOpacity onPress={() => handleOpenMap(config.beautyAddress)}>
              <Text style={styles.mapLinkBeauty}>🗺️ Ver no Mapa</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.contactAddressBeauty}>📍 {config.beautyAddress}</Text>
          <Text style={styles.contactPhoneBeauty}>📞 {config.beautyPhone}</Text>
          <Text style={styles.contactHoursBeauty}>🕒 {config.beautyOpenDays}</Text>
        </View>
      </View>

      {/* SECTION 4: TESTEMUNHOS & AVALIAÇÕES */}
      <View style={styles.reviewsCard}>
        <Text style={styles.reviewsRating}>⭐ 4.9 / 5.0</Text>
        <Text style={styles.reviewsSub}>Classificação Média pelos nossos Clientes</Text>

        <View style={styles.reviewItem}>
          <Text style={styles.reviewText}>
            "Melhor degradê e atendimento em Lisboa. O espaço Preto & Dourado é de alto nível!"
          </Text>
          <Text style={styles.reviewAuthor}>— Pedro M. (Almare Barber)</Text>
        </View>

        <View style={styles.reviewItem}>
          <Text style={styles.reviewText}>
            "Espaço Branco & Dourado espetacular! Fiz a coloração e brushing com a Sofia."
          </Text>
          <Text style={styles.reviewAuthor}>— Sofia C. (Almare Beauty)</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D11',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  heroHeader: {
    alignItems: 'center',
    marginVertical: 10,
  },
  heroLogo: {
    width: 80,
    height: 80,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: Theme.colors.brandSecondary,
  },
  brandTitle: {
    color: Theme.colors.brandSecondary,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 4,
  },
  brandSub: {
    color: '#D1D5DB',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: -2,
    marginBottom: 6,
  },
  brandDesc: {
    color: '#9CA3AF',
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 330,
    lineHeight: 17,
  },
  goldText: {
    color: '#D4AF37',
    fontWeight: '800',
  },
  goldLightText: {
    color: '#F3E5AB',
    fontWeight: '800',
  },
  splitBannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
  },
  /* HOMENS: PRETO E DOURADO */
  splitLeftCard: {
    flex: 1,
    backgroundColor: '#0D0D11', // Deep Black
    borderColor: '#D4AF37',     // Metallic Gold
    borderWidth: 2,
    borderRadius: 16,
    padding: 14,
    marginRight: 6,
    alignItems: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  goldBadgeBarber: {
    backgroundColor: '#2A2415',
    borderColor: '#D4AF37',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 8,
  },
  goldBadgeBarberText: {
    color: '#D4AF37',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  splitIcon: {
    fontSize: 26,
    marginBottom: 4,
  },
  splitTitleBarber: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  splitThemeTagBarber: {
    color: '#D4AF37',
    fontSize: 9,
    fontWeight: '800',
    marginVertical: 2,
  },
  splitSubBarber: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  splitDescBarber: {
    color: '#94A3B8',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
    marginBottom: 12,
    height: 28,
  },
  splitBtnBarber: {
    backgroundColor: '#D4AF37',
    width: '100%',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  splitBtnTextBarber: {
    color: '#0D0D11',
    fontSize: 11,
    fontWeight: '900',
  },

  /* MULHERES: BRANCO E DOURADO */
  splitRightCard: {
    flex: 1,
    backgroundColor: '#FFFFFF', // Pure White
    borderColor: '#D4AF37',     // Metallic Gold
    borderWidth: 2,
    borderRadius: 16,
    padding: 14,
    marginLeft: 6,
    alignItems: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  goldBadgeBeauty: {
    backgroundColor: '#FFFDF0',
    borderColor: '#D4AF37',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginBottom: 8,
  },
  goldBadgeBeautyText: {
    color: '#996515',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  splitTitleBeauty: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  splitThemeTagBeauty: {
    color: '#B8860B',
    fontSize: 9,
    fontWeight: '800',
    marginVertical: 2,
  },
  splitSubBeauty: {
    color: '#374151',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  splitDescBeauty: {
    color: '#6B7280',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
    marginBottom: 12,
    height: 28,
  },
  splitBtnBeauty: {
    backgroundColor: '#D4AF37',
    width: '100%',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  splitBtnTextBeauty: {
    color: '#0D0D11',
    fontSize: 11,
    fontWeight: '900',
  },

  sectionContainer: {
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  sectionTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1,
  },
  sectionSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
  },
  galleryScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  galleryCard: {
    width: 200,
    height: 140,
    borderRadius: 14,
    overflow: 'hidden',
    marginRight: 12,
    backgroundColor: '#1E1E24',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#3D3418',
  },
  galleryImg: {
    width: '100%',
    height: '100%',
  },
  galleryOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    padding: 8,
  },
  galleryTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 2,
  },
  galleryTagText: {
    fontSize: 9,
    fontWeight: '800',
  },
  galleryTitle: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  aboutCard: {
    backgroundColor: '#18181C',
    borderColor: Theme.colors.brandSecondary,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    marginTop: 24,
  },
  aboutBadge: {
    color: Theme.colors.brandSecondary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  aboutTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 10,
  },
  aboutText: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 19,
  },
  aboutQuote: {
    color: Theme.colors.brandSecondary,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 12,
    textAlign: 'center',
  },
  contactCardBarber: {
    backgroundColor: '#0D0D11', // Preto e Dourado
    borderColor: '#D4AF37',
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  contactCardBeauty: {
    backgroundColor: '#FFFFFF', // Branco e Dourado
    borderColor: '#D4AF37',
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  contactShopTitleBarber: {
    color: '#D4AF37',
    fontSize: 15,
    fontWeight: '900',
  },
  contactShopTitleBeauty: {
    color: '#B8860B',
    fontSize: 15,
    fontWeight: '900',
  },
  mapLinkBarber: {
    color: '#D4AF37',
    fontSize: 11,
    fontWeight: '800',
  },
  mapLinkBeauty: {
    color: '#996515',
    fontSize: 11,
    fontWeight: '800',
  },
  contactAddressBarber: {
    color: '#E2E8F0',
    fontSize: 12,
    marginBottom: 3,
  },
  contactAddressBeauty: {
    color: '#1F2937',
    fontSize: 12,
    marginBottom: 3,
  },
  contactPhoneBarber: {
    color: '#CBD5E1',
    fontSize: 12,
    marginBottom: 3,
  },
  contactPhoneBeauty: {
    color: '#374151',
    fontSize: 12,
    marginBottom: 3,
  },
  contactHoursBarber: {
    color: '#94A3B8',
    fontSize: 11,
  },
  contactHoursBeauty: {
    color: '#6B7280',
    fontSize: 11,
  },
  reviewsCard: {
    backgroundColor: '#18181C',
    borderRadius: 16,
    padding: 18,
    marginTop: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#27272A',
  },
  reviewsRating: {
    color: '#F59E0B',
    fontSize: 22,
    fontWeight: '900',
  },
  reviewsSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginBottom: 14,
  },
  reviewItem: {
    backgroundColor: '#27272A',
    padding: 12,
    borderRadius: 10,
    width: '100%',
    marginBottom: 8,
  },
  reviewText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontStyle: 'italic',
  },
  reviewAuthor: {
    color: Theme.colors.brandSecondary,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'right',
  },
});
