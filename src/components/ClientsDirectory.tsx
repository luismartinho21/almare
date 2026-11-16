import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { useApp } from '../context/AppContext';
import { SalonBranch } from '../types';
import { formatWhatsAppPhone } from '../utils/reminderHelper';

interface ClientsDirectoryProps {
  branch: SalonBranch;
  accentColor?: string;
}

interface ClientRow {
  key: string;
  name: string;
  phone: string;
  totalSpent: number;
  visits: number;
  upcoming: number;
  lastVisit: string;
  lastService: string;
}

type SortMode = 'spent' | 'visits' | 'name' | 'recent';

const normalizePhone = (p: string) => (p || '').replace(/\D/g, '').replace(/^351/, '');

export const ClientsDirectory: React.FC<ClientsDirectoryProps> = ({ branch, accentColor = '#D4AF37' }) => {
  const { appointments } = useApp();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortMode>('spent');

  const clients = useMemo<ClientRow[]>(() => {
    const map = new Map<string, ClientRow>();
    appointments
      .filter(a => a.branch === branch && !a.isExperiencePartnerSlot && a.status !== 'cancelled')
      .forEach(a => {
        const phoneKey = normalizePhone(a.clientPhone);
        const key = phoneKey || `name:${a.clientName.trim().toLowerCase()}`;
        let row = map.get(key);
        if (!row) {
          row = {
            key,
            name: a.clientName.trim(),
            phone: a.clientPhone.trim(),
            totalSpent: 0,
            visits: 0,
            upcoming: 0,
            lastVisit: '',
            lastService: '',
          };
          map.set(key, row);
        }
        if (a.status === 'completed') {
          row.totalSpent += a.servicePrice || 0;
          row.visits += 1;
          if (a.date >= row.lastVisit) {
            row.lastVisit = a.date;
            row.lastService = a.serviceName;
            row.name = a.clientName.trim();
          }
        } else {
          row.upcoming += 1;
        }
      });
    return Array.from(map.values());
  }, [appointments, branch]);

  const displayed = useMemo(() => {
    const q = search.trim().toLowerCase();
    const qDigits = q.replace(/\D/g, '');
    const filtered = clients.filter(
      c => !q || c.name.toLowerCase().includes(q) || (qDigits && normalizePhone(c.phone).includes(qDigits))
    );
    return filtered.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name, 'pt');
      if (sort === 'visits') return b.visits - a.visits;
      if (sort === 'recent') return b.lastVisit.localeCompare(a.lastVisit);
      return b.totalSpent - a.totalSpent;
    });
  }, [clients, search, sort]);

  const totalSpentAll = clients.reduce((s, c) => s + c.totalSpent, 0);
  const avgTicket = clients.length ? totalSpentAll / clients.length : 0;

  const sorts: { id: SortMode; label: string }[] = [
    { id: 'spent', label: 'Maior gasto' },
    { id: 'visits', label: 'Visitas' },
    { id: 'recent', label: 'Recentes' },
    { id: 'name', label: 'Nome' },
  ];

  return (
    <View>
      <View style={styles.summaryRow}>
        <View style={styles.summaryBox}>
          <Text style={[styles.summaryValue, { color: accentColor }]}>{clients.length}</Text>
          <Text style={styles.summaryLabel}>Clientes</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={[styles.summaryValue, { color: accentColor }]}>{totalSpentAll.toFixed(2)} €</Text>
          <Text style={styles.summaryLabel}>Total faturado</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={[styles.summaryValue, { color: accentColor }]}>{avgTicket.toFixed(2)} €</Text>
          <Text style={styles.summaryLabel}>Média / cliente</Text>
        </View>
      </View>

      <TextInput
        style={styles.search}
        value={search}
        onChangeText={setSearch}
        placeholder="Pesquisar por nome ou telemóvel..."
        placeholderTextColor="#71717A"
      />

      <View style={styles.sortRow}>
        {sorts.map(s => (
          <TouchableOpacity
            key={s.id}
            style={[styles.sortPill, sort === s.id && { borderColor: accentColor, backgroundColor: '#252117' }]}
            onPress={() => setSort(s.id)}
          >
            <Text style={[styles.sortPillText, sort === s.id && { color: accentColor }]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {displayed.length === 0 ? (
        <Text style={styles.empty}>
          {clients.length === 0
            ? 'Ainda não há clientes. Aparecem aqui automaticamente após a primeira marcação.'
            : 'Nenhum cliente encontrado.'}
        </Text>
      ) : (
        displayed.map(c => (
          <View key={c.key} style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{c.name}</Text>
              <Text style={styles.phone}>{c.phone || 'Sem telemóvel'}</Text>
              <Text style={styles.meta}>
                {c.visits} {c.visits === 1 ? 'visita concluída' : 'visitas concluídas'}
                {c.upcoming > 0 ? ` • ${c.upcoming} agendada(s)` : ''}
              </Text>
              {c.lastVisit ? (
                <Text style={styles.meta} numberOfLines={1}>
                  Última: {c.lastVisit} • {c.lastService}
                </Text>
              ) : null}
            </View>
            <View style={styles.right}>
              <Text style={[styles.spent, { color: accentColor }]}>{c.totalSpent.toFixed(2)} €</Text>
              <Text style={styles.spentLabel}>gasto total</Text>
              {c.phone ? (
                <TouchableOpacity
                  style={styles.waBtn}
                  onPress={() => Linking.openURL(`https://wa.me/${formatWhatsAppPhone(c.phone)}`)}
                >
                  <Text style={styles.waBtnText}>WhatsApp</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  summaryBox: {
    flex: 1,
    backgroundColor: '#1C1C26',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2E2E3E',
    alignItems: 'center',
  },
  summaryValue: { fontSize: 16, fontWeight: '800' },
  summaryLabel: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  search: {
    backgroundColor: '#1C1C26',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2E2E3E',
    color: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 10,
  },
  sortRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  sortPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2E2E3E',
    backgroundColor: '#17171F',
  },
  sortPillText: { fontSize: 12, color: '#9CA3AF', fontWeight: '600' },
  empty: { color: '#9CA3AF', textAlign: 'center', marginTop: 24, fontSize: 13 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#1C1C26',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2E2E3E',
  },
  name: { color: '#F3F4F6', fontSize: 15, fontWeight: '700' },
  phone: { color: '#D1D5DB', fontSize: 13, marginTop: 2 },
  meta: { color: '#9CA3AF', fontSize: 12, marginTop: 3 },
  right: { alignItems: 'flex-end', justifyContent: 'center', marginLeft: 10 },
  spent: { fontSize: 18, fontWeight: '800' },
  spentLabel: { fontSize: 10, color: '#9CA3AF' },
  waBtn: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#10B981',
  },
  waBtnText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
});
