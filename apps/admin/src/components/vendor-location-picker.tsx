'use client'

import 'leaflet/dist/leaflet.css'
import type * as Leaflet from 'leaflet'
import { useEffect, useRef } from 'react'

const SAM_SON_CENTER: [number, number] = [19.745, 105.901]

type VendorLocationPickerProps = {
  latitude: string
  longitude: string
  onChange: (location: { latitude: string; longitude: string }) => void
}

export function VendorLocationPicker({ latitude, longitude, onChange }: VendorLocationPickerProps) {
  const mapEl = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<Leaflet.Map | null>(null)
  const markerRef = useRef<Leaflet.Marker | null>(null)
  const onChangeRef = useRef(onChange)
  const initialLocationRef = useRef(parseLocation(latitude, longitude))

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    if (!mapEl.current || mapRef.current) return

    let cancelled = false
    import('leaflet').then((L) => {
      if (cancelled || !mapEl.current || mapRef.current) return
      const current = initialLocationRef.current
      const map = L.map(mapEl.current, { zoomControl: true }).setView(
        current ?? SAM_SON_CENTER,
        current ? 16 : 13,
      )
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map)

      const marker = L.marker(current ?? SAM_SON_CENTER, { draggable: true }).addTo(map)
      markerRef.current = marker
      mapRef.current = map

      marker.on('dragend', () => {
        const next = marker.getLatLng()
        onChangeRef.current(formatLocation(next.lat, next.lng))
      })
      map.on('click', (event) => {
        marker.setLatLng(event.latlng)
        onChangeRef.current(formatLocation(event.latlng.lat, event.latlng.lng))
      })
    })

    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [])

  useEffect(() => {
    const current = parseLocation(latitude, longitude)
    if (!current || !mapRef.current || !markerRef.current) return
    markerRef.current.setLatLng(current)
  }, [latitude, longitude])

  return (
    <div
      ref={mapEl}
      className="h-64 w-full overflow-hidden rounded-xl border border-outline-variant/30"
    />
  )
}

function parseLocation(latitude: string, longitude: string): [number, number] | null {
  const lat = Number(latitude)
  const lng = Number(longitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return [lat, lng]
}

function formatLocation(latitude: number, longitude: number) {
  return {
    latitude: latitude.toFixed(7),
    longitude: longitude.toFixed(7),
  }
}
