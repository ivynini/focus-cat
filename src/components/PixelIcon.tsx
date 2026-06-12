import { View, StyleSheet } from 'react-native'

// Color palette
const C = {
  o: '#F4A460', // orange primary
  O: '#E67E22', // dark orange
  d: '#5D4037', // deep brown
  b: '#8D6E63', // medium brown
  w: '#FFFFFF', // white
  g: '#FFB74D', // gold
  y: '#FFD54F', // yellow
  r: '#EF5350', // red
  k: '#4A3424', // dark wood
  s: '#81C784', // green
  B: '#3E2723', // almost black
  p: '#FFCC80', // peach
  t: 'transparent',
}

export type IconName =
  | 'cat' | 'catSleep' | 'sun' | 'music' | 'heart'
  | 'coin' | 'star' | 'play' | 'pause'
  | 'home' | 'target' | 'globe' | 'person'
  | 'food' | 'shop' | 'article'

// [y][x] = color key, 't' means transparent
const grids: Record<IconName, string[][]> = {
  cat: [
    'tttttttt'.split(''),
    'tBttttBt'.split(''),
    'BtOttOtB'.split(''),
    'BtOOOOtB'.split(''),
    'BtOddOtB'.split(''),
    'BtOOOOtB'.split(''),
    'tBttttBt'.split(''),
    'ttBttBtt'.split(''),
  ],
  catSleep: [
    'tttttttt'.split(''),
    'tBttttBt'.split(''),
    'BttOtttB'.split(''),
    'BtOOOotB'.split(''),
    'BtOddOotB'.split(''),
    'BtOOOOotB'.split(''),
    'tBttttBt'.split(''),
    'ttBBBBtt'.split(''),
  ],
  sun: [
    'ttott'.split(''),
    'totot'.split(''),
    'ottto'.split(''),
    'totot'.split(''),
    'ttott'.split(''),
  ],
  music: [
    'ttoot'.split(''),
    'ttodt'.split(''),
    'ttodt'.split(''),
    'ttodt'.split(''),
    'ttoBt'.split(''),
  ],
  heart: [
    'trrtrr'.split(''),
    'rrrrrr'.split(''),
    'rrrrrr'.split(''),
    'trrrrt'.split(''),
    'ttrrtt'.split(''),
    'tttttt'.split(''),
  ],
  coin: [
    'ttggtt'.split(''),
    'tggggt'.split(''),
    'tgyggt'.split(''),
    'tggggt'.split(''),
    'ttggtt'.split(''),
    'tttttt'.split(''),
  ],
  star: [
    'ttottt'.split(''),
    'toooot'.split(''),
    'oooooo'.split(''),
    'tooott'.split(''),
    'totott'.split(''),
    'tttttt'.split(''),
  ],
  play: [
    'ottt'.split(''),
    'oott'.split(''),
    'ooot'.split(''),
    'oott'.split(''),
    'ottt'.split(''),
  ],
  pause: [
    'otot'.split(''),
    'otot'.split(''),
    'otot'.split(''),
    'otot'.split(''),
    'otot'.split(''),
  ],
  home: [
    'ttodtt'.split(''),
    'tododt'.split(''),
    'oddddo'.split(''),
    'tododt'.split(''),
    'tododt'.split(''),
    'tododt'.split(''),
  ],
  target: [
    'ttoott'.split(''),
    'toddot'.split(''),
    'odoodo'.split(''),
    'odoodo'.split(''),
    'toddot'.split(''),
    'ttoott'.split(''),
  ],
  globe: [
    'ttBBtt'.split(''),
    'tBsBst'.split(''),
    'BsBBsB'.split(''),
    'BsBBsB'.split(''),
    'tBsBst'.split(''),
    'ttBBtt'.split(''),
  ],
  person: [
    'ttodtt'.split(''),
    'tododt'.split(''),
    'tddddt'.split(''),
    'tododt'.split(''),
    'tododt'.split(''),
    'tododt'.split(''),
  ],
  food: [
    'tBBBBt'.split(''),
    'BttttB'.split(''),
    'BtwwtB'.split(''),
    'tBwwBt'.split(''),
    'ttBBtt'.split(''),
    'tttttt'.split(''),
  ],
  shop: [
    'tttttt'.split(''),
    'tOttOt'.split(''),
    'tOOOOt'.split(''),
    'tOOOOt'.split(''),
    'tOOOOt'.split(''),
    'tttttt'.split(''),
  ],
  article: [
    'tttttt'.split(''),
    'ttwwtt'.split(''),
    'twttwt'.split(''),
    'twwwwt'.split(''),
    'twttwt'.split(''),
    'tttttt'.split(''),
  ],
}

export function PixelIcon({ name, size = 24 }: { name: IconName; size?: number }) {
  const grid = grids[name]
  if (!grid) return null

  const rows = grid.length
  const cols = Math.max(...grid.map((r) => r.length))
  const px = Math.round(size / Math.max(rows, cols))

  return (
    <View style={{ width: cols * px, height: rows * px }}>
      {grid.map((row, y) => (
        <View key={y} style={{ flexDirection: 'row' }}>
          {row.map((cell, x) => (
            <View
              key={x}
              style={{
                width: px,
                height: px,
                backgroundColor: cell === 't' ? 'transparent' : (C as any)[cell] || '#000',
              }}
            />
          ))}
        </View>
      ))}
    </View>
  )
}
