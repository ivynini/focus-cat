import { Dimensions } from 'react-native'

const BASE_WIDTH = 402
const { width: SW, height: SH } = Dimensions.get('window')

export const scale = (size: number) => Math.round((SW / BASE_WIDTH) * size)
export const vscale = (size: number) => Math.round((SH / 874) * size)
export const sw = SW
export const sh = SH
