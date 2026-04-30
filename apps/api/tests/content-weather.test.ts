import { afterEach, describe, expect, test } from 'bun:test'
import { clearWeatherCacheForTests, getWeather } from '../src/services/content.service'

const originalFetch = globalThis.fetch
const originalNow = Date.now

function forecastResponse() {
  return {
    latitude: 19.75,
    longitude: 105.9,
    timezone: 'Asia/Ho_Chi_Minh',
    current: {
      time: '2026-04-30T10:15',
      temperature_2m: 29.4,
      relative_humidity_2m: 78,
      apparent_temperature: 34.1,
      is_day: 1,
      precipitation: 0.2,
      rain: 0.2,
      weather_code: 61,
      cloud_cover: 72,
      wind_speed_10m: 18.3,
      wind_direction_10m: 110,
      wind_gusts_10m: 32.5,
    },
    daily: {
      time: ['2026-04-30', '2026-05-01'],
      weather_code: [61, 3],
      temperature_2m_max: [31.2, 32.1],
      temperature_2m_min: [26.8, 27.2],
      precipitation_sum: [6.5, 0.5],
      precipitation_probability_max: [80, 20],
      wind_speed_10m_max: [24, 18],
      wind_gusts_10m_max: [40, 28],
      uv_index_max: [9.2, 8.1],
      sunrise: ['2026-04-30T05:25', '2026-05-01T05:25'],
      sunset: ['2026-04-30T18:18', '2026-05-01T18:18'],
    },
  }
}

function marineResponse() {
  return {
    current: {
      time: '2026-04-30T10:15',
      wave_height: 1.2,
      wave_period: 5.4,
      sea_surface_temperature: 28.7,
      ocean_current_velocity: 1.1,
    },
    daily: {
      time: ['2026-04-30', '2026-05-01'],
      wave_height_max: [1.6, 0.8],
      wave_period_max: [6.2, 4.8],
    },
  }
}

afterEach(() => {
  clearWeatherCacheForTests()
  globalThis.fetch = originalFetch
  Date.now = originalNow
})

describe('content weather service', () => {
  test('normalizes Open-Meteo forecast and marine data for Sam Son tourists', async () => {
    Date.now = () => 1000
    const urls: string[] = []
    globalThis.fetch = async (url: string | URL | Request) => {
      const value = String(url)
      urls.push(value)
      const payload = value.includes('marine-api') ? marineResponse() : forecastResponse()
      return Response.json(payload)
    }

    const result = await getWeather()

    expect(urls).toHaveLength(2)
    expect(urls[0]).toContain('api.open-meteo.com/v1/forecast')
    expect(urls[1]).toContain('marine-api.open-meteo.com/v1/marine')
    expect(result.weather.location.name).toBe('Bãi biển Sầm Sơn, Thanh Hóa')
    expect(result.weather.temperature).toBe(29)
    expect(result.weather.condition).toBe('Mưa nhẹ')
    expect(result.weather.humidity).toBe(78)
    expect(result.weather.wind_speed).toBe(18)
    expect(result.weather.uv_index).toBe(9.2)
    expect(result.weather.rain_probability).toBe(80)
    expect(result.weather.beach.wave_height).toBe(1.2)
    expect(result.weather.beach.sea_surface_temperature).toBe(28.7)
    expect(result.weather.beach.safety_label).toBe('Theo dõi thêm')
    expect(result.weather.forecast).toHaveLength(2)
    expect(result.weather.forecast[0]).toMatchObject({
      date: '2026-04-30',
      high: 31,
      low: 27,
      condition: 'Mưa nhẹ',
      rain_probability: 80,
      wave_height: 1.6,
    })
    expect(result.weather.travel_tip).toContain('áo mưa')
  })

  test('uses cached weather data during the cache window', async () => {
    Date.now = () => 2000
    let calls = 0
    globalThis.fetch = async (url: string | URL | Request) => {
      calls += 1
      const payload = String(url).includes('marine-api') ? marineResponse() : forecastResponse()
      return Response.json(payload)
    }

    const first = await getWeather()
    const second = await getWeather()

    expect(calls).toBe(2)
    expect(second).toEqual(first)
  })
})
