import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { useApp } from '../context/AppContext';
import { Theme } from '../constants/theme';

export const GestorBarberView: React.FC = () => {
  const { appointments, updateAppointmentStatus, staff, services } = useApp();

  const [dateFilter, setDateFilter] = useState<'today' | 'all'>('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('ALL');

  const todayStr = new Date().toISOString().split('T')[0];

  // Filter Barber appointments
  const barberAppointments = useMemo(() => {
    return appointments.filter(app => {
      if (app.branch !== 'barber') return false;
      if (dateFilter === 'today' && app.date !== todayStr) return false;
      if (selectedStaffFilter !== 'ALL' && app.staffId !== selectedStaffFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = app.clientName.toLowerCase().includes(query);
        const matchPhone = app.clientPhone.includes(query);
        const matchService = app.serviceName.toLowerCase().includes(query);
        return matchName || matchPhone || matchService;
      }
      return true;
    });
  }, [appointments, dateFilter, todayStr, selectedStaffFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const todayApps = appointments.filter(a => a.branch === 'barber' && a.date === todayStr);
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

  const barberStaff = useMemo(() => staff.filter(s => s.branch === 'barber'), [staff]);

  return (
    <View style={styles.container}>
      {/* Dashboard Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>💈 PAINEL DE GESTÃO - BARBER</Text>
          <Text style={styles.headerSub}>Almare Barber Shop • Acesso Exclusivo Gestor</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* KPI Stat Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.totalToday}</Text>
            <Text style={styles.statLabel}>Marcações Hoje</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: Theme.colors.barber.accent }]}>
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
            placeholderTextColor="#71717A"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Appointments List Header */}
        <Text style={styles.sectionTitle}>
          Agenda de Marcações ({barberAppointments.length})
        </Text>

        {barberAppointments.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💈</Text>
            <Text style={styles.emptyTitle}>Sem marcações encontradas</Text>
            <Text style={styles.emptySub}>
              Não existem marcações registadas para os filtros selecionados.
            </Text>
          </View>
        ) : (
          barberAppointments.map(app => (
            <View key={app.id} style={styles.appCard}>
              <View style={styles.appCardHeader}>
                <View style={styles.timeBadge}>
                  <Text style={styles.timeBadgeText}>⏰ {app.timeSlot}</Text>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    app.status === 'confirmed' && { backgroundColor: 'rgba(16,185,129,0.2)' },
                    app.status === 'completed' && { backgroundColor: 'rgba(59,130,246,0.2)' },
                    app.status === 'cancelled' && { backgroundColor: 'rgba(239,68,68,0.2)' },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      app.status === 'confirmed' && { color: '#10B981' },
                      app.status === 'completed' && { color: '#3B82F6' },
                      app.status === 'cancelled' && { color: '#EF4444' },
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
                <Text style={styles.serviceName}>✂️ {app.serviceName}</Text>
                <Text style={styles.staffName}>👤 Barbeiro: {app.staffName}</Text>
                <Text style={styles.priceDuration}>
                  💰 {app.servicePrice} € • {app.serviceDuration} min • Data: {app.date}
                </Text>
                {app.notes ? <Text style={styles.notesText}>📝 Nota: "{app.notes}"</Text> : null}
              </View>

              {/* Action Buttons */}
              <View style={styles.actionsRow}>
                {app.status === 'confirmed' && (
                  <TouchableOpacity
                    style={styles.completeBtn}
                    onPress={() => updateAppointmentStatus(app.id, 'completed')}
                  >
                    <Text style={styles.completeBtnText}>Concluir Serviço</Text>
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
    backgroundColor: '#0D0D11',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#18181C',
    borderBottomWidth: 1,
    borderBottomColor: '#27272A',
  },
  headerTitle: {
    color: Theme.colors.barber.accent,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  headerSub: {
    color: '#9CA3AF',
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
    backgroundColor: '#18181C',
    padding: 12,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#27272A',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F4F4F5',
  },
  statLabel: {
    fontSize: 10,
    color: '#9CA3AF',
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
    backgroundColor: '#18181C',
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  toggleBtnActive: {
    backgroundColor: Theme.colors.barber.accent,
    borderColor: Theme.colors.barber.accent,
  },
  toggleBtnText: {
    color: '#A1A1AA',
    fontSize: 12,
    fontWeight: '700',
  },
  toggleBtnTextActive: {
    color: '#111827',
  },
  searchInput: {
    backgroundColor: '#18181C',
    borderColor: '#27272A',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#FFF',
    fontSize: 13,
  },
  sectionTitle: {
    color: '#F4F4F5',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  emptyState: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: '#18181C',
    borderRadius: 14,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    color: '#F3F4F6',
    fontSize: 15,
    fontWeight: '700',
  },
  emptySub: {
    color: '#71717A',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  appCard: {
    backgroundColor: '#18181C',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  appCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeBadge: {
    backgroundColor: '#27272A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  timeBadgeText: {
    color: Theme.colors.barber.accent,
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
    color: '#F4F4F5',
    fontSize: 17,
    fontWeight: '800',
  },
  clientPhone: {
    color: '#9CA3AF',
    fontSize: 13,
    marginTop: 2,
    marginBottom: 10,
  },
  detailsBox: {
    backgroundColor: '#27272A',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  serviceName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  staffName: {
    color: '#D4D4D8',
    fontSize: 12,
    marginTop: 4,
  },
  priceDuration: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 4,
  },
  notesText: {
    color: Theme.colors.barber.accent,
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
});
