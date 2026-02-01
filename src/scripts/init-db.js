const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const config = require('../config');

const dbPath = path.resolve(__dirname, '../../', config.databaseUrl);
const dbDir = path.dirname(dbPath);

// 确保数据目录存在
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
console.log(`数据库已创建: ${dbPath}`);

// 启用外键约束
db.pragma('foreign_keys = ON');

// 创建AI工具表
db.exec(`
  CREATE TABLE IF NOT EXISTS ai_tools (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    full_description TEXT,
    category TEXT NOT NULL,
    subcategory TEXT,
    tags TEXT,
    website TEXT,
    github_url TEXT,
    pricing TEXT,
    pricing_model TEXT,
    logo_url TEXT,
    screenshots TEXT,
   热度 INTEGER DEFAULT 0,
    评分 REAL DEFAULT 0,
    评论数 INTEGER DEFAULT 0,
    发布时间 DATE,
    最后更新 DATE,
    status TEXT DEFAULT 'active',
    source TEXT,
    external_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, website)
  )
`);

// 创建行业资讯表
db.exec(`
  CREATE TABLE IF NOT EXISTS industry_news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    summary TEXT,
    content TEXT,
    source TEXT NOT NULL,
    source_url TEXT,
    category TEXT NOT NULL,
    tags TEXT,
    author TEXT,
    publish_time DATETIME,
    image_url TEXT,
    阅读数 INTEGER DEFAULT 0,
    点赞数 INTEGER DEFAULT 0,
    评论数 INTEGER DEFAULT 0,
    分享数 INTEGER DEFAULT 0,
    status TEXT DEFAULT 'published',
    featured INTEGER DEFAULT 0,
    language TEXT DEFAULT 'zh-CN',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(title, source_url)
  )
`);

// 创建分类表
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// 创建数据源表
db.exec(`
  CREATE TABLE IF NOT EXISTS data_sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    url TEXT NOT NULL,
    api_key TEXT,
    is_active INTEGER DEFAULT 1,
    last_fetch_time DATETIME,
    last_success_time DATETIME,
    fetch_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// 创建采集日志表
db.exec(`
  CREATE TABLE IF NOT EXISTS fetch_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    status TEXT NOT NULL,
    items_fetched INTEGER DEFAULT 0,
    items_saved INTEGER DEFAULT 0,
    duration INTEGER DEFAULT 0,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// 创建索引
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_ai_tools_category ON ai_tools(category);
  CREATE INDEX IF NOT EXISTS idx_ai_tools_status ON ai_tools(status);
  CREATE INDEX IF NOT EXISTS idx_ai_tools_updated ON ai_tools(最后更新);
  CREATE INDEX IF NOT EXISTS idx_news_category ON industry_news(category);
  CREATE INDEX IF NOT EXISTS idx_news_publish_time ON industry_news(publish_time);
  CREATE INDEX IF NOT EXISTS idx_news_status ON industry_news(status);
`);

// 插入默认分类
const insertCategory = db.prepare(`
  INSERT OR IGNORE INTO categories (name, slug, type, description, icon, color, sort_order)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

// AI工具分类
const aiToolCategories = [
  ['全部', 'all', 'ai_tool', '所有AI工具', 'sparkles', '#6366f1', 0],
  ['文本/写作', 'text', 'ai_tool', '文本生成、写作辅助、对话AI', 'file-text', '#8b5cf6', 1],
  ['图像生成', 'image', 'ai_tool', '图像生成、艺术创作、设计工具', 'image', '#ec4899', 2],
  ['视频创作', 'video', 'ai_tool', '视频生成、视频编辑、动画制作', 'video', '#f43f5e', 3],
  ['音频/语音', 'audio', 'ai_tool', '音乐生成、语音合成、音频处理', 'music', '#f97316', 4],
  ['代码辅助', 'code', 'ai_tool', '代码生成、编程辅助、开发工具', 'code', '#0ea5e9', 5],
  ['数据分析', 'data', 'ai_tool', '搜索引擎、数据分析、研究工具', 'bar-chart', '#14b8a6', 6],
  ['办公效率', 'office', 'ai_tool', '办公工具、演示制作、笔记管理', 'briefcase', '#84cc16', 7],
  ['翻译语言', 'translate', 'ai_tool', '翻译工具、语言学习、多语言处理', 'languages', '#eab308', 8],
  ['3D建模', '3d', 'ai_tool', '3D建模、几何生成、模型处理', 'box', '#a855f7', 9],
];

// 行业资讯分类
const newsCategories = [
  ['全部', 'all', 'news', '所有行业资讯', 'trending-up', '#6366f1', 0],
  ['科技创新', 'tech', 'news', '科技创新、产品发布、技术突破', 'zap', '#f43f5e', 1],
  ['商业金融', 'finance', 'news', '商业动态、投资趋势、市场分析', 'dollar-sign', '#22c55e', 2],
  ['医疗健康', 'health', 'news', '医疗科技、健康管理、生物技术', 'heart-pulse', '#ef4444', 3],
  ['教育科技', 'education', 'news', '在线教育、学习技术、教育创新', 'graduation-cap', '#3b82f6', 4],
  ['娱乐媒体', 'entertainment', 'news', '流媒体、游戏、影视娱乐', 'film', '#8b5cf6', 5],
  ['智能制造', 'manufacturing', 'news', '工业机器人、自动化制造、智能工厂', 'factory', '#64748b', 6],
  ['新能源环保', 'energy', 'news', '新能源、可持续发展、碳中和', 'leaf', '#10b981', 7],
  ['电子商务', 'ecommerce', 'news', '电商平台、零售创新、消费趋势', 'shopping-cart', '#f59e0b', 8],
];

aiToolCategories.forEach(cat => insertCategory.run(...cat));
newsCategories.forEach(cat => insertCategory.run(...cat));

// 插入默认数据源
const insertSource = db.prepare(`
  INSERT OR IGNORE INTO data_sources (name, type, url, is_active)
  VALUES (?, ?, ?, ?)
`);

const defaultSources = [
  ['TechCrunch', 'rss', 'https://techcrunch.com/feed/', 1],
  ['The Verge', 'rss', 'https://www.theverge.com/rss/index.xml', 1],
  ['Google AI Blog', 'rss', 'https://blog.google/technology/ai/rss/', 1],
  ['OpenAI Blog', 'rss', 'https://openai.com/blog/rss.xml', 1],
  ['Product Hunt', 'api', 'https://api.producthunt.com/v2/api', 0],
  ['GitHub Trending', 'scraper', 'https://github.com/trending', 1],
];

defaultSources.forEach(source => insertSource.run(...source));

db.close();

console.log('✅ 数据库初始化完成！');
console.log('   - ai_tools 表已创建');
console.log('   - industry_news 表已创建');
console.log('   - categories 表已创建');
console.log('   - data_sources 表已创建');
console.log('   - fetch_logs 表已创建');
console.log(`   - 默认分类已插入: ${aiToolCategories.length + newsCategories.length} 条`);
console.log(`   - 默认数据源已插入: ${defaultSources.length} 条`);
