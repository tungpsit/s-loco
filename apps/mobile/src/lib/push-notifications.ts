import Constants from 'expo-constants'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { notificationsApi } from './api'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

let activeRegistration: Promise<void> | null = null
let registeredToken: string | null = null

export function registerPushNotifications() {
  if (activeRegistration) return activeRegistration

  activeRegistration = registerDeviceToken().finally(() => {
    activeRegistration = null
  })

  return activeRegistration
}

async function registerDeviceToken() {
  if (Platform.OS === 'web') return

  const permission = await Notifications.getPermissionsAsync()
  let status = permission.status

  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync()
    status = requested.status
  }

  if (status !== 'granted') return

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('s_loco_notifications', {
      name: 'S-Loco',
      importance: Notifications.AndroidImportance.DEFAULT,
    })
  }

  const projectId = Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId
  const pushToken = projectId
    ? await Notifications.getExpoPushTokenAsync({ projectId })
    : await Notifications.getExpoPushTokenAsync()

  if (!pushToken.data || pushToken.data === registeredToken) return

  await notificationsApi.registerToken(pushToken.data, Platform.OS)
  registeredToken = pushToken.data
}
