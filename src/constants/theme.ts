export const Theme = {
  colors: {
    // General Brand (Almare Luxury)
    brandPrimary: '#0D0D11',
    brandSecondary: '#D4AF37', // Metallic Gold
    goldLight: '#F3E5AB',
    goldDark: '#996515',
    bgDark: '#0D0D11',
    bgLight: '#FFFFFF',
    textDark: '#111827',
    textMuted: '#6B7280',
    white: '#FFFFFF',
    border: '#E5E7EB',

    // Homens: PRETO E DOURADO (Almare Barber)
    barber: {
      primary: '#0D0D11',      // Deep Black
      cardBg: '#18181F',       // Charcoal Black Card
      accent: '#D4AF37',       // Pure Gold
      accentLight: '#F5E08C',
      accentBg: '#2A2415',     // Gold tinted dark bg
      border: '#3D3418',       // Dark Gold Border
      badge: '#D4AF37',
      text: '#F8FAFC',
      subtext: '#94A3B8',
      buttonBg: '#D4AF37',
      buttonText: '#0D0D11',
    },

    // Mulheres: BRANCO E DOURADO (Almare Beauty)
    beauty: {
      primary: '#FFFFFF',      // Pure White
      cardBg: '#FAFAF7',       // Warm White / Cream Card
      accent: '#B8860B',       // Warm Rich Gold
      accentLight: '#D4AF37',  // Bright Gold
      accentBg: '#FFFDF5',     // Soft Cream Gold Tint
      border: '#E6D5AC',       // Soft Gold Border
      badge: '#996515',
      text: '#1F2937',         // Dark text on white
      subtext: '#6B7280',
      buttonBg: '#D4AF37',
      buttonText: '#0D0D11',
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
    goldGlow: {
      shadowColor: '#D4AF37',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 6,
    }
  }
};
