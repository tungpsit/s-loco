import { Tabs } from 'expo-router'
import { Platform, Text, View } from 'react-native'
import { colors, spacing } from '../../lib/theme'

const TAB_ICONS: Record<string, string> = {
  index: '🏠',
  search: '🔍',
  vouchers: '🎫',
  profile: '👤',
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: focused ? colors.primaryFixed : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.6 }}>
              {TAB_ICONS[route.name] || '●'}
            </Text>
          </View>
        ),
        tabBarStyle: {
          backgroundColor: 'rgba(244, 247, 251, 0.85)',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: Platform.OS === 'web' ? 72 : 88,
          paddingBottom: Platform.OS === 'web' ? 8 : 24,
          paddingTop: spacing.sm,
          ...(Platform.OS === 'web'
            ? { backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }
            : {}),
        } as any,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.outline,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500' as const,
          marginTop: -4,
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Trang chủ' }} />
      <Tabs.Screen name="search" options={{ title: 'Tìm kiếm' }} />
      <Tabs.Screen name="vouchers" options={{ title: 'Voucher' }} />
      <Tabs.Screen name="profile" options={{ title: 'Tài khoản' }} />
    </Tabs>
  )
}
