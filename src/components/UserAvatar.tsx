import { View, Image, StyleSheet } from 'react-native'
import { useAuth } from '../stores/authStore'
import { PixelIcon } from './PixelIcon'

const DEFAULT_AVATAR_IMAGE = require('../../catactivity/未命名/F0.png')

export function UserAvatar({ size = 40 }: { size?: number }) {
  const { isLoggedIn, profile } = useAuth()

  const avatarSource = profile?.avatar ? { uri: profile.avatar } : DEFAULT_AVATAR_IMAGE

  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 2 }]}>
      {isLoggedIn ? (
        <Image source={avatarSource} style={{ width: size, height: size, borderRadius: size / 2 }} />
      ) : (
        <PixelIcon name="cat" size={size} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
})
