import { StyleSheet, Text, View, Image, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { UserAvatar } from '../src/components/UserAvatar'
import { usePostStore } from '../src/stores/postStore'
import { useAuth } from '../src/stores/authStore'
import { api } from '../src/lib/api'
import { scale, sw } from '../src/lib/scale'

const MOCK_AVATAR = require('../catactivity/未命名/F0.png')

// ==================== 评论 ====================

interface CommentItem {
  id: string
  username: string
  nickname: string
  avatar: any
  content: string
  time: string
}

function fmtRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  if (Number.isNaN(diff)) return ''
  const min = Math.floor(diff / 60000)
  if (min < 1) return '刚刚'
  if (min < 60) return `${min}分钟前`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}小时前`
  return `${Math.floor(hr / 24)}天前`
}

function toCommentItem(row: any): CommentItem {
  return {
    id: String(row?.id ?? ''),
    username: row?.username || '',
    nickname: row?.nickname || row?.username || '猫友',
    avatar: row?.avatar ? { uri: row.avatar } : MOCK_AVATAR,
    content: row?.content || '',
    time: row?.created_at ? fmtRelative(row.created_at) : '',
  }
}

export default function PostDetailScreen() {
  const { post: postJson, type } = useLocalSearchParams<{ post: string; type: string }>()
  const router = useRouter()
  const [liked, setLiked] = useState(false)
  const [likes, setLikes] = useState(0)
  const [favorited, setFavorited] = useState(false)
  const [commentText, setCommentText] = useState('')
  const { favorites, toggleFavorite, toggleSquareLike, toggleHelpLike } = usePostStore()
  const { isLoggedIn, username: myUsername } = useAuth()
  const [comments, setComments] = useState<CommentItem[]>([])

  let post: any = null
  try {
    post = postJson ? JSON.parse(postJson) : null
  } catch { }

  // Init liked/likes/favorited from post data (run once on mount)
  const [initDone, setInitDone] = useState(false)
  if (!initDone && post) {
    setLiked(post.liked)
    setLikes(post.likes)
    setFavorited(favorites.includes(post.id))
    setInitDone(true)
  }

  const postId = post?.id as string | undefined
  const isDiaryPost = type === 'diary'

  // 评论从服务端拉；日记是私密的，没有评论区
  useEffect(() => {
    if (!postId || isDiaryPost) return
    let cancelled = false
    api.getComments(postId)
      .then((rows: any) => {
        if (!cancelled && Array.isArray(rows)) setComments(rows.map(toCommentItem))
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [postId, isDiaryPost])

  const handleSendComment = async () => {
    const text = commentText.trim()
    if (!text) return
    if (!isLoggedIn) {
      Alert.alert('还没登录', '登录之后才能评论')
      return
    }
    try {
      const created: any = await api.createComment(postId as string, text)
      setComments((prev) => [...prev, toCommentItem(created)])
      setCommentText('')
    } catch (e: any) {
      Alert.alert('评论失败', e?.message || '请检查网络连接后重试')
    }
  }

  const handleDeleteComment = (comment: CommentItem) => {
    Alert.alert('删除这条评论？', '删了就找不回来了。', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          api.deleteComment(comment.id)
            .then(() => setComments((prev) => prev.filter((c) => c.id !== comment.id)))
            .catch((e: any) => Alert.alert('删除失败', e?.message || '请检查网络连接后重试'))
        },
      },
    ])
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backBtn}>← 返回</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>帖子详情</Text>
          <View style={{ width: 50 }} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#A1887F', fontSize: 14 }}>帖子不存在或已删除</Text>
        </View>
      </SafeAreaView>
    )
  }

  // 显式标成 boolean：否则 TS 会在 {isHelp && ...} 里把 type 收窄成 'help'，
  // 里面那句 `type === 'square'` 就变成「不可能成立的比较」而报错。
  const isSquare: boolean = type === 'square'
  const isHelp: boolean = type === 'help'
  const isDiary = type === 'diary'

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtnWrap}>
          <Text style={styles.backBtn}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isSquare ? '广场帖' : isHelp ? '求助详情' : '日记详情'}
        </Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: scale(80) }}>
        {/* ===== 广场帖 (Xiaohongshu Style) ===== */}
        {isSquare && (
          <>
            {/* Full image */}
            <Image source={post.image} style={styles.detailImage} resizeMode="cover" />

            {/* Content area */}
            <View style={styles.detailContent}>
              {/* User bar */}
              <View style={styles.detailUserBar}>
                <Image source={post.user.avatar} style={styles.detailAvatar} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.detailUsername}>{post.user.name}</Text>
                  <Text style={styles.detailTime}>{post.time}</Text>
                </View>
                <TouchableOpacity style={styles.followBtn}>
                  <Text style={styles.followBtnText}>+ 关注</Text>
                </TouchableOpacity>
              </View>

              {/* Title + Content */}
              <Text style={styles.detailTitle}>{post.title}</Text>
              <Text style={styles.detailText}>{post.content}</Text>

              {/* Like & interaction bar */}
              <View style={styles.interactionBar}>
                <TouchableOpacity
                  style={styles.interactionBtn}
                  onPress={() => {
                    setLiked(!liked)
                    setLikes((l) => l + (liked ? -1 : 1))
                    if (type === 'square') toggleSquareLike(post.id)
                    else if (type === 'help') toggleHelpLike(post.id)
                  }}
                >
                  <Text style={[styles.interactionIcon, liked && { color: '#EF5350' }]}>
                    {liked ? '❤️' : '🤍'}
                  </Text>
                  <Text style={styles.interactionText}>{likes}</Text>
                </TouchableOpacity>
                <View style={styles.interactionBtn}>
                  <Text style={styles.interactionIcon}>💬</Text>
                  <Text style={styles.interactionText}>{comments.length}</Text>
                </View>
                <TouchableOpacity
                  style={styles.interactionBtn}
                  onPress={() => { setFavorited(!favorited); toggleFavorite(post.id) }}
                >
                  <Text style={[styles.interactionIcon, favorited && { color: '#F4A460' }]}>
                    {favorited ? '⭐' : '☆'}
                  </Text>
                  <Text style={styles.interactionText}>{favorited ? '已收藏' : '收藏'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {/* ===== 求助帖 (Weibo Style) ===== */}
        {isHelp && (
          <View style={styles.detailContent}>
            {/* User info + bounty */}
            <View style={styles.detailUserBar}>
              <Image source={post.user.avatar} style={styles.detailAvatar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.detailUsername}>{post.user.name}</Text>
                <Text style={styles.detailTime}>{post.time}</Text>
              </View>
              <View style={styles.bountyBadge}>
                <Text style={styles.bountyBadgeText}>悬赏 {post.bounty}G</Text>
              </View>
            </View>

            {/* Full content */}
            <Text style={styles.detailText}>{post.content}</Text>

            {/* Image */}
            {post.image && (
              <Image source={post.image} style={styles.detailImage} resizeMode="cover" />
            )}

            {/* Interaction bar */}
            <View style={styles.interactionBar}>
              <TouchableOpacity
                style={styles.interactionBtn}
                onPress={() => {
                  setLiked(!liked)
                  setLikes((l) => l + (liked ? -1 : 1))
                  toggleHelpLike(post.id)
                }}
              >
                <Text style={[styles.interactionIcon, liked && { color: '#EF5350' }]}>
                  {liked ? '❤️' : '🤍'}
                </Text>
                <Text style={styles.interactionText}>{likes}</Text>
              </TouchableOpacity>
              <View style={styles.interactionBtn}>
                <Text style={styles.interactionIcon}>💬</Text>
                <Text style={styles.interactionText}>{comments.length}</Text>
              </View>
              <TouchableOpacity
                style={styles.interactionBtn}
                onPress={() => { setFavorited(!favorited); toggleFavorite(post.id) }}
              >
                <Text style={[styles.interactionIcon, favorited && { color: '#F4A460' }]}>
                  {favorited ? '⭐' : '☆'}
                </Text>
                <Text style={styles.interactionText}>{favorited ? '已收藏' : '收藏'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ===== 日记帖 (Private) ===== */}
        {isDiary && (
          <View style={styles.detailContent}>
            {/* User bar */}
            <View style={styles.detailUserBar}>
              <UserAvatar size={scale(40)} />
              <View style={{ flex: 1 }}>
                <Text style={styles.detailUsername}>我的日记</Text>
                <Text style={styles.detailTime}>{post.date} · {post.weather}</Text>
              </View>
            </View>

            {/* Title + Content */}
            <Text style={styles.detailTitle}>{post.title}</Text>
            <Text style={styles.detailText}>{post.content}</Text>

            {/* Focus */}
            <View style={styles.focusTag}>
              <Text style={styles.focusTagText}>⏱ 专注时长：{post.focus}</Text>
            </View>
          </View>
        )}

        {/* ===== 评论区域 (not for diary) ===== */}
        {!isDiary && (
          <View style={styles.commentSection}>
            <Text style={styles.commentSectionTitle}>评论 {comments.length}</Text>
            {comments.length === 0 && (
              <Text style={styles.commentEmpty}>还没有评论，来说点什么吧</Text>
            )}
            {comments.map((c) => {
              const mine = !!myUsername && c.username === myUsername
              return (
                <TouchableOpacity
                  key={c.id}
                  style={styles.commentItem}
                  activeOpacity={mine ? 0.7 : 1}
                  onLongPress={mine ? () => handleDeleteComment(c) : undefined}
                  delayLongPress={500}
                >
                  <Image source={c.avatar} style={styles.commentAvatar} />
                  <View style={{ flex: 1 }}>
                    <View style={styles.commentTop}>
                      <Text style={styles.commentUsername}>{c.nickname}</Text>
                      <Text style={styles.commentTime}>{c.time}</Text>
                    </View>
                    <Text style={styles.commentContent}>{c.content}</Text>
                    {mine && <Text style={styles.commentMineHint}>长按删除</Text>}
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
        )}
      </ScrollView>

      {/* Bottom comment input (not for diary) */}
      {!isDiary && (
        <View style={styles.commentInputBar}>
          <TextInput
            style={styles.commentInput}
            placeholder="说点什么..."
            placeholderTextColor="#C0A090"
            value={commentText}
            onChangeText={setCommentText}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={handleSendComment}>
            <Text style={styles.sendBtnText}>发送</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F0' },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: scale(16), paddingVertical: scale(12),
    borderBottomWidth: 1, borderBottomColor: '#E8D5C4',
    backgroundColor: '#FFFFFF',
  },
  backBtnWrap: { width: 50 },
  backBtn: { fontSize: scale(14), color: '#F4A460', fontWeight: '600' },
  headerTitle: { fontSize: scale(15), fontWeight: '700', color: '#5D4037' },

  body: { flex: 1 },

  // Detail image
  detailImage: {
    width: sw, height: Math.round(sw * 1.1),
    backgroundColor: '#F0E8E0',
  },

  // Detail content
  detailContent: { padding: scale(16) },

  // User bar
  detailUserBar: {
    flexDirection: 'row', alignItems: 'center', gap: scale(10),
    marginBottom: scale(14),
  },
  detailAvatar: { width: scale(40), height: scale(40), borderRadius: scale(20) },
  detailUsername: { fontSize: scale(14), fontWeight: '700', color: '#4E342E' },
  detailTime: { fontSize: scale(11), color: '#A1887F', marginTop: scale(2) },
  followBtn: {
    backgroundColor: '#F4A460', paddingHorizontal: scale(14), paddingVertical: scale(6),
    borderRadius: scale(14),
  },
  followBtnText: { fontSize: scale(11), color: '#FFFFFF', fontWeight: '600' },
  bountyBadge: {
    backgroundColor: '#FFF3E4', paddingHorizontal: scale(12), paddingVertical: scale(6),
    borderRadius: scale(14), borderWidth: 1, borderColor: '#F4A460',
  },
  bountyBadgeText: { color: '#F4A460', fontSize: scale(12), fontWeight: '700' },

  // Title + Text
  detailTitle: { fontSize: scale(18), fontWeight: '700', color: '#4E342E', marginBottom: scale(10), lineHeight: scale(26) },
  detailText: { fontSize: scale(14), color: '#5D4B3A', lineHeight: scale(23), marginBottom: scale(16) },

  // Focus tag
  focusTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF3E4', paddingHorizontal: scale(14), paddingVertical: scale(8),
    borderRadius: scale(10), marginTop: scale(8),
  },
  focusTagText: { fontSize: scale(13), color: '#F4A460', fontWeight: '600' },

  // Interaction bar
  interactionBar: {
    flexDirection: 'row', gap: scale(24),
    paddingVertical: scale(14), borderTopWidth: 1, borderTopColor: '#F0E8E0',
    marginTop: scale(4),
  },
  interactionBtn: { flexDirection: 'row', alignItems: 'center', gap: scale(5) },
  interactionIcon: { fontSize: scale(18) },
  interactionText: { fontSize: scale(12), color: '#8D6E63' },

  // Comments
  commentSection: {
    padding: scale(16),
    borderTopWidth: 1, borderTopColor: '#E8D5C4',
    marginTop: scale(8),
  },
  commentSectionTitle: { fontSize: scale(14), fontWeight: '700', color: '#5D4037', marginBottom: scale(14) },
  commentItem: { flexDirection: 'row', gap: scale(10), marginBottom: scale(16) },
  commentAvatar: { width: scale(32), height: scale(32), borderRadius: scale(16), marginTop: scale(2) },
  commentTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  commentUsername: { fontSize: scale(12), fontWeight: '600', color: '#5D4037' },
  commentTime: { fontSize: scale(10), color: '#A1887F' },
  commentContent: { fontSize: scale(13), color: '#4E342E', lineHeight: scale(19), marginTop: scale(4) },
  commentBottom: { flexDirection: 'row', gap: scale(16), marginTop: scale(6) },
  commentLikeText: { fontSize: scale(10), color: '#A1887F' },
  commentReply: { fontSize: scale(10), color: '#A1887F' },
  commentEmpty: { fontSize: scale(12), color: '#A1887F', marginBottom: scale(10) },
  commentMineHint: { fontSize: scale(9), color: '#C0A090', marginTop: scale(4) },

  // Comment input
  commentInputBar: {
    flexDirection: 'row', alignItems: 'center', gap: scale(10),
    paddingHorizontal: scale(16), paddingVertical: scale(10),
    borderTopWidth: 1, borderTopColor: '#E8D5C4',
    backgroundColor: '#FFFFFF',
  },
  commentInput: {
    flex: 1, height: scale(38), backgroundColor: '#F8F0E8',
    borderRadius: scale(19), paddingHorizontal: scale(14),
    fontSize: scale(13), color: '#4E342E',
  },
  sendBtn: {
    backgroundColor: '#F4A460', paddingHorizontal: scale(16), paddingVertical: scale(8),
    borderRadius: scale(16),
  },
  sendBtnText: { fontSize: scale(12), color: '#FFFFFF', fontWeight: '600' },
})
