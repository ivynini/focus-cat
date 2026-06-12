import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { api } from '../lib/api'

export interface ProfileData {
  avatar?: string
  nickname: string
  catAccount: string
  bio: string
  gender: 'male' | 'female' | 'secret'
  birthday: string
  region: string
  occupation: string
  school: string
}

const DEFAULT_PROFILE: ProfileData = {
  nickname: '',
  catAccount: '',
  bio: '',
  gender: 'secret',
  birthday: '',
  region: '',
  occupation: '',
  school: '',
}

function dbToProfile(user: any): ProfileData {
  return {
    nickname: user.nickname || '',
    catAccount: user.cat_account || '',
    bio: user.bio || '',
    gender: user.gender || 'secret',
    birthday: user.birthday || '',
    region: user.region || '',
    occupation: user.occupation || '',
    school: user.school || '',
    avatar: user.avatar || '',
  }
}

interface AuthState {
  isLoggedIn: boolean
  username: string
  loading: boolean
  error: string
  profile: ProfileData
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  updateProfile: (data: Partial<ProfileData>) => Promise<void>
}

export const useAuth = create<AuthState>((set, get) => ({
  isLoggedIn: false,
  username: '',
  loading: true,
  error: '',
  profile: { ...DEFAULT_PROFILE },

  login: async (username, password) => {
    try {
      const { token, user } = await api.login(username, password)
      await AsyncStorage.setItem('token', token)
      set({ isLoggedIn: true, username: user.username, profile: dbToProfile(user), error: '' })
    } catch (e: any) {
      set({ error: e.message })
    }
  },

  register: async (username, password) => {
    if (password.length < 4) {
      set({ error: '密码至少4位' })
      return
    }
    try {
      const { token, user } = await api.register(username, password)
      await AsyncStorage.setItem('token', token)
      set({ isLoggedIn: true, username: user.username, profile: dbToProfile(user), error: '' })
    } catch (e: any) {
      set({ error: e.message })
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('token')
    set({ isLoggedIn: false, username: '', profile: { ...DEFAULT_PROFILE }, error: '' })
  },

  checkAuth: async () => {
    try {
      const token = await AsyncStorage.getItem('token')
      if (!token) {
        set({ loading: false })
        return
      }
      const user = await api.getMe()
      set({ isLoggedIn: true, username: user.username, profile: dbToProfile(user), loading: false })
    } catch {
      await AsyncStorage.removeItem('token')
      set({ isLoggedIn: false, loading: false })
    }
  },

  updateProfile: async (data) => {
    const { username } = get()
    if (!username) return
    try {
      await api.updateProfile({
        nickname: data.nickname,
        cat_account: data.catAccount,
        bio: data.bio,
        gender: data.gender,
        birthday: data.birthday,
        region: data.region,
        occupation: data.occupation,
        school: data.school,
      })
      set({ profile: { ...get().profile, ...data } })
    } catch (e: any) {
      set({ error: e.message })
    }
  },
}))
