import { Platform } from 'react-native';

// === COLOR PALETTE ===
// Warm, organic wellness palette
export const colors = {
  // Primary greens (safe/trust)
  sage: '#5B8A72',
  sageDark: '#3D6B54',
  sageLight: '#A8CFBA',
  sageMuted: '#E8F2EC',

  // Amber/warm (moderate/caution)
  amber: '#D4A04A',
  amberDark: '#B8862F',
  amberLight: '#F5DFA8',
  amberMuted: '#FDF5E6',

  // Coral/warm red (high risk)
  coral: '#C75B4A',
  coralDark: '#A44535',
  coralLight: '#E8A99E',
  coralMuted: '#FBEAE7',

  // Backgrounds
  cream: '#FAFAF7',
  warmWhite: '#F7F5F0',
  cardBg: '#FFFFFF',

  // Text
  textPrimary: '#2D2D2A',
  textSecondary: '#6B6B65',
  textMuted: '#9E9E96',
  textOnDark: '#FAFAF7',

  // Borders & shadows
  border: '#E8E6E1',
  borderLight: '#F0EDE8',
  shadowColor: '#2D2D2A',
};

// FODMAP rating colors
export const ratingColors = {
  green: { bg: colors.sageMuted, text: colors.sageDark, dot: colors.sage },
  yellow: { bg: colors.amberMuted, text: colors.amberDark, dot: colors.amber },
  red: { bg: colors.coralMuted, text: colors.coralDark, dot: colors.coral },
};

type RatingPalette = (typeof ratingColors)['green'];

const neutralPalette: RatingPalette = { bg: colors.borderLight, text: colors.textMuted, dot: colors.textMuted };

export function paletteForRating(rating: string | null): RatingPalette {
  if (rating === 'green' || rating === 'yellow' || rating === 'red') return ratingColors[rating];
  return neutralPalette;
}

// === TYPOGRAPHY ===
export const typography = {
  displayLarge: {
    fontSize: 32,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  displayMedium: {
    fontSize: 26,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
    lineHeight: 34,
  },
  titleLarge: {
    fontSize: 20,
    fontWeight: '600' as const,
    letterSpacing: 0,
    lineHeight: 28,
  },
  titleMedium: {
    fontSize: 17,
    fontWeight: '600' as const,
    letterSpacing: 0.1,
    lineHeight: 24,
  },
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400' as const,
    letterSpacing: 0.15,
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '400' as const,
    letterSpacing: 0.15,
    lineHeight: 20,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400' as const,
    letterSpacing: 0.2,
    lineHeight: 16,
  },
  labelLarge: {
    fontSize: 13,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
    lineHeight: 18,
  },
  labelSmall: {
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 0.4,
    lineHeight: 16,
  },
};

// === SPACING ===
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// === RADIUS ===
export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  full: 999,
};

// === SHADOWS ===
export const shadows = {
  sm: {
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    ...Platform.select({ android: { elevation: 2 } }),
  },
  md: {
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    ...Platform.select({ android: { elevation: 4 } }),
  },
  lg: {
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    ...Platform.select({ android: { elevation: 6 } }),
  },
};

// === GRADIENTS ===
export const gradients = {
  screenBg: ['#FAFAF7', '#F0EDE8'] as const,
  sage: ['#5B8A72', '#3D6B54'] as const,
  amber: ['#D4A04A', '#B8862F'] as const,
  coral: ['#C75B4A', '#A44535'] as const,
  warmCard: ['#FFFFFF', '#FAFAF7'] as const,
  scanOverlay: ['rgba(0,0,0,0.7)', 'transparent', 'transparent', 'rgba(0,0,0,0.7)'] as const,
};
