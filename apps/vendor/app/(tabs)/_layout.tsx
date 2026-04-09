import { Text } from 'react-native'
import { Tabs } from 'expo-router'

/* ─── S-Loco Coastal Editorial Design Tokens ─── */
const colors = {
  primary: '#005E97',
  surface: '#F4F7FB',
  onSurface: '#161B2E',
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
          backgroundColor: 'rgba(244, 247, 251, 0.85)',
          borderTopColor: 'transparent',
          elevation: 0,
          shadowOpacity: 0,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.outline,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500', marginBottom: 4 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tổng quan',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 22 }}>🏠</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Quét QR',
          tabBarIcon: () => (
            <Text style={{ fontSize: 22 }}>📷</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Đơn hàng',
          tabBarIcon: () => (
            <Text style={{ fontSize: 22 }}>🧾</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: 'Thu nhập',
          tabBarIcon: () => (
            <Text style={{ fontSize: 22 }}>💰</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Cài đặt',
          tabBarIcon: () => (
            <Text style={{ fontSize: 22 }}>⚙️</Text>
          ),
        }}
      />
    </Tabs>
  )
}
