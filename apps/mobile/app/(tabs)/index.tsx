import { Text, View } from 'react-native'

export default function HomeScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>🏖️ S-Local Tourist</Text>
      <Text style={{ fontSize: 16, color: '#666', marginTop: 8 }}>Khám phá Sầm Sơn</Text>
    </View>
  )
}
