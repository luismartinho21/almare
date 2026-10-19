import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { AppProvider, useApp } from './src/context/AppContext';
import { Header } from './src/components/Header';
import { RoleSelectorModal } from './src/components/RoleSelectorModal';
import { ClientHomeView } from './src/screens/ClientHomeView';
import { BookingFlowView } from './src/screens/BookingFlowView';
import { GestorBarberView } from './src/screens/GestorBarberView';
import { GestorBeautyView } from './src/screens/GestorBeautyView';
import { StaffView } from './src/screens/StaffView';
import { AdminConfigView } from './src/screens/AdminConfigView';
import { SalonBranch } from './src/types';
import { SplashScreen } from './src/components/SplashScreen';

function MainScreen() {
  const { role, setRole, activeBranch, setActiveBranch, activeNotification, dismissNotification } = useApp();
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [inBookingFlow, setInBookingFlow] = useState(false);

  const handleSelectBranch = (branch: SalonBranch) => {
    setActiveBranch(branch);
    setInBookingFlow(true);
  };

  const handleBackToHome = () => {
    setInBookingFlow(false);
  };

  const handleGoHome = () => {
    setRole('client');
    setInBookingFlow(false);
  };

  const renderContent = () => {
    switch (role) {
      case 'client':
        if (inBookingFlow) {
          return <BookingFlowView onBackToHome={handleBackToHome} />;
        }
        return <ClientHomeView onSelectBranch={handleSelectBranch} />;

      case 'gestor_barber':
        return <GestorBarberView />;

      case 'gestor_beauty':
        return <GestorBeautyView />;

      case 'staff':
        return <StaffView />;

      case 'admin':
        return <AdminConfigView />;

      default:
        return <ClientHomeView onSelectBranch={handleSelectBranch} />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D11" />
      {activeNotification && (
        <View
          style={[
            styles.notificationBanner,
            activeNotification.branch === 'barber'
              ? styles.bannerBarber
              : styles.bannerBeauty,
          ]}
        >
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={styles.bannerTitle}>{activeNotification.title}</Text>
            <Text style={styles.bannerMessage}>{activeNotification.message}</Text>
          </View>
          <TouchableOpacity onPress={dismissNotification} style={styles.bannerCloseBtn}>
            <Text style={styles.bannerCloseText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {(role !== 'client' || inBookingFlow) && (
        <Header
          onOpenRoleModal={() => setRoleModalVisible(true)}
          onGoHome={handleGoHome}
        />
      )}

      <View style={styles.mainBody}>{renderContent()}</View>

      <RoleSelectorModal
        visible={roleModalVisible}
        onClose={() => setRoleModalVisible(false)}
      />
    </SafeAreaView>
  );
}

export default function App() {
  const [splashDone, setSplashDone] = useState(false);

  if (!splashDone) {
    return <SplashScreen onFinished={() => setSplashDone(true)} />;
  }

  return (
    <AppProvider>
      <MainScreen />
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0D0D11',
  },
  mainBody: {
    flex: 1,
  },
  notificationBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 999,
  },
  bannerBarber: {
    backgroundColor: '#202029',
    borderColor: '#D4AF37',
  },
  bannerBeauty: {
    backgroundColor: '#FFF8F0',
    borderColor: '#E6D5AC',
  },
  bannerTitle: {
    color: '#D4AF37',
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 2,
  },
  bannerMessage: {
    color: '#F3F4F6',
    fontSize: 12,
    lineHeight: 16,
  },
  bannerCloseBtn: {
    padding: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerCloseText: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '800',
  },
});
