const axios = require('axios');
const cheerio = require('cheerio');
const { DateTime } = require('luxon');
const config = require('../config');
const db = require('../models/database');

class RSSFetcher {
  constructor() {
    this.client = axios.create({
      timeout: config.requestTimeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
  }

  // 解析RSS/Atom订阅源
  async fetchFeed(feedUrl) {
    try {
      console.log(`📡 正在获取订阅源: ${feedUrl}`);
      const response = await this.client.get(feedUrl);
      const $ = cheerio.load(response.data, { xmlMode: true });

      const items = [];
      const feedTitle = $('channel > title').text() || $('feed > title').text();

      // 解析RSS 2.0格式
      $('channel item').each((i, el) => {
        const item = this.parseRSSItem($, el, feedTitle);
        if (item) items.push(item);
      });

      // 解析Atom格式
      $('entry').each((i, el) => {
        const item = this.parseAtomItem($, el, feedTitle);
        if (item) items.push(item);
      });

      console.log(`   ✅ 获取到 ${items.length} 条内容`);
      return { success: true, items, feedTitle };
    } catch (error) {
      console.error(`   ❌ 获取失败: ${error.message}`);
      return { success: false, error: error.message, items: [] };
    }
  }

  parseRSSItem($, el, feedSource) {
    const title = $(el).find('title').text().trim();
    if (!title) return null;

    const link = $(el).find('link').text().trim();
    const description = $(el).find('description').text().trim() ||
                       $(el).find('content\\:encoded').text().trim() ||
                       $(el).find('encoded').text().trim();

    // 提取纯文本描述
    const $desc = cheerio.load('<div>' + description + '</div>');
    const summary = $desc('div').text().substring(0, 500);

    let publishTime = $(el).find('pubDate').text().trim() ||
                     $(el).find('dc\\:date').text().trim();

    const author = $(el).find('dc\\:creator').text().trim() ||
                  $(el).find('author').text().trim();

    const categories = [];
    $(el).find('category').each((i, cat) => {
      categories.push($(cat).text().trim());
    });

    const imageUrl = $(el).find('enclosure[type^="image"]').attr('url') ||
                    this.extractImageFromContent(description);

    return {
      title,
      summary,
      content: description,
      source: feedSource,
      sourceUrl: link,
      publishTime: publishTime ? this.parseDate(publishTime) : new Date().toISOString(),
      author,
      tags: categories,
      imageUrl,
      category: this.autoCategorize(title + ' ' + summary)
    };
  }

  parseAtomItem($, el, feedSource) {
    const title = $(el).find('title').text().trim();
    if (!title) return null;

    const link = $(el).find('link[rel="alternate"]').attr('href') ||
                $(el).find('link').attr('href');

    const summary = $(el).find('summary').text().trim() ||
                   $(el).find('content').text().trim();
    const content = $(el).find('content').text().trim() || summary;

    let publishTime = $(el).find('published').text().trim() ||
                     $(el).find('updated').text().trim();

    const author = $(el).find('author name').text().trim();

    const categories = [];
    $(el).find('category').each((i, cat) => {
      categories.push($(cat).attr('term'));
    });

    const imageUrl = this.extractImageFromContent(content);

    return {
      title,
      summary: summary.substring(0, 500),
      content,
      source: feedSource,
      sourceUrl: link,
      publishTime: publishTime ? this.parseDate(publishTime) : new Date().toISOString(),
      author,
      tags: categories.filter(c => c),
      imageUrl,
      category: this.autoCategorize(title + ' ' + summary)
    };
  }

  parseDate(dateStr) {
    try {
      // 尝试多种日期格式
      const formats = [
        'RFC2822',
        'ISO8601',
        'yyyy-MM-dd HH:mm:ss',
        'yyyy-MM-dd\'T\'HH:mm:ssXXX',
        'EEE, dd MMM yyyy HH:mm:ss ZZZ'
      ];

      for (const format of formats) {
        const dt = DateTime.fromFormat(dateStr, format, { zone: 'utc' });
        if (dt.isValid) {
          return dt.toISOString();
        }
      }

      // 最后尝试JavaScript原生解析
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    } catch (e) {
      console.error(`日期解析失败: ${dateStr}`);
    }

    return new Date().toISOString();
  }

  extractImageFromContent(html) {
    if (!html) return null;
    const $ = cheerio.load(html);
    const img = $('img').first();
    return img.attr('src') || null;
  }

  autoCategorize(text) {
    const lowerText = text.toLowerCase();
    const categoryKeywords = config.categoryMapping;

    // 检查行业资讯分类
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      // 跳过AI工具分类
      if (['text', 'image', 'video', 'audio', 'code', 'data', 'office', 'translate', '3d'].includes(category)) {
        continue;
      }

      for (const keyword of keywords) {
        if (lowerText.includes(keyword.toLowerCase())) {
          return category;
        }
      }
    }

    // 默认归类为科技创新
    return 'tech';
  }

  async fetchAllFeeds() {
    const allItems = [];
    const startTime = Date.now();

    for (const feedUrl of config.rssFeeds) {
      const result = await this.fetchFeed(feedUrl);
      if (result.success) {
        allItems.push(...result.items);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`📊 总计获取 ${allItems.length} 条资讯，耗时 ${duration}ms`);

    return { items: allItems, duration };
  }
}

module.exports = new RSSFetcher();
