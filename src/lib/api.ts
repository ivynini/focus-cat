import AsyncStorage from '@react-native-async-storage/async-storage'

// Android 模拟器用 10.0.2.2 访问宿主机，Web/真机用 localhost
const API_BASE = 'http://10.0.2.2:3000/api'

async function request(path: string, options: RequestInit = {}) {
  const token = await AsyncStorage.getItem('token')
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), 8000)

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { ...headers, ...options.headers },
      signal: controller.signal,
    })
    clearTimeout(id)
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || '请求失败')
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
}
