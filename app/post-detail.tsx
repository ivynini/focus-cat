import { StyleSheet, Text, View, Image, ScrollView, TouchableOpacity, TextInput } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { UserAvatar } from '../src/components/UserAvatar'
import { usePostStore } from '../src/stores/postStore'
import { scale, sw } from '../src/lib/scale'

const MOCK_AVATAR = require('../catactivity/未命名/F0.png')

// ==================== Mock Comments ====================

const MOCK_COMMENTS = [
  { id: 'c1', user: '橘子味的猫', avatar: MOCK_AVATAR, content: '太可爱了吧！', time: '10分钟前', likes: 12 },
  { id: 'c2', user: '养猫达人', avatar: MOCK_AVATAR, content: '学到了，谢谢分享～', time: '25分钟前', likes: 5 },
  { id: 'c3', user: '喵星人驻地球大使', avatar: MOCK_AVATAR, content: '深有同感，我家那只也是这样的！', time: '1小时前', likes: 28 },
]

export default function PostDetailScreen() {
  const { post: postJson, type } = useLocalSearchParams<{ post: string; type: string }>()
  const router = useRouter()
  const [liked, setLiked] = useState(false)
  const [likes, setLikes] = useState(0)
  const [favorited, setFavorited] = useState(false)
  const [commentText, setCommentText] = useState('')
  const { favorites, toggleFavorite, toggleSquareLike, toggleHelpLike } = usePostStore()

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

  const isSquare = type === 'square'
  const isHelp = type === 'help'
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
                  <Text style={styles.interactionText}>{MOCK_COMMENTS.length}</Text>
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
                <Text style={styles.interactionText}>{post.replies + MOCK_COMMENTS.length}</Text>
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
            <Text style={styles.commentSectionTitle}>评论 {MOCK_COMMENTS.length}</Text>
            {MOCK_COMMENTS.map((c) => (
              <View key={c.id} style={styles.commentItem}>
                <Image source={c.avatar} style={styles.commentAvatar} />
                <View style={{ flex: 1 }}>
                  <View style={styles.commentTop}>
                    <Text style={styles.commentUsername}>{c.user}</Text>
                    <Text style={styles.commentTime}>{c.time}</Text>
                  </View>
                  <Text style={styles.commentContent}>{c.content}</Text>
                  <View style={styles.commentBottom}>
                    <Text style={styles.commentLikeText}>❤ {c.likes}</Text>
                    <Text style={styles.commentReply}>回复</Text>
                  </View>
                </View>
              </View>
            ))}
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
          <TouchableOpacity style={styles.sendBtn} onPress={() => setCommentText('')}>
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
