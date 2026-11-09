import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useRouter } from 'expo-router'
import { scale } from '../lib/scale'

export interface InsightMetric {
  label: string
  value: string
  delta?: string | null
}

export interface InsightAction {
  type: string
  label: string
  route?: string | null
}

export interface InsightCardData {
  id: number
  kind: string
  version: number
  generated_at?: string
  title: string
  body: string
  metrics: InsightMetric[]
  actions: InsightAction[]
  period?: { start: string; end: string }
  empty?: boolean
}

// 服务端给的是语义路由，客户端自己映射到 expo-router 的路径。
// 认不出来的路由就啥也不做——老版本 App 遇到新卡片不会崩。
const ROUTE_MAP: Record<string, string> = {
  'focus/history': '/stats',
  'focus/start': '/focus',
}

// 数字用像素字体、单位用系统字体：Pixel 字体没有中文字形，
// 混在一个 Text 里会让「1 小时 55 分」的数字和汉字挤得很难看。
function MetricValue({ value, compact }: { value: string; compact: boolean }) {
  const parts = value.split(/(\d+)/).filter((part) => part.length > 0)
  return (
    <Text style={[styles.metricValue, compact && styles.metricValueCompact]}>
      {parts.map((part, index) =>
        /^\d+$/.test(part) ? (
          <Text key={index} style={styles.metricNumber}>
            {part}
          </Text>
        ) : (
          <Text key={index} style={styles.metricUnit}>
            {part}
          </Text>
        )
      )}
    </Text>
  )
}

interface Props {
  card: InsightCardData
  /** 窄容器（完成弹层）用：字体更小、指标横排、整体居中 */
  compact?: boolean
  hideActions?: boolean
}

export function InsightCardView({ card, compact = false, hideActions = false }: Props) {
  const router = useRouter()

  return (
    <View style={compact ? styles.compactWrap : styles.wrap}>
      <Text style={[styles.title, compact && styles.titleCompact]}>{card.title}</Text>
      <Text style={[styles.body, compact && styles.bodyCompact]}>{card.body}</Text>

      {!card.empty && card.metrics.length > 0 && (
        <View style={compact ? styles.metricsRow : styles.metricsGrid}>
          {card.metrics.map((metric) => (
            <View key={metric.label} style={compact ? styles.metricCell : styles.metricTile}>
              <Text style={styles.metricLabel}>{metric.label}</Text>
              <MetricValue value={metric.value} compact={compact} />
              {metric.delta ? (
                <Text
                  style={[
                    styles.metricDelta,
                    { color: metric.delta.startsWith('-') ? '#E57373' : '#66BB6A' },
                  ]}
                >
                  {metric.delta}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      )}

      {!hideActions &&
        card.actions.map((action) => {
          const target = action.route ? ROUTE_MAP[action.route] : undefined
          if (!target) return null
          return (
            <TouchableOpacity
              key={action.label}
              style={[styles.cta, card.empty ? styles.ctaStart : null]}
              onPress={() => router.push(target as any)}
            >
              <Text style={styles.ctaText}>{action.label} →</Text>
            </TouchableOpacity>
          )
        })}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: scale(8) },
  compactWrap: { gap: scale(4), alignItems: 'center', width: '100%' },

  title: { fontSize: scale(17), fontFamily: 'PixelSCBold', color: '#5D4037', lineHeight: scale(24) },
  titleCompact: { fontSize: scale(13), textAlign: 'center', lineHeight: scale(18) },
  body: { fontSize: scale(12), fontFamily: 'PixelSC', color: '#8D6E63', lineHeight: scale(19) },
  bodyCompact: { fontSize: scale(10), textAlign: 'center', lineHeight: scale(15) },

  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: scale(4) },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: scale(4), width: '100%' },
  metricTile: { width: '50%', paddingVertical: scale(6), gap: scale(1) },
  metricCell: { flex: 1, alignItems: 'center', gap: scale(1) },

  metricLabel: { fontSize: scale(9), fontFamily: 'PixelSC', color: '#A1887F' },
  metricValue: { fontSize: scale(16), fontFamily: 'Pixel', color: '#4E342E' },
  metricValueCompact: { fontSize: scale(13) },
  metricNumber: { fontSize: scale(16), fontFamily: 'Pixel', color: '#4E342E' },
  metricUnit: { fontSize: scale(11), fontFamily: 'PixelSC', color: '#8D6E63' },
  metricDelta: { fontSize: scale(10), fontFamily: 'PixelSC' },

  cta: {
    alignSelf: 'flex-start',
    marginTop: scale(6),
    paddingHorizontal: scale(14),
    paddingVertical: scale(8),
    borderWidth: 2,
    borderColor: '#D49450',
    backgroundColor: '#F4A460',
  },
  ctaStart: { borderColor: '#4CAF50', backgroundColor: '#66BB6A' },
  ctaText: { fontSize: scale(12), fontFamily: 'PixelSCBold', color: '#FFFFFF' },
})
