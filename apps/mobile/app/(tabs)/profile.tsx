import { router } from 'expo-router'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, spacing, typography } from '../../lib/theme'
import { authApi } from '../../src/lib/api'
import { useAuthStore } from '../../src/stores/auth-store'

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
  { icon: '🤖', label: 'Lịch trình AI', key: 'ai', action: () => router.push('/ai/itinerary') },
  { icon: '🌤️', label: 'Thời tiết', key: 'weather', action: () => router.push('/content/weather') },
  { icon: '💬', label: 'Hỗ trợ', key: 'support', action: () => {} },
  { icon: '⚙️', label: 'Cài đặt', key: 'settings', action: () => {} },
]

export default function ProfileScreen() {
  const { isLoggedIn, user, logout } = useAuthStore()

  async function handleLogout() {
    try {
      await authApi.logout()
    } catch {
      /* ignore API errors on logout */
    }
    await logout()
    router.replace('/(tabs)')
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.eyebrow}>ACCOUNT</Text>
          <Text style={styles.title}>Tài khoản</Text>
          <Text style={styles.subtitle}>Quản lý voucher, lịch trình và ưu đãi S-Loco</Text>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.full_name ?? user?.phone ?? '?')[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {user?.full_name || user?.phone || 'Khách S-Loco'}
            </Text>
            <Text style={styles.profilePhone}>
              {user?.phone ?? user?.email ?? 'Đăng nhập để lưu voucher và theo dõi đơn hàng'}
            </Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>
                {isLoggedIn ? (user?.role === 'tourist' ? '🌊 Du khách' : 'Người dùng') : 'Khách'}
              </Text>
            </View>
          </View>
        </View>

        {!isLoggedIn && (
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() =>
              router.push({ pathname: '/auth/otp', params: { redirectTo: '/(tabs)/profile' } })
            }
            activeOpacity={0.75}
          >
            <Text style={styles.loginText}>Đăng nhập để cá nhân hóa trải nghiệm</Text>
          </TouchableOpacity>
        )}

        {/* Menu */}
        <View style={styles.section}>
          <View style={styles.menuCard}>
            {MENU_ITEMS.map((item, i) => (
              <View key={item.key}>
                <TouchableOpacity style={styles.menuRow} onPress={item.action} activeOpacity={0.6}>
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
        {isLoggedIn && (
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: 54,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  eyebrow: { ...typography.labelSm, color: 'rgba(255,255,255,0.72)', fontWeight: '800' },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '800', color: colors.white, marginTop: 4 },
  subtitle: { ...typography.bodyMd, color: 'rgba(255,255,255,0.78)', marginTop: 4 },
  profileCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 22,
    marginHorizontal: spacing.base,
    marginTop: -34,
    padding: spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.primary,
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
  profileName: {
    ...typography.titleMd,
  },
  profilePhone: {
    ...typography.bodySm,
    color: colors.onSurfaceVariant,
  },
  roleBadge: {
    marginTop: 4,
    backgroundColor: colors.primaryFixed,
    borderRadius: 9999,
    paddingVertical: 2,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
  },
  roleText: {
    ...typography.labelSm,
    color: colors.primary,
  },
  loginBtn: {
    marginHorizontal: spacing.base,
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: 9999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  loginText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: spacing.base,
    marginTop: spacing.lg,
  },
  menuCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
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
    borderRadius: 14,
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
    borderRadius: 48,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: {
    color: colors.error,
    fontSize: 15,
    fontWeight: '600',
  },
})
