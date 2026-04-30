/**
 * Bottom tab navigator — 5 tabs: Home, Browse, My Vouchers, AI, Profile.
 */
import { Tabs } from 'expo-router'
import { Platform, Text, View } from 'react-native'
import { colors, spacing } from '../../lib/theme'

const TAB_ICONS: Record<string, string> = {
  index: '⌂',
  browse: '🔍',
  vouchers: '🎫',
  ai: 'AI',
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
            <Text
              style={{
                fontSize: route.name === 'ai' ? 12 : 19,
                fontWeight: '800',
                color: focused ? colors.primary : colors.outline,
              }}
            >
              {TAB_ICONS[route.name] ?? '●'}
            </Text>
          </View>
        ),
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.outlineVariant,
          elevation: 0,
          boxShadow: 'none',
          height: Platform.OS === 'web' ? 72 : 88,
          paddingBottom: Platform.OS === 'web' ? 8 : 24,
          paddingTop: spacing.sm,
          ...(Platform.OS === 'web' ? { backdropFilter: 'blur(20px)' } : {}),
        } as object,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.onSurfaceVariant,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: -2,
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
