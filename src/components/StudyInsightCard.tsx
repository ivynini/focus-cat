import { useCallback, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { api } from '../lib/api'
import { InsightCardView, type InsightCardData } from './InsightCardView'
import { AskSheet } from './AskSheet'
import { scale } from '../lib/scale'

export type { InsightAction, InsightCardData, InsightMetric } from './InsightCardView'

interface Props {
  enabled: boolean
}

/** 从指标里取一行摘要：连续 3 天 · 今日 118 分钟 */
function streakLine(card: InsightCardData): string {
  const value = (label: string) =>
    card.metrics.find((metric) => metric.label === label)?.value ?? ''
  return `连续 ${value('连续天数')} · 今日 ${value('今日')}`
}

export function StudyInsightCard({ enabled }: Props) {
  const [card, setCard] = useState<InsightCardData | null>(null)
  const [streak, setStreak] = useState<InsightCardData | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [showAsk, setShowAsk] = useState(false)

  const load = useCallback(() => {
    if (!enabled) {
      setCard(null)
      setStreak(null)
      return
    }
    api
      .getStudyInsights()
      .then((cards: InsightCardData[]) => {
        if (!Array.isArray(cards)) {
          setCard(null)
          setStreak(null)
          return
        }
        setCard(cards.find((item) => item.kind === 'weekly_review') ?? null)
        setStreak(cards.find((item) => item.kind === 'daily_streak') ?? null)
      })
      // 后端没起 / token 过期：整块消失，不打扰用户
      .catch(() => {
        setCard(null)
        setStreak(null)
      })
  }, [enabled])

  useFocusEffect(load)

  const refresh = async () => {
    if (refreshing) return
    setRefreshing(true)
    try {
      const next = (await api.refreshStudyInsight('weekly_review')) as InsightCardData
      setCard(next)
    } catch {
      // 刷新失败保留旧卡片
    } finally {
      setRefreshing(false)
    }
  }

  if (!card) return null

  // 空数据那张一共就两行，收起来反而看不到引导，所以强制展开
  const open = expanded || Boolean(card.empty)

  // 没有连续记录时不显示这条：0 天没有任何激励价值，只是噪音
  const streakRow =
    streak && !streak.empty ? (
      <View style={[styles.streakRow, open ? styles.streakRowSpaced : null]}>
        <Text style={styles.streakText}>{streakLine(streak)}</Text>
      </View>
    ) : null

  if (!open) {
    return (
      <View style={styles.box}>
        <TouchableOpacity
          style={styles.collapsedRow}
          activeOpacity={0.7}
          onPress={() => setExpanded(true)}
        >
          <Text style={styles.tag}>AI 复盘</Text>
          <Text style={styles.collapsedTitle} numberOfLines={1}>
            {card.title}
          </Text>
          <Text style={styles.toggleText}>展开</Text>
        </TouchableOpacity>
        {streakRow}
      </View>
    )
  }

  return (
    <View style={[styles.box, card.empty ? styles.boxEmpty : null]}>
      <View style={styles.head}>
        <Text style={styles.tag}>AI 复盘</Text>
        <View style={styles.headRight}>
          <TouchableOpacity onPress={refresh} hitSlop={10}>
            <Text style={styles.refresh}>{refreshing ? '···' : '刷新'}</Text>
          </TouchableOpacity>
          {!card.empty && (
            <TouchableOpacity onPress={() => setExpanded(false)} hitSlop={10}>
              <Text style={styles.toggleText}>收起</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.content}>
        <InsightCardView card={card} />
      </View>
      <TouchableOpacity style={styles.askLink} onPress={() => setShowAsk(true)}>
        <Text style={styles.askLinkText}>问点别的 →</Text>
      </TouchableOpacity>
      {streakRow}
      <AskSheet visible={showAsk} onClose={() => setShowAsk(false)} />
    </View>
  )
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E0D0C0',
  },
  boxEmpty: { backgroundColor: '#FFFDF8', borderStyle: 'dashed' },

  collapsedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    paddingHorizontal: scale(16),
    paddingVertical: scale(12),
  },

  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: scale(16),
    paddingTop: scale(16),
    paddingBottom: scale(8),
  },
  headRight: { flexDirection: 'row', alignItems: 'center', gap: scale(14) },

  content: { paddingHorizontal: scale(16), paddingBottom: scale(16) },

  tag: { fontSize: scale(10), fontFamily: 'Pixel', color: '#C0A080', letterSpacing: 1 },
  collapsedTitle: { flex: 1, fontSize: scale(13), fontFamily: 'PixelSCBold', color: '#5D4037' },
  refresh: { fontSize: scale(11), fontFamily: 'PixelSC', color: '#F4A460' },
  toggleText: { fontSize: scale(11), fontFamily: 'PixelSC', color: '#B08060' },

  streakRow: {
    paddingHorizontal: scale(16),
    paddingBottom: scale(12),
  },
  streakRowSpaced: {
    paddingTop: scale(10),
    borderTopWidth: 1,
    borderTopColor: '#F0E4D8',
  },
  streakText: { fontSize: scale(11), fontFamily: 'PixelSC', color: '#B08060' },
  askLink: { paddingHorizontal: scale(16), paddingBottom: scale(12) },
  askLinkText: { fontSize: scale(11), fontFamily: 'PixelSC', color: '#F4A460' },
})
