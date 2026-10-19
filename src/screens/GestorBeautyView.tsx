import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Linking } from 'react-native';
import { useApp } from '../context/AppContext';
import { Theme } from '../constants/theme';
import { getGestorNotifyClientWhatsAppUrl } from '../utils/reminderHelper';

export const GestorBeautyView: React.FC = () => {
  const { appointments, updateAppointmentStatus, staff } = useApp();

  const [dateFilter, setDateFilter] = useState<'today' | 'all'>('today');
  const [searchQuery, setSearchQuery] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  // Filter Beauty appointments
  const beautyAppointments = useMemo(() => {
    return appointments.filter(app => {
      if (app.branch !== 'beauty') return false;
      if (dateFilter === 'today' && app.date !== todayStr) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = app.clientName.toLowerCase().includes(query);
        const matchPhone = app.clientPhone.includes(query);
        const matchService = app.serviceName.toLowerCase().includes(query);
        return matchName || matchPhone || matchService;
      }
      return true;
    });
  }, [appointments, dateFilter, todayStr, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const todayApps = appointments.filter(a => a.branch === 'beauty' && a.date === todayStr);
    const confirmedCount = todayApps.filter(a => a.status === 'confirmed').length;
    const totalRevenue = todayApps
      .filter(a => a.status !== 'cancelled')
      .reduce((acc, a) => acc + a.servicePrice, 0);

    return {
      totalToday: todayApps.length,
      confirmedToday: confirmedCount,
      revenueToday: totalRevenue,
    };
  }, [appointments, todayStr]);

  return (
    <View style={styles.container}>
      {/* Dashboard Top Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💅 PAINEL DE GESTÃO - BEAUTY</Text>
        <Text style={styles.headerSub}>Almare Beauty Salon • Acesso Exclusivo Gestor</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* KPI Stat Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalToday}</Text>
            <Text style={styles.statLabel}>Marcações Hoje</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: Theme.colors.beauty.badge }]}>
              {stats.revenueToday.toFixed(0)} €
            </Text>
            <Text style={styles.statLabel}>Faturamento Estimado</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#10B981' }]}>{stats.confirmedToday}</Text>
            <Text style={styles.statLabel}>Vagas Confirmadas</Text>
          </View>
        </View>

        {/* Filter Toolbar */}
        <View style={styles.toolbar}>
          <View style={styles.dateToggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, dateFilter === 'today' && styles.toggleBtnActive]}
              onPress={() => setDateFilter('today')}
            >
              <Text style={[styles.toggleBtnText, dateFilter === 'today' && styles.toggleBtnTextActive]}>
                Hoje ({todayStr})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toggleBtn, dateFilter === 'all' && styles.toggleBtnActive]}
              onPress={() => setDateFilter('all')}
            >
              <Text style={[styles.toggleBtnText, dateFilter === 'all' && styles.toggleBtnTextActive]}>
                Todas as Datas
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <TextInput
            style={styles.searchInput}
            placeholder="🔍 Pesquisar por cliente, telemóvel ou serviço..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Appointments List Header */}
        <Text style={styles.sectionTitle}>
          Agenda de Beleza ({beautyAppointments.length})
        </Text>

        {beautyAppointments.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💅</Text>
            <Text style={styles.emptyTitle}>Sem marcações de beleza encontradas</Text>
            <Text style={styles.emptySub}>
              Não existem agendamentos para os filtros selecionados.
            </Text>
          </View>
        ) : (
          beautyAppointments.map(app => (
            <View key={app.id} style={styles.appCard}>
              <View style={styles.appCardHeader}>
                <View style={styles.timeBadge}>
                  <Text style={styles.timeBadgeText}>⏰ {app.timeSlot}</Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    app.status === 'confirmed' && { backgroundColor: '#D1FAE5' },
                    app.status === 'completed' && { backgroundColor: '#DBEAFE' },
                    app.status === 'cancelled' && { backgroundColor: '#FEE2E2' },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      app.status === 'confirmed' && { color: '#047857' },
                      app.status === 'completed' && { color: '#1D4ED8' },
                      app.status === 'cancelled' && { color: '#B91C1C' },
                    ]}
                  >
                    {app.status === 'confirmed'
                      ? '✓ Confirmado'
                      : app.status === 'completed'
                      ? '★ Concluído'
                      : '✕ Cancelado'}
                  </Text>
                </View>
              </View>

              <Text style={styles.clientName}>{app.clientName}</Text>
              <Text style={styles.clientPhone}>📞 {app.clientPhone}</Text>

              <View style={styles.detailsBox}>
                <Text style={styles.serviceName}>💅 {app.serviceName}</Text>
                <Text style={styles.staffName}>👤 Especialista: {app.staffName}</Text>
                <Text style={styles.priceDuration}>
                  💰 {app.servicePrice} € • {app.serviceDuration} min • Data: {app.date}
                </Text>
                {app.notes ? <Text style={styles.notesText}>📝 Nota: "{app.notes}"</Text> : null}
                <View style={styles.reminderStatusRow}>
                  <Text style={styles.reminderStatusText}>
                    🔔 Lembrete 2h: {app.reminderEnabled !== false ? '✓ Ativo (notificação programada)' : '✕ Inativo'}
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionsRow}>
                {app.status === 'confirmed' && (
                  <TouchableOpacity
                    style={styles.notifyBtn}
                    onPress={() => {
                      const url = getGestorNotifyClientWhatsAppUrl(app, 'Almare Beauty Salon');
                      Linking.openURL(url);
                    }}
                  >
                    <Text style={styles.notifyBtnText}>🔔 Notificar Cliente (2h)</Text>
                  </TouchableOpacity>
                )}

                {app.status === 'confirmed' && (
                  <TouchableOpacity
                    style={styles.completeBtn}
                    onPress={() => updateAppointmentStatus(app.id, 'completed')}
                  >
                    <Text style={styles.completeBtnText}>Concluir</Text>
                  </TouchableOpacity>
                )}

                {app.status !== 'cancelled' && (
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => updateAppointmentStatus(app.id, 'cancelled')}
                  >
                    <Text style={styles.cancelBtnText}>Cancelar</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF5F7',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#3B1C26',
    borderBottomWidth: 1,
    borderBottomColor: '#5B2136',
  },
  headerTitle: {
    color: '#FBCFE8',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  headerSub: {
    color: '#F472B6',
    fontSize: 11,
    marginTop: 2,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#F3E8FF',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  toolbar: {
    marginBottom: 16,
  },
  dateToggleRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  toggleBtnActive: {
    backgroundColor: Theme.colors.beauty.primary,
    borderColor: Theme.colors.beauty.primary,
  },
  toggleBtnText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '700',
  },
  toggleBtnTextActive: {
    color: '#FFF',
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#1F2937',
    fontSize: 13,
  },
  sectionTitle: {
    color: '#1F2937',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  emptyState: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    color: '#1F2937',
    fontSize: 15,
    fontWeight: '700',
  },
  emptySub: {
    color: '#6B7280',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  appCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FBCFE8',
  },
  appCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeBadge: {
    backgroundColor: '#FCE7F3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timeBadgeText: {
    color: Theme.colors.beauty.badge,
    fontSize: 12,
    fontWeight: '800',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  clientName: {
    color: '#1F2937',
    fontSize: 17,
    fontWeight: '800',
  },
  clientPhone: {
    color: '#6B7280',
    fontSize: 13,
    marginTop: 2,
    marginBottom: 10,
  },
  detailsBox: {
    backgroundColor: '#FFF5F7',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  serviceName: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '700',
  },
  staffName: {
    color: '#4B5563',
    fontSize: 12,
    marginTop: 4,
  },
  priceDuration: {
    color: '#6B7280',
    fontSize: 11,
    marginTop: 4,
  },
  notesText: {
    color: Theme.colors.beauty.badge,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  completeBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  completeBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  cancelBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  cancelBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  notifyBtn: {
    backgroundColor: '#25D366',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  notifyBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  reminderStatusRow: {
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#FBCFE8',
  },
  reminderStatusText: {
    color: Theme.colors.beauty.badge,
    fontSize: 11,
    fontWeight: '700',
  },
});
