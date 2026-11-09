import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'

// Android 模拟器通过 10.0.2.2 访问宿主机；真机可用环境变量指定电脑的局域网地址。
const DEFAULT_API_BASE = Platform.OS === 'android'
  ? 'http://10.0.2.2:8000/api'
  : 'http://localhost:8000/api'
const API_BASE = (process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_API_BASE).replace(/\/$/, '')

async function request(path: string, options: RequestInit = {}, timeoutMs = 8000) {
  const token = await AsyncStorage.getItem('token')
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)

  try {
    let res: Response
    try {
      res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: { ...headers, ...options.headers },
        signal: controller.signal,
      })
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        throw new Error('请求超时，请确认后端服务已启动')
      }
      throw new Error('无法连接服务器，请确认后端服务已启动')
    }

    const contentType = res.headers.get('content-type') || ''
    const body = await res.text()
    let data: any = null

    if (body && contentType.includes('application/json')) {
      try {
        data = JSON.parse(body)
      } catch {
        throw new Error('服务器返回了无效的 JSON 数据')
      }
    } else if (body) {
      throw new Error(`服务器响应格式异常（HTTP ${res.status}）`)
    }

    if (!res.ok) throw new Error(data?.error || `请求失败（HTTP ${res.status}）`)
    return data
  } finally {
    clearTimeout(id)
  }
}

export const api = {
  // 认证
  register: (username: string, password: string) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) }),
  login: (username: string, password: string) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),

  // 用户
  getMe: () => request('/user/me'),
  updateProfile: (data: Record<string, any>) =>
    request('/user/profile', { method: 'PUT', body: JSON.stringify(data) }),

  // 帖子
  getPosts: (type: string) => request(`/posts/${type}`),
  getMyPosts: () => request('/posts/mine'),
  createPost: (data: { type: string; title?: string; content: string; image_url?: string; bounty?: number }) =>
    request('/posts', { method: 'POST', body: JSON.stringify(data) }),
  toggleLike: (postId: string) => request(`/posts/${postId}/like`, { method: 'POST' }),

  // 待办事项
  getTodos: () => request('/todos'),
  createTodo: (text: string) => request('/todos', { method: 'POST', body: JSON.stringify({ text }) }),
  updateTodo: (id: string, data: { text?: string; completed?: boolean }) =>
    request(`/todos/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTodo: (id: string) => request(`/todos/${id}`, { method: 'DELETE' }),

  // 专注记录
  getFocusSessions: () => request('/focus-sessions'),
  createFocusSession: (data: { name: string; duration: number; mode: string }) =>
    request('/focus-sessions', { method: 'POST', body: JSON.stringify(data) }),
  deleteFocusSession: (id: string) => request(`/focus-sessions/${id}`, { method: 'DELETE' }),

  // 通知
  getLikeNotifications: () => request('/posts/notifications'),

  // 猫咪状态
  getCatState: () => request('/cat/state'),
  saveCatState: (data: Record<string, any>) =>
    request('/cat/state', { method: 'PUT', body: JSON.stringify(data) }),

  // AI 学习助手（卡片）
  getStudyInsights: () => request('/study/insights'),
  refreshStudyInsight: (kind: string) =>
    request(`/study/insights/${kind}/refresh`, { method: 'POST' }),
  getSessionSummary: (sessionId: number) =>
    request(`/study/sessions/${sessionId}/summary`, { method: 'POST' }),

  // 问答：要等模型多步（查表 -> 再答），放宽到 30 秒
  askStudy: (question: string) =>
    request(
      '/study/ask',
      { method: 'POST', body: JSON.stringify({ question }) },
      30000
    ),

  // 待办拆解（提议 → 确认）
  // 要等模型，8 秒不够，单独放宽到 30 秒
  breakdownTodos: (goal: string) =>
    request(
      '/study/proposals/todo-breakdown',
      { method: 'POST', body: JSON.stringify({ goal }) },
      30000
    ),
  confirmProposal: (id: number, items?: string[]) =>
    request(`/study/proposals/${id}/confirm`, {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),
  dismissProposal: (id: number) =>
    request(`/study/proposals/${id}/dismiss`, { method: 'POST' }),
}
