/**
 * S-Loco — Klook-inspired Coastal Blue tokens.
 * Clean marketplace surfaces, strong blue primary, coral deal accents.
 */

// ─── Colors ───────────────────────────────────────────────────────────────────

export const colors = {
  // Primary — coastal marketplace blue
  primary: '#006DCC',
  primaryContainer: '#0B8FEF',
  primaryFixed: '#E0F2FE',
  primaryFixedDim: '#7DD3FC',

  // Secondary — aqua utility
  secondary: '#0891B2',
  secondaryContainer: '#DFF7FF',
  onSecondaryContainer: '#075985',

  // Tertiary — warm deal accent
  tertiary: '#EA580C',
  tertiaryContainer: '#FF7A1A',
  tertiaryFixed: '#FFF1E6',

  // Surfaces — clean travel marketplace
  surface: '#F5FAFF',
  surfaceContainerLow: '#EFF7FF',
  surfaceContainer: '#E6F2FB',
  surfaceContainerHigh: '#D7EAF8',
  surfaceContainerHighest: '#C7E0F3',
  surfaceContainerLowest: '#FFFFFF',

  // Text
  onSurface: '#102033',
  onSurfaceVariant: '#5D6B7A',
  outline: '#8AA0B5',
  outlineVariant: '#D9E7F2',

  // Error
  error: '#BA1A1A',
  onError: '#FFFFFF',

  // Utility
  white: '#FFFFFF',
  transparent: 'transparent',
  scrim: 'rgba(16, 32, 51, 0.54)',
  coral: '#FF6B35',
  coralContainer: '#FFE7DC',
  sand: '#FFF7E8',
  lagoon: '#0E7490',
  lagoonContainer: '#CCFBF1',

  // Status
  success: '#047857',
  warning: '#D97706',
  amber: '#F59E0B',
} as const

// ─── Typography ───────────────────────────────────────────────────────────────

export const typography = {
  displaySm: { fontSize: 36, lineHeight: 44, fontWeight: '700' as const },
  displayMd: { fontSize: 45, lineHeight: 52, fontWeight: '600' as const },
  displayLg: { fontSize: 57, lineHeight: 64, fontWeight: '700' as const },
  headlineLg: { fontSize: 28, lineHeight: 36, fontWeight: '600' as const },
  headlineMd: { fontSize: 24, lineHeight: 32, fontWeight: '600' as const },
  headlineSm: { fontSize: 22, lineHeight: 28, fontWeight: '500' as const },
  titleLg: { fontSize: 22, lineHeight: 28, fontWeight: '600' as const },
  titleMd: { fontSize: 16, lineHeight: 24, fontWeight: '600' as const },
  titleSm: { fontSize: 14, lineHeight: 20, fontWeight: '500' as const },
  bodyLg: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  bodyMd: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
  bodySm: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const },
  labelLg: { fontSize: 14, lineHeight: 20, fontWeight: '500' as const },
  labelMd: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const },
  labelSm: { fontSize: 11, lineHeight: 16, fontWeight: '500' as const },
} as const

// ─── Spacing ─────────────────────────────────────────────────────────────────

export const spacing = {
  xs: 4,
  sm: 8,
  base: 16, // standard horizontal padding, card internal padding
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const

// ─── Border Radius ────────────────────────────────────────────────────────────

export const borderRadius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  full: 9999,
} as const

// ─── Gradients ───────────────────────────────────────────────────────────────

export const gradients = {
  primary: 'linear-gradient(135deg, #075985, #0E7490)',
  hero: 'linear-gradient(135deg, #005AAE 0%, #008CDB 55%, #49C5FF 100%)',
} as const

// ─── Shadows (ambient, floating elements only) ──────────────────────────────

export const shadows = {
  card: {
    shadowColor: '#174B72',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 2,
  },
  fab: {
    shadowColor: '#174B72',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 6,
  },
  bottomSheet: {
    shadowColor: '#174B72',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
} as const

// ─── Glassmorphism ───────────────────────────────────────────────────────────

export const glass = {
  tabBar: {
    backgroundColor: 'rgba(244, 247, 251, 0.85)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  },
  header: {
    backgroundColor: 'rgba(244, 247, 251, 0.7)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  },
} as const

// ─── Touch Targets ───────────────────────────────────────────────────────────

export const touchTargets = {
  minimum: 44,
  recommended: 48,
  tabBar: 44,
} as const

// ─── Layout ──────────────────────────────────────────────────────────────────

export const layout = {
  screenPadding: spacing.md,
  cardRadius: borderRadius.md,
  heroHeight: 200,
  categoryIconSize: 48,
  qrCodeSize: 200,
} as const
