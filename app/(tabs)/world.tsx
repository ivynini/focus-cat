import { StyleSheet, Text, View, FlatList, TouchableOpacity, Image, Modal, TextInput, ScrollView as RNScrollView, Alert, Animated } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'expo-router'
import { UserAvatar } from '../../src/components/UserAvatar'
import { useAuth } from '../../src/stores/authStore'
import { usePostStore, SquarePost, HelpPost } from '../../src/stores/postStore'
import { api } from '../../src/lib/api'
import { scale, sw } from '../../src/lib/scale'

// ==================== Mock Data ====================

interface DiaryPost {
  id: string
  date: string
  title: string
  content: string
  focus: string
  weather: string
}

const DIARY_POSTS: DiaryPost[] = [
  {
    id: 'dp1',
    date: '05-15',
    title: '今日金句：慢慢来，也会很快',
    content: '今天专注 2 小时，心情不错。下雨了，窗外很安静。猫咪陪我一起度过了整个下午的工作时光。',
    focus: '2h 15m', weather: '小雨 22℃',
  },
  {
    id: 'dp2',
    date: '05-14',
    title: '今日金句：每次专注，都是对自己的投资',
    content: '完成了四个番茄钟任务，猫咪的房间也升级了。给自己泡了杯花茶，庆祝一下今天的高效。',
    focus: '1h 40m', weather: '晴 28℃',
  },
  {
    id: 'dp3',
    date: '05-12',
    title: '今日金句：温柔地对待每一天',
    content: '今天状态一般，只专注了 40 分钟。不过没关系，不必每天都打满鸡血，适当休息也很重要。',
    focus: '40m', weather: '多云 25℃',
  },
]

const TABS = ['猫岛广场', '猫语求助', '我的日记']

// ==================== Main Component ====================

