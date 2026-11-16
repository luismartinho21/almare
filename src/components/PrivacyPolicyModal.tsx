import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  ScrollView,
  Linking,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { formatWhatsAppPhone } from '../utils/reminderHelper';

export const PUBLIC_PRIVACY_POLICY_URL = 'https://almarebarberbeauty.online/privacy.html';

interface PrivacyPolicyModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ visible, onClose }) => {
  const { config, activeBranch } = useApp();
  const isBarber = activeBranch !== 'beauty';
  const shopPhone = isBarber ? config.barberPhone : config.beautyPhone;
  const shopName = isBarber ? config.barberShopName : config.beautyShopName;

  const handleOpenPublicUrl = () => {
    Linking.openURL(PUBLIC_PRIVACY_POLICY_URL);
  };

  const handleContactCancelOrPrivacy = () => {
    const msg = `Olá ${shopName}! Gostaria de solicitar o cancelamento/alteração de uma marcação ou informações sobre os meus dados pessoais.`;
    if (!shopPhone) {
      Linking.openURL(
        `mailto:Almare.lda2026@gmail.com?subject=${encodeURIComponent('Marcação / Dados pessoais')}&body=${encodeURIComponent(msg)}`
      );
      return;
    }
    const cleanPhone = formatWhatsAppPhone(shopPhone);
    Linking.openURL(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={e => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.badgeText}>INFORMAÇÃO LEGAL & RGPD</Text>
              <Text style={styles.title}>Privacidade & Condições de Cancelamento</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeIconBtn}>
              <Text style={styles.closeIconText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Condições de Cancelamento */}
            <View style={styles.sectionBox}>
              <Text style={styles.sectionTitle}>1. Condições de Marcação e Cancelamento</Text>
              <Text style={styles.paragraph}>
                • <Text style={styles.bold}>Pagamento Presencial:</Text> A aplicação Almare destina-se exclusivamente ao agendamento de serviços. Nenhum pagamento é cobrado online na app; o pagamento é realizado presencialmente no salão.
              </Text>
              <Text style={styles.paragraph}>
                • <Text style={styles.bold}>Cancelamento Gratuito:</Text> Pode cancelar ou reagendar a sua marcação sem custos, solicitando-o com pelo menos <Text style={styles.bold}>24 horas</Text> (ou mínimo de 3 horas) de antecedência através do WhatsApp ou telefone do salão.
              </Text>
              <Text style={styles.paragraph}>
                • <Text style={styles.bold}>Experiências a Dois (Grand Romance):</Text> Por incluírem reserva em restaurante parceiro, alterações ou cancelamentos devem ser comunicados com um mínimo de <Text style={styles.bold}>24 horas de antecedência</Text>.
              </Text>
              <Text style={styles.paragraph}>
                • <Text style={styles.bold}>Tolerância de Atraso:</Text> Existe uma tolerância máxima de 15 minutos face ao horário agendado para garantir a pontualidade dos restantes clientes.
              </Text>
            </View>

            {/* Política de Privacidade */}
            <View style={styles.sectionBox}>
              <Text style={styles.sectionTitle}>2. Dados Recolhidos e Finalidade (RGPD)</Text>
              <Text style={styles.paragraph}>
                • <Text style={styles.bold}>Dados Solicitados:</Text> Recolhemos apenas o seu <Text style={styles.bold}>Nome</Text> e <Text style={styles.bold}>Número de Telemóvel</Text> no momento da reserva, sem necessidade de registo de conta ou palavra-passe.
              </Text>
              <Text style={styles.paragraph}>
                • <Text style={styles.bold}>Uso Exclusivo:</Text> Os dados destinam-se exclusivamente à gestão da agenda, identificação da reserva no salão e envio de lembretes do serviço agendado.
              </Text>
              <Text style={styles.paragraph}>
                • <Text style={styles.bold}>Sem Partilha Comercial:</Text> A Almare não vende, não aluga nem partilha os seus dados com terceiros para fins publicitários ou de rastreamento (tracking).
              </Text>
            </View>

            {/* Direitos do Utilizador */}
            <View style={styles.sectionBox}>
              <Text style={styles.sectionTitle}>3. Eliminação de Dados e Contacto Direto</Text>
              <Text style={styles.paragraph}>
                Nos termos do RGPD e das diretrizes da App Store e Google Play, pode solicitar a qualquer momento o cancelamento de uma reserva ou a <Text style={styles.bold}>eliminação imediata dos seus dados</Text> através do email <Text style={styles.bold}>Almare.lda2026@gmail.com</Text>{shopPhone ? ` ou do contacto ${shopPhone}` : ''}.
              </Text>
            </View>

            {/* Botões de Ação Direta */}
            <TouchableOpacity
              style={styles.publicLinkBtn}
              onPress={handleOpenPublicUrl}
              activeOpacity={0.85}
            >
              <Text style={styles.publicLinkBtnText}>
                🌐 Abrir Política de Privacidade Pública (Web)
              </Text>
              <Text style={styles.publicLinkUrlText} numberOfLines={1}>
                {PUBLIC_PRIVACY_POLICY_URL}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.whatsappCancelBtn}
              onPress={handleContactCancelOrPrivacy}
              activeOpacity={0.85}
            >
              <Text style={styles.whatsappCancelBtnText}>
                💬 Cancelar Marcação / Gerir Dados via WhatsApp
              </Text>
            </TouchableOpacity>
          </ScrollView>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.closeBtnText}>Fechar</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#13131A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '88%',
    borderWidth: 1,
    borderColor: '#2E2E3E',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#D4AF37',
    letterSpacing: 1.2,
    marginBottom: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F9FAFB',
  },
  closeIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#22222E',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  closeIconText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '800',
  },
  scrollArea: {
    marginBottom: 12,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  sectionBox: {
    backgroundColor: '#1B1B24',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A38',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#D4AF37',
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 12,
    lineHeight: 18,
    color: '#D1D5DB',
    marginBottom: 6,
  },
  bold: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  publicLinkBtn: {
    backgroundColor: '#232016',
    borderWidth: 1,
    borderColor: '#D4AF37',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  publicLinkBtnText: {
    color: '#D4AF37',
    fontSize: 13,
    fontWeight: '800',
  },
  publicLinkUrlText: {
    color: '#9CA3AF',
    fontSize: 10,
    marginTop: 2,
  },
  whatsappCancelBtn: {
    backgroundColor: '#1E2923',
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginBottom: 6,
  },
  whatsappCancelBtnText: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '800',
  },
  closeBtn: {
    backgroundColor: '#D4AF37',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#0D0D11',
    fontSize: 14,
    fontWeight: '900',
  },
});
