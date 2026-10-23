import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import { useApp } from '../context/AppContext';
import { SalonBranch } from '../types';
import { Theme } from '../constants/theme';

export type RevenuePeriodFilter = 'all' | 'today' | 'week' | 'month';
export type RevenueBranchFilter = 'all' | 'barber' | 'beauty';

interface FinancialDashboardProps {
  initialBranch?: RevenueBranchFilter;
  variant?: 'dark' | 'beauty';
  lockBranch?: boolean;
}

export const FinancialDashboard: React.FC<FinancialDashboardProps> = ({
  initialBranch = 'all',
  variant = 'dark',
  lockBranch = false,
}) => {
  const { appointments } = useApp();

  const [revenuePeriod, setRevenuePeriod] = useState<RevenuePeriodFilter>('all');
  const [revenueBranch, setRevenueBranch] = useState<RevenueBranchFilter>(initialBranch);
  const [revenueSearch, setRevenueSearch] = useState<string>('');

  // When branch is locked, force to initialBranch
  const activeBranch = lockBranch ? initialBranch : revenueBranch;

  const isBeauty = variant === 'beauty';
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // 1. All completed appointments across the salon
  const allCompletedAppointments = useMemo(() => {
    return appointments
      .filter(a => a.status === 'completed')
      .sort((a, b) => {
        const timeA = new Date(`${a.date}T${a.timeSlot || '00:00'}`).getTime();
        const timeB = new Date(`${b.date}T${b.timeSlot || '00:00'}`).getTime();
        return timeB - timeA;
      });
  }, [appointments]);

  // 2. Filtered completed appointments based on period, branch, and search query
  const filteredCompletedAppointments = useMemo(() => {
    const today = new Date();
    const currentMonthStr = todayStr.substring(0, 7); // YYYY-MM

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    return allCompletedAppointments.filter(app => {
      // Branch filter
      if (activeBranch !== 'all' && app.branch !== activeBranch) return false;

      // Period filter
      if (revenuePeriod === 'today') {
        if (app.date !== todayStr) return false;
      } else if (revenuePeriod === 'week') {
        if (app.date < sevenDaysAgoStr || app.date > todayStr) return false;
      } else if (revenuePeriod === 'month') {
        if (!app.date.startsWith(currentMonthStr)) return false;
      }

      // Search filter
      if (revenueSearch.trim()) {
        const query = revenueSearch.toLowerCase().trim();
        const clientMatch = app.clientName.toLowerCase().includes(query);
        const phoneMatch = app.clientPhone.includes(query);
        const staffMatch = app.staffName.toLowerCase().includes(query);
        const serviceMatch = app.serviceName.toLowerCase().includes(query);
        if (!clientMatch && !phoneMatch && !staffMatch && !serviceMatch) {
          return false;
        }
      }

      return true;
    });
  }, [allCompletedAppointments, revenueBranch, revenuePeriod, revenueSearch, todayStr]);

  // 3. Computed revenue metrics
  const revenueMetrics = useMemo(() => {
    const totalRevenue = filteredCompletedAppointments.reduce((sum, a) => sum + (a.servicePrice || 0), 0);
    const totalCount = filteredCompletedAppointments.length;
    const averageTicket = totalCount > 0 ? totalRevenue / totalCount : 0;

    const barberApps = filteredCompletedAppointments.filter(a => a.branch === 'barber');
    const beautyApps = filteredCompletedAppointments.filter(a => a.branch === 'beauty');

    const barberRevenue = barberApps.reduce((sum, a) => sum + (a.servicePrice || 0), 0);
    const beautyRevenue = beautyApps.reduce((sum, a) => sum + (a.servicePrice || 0), 0);

    const barberPct = totalRevenue > 0 ? Math.round((barberRevenue / totalRevenue) * 100) : 0;
    const beautyPct = totalRevenue > 0 ? Math.round((beautyRevenue / totalRevenue) * 100) : 0;

    // Today stats (all completed in filtered branch)
    const todayApps = allCompletedAppointments.filter(a => {
      if (activeBranch !== 'all' && a.branch !== activeBranch) return false;
      return a.date === todayStr;
    });
    const todayRevenue = todayApps.reduce((sum, a) => sum + (a.servicePrice || 0), 0);

    // Current month stats (all completed in filtered branch)
    const currentMonthStr = todayStr.substring(0, 7);
    const monthApps = allCompletedAppointments.filter(a => {
      if (activeBranch !== 'all' && a.branch !== activeBranch) return false;
      return a.date.startsWith(currentMonthStr);
    });
    const monthRevenue = monthApps.reduce((sum, a) => sum + (a.servicePrice || 0), 0);

    // Breakdown by staff
    const staffMap: Record<string, { staffName: string; branch: SalonBranch; count: number; total: number }> = {};
    filteredCompletedAppointments.forEach(app => {
      const key = app.staffId || app.staffName;
      if (!staffMap[key]) {
        staffMap[key] = {
          staffName: app.staffName,
          branch: app.branch,
          count: 0,
          total: 0,
        };
      }
      staffMap[key].count += 1;
      staffMap[key].total += app.servicePrice || 0;
    });

    const staffBreakdown = Object.values(staffMap).sort((a, b) => b.total - a.total);

    return {
      totalRevenue,
      totalCount,
      averageTicket,
      barberRevenue,
      barberCount: barberApps.length,
      barberPct,
      beautyRevenue,
      beautyCount: beautyApps.length,
      beautyPct,
      todayRevenue,
      todayCount: todayApps.length,
      monthRevenue,
      monthCount: monthApps.length,
      staffBreakdown,
    };
  }, [filteredCompletedAppointments, allCompletedAppointments, revenueBranch, todayStr]);

  return (
    <View style={styles.container}>
      {/* Live Sync Real-time Banner */}
      <View style={[styles.liveSyncBanner, isBeauty && styles.liveSyncBannerBeauty]}>
        <View style={styles.liveSyncHeader}>
          <View style={[styles.liveDot, isBeauty && { backgroundColor: '#059669' }]} />
          <Text style={[styles.liveSyncTitle, isBeauty && { color: '#047857' }]}>
            SINCRONIZAÇÃO FINANCEIRA EM TEMPO REAL
          </Text>
        </View>
        <Text style={[styles.liveSyncSub, isBeauty && { color: '#065F46' }]}>
          {lockBranch
            ? `Toda a marcação ${initialBranch === 'barber' ? 'Almare Barber' : 'Almare Beauty'} marcada como `
            : 'Toda a marcação marcada como '}
          <Text style={{ color: isBeauty ? '#047857' : '#10B981', fontWeight: '800' }}>Concluída</Text>
          {lockBranch
            ? ' pelo gestor é imediatamente creditada e registada nesta receita financeira.'
            : ' pelo gestor é automaticamente creditada e registada nesta receita.'}
        </Text>
      </View>

      {/* 4 Main Financial KPI Cards */}
      <View style={styles.revenueKpiGrid}>
        <View style={[
          styles.kpiCard,
          isBeauty ? styles.kpiCardBeauty : styles.kpiCardDark,
          isBeauty ? styles.kpiCardHighlightBeauty : styles.kpiCardHighlight,
        ]}>
          <Text style={[styles.kpiLabel, isBeauty && { color: '#6B7280' }]}>RECEITA CONCLUÍDA</Text>
          <Text style={[styles.kpiValue, { color: isBeauty ? '#996515' : '#E2B755' }]}>
            {revenueMetrics.totalRevenue.toFixed(2)} €
          </Text>
          <Text style={[styles.kpiSub, isBeauty && { color: '#4B5563' }]}>
            {revenueMetrics.totalCount} {revenueMetrics.totalCount === 1 ? 'atendimento' : 'atendimentos'}
          </Text>
        </View>

        <View style={[styles.kpiCard, isBeauty ? styles.kpiCardBeauty : styles.kpiCardDark]}>
          <Text style={[styles.kpiLabel, isBeauty && { color: '#6B7280' }]}>FATURAÇÃO HOJE</Text>
          <Text style={[styles.kpiValue, { color: '#10B981' }]}>
            {revenueMetrics.todayRevenue.toFixed(2)} €
          </Text>
          <Text style={[styles.kpiSub, isBeauty && { color: '#4B5563' }]}>
            {revenueMetrics.todayCount} hoje
          </Text>
        </View>

        <View style={[styles.kpiCard, isBeauty ? styles.kpiCardBeauty : styles.kpiCardDark]}>
          <Text style={[styles.kpiLabel, isBeauty && { color: '#6B7280' }]}>FATURAÇÃO ESTE MÊS</Text>
          <Text style={[styles.kpiValue, { color: isBeauty ? '#2563EB' : '#60A5FA' }]}>
            {revenueMetrics.monthRevenue.toFixed(2)} €
          </Text>
          <Text style={[styles.kpiSub, isBeauty && { color: '#4B5563' }]}>
            {revenueMetrics.monthCount} no mês
          </Text>
        </View>

        <View style={[styles.kpiCard, isBeauty ? styles.kpiCardBeauty : styles.kpiCardDark]}>
          <Text style={[styles.kpiLabel, isBeauty && { color: '#6B7280' }]}>TICKET MÉDIO</Text>
          <Text style={[styles.kpiValue, { color: isBeauty ? '#BE185D' : '#F472B6' }]}>
            {revenueMetrics.averageTicket.toFixed(2)} €
          </Text>
          <Text style={[styles.kpiSub, isBeauty && { color: '#4B5563' }]}>por cliente concluído</Text>
        </View>
      </View>

      {/* Barber vs Beauty Distribution (only for Admin / unlocked view) */}
      {!lockBranch && (
        <View style={[styles.sectionCard, isBeauty && styles.sectionCardBeauty]}>
          <Text style={[styles.sectionTitle, isBeauty && { color: '#3B1C26' }]}>
            Divisão da Faturação por Salão
          </Text>
          <Text style={[styles.sectionSub, isBeauty && { color: '#6B7280' }]}>
            Comparativo de receita concluída entre Almare Barber e Almare Beauty
          </Text>

          <View style={styles.branchRow}>
            {/* Barber Card */}
            <View style={[styles.branchStatBoxBarber, isBeauty && styles.branchStatBoxBarberBeauty]}>
              <Text style={styles.branchNameBarber}>ALMARE BARBER</Text>
              <Text style={[styles.branchValueBarber, isBeauty && { color: '#1F2937' }]}>
                {revenueMetrics.barberRevenue.toFixed(2)} €
              </Text>
              <Text style={[styles.branchSubBarber, isBeauty && { color: '#4B5563' }]}>
                {revenueMetrics.barberCount} atendimentos ({revenueMetrics.barberPct}%)
              </Text>
            </View>

            {/* Beauty Card */}
            <View style={[styles.branchStatBoxBeauty, isBeauty && styles.branchStatBoxBeautyLight]}>
              <Text style={styles.branchNameBeauty}>ALMARE BEAUTY</Text>
              <Text style={[styles.branchValueBeauty, isBeauty && { color: '#1F2937' }]}>
                {revenueMetrics.beautyRevenue.toFixed(2)} €
              </Text>
              <Text style={[styles.branchSubBeauty, isBeauty && { color: '#4B5563' }]}>
                {revenueMetrics.beautyCount} atendimentos ({revenueMetrics.beautyPct}%)
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Filter Section */}
      <View style={[styles.sectionCard, isBeauty && styles.sectionCardBeauty]}>
        <Text style={[styles.filterHeaderTitle, isBeauty && { color: '#3B1C26' }]}>
          Filtros de Análise Financeira
        </Text>

        {/* Period Filter */}
        <Text style={[styles.filterGroupLabel, isBeauty && { color: '#4B5563' }]}>Período:</Text>
        <View style={styles.filterPillsRow}>
          {(
            [
              { id: 'all', label: `Histórico (${allCompletedAppointments.length})` },
              { id: 'today', label: 'Hoje' },
              { id: 'week', label: 'Últimos 7 Dias' },
              { id: 'month', label: 'Este Mês' },
            ] as { id: RevenuePeriodFilter; label: string }[]
          ).map(p => (
            <TouchableOpacity
              key={p.id}
              style={[
                styles.filterChip,
                isBeauty && styles.filterChipBeauty,
                revenuePeriod === p.id && (isBeauty ? styles.filterChipActiveBeauty : styles.filterChipActive),
              ]}
              onPress={() => setRevenuePeriod(p.id)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isBeauty && { color: '#4B5563' },
                  revenuePeriod === p.id && (isBeauty ? styles.filterChipTextActiveBeauty : styles.filterChipTextActive),
                ]}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Branch Filter (only when not locked) */}
        {!lockBranch && (
          <>
            <Text style={[styles.filterGroupLabel, { marginTop: 12 }, isBeauty && { color: '#4B5563' }]}>Salão:</Text>
            <View style={styles.filterPillsRow}>
              {(
                [
                  { id: 'all', label: 'Todos os Salões' },
                  { id: 'barber', label: 'Almare Barber' },
                  { id: 'beauty', label: 'Almare Beauty' },
                ] as { id: RevenueBranchFilter; label: string }[]
              ).map(b => (
                <TouchableOpacity
                  key={b.id}
                  style={[
                    styles.filterChip,
                    isBeauty && styles.filterChipBeauty,
                    revenueBranch === b.id && (isBeauty ? styles.filterChipActiveBeauty : styles.filterChipActive),
                  ]}
                  onPress={() => setRevenueBranch(b.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      isBeauty && { color: '#4B5563' },
                      revenueBranch === b.id && (isBeauty ? styles.filterChipTextActiveBeauty : styles.filterChipTextActive),
                    ]}
                  >
                    {b.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Search input */}
        <View style={{ marginTop: 12 }}>
          <TextInput
            style={[styles.revenueSearchInput, isBeauty && styles.revenueSearchInputBeauty]}
            placeholder="Pesquisar por cliente, telefone, colaborador ou serviço..."
            placeholderTextColor={isBeauty ? '#9CA3AF' : '#71717A'}
            value={revenueSearch}
            onChangeText={setRevenueSearch}
          />
        </View>
      </View>

      {/* Performance by Staff */}
      {revenueMetrics.staffBreakdown.length > 0 && (
        <View style={[styles.sectionCard, isBeauty && styles.sectionCardBeauty]}>
          <Text style={[styles.sectionTitle, isBeauty && { color: '#3B1C26' }]}>
            Faturação Concluída por Colaborador
          </Text>
          <Text style={[styles.sectionSub, isBeauty && { color: '#6B7280' }]}>
            Valores gerados por cada membro da equipa no período selecionado
          </Text>

          {revenueMetrics.staffBreakdown.map((item, idx) => {
            const pct = revenueMetrics.totalRevenue > 0
              ? Math.round((item.total / revenueMetrics.totalRevenue) * 100)
              : 0;

            return (
              <View
                key={item.staffName || idx}
                style={[styles.staffRankRow, isBeauty && { borderBottomColor: '#F3E8FF' }]}
              >
                <View style={styles.staffRankInfo}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.staffRankName, isBeauty && { color: '#1F2937' }]}>
                      {item.staffName}
                    </Text>
                    <View
                      style={[
                        styles.miniBranchBadge,
                        {
                          backgroundColor:
                            item.branch === 'barber'
                              ? isBeauty ? '#FEF3C7' : '#272732'
                              : isBeauty ? '#FCE7F3' : '#2D2026',
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color:
                            item.branch === 'barber'
                              ? isBeauty ? '#92400E' : '#E2B755'
                              : isBeauty ? '#9D174D' : '#F472B6',
                          fontSize: 9,
                          fontWeight: '800',
                        }}
                      >
                        {item.branch === 'barber' ? 'BARBER' : 'BEAUTY'}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.staffRankSub, isBeauty && { color: '#6B7280' }]}>
                    {item.count} {item.count === 1 ? 'cliente atendido' : 'clientes atendidos'} • {pct}% da faturação
                  </Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.staffRankTotal, isBeauty && { color: '#996515' }]}>
                    {item.total.toFixed(2)} €
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* List of Completed Appointments Feed */}
      <View style={[styles.sectionCard, isBeauty && styles.sectionCardBeauty]}>
        <View style={styles.receiptHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sectionTitle, isBeauty && { color: '#3B1C26' }]}>
              Entradas de Receita Concluída
            </Text>
            <Text style={[styles.sectionSub, isBeauty && { color: '#6B7280' }]}>
              {filteredCompletedAppointments.length} marcações concluídas listadas
            </Text>
          </View>
          <View style={[styles.totalBadgeBox, isBeauty && styles.totalBadgeBoxBeauty]}>
            <Text style={[styles.totalBadgeText, isBeauty && { color: '#996515' }]}>
              Total: {revenueMetrics.totalRevenue.toFixed(2)} €
            </Text>
          </View>
        </View>

        {filteredCompletedAppointments.length === 0 ? (
          <View style={[styles.emptyStateBox, isBeauty && styles.emptyStateBoxBeauty]}>
            <Text style={[styles.emptyStateTitle, isBeauty && { color: '#1F2937' }]}>
              Nenhuma marcação concluída encontrada
            </Text>
            <Text style={[styles.emptyStateSub, isBeauty && { color: '#6B7280' }]}>
              Assim que o gestor de cada salão der uma marcação como &quot;Concluída&quot;, ela surge aqui instantaneamente com a respetiva receita creditada.
            </Text>
          </View>
        ) : (
          filteredCompletedAppointments.map(app => (
            <View
              key={app.id}
              style={[styles.receiptItem, isBeauty && styles.receiptItemBeauty]}
            >
              <View style={styles.receiptTopRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View
                    style={[
                      styles.branchTag,
                      {
                        backgroundColor:
                          app.branch === 'barber'
                            ? isBeauty ? '#FEF3C7' : '#2A2A38'
                            : isBeauty ? '#FCE7F3' : '#33222B',
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color:
                          app.branch === 'barber'
                            ? isBeauty ? '#92400E' : '#E2B755'
                            : isBeauty ? '#9D174D' : '#F472B6',
                        fontSize: 10,
                        fontWeight: '900',
                      }}
                    >
                      {app.branch === 'barber' ? 'BARBER' : 'BEAUTY'}
                    </Text>
                  </View>
                  <Text style={[styles.receiptDateTime, isBeauty && { color: '#4B5563' }]}>
                    {app.date} às {app.timeSlot}
                  </Text>
                </View>

                <View style={[styles.completedBadge, isBeauty && { backgroundColor: '#D1FAE5', borderColor: '#10B981' }]}>
                  <Text style={[styles.completedBadgeText, isBeauty && { color: '#047857' }]}>
                    ✓ Pago & Concluído
                  </Text>
                </View>
              </View>

              <View style={styles.receiptMainRow}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={[styles.receiptClientName, isBeauty && { color: '#111827' }]}>
                    {app.clientName}
                  </Text>
                  <Text style={[styles.receiptClientPhone, isBeauty && { color: '#4B5563' }]}>
                    Tel: {app.clientPhone}
                  </Text>
                  <Text style={[styles.receiptService, isBeauty && { color: '#1F2937' }]}>
                    {app.serviceName}
                  </Text>
                  <Text style={[styles.receiptStaff, isBeauty && { color: '#4B5563' }]}>
                    Profissional: {app.staffName}
                  </Text>
                  {app.notes ? (
                    <Text style={[styles.receiptNotes, isBeauty && { color: '#996515' }]}>
                      Nota: &quot;{app.notes}&quot;
                    </Text>
                  ) : null}
                </View>

                <View style={[styles.receiptPriceBox, isBeauty && styles.receiptPriceBoxBeauty]}>
                  <Text style={[styles.receiptPrice, isBeauty && { color: '#92400E' }]}>
                    +{app.servicePrice.toFixed(2)} €
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
  },
  liveSyncBanner: {
    backgroundColor: '#121E18',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#065F46',
  },
  liveSyncBannerBeauty: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  liveSyncHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  liveSyncTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#10B981',
    letterSpacing: 1,
  },
  liveSyncSub: {
    fontSize: 12,
    color: '#A7F3D0',
    lineHeight: 18,
  },
  revenueKpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  kpiCard: {
    width: '48.5%',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  kpiCardDark: {
    backgroundColor: '#18181C',
    borderColor: '#27272A',
  },
  kpiCardBeauty: {
    backgroundColor: '#FFF',
    borderColor: '#FCE7F3',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  kpiCardHighlight: {
    borderColor: 'rgba(212,175,55,0.4)',
    backgroundColor: '#1B1A1E',
  },
  kpiCardHighlightBeauty: {
    borderColor: '#FDE68A',
    backgroundColor: '#FFFDF5',
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9CA3AF',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 4,
  },
  kpiSub: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  sectionCard: {
    backgroundColor: '#18181C',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#27272A',
  },
  sectionCardBeauty: {
    backgroundColor: '#FFF',
    borderColor: '#FCE7F3',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 5,
  },
  sectionTitle: {
    color: Theme.colors.brandSecondary,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  sectionSub: {
    color: '#9CA3AF',
    fontSize: 11,
    marginBottom: 14,
    lineHeight: 16,
  },
  branchRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  branchStatBoxBarber: {
    flex: 1,
    backgroundColor: '#141418',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2B755',
  },
  branchStatBoxBarberBeauty: {
    backgroundColor: '#FFFDF5',
    borderColor: '#FDE68A',
  },
  branchNameBarber: {
    color: '#D4AF37',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },
  branchValueBarber: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },
  branchSubBarber: {
    color: '#9CA3AF',
    fontSize: 11,
  },
  branchStatBoxBeauty: {
    flex: 1,
    backgroundColor: '#141418',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F472B6',
  },
  branchStatBoxBeautyLight: {
    backgroundColor: '#FDF2F8',
    borderColor: '#FBCFE8',
  },
  branchNameBeauty: {
    color: '#BE185D',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },
  branchValueBeauty: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },
  branchSubBeauty: {
    color: '#9CA3AF',
    fontSize: 11,
  },
  filterHeaderTitle: {
    color: '#F3F4F6',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10,
  },
  filterGroupLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  filterPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  filterChip: {
    backgroundColor: '#222228',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#30303A',
  },
  filterChipBeauty: {
    backgroundColor: '#FFF',
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#E2B755',
    borderColor: '#E2B755',
  },
  filterChipActiveBeauty: {
    backgroundColor: '#FCE7F3',
    borderWidth: 1.5,
    borderColor: '#BE185D',
  },
  filterChipText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '700',
  },
  filterChipTextActive: {
    color: '#111827',
    fontWeight: '800',
  },
  filterChipTextActiveBeauty: {
    color: '#111827',
    fontWeight: '900',
  },
  revenueSearchInput: {
    backgroundColor: '#111116',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2F2F3D',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFF',
    fontSize: 12,
  },
  revenueSearchInputBeauty: {
    backgroundColor: '#FFF',
    borderColor: '#E5E7EB',
    color: '#111827',
  },
  staffRankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#25252E',
  },
  staffRankInfo: {
    flex: 1,
    paddingRight: 10,
  },
  staffRankName: {
    color: '#F3F4F6',
    fontSize: 13,
    fontWeight: '800',
  },
  miniBranchBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  staffRankSub: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 2,
  },
  staffRankTotal: {
    color: '#E2B755',
    fontSize: 15,
    fontWeight: '900',
  },
  receiptHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  totalBadgeBox: {
    backgroundColor: 'rgba(226,183,85,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2B755',
  },
  totalBadgeBoxBeauty: {
    backgroundColor: '#FFFDF5',
    borderColor: '#FDE68A',
  },
  totalBadgeText: {
    color: '#E2B755',
    fontSize: 12,
    fontWeight: '800',
  },
  emptyStateBox: {
    backgroundColor: '#141418',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#262630',
    marginTop: 10,
  },
  emptyStateBoxBeauty: {
    backgroundColor: '#FFF5F7',
    borderColor: '#FCE7F3',
  },
  emptyStateTitle: {
    color: '#D1D5DB',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyStateSub: {
    color: '#6B7280',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  receiptItem: {
    backgroundColor: '#141418',
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#2A2A35',
  },
  receiptItemBeauty: {
    backgroundColor: '#FFF',
    borderColor: '#FCE7F3',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 3,
  },
  receiptTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  branchTag: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  receiptDateTime: {
    color: '#D1D5DB',
    fontSize: 11,
    fontWeight: '700',
  },
  completedBadge: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  completedBadgeText: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '800',
  },
  receiptMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptClientName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  receiptClientPhone: {
    color: '#9CA3AF',
    fontSize: 11,
    marginBottom: 4,
  },
  receiptService: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '600',
  },
  receiptStaff: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 2,
  },
  receiptNotes: {
    color: '#71717A',
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 2,
  },
  receiptPriceBox: {
    backgroundColor: 'rgba(226,183,85,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(226,183,85,0.4)',
    alignItems: 'flex-end',
  },
  receiptPriceBoxBeauty: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  receiptPrice: {
    color: '#E2B755',
    fontSize: 16,
    fontWeight: '900',
  },
});
