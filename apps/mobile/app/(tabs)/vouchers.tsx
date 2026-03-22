import { StyleSheet, Text, View } from 'react-native'

const colors = {
  primary: '#005E97',
  tertiaryContainer: '#5856D6',
  tertiaryFixed: '#E0DFFF',
  surface: '#F4F7FB',
  onSurface: '#161B2E',
  onSurfaceVariant: '#3B4460',
}

export default function VouchersScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.placeholder}>
        <View style={styles.iconWrap}>
          <Text style={{ fontSize: 40 }}>🎟️</Text>
        </View>
        <Text style={styles.title}>Voucher của tôi</Text>
        <Text style={styles.subtitle}>Bạn chưa có voucher nào. Khám phá ưu đãi từ vendor ngay!</Text>
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
    backgroundColor: colors.tertiaryFixed,
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
