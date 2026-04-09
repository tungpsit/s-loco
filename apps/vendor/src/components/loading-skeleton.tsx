import { ActivityIndicator, StyleSheet, View } from 'react-native'

const colors = {
  surface: '#F4F7FB',
  surfaceContainerLow: '#EDF1F8',
}

export function LoadingSkeleton({ height = 80 }: { height?: number }) {
  return (
    <View style={[styles.skeleton, { height }]}>
      <ActivityIndicator size="small" color="#005E97" />
    </View>
  )
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
