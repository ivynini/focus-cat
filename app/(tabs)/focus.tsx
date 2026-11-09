import { useState, useEffect, useRef, useCallback } from 'react'
import {
  StyleSheet, Text, View, TouchableOpacity, TextInput,
  Modal, ScrollView, ImageBackground, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AnimatedSprite } from '../../src/components/AnimatedSprite'
import { InsightCardData } from '../../src/components/InsightCardView'
import { ConfirmDialog } from '../../src/components/ConfirmDialog'
import { FocusCompletionCard } from '../../src/components/FocusCompletionCard'
import { TodoBreakdownModal } from '../../src/components/TodoBreakdownModal'
import { useCatStore } from '../../src/stores/catStore'
import { useAuth } from '../../src/stores/authStore'
import { api } from '../../src/lib/api'
import { scale, sw } from '../../src/lib/scale'
import { useRouter } from 'expo-router'

const BG_IMAGE = require('../../bg/bg1.png')
const BOW_IMAGE = require('../../catactivity/accessory/bow.png')
const SUNGLASSES_IMAGE = require('../../catactivity/accessory/sunglasses.png')
const HAT_IMAGE = require('../../catactivity/accessory/hat.png')
const NECKLACE_IMAGE = require('../../catactivity/accessory/necklace.png')

const ACCESSORY_IMAGES: Record<string, any> = {
  a1: BOW_IMAGE,
  a2: SUNGLASSES_IMAGE,
  a3: HAT_IMAGE,
  a4: NECKLACE_IMAGE,
}

type TimerMode = 'countdown' | 'countup' | 'notimer'

interface Todo {
  id: number
  text: string
  completed: boolean
  source?: string
}

interface FocusSession {
  id: number
  name: string
  duration: number
  mode: TimerMode
}

const BREAK_TIME = 5 * 60

