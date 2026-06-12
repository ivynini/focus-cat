import { StyleSheet, Text, View, ScrollView, Image, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { MaterialIcons } from '@expo/vector-icons'
import { scale } from '../src/lib/scale'
import { article } from '../src/data/articles'

export default function ArticleScreen() {
  const router = useRouter()

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Image
          source={require('../assets/photo1.jpg')}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.body}>
          <Text style={styles.title}>{article.title}</Text>
          <Text style={styles.author}>— {article.author}</Text>
          <View style={styles.divider} />
          <Text style={styles.text}>{article.body}</Text>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
        <MaterialIcons name="arrow-back" size={scale(22)} color="#F4A460" />
      </TouchableOpacity>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F0' },
  scrollContent: { paddingBottom: scale(40) },
  image: {
    width: '100%',
    height: 280,
    borderBottomWidth: 3,
    borderBottomColor: '#E0D0C0',
  },
  body: {
    padding: scale(20),
  },
  title: {
    fontSize: scale(22),
    fontWeight: '700',
    color: '#4E342E',
    marginBottom: scale(4),
  },
  author: {
    fontSize: scale(13),
    color: '#A08070',
    marginBottom: scale(16),
  },
  divider: {
    height: 2,
    backgroundColor: '#F0E0D0',
    marginBottom: scale(16),
  },
  text: {
    fontSize: scale(15),
    color: '#4E342E',
    lineHeight: scale(26),
  },
  backButton: {
    position: 'absolute',
    top: scale(50),
    left: scale(16),
    width: scale(40),
    height: scale(40),
    borderRadius: scale(20),
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#F0E0D0',
  },
})
