import type { RankingCandidate, RankingDataset, RankingTheme } from '#shared/types/ranking'

const scoreCriteria = [
  'Does not fit the theme',
  'Fits the theme only slightly',
  'Fits the theme somewhat',
  'Fits the theme well',
  'Fits the theme exceptionally well',
]

function makeTheme(id: string, label: string, instructions: string, context?: string): RankingTheme {
  return { id, label, instructions, context }
}

function makeCandidates(labels: string[], prefix: string): RankingCandidate[] {
  return labels.map((label, index) => ({
    id: `${prefix}-${String(index + 1).padStart(2, '0')}`,
    label,
  }))
}

const prefectureNames = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県', '茨城県', '栃木県', '群馬県',
  '埼玉県', '千葉県', '東京都', '神奈川県', '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県',
  '岐阜県', '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県',
  '鳥取県', '島根県', '岡山県', '広島県', '山口県', '徳島県', '香川県', '愛媛県', '高知県', '福岡県',
  '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
]

const wardNames = [
  '千代田区', '中央区', '港区', '新宿区', '文京区', '台東区', '墨田区', '江東区', '品川区', '目黒区',
  '大田区', '世田谷区', '渋谷区', '中野区', '杉並区', '豊島区', '北区', '荒川区', '板橋区', '練馬区',
  '足立区', '葛飾区', '江戸川区',
]

const prefectureThemes = [
  makeTheme('travel', '旅行するなら', 'Judge how appealing this prefecture would be as a travel destination, considering variety, memorable experiences, and visitor appeal.'),
  makeTheme('live', '一生住むなら', 'Judge how appealing this prefecture would be as a place to live long-term, considering everyday life, access, and overall quality of life.'),
  makeTheme('food', '食を楽しむなら', 'Judge how appealing this prefecture would be for enjoying food, considering its culinary identity, variety, and memorable local dishes.'),
  makeTheme('remote-work', 'リモートワークするなら', 'Judge how appealing this prefecture would be for remote work, considering livability, connectivity, amenities, and balance.'),
  makeTheme('retirement', '老後を過ごすなら', 'Judge how appealing this prefecture would be for retirement, considering comfort, access to services, climate, and pace of life.'),
  makeTheme('rpg-setting', 'RPGの舞台になりそう', 'Judge how inspiring this prefecture would be as an RPG setting, considering atmosphere, landscapes, history, and story potential.'),
]

const wardThemes = [
  makeTheme('solo-living', '一人暮らしするなら', 'Judge how appealing this ward would be for living alone, considering convenience, atmosphere, and everyday amenities.'),
  makeTheme('weekend', '休日を過ごすなら', 'Judge how appealing this ward would be for a day off, considering things to see, do, eat, and discover.'),
  makeTheme('walking', '散歩するなら', 'Judge how rewarding this ward would be for exploring on foot, considering streetscape, parks, and points of interest.'),
  makeTheme('food-hopping', '食べ歩きするなら', 'Judge how appealing this ward would be for a food-focused outing, considering range, character, and memorable options.'),
  makeTheme('future-city', '未来都市になりそう', 'Judge how convincingly this ward could inspire a distinctive future-city setting, considering scale, architecture, and atmosphere.'),
]

const monthThemes = [
  makeTheme('travel-in-japan', '日本で旅行するなら', 'Judge how appealing this month would be for traveling in Japan, considering weather, seasonal scenery, and experiences.', 'Interpret seasons, weather, and annual events in the context of Japan.'),
  makeTheme('comfort', '過ごしやすそう', 'Judge how comfortable this month is likely to feel in Japan, considering typical weather and daily routines.', 'Interpret seasons and weather in the context of Japan.'),
  makeTheme('events', 'イベントが楽しそう', 'Judge how appealing this month is for seasonal events and celebrations in Japan.', 'Interpret annual events and seasons in the context of Japan.'),
  makeTheme('food-month', '食べ物がおいしそう', 'Judge how appealing this month is for seasonal food in Japan, considering produce and culinary traditions.', 'Interpret seasonal ingredients and food culture in the context of Japan.'),
  makeTheme('story-month', '物語の舞台にするなら', 'Judge how evocative this month would be as the setting for a story, considering atmosphere, seasonal change, and associations.', 'Interpret seasons and annual events in the context of Japan.'),
]

