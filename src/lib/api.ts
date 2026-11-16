import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'
import { Platform } from 'react-native'

/**
 * 后端地址。
 *
 * 原来写死 10.0.2.2（Android 模拟器指向宿主机的别名），手机扫码时它指向手机自己，
 * 所有接口都失败 —— 表现就是「数据全空、金币 0」，看着像没更新。
 *
 * 现在从 Metro 的地址反推：Metro 在 10.0.2.2:8081 → 后端在 10.0.2.2:8000；
 * 手机连的是 192.168.x.x:8081（局域网）→ 后端就是同一个 IP 的 8000；
 * 走 USB `adb reverse` 时是 127.0.0.1:8081 → 后端 127.0.0.1:8000。
 * 需要指定别的地址时，用 EXPO_PUBLIC_API_BASE_URL 覆盖。
 */
function resolveApiBase(): string {
  const configured = process.env.EXPO_PUBLIC_API_BASE_URL
  if (configured) return configured.replace(/\/$/, '')

  const hostUri =
    Constants.expoConfig?.hostUri ||
    // 开发环境下 Metro 的地址也可能挂在这里
    (Constants as any).expoGoConfig?.debuggerHost ||
    (Constants as any).linkingUri?.replace(/^https?:\/\//, '')

  const host = typeof hostUri === 'string' ? hostUri.split('/')[0].split(':')[0] : ''
  if (host) return `http://${host}:8000/api`

  return Platform.OS === 'android' ? 'http://10.0.2.2:8000/api' : 'http://localhost:8000/api'
}

const API_BASE = resolveApiBase()

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

/** 后端存的是 /uploads/xxx 这种相对路径，加载图片时补上服务地址。 */
export function absoluteUrl(path?: string | null): string | undefined {
  if (!path) return undefined
  if (/^https?:\/\//i.test(path)) return path
  const origin = API_BASE.replace(/\/api$/, '')
  return `${origin}${path.startsWith('/') ? '' : '/'}${path}`
}

export const api = {
  // 图片上传：不能用上面那个 request —— 它写死了 Content-Type: application/json，
  // multipart 得让 fetch 自己带 boundary
  uploadImage: async (uri: string, mimeType = 'image/jpeg', timeoutMs = 30000) => {
    const token = await AsyncStorage.getItem('token')
    const form = new FormData()
    const name = uri.split('/').pop() || `upload${mimeType === 'image/png' ? '.png' : '.jpg'}`
    // RN 的 FormData 认这个结构，类型声明里没有，所以断言一下
    form.append('file', { uri, name, type: mimeType } as unknown as Blob)

    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(`${API_BASE}/uploads/image`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form,
        signal: controller.signal,
      })
      const text = await res.text()
      let data: any = null
      try {
        data = text ? JSON.parse(text) : null
      } catch {
        throw new Error('服务器返回了无效的响应')
      }
      if (!res.ok) throw new Error(data?.error || `上传失败（HTTP ${res.status}）`)
      return data
    } catch (error: any) {
      if (error?.name === 'AbortError') throw new Error('上传超时，请检查网络')
      throw error?.message ? error : new Error('无法连接服务器')
    } finally {
      clearTimeout(id)
    }
  },

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

  // 评论
  getComments: (postId: string | number) => request(`/posts/${postId}/comments`),
  createComment: (postId: string | number, content: string) =>
    request(`/posts/${postId}/comments`, { method: 'POST', body: JSON.stringify({ content }) }),
  deleteComment: (commentId: string | number) =>
    request(`/posts/comments/${commentId}`, { method: 'DELETE' }),

  // 日记（私密，只有自己能看）
  getDiary: () => request('/diary'),
  createDiary: (data: { title?: string; content: string; quote?: string; quote_author?: string }) =>
    request('/diary', { method: 'POST', body: JSON.stringify(data) }),
  deleteDiary: (id: string | number) => request(`/diary/${id}`, { method: 'DELETE' }),

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
