/**
 * Bottom tab navigator — 5 tabs: Home, Browse, My Vouchers, AI, Profile.
 */
import { Tabs } from 'expo-router'
import { Platform, Text, View } from 'react-native'
import { colors, glass, spacing } from '../../lib/theme'

const TAB_ICONS: Record<string, string> = {
  index: 'SL',
  browse: 'EX',
  vouchers: 'QR',
  ai: 'AI',
  profile: 'ME',
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
              backgroundColor: focused ? colors.primary : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: '800',
                color: focused ? colors.white : colors.outline,
                opacity: focused ? 1 : 0.72,
              }}
            >
              {TAB_ICONS[route.name] ?? '●'}
            </Text>
          </View>
        ),
        tabBarStyle: {
          backgroundColor: glass.tabBar.backgroundColor,
          borderTopWidth: 0,
          elevation: 0,
          boxShadow: 'none',
          height: Platform.OS === 'web' ? 72 : 88,
          paddingBottom: Platform.OS === 'web' ? 8 : 24,
          paddingTop: spacing.sm,
          ...(Platform.OS !== 'web' ? { backdropFilter: 'blur(20px)' } : {}),
        } as object,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.outline,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: -4,
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Trang chủ' }} />
      <Tabs.Screen name="browse" options={{ title: 'Tìm kiếm' }} />
      <Tabs.Screen name="vouchers" options={{ title: 'Vé của tôi' }} />
      <Tabs.Screen name="ai" options={{ title: 'AI' }} />
      <Tabs.Screen name="profile" options={{ title: 'Tài khoản' }} />
    </Tabs>
  )
}