const zodiacThemes = [
  makeTheme('companion', '相棒にするなら', 'Judge how appealing this zodiac animal would be as a memorable companion, considering personality, symbolism, and story potential.'),
  makeTheme('survival', 'サバイバルで頼れそう', 'Judge how dependable this zodiac animal would feel in a fictional survival scenario, considering recognizable animal traits and symbolism.'),
  makeTheme('final-boss', '最終ボス感がある', 'Judge how much final-boss presence this zodiac animal has, considering silhouette, mythology, and dramatic impact.'),
  makeTheme('leader', 'リーダーに向いていそう', 'Judge how naturally this zodiac animal suggests leadership, considering symbolism, temperament, and charisma.'),
  makeTheme('character-popular', 'キャラクターとして人気が出そう', 'Judge how likely this zodiac animal is to inspire a popular fictional character, considering recognizability, charm, and design potential.'),
]

const planetThemes = [
  makeTheme('sci-fi-setting', 'SF作品の舞台にするなら', 'Judge how inspiring this planet would be as a science-fiction setting, considering atmosphere, visual identity, and story potential.'),
  makeTheme('strong-name', '名前が強そう', 'Judge how striking and powerful this planet name sounds, as a subjective impression rather than a scientific fact.'),
  makeTheme('memorable-look', '見た目が印象的', 'Judge how visually striking this planet is based on its widely known appearance and imagery, not scientific ranking.'),
  makeTheme('explore', '探査してみたい', 'Judge how compelling this planet would be to explore, considering familiar features, unanswered questions, and imaginative appeal.'),
  makeTheme('planet-character', 'キャラクター化したら人気が出そう', 'Judge how naturally this planet could inspire a popular character, considering its name, familiar identity, and visual associations.'),
]

export const commonThemes = [
  makeTheme('favorite', 'いちばん好きなのは', 'Judge how broadly appealing and memorable this candidate is as a personal favorite.'),
  makeTheme('recommend', '人にすすめるなら', 'Judge how confidently this candidate could be recommended to a wide range of people.'),
  makeTheme('exciting', 'いちばんワクワクするのは', 'Judge how exciting and emotionally engaging this candidate feels.'),
  makeTheme('iconic', '象徴的なのは', 'Judge how iconic, recognizable, and culturally memorable this candidate is.'),
  makeTheme('future', '未来に残したいのは', 'Judge how valuable and meaningful this candidate would be to preserve for the future.'),
]

