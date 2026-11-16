/**
 * 天气：温度/天气码来自 Open-Meteo（免费、不用 key）。
 *
 * 城市名不在这里拿 —— 试过 BigDataCloud 和 Nominatim，这台机器上都连不上
 * （超时 / TLS 断开），只有 Open-Meteo 通。所以城市名改用系统自带的地理编码
 * （expo-location 的 reverseGeocodeAsync，走手机上的 Geocoder），见 weatherStore。
 */

/** 对应 assets/weather/ 下那套图标。 */
export type WeatherType =
  | 'sun'
  | 'cloudy'
  | 'overcast'
  | 'smallRain'
  | 'bigRain'
  | 'rainAndSnoe'
  | 'snow'
  | 'thunder'
  | 'fog'
  | 'wind'

export interface WeatherSnapshot {
  temp: number
  /** 天气文案，比如「阴」，拿不到城市名时用它当副标题 */
  label: string
  location: string
  type: WeatherType
}

/** WMO weather code → 图标 + 中文文案。https://open-meteo.com/en/docs */
export function weatherTypeFromCode(code: number): WeatherType {
  if (code === 0) return 'sun'
  if (code === 1 || code === 2) return 'cloudy'
  if (code === 3) return 'overcast'
  if (code === 45 || code === 48) return 'fog'
  if (code >= 51 && code <= 57) return 'smallRain'
  if (code >= 61 && code <= 65) return code >= 63 ? 'bigRain' : 'smallRain'
  if (code === 66 || code === 67) return 'rainAndSnoe'
  if (code >= 71 && code <= 77) return 'snow'
  if (code >= 80 && code <= 82) return code === 80 ? 'smallRain' : 'bigRain'
  if (code === 85 || code === 86) return 'snow'
  if (code >= 95) return 'thunder'
  return 'cloudy'
}

export function weatherLabelFromCode(code: number): string {
  if (code === 0) return '晴'
  if (code === 1) return '晴间多云'
  if (code === 2) return '多云'
  if (code === 3) return '阴'
  if (code === 45 || code === 48) return '雾'
  if (code >= 51 && code <= 57) return '毛毛雨'
  if (code >= 61 && code <= 65) return code >= 63 ? '大雨' : '小雨'
  if (code === 66 || code === 67) return '冻雨'
  if (code >= 71 && code <= 77) return '雪'
  if (code >= 80 && code <= 82) return code === 80 ? '阵雨' : '强阵雨'
  if (code === 85 || code === 86) return '阵雪'
  if (code >= 95) return '雷阵雨'
  return '多云'
}

/**
 * 取当前天气。没有城市名 —— 城市由调用方用系统地理编码补上。
 * 失败就抛异常，让调用方显示"天气获取失败"，不要瞎猜。
 */
export async function fetchWeather(
  latitude: number,
  longitude: number,
  timeoutMs = 8000,
): Promise<{ temp: number; label: string; type: WeatherType }> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(
      'https://api.open-meteo.com/v1/forecast' +
        `?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`,
      { signal: controller.signal },
    )
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    const current = data?.current
    if (!current || typeof current.temperature_2m !== 'number') {
      throw new Error('天气数据不完整')
    }
    const code = Number(current.weather_code ?? 0)
    return {
      temp: Math.round(current.temperature_2m),
      label: weatherLabelFromCode(code),
      type: weatherTypeFromCode(code),
    }
  } finally {
    clearTimeout(timer)
  }
}