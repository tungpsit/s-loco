import { Tabs } from 'expo-router'
import { Platform, Text, View } from 'react-native'
import { colors, spacing } from '../../lib/theme'

const TAB_ICONS: Record<string, string> = {
  index: '⌂',
  search: '🔍',
  vouchers: '🎫',
  profile: '☺',
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <View
            style={{
              width: 34,
              height: 28,
              borderRadius: 14,
              backgroundColor: focused ? colors.primaryFixed : colors.transparent,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 19, color: focused ? colors.primary : colors.outline }}>
              {TAB_ICONS[route.name] || '●'}
            </Text>
          </View>
        ),
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.outlineVariant,
          elevation: 0,
          shadowOpacity: 0,
          height: Platform.OS === 'web' ? 72 : 88,
          paddingBottom: Platform.OS === 'web' ? 8 : 24,
          paddingTop: 10,
          ...(Platform.OS === 'web'
            ? { backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }
            : {}),
        } as any,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.onSurfaceVariant,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600' as const,
          marginTop: -2,
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
