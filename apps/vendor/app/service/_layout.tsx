import { Stack } from 'expo-router'

export default function ServiceLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#F4F7FB' },
        headerTintColor: '#161B2E',
        headerTitleStyle: { fontWeight: '600' },
      }}
    />
  )
}
