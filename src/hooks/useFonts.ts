import { useFonts as useExpoFonts } from 'expo-font'

export function useFonts() {
  const [loaded] = useExpoFonts({
    'Pixel': require('@expo-google-fonts/press-start-2p/400Regular/PressStart2P_400Regular.ttf'),
    'PixelSC': require('@expo-google-fonts/noto-sans-sc/400Regular/NotoSansSC_400Regular.ttf'),
    'PixelSCBold': require('@expo-google-fonts/noto-sans-sc/700Bold/NotoSansSC_700Bold.ttf'),
  })
  return loaded
}

