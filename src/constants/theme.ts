export const Theme = {
  colors: {
    // General Brand
    brandPrimary: '#1E1E24',
    brandSecondary: '#D4AF37', // Gold
    bgDark: '#0D0D11',
    bgCardDark: '#1A1A22',
    bgLight: '#F8F9FA',
    textDark: '#111827',
    textMuted: '#6B7280',
    white: '#FFFFFF',
    border: '#E5E7EB',

    // Almaria Barber (Eles)
    barber: {
      primary: '#18181B',
      accent: '#EAB308', // Warm Gold
      accentBg: '#FEF9C3',
      darkCard: '#27272A',
      border: '#3F3F46',
      badge: '#B45309',
      text: '#F4F4F5',
      subtext: '#A1A1AA',
    },

    // Almaria Beauty (Elas)
    beauty: {
      primary: '#3B1C26', // Soft Burgundy/Rose
      accent: '#E879F9', // Elegant Rose / Magenta
      accentBg: '#FDF4FF',
      darkCard: '#4C1D2A',
      lightCard: '#FFF5F7',
      border: '#FBCFE8',
      badge: '#BE185D',
      text: '#290F17',
      subtext: '#831843',
    },

    status: {
      confirmed: '#10B981', // Green
      completed: '#3B82F6', // Blue
      cancelled: '#EF4444', // Red
    }
  },

  shadows: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 10,
      elevation: 4,
    },
    hover: {
      shadowColor: '#D4AF37',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 6,
    }
  }
};
