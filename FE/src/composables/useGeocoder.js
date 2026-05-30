// Module-level cache: address string → { lat, lng } | null
const _cache = new Map()
// In-flight promises to avoid duplicate requests for the same address
const _inflight = new Map()

/**
 * Geocode an address string using Kakao Maps Services.
 * Returns Promise<{ lat: number, lng: number } | null>
 * Results are cached for the lifetime of the page.
 */
export function geocodeAddress(address) {
  if (!address) return Promise.resolve(null)

  const key = address.trim()
  if (_cache.has(key)) return Promise.resolve(_cache.get(key))
  if (_inflight.has(key)) return _inflight.get(key)

  const p = new Promise((resolve) => {
    try {
      const geocoder = new window.kakao.maps.services.Geocoder()
      geocoder.addressSearch(key, (result, status) => {
        if (status === window.kakao.maps.services.Status.OK && result.length) {
          const { y, x } = result[0]
          const coords = { lat: parseFloat(y), lng: parseFloat(x) }
          _cache.set(key, coords)
          resolve(coords)
        } else {
          _cache.set(key, null)
          resolve(null)
        }
      })
    } catch {
      _cache.set(key, null)
      resolve(null)
    }
  }).finally(() => {
    _inflight.delete(key)
  })

  _inflight.set(key, p)
  return p
}

export function clearGeocoderCache() {
  _cache.clear()
  _inflight.clear()
}