export default function WorldScreen() {
  const [tab, setTab] = useState(0)
  const [diaryPosts, setDiaryPosts] = useState(DIARY_POSTS)
  const [showCreate, setShowCreate] = useState(false)
  const [drawerType, setDrawerType] = useState<'likes' | 'favorites' | null>(null)
  const [searchText, setSearchText] = useState('')
  const [notifications, setNotifications] = useState<any[]>([])
  const router = useRouter()
  const drawerAnim = useRef(new Animated.Value(1200)).current

  const { squarePosts, helpPosts, favorites, addSquarePost, addHelpPost, toggleSquareLike, toggleHelpLike, toggleFavorite } = usePostStore()
  const { isLoggedIn, profile, username } = useAuth()

  // Background fetch on mount / login change
  useEffect(() => {
    if (isLoggedIn) {
      api.getLikeNotifications().then(setNotifications).catch(() => {})
    }
  }, [isLoggedIn])

  const openDrawer = useCallback((type: 'likes' | 'favorites') => {
    setDrawerType(type)
    if (type === 'likes') {
      api.getLikeNotifications().then(setNotifications).catch(() => {})
    }
    Animated.timing(drawerAnim, { toValue: 0, duration: 280, useNativeDriver: false }).start()
  }, [drawerAnim])

  const closeDrawer = useCallback(() => {
    Animated.timing(drawerAnim, { toValue: 1200, duration: 250, useNativeDriver: false }).start(() => setDrawerType(null))
  }, [drawerAnim])

  const goToDetail = (post: any, type: string) => {
    drawerAnim.setValue(0)
    setDrawerType(null)
    router.push({ pathname: '/post-detail', params: { post: JSON.stringify(post), type } })
  }

  const handlePublish = async (text: string, bounty: number = 0) => {
    try {
      if (tab === 0) {
        const lines = text.trim().split('\n').filter(Boolean)
        const title = lines[0] || '无标题'
        const content = lines.slice(1).join('\n') || text
        await addSquarePost({ title: title.length > 20 ? title.slice(0, 20) + '...' : title, content })
      } else if (tab === 1) {
        await addHelpPost({ content: text.trim(), bounty })
      } else if (tab === 2) {
        // 日记
        const now = new Date()
        const lines = text.trim().split('\n').filter(Boolean)
        const title = lines[0] || '今日日记'
        const content = lines.slice(1).join('\n') || text
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        const newPost: DiaryPost = {
          id: `dp_${Date.now()}`,
          date: `${month}-${day}`,
          title,
          content,
          focus: '0m', weather: '--',
        }
        setDiaryPosts((prev) => [newPost, ...prev])
      }
    } catch (e: any) {
      Alert.alert('发布失败', e.message || '请检查网络连接后重试')
    }
  }

  const getFavoritedPosts = () => {
    const sq = squarePosts.filter((p) => favorites.includes(p.id)).map((p) => ({ ...p, __type: 'square' as const }))
    const hp = helpPosts.filter((p) => favorites.includes(p.id)).map((p) => ({ ...p, __type: 'help' as const }))
    return [...sq, ...hp]
  }

  const findPost = (id: string, type: string) => {
    if (type === 'square') return squarePosts.find((p) => p.id === id)
    if (type === 'help') return helpPosts.find((p) => p.id === id)
    return null
  }

  const formatNotifTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime()
    const min = Math.floor(diff / 60000)
    if (min < 1) return '刚刚'
    if (min < 60) return `${min}分钟前`
    const hr = Math.floor(min / 60)
    if (hr < 24) return `${hr}小时前`
    return `${Math.floor(hr / 24)}天前`
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header — search bar + buttons */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="搜索猫岛..."
            placeholderTextColor="#C0A090"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
        <TouchableOpacity style={styles.headerBtn} onPress={() => openDrawer('likes')}>
          <Text style={styles.headerBtnIcon}>❤️</Text>
          {notifications.length > 0 && (
            <View style={{ position: 'absolute', top: -3, right: -3, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF5350' }} />
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerBtn} onPress={() => openDrawer('favorites')}>
          <Text style={styles.headerBtnIcon}>⭐</Text>
        </TouchableOpacity>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map((t, i) => (
          <TouchableOpacity key={t} style={styles.tab} onPress={() => setTab(i)}>
            <Text style={[styles.tabText, tab === i && styles.tabTextActive]}>{t}</Text>
            {tab === i && <View style={styles.tabLine} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab content */}
      {tab === 0 && (
        <SquareTab posts={squarePosts} toggleLike={toggleSquareLike} toggleFavorite={toggleFavorite} favorites={favorites} onDetail={(p) => goToDetail(p, 'square')} />
      )}
      {tab === 1 && (
        <HelpTab posts={helpPosts} toggleLike={toggleHelpLike} toggleFavorite={toggleFavorite} favorites={favorites} onDetail={(p) => goToDetail(p, 'help')} />
      )}
      {tab === 2 && <DiaryTab posts={diaryPosts} onDetail={(p) => goToDetail(p, 'diary')} />}

      {/* Floating "+" button */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowCreate(true)} activeOpacity={0.85}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Create Post Modal */}
      <CreateModal
        visible={showCreate}
        tab={tab}
        onClose={() => setShowCreate(false)}
        onPublish={async (text, bounty) => {
          try {
            await handlePublish(text, bounty)
            setShowCreate(false)
          } catch { /* Error already shown by Alert in handlePublish */ }
        }}
      />

      {/* Bottom Drawer */}
      {drawerType !== null && (
        <View style={styles.drawerOverlay}>
          <TouchableOpacity style={styles.drawerBackdrop} onPress={closeDrawer} activeOpacity={1} />
          <Animated.View style={[styles.drawer, { transform: [{ translateY: drawerAnim }] }]}>
            {/* Handle */}
            <View style={styles.drawerHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {drawerType === 'likes' ? '收到的赞' : '我的收藏'}
              </Text>
              <TouchableOpacity onPress={closeDrawer}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <RNScrollView style={{ maxHeight: scale(420) }} showsVerticalScrollIndicator={false}>
              {drawerType === 'likes' ? (
                notifications.length === 0 ? (
                  <Text style={styles.emptyText}>还没有收到点赞</Text>
                ) : (
                  notifications.map((n: any) => {
                    const refPost = findPost(String(n.post_id), n.post_type)
                    return (
                      <TouchableOpacity
                        key={n.id}
                        style={styles.notifItem}
                        disabled={!refPost}
                        onPress={() => { if (refPost) goToDetail(refPost, n.post_type) }}
                      >
                        <Text style={styles.notifTitle}>
                          {n.nickname || n.username} 赞了你的{n.post_type === 'help' ? '求助帖' : '广场帖'}
                        </Text>
                        <Text style={styles.notifContent}>{n.title || n.content?.slice(0, 50)}</Text>
                        <Text style={styles.notifTime}>{formatNotifTime(n.liked_at)}</Text>
                      </TouchableOpacity>
                    )
                  })
                )
              ) : (
                getFavoritedPosts().length === 0 ? (
                  <Text style={styles.emptyText}>还没有收藏任何帖子</Text>
                ) : (
                  getFavoritedPosts().map((p: any) => (
                    <TouchableOpacity key={p.id} style={styles.likedItem} onPress={() => goToDetail(p, p.__type)}>
                      <Text style={styles.likedItemTitle}>{p.title || p.content?.slice(0, 30)}</Text>
                      <Text style={styles.likedItemMeta}>{p.__type === 'square' ? '广场帖' : '求助帖'} · {p.likes} ❤️</Text>
                    </TouchableOpacity>
                  ))
                )
              )}
            </RNScrollView>
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  )
}

// ==================== 猫岛广场 Tab (Xiaohongshu Style) ====================

function SquareTab({
  posts, toggleLike, toggleFavorite, favorites, onDetail,
}: {
  posts: SquarePost[]; toggleLike: (id: string) => void; toggleFavorite: (id: string) => void; favorites: string[]; onDetail: (p: SquarePost) => void
}) {
  const cardW = (sw - scale(16) * 2 - scale(10)) / 2 // 2-column grid
  const imgH = Math.round(cardW * 1.15)

  return (
    <FlatList
      data={posts}
      keyExtractor={(p) => p.id}
      numColumns={2}
      contentContainerStyle={styles.tabContent}
      columnWrapperStyle={{ gap: scale(10), marginBottom: scale(12) }}
      renderItem={({ item }) => (
        <TouchableOpacity style={[styles.squareCard, { width: cardW }]} activeOpacity={0.9} onPress={() => onDetail(item)}>
          <Image source={item.image} style={[styles.squareImage, { width: cardW - scale(2) * 2, height: imgH }]} resizeMode="cover" />
          <View style={styles.squareBody}>
            <Text style={styles.squareTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.squareContent} numberOfLines={2}>{item.content}</Text>
            <View style={styles.squareFooter}>
              <View style={styles.squareUser}>
                <Image source={item.user.avatar} style={styles.squareAvatar} />
                <Text style={styles.squareUsername} numberOfLines={1}>{item.user.name}</Text>
              </View>
              <View style={styles.squareActions}>
                <TouchableOpacity style={styles.squareLike} onPress={() => toggleLike(item.id)}>
                  <Text style={[styles.likeHeart, item.liked && { color: '#EF5350' }]}>{item.liked ? '❤️' : '🤍'}</Text>
                  <Text style={styles.likeCount}>{item.likes}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
                  <Text style={styles.favStar}>{favorites.includes(item.id) ? '⭐' : '☆'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      )}
    />
  )
}

// ==================== 猫语求助 Tab (Weibo Style) ====================

function HelpTab({
  posts, toggleLike, toggleFavorite, favorites, onDetail,
}: {
  posts: HelpPost[]; toggleLike: (id: string) => void; toggleFavorite: (id: string) => void; favorites: string[]; onDetail: (p: HelpPost) => void
}) {
  return (
    <FlatList
      data={posts}
      keyExtractor={(p) => p.id}
      contentContainerStyle={styles.tabContent}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.helpCard} activeOpacity={0.9} onPress={() => onDetail(item)}>
          {/* Top: user info + time (left), bounty (right) */}
          <View style={styles.helpTop}>
            <View style={styles.helpUser}>
              <Image source={item.user.avatar} style={styles.helpAvatar} />
              <View>
                <Text style={styles.helpUsername}>{item.user.name}</Text>
                <Text style={styles.helpTime}>{item.time}</Text>
              </View>
            </View>
            <View style={styles.bountyBadge}>
              <Text style={styles.bountyText}>悬赏 {item.bounty}G</Text>
            </View>
          </View>

          {/* Content */}
          <Text style={styles.helpContent} numberOfLines={4}>{item.content}</Text>

          {/* Image */}
          {item.image && (
            <Image source={item.image} style={styles.helpImage} resizeMode="cover" />
          )}

          {/* Footer: reply, like, favorite */}
          <View style={styles.helpFooter}>
            <TouchableOpacity style={styles.helpAction} onPress={() => onDetail(item)}>
              <Text style={styles.helpActionIcon}>💬</Text>
              <Text style={styles.helpActionText}>{item.replies}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.helpAction} onPress={() => toggleLike(item.id)}>
              <Text style={styles.helpActionIcon}>{item.liked ? '❤️' : '🤍'}</Text>
              <Text style={styles.helpActionText}>{item.likes}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.helpAction} onPress={() => toggleFavorite(item.id)}>
              <Text style={styles.helpActionIcon}>{favorites.includes(item.id) ? '⭐' : '☆'}</Text>
              <Text style={styles.helpActionText}>{favorites.includes(item.id) ? '已收藏' : '收藏'}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}
    />
  )
}

// ==================== 我的日记 Tab (Private) ====================

function DiaryTab({
  posts, onDetail,
}: {
  posts: DiaryPost[]; onDetail: (p: DiaryPost) => void
}) {
  return (
    <FlatList
      data={posts}
      keyExtractor={(p) => p.id}
      contentContainerStyle={styles.tabContent}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.diaryCard} activeOpacity={0.9} onPress={() => onDetail(item)}>
          {/* User avatar + date */}
          <View style={styles.diaryTop}>
            <UserAvatar size={scale(36)} />
            <View style={{ flex: 1 }}>
              <Text style={styles.diaryUsername}>我的日记</Text>
              <Text style={styles.diaryDate}>{item.date} · {item.weather}</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.diaryTitle}>{item.title}</Text>

          {/* Content */}
          <Text style={styles.diaryContent} numberOfLines={3}>{item.content}</Text>

          {/* Focus time */}
          <View style={styles.diaryFocusRow}>
            <Text style={styles.diaryFocus}>⏱ 专注 {item.focus}</Text>
          </View>
        </TouchableOpacity>
      )}
    />
  )
}

