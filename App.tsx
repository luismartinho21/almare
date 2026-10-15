import React, { useState } from 'react';
import { StyleSheet, View, SafeAreaView, StatusBar } from 'react-native';
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

function MainScreen() {
  const { role, setRole, activeBranch, setActiveBranch } = useApp();
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
      <Header
        onOpenRoleModal={() => setRoleModalVisible(true)}
        onGoHome={handleGoHome}
      />

      <View style={styles.mainBody}>{renderContent()}</View>

      <RoleSelectorModal
        visible={roleModalVisible}
        onClose={() => setRoleModalVisible(false)}
      />
    </SafeAreaView>
  );
}

export default function App() {
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
});
