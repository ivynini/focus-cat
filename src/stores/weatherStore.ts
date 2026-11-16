import { create } from 'zustand'
import * as Location from 'expo-location'
import { fetchWeather, WeatherSnapshot } from '../lib/weather'

/**
 * 首页那行天气。
 *
 * 状态说明：
 * - idle：还没要过权限（首页默认状态就是它）
 * - loading：正在定位/取天气
 * - ready：拿到了
 * - denied：用户拒绝了定位权限
 * - error：定位或天气接口失败，message 里说清是哪一步
 *
 * 失败一律不抛异常，页面显示「--°」+ 一句人话，绝不编造天气。
 * 城市名走系统 Geocoder（不用 key）；拿不到就退化成天气文案（「阴」）。
 */
export type WeatherStatus = 'idle' | 'loading' | 'ready' | 'denied' | 'error'

interface WeatherState {
  status: WeatherStatus
  snapshot: WeatherSnapshot | null
  /** 失败时的短文案，直接显示给用户 */
  message: string
  refresh: () => Promise<void>
}

/** 模拟器有时一直不给定位结果，别让它无期限挂着。 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('定位超时')), ms)),
  ])
}

async function currentPosition(): Promise<Location.LocationObject> {
  // 先要一次缓存位置（模拟器/刚开 GPS 时快得多），拿不到再要实时定位
  const cached = await Location.getLastKnownPositionAsync()
  if (cached) return cached
  return withTimeout(Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }), 10000)
}

/** 「浙江省·杭州市」→「浙江·杭州」；拿不到就返回空串。 */
function formatPlace(place?: Location.LocationGeocodedAddress): string {
  if (!place) return ''
  const region = (place.region || '').replace(/[省市]$/, '')
  const city = (place.city || place.subregion || '').replace(/[省市]$/, '')
  if (region && city && region !== city) return `${region}·${city}`
  return city || region || ''
}

async function reverseGeocode(latitude: number, longitude: number): Promise<string> {
  try {
    const places = await withTimeout(Location.reverseGeocodeAsync({ latitude, longitude }), 6000)
    return formatPlace(places?.[0])
  } catch {
    return ''
  }
}

export const useWeatherStore = create<WeatherState>((set) => ({
  status: 'idle',
  snapshot: null,
  message: '',

  refresh: async () => {
    set({ status: 'loading', message: '' })

    let permission
    try {
      permission = await Location.requestForegroundPermissionsAsync()
    } catch {
      set({ status: 'error', message: '定位服务不可用' })
      return
    }
    if (!permission.granted) {
      set({ status: 'denied', message: '未开启定位' })
      return
    }

    let position: Location.LocationObject
    try {
      position = await currentPosition()
    } catch {
      set({ status: 'error', message: '定位失败，点一下重试' })
      return
    }

    const { latitude, longitude } = position.coords
    const [weather, location] = await Promise.all([
      fetchWeather(latitude, longitude).catch(() => null),
      reverseGeocode(latitude, longitude),
    ])
    if (!weather) {
      set({ status: 'error', message: '天气获取失败，点一下重试' })
      return
    }
    set({
      status: 'ready',
      snapshot: { ...weather, location: location || weather.label },
      message: '',
    })
  },
}))