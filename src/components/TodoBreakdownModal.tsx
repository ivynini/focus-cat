import { useState } from 'react'
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { api } from '../lib/api'
import { scale } from '../lib/scale'

interface DraftItem {
  text: string
  selected: boolean
}

interface Props {
  visible: boolean
  onClose: () => void
  /** 确认成功、待办已建好之后调用，让父组件重新拉列表 */
  onCreated: () => void
}

export function TodoBreakdownModal({ visible, onClose, onCreated }: Props) {
  const [goal, setGoal] = useState('')
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<DraftItem[] | null>(null)
  const [proposalId, setProposalId] = useState<number | null>(null)
  const [error, setError] = useState('')

  const reset = () => {
    setGoal('')
    setItems(null)
    setProposalId(null)
    setError('')
    setLoading(false)
  }

  const close = () => {
    if (loading) return
    reset()
    onClose()
  }

  const requestBreakdown = async (text: string) => {
    setLoading(true)
    setError('')
    try {
      const proposal = await api.breakdownTodos(text)
      setProposalId(proposal.id)
      setItems(
        (proposal.items as string[]).map((item) => ({ text: item, selected: true }))
      )
    } catch (e: any) {
      setError(e.message || '拆解失败，稍后再试')
    } finally {
      setLoading(false)
    }
  }

  const breakdown = async () => {
    const text = goal.trim()
    if (text.length < 2) {
      setError('再多写几个字，AI 才知道要拆什么')
      return
    }
    await requestBreakdown(text)
  }

  // 换一批：旧提议先作废，别再留在库里当 pending
  const reroll = async () => {
    if (loading) return
    if (proposalId != null) {
      try {
        await api.dismissProposal(proposalId)
      } catch {
        // 作废失败不影响重新生成
      }
      setProposalId(null)
      setItems(null)
    }
    await requestBreakdown(goal.trim())
  }

  const toggle = (index: number) => {
    setItems((prev) =>
      prev
        ? prev.map((item, i) => (i === index ? { ...item, selected: !item.selected } : item))
        : prev
    )
  }

  const confirm = async () => {
    if (proposalId == null || !items) return
    const chosen = items.filter((item) => item.selected).map((item) => item.text)
    if (chosen.length === 0) {
      setError('至少留一条')
      return
    }
    setLoading(true)
    setError('')
    try {
      await api.confirmProposal(proposalId, chosen)
      reset()
      onCreated()
      onClose()
    } catch (e: any) {
      setError(e.message || '保存失败')
      setLoading(false)
    }
  }

  const discard = async () => {
    if (proposalId != null) {
      try {
        await api.dismissProposal(proposalId)
      } catch {
        // 拒绝失败也不该拦住用户关窗
      }
    }
    close()
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={close}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <TouchableOpacity onPress={discard} hitSlop={10}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.title}>AI 拆解</Text>
            <View style={{ width: scale(18) }} />
          </View>

          {items === null ? (
            <>
              <Text style={styles.label}>想做什么？</Text>
              <TextInput
                style={styles.input}
                placeholder="例如：两周后考数据结构"
                placeholderTextColor="#C0A090"
                value={goal}
                onChangeText={setGoal}
                editable={!loading}
                multiline
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <TouchableOpacity
                style={[styles.primary, loading && styles.primaryDisabled]}
                onPress={breakdown}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryText}>拆成待办</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.label}>去掉不想要的，剩下的会变成待办</Text>
              {items.map((item, index) => (
                <TouchableOpacity
                  key={`${item.text}_${index}`}
                  style={styles.itemRow}
                  onPress={() => toggle(index)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.check, item.selected && styles.checkOn]}>
                    {item.selected && <Text style={styles.checkMark}>✓</Text>}
                  </View>
                  <Text style={[styles.itemText, !item.selected && styles.itemTextOff]}>
                    {item.text}
                  </Text>
                </TouchableOpacity>
              ))}
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <TouchableOpacity
                style={styles.reroll}
                onPress={reroll}
                disabled={loading}
              >
                <Text style={styles.rerollText}>↻ 换一批</Text>
              </TouchableOpacity>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.secondary} onPress={discard} disabled={loading}>
                  <Text style={styles.secondaryText}>算了</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primary, styles.primaryFlex, loading && styles.primaryDisabled]}
                  onPress={confirm}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryText}>
                      确认建 {items.filter((item) => item.selected).length} 条
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: scale(28),
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#E0D0C0',
    padding: scale(20),
    gap: scale(10),
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  close: { fontSize: scale(18), color: '#C0A090' },
  title: { fontSize: scale(16), fontFamily: 'PixelSCBold', color: '#5D4037' },

  label: { fontSize: scale(12), fontFamily: 'PixelSC', color: '#8D6E63' },
  input: {
    minHeight: scale(64),
    backgroundColor: '#FFF8F0',
    borderWidth: 2,
    borderColor: '#E0D0C0',
    paddingHorizontal: scale(12),
    paddingVertical: scale(8),
    fontSize: scale(13),
    fontFamily: 'PixelSC',
    color: '#4E342E',
    textAlignVertical: 'top',
  },
  error: { fontSize: scale(11), fontFamily: 'PixelSC', color: '#E57373' },
  reroll: { alignSelf: 'flex-start', paddingVertical: scale(2) },
  rerollText: { fontSize: scale(12), fontFamily: 'PixelSC', color: '#B08060' },

  itemRow: { flexDirection: 'row', alignItems: 'center', gap: scale(10), paddingVertical: scale(6) },
  check: {
    width: scale(20),
    height: scale(20),
    borderWidth: 2,
    borderColor: '#D7CCC8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: '#F4A460', borderColor: '#C07840' },
  checkMark: { fontSize: scale(12), color: '#FFFFFF', fontFamily: 'Pixel' },
  itemText: { flex: 1, fontSize: scale(13), fontFamily: 'PixelSC', color: '#4E342E' },
  itemTextOff: { color: '#C0A090', textDecorationLine: 'line-through' },

  actions: { flexDirection: 'row', gap: scale(10), marginTop: scale(4) },
  primary: {
    backgroundColor: '#F4A460',
    borderWidth: 2,
    borderColor: '#D49450',
    paddingVertical: scale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryFlex: { flex: 1 },
  primaryDisabled: { opacity: 0.6 },
  primaryText: { fontSize: scale(13), fontFamily: 'PixelSCBold', color: '#FFFFFF' },
  secondary: {
    paddingHorizontal: scale(16),
    paddingVertical: scale(10),
    borderWidth: 2,
    borderColor: '#D7CCC8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { fontSize: scale(13), fontFamily: 'PixelSC', color: '#8D6E63' },
})
