import { useState, useCallback } from 'react'
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter, useFocusEffect } from 'expo-router'
import Svg, { Circle } from 'react-native-svg'
import { PixelIcon } from '../../src/components/PixelIcon'
import { StudyInsightCard } from '../../src/components/StudyInsightCard'
import { useAudio } from '../../src/hooks/useAudio'
import { scale, vscale, sh } from '../../src/lib/scale'
import { article } from '../../src/data/articles'
import { useAuth } from '../../src/stores/authStore'
import { useCatStore } from '../../src/stores/catStore'
import { api } from '../../src/lib/api'

const dailyQuote = {
  text: '真正的自由不是随心所欲，而是自我掌控。',
  author: '— 亚里士多德',
}

const dailySong = {
  name: 'Merry Christmas Mr. Lawrence',
  artist: '坂本龙一',
}


const weather = { temp: 24, location: '浙江·杭州', type: 'sun' }

const WEATHER_ICONS: Record<string, any> = {
  sun: require('../../assets/weather/sun.png'),
  cloudy: require('../../assets/weather/cloudy.png'),
  smallRain: require('../../assets/weather/smallRain.png'),
  bigRain: require('../../assets/weather/bigRain.png'),
  snow: require('../../assets/weather/snow.png'),
  rainAndSnoe: require('../../assets/weather/rainAndSnoe.png'),
  thunder: require('../../assets/weather/thunder.png'),
  wind: require('../../assets/weather/wind.png'),
  fog: require('../../assets/weather/fog.png'),
  overcast: require('../../assets/weather/overcast.png'),
}
const mockEvent = { name: '期末考试', date: '2026-06-15' }

