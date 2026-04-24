import { useWindowDimensions } from 'react-native'

export const DESKTOP_BREAKPOINT = 900
export const WIDE_BREAKPOINT = 1200

export function useResponsiveLayout() {
  const { width } = useWindowDimensions()
  const isDesktop = width >= DESKTOP_BREAKPOINT
  const isWide = width >= WIDE_BREAKPOINT

  return {
    width,
    isDesktop,
    isWide,
    pagePadding: isDesktop ? 32 : 16,
    pageMaxWidth: isWide ? 1180 : 960,
  }
}
