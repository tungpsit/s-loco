import { StyleSheet, Text, TextInput, View } from 'react-native'

const colors = {
  primary: '#005E97',
  surface: '#F4F7FB',
  surfaceContainerHighest: '#D6DDEA',
  onSurface: '#161B2E',
  onSurfaceVariant: '#3B4460',
  outline: '#6B7694',
}

export default function SearchScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <TextInput
          style={styles.input}
          placeholder="Tìm dịch vụ, địa điểm..."
          placeholderTextColor={colors.outline}
        />
      </View>
      <View style={styles.placeholder}>
        <Text style={styles.placeholderIcon}>🔍</Text>
        <Text style={styles.placeholderText}>Nhập từ khoá để tìm kiếm dịch vụ tại Sầm Sơn</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  searchBox: { paddingHorizontal: 16, paddingTop: 16 },
  input: {
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.onSurface,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  placeholderIcon: { fontSize: 48, marginBottom: 12 },
  placeholderText: {
    fontSize: 14,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
})
