/**
 * S-Loco Design System — Klook-inspired Coastal Blue
 * Root token file kept for legacy src/components imports.
 */
import { Platform, StyleSheet } from 'react-native'

/* ─── Color Palette ─── */
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

  // Functional
  white: '#FFFFFF',
  transparent: 'transparent',
  scrim: 'rgba(16, 32, 51, 0.54)',
  coral: '#FF6B35',
  coralContainer: '#FFE7DC',
  sand: '#FFF7E8',
  lagoon: '#0E7490',
  lagoonContainer: '#CCFBF1',
  gradientStart: '#005AAE',
  gradientEnd: '#00A3FF',
} as const

/* ─── Typography ─── */
const fontDisplay = Platform.select({
  web: '"Plus Jakarta Sans", "Be Vietnam Pro", sans-serif',
  default: undefined,
})
const fontBody = Platform.select({
  web: '"Be Vietnam Pro", "Plus Jakarta Sans", sans-serif',
  default: undefined,
})

export const typography = StyleSheet.create({
  displayLg: { fontSize: 57, fontWeight: '700', fontFamily: fontDisplay, color: colors.onSurface },
  displayMd: { fontSize: 45, fontWeight: '600', fontFamily: fontDisplay, color: colors.onSurface },
  headlineLg: { fontSize: 32, fontWeight: '600', fontFamily: fontDisplay, color: colors.onSurface },
  headlineMd: { fontSize: 28, fontWeight: '600', fontFamily: fontDisplay, color: colors.onSurface },
  titleLg: { fontSize: 22, fontWeight: '600', fontFamily: fontBody, color: colors.onSurface },
  titleMd: { fontSize: 16, fontWeight: '600', fontFamily: fontBody, color: colors.onSurface },
  titleSm: { fontSize: 14, fontWeight: '500', fontFamily: fontBody, color: colors.onSurface },
  bodyLg: { fontSize: 16, fontWeight: '400', fontFamily: fontBody, color: colors.onSurface },
  bodyMd: { fontSize: 14, fontWeight: '400', fontFamily: fontBody, color: colors.onSurfaceVariant },
  bodySm: { fontSize: 12, fontWeight: '400', fontFamily: fontBody, color: colors.onSurfaceVariant },
  labelLg: { fontSize: 14, fontWeight: '500', fontFamily: fontBody, color: colors.onSurface },
  labelMd: { fontSize: 12, fontWeight: '500', fontFamily: fontBody, color: colors.onSurface },
  labelSm: { fontSize: 11, fontWeight: '500', fontFamily: fontBody, color: colors.onSurface },
})

/* ─── Spacing Scale ─── */
export const spacing = {
  xs: 4, // spacing.1 — inline icon gap
  sm: 8, // spacing.2 — chip padding, tight gaps
  md: 12, // spacing.3 — card internal padding
  base: 16, // spacing.4 — standard padding
  lg: 24, // spacing.6 — section spacing
  xl: 32, // spacing.8 — major section breaks
  '2xl': 48, // spacing.12 — hero section margins
} as const

export const borderRadius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  full: 9999,
} as const

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

/* ─── Shared Component Styles ─── */
export const components = StyleSheet.create({
  // Cards
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    padding: spacing.base,
  },

  // Primary CTA Button
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 48,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
    alignItems: 'center' as const,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500' as const,
    fontFamily: fontBody,
  },

  // Secondary Button
  secondaryButton: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 48,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center' as const,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '500' as const,
    fontFamily: fontBody,
  },

  // Chip / Tag
  chip: {
    backgroundColor: colors.secondaryContainer,
    borderRadius: 9999,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  chipText: {
    color: colors.onSecondaryContainer,
    fontSize: 12,
    fontWeight: '500' as const,
    fontFamily: fontBody,
  },

  // Discount Badge
  discountBadge: {
    backgroundColor: colors.tertiaryContainer,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  discountBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '600' as const,
    fontFamily: fontBody,
  },

  // Input Field
  input: {
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: 12,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.base,
    fontSize: 16,
    fontFamily: fontBody,
    color: colors.onSurface,
  },
  inputFocused: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
  },

  // Glass Surface (tab bar, floating headers)
  glassSurface: {
    backgroundColor: 'rgba(244, 247, 251, 0.7)',
  },

  // Shadow for floating elements
  floatingShadow: {
    ...Platform.select({
      web: {
        boxShadow: '0 8px 32px rgba(22, 27, 46, 0.06)',
      },
      default: {
        shadowColor: colors.onSurface,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 32,
        elevation: 4,
      },
    }),
  },
})

/* ─── Gradient Presets (for LinearGradient or web backgrounds) ─── */
export const gradients = {
  primaryCta: ['#005E97', '#0077B6'] as const,
  heroOverlay: ['rgba(0,94,151,0.3)', 'transparent'] as const,
}
