export interface GeoPoint {
  latitude: number
  longitude: number
}

export function parseCoordinate(value: unknown) {
  if (value === null || value === undefined || value === '') return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function hasGeoPoint(point: Partial<GeoPoint>): point is GeoPoint {
  return Number.isFinite(point.latitude) && Number.isFinite(point.longitude)
}

export function calculateDistanceKm(from: GeoPoint, to: GeoPoint) {
  const earthRadiusKm = 6371
  const dLat = toRadians(to.latitude - from.latitude)
  const dLon = toRadians(to.longitude - from.longitude)
  const fromLat = toRadians(from.latitude)
  const toLat = toRadians(to.latitude)

  const a = Math.sin(dLat / 2) ** 2 + Math.cos(fromLat) * Math.cos(toLat) * Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(earthRadiusKm * c * 10) / 10
}

function toRadians(value: number) {
  return (value * Math.PI) / 180
}
