import { useEffect, useRef, useState } from 'react'
import { Image } from 'react-native'

const FRAMES = [
  require('../../catactivity/未命名/F0.png'),
  require('../../catactivity/未命名/F1.png'),
  require('../../catactivity/未命名/F2.png'),
  require('../../catactivity/未命名/F3.png'),
  require('../../catactivity/未命名/F4.png'),
  require('../../catactivity/未命名/F5.png'),
]

export function AnimatedSprite({
  size = 140,
  width,
  height,
  playing = false,
  fps = 6,
}: {
  size?: number
  width?: number
  height?: number
  playing?: boolean
  fps?: number
}) {
  const w = width ?? size
  const h = height ?? size
  const [frame, setFrame] = useState(0)
  const interval = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (playing) {
      interval.current = setInterval(() => {
        setFrame((f) => (f + 1) % FRAMES.length)
      }, 1000 / fps)
    } else {
      setFrame(0)
      if (interval.current) clearInterval(interval.current)
    }
    return () => { if (interval.current) clearInterval(interval.current) }
  }, [playing, fps])

  return (
    <Image
      source={FRAMES[frame]}
      style={{ width: w, height: h }}
      resizeMode="contain"
    />
  )
}
