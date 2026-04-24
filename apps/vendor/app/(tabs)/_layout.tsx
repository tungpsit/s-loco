import { Tabs } from 'expo-router'
import { StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native'
import { DESKTOP_BREAKPOINT } from '../../src/lib/responsive'

/* ─── S-Loco Coastal Editorial Design Tokens ─── */
const colors = {
  primary: '#005E97',
  surface: '#F4F7FB',
  onSurface: '#161B2E',
  outline: '#6B7694',
  surfaceContainerLow: '#EDF1F8',
}

const TAB_META: Record<string, { icon: string; label: string }> = {
  index: { icon: '🏠', label: 'Tổng quan' },
  scan: { icon: '📷', label: 'Quét QR' },
  orders: { icon: '🧾', label: 'Đơn hàng' },
  earnings: { icon: '💰', label: 'Thu nhập' },
  settings: { icon: '⚙️', label: 'Cài đặt' },
}

export default function TabLayout() {
  const { width } = useWindowDimensions()
  const isDesktop = width >= DESKTOP_BREAKPOINT

  return (
    <Tabs
      tabBar={(props) => <VendorTabBar {...props} isDesktop={isDesktop} />}
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.onSurface,
        headerTitleStyle: { fontWeight: '600' },
        tabBarPosition: isDesktop ? 'left' : 'bottom',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tổng quan',
          tabBarIcon: () => <Text style={{ fontSize: 22 }}>🏠</Text>,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Quét QR',
          tabBarIcon: () => <Text style={{ fontSize: 22 }}>📷</Text>,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Đơn hàng',
          tabBarIcon: () => <Text style={{ fontSize: 22 }}>🧾</Text>,
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: 'Thu nhập',
          tabBarIcon: () => <Text style={{ fontSize: 22 }}>💰</Text>,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Cài đặt',
          tabBarIcon: () => <Text style={{ fontSize: 22 }}>⚙️</Text>,
        }}
      />
    </Tabs>
  )
}

interface VendorTabBarProps {
  state: { index: number; routes: Array<{ key: string; name: string }> }
  navigation: { navigate: (name: string) => void }
  isDesktop: boolean
}

function VendorTabBar({ state, navigation, isDesktop }: VendorTabBarProps) {
  return (
    <View style={[styles.tabBar, isDesktop ? styles.tabBarDesktop : styles.tabBarMobile]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index
        const meta = TAB_META[route.name] ?? { icon: '•', label: route.name }

        return (
          <TouchableOpacity
            key={route.key}
            style={[
              styles.tabItem,
              isDesktop ? styles.tabItemDesktop : styles.tabItemMobile,
              focused && styles.tabItemActive,
            ]}
            onPress={() => navigation.navigate(route.name)}
            activeOpacity={0.75}
          >
            <Text style={styles.tabIcon}>{meta.icon}</Text>
            <Text
              style={[
                styles.tabLabel,
                isDesktop && styles.tabLabelDesktop,
                focused && styles.tabLabelActive,
              ]}
              numberOfLines={1}
            >
              {meta.label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
  },
  tabBarDesktop: {
    width: 220,
    borderRightWidth: 1,
    borderRightColor: '#D6DDEA',
    paddingHorizontal: 14,
    paddingTop: 26,
    gap: 8,
  },
  tabBarMobile: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#D6DDEA',
    paddingTop: 6,
    paddingBottom: 4,
  },
  tabItem: {
    borderRadius: 10,
  },
  tabItemDesktop: {
    minHeight: 48,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabItemMobile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabItemActive: {
    backgroundColor: colors.surfaceContainerLow,
  },
  tabIcon: { fontSize: 20 },
  tabLabel: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '500',
    color: colors.outline,
  },
  tabLabelDesktop: {
    marginTop: 0,
    marginLeft: 10,
    fontSize: 14,
  },
  tabLabelActive: {
    color: colors.primary,
  },
})
