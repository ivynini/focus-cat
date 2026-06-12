import { Tabs } from 'expo-router'
import CustomTabBar from '../../src/components/CustomTabBar'

export default function TabLayout() {
  return (
    <Tabs
      tabBar={() => <CustomTabBar />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="cat" />
      <Tabs.Screen name="focus" />
      <Tabs.Screen name="world" />
      <Tabs.Screen name="profile" />
    </Tabs>
  )
}
