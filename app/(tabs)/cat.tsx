import { StyleSheet, Text, View, TouchableOpacity, Image, ImageBackground } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useState, useEffect, useRef, useCallback } from 'react'
import { AnimatedSprite } from '../../src/components/AnimatedSprite'
import { scale, sw } from '../../src/lib/scale'

import { UserAvatar } from '../../src/components/UserAvatar'
import { useCatStore } from '../../src/stores/catStore'

const BG_IMAGE = require('../../bg/bg3.png')
const BOW_IMAGE = require('../../catactivity/accessory/bow.png')
const SUNGLASSES_IMAGE = require('../../catactivity/accessory/sunglasses.png')
const HAT_IMAGE = require('../../catactivity/accessory/hat.png')
const NECKLACE_IMAGE = require('../../catactivity/accessory/necklace.png')
const ICON_FOOD = require('../../assets/focus/1.png')
const ICON_ACCESSORY = require('../../assets/focus/2.png')
const ICON_FEED = require('../../assets/focus/3.png')
const ICON_WARDROBE = require('../../assets/focus/4.png')

// ============== 商品数据 ==============
interface ShopItem {
  id: string
  name: string
  price: number
  hunger?: number     // 食品增加的饱腹值
  image?: any          // 饰品图片
}

const FOOD_ITEMS: ShopItem[] = [
  { id: 'f1', name: '小鱼干', price: 10, hunger: 20 },
  { id: 'f2', name: '猫罐头', price: 30, hunger: 40 },
  { id: 'f3', name: '三文鱼', price: 50, hunger: 60 },
]

const ACCESSORY_IMAGES: Record<string, any> = {
  a1: BOW_IMAGE,
  a2: SUNGLASSES_IMAGE,
  a3: HAT_IMAGE,
  a4: NECKLACE_IMAGE,
}

const ACCESSORY_ITEMS: ShopItem[] = [
  { id: 'a1', name: '蝴蝶结', price: 100, image: BOW_IMAGE },
  { id: 'a2', name: '墨镜', price: 100, image: SUNGLASSES_IMAGE },
  { id: 'a3', name: '帽子', price: 100, image: HAT_IMAGE },
  { id: 'a4', name: '项链', price: 100, image: NECKLACE_IMAGE },
]

// ============== 常量 ==============
const DECAY_INTERVAL = 2000          // 每2秒衰减一次
const PET_HAPPINESS_GAIN = 8         // 摸猫增加的开心值
const LOW_THRESHOLD = 30             // 低于此值变红

type PanelType = 'foodShop' | 'accShop' | 'feed' | 'wardrobe' | null

