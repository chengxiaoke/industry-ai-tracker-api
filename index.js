require('dotenv').config();

const config = {
  // 服务器配置
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',

  // 数据库配置
  databaseUrl: process.env.DATABASE_URL || './data/ai-tracker.db',

  // 采集配置
  fetchInterval: {
    aiTools: parseInt(process.env.FETCH_INTERVAL_AI_TOOLS) || 24, // 小时
    news: parseInt(process.env.FETCH_INTERVAL_NEWS) || 6, // 小时
  },
  requestTimeout: parseInt(process.env.REQUEST_TIMEOUT) || 30000,
  maxConcurrentRequests: parseInt(process.env.MAX_CONCURRENT_REQUESTS) || 5,

  // RSS订阅源 - 使用默认值，确保即使环境变量未设置也能工作
  rssFeeds: JSON.parse(process.env.RSS_FEEDS || '[
    "https://techcrunch.com/feed/",
    "https://www.theverge.com/rss/index.xml",
    "https://blog.google/technology/ai/rss/",
    "https://openai.com/blog/rss.xml",
    "https://engineering.fb.com/feed/",
    "https://netflixtechblog.com/feed"
  ]'),

  // GitHub配置
  githubTrendingUrl: process.env.GITHUB_TRENDING_URL || 'https://github.com/trending',

  // 缓存配置
  cacheDuration: parseInt(process.env.CACHE_DURATION) || 3600000, // 1小时

  // API前缀
  apiPrefix: '/api/v1',

  // 分类映射
  categoryMapping: {
    // AI工具分类
    'text': ['文本/写作', 'writing', 'text', 'chatbot', 'llm', 'language model'],
    'image': ['图像生成', 'image', 'art', 'design', 'generation', 'creative'],
    'video': ['视频创作', 'video', 'video generation', 'motion'],
    'audio': ['音频/语音', 'audio', 'music', 'speech', 'voice', 'tts'],
    'code': ['代码辅助', 'code', 'programming', 'developer', 'coding'],
    'data': ['数据分析', 'data', 'analytics', 'research', 'search'],
    'office': ['办公效率', 'office', 'productivity', 'presentation', 'notes'],
    'translate': ['翻译语言', 'translate', 'language', 'multilingual'],
    '3d': ['3D建模', '3d', '3d model', 'modeling', 'geometry'],

    // 行业资讯分类
    'tech': ['科技', 'technology', 'tech', 'innovation', 'software', 'hardware'],
    'finance': ['金融', 'finance', 'business', 'investment', 'market', 'stock'],
    'health': ['医疗', 'health', 'medical', 'healthcare', 'biotech', 'pharma'],
    'education': ['教育', 'education', 'learning', 'edtech', 'school', 'university'],
    'entertainment': ['娱乐', 'entertainment', 'media', 'streaming', 'gaming', 'game'],
    'manufacturing': ['制造', 'manufacturing', 'industrial', 'robotics', 'automation'],
    'energy': ['能源', 'energy', 'renewable', 'sustainability', 'carbon', 'climate'],
    'ecommerce': ['电商', 'ecommerce', 'e-commerce', 'retail', 'shopping', 'consumer'],
  },

  // 标签黑名单（过滤低质量内容）
  tagBlacklist: [
    'advertisement', 'sponsored', 'clickbait', 'native ad',
    '成人内容', '赌博', '彩票', '理财骗局'
  ],

  // 热度权重
  popularityWeights: {
    readCount: 1,
    socialShares: 2,
    comments: 3,
    bookmarks: 1.5,
  }
};

module.exports = config;
