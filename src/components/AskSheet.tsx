import { useState } from 'react'
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { api } from '../lib/api'
import { scale } from '../lib/scale'

interface Props {
  visible: boolean
  onClose: () => void
}

interface AskResult {
  answer: string
  status: string
  steps: number
  metrics?: { llm_calls?: number; tool_calls?: number }
}

const SUGGESTIONS = ['我这周专注了多少分钟？', '我最长的一次专注是多久？', '我这周哪几天没有专注？']

// 模型喜欢输出 markdown，RN 的 Text 不认，去掉标记只留纯文本
function plainText(text: string): string {
  return text
    .replace(/\*\*/g, '')
    .replace(/^-\s+/gm, '· ')
    .replace(/^#{1,6}\s*/gm, '')
    .trim()
}

/** 单次问答：不保留会话历史，答完即可关掉。 */
export function AskSheet({ visible, onClose }: Props) {
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AskResult | null>(null)
  const [error, setError] = useState('')

  const reset = () => {
    setQuestion('')
    setResult(null)
    setError('')
    setLoading(false)
  }

  const close = () => {
    if (loading) return
    reset()
    onClose()
  }

  const ask = async (text?: string) => {
    const value = (text ?? question).trim()
    if (value.length < 2) {
      setError('问得具体一点，我才查得准')
      return
    }
    setQuestion(value)
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const answer = (await api.askStudy(value)) as AskResult
      setResult(answer)
    } catch (e: any) {
      setError(e.message || '没答上来，稍后再试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={close}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <TouchableOpacity onPress={close} hitSlop={10}>
              <Text style={styles.close}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.title}>问一句</Text>
            <View style={{ width: scale(18) }} />
          </View>

          <TextInput
            style={styles.input}
            placeholder="例如：我上次专注 50 分钟是什么时候？"
            placeholderTextColor="#C0A090"
            value={question}
            onChangeText={setQuestion}
            editable={!loading}
            multiline
          />

          {result ? (
            <ScrollView style={styles.answerBox} contentContainerStyle={styles.answerContent}>
              <Text style={styles.answer}>{plainText(result.answer)}</Text>
              <Text style={styles.meta}>
                {result.steps} 步 · 查了 {result.metrics?.tool_calls ?? 0} 次数据
              </Text>
            </ScrollView>
          ) : (
            <View style={styles.suggestions}>
              {SUGGESTIONS.map((item) => (
                <TouchableOpacity key={item} style={styles.chip} onPress={() => ask(item)} disabled={loading}>
                  <Text style={styles.chipText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity style={styles.primary} onPress={() => ask()} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryText}>{result ? '再问一次' : '问'}</Text>
            )}
          </TouchableOpacity>
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
    padding: scale(24),
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 3,
    borderColor: '#E0D0C0',
    padding: scale(18),
    gap: scale(10),
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  close: { fontSize: scale(18), color: '#C0A090' },
  title: { fontSize: scale(16), fontFamily: 'PixelSCBold', color: '#5D4037' },

  input: {
    minHeight: scale(52),
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
  suggestions: { gap: scale(6) },
  chip: {
    borderWidth: 1,
    borderColor: '#E8D5C4',
    backgroundColor: '#FFFDF8',
    paddingHorizontal: scale(10),
    paddingVertical: scale(7),
  },
  chipText: { fontSize: scale(11), fontFamily: 'PixelSC', color: '#8D6E63' },

  answerBox: { maxHeight: scale(320), backgroundColor: '#FFF8F0', padding: scale(12) },
  answerContent: { gap: scale(8) },
  answer: { fontSize: scale(13), fontFamily: 'PixelSC', color: '#4E342E', lineHeight: scale(20) },
  meta: { fontSize: scale(10), fontFamily: 'PixelSC', color: '#A1887F' },

  error: { fontSize: scale(11), fontFamily: 'PixelSC', color: '#E57373' },
  primary: {
    backgroundColor: '#F4A460',
    borderWidth: 2,
    borderColor: '#D49450',
    paddingVertical: scale(10),
    alignItems: 'center',
  },
  primaryText: { fontSize: scale(13), fontFamily: 'PixelSCBold', color: '#FFFFFF' },
})
