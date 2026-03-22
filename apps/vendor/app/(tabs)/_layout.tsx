import { Tabs } from 'expo-router'

/* ─── S-Local Blue Design System Tokens ─── */
const colors = {
  primary: '#005E97',
  primaryContainer: '#0077B6',
  surface: '#F4F7FB',
  surfaceContainerLow: '#EDF1F8',
  onSurface: '#161B2E',
  onSurfaceVariant: '#3B4460',
  outline: '#6B7694',
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.onSurface,
        headerTitleStyle: { fontWeight: '600' },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: 'transparent',
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.outline,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Đơn hàng' }} />
      <Tabs.Screen name="scan" options={{ title: 'Quét QR' }} />
      <Tabs.Screen name="earnings" options={{ title: 'Thu nhập' }} />
      <Tabs.Screen name="settings" options={{ title: 'Cài đặt' }} />
    </Tabs>
  )
}
