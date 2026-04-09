/**
 * Profile Screen — user info, settings menu, logout.
 */
import { router } from 'expo-router'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { authApi } from '../../lib/api'
import { borderRadius, colors, spacing, typography } from '../../lib/theme'
import { useAuthStore } from '../../stores/auth-store'

const MENU_ITEMS = [
  {
    icon: '🎫',
    label: 'Voucher của tôi',
    key: 'vouchers',
    action: () => router.push('/(tabs)/vouchers'),
  },
  {
    icon: '📰',
    label: 'Bài viết',
    key: 'articles',
    action: () => router.push('/content/articles'),
  },
  {
    icon: '🤖',
    label: 'Lịch trình AI',
    key: 'ai',
    action: () => router.push('/(tabs)/ai'),
  },
  {
    icon: '🌤️',
    label: 'Thời tiết',
    key: 'weather',
    action: () => router.push('/content/weather'),
  },
  {
    icon: '💬',
    label: 'Hỗ trợ',
    key: 'support',
    action: () => {},
  },
  {
    icon: '⚙️',
    label: 'Cài đặt',
    key: 'settings',
    action: () => {},
  },
]

export default function ProfileScreen() {
  const { user, logout } = useAuthStore()

  async function handleLogout() {
    try {
      await authApi.logout()
    } catch {
      /* ignore API errors on logout */
    }
    await logout()
    router.replace('/(auth)/login')
  }

  const initials = (user?.full_name ?? user?.phone ?? '?')[0]?.toUpperCase() ?? '?'

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Tài khoản</Text>
        </View>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {user?.full_name || user?.phone || 'Người dùng S-Loco'}
            </Text>
            <Text style={styles.profilePhone}>{user?.phone ?? user?.email ?? ''}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>
                {user?.role === 'tourist' ? '🌊 Du khách' : 'Người dùng'}
              </Text>
            </View>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.section}>
          <View style={styles.menuCard}>
            {MENU_ITEMS.map((item, i) => (
              <View key={item.key}>
                <TouchableOpacity
                  style={styles.menuRow}
                  onPress={item.action}
                  activeOpacity={0.6}
                  accessibilityLabel={item.label}
                >
                  <View style={styles.menuIcon}>
                    <Text style={{ fontSize: 20 }}>{item.icon}</Text>
                  </View>
                  <Text style={[typography.bodyLg, { flex: 1 }]}>{item.label}</Text>
                  <Text style={{ color: colors.outline, fontSize: 18 }}>›</Text>
                </TouchableOpacity>
                {i < MENU_ITEMS.length - 1 && <View style={styles.menuSep} />}
              </View>
            ))}
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.7}
          accessibilityLabel="Đăng xuất"
        >
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  title: { ...typography.headlineMd },
  profileCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.base,
    padding: spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  profileName: { ...typography.titleMd },
  profilePhone: { ...typography.bodySm, color: colors.onSurfaceVariant },
  roleBadge: {
    marginTop: 4,
    backgroundColor: colors.primaryFixed,
    borderRadius: borderRadius.full,
    paddingVertical: 2,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
  },
  roleText: { ...typography.labelSm, color: colors.primary },
  section: {
    paddingHorizontal: spacing.base,
    marginTop: spacing.lg,
  },
  menuCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: 14,
    gap: spacing.md,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuSep: {
    height: 1,
    backgroundColor: colors.outlineVariant,
    marginHorizontal: spacing.base,
  },
  logoutBtn: {
    marginHorizontal: spacing.base,
    marginTop: spacing.xl,
    backgroundColor: 'rgba(186, 26, 26, 0.08)',
    borderRadius: borderRadius.full,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: {
    color: colors.error,
    fontSize: 15,
    fontWeight: '600',
  },
})
