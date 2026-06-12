import { useState } from 'react'
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Dimensions, Pressable, FlatList, Image, Modal, TextInput } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { UserAvatar } from '../../src/components/UserAvatar'
import { scale } from '../../src/lib/scale'
import { useAuth } from '../../src/stores/authStore'
import { usePostStore, SquarePost, HelpPost } from '../../src/stores/postStore'
import { useCatStore } from '../../src/stores/catStore'
import { useRouter } from 'expo-router'

const { width: SW } = Dimensions.get('window')

const MENU = [
  { label: '猫咪设置', onPress: () => {} },
  { label: '通知设置', onPress: () => {} },
  { label: '关于我们', onPress: () => {} },
]

const USER_TABS = ['猫岛广场', '猫语求助']

export default function ProfileScreen() {
  const { isLoggedIn, profile, username } = useAuth()
  const { squarePosts, helpPosts, toggleSquareLike, toggleHelpLike } = usePostStore()
  const coins = useCatStore((s) => s.coins)
  const catName = useCatStore((s) => s.catName)
  const catBirthday = useCatStore((s) => s.catBirthday)
  const setCatName = useCatStore((s) => s.setCatName)
  const setCatBirthday = useCatStore((s) => s.setCatBirthday)
  const loadCatProfile = useCatStore((s) => s.loadCatProfile)
  const [showDrawer, setShowDrawer] = useState(false)
  const [showCatSettings, setShowCatSettings] = useState(false)
  const [tempName, setTempName] = useState('')
  const [tempBirthday, setTempBirthday] = useState('')
  const [userTab, setUserTab] = useState(0)
  const router = useRouter()

  const stats = [
    { label: '总专注', value: '12H 30M', route: '/stats' as string | undefined },
    { label: '金币', value: coins.toLocaleString() },
    { label: '打卡', value: '7 DAYS' },
    { label: '完成', value: '28' },
  ]

  const displayName = profile.nickname || username || '猫友'

  const openCatSettings = () => {
    loadCatProfile()
    setTempName(catName)
    setTempBirthday(catBirthday)
    setShowCatSettings(true)
  }

  const saveCatSettings = () => {
    setCatName(tempName.trim() || '阿比')
    setCatBirthday(tempBirthday)
    setShowCatSettings(false)
  }

  // Filter posts by current user
  const mySquarePosts = squarePosts.filter((p) => p.user.name === displayName)
  const myHelpPosts = helpPosts.filter((p) => p.user.name === displayName)

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.moreBtn} onPress={() => setShowDrawer(true)}>
          <Text style={styles.moreBtnText}>···</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        {isLoggedIn && (
          <TouchableOpacity style={styles.editBtn} onPress={() => router.push('/edit-profile')}>
            <Text style={styles.editBtnText}>编辑主页</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarBox}>
            <UserAvatar size={72} />
          </View>
          <Text style={styles.username}>{isLoggedIn ? (profile.nickname || username) : '猫友'}</Text>
          <Text style={styles.bio}>{isLoggedIn ? (profile.bio || '专注使我快乐~') : '未登录'}</Text>
          {profile.catAccount ? (
            <Text style={styles.catAccount}>猫岛号：{profile.catAccount}</Text>
          ) : null}
          {!isLoggedIn && (
            <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/auth')}>
              <Text style={styles.loginText}>登录</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats */}
        <Text style={styles.sectionTitle}>统计</Text>
        <View style={styles.statsGrid}>
          {stats.map((s, i) => (
            <TouchableOpacity
              key={i}
              style={styles.statCard}
              disabled={!s.route}
              onPress={() => s.route && router.push(s.route as any)}
              activeOpacity={s.route ? 0.7 : 1}
            >
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* User posts nav bar */}
        <Text style={styles.sectionTitle}>我的帖子</Text>
        <View style={styles.tabBar}>
          {USER_TABS.map((t, i) => (
            <TouchableOpacity key={t} style={styles.tab} onPress={() => setUserTab(i)}>
              <Text style={[styles.tabText, userTab === i && styles.tabTextActive]}>{t}</Text>
              {userTab === i && <View style={styles.tabLine} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* User posts list */}
        {userTab === 0 ? (
          <UserSquareList
            posts={mySquarePosts}
            toggleLike={toggleSquareLike}
            onDetail={(p) => router.push({ pathname: '/post-detail', params: { post: JSON.stringify(p), type: 'square' } })}
          />
        ) : (
          <UserHelpList
            posts={myHelpPosts}
            toggleLike={toggleHelpLike}
            onDetail={(p) => router.push({ pathname: '/post-detail', params: { post: JSON.stringify(p), type: 'help' } })}
          />
        )}
      </ScrollView>

      {/* Cat Settings Modal */}
      <Modal visible={showCatSettings} animationType="fade" transparent>
        <View style={styles.settingsOverlay}>
          <View style={styles.settingsCard}>
            <Text style={styles.settingsTitle}>猫咪设置</Text>

            <Text style={styles.settingsLabel}>猫咪名字</Text>
            <TextInput
              style={styles.settingsInput}
              value={tempName}
              onChangeText={setTempName}
              placeholder="输入猫咪名字"
              placeholderTextColor="#C0A090"
            />

            <Text style={styles.settingsLabel}>生日</Text>
            <TextInput
              style={styles.settingsInput}
              value={tempBirthday}
              onChangeText={setTempBirthday}
              placeholder="如 2025-01-15"
              placeholderTextColor="#C0A090"
            />

            <View style={styles.settingsBtns}>
              <TouchableOpacity
                style={styles.settingsBtnCancel}
                onPress={() => setShowCatSettings(false)}
              >
                <Text style={styles.settingsBtnCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.settingsBtnSave} onPress={saveCatSettings}>
                <Text style={styles.settingsBtnSaveText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Side Drawer */}
      {showDrawer && (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <Pressable
            style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.35)' }]}
            onPress={() => setShowDrawer(false)}
          />
          <View style={[styles.drawer, { position: 'absolute', left: 0, top: 0, bottom: 0 }]}>
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
              <View style={styles.drawerContent}>
                <Text style={styles.drawerTitle}>设置</Text>
                {MENU.map((item) => (
                  <TouchableOpacity
                    key={item.label}
                    style={styles.drawerItem}
                    onPress={() => {
                      setShowDrawer(false)
                      if (item.label === '猫咪设置') {
                        setTimeout(() => openCatSettings(), 300)
                      } else {
                        item.onPress()
                      }
                    }}
                  >
                    <Text style={styles.drawerItemText}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </SafeAreaView>
          </View>
        </View>
      )}
    </SafeAreaView>
  )
}

// ==================== User Square Posts List ====================

function UserSquareList({ posts, toggleLike, onDetail }: { posts: SquarePost[]; toggleLike: (id: string) => void; onDetail: (p: SquarePost) => void }) {
  if (posts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>还没有发布广场帖</Text>
        <Text style={styles.emptyHint}>去猫岛广场发布你的第一条帖子吧</Text>
      </View>
    )
  }

  return (
    <View style={styles.postList}>
      {posts.map((item) => (
        <TouchableOpacity key={item.id} style={styles.squareItem} activeOpacity={0.9} onPress={() => onDetail(item)}>
          <Image source={item.image} style={styles.squareItemImage} resizeMode="cover" />
          <View style={styles.squareItemBody}>
            <Text style={styles.squareItemTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.squareItemContent} numberOfLines={2}>{item.content}</Text>
            <View style={styles.squareItemFooter}>
              <Text style={styles.squareItemTime}>{item.time}</Text>
              <TouchableOpacity onPress={() => toggleLike(item.id)} style={styles.likeBtn}>
                <Text style={styles.likeIcon}>{item.liked ? '❤️' : '🤍'}</Text>
                <Text style={styles.likeNum}>{item.likes}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  )
}

// ==================== User Help Posts List ====================

function UserHelpList({ posts, toggleLike, onDetail }: { posts: HelpPost[]; toggleLike: (id: string) => void; onDetail: (p: HelpPost) => void }) {
  if (posts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>还没有发布求助帖</Text>
        <Text style={styles.emptyHint}>去猫语求助发布你的第一条求助吧</Text>
      </View>
    )
  }

  return (
    <View style={styles.postList}>
      {posts.map((item) => (
        <TouchableOpacity key={item.id} style={styles.helpItem} activeOpacity={0.9} onPress={() => onDetail(item)}>
          <View style={styles.helpItemTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.helpItemContent} numberOfLines={3}>{item.content}</Text>
            </View>
            {item.image && (
              <Image source={item.image} style={styles.helpItemImage} resizeMode="cover" />
            )}
          </View>
          <View style={styles.helpItemFooter}>
            <Text style={styles.helpItemTime}>{item.time}</Text>
            <View style={styles.helpItemActions}>
              <Text style={styles.helpItemReplies}>💬 {item.replies}</Text>
              <TouchableOpacity onPress={() => toggleLike(item.id)} style={styles.likeBtn}>
                <Text style={styles.likeIcon}>{item.liked ? '❤️' : '🤍'}</Text>
                <Text style={styles.likeNum}>{item.likes}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  )
}

// ==================== Styles ====================

const DRAWER_W = Math.round(SW * 0.28)

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F0' },
  scrollContent: { paddingHorizontal: scale(20), paddingBottom: scale(40) },

  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: scale(16), paddingTop: scale(4), paddingBottom: scale(4),
  },
  moreBtn: { padding: scale(4) },
  moreBtnText: { fontSize: scale(22), color: '#5D4037', fontWeight: '700', letterSpacing: 2 },
  editBtn: {
    paddingHorizontal: scale(14), paddingVertical: scale(7),
    borderWidth: 1, borderColor: '#E0D0C0', borderRadius: scale(16),
    backgroundColor: '#FFFFFF',
  },
  editBtnText: { fontSize: scale(12), fontWeight: '600', color: '#5D4037' },

  profileHeader: { alignItems: 'center', paddingTop: scale(12), paddingBottom: scale(8) },
  avatarBox: {
    padding: scale(6), borderWidth: 2, borderColor: '#E0D0C0', backgroundColor: '#FFFFFF',
    borderRadius: scale(72),
  },
  username: { fontSize: scale(18), fontWeight: '700', color: '#5D4037', marginTop: scale(12) },
  bio: { fontSize: scale(13), color: '#8D6E63', marginTop: scale(4) },
  catAccount: { fontSize: scale(11), color: '#A1887F', marginTop: scale(4) },
  loginButton: {
    marginTop: scale(14), backgroundColor: '#F4A460', paddingHorizontal: scale(28), paddingVertical: scale(8),
    borderRadius: scale(18),
  },
  loginText: { color: '#FFFFFF', fontWeight: '600', fontSize: scale(13) },

  sectionTitle: { fontSize: scale(15), fontWeight: '700', color: '#5D4037', marginTop: scale(18), marginBottom: scale(10) },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: scale(10) },
  statCard: {
    width: '47%', backgroundColor: '#FFFFFF', padding: scale(14),
    borderWidth: 1, borderColor: '#E0D0C0', borderRadius: scale(12),
  },
  statValue: { fontSize: scale(18), fontWeight: '700', color: '#F4A460' },
  statLabel: { fontSize: scale(11), color: '#8D6E63', marginTop: scale(4) },

  // Tab bar (same style as world page)
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E8D5C4', marginBottom: scale(12) },
  tab: { flex: 1, alignItems: 'center', paddingVertical: scale(12) },
  tabText: { fontSize: scale(13), color: '#A1887F', fontWeight: '500' },
  tabTextActive: { color: '#F4A460', fontWeight: '700' },
  tabLine: { width: scale(20), height: 3, backgroundColor: '#F4A460', borderRadius: 2, marginTop: scale(6) },

  // Post list
  postList: { gap: scale(10) },

  // Empty state
  emptyContainer: { alignItems: 'center', paddingVertical: scale(40) },
  emptyText: { fontSize: scale(14), color: '#8D6E63', fontWeight: '600' },
  emptyHint: { fontSize: scale(12), color: '#C0A090', marginTop: scale(6) },

  // Square post item
  squareItem: {
    flexDirection: 'row', backgroundColor: '#FFFFFF',
    borderRadius: scale(12), borderWidth: 1, borderColor: '#E8D5C4',
    padding: scale(10), gap: scale(10),
  },
  squareItemImage: { width: scale(80), height: scale(80), borderRadius: scale(8) },
  squareItemBody: { flex: 1, justifyContent: 'space-between' },
  squareItemTitle: { fontSize: scale(13), fontWeight: '700', color: '#4E342E' },
  squareItemContent: { fontSize: scale(11), color: '#8D6E63', lineHeight: scale(16), marginTop: scale(2) },
  squareItemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: scale(4) },
  squareItemTime: { fontSize: scale(10), color: '#C0A090' },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: scale(3) },
  likeIcon: { fontSize: scale(13) },
  likeNum: { fontSize: scale(10), color: '#8D6E63' },

  // Help post item
  helpItem: {
    backgroundColor: '#FFFFFF', borderRadius: scale(12),
    borderWidth: 1, borderColor: '#E8D5C4', padding: scale(12),
  },
  helpItemTop: { flexDirection: 'row', gap: scale(10) },
  helpItemContent: { fontSize: scale(13), color: '#4E342E', lineHeight: scale(20) },
  helpItemImage: { width: scale(60), height: scale(60), borderRadius: scale(8) },
  helpItemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: scale(8), paddingTop: scale(6), borderTopWidth: 1, borderTopColor: '#F5F0EB' },
  helpItemTime: { fontSize: scale(10), color: '#C0A090' },
  helpItemActions: { flexDirection: 'row', alignItems: 'center', gap: scale(14) },
  helpItemReplies: { fontSize: scale(11), color: '#8D6E63' },

  // Drawer
  drawerOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.35)',
    flexDirection: 'row',
  },
  drawer: {
    width: DRAWER_W, backgroundColor: '#FFF8F0',
    borderRightWidth: 1, borderRightColor: '#E8D5C4',
  },
  drawerContent: { paddingHorizontal: scale(14), paddingTop: scale(20) },
  drawerTitle: { fontSize: scale(16), fontWeight: '700', color: '#5D4037', marginBottom: scale(20) },
  drawerItem: { paddingVertical: scale(14), borderBottomWidth: 1, borderBottomColor: '#F0E8E0' },
  drawerItemText: { fontSize: scale(13), color: '#4E342E' },

  // ====== 猫咪设置弹窗 ======
  settingsOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: scale(28) },
  settingsCard: {
    backgroundColor: '#FFFFFF', borderRadius: scale(14), borderWidth: 2, borderColor: '#E0D0C0',
    padding: scale(24), width: '100%', gap: scale(12),
  },
  settingsTitle: { fontSize: scale(16), fontWeight: '700', color: '#5D4037', textAlign: 'center', marginBottom: scale(4) },
  settingsLabel: { fontSize: scale(13), color: '#8D6E63', fontWeight: '600' },
  settingsInput: {
    borderWidth: 2, borderColor: '#E0D0C0', borderRadius: scale(8),
    paddingHorizontal: scale(14), paddingVertical: scale(10),
    fontSize: scale(14), color: '#4E342E', backgroundColor: '#FFF8F0',
  },
  settingsBtns: { flexDirection: 'row', gap: scale(12), marginTop: scale(8) },
  settingsBtnCancel: {
    flex: 1, alignItems: 'center', paddingVertical: scale(10),
    borderWidth: 2, borderColor: '#D7CCC8', borderRadius: scale(8),
  },
  settingsBtnCancelText: { color: '#8D6E63', fontSize: scale(13), fontWeight: '600' },
  settingsBtnSave: {
    flex: 1, alignItems: 'center', paddingVertical: scale(10),
    backgroundColor: '#F4A460', borderWidth: 2, borderColor: '#C07840', borderRadius: scale(8),
  },
  settingsBtnSaveText: { color: '#FFFFFF', fontSize: scale(13), fontWeight: '700' },
})