export default function CatScreen() {
  const [activePanel, setActivePanel] = useState<PanelType>(null)
  const [petCount, setPetCount] = useState(0)

  const coins = useCatStore((s) => s.coins)
  const hunger = useCatStore((s) => s.hunger)
  const happiness = useCatStore((s) => s.happiness)
  const boughtFood = useCatStore((s) => s.boughtFood)
  const unlockedAccessories = useCatStore((s) => s.unlockedAccessories)
  const equippedAcc = useCatStore((s) => s.equippedAcc)
  const catName = useCatStore((s) => s.catName)
  const catBirthday = useCatStore((s) => s.catBirthday)
  const setEquippedAcc = useCatStore((s) => s.setEquippedAcc)
  const buyItem = useCatStore((s) => s.buyItem)
  const feedCatAction = useCatStore((s) => s.feedCat)
  const petCatAction = useCatStore((s) => s.petCat)
  const tickDecay = useCatStore((s) => s.tickDecay)
  const loadCatProfile = useCatStore((s) => s.loadCatProfile)

  // ============== 时间衰减 ==============
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    tickRef.current = setInterval(() => tickDecay(), DECAY_INTERVAL)
    return () => { if (tickRef.current) clearInterval(tickRef.current) }
  }, [tickDecay])

  useEffect(() => { loadCatProfile() }, [])

  // ============== 操作 ==============
  const petCat = useCallback(() => {
    setPetCount((c) => c + 1)
    petCatAction()
    setTimeout(() => setPetCount((c) => c - 1), 500)
  }, [petCatAction])

  // 购买（商店面板通用）
  const handleBuy = (item: ShopItem) => {
    if (coins < item.price) return
    buyItem(item.id, item.price, item.hunger !== undefined)
  }

  // 喂食（从已购食品中选择）
  const feedCat = (item: ShopItem) => {
    feedCatAction(item.id, item.hunger || 0)
  }

  // 穿戴饰品
  const equipAccessory = (id: string) => {
    setEquippedAcc(equippedAcc === id ? null : id)
  }

  // ============== 进度条颜色 ==============
  const barColor = (value: number) => (value <= LOW_THRESHOLD ? '#EF5350' : value >= 60 ? '#81C784' : '#FFB74D')

  // ============== 当前面板商品 ==============
  const getPanelItems = (): ShopItem[] => {
    switch (activePanel) {
      case 'foodShop': return FOOD_ITEMS
      case 'accShop': return ACCESSORY_ITEMS
      case 'feed': return FOOD_ITEMS.filter((f) => (boughtFood[f.id] || 0) > 0)
      case 'wardrobe': return ACCESSORY_ITEMS.filter((a) => unlockedAccessories.includes(a.id))
      default: return []
    }
  }

  const panelTitle =
    activePanel === 'foodShop' ? '食品商店' :
    activePanel === 'accShop' ? '饰品商店' :
    activePanel === 'feed' ? '喂食' :
    activePanel === 'wardrobe' ? '衣柜' : ''

  const CAT_W = Math.round(sw * 0.7 * 1.4)
  const CAT_H = Math.round(CAT_W * (580 / 480))   // 猫帧比例 480:580 → ~476
  const BOW_H = Math.round(CAT_W * (1220 / 960))  // bow 比例 960:1220 → ~501

  // 猫咪等级（基于金币数）
  const catLevel = 1
  const levelProgress = 0.5

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ImageBackground source={BG_IMAGE} style={styles.bg} imageStyle={styles.bgImage}>
        {/* ====== 顶部信息 ====== */}
        <View style={styles.topBar}>
          <View style={styles.topLeft}>
            <View style={styles.avatarCircle}>
              <UserAvatar size={scale(76)} />
            </View>
            <Text style={styles.catName}>{catName}</Text>
          </View>
          <View style={styles.coinBadge}>
            <Text style={styles.coinIcon}>🪙</Text>
            <Text style={styles.coins}>{coins}</Text>
          </View>
        </View>

        {/* ====== 进度条 ====== */}
        <View style={styles.barsWrap}>
          <View style={styles.barCol}>
            <Text style={styles.barLabel}>饱腹度</Text>
            <View style={styles.barRow}>
              <View style={styles.barBg}>
                <View style={[styles.barFill, { width: `${hunger}%`, backgroundColor: hunger <= LOW_THRESHOLD ? '#EF5350' : '#FFB74D' }]} />
              </View>
              <Text style={[styles.barNum, hunger <= LOW_THRESHOLD && { color: '#EF5350' }]}>{Math.round(hunger)}</Text>
            </View>
          </View>
          <View style={styles.barCol}>
            <Text style={styles.barLabel}>开心值</Text>
            <View style={styles.barRow}>
              <View style={styles.barBg}>
                <View style={[styles.barFill, { width: `${happiness}%` as any, backgroundColor: barColor(happiness) }]} />
              </View>
              <Text style={[styles.barNum, happiness <= LOW_THRESHOLD && { color: '#EF5350' }]}>{Math.round(happiness)}</Text>
            </View>
          </View>
        </View>

        {/* ====== 中部主区域 ====== */}
        <View style={styles.mainArea}>
          {/* 左侧按钮列 */}
          <View style={styles.sideButtons}>
            <TouchableOpacity
              style={[styles.sideBtn, activePanel === 'foodShop' && styles.sideBtnActive]}
              onPress={() => setActivePanel(activePanel === 'foodShop' ? null : 'foodShop')}
            >
              <Image source={ICON_FOOD} style={styles.sideBtnIconImg} />
              <Text style={[styles.sideBtnLabel, activePanel === 'foodShop' && styles.sideBtnLabelActive]}>食品</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sideBtn, activePanel === 'accShop' && styles.sideBtnActive]}
              onPress={() => setActivePanel(activePanel === 'accShop' ? null : 'accShop')}
            >
              <Image source={ICON_ACCESSORY} style={styles.sideBtnIconImg} />
              <Text style={[styles.sideBtnLabel, activePanel === 'accShop' && styles.sideBtnLabelActive]}>饰品</Text>
            </TouchableOpacity>
          </View>

          {/* 中间猫咪 */}
          <View style={styles.catArea}>
            <View style={[styles.catTouch, { width: CAT_W, height: CAT_H }]}>
              {/* 猫咪帧动画 — 左上角 (0,0)，尺寸 394×476.1 */}
              <View style={{ position: 'absolute', top: -20, left: 20 }}>
                <AnimatedSprite playing={petCount > 0} width={CAT_W} height={CAT_H} fps={10} />
              </View>
              {/* 饰品 — 与蝴蝶结位置/尺寸一致 */}
              {equippedAcc && ACCESSORY_IMAGES[equippedAcc] && (
                <Image
                  source={ACCESSORY_IMAGES[equippedAcc]}
                  style={{
                    position: 'absolute',
                    top: -20,
                    left: 20,
                    width: CAT_W,
                    height: BOW_H,
                  }}
                  resizeMode="contain"
                />
              )}
              {/* 猫主体触摸区域：仅限非透明部分 */}
              <TouchableOpacity
                style={[styles.petHit, {
                  left: CAT_W * (120 / 480) + 20,
                  top: CAT_H * (160 / 580),
                  width: CAT_W * (210 / 480),
                  height: CAT_H * (350 / 580),
                }]}
                onPress={petCat}
                activeOpacity={0.8}
              />
            </View>
          </View>

          {/* 右侧按钮列 */}
          <View style={styles.sideButtons}>
            <TouchableOpacity
              style={[styles.sideBtn, activePanel === 'feed' && styles.sideBtnActive]}
              onPress={() => setActivePanel(activePanel === 'feed' ? null : 'feed')}
            >
              <Image source={ICON_FEED} style={styles.sideBtnIconImg} />
              <Text style={[styles.sideBtnLabel, activePanel === 'feed' && styles.sideBtnLabelActive]}>喂食</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sideBtn, activePanel === 'wardrobe' && styles.sideBtnActive]}
              onPress={() => setActivePanel(activePanel === 'wardrobe' ? null : 'wardrobe')}
            >
              <Image source={ICON_WARDROBE} style={styles.sideBtnIconImg} />
              <Text style={[styles.sideBtnLabel, activePanel === 'wardrobe' && styles.sideBtnLabelActive]}>衣柜</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ====== 猫咪等级进度条 ====== */}
        <View style={styles.levelBarWrap}>
          <View style={styles.levelBarHeader}>
            <Text style={styles.levelLabel}>Lv.{catLevel}</Text>
            <Text style={styles.levelProgressText}>{coins % 500}/{500}</Text>
          </View>
          <View style={styles.levelBarBg}>
            <View style={[styles.levelBarFill, { width: `${levelProgress * 100}%` }]} />
          </View>
        </View>

        {/* ====== 底部面板 ====== */}
        {activePanel && (
          <View style={styles.panelOverlay}>
            <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>{panelTitle}</Text>
              <TouchableOpacity onPress={() => setActivePanel(null)}>
                <Text style={styles.panelClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.itemGrid}>
              {getPanelItems().map((item) => {
                const isFood = item.hunger !== undefined
                const count = isFood ? (boughtFood[item.id] || 0) : 0
                const isEquipped = equippedAcc === item.id

                if (activePanel === 'feed') {
                  // 喂食面板：点击喂猫
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.itemCard]}
                      onPress={() => feedCat(item)}
                      disabled={count <= 0}
                    >
                      <Text style={styles.itemEmoji}>{isFood ? '🐟' : ''}</Text>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemInfo}>x{count}</Text>
                      <Text style={styles.itemAction}>喂食</Text>
                    </TouchableOpacity>
                  )
                }

                if (activePanel === 'wardrobe') {
                  // 衣柜面板：点击穿戴
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.itemCard, isEquipped && styles.itemEquipped]}
                      onPress={() => equipAccessory(item.id)}
                    >
                      {item.image && (
                        <Image source={item.image} style={styles.itemImage} resizeMode="contain" />
                      )}
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={[styles.itemAction, isEquipped && { color: '#F4A460' }]}>
                        {isEquipped ? '已穿戴' : '穿戴'}
                      </Text>
                    </TouchableOpacity>
                  )
                }

                // 商店面板
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.itemCard, coins < item.price && styles.itemDisabled]}
                    onPress={() => handleBuy(item)}
                    disabled={coins < item.price}
                  >
                    {item.image ? (
                      <Image source={item.image} style={styles.itemImage} resizeMode="contain" />
                    ) : (
                      <Text style={styles.itemEmoji}>{isFood ? '🐟' : '💎'}</Text>
                    )}
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemPrice}>{item.price}G</Text>
                    <Text style={styles.itemAction}>购买</Text>
                  </TouchableOpacity>
                )
              })}
              {getPanelItems().length === 0 && (
                <Text style={styles.emptyText}>
                  {activePanel === 'feed' ? '还没有食物，先去食品商店购买吧~' : '还没有饰品，先去饰品商店购买吧~'}
                </Text>
              )}
            </View>
          </View>
          </View>
        )}
      </ImageBackground>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bg: { flex: 1 },
  bgImage: { marginTop: -20, transform: [{ scale: 1.3 }] },

  // ====== 顶部 ======
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: scale(18), paddingTop: scale(20),
  },
  topLeft: { alignItems: 'center' },
  avatarCircle: {
    backgroundColor: '#FFFFFF',
    borderWidth: 3, borderColor: '#E0D0C0',
    borderRadius: scale(76), padding: scale(8),
  },
  catName: {
    fontFamily: 'Pixel',
    fontSize: scale(17), color: '#FFFFFF',
    marginTop: scale(8),
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  coinBadge: {
    width: scale(150),
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: scale(6),
    backgroundColor: 'rgba(255,255,255,0.85)', paddingHorizontal: scale(14), paddingVertical: scale(8),
    borderWidth: 2, borderColor: '#F4A460', borderRadius: scale(20),
  },
  coinIcon: { fontSize: scale(18) },
  coins: { fontSize: scale(16), fontWeight: '700', color: '#F4A460' },

  // ====== 进度条 ======
  barsWrap: {
    alignItems: 'flex-end',
    paddingHorizontal: scale(18), gap: scale(8),
    marginTop: scale(-30),
  },
  barCol: { width: scale(150), gap: scale(3) },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: scale(6) },
  barLabel: { fontSize: scale(11), color: '#FFFFFF' },
  barBg: {
    flex: 1, height: scale(10), backgroundColor: '#F0E0D0',
    borderWidth: 1, borderColor: '#D7CCC8', borderRadius: scale(5),
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: scale(4) },
  barNum: { fontSize: scale(13), color: '#3E2723', fontWeight: '800' },

  // ====== 主区域 ======
  mainArea: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },

  // 侧边按钮
  sideButtons: { width: scale(60), alignItems: 'center', gap: scale(16), zIndex: 10, elevation: 10, paddingHorizontal: scale(4) },
  sideBtn: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.85)', borderWidth: 2, borderColor: '#E0D0C0',
    borderRadius: scale(14), paddingHorizontal: scale(10), paddingVertical: scale(10), gap: scale(3),
  },
  sideBtnActive: { backgroundColor: '#F4A460', borderColor: '#C07840' },
  sideBtnIconImg: { width: scale(42), height: scale(42), resizeMode: 'contain' },
  sideBtnLabel: { fontSize: scale(10), color: '#8D6E63' },
  sideBtnLabelActive: { color: '#FFFFFF' },

  // 猫咪区域
  catArea: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
  },
  catTouch: { alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 },
  petHit: { position: 'absolute' },

  // ====== 等级进度条 ======
  levelBarWrap: {
    alignItems: 'center', paddingTop: scale(10), paddingBottom: scale(4),
  },
  levelBarHeader: {
    width: sw * 0.88,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
    marginBottom: scale(4),
  },
  levelLabel: {
    fontSize: scale(16), fontWeight: '800', color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  levelProgressText: {
    fontSize: scale(11), fontWeight: '600', color: 'rgba(255,255,255,0.8)',
  },
  levelBarBg: {
    width: sw * 0.88, height: scale(12),
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.6)', borderRadius: scale(6),
    overflow: 'hidden',
  },
  levelBarFill: {
    height: '100%', backgroundColor: '#66BB6A', borderRadius: scale(5),
  },

  // ====== 底部面板 ======
  panelOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    zIndex: 10, elevation: 10,
  },
  panel: {
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderTopWidth: 3, borderTopColor: '#E0D0C0',
    padding: scale(16), paddingBottom: scale(24),
    maxHeight: scale(200),
    zIndex: 10, elevation: 10,
  },
  panelHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: scale(10),
  },
  panelTitle: { fontSize: scale(15), fontWeight: '700', color: '#5D4037' },
  panelClose: { fontSize: scale(18), color: '#C0A090', padding: scale(4) },
  itemGrid: { flexDirection: 'row', gap: scale(10), flexWrap: 'wrap' },
  itemCard: {
    backgroundColor: '#FFF8F0', padding: scale(10), alignItems: 'center',
    borderWidth: 2, borderColor: '#E0D0C0', borderRadius: scale(8),
    minWidth: scale(72), gap: scale(2),
  },
  itemEquipped: { borderColor: '#F4A460', backgroundColor: '#FFF3E4' },
  itemDisabled: { opacity: 0.35 },
  itemEmoji: { fontSize: scale(24) },
  itemImage: { width: scale(36), height: scale(36) },
  itemName: { fontSize: scale(11), color: '#4E342E' },
  itemPrice: { fontSize: scale(11), color: '#F4A460', fontWeight: '700' },
  itemInfo: { fontSize: scale(10), color: '#8D6E63' },
  itemAction: { fontSize: scale(10), color: '#C0A090', marginTop: scale(2) },
  emptyText: { fontSize: scale(12), color: '#C0A090', padding: scale(10) },

})