// ==================== Create Post Modal ====================

function CreateModal({ visible, tab, onClose, onPublish }: {
  visible: boolean; tab: number; onClose: () => void; onPublish: (text: string, bounty: number) => void
}) {
  const [text, setText] = useState('')
  const [bounty, setBounty] = useState('0')

  const placeholder =
    tab === 0 ? '分享你的猫咪日常...' :
    tab === 1 ? '描述你的养猫问题...' :
    '写写今天的日记...'

  const label =
    tab === 0 ? '发广场帖' :
    tab === 1 ? '发布求助' :
    '写日记'

  const handlePublish = () => {
    if (!text.trim()) return
    onPublish(text.trim(), parseInt(bounty, 10) || 0)
    setText('')
    setBounty('0')
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.createModal}>
          <View style={styles.createHeader}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.createCancel}>取消</Text>
            </TouchableOpacity>
            <Text style={styles.createTitle}>{label}</Text>
            <TouchableOpacity onPress={handlePublish}>
              <Text style={styles.createPublish}>发布</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.createBody}>
            <TextInput
              style={styles.createInput}
              placeholder={placeholder}
              placeholderTextColor="#C0A090"
              multiline
              value={text}
              onChangeText={setText}
              textAlignVertical="top"
            />
            {tab === 1 && (
              <View style={styles.bountyRow}>
                <Text style={styles.bountyLabel}>悬赏金额</Text>
                <View style={styles.bountyInputWrap}>
                  <TextInput
                    style={styles.bountyInput}
                    value={bounty}
                    onChangeText={setBounty}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor="#C0A090"
                  />
                  <Text style={styles.bountyUnit}>G</Text>
                </View>
              </View>
            )}
            <TouchableOpacity style={styles.addPhotoBtn}>
              <Text style={styles.addPhotoText}>+ 添加图片</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

