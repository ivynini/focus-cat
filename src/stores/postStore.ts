import { create } from 'zustand'
import { api } from '../lib/api'

const PHOTO1 = require('../../assets/photo1.jpg')
const CAT_F0 = require('../../catactivity/未命名/F0.png')

export interface SquarePost {
  id: string
  user: { name: string; avatar: any }
  image: any
  title: string
  content: string
  likes: number
  liked: boolean
  time: string
}

export interface HelpPost {
  id: string
  user: { name: string; avatar: any }
  time: string
  bounty: number
  content: string
  image?: any
  replies: number
  likes: number
  liked: boolean
}

function fmtTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return '刚刚'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}分钟前`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}小时前`
  const day = Math.floor(hr / 24)
  if (day < 30) return `${day}天前`
  return '很久以前'
}

function dbToPost(row: any): SquarePost | HelpPost {
  const user = {
    name: row.nickname || row.username || '猫友',
    avatar: row.avatar ? { uri: row.avatar } : CAT_F0,
  }
  const time = fmtTime(row.created_at)
  const image = row.image_url ? { uri: row.image_url } : PHOTO1

  if (row.type === 'square') {
    return {
      id: String(row.id),
      user,
      image,
      title: row.title || '',
      content: row.content || '',
      likes: row.likes || 0,
      liked: !!row.liked,
      time,
    }
  }
  return {
    id: String(row.id),
    user,
    time,
    bounty: row.bounty || 0,
    content: row.content || '',
    image: row.image_url ? { uri: row.image_url } : undefined,
    replies: row.replies || 0,
    likes: row.likes || 0,
    liked: !!row.liked,
  }
}

interface PostStore {
  squarePosts: SquarePost[]
  helpPosts: HelpPost[]
  loading: boolean
  favorites: string[]
  fetchPosts: () => Promise<void>
  addSquarePost: (data: { title?: string; content: string; image_url?: string }) => Promise<string | undefined>
  addHelpPost: (data: { content: string; bounty?: number; image_url?: string }) => Promise<string | undefined>
  toggleSquareLike: (id: string) => Promise<void>
  toggleHelpLike: (id: string) => Promise<void>
  toggleFavorite: (id: string) => void
}

export const usePostStore = create<PostStore>((set, get) => ({
  squarePosts: [],
  helpPosts: [],
  loading: false,
  favorites: [],

  fetchPosts: async () => {
    set({ loading: true })
    try {
      const [square, help] = await Promise.all([
        api.getPosts('square').catch(() => []),
        api.getPosts('help').catch(() => []),
      ])
      set({
        squarePosts: (square as any[]).map(dbToPost) as SquarePost[],
        helpPosts: (help as any[]).map(dbToPost) as HelpPost[],
        loading: false,
      })
    } catch {
      set({ loading: false })
    }
  },

  addSquarePost: async (data) => {
    const res = await api.createPost({ type: 'square', ...data })
    if (res.post) {
      const post = dbToPost(res.post) as SquarePost
      set((s) => ({ squarePosts: [post, ...s.squarePosts] }))
      return post.id
    }
    throw new Error('发布失败')
  },

  addHelpPost: async (data) => {
    const res = await api.createPost({ type: 'help', ...data })
    if (res.post) {
      const post = dbToPost(res.post) as HelpPost
      set((s) => ({ helpPosts: [post, ...s.helpPosts] }))
      return post.id
    }
    throw new Error('发布失败')
  },

  toggleSquareLike: async (id) => {
    const prev = get().squarePosts
    set((s) => ({
      squarePosts: s.squarePosts.map((p) =>
        p.id === id ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : p
      ),
    }))
    try {
      await api.toggleLike(id)
    } catch {
      set({ squarePosts: prev })
    }
  },

  toggleHelpLike: async (id) => {
    const prev = get().helpPosts
    set((s) => ({
      helpPosts: s.helpPosts.map((p) =>
        p.id === id ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : p
      ),
    }))
    try {
      await api.toggleLike(id)
    } catch {
      set({ helpPosts: prev })
    }
  },

  toggleFavorite: (id) => {
    const { favorites } = get()
    if (favorites.includes(id)) {
      set({ favorites: favorites.filter((fid) => fid !== id) })
    } else {
      set({ favorites: [...favorites, id] })
    }
  },
}))
