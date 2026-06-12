# Focus Cat - 专注猫咪

An Expo (React Native) app for focus/meditation. Combines a Pomodoro-style focus timer with a virtual cat pet system and a community board.

## Tech Stack
- **Framework**: Expo SDK 54 + React Native 0.81 + React 19
- **Routing**: Expo Router v4 (file-based routing)
- **Backend/DB/Auth**: Supabase
- **State**: Zustand
- **Animations**: react-native-reanimated + lottie-react-native

## Project Structure
```
app/            → Expo Router pages (file-based routing)
  (tabs)/       → Tab bar screens
    index.tsx   → Home: daily quote, article, song recommendation
    focus.tsx   → Focus timer with cat animation
    cat.tsx     → Cat raising system (feed, decorate with coins)
    world.tsx   → Community posts board
    profile.tsx → User profile page
src/
  lib/          → Supabase client, utilities
  stores/       → Zustand stores
  components/   → Reusable RN components
  hooks/        → Custom hooks
  types/        → TypeScript types
```

## Core Features (MVP)
1. **Home Page**: Daily quote, daily article, daily song recommendation
2. **Focus Timer**: Adjustable timer with cute cat animation feedback
3. **Cat System**: Earn coins by focusing, feed cat, buy decorations
4. **World**: Community post board (read/create posts)
5. **Profile**: User settings and stats

## Conventions
- Use TypeScript with strict mode
- Use functional components and hooks
- Style with StyleSheet.create (no Tailwind/styled-components)
- Use Expo's built-in packages before third-party alternatives
- Keep components small and focused
- Colors: warm tones, cat-themed (orange/cream/brown palette)
- All user-facing text must be in Chinese (Simplified)

## Supabase Setup
- Project URL and anon key go in `src/lib/supabase.ts`
- Tables needed: posts, user_profiles, cat_state, focus_sessions
- Row Level Security enabled on all tables
