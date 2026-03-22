import { Text, View } from 'react-native'

export default function OrdersScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>🏪 S-Local Vendor</Text>
      <Text style={{ fontSize: 16, color: '#666', marginTop: 8 }}>Quản lý đơn hàng</Text>
    </View>
  )
}
