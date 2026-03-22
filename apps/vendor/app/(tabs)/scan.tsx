import { StyleSheet, Text, View } from 'react-native'

const colors = {
  primary: '#005E97',
  primaryFixed: '#90E0EF',
  surface: '#F4F7FB',
  onSurface: '#161B2E',
  onSurfaceVariant: '#3B4460',
}

export default function ScanScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.placeholder}>
        <View style={styles.iconWrap}>
          <Text style={{ fontSize: 40 }}>📷</Text>
        </View>
        <Text style={styles.title}>Quét QR Voucher</Text>
        <Text style={styles.subtitle}>Quét mã QR trên voucher của khách để xác nhận sử dụng</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.onSurface,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
  },
})
