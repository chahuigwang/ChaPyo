// Phase 29 — soft pastel accents per Day index. Shared between timeline header and map pins.
// Each entry: { name, bg (soft pastel fill), fg (label text), pin (saturated pin fill) }.
const PALETTE = [
  { name: 'sky',    bg: '#E0F2FE', fg: '#0369A1', pin: '#00B7EB' },
  { name: 'mint',   bg: '#DCFCE7', fg: '#047857', pin: '#10B981' },
  { name: 'peach',  bg: '#FFEDD5', fg: '#C2410C', pin: '#F97316' },
  { name: 'lilac',  bg: '#EDE9FE', fg: '#6D28D9', pin: '#A855F7' },
  { name: 'rose',   bg: '#FFE4E6', fg: '#BE123C', pin: '#F43F5E' },
  { name: 'butter', bg: '#FEF3C7', fg: '#A16207', pin: '#F59E0B' },
  { name: 'aqua',   bg: '#CFFAFE', fg: '#0E7490', pin: '#06B6D4' },
]

export function dayColorFor(index) {
  if (index == null || index < 0) return PALETTE[0]
  return PALETTE[index % PALETTE.length]
}

export function useDayColor() {
  return { dayColorFor, palette: PALETTE }
}
