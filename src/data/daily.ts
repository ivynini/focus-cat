/**
 * 每日推荐内容池：金句 / 美文 / 音乐。
 *
 * 之前这些是写死在页面里的一个常量，永远不变。现在改成内容池 + 按自然日轮换：
 * 同一天内多次打开看到的是同一份（可预期），第二天换一条。
 *
 * 关于音乐：仓库里只有 assets/music.ogg 一个音频文件，所以「今日推荐曲子」
 * 只是每天轮换展示的曲目信息，播放按钮放的始终是那首内置的专注背景乐。
 * 等有多首音频文件了，把 TRACKS 里的条目接上各自的 audio 即可，页面不用改。
 */

import { article } from './articles'

export interface Quote {
  text: string
  author: string
}

export interface DailyArticle {
  title: string
  author: string
  firstSentence: string
  body: string
}

export interface Track {
  name: string
  artist: string
}

/** 24 条短句轮换：同一天所有人看到的是同一条。 */
export const QUOTES: readonly Quote[] = [
  { text: '真正的自由不是随心所欲，而是自我掌控。', author: '— 亚里士多德' },
  { text: '慢慢来，也会很快。', author: '— 今日金句' },
  { text: '每次专注，都是对自己的投资。', author: '— 今日金句' },
  { text: '温柔地对待每一天。', author: '— 今日金句' },
  { text: '不积跬步，无以至千里；不积小流，无以成江海。', author: '— 荀子' },
  { text: '业精于勤，荒于嬉；行成于思，毁于随。', author: '— 韩愈' },
  { text: '知之者不如好之者，好之者不如乐之者。', author: '— 孔子' },
  { text: '学而不思则罔，思而不学则殆。', author: '— 孔子' },
  { text: '千里之行，始于足下。', author: '— 老子' },
  { text: '会当凌绝顶，一览众山小。', author: '— 杜甫' },
  { text: '长风破浪会有时，直挂云帆济沧海。', author: '— 李白' },
  { text: '纸上得来终觉浅，绝知此事要躬行。', author: '— 陆游' },
  { text: '非淡泊无以明志，非宁静无以致远。', author: '— 诸葛亮' },
  { text: '工欲善其事，必先利其器。', author: '— 孔子' },
  { text: '路漫漫其修远兮，吾将上下而求索。', author: '— 屈原' },
  { text: '天行健，君子以自强不息。', author: '— 《周易》' },
  { text: '我们都在阴沟里，但仍有人仰望星空。', author: '— 王尔德' },
  { text: '把时间花在哪，就会成为什么样的人。', author: '— 今日金句' },
  { text: '与其焦虑未来，不如把手上的事做完。', author: '— 今日金句' },
  { text: '一次只做一件事，就是最高效的专注。', author: '— 今日金句' },
  { text: '完成比完美更重要。', author: '— 今日金句' },
  { text: '今天也要好好吃饭、好好睡觉、好好专注。', author: '— 今日金句' },
  { text: '不必每天都打满鸡血，适当休息也很重要。', author: '— 今日金句' },
  { text: '日拱一卒，功不唐捐。', author: '— 今日金句' },
]

/** 美文池：一篇是原来那篇，另外两篇是公版文本节选。 */
export const ARTICLES: readonly DailyArticle[] = [
  {
    title: article.title,
    author: article.author,
    firstSentence: article.firstSentence,
    body: article.body,
  },
  {
    title: '匆匆',
    author: '朱自清',
    firstSentence: '燕子去了，有再来的时候；杨柳枯了，有再青的时候；桃花谢了，有再开的时候。',
    body: [
      '燕子去了，有再来的时候；杨柳枯了，有再青的时候；桃花谢了，有再开的时候。但是，聪明的，你告诉我，我们的日子为什么一去不复返呢？——是有人偷了他们罢：那是谁？又藏在何处呢？是他们自己逃走了罢：现在又到了哪里呢？',
      '我不知道他们给了我多少日子；但我的手确乎是渐渐空虚了。在默默里算着，八千多日子已经从我手中溜去；像针尖上一滴水滴在大海里，我的日子滴在时间的流里，没有声音，也没有影子。我不禁头涔涔而泪潸潸了。',
      '去的尽管去了，来的尽管来着；去来的中间，又怎样地匆匆呢？早上我起来的时候，小屋里射进两三方斜斜的太阳。太阳他有脚啊，轻轻悄悄地挪移了；我也茫茫然跟着旋转。',
      '于是——洗手的时候，日子从水盆里过去；吃饭的时候，日子从饭碗里过去；默默时，便从凝然的双眼前过去。我觉察他去的匆匆了，伸出手遮挽时，他又从遮挽着的手边过去。',
      '在逃去如飞的日子里，在千门万户的世界里的我能做些什么呢？只有徘徊罢了，只有匆匆罢了；在八千多日的匆匆里，除徘徊外，又剩些什么呢？',
      '过去的日子如轻烟，被微风吹散了，如薄雾，被初阳蒸融了；我留着些什么痕迹呢？我何曾留着像游丝样的痕迹呢？',
      '你聪明的，告诉我，我们的日子为什么一去不复返呢？',
    ].join('\n'),
  },
  {
    title: '学而（节选）',
    author: '《论语》',
    firstSentence: '学而时习之，不亦说乎？有朋自远方来，不亦乐乎？',
    body: [
      '子曰：「学而时习之，不亦说乎？有朋自远方来，不亦乐乎？人不知而不愠，不亦君子乎？」',
      '曾子曰：「吾日三省吾身：为人谋而不忠乎？与朋友交而不信乎？传不习乎？」',
      '子曰：「温故而知新，可以为师矣。」',
      '子曰：「学而不思则罔，思而不学则殆。」',
      '子曰：「由，诲女知之乎！知之为知之，不知为不知，是知也。」',
      '子曰：「三人行，必有我师焉：择其善者而从之，其不善者而改之。」',
    ].join('\n'),
  },
]

/**
 * 曲目池：只是「今日推荐」的展示信息。
 * 播放按钮放的仍是内置的 assets/music.ogg —— 见文件头注释。
 */
export const TRACKS: readonly Track[] = [
  { name: 'Merry Christmas Mr. Lawrence', artist: '坂本龙一' },
  { name: 'Gymnopédie No.1', artist: 'Erik Satie' },
  { name: 'River Flows in You', artist: 'Yiruma' },
  { name: 'Canon in D', artist: 'Johann Pachelbel' },
  { name: 'Nuvole Bianche', artist: 'Ludovico Einaudi' },
  { name: '月光の雲海', artist: '久石让' },
  { name: 'Nocturne Op.9 No.2', artist: '肖邦' },
]

/** 本地时区的「第几天」，用来做每日轮换：跨零点才换，不用服务器时间。 */
export function dayNumber(date: Date = new Date()): number {
  const local = date.getTime() - date.getTimezoneOffset() * 60 * 1000
  return Math.floor(local / 86_400_000)
}

/** 从池子里按日取一条；offset 让几个池子错开轮换节奏。 */
export function pickDaily<T>(pool: readonly T[], offset = 0, date: Date = new Date()): T {
  return pool[(dayNumber(date) + offset) % pool.length]
}

export const todayQuote = (date?: Date): Quote => pickDaily(QUOTES, 0, date)
export const todayArticle = (date?: Date): DailyArticle => pickDaily(ARTICLES, 1, date)
export const todayTrack = (date?: Date): Track => pickDaily(TRACKS, 2, date)