export default function FocusScreen() {
  const router = useRouter()

  // ============ 状态 ============
  const [isFocusing, setIsFocusing] = useState(false)
  const [todos, setTodos] = useState<Todo[]>([])
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([])
  const [showModal, setShowModal] = useState(false)

  // 专注配置
  const [taskName, setTaskName] = useState('')
  const [timerMode, setTimerMode] = useState<TimerMode>('countdown')
  const [duration, setDuration] = useState(25)
  const [showCustom, setShowCustom] = useState(false)
  const [customMin, setCustomMin] = useState('')

  // 运行时
  const [workMinutes] = useState(25)
  const [totalSeconds, setTotalSeconds] = useState(25 * 60)
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [elapsed, setElapsed] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isBreak, setIsBreak] = useState(false)
  const [focusTaskName, setFocusTaskName] = useState('')
  const [focusMode, setFocusMode] = useState<TimerMode>('countdown')
  const [focusDuration, setFocusDuration] = useState(25)
  const [showCompletion, setShowCompletion] = useState(false)
  const [summaryCard, setSummaryCard] = useState<InsightCardData | null>(null)
  const [earnedCoins, setEarnedCoins] = useState(0)
  const [petCount, setPetCount] = useState(0)
  const [showPauseConfirm, setShowPauseConfirm] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)

  // 猫咪状态
  const catCoins = useCatStore((s) => s.coins)
  const hunger = useCatStore((s) => s.hunger)
  const happiness = useCatStore((s) => s.happiness)
  const equippedAcc = useCatStore((s) => s.equippedAcc)
  const petCatAction = useCatStore((s) => s.petCat)
  const catLevel = Math.min(Math.floor(catCoins / 500) + 1, 50)
  const levelProgress = (catCoins % 500) / 500

  const petCat = useCallback(() => {
    setPetCount((c) => c + 1)
    petCatAction()
    setTimeout(() => setPetCount((c) => c - 1), 500)
  }, [petCatAction])

  const sessionElapsed = totalSeconds - timeLeft
  const coinsEarned = focusMode === 'countdown'
    ? Math.floor(sessionElapsed / 60)
    : focusMode === 'countup'
    ? Math.floor(elapsed / 60)
    : 0
  const coinProgress = focusMode === 'countdown'
    ? Math.min(sessionElapsed / (focusDuration * 60), 1)
    : 1
  const coinsDisplay = focusMode === 'countdown' ? focusDuration : coinsEarned

  let nextId = useRef(0)
  let activeSessionId = useRef<number | null>(null)
  const awardedCoinsRef = useRef(0)
  const pendingCoinAwardRef = useRef(0)
  const completingRef = useRef(false)

  // ============ 加载持久化数据 ============
  const isLoggedIn = useAuth((s) => s.isLoggedIn)
  const [showBreakdown, setShowBreakdown] = useState(false)

  const loadTodos = useCallback(() => {
    if (!isLoggedIn) return
    api.getTodos().then((data: any[]) => {
      if (Array.isArray(data)) setTodos(data.map((t: any) => ({ id: t.id, text: t.text, completed: !!t.completed, source: t.source })))
    }).catch(() => {})
  }, [isLoggedIn])

  useEffect(() => {
    if (!isLoggedIn) return
    loadTodos()
    api.getFocusSessions().then((data: any[]) => {
      if (Array.isArray(data)) setFocusSessions(data.map((s: any) => ({ id: s.id, name: s.name, duration: s.duration, mode: s.mode })))
    }).catch(() => {})
  }, [isLoggedIn, loadTodos])

  // ============ 计时器 ============
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>
    if (isFocusing && isRunning) {
      timer = setInterval(() => {
        if (focusMode === 'countdown') {
          setTimeLeft((t) => {
            if (t <= 1) {
              setIsRunning(false)
              setTotalSeconds(focusDuration * 60)
              pendingCoinAwardRef.current = focusDuration
              return focusDuration * 60
            }
            return t - 1
          })
        } else if (focusMode === 'countup') {
          setElapsed((e) => e + 1)
        }
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [isRunning, isFocusing, focusMode, focusDuration])

  // ============ 专注完成：保存记录 + 发放金币 ============
  const completeFocus = async (coins: number) => {
    // 金币立即发放，不受异步锁影响
    const deltaCoins = coins - awardedCoinsRef.current
    if (deltaCoins > 0) {
      const catStore = useCatStore.getState()
      catStore.addCoins(deltaCoins)
      catStore.markFocusCompleted()
      catStore.addFocusMinutes(deltaCoins)
      awardedCoinsRef.current = coins
      setEarnedCoins(deltaCoins)
      setSummaryCard(null)
      setShowCompletion(true)
    }

    if (completingRef.current) return
    completingRef.current = true
    try {
      const sessionDuration = focusMode === 'countup' ? Math.max(coins, 1) : focusDuration

      if (activeSessionId.current === null) {
        if (isLoggedIn) {
          try {
            const s = await api.createFocusSession({ name: focusTaskName, duration: sessionDuration, mode: focusMode })
            setFocusSessions((prev) => [{ id: s.id, name: s.name, duration: s.duration, mode: s.mode }, ...prev])
            activeSessionId.current = s.id
            // 结束卡：拿不到就算了，不能挡住"专注完成"这个反馈
            api.getSessionSummary(s.id)
              .then((card: InsightCardData) => setSummaryCard(card))
              .catch(() => {})
          } catch {}
        } else {
          const sessionId = ++nextId.current
          setFocusSessions((prev) => [{ id: sessionId, name: focusTaskName, duration: sessionDuration, mode: focusMode }, ...prev])
          activeSessionId.current = sessionId
        }
      }
      if (isLoggedIn) await useCatStore.getState().syncToServer()
    } finally {
      completingRef.current = false
    }
  }

  useEffect(() => {
    if (pendingCoinAwardRef.current > 0) {
      const coins = pendingCoinAwardRef.current
      pendingCoinAwardRef.current = 0
      completeFocus(coins)
    }
  })

  // ============ 当前时间 ============
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    if (!isFocusing || focusMode !== 'notimer') return
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [isFocusing, focusMode])

  // ============ 操作 ============
  const addTodo = async () => {
    if (isLoggedIn) {
      try {
        const t = await api.createTodo('')
        setTodos((prev) => [...prev, { id: t.id, text: '', completed: false }])
        return
      } catch {}
    }
    setTodos((prev) => [...prev, { id: ++nextId.current, text: '', completed: false }])
  }

  const updateTodo = (id: number, text: string) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, text } : t)))
    if (isLoggedIn) api.updateTodo(String(id), { text }).catch(() => {})
  }

  const toggleTodo = (id: number) => {
    setTodos((prev) => prev.map((t) => {
      if (t.id !== id) return t
      const completed = !t.completed
      if (isLoggedIn) api.updateTodo(String(id), { completed }).catch(() => {})
      return { ...t, completed }
    }))
  }

  const deleteTodo = (id: number) => {
    setTodos((prev) => prev.filter((t) => t.id !== id))
    if (isLoggedIn) api.deleteTodo(String(id)).catch(() => {})
  }

  const deleteSession = (id: number) => {
    setFocusSessions((prev) => prev.filter((s) => s.id !== id))
    if (isLoggedIn) api.deleteFocusSession(String(id)).catch(() => {})
  }

  const handleLongPress = (id: number, type: 'todo' | 'session') => {
    Alert.alert('删除', '确定要删除吗？', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => { type === 'todo' ? deleteTodo(id) : deleteSession(id) } },
    ])
  }

  const openModal = () => {
    setTaskName('')
    setTimerMode('countdown')
    setDuration(25)
    setShowCustom(false)
    setCustomMin('')
    setShowModal(true)
  }

  const confirmFocus = () => {
    const finalName = taskName.trim() || '专注任务'
    let finalDuration = duration
    if (duration === 0) {
      finalDuration = parseInt(customMin) || 25
    }
    setFocusTaskName(finalName)
    setFocusMode(timerMode)
    setFocusDuration(finalDuration)

    if (timerMode === 'countdown') {
      setTimeLeft(finalDuration * 60)
      setTotalSeconds(finalDuration * 60)
    } else if (timerMode === 'countup') {
      setElapsed(0)
    }

    setShowModal(false)
    setIsRunning(false)
    setIsBreak(false)
    setIsFocusing(true)
    activeSessionId.current = null
      awardedCoinsRef.current = 0
      completingRef.current = false
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const formatClock = (d: Date) => {
    const h = d.getHours().toString().padStart(2, '0')
    const m = d.getMinutes().toString().padStart(2, '0')
    const s = d.getSeconds().toString().padStart(2, '0')
    return `${h}:${m}:${s}`
  }

  const selectDuration = (min: number) => {
    setDuration(min)
    setShowCustom(false)
  }

  const goBack = async () => {
    setIsRunning(false)
    setIsBreak(false)
    setIsFocusing(false)
    await completeFocus(coinsEarned)
  }

  const startSession = (session: FocusSession) => {
    setFocusTaskName(session.name)
    setFocusMode(session.mode)
    setFocusDuration(session.duration)
    if (session.mode === 'countdown') {
      setTimeLeft(session.duration * 60)
      setTotalSeconds(session.duration * 60)
    } else if (session.mode === 'countup') {
      setElapsed(0)
    }
    setIsRunning(false)
    setIsBreak(false)
    setIsFocusing(true)
    activeSessionId.current = session.id
      awardedCoinsRef.current = 0
      completingRef.current = false
  }

  // ============ 配置界面（非专注态） ============
  if (!isFocusing) {
    return (
      <SafeAreaView style={styles.setupContainer} edges={['top']}>
        {/* 顶部导航条 */}
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.navTodoBtn} onPress={addTodo}>
            <Text style={styles.navTodoText}>待办</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>专注</Text>
          <TouchableOpacity style={styles.navAddBtn} onPress={openModal}>
            <Text style={styles.navAddText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* 待办列表 + 专注历史 */}
        <ScrollView style={styles.todoScroll} contentContainerStyle={styles.todoContent}>
          {/* 待办事项 */}
          {todos.map((todo) => (
            <TouchableOpacity
              key={todo.id}
              style={[styles.todoCard, todo.completed && styles.todoCardDone]}
              activeOpacity={0.8}
              onLongPress={() => handleLongPress(todo.id, 'todo')}
            >
              <TouchableOpacity style={[styles.todoCheck, todo.completed && styles.todoCheckDone]} onPress={() => toggleTodo(todo.id)}>
                {todo.completed && <Text style={styles.todoCheckmark}>✓</Text>}
              </TouchableOpacity>
              {todo.source === 'ai_breakdown' && <Text style={styles.todoAiTag}>AI</Text>}
              <TextInput
                style={[styles.todoInput, todo.completed && styles.todoInputDone]}
                placeholder="输入待办事项..."
                placeholderTextColor="#C0A090"
                value={todo.text}
                onChangeText={(t) => updateTodo(todo.id, t)}
                editable={!todo.completed}
              />
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.todoAddBtn} onPress={addTodo}>
            <Text style={styles.todoAddBtnText}>+ 添加待办</Text>
          </TouchableOpacity>
          {isLoggedIn && (
            <TouchableOpacity
              style={[styles.todoAddBtn, styles.breakdownBtn]}
              onPress={() => setShowBreakdown(true)}
            >
              <Text style={styles.breakdownBtnText}>✦ AI 拆解</Text>
            </TouchableOpacity>
          )}
          {todos.length === 0 && (
            <Text style={styles.emptyText}>点击"待办"添加任务</Text>
          )}

          {/* 专注历史卡片 */}
          {focusSessions.map((session) => (
            <TouchableOpacity
              key={`fs_${session.id}`}
              style={styles.sessionCard}
              activeOpacity={0.8}
              onLongPress={() => handleLongPress(session.id, 'session')}
            >
              <View style={styles.sessionLeft}>
                <Text style={styles.sessionName} numberOfLines={1}>{session.name}</Text>
                <Text style={styles.sessionDuration}>
                  {session.mode === 'notimer' ? '不计时' : `${session.duration}分钟`}
                </Text>
              </View>
              <TouchableOpacity style={styles.sessionStartBtn} onPress={() => startSession(session)}>
                <Text style={styles.sessionStartText}>开始</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TodoBreakdownModal
          visible={showBreakdown}
          onClose={() => setShowBreakdown(false)}
          onCreated={loadTodos}
        />

        {/* 创建专注事件弹窗 */}
        <Modal visible={showModal} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              {/* 弹窗头部 */}
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>新建专注</Text>
                <TouchableOpacity onPress={confirmFocus}>
                  <Text style={styles.modalConfirm}>✓</Text>
                </TouchableOpacity>
              </View>

              {/* 第一行：名称 */}
              <TextInput
                style={styles.modalInput}
                placeholder="请输入待办名称"
                placeholderTextColor="#C0A090"
                value={taskName}
                onChangeText={setTaskName}
              />

              {/* 第二行：计时模式 */}
              <Text style={styles.modalLabel}>计时模式</Text>
              <View style={styles.modeRow}>
                {(['countdown', 'countup', 'notimer'] as TimerMode[]).map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.modeBtn, timerMode === m && styles.modeBtnActive]}
                    onPress={() => setTimerMode(m)}
                  >
                    <Text style={[styles.modeText, timerMode === m && styles.modeTextActive]}>
                      {m === 'countdown' ? '倒计时' : m === 'countup' ? '正向计时' : '不计时'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 第三行：时长选择（不计时模式隐藏） */}
              {timerMode !== 'notimer' && (
                <>
                  <Text style={styles.modalLabel}>时长</Text>
                  <View style={styles.modeRow}>
                    {[25, 35].map((d) => (
                      <TouchableOpacity
                        key={d}
                        style={[styles.modeBtn, duration === d && !showCustom && styles.modeBtnActive]}
                        onPress={() => selectDuration(d)}
                      >
                        <Text style={[styles.modeText, duration === d && !showCustom && styles.modeTextActive]}>
                          {d}分钟
                        </Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      style={[styles.modeBtn, showCustom && styles.modeBtnActive]}
                      onPress={() => { setShowCustom(true); setDuration(0) }}
                    >
                      <Text style={[styles.modeText, showCustom && styles.modeTextActive]}>自定义</Text>
                    </TouchableOpacity>
                  </View>
                  {showCustom && (
                    <TextInput
                      style={[styles.modalInput, { width: scale(100), alignSelf: 'center', marginTop: scale(8) }]}
                      placeholder="分钟"
                      placeholderTextColor="#C0A090"
                      keyboardType="number-pad"
                      value={customMin}
                      onChangeText={setCustomMin}
                    />
                  )}
                </>
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    )
  }

  // ============ 专注界面 ============
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ImageBackground source={BG_IMAGE} style={styles.bgImage}>
        {/* 返回按钮 */}
        <TouchableOpacity style={styles.backBtn} onPress={() => { if (!isRunning) { goBack() } else { setShowExitConfirm(true) } }}>
          <Text style={styles.backText}>← 返回</Text>
        </TouchableOpacity>

        {/* Timer section */}
        <View style={styles.timerSection}>
          <Text style={styles.taskLabel}>{focusTaskName}</Text>
          <Text style={styles.title}>{isBreak ? 'REST' : 'FOCUS'}</Text>

          {focusMode === 'notimer' ? (
            <Text style={styles.timerText}>{formatClock(now)}</Text>
          ) : focusMode === 'countup' ? (
            <Text style={styles.timerText}>{formatTime(elapsed)}</Text>
          ) : (
            <>
              {!isRunning && (
                <View style={styles.durationRow}>
                  <Text style={styles.durationTextActive}>{focusDuration}分钟</Text>
                </View>
              )}
              <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
            </>
          )}

          {/* Coin progress */}
          {focusMode !== 'notimer' && (
            <View style={styles.coinRow}>
              <Text style={styles.coinIcon}>🪙</Text>
              <View style={styles.coinBar}>
                <View style={[styles.coinFill, { width: `${Math.min(coinProgress * 100, 100)}%` as any }]} />
              </View>
              <Text style={styles.coinValue}>+{coinsDisplay}</Text>
            </View>
          )}

          <View style={styles.controls}>
            {focusMode !== 'notimer' && (
              <>
                <TouchableOpacity
                  style={[styles.button, isRunning ? styles.pauseButton : styles.startButton]}
                  onPress={() => {
                    if (isRunning) {
                      setShowPauseConfirm(true)
                    } else {
                      setIsRunning(true)
                    }
                  }}
                >
                  <Text style={styles.buttonText}>{isRunning ? 'PAUSE' : 'START'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={() => {
                    setIsRunning(false)
                    setIsBreak(false)
                    if (focusMode === 'countdown') {
                      setTimeLeft(focusDuration * 60)
                      setTotalSeconds(focusDuration * 60)
                    } else {
                      setElapsed(0)
                    }
                  }}
                >
                  <Text style={styles.resetText}>RESET</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* ====== 猫咪伙伴区域 ====== */}
        <View style={styles.catSection}>
          {/* 饱腹/开心 迷你进度条 */}
          <View style={styles.catBarsRow}>
            <View style={styles.catBarCol}>
              <Text style={styles.catBarLabel}>饱腹</Text>
              <View style={styles.catBarBg}>
                <View style={[styles.catBarFill, { width: `${hunger}%`, backgroundColor: hunger <= 30 ? '#EF5350' : '#FFB74D' }]} />
              </View>
            </View>
            <View style={styles.catBarCol}>
              <Text style={styles.catBarLabel}>开心</Text>
              <View style={styles.catBarBg}>
                <View style={[styles.catBarFill, { width: `${happiness}%` as any, backgroundColor: happiness <= 30 ? '#EF5350' : happiness >= 60 ? '#81C784' : '#FFB74D' }]} />
              </View>
            </View>
          </View>

          {/* 猫咪动画 + 饰品 */}
          <TouchableOpacity activeOpacity={0.7} onPress={petCat}>
            <FocusCat playing={petCount > 0 || (isRunning && !isBreak && focusMode !== 'notimer')} />
          </TouchableOpacity>
          <Text style={styles.catPetHint}>戳戳猫咪</Text>

          {/* 等级进度条 + 金币 */}
          <View style={styles.catLevelWrap}>
            <View style={styles.catLevelRow}>
              <Text style={styles.catLevelText}>Lv.{catLevel}</Text>
              <Text style={styles.catCoinsText}>🪙 {catCoins}</Text>
            </View>
            <View style={styles.catLevelBg}>
              <View style={[styles.catLevelFill, { width: `${levelProgress * 100}%` }]} />
            </View>
          </View>

          {/* 快捷入口：猫咪商城 */}
          <TouchableOpacity style={styles.catShopBtn} onPress={() => router.push('/cat')}>
            <Text style={styles.catShopBtnText}>🎒 猫咪商城</Text>
          </TouchableOpacity>
        </View>

        {/* ====== 暂停确认弹窗 ====== */}
        <ConfirmDialog
          visible={showPauseConfirm}
          title="⏸️ 暂停"
          message="小猫在等你回来"
          onCancel={() => setShowPauseConfirm(false)}
          onConfirm={() => {
            setShowPauseConfirm(false)
            if (focusMode === 'countup') {
              completeFocus(coinsEarned)
            }
            setIsRunning(false)
          }}
        />

        {/* ====== 退出确认弹窗 ====== */}
        <ConfirmDialog
          visible={showExitConfirm}
          title="⚠️ 退出"
          message="真的要退出吗？"
          onCancel={() => setShowExitConfirm(false)}
          onConfirm={() => {
            setShowExitConfirm(false)
            goBack()
          }}
        />

        {/* ====== 专注完成反馈 ====== */}
        {showCompletion && (
          <FocusCompletionCard
            coins={earnedCoins}
            card={summaryCard}
            onClose={() => { setShowCompletion(false); setSummaryCard(null) }}
          />
        )}
      </ImageBackground>
    </SafeAreaView>
  )
}

// ============ Focus Cat (shared equipped accessory) ============

function FocusCat({ playing }: { playing: boolean }) {
  const equippedAcc = useCatStore((s) => s.equippedAcc)
  const CAT_W = Math.round(sw * 0.95)
  const CAT_H = Math.round(CAT_W * 580 / 480)
  const BOW_H = Math.round(CAT_W * 1220 / 960)

  return (
    <View style={{ width: CAT_W, height: CAT_H, position: 'relative', left: 5, marginTop: -scale(30) }}>
      <AnimatedSprite playing={playing} width={CAT_W} height={CAT_H} fps={5} />
      {equippedAcc && ACCESSORY_IMAGES[equippedAcc] && (
        <ImageBackground
          source={ACCESSORY_IMAGES[equippedAcc]}
          style={{
            position: 'absolute', top: 0, left: 0,
            width: CAT_W, height: BOW_H,
          }}
          resizeMode="contain"
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  // ====== 配置界面 ======
  setupContainer: { flex: 1, backgroundColor: '#FFF8F0' },

  navBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: scale(18), paddingVertical: scale(12),
    borderBottomWidth: 2, borderBottomColor: '#F0E0D0',
  },
  navTodoBtn: {
    paddingHorizontal: scale(14), paddingVertical: scale(6),
    borderWidth: 2, borderColor: '#E0D0C0', borderRadius: scale(6),
  },
  navTodoText: { fontSize: scale(13), color: '#8D6E63', fontWeight: '600' },
  navTitle: { fontSize: scale(16), fontWeight: '700', color: '#5D4037' },
  navAddBtn: {
    width: scale(34), height: scale(34), borderRadius: scale(17),
    backgroundColor: '#F4A460', alignItems: 'center', justifyContent: 'center',
  },
  navAddText: { fontSize: scale(22), color: '#FFFFFF', lineHeight: scale(24) },

  todoScroll: { flex: 1 },
  todoContent: { padding: scale(16), gap: scale(10), paddingBottom: scale(80) },
  // Focus session cards
  sessionCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', padding: scale(14),
    borderWidth: 1, borderColor: '#E0D0C0', borderRadius: scale(10),
    marginBottom: scale(4),
  },
  sessionLeft: { flex: 1, gap: scale(4) },
  sessionName: { fontSize: scale(14), fontWeight: '600', color: '#4E342E' },
  sessionDuration: { fontSize: scale(12), color: '#8D6E63' },
  sessionStartBtn: {
    backgroundColor: '#F4A460', paddingHorizontal: scale(16), paddingVertical: scale(8),
    borderRadius: scale(16),
  },
  sessionStartText: { fontSize: scale(12), color: '#FFFFFF', fontWeight: '600' },
  // Todo cards
  todoCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', padding: scale(12),
    borderWidth: 1, borderColor: '#E0D0C0', borderRadius: scale(8),
    gap: scale(10),
  },
  todoCardDone: { backgroundColor: '#F5F0EB', borderColor: '#E8D5C4' },
  todoCheck: {
    width: scale(22), height: scale(22), borderRadius: scale(4),
    borderWidth: 2, borderColor: '#D7CCC8',
    alignItems: 'center', justifyContent: 'center',
  },
  todoCheckDone: { backgroundColor: '#81C784', borderColor: '#66BB6A' },
  todoCheckmark: { fontSize: scale(14), color: '#FFFFFF', fontWeight: '700' },
  todoInput: { flex: 1, fontSize: scale(13), color: '#4E342E', padding: 0 },
  todoInputDone: { color: '#A1887F', textDecorationLine: 'line-through' },
  todoAddBtn: {
    width: '100%', alignItems: 'center', paddingVertical: scale(12),
    backgroundColor: '#FFF8F0', borderWidth: 2, borderColor: '#E0D0C0',
    borderTopWidth: 0, borderBottomLeftRadius: scale(8), borderBottomRightRadius: scale(8),
    marginTop: -scale(10),
  },
  todoAddBtnText: { fontSize: scale(13), color: '#C0A090' },
  todoAiTag: {
    fontSize: scale(9),
    fontFamily: 'Pixel',
    color: '#F4A460',
    borderWidth: 1,
    borderColor: '#F4A460',
    paddingHorizontal: scale(4),
    paddingVertical: scale(1),
    marginRight: scale(6),
  },
  breakdownBtn: {
    marginTop: scale(10),
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#F4A460',
    borderTopWidth: 2,
    borderBottomLeftRadius: scale(8),
    borderBottomRightRadius: scale(8),
  },
  breakdownBtnText: { fontSize: scale(13), fontFamily: 'PixelSCBold', color: '#F4A460' },
  emptyText: { textAlign: 'center', color: '#C0A090', fontSize: scale(13), marginTop: scale(40) },

  // ====== 弹窗 ======
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: scale(28) },
  modalCard: {
    backgroundColor: '#FFFFFF', borderRadius: scale(12), borderWidth: 2, borderColor: '#E0D0C0',
    padding: scale(20), width: '100%', gap: scale(14),
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalClose: { fontSize: scale(20), color: '#C0A090' },
  modalTitle: { fontSize: scale(16), fontWeight: '700', color: '#5D4037' },
  modalConfirm: { fontSize: scale(22), color: '#F4A460', fontWeight: '700' },
  modalInput: {
    borderWidth: 2, borderColor: '#E0D0C0', borderRadius: scale(8),
    paddingHorizontal: scale(14), paddingVertical: scale(10),
    fontSize: scale(14), color: '#4E342E', backgroundColor: '#FFF8F0',
  },
  modalLabel: { fontSize: scale(13), color: '#8D6E63', fontWeight: '600' },
  modeRow: { flexDirection: 'row', gap: scale(8) },
  modeBtn: {
    flex: 1, alignItems: 'center', paddingVertical: scale(10),
    borderWidth: 2, borderColor: '#E0D0C0', borderRadius: scale(8),
  },
  modeBtnActive: { backgroundColor: '#F4A460', borderColor: '#C07840' },
  modeText: { fontSize: scale(12), color: '#8D6E63' },
  modeTextActive: { color: '#FFFFFF', fontWeight: '600' },

  // ====== 专注界面 ======
  container: { flex: 1, backgroundColor: '#FFF8F0' },
  bgImage: { flex: 1, width: '100%' },

  backBtn: {
    position: 'absolute', top: scale(16), left: scale(16),
    paddingHorizontal: scale(12), paddingVertical: scale(6),
    backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: scale(8),
    borderWidth: 1, borderColor: '#E0D0C0', zIndex: 10,
  },
  backText: { fontSize: scale(12), color: '#8D6E63' },

  timerSection: {
    alignItems: 'center', justifyContent: 'flex-start',
    paddingTop: scale(60), paddingHorizontal: scale(24), width: '100%',
  },
  taskLabel: { fontSize: scale(14), color: '#FFF8F0', marginBottom: scale(4), opacity: 0.8 },
  title: { fontSize: scale(18), fontFamily: 'Pixel', color: '#FFF8F0', marginBottom: scale(16) },
  durationRow: { flexDirection: 'row', gap: scale(8), marginBottom: scale(12) },
  durationChip: {
    paddingHorizontal: scale(14), paddingVertical: scale(6),
    borderWidth: 2, borderColor: '#E0D0C0', backgroundColor: '#FFFFFF',
  },
  durationChipActive: { backgroundColor: '#F4A460', borderColor: '#C07840' },
  durationText: { fontSize: scale(12), fontFamily: 'Pixel', color: '#A08060' },
  durationTextActive: { fontSize: scale(12), fontFamily: 'Pixel', color: '#FFF8F0' },
  timerText: { fontSize: scale(48), fontFamily: 'Pixel', color: '#FFF8F0', marginTop: scale(12), marginBottom: scale(12) },
  coinRow: { flexDirection: 'row', alignItems: 'center', gap: scale(8), marginBottom: scale(16), width: '75%' },
  coinIcon: { fontSize: scale(18) },
  coinBar: { flex: 1, height: scale(8), backgroundColor: '#F0E0D0', borderWidth: 1, borderColor: '#D7CCC8' },
  coinFill: { height: '100%', backgroundColor: '#FFB74D' },
  coinValue: { fontSize: scale(13), fontFamily: 'Pixel', color: '#F4A460', minWidth: scale(32), textAlign: 'right' },

  controls: { flexDirection: 'row', gap: scale(12) },
  button: {
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: scale(20), paddingVertical: scale(12), borderWidth: 2,
    minWidth: scale(100),
  },
  startButton: { backgroundColor: '#F4A460', borderColor: '#C07840' },
  pauseButton: { backgroundColor: '#FF8A65', borderColor: '#D06848' },
  buttonText: { color: '#FFFFFF', fontSize: scale(15), fontFamily: 'Pixel' },
  resetButton: {
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: scale(20), paddingVertical: scale(12),
    borderWidth: 2, borderColor: '#B08060',
    backgroundColor: '#FFFFFF', minWidth: scale(100),
  },
  resetText: { color: '#8D6E63', fontSize: scale(14), fontFamily: 'Pixel' },

  // ====== 猫咪伙伴 ======
  catSection: {
    flex: 1, alignItems: 'center', justifyContent: 'flex-start',
    width: '100%', paddingTop: scale(0),
  },
  catBarsRow: {
    flexDirection: 'row', gap: scale(12),
    paddingHorizontal: scale(24), width: '100%',
  },
  catBarCol: { flex: 1, gap: scale(2) },
  catBarLabel: { fontSize: scale(12), fontWeight: '700', color: '#1A1A1A' },
  catBarBg: {
    height: scale(6), backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: scale(3), overflow: 'hidden',
  },
  catBarFill: { height: '100%', borderRadius: scale(2) },
  catPetHint: { fontSize: scale(10), color: 'rgba(255,255,255,0.6)', marginTop: -scale(4) },
  catLevelWrap: {
    width: '80%', alignItems: 'center',
    paddingTop: scale(8),
  },
  catLevelRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    width: '100%', marginBottom: scale(2),
  },
  catLevelText: { fontSize: scale(11), fontFamily: 'Pixel', color: '#FFFFFF', fontWeight: '700' },
  catCoinsText: { fontSize: scale(11), fontFamily: 'Pixel', color: '#FFD54F' },
  catLevelBg: {
    width: '100%', height: scale(8),
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: scale(4), overflow: 'hidden',
  },
  catLevelFill: { height: '100%', backgroundColor: '#66BB6A', borderRadius: scale(3) },
  catShopBtn: {
    marginTop: scale(10), paddingHorizontal: scale(18), paddingVertical: scale(7),
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: scale(14),
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
  },
  catShopBtnText: { fontSize: scale(11), color: '#FFFFFF', fontFamily: 'Pixel' },
})
