/**
 * S-Loco — Coastal Premium tokens.
 * Warm resort surfaces, deep ocean primary, coral highlights.
 */

// ─── Colors ───────────────────────────────────────────────────────────────────

export const colors = {
  // Primary — premium coastal ocean
  primary: '#075985',
  primaryContainer: '#0E7490',
  primaryFixed: '#CFFAFE',
  primaryFixedDim: '#67E8F9',

  // Secondary — warm sand
  secondary: '#B7791F',
  secondaryContainer: '#FEF3C7',
  onSecondaryContainer: '#5C3A05',

  // Tertiary — coral sunset
  tertiary: '#B45309',
  tertiaryContainer: '#F97316',
  tertiaryFixed: '#FFEDD5',

  // Surfaces — resort paper, not clinical gray
  surface: '#FFF8EE',
  surfaceContainerLow: '#FDF1DD',
  surfaceContainer: '#F7E6CC',
  surfaceContainerHigh: '#EED6B6',
  surfaceContainerHighest: '#E5C49B',
  surfaceContainerLowest: '#FFFFFF',

  // Text
  onSurface: '#1F2933',
  onSurfaceVariant: '#52616B',
  outline: '#8A7B68',
  outlineVariant: '#E4D1B5',

  // Error
  error: '#BA1A1A',
  onError: '#FFFFFF',

  // Utility
  white: '#FFFFFF',
  transparent: 'transparent',
  scrim: 'rgba(31, 41, 51, 0.52)',
  coral: '#EF6F4E',
  coralContainer: '#FFE4D8',
  sand: '#FFF3D8',
  lagoon: '#0F766E',
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
  hero: 'linear-gradient(135deg, #064E3B 0%, #075985 52%, #F97316 140%)',
} as const

// ─── Shadows (ambient, floating elements only) ──────────────────────────────

export const shadows = {
  card: {
    shadowColor: '#7C4A18',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 3,
  },
  fab: {
    shadowColor: '#7C4A18',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 6,
  },
  bottomSheet: {
    shadowColor: '#7C4A18',
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
