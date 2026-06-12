import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { api } from '../lib/api'

interface CatStore {
  coins: number
  hunger: number
  happiness: number
  boughtFood: Record<string, number>
  unlockedAccessories: string[]
  equippedAcc: string | null
  loading: boolean
  focusCompletedAt: number
  todayMinutes: number
  todayDate: string
  catName: string
  catBirthday: string

  fetchCatState: () => Promise<void>
  addCoins: (amount: number) => void
  markFocusCompleted: () => void
  addFocusMinutes: (minutes: number) => void
  setTodayMinutes: (minutes: number) => void
  setCatName: (name: string) => void
  setCatBirthday: (birthday: string) => void
  loadCatProfile: () => Promise<void>
  setEquippedAcc: (id: string | null) => void
  buyItem: (itemId: string, price: number, isFood: boolean) => void
  feedCat: (itemId: string, hungerGain: number) => void
  petCat: () => void
  tickDecay: () => void
  syncToServer: () => Promise<void>
}

export const useCatStore = create<CatStore>((set, get) => ({
  coins: 0,
  hunger: 80,
  happiness: 100,
  boughtFood: {},
  unlockedAccessories: [],
  equippedAcc: null,
  loading: true,
  focusCompletedAt: 0,
  todayMinutes: 0,
  todayDate: '',
  catName: '阿比',
  catBirthday: '',

  fetchCatState: async () => {
    try {
      const data = await api.getCatState()
      set({
        coins: data.coins || 0,
        hunger: data.hunger ?? 80,
        happiness: data.happiness ?? 100,
        boughtFood: data.bought_food || {},
        unlockedAccessories: data.unlocked_accessories || [],
        equippedAcc: data.equipped_accessory || null,
        todayMinutes: data.today_minutes || 0,
        todayDate: data.today_date || '',
        loading: false,
      })
    } catch {
      set({ loading: false })
    }
  },

  addCoins: (amount) => {
    set({ coins: get().coins + amount })
  },

  markFocusCompleted: () => {
    set((s) => ({ focusCompletedAt: s.focusCompletedAt + 1 }))
  },

  addFocusMinutes: (minutes) => {
    const today = new Date().toISOString().split('T')[0]
    const s = get()
    if (s.todayDate !== today) {
      set({ todayMinutes: minutes, todayDate: today })
    } else {
      set({ todayMinutes: s.todayMinutes + minutes })
    }
  },

  setTodayMinutes: (minutes) => {
    const today = new Date().toISOString().split('T')[0]
    const s = get()
    if (s.todayDate !== today) {
      set({ todayMinutes: minutes, todayDate: today })
    } else {
      set({ todayMinutes: Math.max(s.todayMinutes, minutes) })
    }
    get().syncToServer()
  },

  setCatName: (name) => {
    set({ catName: name })
    AsyncStorage.setItem('catName', name).catch(() => {})
  },

  setCatBirthday: (birthday) => {
    set({ catBirthday: birthday })
    AsyncStorage.setItem('catBirthday', birthday).catch(() => {})
  },

  loadCatProfile: async () => {
    try {
      const [name, birthday] = await Promise.all([
        AsyncStorage.getItem('catName'),
        AsyncStorage.getItem('catBirthday'),
      ])
      set({
        catName: name || '阿比',
        catBirthday: birthday || '',
      })
    } catch {}
  },

  setEquippedAcc: (id) => {
    set({ equippedAcc: id })
    get().syncToServer()
  },

  buyItem: (itemId, price, isFood) => {
    const s = get()
    if (s.coins < price) return
    set({ coins: s.coins - price })
    if (isFood) {
      set({ boughtFood: { ...s.boughtFood, [itemId]: (s.boughtFood[itemId] || 0) + 1 } })
    } else {
      set({ unlockedAccessories: [...s.unlockedAccessories, itemId] })
    }
    get().syncToServer()
  },

  feedCat: (itemId, hungerGain) => {
    const s = get()
    const count = s.boughtFood[itemId] || 0
    if (count <= 0) return
    set({
      boughtFood: { ...s.boughtFood, [itemId]: count - 1 },
      hunger: Math.min(100, s.hunger + hungerGain),
    })
    get().syncToServer()
  },

  petCat: () => {
    set({ happiness: Math.min(100, get().happiness + 8) })
    get().syncToServer()
  },

  tickDecay: () => {
    set({
      hunger: Math.max(0, get().hunger - 1),
      happiness: Math.max(0, get().happiness - 0.5),
    })
  },

  syncToServer: () => {
    const s = get()
    api.saveCatState({
      hunger: s.hunger,
      happiness: s.happiness,
      equipped_accessory: s.equippedAcc,
      bought_food: s.boughtFood,
      unlocked_accessories: s.unlockedAccessories,
      coins: s.coins,
      today_minutes: s.todayMinutes,
      today_date: s.todayDate,
    }).catch(() => {})
  },
}))
