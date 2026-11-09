import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { InsightCardView, type InsightCardData } from './InsightCardView'
import { scale } from '../lib/scale'

interface Props {
  coins: number
  card: InsightCardData | null
  onClose: () => void
}

/** 专注结束后盖在计时页上的那张卡。 */
export function FocusCompletionCard({ coins, card, onClose }: Props) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>专注完成!</Text>
          <Text style={styles.coins}>+{coins} 🪙</Text>
          <Text style={styles.hint}>金币已存入猫咪账户</Text>
          {card ? (
            <View style={styles.insight}>
              <InsightCardView card={card} compact hideActions />
            </View>
          ) : null}
          <TouchableOpacity style={styles.btn} onPress={onClose}>
            <Text style={styles.btnText}>好的</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.55)' },
  card: {
    width: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: scale(14),
    paddingHorizontal: scale(16),
    paddingVertical: scale(18),
    alignItems: 'center',
    gap: scale(6),
    borderWidth: 3,
    borderColor: '#F4A460',
  },
  title: { fontSize: scale(16), fontFamily: 'Pixel', color: '#F4A460' },
  coins: { fontSize: scale(22), fontFamily: 'Pixel', color: '#FFB74D' },
  hint: { fontSize: scale(11), color: '#A1887F' },
  insight: {
    width: '100%',
    marginTop: scale(2),
    paddingTop: scale(8),
    borderTopWidth: 1,
    borderTopColor: '#F0E4D8',
  },
  btn: {
    marginTop: scale(4),
    backgroundColor: '#F4A460',
    paddingHorizontal: scale(26),
    paddingVertical: scale(8),
    borderRadius: scale(20),
  },
  btnText: { fontSize: scale(13), fontFamily: 'Pixel', color: '#FFFFFF' },
})
