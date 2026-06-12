import { useState, useMemo } from 'react'
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Modal } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { scale, sw } from '../src/lib/scale'

const now = new Date()
const CUR_YEAR = now.getFullYear()
const CUR_MONTH = now.getMonth() + 1

// Mock focus data: minutes per day for each month of current year
const MOCK_YEARLY: Record<number, number[]> = {}
for (let m = 1; m <= 12; m++) {
  const days = new Date(CUR_YEAR, m, 0).getDate()
  MOCK_YEARLY[m] = Array.from({ length: days }, () => Math.random() < 0.3 ? 0 : Math.round(Math.random() * 200 + 10))
}

const MONTH_NAMES = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']
const WEEKDAYS = ['日','一','二','三','四','五','六']

export default function StatsScreen() {
  const router = useRouter()
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month')
  const [year, setYear] = useState(CUR_YEAR)
  const [month, setMonth] = useState(CUR_MONTH)
  const [showCalendar, setShowCalendar] = useState(false)
  const [calYear, setCalYear] = useState(CUR_YEAR)
  const [calMonth, setCalMonth] = useState(CUR_MONTH)

  const daysInMonth = new Date(year, month, 0).getDate()
  const data = viewMode === 'month'
    ? (MOCK_YEARLY[month] || [])
    : Array.from({ length: 12 }, (_, i) => {
        const m = i + 1
        return (MOCK_YEARLY[m] || []).reduce((a, b) => a + b, 0)
      })

  const maxVal = Math.max(...data, 1)
  const totalMinutes = data.reduce((a, b) => a + b, 0)
  const focusDays = data.filter((v) => v > 0).length
  const avgMinutes = focusDays > 0 ? Math.round(totalMinutes / focusDays) : 0

  const formatHours = (min: number) => {
    if (min < 60) return `${min}m`
    const h = Math.floor(min / 60)
    const m = min % 60
    return m > 0 ? `${h}h${m}m` : `${h}h`
  }

  const goPrev = () => {
    if (viewMode === 'month') {
      if (month === 1) { setMonth(12); setYear(year - 1) }
      else setMonth(month - 1)
    } else {
      setYear(year - 1)
    }
  }

  const goNext = () => {
    if (viewMode === 'month') {
      if (month === 12) { setMonth(1); setYear(year + 1) }
      else setMonth(month + 1)
    } else {
      setYear(year + 1)
    }
  }

  const selectCalendarDay = (day: number) => {
    setYear(calYear)
    setMonth(calMonth)
    setViewMode('month')
    setShowCalendar(false)
  }

  const toggleViewMode = () => {
    if (viewMode === 'month') {
      setYear(calYear)
      setViewMode('year')
    } else {
      setViewMode('month')
    }
    setShowCalendar(false)
  }

  const calPrevMonth = () => {
    if (calMonth === 1) { setCalMonth(12); setCalYear(calYear - 1) }
    else setCalMonth(calMonth - 1)
  }
  const calNextMonth = () => {
    if (calMonth === 12) { setCalMonth(1); setCalYear(calYear + 1) }
    else setCalMonth(calMonth + 1)
  }

  const calDays = new Date(calYear, calMonth, 0).getDate()
  const calFirstDay = new Date(calYear, calMonth - 1, 1).getDay()
  const calIsToday = (d: number) => calYear === CUR_YEAR && calMonth === CUR_MONTH && d === now.getDate()

  // Y-axis ticks
  const yTicks = 4
  const tickStep = Math.ceil(maxVal / yTicks / 10) * 10

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>专注统计</Text>
        <TouchableOpacity onPress={() => setShowCalendar(true)}>
          <Text style={styles.calBtn}>📅</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {/* Summary cards */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{formatHours(totalMinutes)}</Text>
            <Text style={styles.summaryLabel}>总专注</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{focusDays}</Text>
            <Text style={styles.summaryLabel}>专注天数</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>{formatHours(avgMinutes)}</Text>
            <Text style={styles.summaryLabel}>日均</Text>
          </View>
        </View>

        {/* Month/Year nav */}
        <View style={styles.navRow}>
          <TouchableOpacity onPress={goPrev}>
            <Text style={styles.navArrow}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.navTitle}>
            {viewMode === 'month' ? `${year}年${month}月` : `${year}年`}
          </Text>
          <TouchableOpacity onPress={goNext}>
            <Text style={styles.navArrow}>{'>'}</Text>
          </TouchableOpacity>
        </View>

        {/* Bar chart */}
        <View style={styles.chartWrap}>
          {/* Y axis */}
          <View style={styles.yAxis}>
            {Array.from({ length: yTicks + 1 }, (_, i) => (
              <Text key={i} style={styles.yLabel}>{i * tickStep}m</Text>
            ))}
          </View>

          {/* Bars */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.barsScroll}>
            <View style={styles.barsContainer}>
              {data.map((val, i) => {
                const barH = maxVal > 0 ? (val / maxVal) * scale(180) : 0
                return (
                  <View key={i} style={styles.barCol}>
                    <View style={[styles.bar, { height: Math.max(barH, val > 0 ? 4 : 0) }]} />
                    <Text style={styles.barLabel}>
                      {viewMode === 'month' ? (i + 1) : MONTH_NAMES[i]}
                    </Text>
                  </View>
                )
              })}
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      {/* Calendar Modal */}
      <Modal visible={showCalendar} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.calModal}>
            <View style={styles.calHeader}>
              <TouchableOpacity onPress={toggleViewMode}>
                <Text style={styles.yearViewBtn}>{viewMode === 'month' ? '查看年度' : '查看月度'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowCalendar(false)}>
                <Text style={styles.calClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.calNav}>
              <TouchableOpacity onPress={calPrevMonth}>
                <Text style={styles.navArrow}>{'<'}</Text>
              </TouchableOpacity>
              <Text style={styles.calTitle}>{calYear}年{calMonth}月</Text>
              <TouchableOpacity onPress={calNextMonth}>
                <Text style={styles.navArrow}>{'>'}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.calWeekRow}>
              {WEEKDAYS.map((w) => (
                <Text key={w} style={styles.calWeekDay}>{w}</Text>
              ))}
            </View>
            {Array.from({ length: 6 }, (_, row) => (
              <View key={row} style={styles.calRow}>
                {Array.from({ length: 7 }, (_, col) => {
                  const d = row * 7 + col - calFirstDay + 1
                  const valid = d >= 1 && d <= calDays
                  if (!valid) return <View key={col} style={styles.calDay} />
                  const isToday = calIsToday(d)
                  return (
                    <TouchableOpacity key={col} style={styles.calDay} onPress={() => selectCalendarDay(d)}>
                      <Text style={[styles.calDayText, isToday && styles.calDayToday]}>
                        {d}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const BAR_W = scale(22)
const BAR_GAP = scale(6)

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F0' },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: scale(16), paddingVertical: scale(12),
    borderBottomWidth: 1, borderBottomColor: '#E8D5C4',
    backgroundColor: '#FFFFFF',
  },
  backBtn: { fontSize: scale(14), color: '#F4A460', fontWeight: '600' },
  headerTitle: { fontSize: scale(16), fontWeight: '700', color: '#5D4037' },
  calBtn: { fontSize: scale(22) },

  body: { padding: scale(16), paddingBottom: scale(40) },

  // Summary
  summaryRow: { flexDirection: 'row', gap: scale(10), marginBottom: scale(20) },
  summaryCard: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: scale(12), padding: scale(14),
    borderWidth: 1, borderColor: '#E8D5C4', alignItems: 'center',
  },
  summaryValue: { fontSize: scale(18), fontWeight: '700', color: '#F4A460' },
  summaryLabel: { fontSize: scale(11), color: '#8D6E63', marginTop: scale(4) },

  // Nav
  navRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: scale(20), marginBottom: scale(16) },
  navArrow: { fontSize: scale(18), color: '#F4A460', fontWeight: '700', padding: scale(4) },
  navTitle: { fontSize: scale(15), fontWeight: '700', color: '#5D4037' },

  // Chart
  chartWrap: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: scale(12), padding: scale(12), borderWidth: 1, borderColor: '#E8D5C4' },
  yAxis: { width: scale(36), justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: scale(20), paddingRight: scale(4) },
  yLabel: { fontSize: scale(9), color: '#A1887F' },
  barsScroll: { flex: 1 },
  barsContainer: { flexDirection: 'row', alignItems: 'flex-end', gap: BAR_GAP, paddingBottom: scale(20), paddingLeft: scale(4) },
  barCol: { alignItems: 'center', width: BAR_W },
  bar: { width: BAR_W - scale(4), backgroundColor: '#F4A460', borderRadius: scale(3), minHeight: 4 },
  barLabel: { fontSize: scale(8), color: '#A1887F', marginTop: scale(4) },

  // Calendar modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center', padding: scale(24) },
  calModal: {
    backgroundColor: '#FFFFFF', borderRadius: scale(14), padding: scale(16),
    width: '100%', borderWidth: 1, borderColor: '#E8D5C4',
  },
  calHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: scale(12) },
  yearViewBtn: { fontSize: scale(13), color: '#F4A460', fontWeight: '600' },
  calClose: { fontSize: scale(18), color: '#8D6E63' },
  calNav: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: scale(16), marginBottom: scale(12) },
  calTitle: { fontSize: scale(15), fontWeight: '700', color: '#5D4037' },
  calWeekRow: { flexDirection: 'row', marginBottom: scale(4) },
  calWeekDay: { flex: 1, textAlign: 'center', fontSize: scale(11), color: '#A1887F', fontWeight: '600' },
  calRow: { flexDirection: 'row' },
  calDay: { flex: 1, aspectRatio: 1.2, alignItems: 'center', justifyContent: 'center' },
  calDayText: { fontSize: scale(12), color: '#4E342E' },
  calDayToday: { color: '#F4A460', fontWeight: '700' },
})
