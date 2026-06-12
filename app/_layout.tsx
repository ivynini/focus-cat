import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { View, Text, ActivityIndicator } from 'react-native'
import { useEffect } from 'react'
import { useFonts } from '../src/hooks/useFonts'
import { useAuth } from '../src/stores/authStore'
import { usePostStore } from '../src/stores/postStore'
import { useCatStore } from '../src/stores/catStore'

export default function RootLayout() {
  const fontsLoaded = useFonts()
  const checkAuth = useAuth((s) => s.checkAuth)
  const fetchPosts = usePostStore((s) => s.fetchPosts)
  const fetchCat = useCatStore((s) => s.fetchCatState)
  const isLoggedIn = useAuth((s) => s.isLoggedIn)

  useEffect(() => { checkAuth() }, [checkAuth])
  useEffect(() => { fetchPosts() }, [fetchPosts])
  useEffect(() => { if (isLoggedIn) fetchCat() }, [isLoggedIn, fetchCat])

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF8F0' }}>
        <ActivityIndicator color="#F4A460" />
        <Text style={{ marginTop: 8, color: '#8D6E63' }}>Loading...</Text>
      </View>
    )
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  )
}
