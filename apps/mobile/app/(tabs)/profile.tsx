import { StyleSheet, Text, View } from 'react-native'

const colors = {
  primary: '#005E97',
  primaryFixed: '#90E0EF',
  surface: '#F4F7FB',
  surfaceContainerLow: '#EDF1F8',
  onSurface: '#161B2E',
  onSurfaceVariant: '#3B4460',
  outline: '#6B7694',
}

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={{ fontSize: 32 }}>👤</Text>
        </View>
        <Text style={styles.name}>Khách du lịch</Text>
        <Text style={styles.sub}>Đăng nhập để quản lý tài khoản</Text>
      </View>

      {/* Menu */}
      <View style={styles.menu}>
        {[
          { icon: '🎟️', label: 'Lịch sử voucher' },
          { icon: '📦', label: 'Đơn hàng' },
          { icon: '❤️', label: 'Danh sách yêu thích' },
          { icon: '⚙️', label: 'Cài đặt' },
        ].map((item) => (
          <View key={item.label} style={styles.menuItem}>
            <Text style={{ fontSize: 20 }}>{item.icon}</Text>
            <Text style={styles.menuLabel}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  avatarSection: { alignItems: 'center', paddingTop: 48, paddingBottom: 32 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  name: { fontSize: 20, fontWeight: '600', color: colors.onSurface },
  sub: { fontSize: 14, color: colors.onSurfaceVariant, marginTop: 4 },
  menu: { paddingHorizontal: 16 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 8,
  },
  menuLabel: { fontSize: 16, fontWeight: '500', color: colors.onSurface },
})
