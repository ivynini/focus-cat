// User profile
export interface UserProfile {
  id: string
  username: string
  avatar_url?: string
  coins: number
  total_focus_minutes: number
  created_at: string
}

// Cat state
export interface CatState {
  id: string
  user_id: string
  name: string
  hunger: number // 0-100
  happiness: number // 0-100
  current_skin: string
  unlocked_skins: string[]
  last_fed_at: string
}

// Focus session
export interface FocusSession {
  id: string
  user_id: string
  duration_minutes: number
  coins_earned: number
  started_at: string
  ended_at: string
}

// Community post
export interface Post {
  id: string
  user_id: string
  username: string
  content: string
  image_url?: string
  likes: number
  created_at: string
}

// Daily content (from external API or curated)
export interface DailyContent {
  quote: string
  quote_author: string
  article_title: string
  article_url: string
  song_name: string
  song_artist: string
  song_url: string
}
