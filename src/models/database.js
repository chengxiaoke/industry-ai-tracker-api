const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const config = require('../config');

class DatabaseManager {
  constructor() {
    this.db = null;
    this.dbPath = path.resolve(__dirname, '../../', config.databaseUrl);
  }

  connect() {
    if (this.db) return this.db;

    const dbDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    this.db = new Database(this.dbPath);
    this.db.pragma('foreign_keys = ON');
    console.log(`已连接到数据库: ${this.dbPath}`);
    return this.db;
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('数据库连接已关闭');
    }
  }

  // ========== AI工具操作 ==========

  insertOrUpdateAITool(tool) {
    const db = this.connect();
    const stmt = db.prepare(`
      INSERT INTO ai_tools (
        name, description, full_description, category, subcategory, tags,
        website, github_url, pricing, pricing_model, logo_url, screenshots,
        热度, 评分, 评论数, 发布时间, 最后更新, status, source, external_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(name, website) DO UPDATE SET
        description = COALESCE(EXCLUDED.description, ai_tools.description),
        full_description = COALESCE(EXCLUDED.full_description, ai_tools.full_description),
        category = COALESCE(EXCLUDED.category, ai_tools.category),
        tags = COALESCE(EXCLUDED.tags, ai_tools.tags),
        热度 = COALESCE(EXCLUDED.热度, ai_tools.热度),
        评分 = COALESCE(EXCLUDED.评分, ai_tools.评分),
        最后更新 = CURRENT_TIMESTAMP,
        status = 'active'
    `);

    const result = stmt.run(
      tool.name, tool.description, tool.fullDescription, tool.category,
      tool.subcategory, JSON.stringify(tool.tags), tool.website, tool.githubUrl,
      tool.pricing, tool.pricingModel, tool.logoUrl, JSON.stringify(tool.screenshots),
      tool.popularity || 0, tool.rating || 0, tool.reviewCount || 0,
      tool.publishDate, new Date().toISOString(), 'active', tool.source, tool.externalId
    );

    return result;
  }

  getAITools(filters = {}) {
    const db = this.connect();
    let query = 'SELECT * FROM ai_tools WHERE status = ?';
    const params = ['active'];

    if (filters.category && filters.category !== 'all') {
      query += ' AND category = ?';
      params.push(filters.category);
    }

    if (filters.search) {
      query += ' AND (name LIKE ? OR description LIKE ? OR tags LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (filters.limit) {
      query += ' ORDER BY 热度 DESC LIMIT ?';
      params.push(filters.limit);
    } else {
      query += ' ORDER BY 热度 DESC';
    }

    const stmt = db.prepare(query);
    const tools = stmt.all(...params);

    return tools.map(tool => ({
      ...tool,
      tags: JSON.parse(tool.tags || '[]'),
      screenshots: JSON.parse(tool.screenshots || '[]')
    }));
  }

  getAIToolById(id) {
    const db = this.connect();
    const stmt = db.prepare('SELECT * FROM ai_tools WHERE id = ?');
    const tool = stmt.get(id);

    if (tool) {
      tool.tags = JSON.parse(tool.tags || '[]');
      tool.screenshots = JSON.parse(tool.screenshots || '[]');
    }

    return tool;
  }

  // ========== 行业资讯操作 ==========

  insertOrUpdateNews(news) {
    const db = this.connect();
    const stmt = db.prepare(`
      INSERT INTO industry_news (
        title, summary, content, source, source_url, category, tags,
        author, publish_time, image_url, 阅读数, 点赞数, 评论数,
        分享数, status, featured, language
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(title, source_url) DO UPDATE SET
        summary = COALESCE(EXCLUDED.summary, industry_news.summary),
        阅读数 = COALESCE(EXCLUDED.阅读数, industry_news.阅读数),
        点赞数 = COALESCE(EXCLUDED.点赞数, industry_news.点赞数),
        updated_at = CURRENT_TIMESTAMP
    `);

    const result = stmt.run(
      news.title, news.summary, news.content, news.source, news.sourceUrl,
      news.category, JSON.stringify(news.tags), news.author,
      news.publishTime, news.imageUrl, news.readCount || 0,
      news.likeCount || 0, news.commentCount || 0, news.shareCount || 0,
      'published', news.featured || 0, news.language || 'zh-CN'
    );

    return result;
  }

  getNews(filters = {}) {
    const db = this.connect();
    let query = 'SELECT * FROM industry_news WHERE status = ?';
    const params = ['published'];

    if (filters.category && filters.category !== 'all') {
      query += ' AND category = ?';
      params.push(filters.category);
    }

    if (filters.search) {
      query += ' AND (title LIKE ? OR summary LIKE ? OR tags LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (filters.limit) {
      query += ' ORDER BY publish_time DESC LIMIT ?';
      params.push(filters.limit);
    } else {
      query += ' ORDER BY publish_time DESC';
    }

    const stmt = db.prepare(query);
    const news = stmt.all(...params);

    return news.map(item => ({
      ...item,
      tags: JSON.parse(item.tags || '[]')
    }));
  }

  getNewsById(id) {
    const db = this.connect();
    const stmt = db.prepare('SELECT * FROM industry_news WHERE id = ?');
    const news = stmt.get(id);

    if (news) {
      news.tags = JSON.parse(news.tags || '[]');
    }

    return news;
  }

  // ========== 分类操作 ==========

  getCategories(type) {
    const db = this.connect();
    let query = 'SELECT * FROM categories WHERE is_active = 1';
    const params = [];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    query += ' ORDER BY sort_order ASC';

    const stmt = db.prepare(query);
    return stmt.all(...params);
  }

  // ========== 数据源操作 ==========

  getActiveSources() {
    const db = this.connect();
    const stmt = db.prepare('SELECT * FROM data_sources WHERE is_active = 1');
    return stmt.all();
  }

  updateSourceFetchTime(sourceId) {
    const db = this.connect();
    const stmt = db.prepare(`
      UPDATE data_sources SET last_fetch_time = CURRENT_TIMESTAMP, fetch_count = fetch_count + 1
      WHERE id = ?
    `);
    return stmt.run(sourceId);
  }

  // ========== 日志操作 ==========

  insertFetchLog(log) {
    const db = this.connect();
    const stmt = db.prepare(`
      INSERT INTO fetch_logs (source, status, items_fetched, items_saved, duration, error_message)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(log.source, log.status, log.itemsFetched, log.itemsSaved, log.duration, log.error);
  }

  getRecentLogs(limit = 100) {
    const db = this.connect();
    const stmt = db.prepare('SELECT * FROM fetch_logs ORDER BY created_at DESC LIMIT ?');
    return stmt.all(limit);
  }

  // ========== 统计操作 ==========

  getStats() {
    const db = this.connect();
    const stats = {};

    // AI工具统计
    const aiToolsStmt = db.prepare('SELECT COUNT(*) as count FROM ai_tools WHERE status = ?');
    stats.aiToolsCount = aiToolsStmt.get('active').count;

    // 行业资讯统计
    const newsStmt = db.prepare('SELECT COUNT(*) as count FROM industry_news WHERE status = ?');
    stats.newsCount = newsStmt.get('published').count;

    // 今日新增
    const today = new Date().toISOString().split('T')[0];
    const todayNewsStmt = db.prepare(
      'SELECT COUNT(*) as count FROM industry_news WHERE DATE(created_at) = ?'
    );
    stats.todayNewsCount = todayNewsStmt.get(today).count;

    // 各类别统计
    const categoryStatsStmt = db.prepare(`
      SELECT category, COUNT(*) as count FROM ai_tools WHERE status = 'active' GROUP BY category
    `);
    stats.categoryStats = categoryStatsStmt.all();

    return stats;
  }
}

// 单例模式
const dbManager = new DatabaseManager();

module.exports = dbManager;