export const rankingDatasets: RankingDataset[] = [
  {
    id: 'japan-prefectures',
    label: '47都道府県',
    description: '北から南まで、日本をまるごと。',
    symbol: 'JP / 47',
    candidates: prefectureNames.map((label, index) => ({
      id: `jp-${String(index + 1).padStart(2, '0')}`,
      label,
    })),
    themes: prefectureThemes,
    defaultThemeId: 'travel',
  },
  {
    id: 'tokyo-wards',
    label: '東京23区',
    description: '個性が並ぶ、東京の23エリア。',
    symbol: 'TYO / 23',
    candidates: makeCandidates(wardNames, 'ward'),
    themes: wardThemes,
    defaultThemeId: 'weekend',
  },
  {
    id: 'months',
    label: '12か月',
    description: '季節と気分を、一年分。',
    symbol: 'YEAR / 12',
    candidates: makeCandidates(['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'], 'month'),
    themes: monthThemes,
    defaultThemeId: 'travel-in-japan',
  },
  {
    id: 'chinese-zodiac',
    label: '十二支',
    description: '十二の動物、いちばんの相棒は？',
    symbol: 'ZODIAC / 12',
    candidates: makeCandidates(['子（ねずみ）', '丑（うし）', '寅（とら）', '卯（うさぎ）', '辰（たつ）', '巳（へび）', '午（うま）', '未（ひつじ）', '申（さる）', '酉（とり）', '戌（いぬ）', '亥（いのしし）'], 'zodiac'),
    themes: zodiacThemes,
    defaultThemeId: 'companion',
  },
  {
    id: 'solar-system-planets',
    label: '太陽系の惑星',
    description: '八つの惑星を、Jevの視点で。',
    symbol: 'SOLAR / 08',
    candidates: makeCandidates(['水星', '金星', '地球', '火星', '木星', '土星', '天王星', '海王星'], 'planet'),
    themes: planetThemes,
    defaultThemeId: 'sci-fi-setting',
  },
  {
    id: 'onigiri-fillings',
    label: 'おにぎりの具',
    description: '定番から個性派まで。',
    symbol: 'FOOD / 12',
    candidates: makeCandidates(['鮭', '梅', 'ツナマヨ', '昆布', '明太子', 'おかか', 'たらこ', '高菜', 'いくら', '鶏五目', '焼きおにぎり', '塩むすび'], 'onigiri'),
    themes: commonThemes,
    defaultThemeId: 'favorite',
  },
  {
    id: 'japanese-castles',
    label: '日本の名城',
    description: '歴史と景観を楽しむ12城。',
    symbol: 'CASTLE / 12',
    candidates: makeCandidates(['姫路城', '松本城', '犬山城', '彦根城', '松江城', '弘前城', '丸岡城', '備中松山城', '松山城', '高知城', '熊本城', '首里城'], 'castle'),
    themes: commonThemes,
    defaultThemeId: 'iconic',
  },
  {
    id: 'noodle-dishes',
    label: '麺料理',
    description: '日本で親しまれる12の味。',
    symbol: 'NOODLE / 12',
    candidates: makeCandidates(['醤油ラーメン', '味噌ラーメン', '豚骨ラーメン', 'うどん', 'そば', '焼きそば', 'そうめん', '冷やし中華', 'ナポリタン', 'きしめん', 'ほうとう', 'ちゃんぽん'], 'noodle'),
    themes: commonThemes,
    defaultThemeId: 'recommend',
  },
  {
    id: 'popular-animals',
    label: '人気の動物',
    description: '身近な仲間から野生動物まで。',
    symbol: 'ANIMAL / 12',
    candidates: makeCandidates(['犬', '猫', 'パンダ', 'ペンギン', 'イルカ', 'カワウソ', 'うさぎ', 'ハムスター', 'ライオン', 'ゾウ', 'キリン', 'レッサーパンダ'], 'animal'),
    themes: commonThemes,
    defaultThemeId: 'favorite',
  },
  {
    id: 'japanese-holidays',
    label: '日本の祝日',
    description: '一年の楽しみな節目。',
    symbol: 'HOLIDAY / 16',
    candidates: makeCandidates(['元日', '成人の日', '建国記念の日', '天皇誕生日', '春分の日', '昭和の日', '憲法記念日', 'みどりの日', 'こどもの日', '海の日', '山の日', '敬老の日', '秋分の日', 'スポーツの日', '文化の日', '勤労感謝の日'], 'holiday'),
    themes: commonThemes,
    defaultThemeId: 'exciting',
  },
]

export const scoreCriteriaLevels = scoreCriteria

export function findDataset(datasetId: string): RankingDataset | undefined {
  return rankingDatasets.find(dataset => dataset.id === datasetId)
}

export function findTheme(dataset: RankingDataset, themeId: string): RankingTheme | undefined {
  return dataset.themes.find(theme => theme.id === themeId)
}
