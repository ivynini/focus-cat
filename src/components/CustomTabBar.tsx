import { View, TouchableOpacity, Text, StyleSheet, Dimensions, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MaterialIcons } from '@expo/vector-icons'
import { usePathname, useRouter } from 'expo-router'

const { width: SW } = Dimensions.get('window')

type TabIconName = 'home' | 'pets' | 'timer' | 'public' | 'person'

interface TabItem {
  route: string
  label: string | null
  icon: TabIconName
  isCenter: boolean
}

const TABS: TabItem[] = [
  { route: '/', label: '首页', icon: 'home', isCenter: false },
  { route: '/cat', label: '猫咪', icon: 'pets', isCenter: false },
  { route: '/focus', label: null, icon: 'timer', isCenter: true },
  { route: '/world', label: '世界', icon: 'public', isCenter: false },
  { route: '/profile', label: '我的', icon: 'person', isCenter: false },
]

const BAR_HEIGHT = 60
const NOTCH_SIZE = 78
const BTN_SIZE = 62

function getActiveRoute(pathname: string): string {
  if (pathname === '/') return '/'
  const seg = pathname.split('/')[1]
  if (seg && ['cat', 'focus', 'world', 'profile'].includes(seg)) {
    return '/' + seg
  }
  return ''
}

export default function CustomTabBar() {
  const pathname = usePathname()
  const router = useRouter()
  const activeRoute = getActiveRoute(pathname)

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <View style={styles.container}>
        {/* 主导航条背景 */}
        <View style={styles.barBg} />

        {/* 凹陷圆形切口 + 按钮 */}
        <View style={styles.notchWrapper}>
          <View style={styles.notchOuter}>
            <TouchableOpacity
              style={styles.notchBtn}
              activeOpacity={0.85}
              onPress={() => router.push('/focus')}
            >
              <MaterialIcons
                name="timer"
                size={34}
                color="#F4A460"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab 按钮行 */}
        <View style={styles.tabsRow}>
          {TABS.map((tab) => {
            if (tab.isCenter) {
              return <View key={tab.route} style={styles.spacer} />
            }
            const active = tab.route === activeRoute
            return (
              <TouchableOpacity
                key={tab.route}
                style={styles.tab}
                activeOpacity={0.7}
                onPress={() => router.push(tab.route)}
              >
                <MaterialIcons
                  name={tab.icon}
                  size={active ? 26 : 22}
                  color={active ? '#F4A460' : '#999'}
                />
                {tab.label && (
                  <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                    {tab.label}
                  </Text>
                )}
              </TouchableOpacity>
            )
          })}
        </View>
      </View>
    </SafeAreaView>
  )
}

const notchTop = -(NOTCH_SIZE / 2) + 12

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#FFF8F0',
  },
  container: {
    height: BAR_HEIGHT,
    position: 'relative',
  },

  barBg: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: BAR_HEIGHT,
    backgroundColor: '#FFF8F0',
    borderTopWidth: 2,
    borderTopColor: '#F0E0D0',
  },

  // 凹陷圆形区域
  notchWrapper: {
    position: 'absolute',
    top: notchTop,
    alignSelf: 'center',
    width: NOTCH_SIZE,
    height: NOTCH_SIZE,
    borderRadius: NOTCH_SIZE / 2,
    backgroundColor: '#FFF8F0',
    borderWidth: 2,
    borderColor: '#F0E0D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notchOuter: {
    width: BTN_SIZE,
    height: BTN_SIZE,
    borderRadius: BTN_SIZE / 2,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E8D5C4',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.12,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  notchBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Tab 按钮行
  tabsRow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  spacer: {
    width: NOTCH_SIZE,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '400',
    color: '#999',
  },
  tabLabelActive: {
    fontWeight: '600',
    color: '#F4A460',
  },
})