function daysUntil(dateStr: string) {
  const now = new Date()
  const target = new Date(dateStr)
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export default function HomeScreen() {
  const router = useRouter()
  const { isPlaying, togglePlay } = useAudio()
  const isLoggedIn = useAuth((s) => s.isLoggedIn)
  const todayMinutes = useCatStore((s) => s.todayMinutes)
  const [eventName, setEventName] = useState(mockEvent.name)
  const [eventDate, setEventDate] = useState(mockEvent.date)
  const [showModal, setShowModal] = useState(false)
  const [tempName, setTempName] = useState('')
  const [tempDate, setTempDate] = useState<Date>(new Date())
  const [calYear, setCalYear] = useState(new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(new Date().getMonth() + 1)
  const [dailyGoal, setDailyGoal] = useState(120)
  const [showFocusModal, setShowFocusModal] = useState(false)
  const [tempGoal, setTempGoal] = useState('')

  const focusPercent = Math.min(todayMinutes / dailyGoal, 1)
  // 红→橙→绿 插值
  const ringColor =
    focusPercent <= 0.5
      ? `rgb(${Math.round(239 + (255 - 239) * focusPercent * 2)}, ${Math.round(83 + (183 - 83) * focusPercent * 2)}, ${Math.round(80 + (77 - 80) * focusPercent * 2)})`
      : `rgb(${Math.round(255 + (102 - 255) * (focusPercent - 0.5) * 2)}, ${Math.round(183 + (187 - 183) * (focusPercent - 0.5) * 2)}, ${Math.round(77 + (106 - 77) * (focusPercent - 0.5) * 2)})`

  // 环形几何：SVG 的 dasharray 能精确闭合，不会像两个半圆那样在接缝处裂开
  const ringSize = scale(116)
  const ringStroke = scale(8)
  const ringRadius = (ringSize - ringStroke) / 2
  const ringCircumference = 2 * Math.PI * ringRadius

  const fetchTodayMinutes = useCallback(() => {
    if (!isLoggedIn) return
    api.getFocusSessions().then((data: any[]) => {
      if (!Array.isArray(data)) return
      const today = new Date().toISOString().split('T')[0]
      let total = 0
      data.forEach((s: any) => {
        const created = s.created_at ? s.created_at.split('T')[0] : null
        if (created === today && s.mode !== 'notimer') {
          total += s.duration || 0
        }
      })
      useCatStore.getState().setTodayMinutes(total)
    }).catch(() => {})
  }, [isLoggedIn])

  useFocusEffect(fetchTodayMinutes)

  const remaining = daysUntil(eventDate)

  const formatDate = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  const openEditor = () => {
    setTempName(eventName)
    const d = new Date(eventDate)
    setTempDate(d)
    setCalYear(d.getFullYear())
    setCalMonth(d.getMonth() + 1)
    setShowModal(true)
  }

  const saveEvent = () => {
    if (tempName.trim()) setEventName(tempName.trim())
    setEventDate(formatDate(tempDate))
    setShowModal(false)
  }

  const daysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate()
  const firstDayOfMonth = (y: number, m: number) => new Date(y, m - 1, 1).getDay()

  const selectDay = (day: number) => {
    setTempDate(new Date(calYear, calMonth - 1, day))
  }

  const prevMonth = () => {
    if (calMonth === 1) { setCalYear(calYear - 1); setCalMonth(12) }
    else setCalMonth(calMonth - 1)
  }
  const nextMonth = () => {
    if (calMonth === 12) { setCalYear(calYear + 1); setCalMonth(1) }
    else setCalMonth(calMonth + 1)
  }

  const isSelected = (day: number) =>
    tempDate.getFullYear() === calYear &&
    tempDate.getMonth() + 1 === calMonth &&
    tempDate.getDate() === day

  const MONTHS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ====== Weather — two rows ====== */}
        <View style={styles.weatherBar}>
          <View style={styles.weatherRow}>
            <Image source={WEATHER_ICONS[weather.type] || WEATHER_ICONS.sun} style={styles.weatherIcon} />
            <Text style={styles.weatherTemp}>{weather.temp}°</Text>
          </View>
          <Text style={styles.weatherLoc}>{weather.location}</Text>
        </View>

        {/* ====== 今日专注环 ====== */}
        <TouchableOpacity
          style={styles.focusRingWrap}
          activeOpacity={0.8}
          onPress={() => { setTempGoal(String(dailyGoal)); setShowFocusModal(true) }}
        >
          <View style={[styles.focusRing, { width: ringSize, height: ringSize }]}>
            <Svg width={ringSize} height={ringSize} style={StyleSheet.absoluteFill}>
              {/* 轨道底色 */}
              <Circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={ringRadius}
                stroke="rgba(255,255,255,0.45)"
                strokeWidth={ringStroke}
                fill="none"
              />
              {/* 进度：从 12 点方向顺时针画，缺口只剩末端的未完成部分 */}
              <Circle
                cx={ringSize / 2}
                cy={ringSize / 2}
                r={ringRadius}
                stroke={ringColor}
                strokeWidth={ringStroke}
                fill="none"
                strokeDasharray={`${ringCircumference} ${ringCircumference}`}
                strokeDashoffset={ringCircumference * (1 - focusPercent)}
                strokeLinecap="round"
                transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
              />
            </Svg>
            {/* 中心文字 */}
            <View style={styles.ringCenter}>
              <Text style={[styles.ringMinutes, { color: ringColor }]}>{todayMinutes}</Text>
              <Text style={styles.ringGoal}>/ {dailyGoal}</Text>
              <Text style={styles.ringLabel}>今日专注</Text>
            </View>
          </View>
          {focusPercent >= 1 && <Text style={styles.ringDone}>✓ 达成目标</Text>}
        </TouchableOpacity>

        {/* ====== 专注目标弹窗 ====== */}
        <Modal visible={showFocusModal} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.goalCard}>
              <Text style={styles.goalTitle}>今日专注目标</Text>
              <Text style={styles.goalHint}>已专注 {todayMinutes} 分钟</Text>
              <TextInput
                style={styles.goalInput}
                value={tempGoal}
                onChangeText={setTempGoal}
                keyboardType="number-pad"
                placeholder="输入目标分钟数"
                placeholderTextColor="#C0A090"
              />
              <View style={styles.goalBtns}>
                <TouchableOpacity
                  style={styles.goalBtnCancel}
                  onPress={() => setShowFocusModal(false)}
                >
                  <Text style={styles.goalBtnCancelText}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.goalBtnSave}
                  onPress={() => {
                    const g = parseInt(tempGoal) || 120
                    setDailyGoal(Math.max(10, Math.min(g, 600)))
                    setShowFocusModal(false)
                  }}
                >
                  <Text style={styles.goalBtnSaveText}>保存目标</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.goalStartBtn}
                onPress={() => { setShowFocusModal(false); router.push('/focus') }}
              >
                <Text style={styles.goalStartText}>开始专注 →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* ====== AI 复盘卡片 ====== */}
        <StudyInsightCard enabled={isLoggedIn} />

        {/* ====== Countdown ====== */}
        <TouchableOpacity style={styles.countdownBox} onPress={openEditor} activeOpacity={0.85}>
          <Text style={styles.countdownLabel}>距离</Text>
          <Text style={styles.countdownName} numberOfLines={1}>{eventName}</Text>
          <Text style={styles.countdownLabel}>还有</Text>
          <Text style={styles.countdownDays}>{remaining >= 0 ? remaining : 0}</Text>
          <Text style={styles.countdownLabel}>天</Text>
          <Text style={styles.countdownHint}>点击设置日程</Text>
        </TouchableOpacity>

        {/* ====== Quote + Music ====== */}
        <View style={styles.midRow}>
          <View style={styles.quoteBox}>
            <Text style={styles.quoteIcon}>"</Text>
            <Text style={styles.quoteText} numberOfLines={5}>{dailyQuote.text}</Text>
            <Text style={styles.quoteAuthor}>{dailyQuote.author}</Text>
          </View>

          <View style={styles.musicBox}>
            <View style={styles.musicTop}>
              <Text style={styles.musicLabel}>DAILY{'\n'}FOCUS</Text>
              <TouchableOpacity style={styles.playButton} onPress={togglePlay}>
                <PixelIcon name={isPlaying ? 'pause' : 'play'} size={scale(14)} />
              </TouchableOpacity>
            </View>
            <View style={styles.musicBottom}>
              <Text style={styles.songName} numberOfLines={1}>{dailySong.name}</Text>
              <Text style={styles.songArtist} numberOfLines={1}>{dailySong.artist}</Text>
            </View>
          </View>
        </View>

        {/* ====== Daily Article ====== */}
        <TouchableOpacity
          style={styles.articleBox}
          activeOpacity={0.85}
          onPress={() => router.push('/article')}
        >
          <Image
            source={require('../../assets/photo1.jpg')}
            style={styles.articleImage}
            resizeMode="cover"
          />
          <View style={styles.articleOverlay}>
            <Text style={styles.articleLabel}>DAILY READ</Text>
            <Text style={styles.articleText} numberOfLines={3}>{article.firstSentence}</Text>
            <Text style={styles.articleAuthor}>— {article.author}</Text>
          </View>
        </TouchableOpacity>

      </ScrollView>

      {/* ====== Modal ====== */}
      <Modal visible={showModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>设置日程</Text>
            <Text style={styles.modalLabel}>日程名称</Text>
            <TextInput
              style={styles.modalInput}
              value={tempName}
              onChangeText={setTempName}
              placeholder="例如：期末考试"
              placeholderTextColor="#C0A090"
            />
            <Text style={styles.modalLabel}>日期: {formatDate(tempDate)}</Text>

            {/* Calendar */}
            <View style={styles.calBox}>
              <View style={styles.calHead}>
                <TouchableOpacity onPress={prevMonth}>
                  <Text style={styles.calArrow}>{'<'}</Text>
                </TouchableOpacity>
                <Text style={styles.calTitle}>{MONTHS[calMonth - 1]} {calYear}</Text>
                <TouchableOpacity onPress={nextMonth}>
                  <Text style={styles.calArrow}>{'>'}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.calWeekRow}>
                {['日','一','二','三','四','五','六'].map((w) => (
                  <Text key={w} style={styles.calWeekDay}>{w}</Text>
                ))}
              </View>
              {Array.from({ length: 6 }, (_, row) => (
                <View key={row} style={styles.calRow}>
                  {Array.from({ length: 7 }, (_, col) => {
                    const d = row * 7 + col - firstDayOfMonth(calYear, calMonth) + 1
                    const valid = d >= 1 && d <= daysInMonth(calYear, calMonth)
                    const selected = valid && isSelected(d)
                    const isPast = valid && new Date(calYear, calMonth - 1, d) < new Date(new Date().toDateString())
                    return (
                      <TouchableOpacity
                        key={col}
                        style={[styles.calDay, selected && styles.calDaySel]}
                        onPress={() => valid && !isPast && selectDay(d)}
                        disabled={!valid || isPast}
                      >
                        <Text style={[
                          styles.calDayText,
                          selected && styles.calDayTextSel,
                          isPast && styles.calDayPast,
                        ]}>
                          {valid ? d : ''}
                        </Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowModal(false)}>
                <Text style={styles.modalCancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={saveEvent}>
                <Text style={styles.modalSaveText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F0' },
  scrollContent: { padding: scale(16), paddingTop: scale(8), gap: scale(24), paddingBottom: scale(40) },

  // ====== 专注环 ======
  focusRingWrap: { alignItems: 'center', gap: scale(4) },
  focusRing: {
    alignItems: 'center', justifyContent: 'center',
  },
  ringCenter: {
    width: scale(86), height: scale(86),
    borderRadius: scale(43),
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center', justifyContent: 'center',
  },
  ringMinutes: { fontSize: scale(28), fontWeight: '800', color: '#F4A460', fontFamily: 'Pixel' },
  ringGoal: { fontSize: scale(9), color: '#A1887F', marginTop: -scale(2) },
  ringLabel: { fontSize: scale(9), color: '#C0A090', marginTop: scale(2) },
  ringDone: { fontSize: scale(11), fontFamily: 'Pixel', color: '#66BB6A' },

  // ====== 目标弹窗 ======
  goalCard: {
    backgroundColor: '#FFFFFF', borderRadius: scale(14), borderWidth: 2, borderColor: '#E0D0C0',
    padding: scale(24), width: '85%', alignItems: 'center', gap: scale(14),
  },
  goalTitle: { fontSize: scale(16), fontWeight: '700', color: '#5D4037' },
  goalHint: { fontSize: scale(12), color: '#8D6E63' },
  goalInput: {
    width: '100%', borderWidth: 2, borderColor: '#E0D0C0', borderRadius: scale(8),
    paddingHorizontal: scale(14), paddingVertical: scale(10),
    fontSize: scale(14), color: '#4E342E', backgroundColor: '#FFF8F0',
    textAlign: 'center',
  },
  goalBtns: { flexDirection: 'row', gap: scale(12), width: '100%' },
  goalBtnCancel: {
    flex: 1, alignItems: 'center', paddingVertical: scale(10),
    borderWidth: 2, borderColor: '#D7CCC8', borderRadius: scale(8),
  },
  goalBtnCancelText: { color: '#8D6E63', fontSize: scale(12), fontWeight: '600' },
  goalBtnSave: {
    flex: 1, alignItems: 'center', paddingVertical: scale(10),
    backgroundColor: '#F4A460', borderWidth: 2, borderColor: '#C07840', borderRadius: scale(8),
  },
  goalBtnSaveText: { color: '#FFFFFF', fontSize: scale(12), fontWeight: '600' },
  goalStartBtn: {
    width: '100%', alignItems: 'center', paddingVertical: scale(12),
    backgroundColor: '#66BB6A', borderRadius: scale(10),
    borderWidth: 2, borderColor: '#4CAF50',
  },
  goalStartText: { color: '#FFFFFF', fontSize: scale(14), fontWeight: '700', fontFamily: 'Pixel' },

  // Weather — column layout
  weatherBar: { paddingLeft: scale(4), gap: scale(2) },
  weatherRow: { flexDirection: 'row', alignItems: 'center', gap: scale(8) },
  weatherIcon: { width: scale(28), height: scale(28) },
  weatherTemp: { fontSize: scale(22), fontWeight: '600', color: '#4E342E' },
  weatherLoc: { fontSize: scale(14), color: '#8D6E63' },

  // Countdown
  countdownBox: {
    height: Math.round(sh * 0.27), backgroundColor: '#FFF3E4', borderRadius: 0,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#E8C49A',
    shadowColor: '#E8C49A', shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 0, elevation: 0,
  },
  countdownName: { fontSize: scale(20), fontWeight: '700', color: '#E67E22', marginVertical: scale(4) },
  countdownLabel: { fontSize: scale(14), color: '#B08060' },
  countdownDays: { fontSize: scale(64), fontWeight: '300', color: '#E67E22', lineHeight: scale(74) },
  countdownHint: { fontSize: scale(10), color: '#C0A080', marginTop: scale(8) },

  // Mid row
  midRow: { flexDirection: 'row', gap: scale(14), marginHorizontal: scale(4), height: scale(135) },

  // Quote
  quoteBox: {
    flex: 1, height: scale(135), backgroundColor: '#FFFFFF', borderRadius: 0,
    padding: scale(18), justifyContent: 'center',
    borderWidth: 2, borderColor: '#E0D0C0',
  },
  quoteIcon: { fontSize: scale(28), fontWeight: '700', color: '#F4A460', marginBottom: scale(8) },
  quoteText: { fontSize: scale(13), color: '#4E342E', lineHeight: scale(20), fontFamily: 'PixelSC' },
  quoteAuthor: { fontSize: scale(11), color: '#A08070', marginTop: scale(8), textAlign: 'right', fontFamily: 'PixelSC' },

  // Music
  musicBox: {
    width: scale(135), height: scale(135), backgroundColor: '#4A3424', borderRadius: 0,
    padding: scale(12), justifyContent: 'space-between',
    borderWidth: 2, borderColor: '#3A2414',
  },
  musicTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: scale(10) },
  musicLabel: { fontSize: scale(11), fontFamily: 'Pixel', color: '#D4A574', lineHeight: scale(15) },
  musicBottom: { gap: scale(2) },
  songName: { fontSize: scale(12), fontFamily: 'PixelSCBold', color: '#FFFFFF' },
  songArtist: { fontSize: scale(10), fontFamily: 'PixelSC', color: '#BBA89A', marginTop: scale(2) },
  playButton: {
    width: scale(34), height: scale(34), backgroundColor: '#D4A574',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#B89464',
  },

  // Article
  articleBox: {
    overflow: 'hidden', height: vscale(220), marginHorizontal: scale(4),
    borderRadius: 12,
  },
  articleImage: {
    width: '100%', height: '55%',
  },
  articleOverlay: {
    flex: 1, backgroundColor: '#FFFFFF',
    padding: scale(14), justifyContent: 'space-between',
  },
  articleLabel: { fontSize: scale(10), color: '#C0A080', fontFamily: 'Pixel', marginBottom: scale(6) },
  articleText: { fontSize: scale(12), color: '#4E342E', lineHeight: scale(18) },
  articleAuthor: { fontSize: scale(11), color: '#A08070', textAlign: 'right' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: scale(32) },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: 0, borderWidth: 3, borderColor: '#E0D0C0', padding: scale(24), width: '100%' },
  modalTitle: { fontSize: scale(18), fontFamily: 'PixelSCBold', color: '#5D4037', marginBottom: scale(20) },
  modalLabel: { fontSize: scale(13), fontFamily: 'PixelSC', color: '#8D6E63', marginBottom: scale(6), marginTop: scale(12) },
  modalInput: {
    backgroundColor: '#FFF8F0', borderWidth: 2, borderColor: '#E0D0C0',
    paddingHorizontal: scale(14), paddingVertical: scale(10),
    fontSize: scale(14), fontFamily: 'PixelSC', color: '#4E342E',
  },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: scale(12), marginTop: scale(24) },
  modalCancel: {
    paddingHorizontal: scale(20), paddingVertical: scale(10),
    borderWidth: 2, borderColor: '#D7CCC8',
  },
  modalCancelText: { color: '#8D6E63', fontSize: scale(13), fontFamily: 'PixelSC' },
  modalSave: { paddingHorizontal: scale(24), paddingVertical: scale(10), borderWidth: 2, borderColor: '#D49450', backgroundColor: '#F4A460' },
  modalSaveText: { color: '#FFFFFF', fontSize: scale(13), fontFamily: 'PixelSCBold' },

  // Calendar
  calBox: { backgroundColor: '#FFF8F0', borderWidth: 2, borderColor: '#E0D0C0', padding: scale(10), marginTop: scale(12) },
  calHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: scale(8) },
  calArrow: { fontSize: scale(18), color: '#F4A460', fontFamily: 'Pixel', padding: scale(4) },
  calTitle: { fontSize: scale(14), fontFamily: 'PixelSCBold', color: '#5D4037' },
  calWeekRow: { flexDirection: 'row', marginBottom: scale(4) },
  calWeekDay: { flex: 1, textAlign: 'center', fontSize: scale(11), fontFamily: 'PixelSC', color: '#A1887F' },
  calRow: { flexDirection: 'row' },
  calDay: { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  calDaySel: { backgroundColor: '#F4A460' },
  calDayText: { fontSize: scale(12), fontFamily: 'PixelSC', color: '#4E342E' },
  calDayTextSel: { color: '#FFFFFF' },
  calDayPast: { color: '#D7CCC8' },
})
