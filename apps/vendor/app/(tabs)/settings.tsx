import { router } from 'expo-router'
import { useCallback } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { authApi } from '../../src/lib/api'
import { useResponsiveLayout } from '../../src/lib/responsive'
import { useAuthStore } from '../../src/stores/auth-store'

const colors = {
  primary: '#005E97',
  primaryFixed: '#90E0EF',
  surface: '#F4F7FB',
  surfaceContainerLowest: '#FFFFFF',
  onSurface: '#161B2E',
  onSurfaceVariant: '#3B4460',
  error: '#BA1A1A',
  outline: '#6B7694',
}

interface MenuItemProps {
  icon: string
  label: string
  sub?: string
  onPress?: () => void
  danger?: boolean
}

function MenuItem({ icon, label, sub, onPress, danger }: MenuItemProps) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <Text style={styles.menuIcon}>{icon}</Text>
      <View style={styles.menuTextWrap}>
        <Text style={[styles.menuLabel, danger && { color: colors.error }]}>{label}</Text>
        {sub && <Text style={styles.menuSub}>{sub}</Text>}
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  )
}

export default function SettingsScreen() {
  const { user, logout } = useAuthStore()
  const { isDesktop, pageMaxWidth, pagePadding } = useResponsiveLayout()

  const handleLogout = useCallback(async () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          try {
            await authApi.logout()
          } catch {
            /* ignore */
          }
          await logout()
          router.replace('/auth/login')
        },
      },
    ])
  }, [logout])

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingHorizontal: pagePadding, maxWidth: pageMaxWidth },
        isDesktop && styles.contentDesktop,
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Cài đặt</Text>
      </View>

      {/* Profile */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={{ fontSize: 32 }}>🏪</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{user?.full_name ?? 'Chủ cửa hàng'}</Text>
          <Text style={styles.profileEmail}>{user?.email ?? ''}</Text>
          <Text style={styles.profileRole}>👤 Chủ cửa hàng</Text>
        </View>
      </View>

      {/* Menu groups */}
      <View style={[styles.sectionsGrid, isDesktop && styles.sectionsGridDesktop]}>
        <View style={[styles.section, isDesktop && styles.sectionDesktop]}>
          <Text style={styles.sectionTitle}>Quản lý</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon="📝"
              label="Thông tin cửa hàng"
              onPress={() => router.push('/profile')}
            />
            <MenuItem icon="🎟️" label="Quản lý dịch vụ" onPress={() => router.push('/service/')} />
          </View>
        </View>

        <View style={[styles.section, isDesktop && styles.sectionDesktop]}>
          <Text style={styles.sectionTitle}>Tài khoản</Text>
          <View style={styles.menuCard}>
            <MenuItem icon="🔔" label="Thông báo" sub="Bật thông báo đẩy" />
            <MenuItem icon="🔐" label="Đổi mật khẩu" onPress={() => {}} />
          </View>
        </View>

        <View style={[styles.section, isDesktop && styles.sectionDesktop]}>
          <Text style={styles.sectionTitle}>Hỗ trợ</Text>
          <View style={styles.menuCard}>
            <MenuItem icon="📖" label="Hướng dẫn sử dụng" />
            <MenuItem icon="💬" label="Liên hệ hỗ trợ" />
            <MenuItem icon="ℹ️" label="Về S-Loco Vendor" sub="Phiên bản 1.0.0" />
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>© 2026 S-Loco · Sầm Sơn</Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: {
    alignSelf: 'center',
    width: '100%',
    paddingBottom: 24,
  },
  contentDesktop: {
    paddingTop: 24,
  },
  header: { paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '700', color: colors.onSurface },
  profileCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: '700', color: colors.onSurface, marginBottom: 2 },
  profileEmail: { fontSize: 13, color: colors.onSurfaceVariant, marginBottom: 4 },
  profileRole: { fontSize: 12, color: colors.onSurfaceVariant },
  sectionsGrid: {},
  sectionsGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  section: { marginBottom: 20 },
  sectionDesktop: { flexBasis: '48%', flexGrow: 1 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.onSurfaceVariant,
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  menuCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F7FB',
  },
  menuIcon: { fontSize: 20, marginRight: 14, width: 28 },
  menuTextWrap: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: '500', color: colors.onSurface },
  menuSub: { fontSize: 12, color: colors.onSurfaceVariant, marginTop: 1 },
  chevron: { fontSize: 20, color: colors.outline, marginLeft: 8 },
  logoutBtn: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFEBEE',
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: colors.error },
  footer: {
    textAlign: 'center',
    color: colors.outline,
    fontSize: 11,
    marginTop: 24,
    marginBottom: 24,
  },
})