// ==================== Styles ====================

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F0' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: scale(12), paddingTop: scale(8), paddingBottom: scale(8),
    gap: scale(8),
  },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F0E8E0', borderRadius: scale(18),
    paddingHorizontal: scale(12), height: scale(36),
  },
  searchIcon: { fontSize: scale(14), marginRight: scale(6) },
  searchInput: { flex: 1, fontSize: scale(13), color: '#4E342E', padding: 0 },
  headerBtn: {
    width: scale(36), height: scale(36), borderRadius: scale(18),
    backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#E8D5C4',
  },
  headerBtnIcon: { fontSize: scale(16) },

  // Tab bar
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E8D5C4' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: scale(12) },
  tabText: { fontSize: scale(13), color: '#A1887F', fontWeight: '500' },
  tabTextActive: { color: '#F4A460', fontWeight: '700' },
  tabLine: { width: scale(20), height: 3, backgroundColor: '#F4A460', borderRadius: 2, marginTop: scale(6) },

  // Tab content
  tabContent: { padding: scale(16), paddingBottom: scale(80) },

  // ====== 猫岛广场 (Square) ======
  squareCard: {
    backgroundColor: '#FFFFFF', borderRadius: scale(12),
    borderWidth: 1, borderColor: '#E8D5C4',
    overflow: 'hidden',
  },
  squareImage: {
    borderTopLeftRadius: scale(12), borderTopRightRadius: scale(12),
  },
  squareBody: { padding: scale(10) },
  squareTitle: { fontSize: scale(13), fontWeight: '700', color: '#4E342E', marginBottom: scale(4) },
  squareContent: { fontSize: scale(11), color: '#8D6E63', lineHeight: scale(16), marginBottom: scale(8) },
  squareFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  squareUser: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: scale(6) },
  squareAvatar: { width: scale(20), height: scale(20), borderRadius: scale(10) },
  squareUsername: { fontSize: scale(10), color: '#A1887F', flex: 1 },
  squareLike: { flexDirection: 'row', alignItems: 'center', gap: scale(2) },
  squareActions: { flexDirection: 'row', alignItems: 'center', gap: scale(8) },
  likeHeart: { fontSize: scale(13) },
  likeCount: { fontSize: scale(10), color: '#8D6E63' },
  favStar: { fontSize: scale(13) },

  // ====== 猫语求助 (Help) ======
  helpCard: {
    backgroundColor: '#FFFFFF', borderRadius: scale(14), padding: scale(14), marginBottom: scale(12),
    borderWidth: 1, borderColor: '#E8D5C4',
  },
  helpTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: scale(10) },
  helpUser: { flexDirection: 'row', alignItems: 'center', gap: scale(8) },
  helpAvatar: { width: scale(36), height: scale(36), borderRadius: scale(18) },
  helpUsername: { fontSize: scale(13), fontWeight: '600', color: '#4E342E' },
  helpTime: { fontSize: scale(10), color: '#A1887F', marginTop: scale(2) },
  bountyBadge: {
    backgroundColor: '#FFF3E4', paddingHorizontal: scale(10), paddingVertical: scale(5),
    borderRadius: scale(12), borderWidth: 1, borderColor: '#F4A460',
  },
  bountyText: { color: '#F4A460', fontSize: scale(11), fontWeight: '700' },
  helpContent: {
    fontSize: scale(13), color: '#4E342E', lineHeight: scale(20),
    marginBottom: scale(10),
  },
  helpImage: {
    width: '100%', height: scale(180), borderRadius: scale(10),
    marginBottom: scale(10),
  },
  helpFooter: {
    flexDirection: 'row', gap: scale(20),
    paddingTop: scale(8), borderTopWidth: 1, borderTopColor: '#F5F0EB',
  },
  helpAction: { flexDirection: 'row', alignItems: 'center', gap: scale(4) },
  helpActionIcon: { fontSize: scale(14) },
  helpActionText: { fontSize: scale(11), color: '#8D6E63' },

  // ====== 我的日记 (Diary) ======
  diaryCard: {
    backgroundColor: '#FFFFFF', borderRadius: scale(14), padding: scale(14), marginBottom: scale(12),
    borderWidth: 1, borderColor: '#E8D5C4',
  },
  diaryTop: { flexDirection: 'row', alignItems: 'center', gap: scale(10), marginBottom: scale(10) },
  diaryAvatar: { width: scale(36), height: scale(36), borderRadius: scale(18) },
  diaryUsername: { fontSize: scale(13), fontWeight: '600', color: '#4E342E' },
  diaryDate: { fontSize: scale(10), color: '#A1887F', marginTop: scale(2) },
  diaryTitle: { fontSize: scale(14), fontWeight: '700', color: '#5D4037', marginBottom: scale(6) },
  diaryContent: { fontSize: scale(12), color: '#6D5D4B', lineHeight: scale(19), marginBottom: scale(8) },
  diaryFocusRow: { flexDirection: 'row' },
  diaryFocus: {
    fontSize: scale(11), color: '#F4A460', fontWeight: '600',
    backgroundColor: '#FFF8F0', paddingHorizontal: scale(10), paddingVertical: scale(4),
    borderRadius: scale(8),
  },

  // ====== Floating Action Button ======
  fab: {
    position: 'absolute',
    right: scale(20),
    bottom: scale(24),
    width: scale(56),
    height: scale(56),
    borderRadius: scale(28),
    backgroundColor: '#F4A460',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    // shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8,
  },
  fabText: { fontSize: scale(28), color: '#FFFFFF', fontWeight: '300', marginTop: -2 },

  // ====== Create Modal ======
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  createModal: {
    backgroundColor: '#FFFFFF', borderTopLeftRadius: scale(20), borderTopRightRadius: scale(20),
    height: '75%',
  },
  createHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: scale(16), paddingVertical: scale(14),
    borderBottomWidth: 1, borderBottomColor: '#F0E8E0',
  },
  createCancel: { fontSize: scale(14), color: '#8D6E63' },
  createTitle: { fontSize: scale(15), fontWeight: '700', color: '#5D4037' },
  createPublish: { fontSize: scale(14), fontWeight: '700', color: '#F4A460' },
  createBody: { flex: 1, padding: scale(16) },
  createInput: {
    flex: 1, fontSize: scale(14), color: '#4E342E',
    lineHeight: scale(22),
  },
  addPhotoBtn: {
    paddingVertical: scale(12), alignItems: 'center',
    borderTopWidth: 1, borderTopColor: '#F0E8E0', marginTop: scale(12),
  },
  addPhotoText: { fontSize: scale(13), color: '#F4A460', fontWeight: '600' },
  bountyRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: scale(12), marginTop: scale(12),
    borderTopWidth: 1, borderTopColor: '#F0E8E0',
  },
  bountyLabel: { fontSize: scale(14), color: '#4E342E' },
  bountyInputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF8F0', borderRadius: scale(8),
    borderWidth: 1, borderColor: '#E0D0C0',
    paddingHorizontal: scale(10),
  },
  bountyInput: {
    width: scale(60), height: scale(34), fontSize: scale(14), color: '#4E342E',
    textAlign: 'right', padding: 0,
  },
  bountyUnit: { fontSize: scale(13), color: '#F4A460', fontWeight: '700', marginLeft: scale(4) },

  // ====== Bottom Drawer ======
  drawerOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 100,
  },
  drawerBackdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  drawer: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: '#FFF8F0',
    borderTopLeftRadius: scale(22), borderTopRightRadius: scale(22),
    paddingHorizontal: scale(20), paddingBottom: scale(30),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  drawerHandle: {
    width: scale(36), height: scale(4),
    backgroundColor: '#D0C0B0',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: scale(10),
    marginBottom: scale(12),
  },

  // ====== Liked & Notif Items ======
  modalContent: {
    backgroundColor: '#FFF8F0', borderTopLeftRadius: scale(20), borderTopRightRadius: scale(20),
    padding: scale(20), maxHeight: '60%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: scale(14) },
  modalTitle: { fontSize: scale(16), fontWeight: '700', color: '#5D4037' },
  modalClose: { fontSize: scale(20), color: '#8D6E63', padding: scale(4) },
  emptyText: { fontSize: scale(13), color: '#A1887F', textAlign: 'center', paddingVertical: scale(20) },
  likedItem: {
    backgroundColor: '#FFFFFF', borderRadius: scale(10), padding: scale(12), marginBottom: scale(8),
    borderWidth: 1, borderColor: '#E8D5C4',
  },
  likedItemTitle: { fontSize: scale(13), color: '#4E342E', fontWeight: '600' },
  likedItemMeta: { fontSize: scale(11), color: '#A1887F', marginTop: scale(4) },
  notifItem: {
    backgroundColor: '#FFFFFF', borderRadius: scale(10), padding: scale(12), marginBottom: scale(8),
    borderWidth: 1, borderColor: '#E8D5C4',
  },
  notifTitle: { fontSize: scale(13), color: '#4E342E', fontWeight: '600' },
  notifContent: { fontSize: scale(12), color: '#8D6E63', marginTop: scale(4) },
  notifTime: { fontSize: scale(10), color: '#C0A090', marginTop: scale(6), textAlign: 'right' },
})
