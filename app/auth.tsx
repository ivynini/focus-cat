import { useState } from 'react'
import { StyleSheet, Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useAuth } from '../src/stores/authStore'
import { scale } from '../src/lib/scale'

export default function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const { login, register, error } = useAuth()

  const handleSubmit = async () => {
    if (!username.trim() || !password.trim()) return
    if (mode === 'login') {
      await login(username.trim(), password)
    } else {
      await register(username.trim(), password)
    }
    if (useAuth.getState().isLoggedIn) router.back()
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'center' }}>
        <View style={styles.card}>
          <Text style={styles.title}>{mode === 'login' ? 'LOGIN' : 'REGISTER'}</Text>

          <Text style={styles.label}>用户名</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="输入用户名"
            placeholderTextColor="#C0A090"
            autoCapitalize="none"
          />

          <Text style={styles.label}>密码</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="输入密码"
            placeholderTextColor="#C0A090"
            secureTextEntry
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <Text style={styles.submitText}>{mode === 'login' ? '登录' : '注册'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setMode(mode === 'login' ? 'register' : 'login'); setUsername(''); setPassword('') }}>
            <Text style={styles.switchText}>
              {mode === 'login' ? '没有账号？去注册' : '已有账号？去登录'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F0', justifyContent: 'center', padding: scale(24) },
  card: {
    backgroundColor: '#FFFFFF', padding: scale(24),
    borderWidth: 3, borderColor: '#E0D0C0',
  },
  title: { fontSize: scale(22), fontFamily: 'Pixel', color: '#5D4037', marginBottom: scale(20), textAlign: 'center' },
  label: { fontSize: scale(13), fontFamily: 'PixelSC', color: '#8D6E63', marginBottom: scale(6), marginTop: scale(12) },
  input: {
    backgroundColor: '#FFF8F0', borderWidth: 2, borderColor: '#E0D0C0',
    paddingHorizontal: scale(14), paddingVertical: scale(10),
    fontSize: scale(15), fontFamily: 'PixelSC', color: '#4E342E',
  },
  error: { color: '#EF5350', fontSize: scale(12), fontFamily: 'PixelSC', marginTop: scale(10), textAlign: 'center' },
  submitBtn: {
    backgroundColor: '#F4A460', borderWidth: 2, borderColor: '#C07840',
    paddingVertical: scale(12), alignItems: 'center', marginTop: scale(20),
  },
  submitText: { color: '#FFFFFF', fontSize: scale(16), fontFamily: 'Pixel' },
  switchText: { color: '#A1887F', fontSize: scale(12), fontFamily: 'PixelSC', textAlign: 'center', marginTop: scale(16) },
})
