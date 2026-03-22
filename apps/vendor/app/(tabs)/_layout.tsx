import { Tabs } from 'expo-router'

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: 'Đơn hàng' }} />
      <Tabs.Screen name="scan" options={{ title: 'Quét QR' }} />
      <Tabs.Screen name="earnings" options={{ title: 'Thu nhập' }} />
      <Tabs.Screen name="settings" options={{ title: 'Cài đặt' }} />
    </Tabs>
  )
}
