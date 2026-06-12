import { useState, useCallback } from 'react'
import { useAudioPlayer } from 'expo-audio'

const AUDIO_FILE = require('../../assets/music.ogg')

export function useAudio() {
  const [isPlaying, setIsPlaying] = useState(false)
  const player = useAudioPlayer(AUDIO_FILE)

  const togglePlay = useCallback(() => {
    if (player.playing) {
      player.pause()
      setIsPlaying(false)
    } else {
      player.play()
      setIsPlaying(true)
    }
  }, [player])

  return { isPlaying, togglePlay }
}
