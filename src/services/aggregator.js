const rssFetcher = require('./rss-fetcher');
const githubFetcher = require('./github-fetcher');
const aiToolsFetcher = require('./ai-tools-fetcher');
const db = require('../models/database');

class DataAggregator {
  constructor() {
    this.lastFetch = {
      aiTools: null,
      news: null,
      github: null
    };
  }

  // 采集所有数据
  async fetchAll() {
    console.log('\n🚀 开始全量数据采集...');
    const startTime = Date.now();

    const results = {
      aiTools: null,
      news: null,
      github: null,
      errors: []
    };

    // 并行采集
    const [aiToolsResult, newsResult, githubResult] = await Promise.allSettled([
      this.fetchAITools(),
      this.fetchNews(),
      this.fetchGitHub()
    ]);

    // 处理AI工具采集结果
    if (aiToolsResult.status === 'fulfilled') {
      results.aiTools = aiToolsResult.value;
    } else {
      results.errors.push({ source: 'AI Tools', error: aiToolsResult.reason.message });
    }

    // 处理新闻采集结果
    if (newsResult.status === 'fulfilled') {
      results.news = newsResult.value;
    } else {
      results.errors.push({ source: 'News', error: newsResult.reason.message });
    }

    // 处理GitHub采集结果
    if (githubResult.status === 'fulfilled') {
      results.github = githubResult.value;
    } else {
      results.errors.push({ source: 'GitHub', error: githubResult.reason.message });
    }

    const duration = Date.now() - startTime;
    console.log(`\n✅ 全量采集完成！耗时 ${duration}ms`);

    // 记录日志
    this.logFetchResults(results, duration);

    return results;
  }

  // 采集AI工具
  async fetchAITools() {
    console.log('\n🤖 采集AI工具...');
    const startTime = Date.now();

    try {
      const result = await aiToolsFetcher.fetchAllTools();

      this.lastFetch.aiTools = new Date();

      // 记录日志
      db.insertFetchLog({
        source: 'AI Tools',
        status: result.success ? 'success' : 'error',
        itemsFetched: result.total || 0,
        itemsSaved: result.saved || 0,
        duration: Date.now() - startTime,
        error: result.error || null
      });

      return result;
    } catch (error) {
      console.error('采集AI工具失败:', error);
      return { success: false, error: error.message, total: 0, saved: 0 };
    }
  }

  // 采集行业资讯
  async fetchNews() {
    console.log('\n📰 采集行业资讯...');
    const startTime = Date.now();

    try {
      const result = await rssFetcher.fetchAllFeeds();

      if (result.items.length > 0) {
        let savedCount = 0;
        for (const item of result.items) {
          try {
            db.insertOrUpdateNews(item);
            savedCount++;
          } catch (e) {
            // 忽略重复条目
          }
        }

        this.lastFetch.news = new Date();

        // 记录日志
        db.insertFetchLog({
          source: 'RSS Feeds',
          status: 'success',
          itemsFetched: result.items.length,
          itemsSaved: savedCount,
          duration: result.duration,
          error: null
        });

        return { success: true, total: result.items.length, saved: savedCount };
      }

      return { success: true, total: 0, saved: 0 };
    } catch (error) {
      console.error('采集行业资讯失败:', error);

      db.insertFetchLog({
        source: 'RSS Feeds',
        status: 'error',
        itemsFetched: 0,
        itemsSaved: 0,
        duration: Date.now() - startTime,
        error: error.message
      });

      return { success: false, error: error.message, total: 0, saved: 0 };
    }
  }

  // 采集GitHub趋势
  async fetchGitHub() {
    console.log('\n🐙 采集GitHub趋势项目...');
    const startTime = Date.now();

    try {
      const repos = await githubFetcher.fetchAllLanguages();

      let savedCount = 0;
      for (const repo of repos) {
        try {
          db.insertOrUpdateAITool({
            name: repo.name,
            description: repo.description,
            website: repo.url,
            category: repo.category,
            tags: [repo.language, 'GitHub', '开源'],
            pricing: '免费',
            热度: repo.stars,
            publishDate: repo.publishDate,
            source: 'GitHub Trending'
          });
          savedCount++;
        } catch (e) {
          // 忽略重复
        }
      }

      this.lastFetch.github = new Date();

      db.insertFetchLog({
        source: 'GitHub Trending',
        status: 'success',
        itemsFetched: repos.length,
        itemsSaved: savedCount,
        duration: Date.now() - startTime,
        error: null
      });

      return { success: true, total: repos.length, saved: savedCount };
    } catch (error) {
      console.error('采集GitHub趋势失败:', error);
      return { success: false, error: error.message, total: 0, saved: 0 };
    }
  }

  // 记录采集结果
  logFetchResults(results, duration) {
    console.log('\n📊 采集结果汇总:');
    console.log(`   AI工具: ${results.aiTools?.saved || 0} 条`);
    console.log(`   行业资讯: ${results.news?.saved || 0} 条`);
    console.log(`   GitHub项目: ${results.github?.saved || 0} 条`);

    if (results.errors.length > 0) {
      console.log('\n⚠️ 采集过程中出现以下错误:');
      results.errors.forEach(err => {
        console.log(`   - ${err.source}: ${err.error}`);
      });
    }

    // 保存总体日志
    db.insertFetchLog({
      source: 'Full Aggregation',
      status: results.errors.length === 0 ? 'success' : 'partial',
      itemsFetched: (results.aiTools?.total || 0) + (results.news?.total || 0),
      itemsSaved: (results.aiTools?.saved || 0) + (results.news?.saved || 0),
      duration,
      error: results.errors.map(e => e.error).join('; ')
    });
  }

  // 获取采集状态
  getFetchStatus() {
    return {
      lastFetch: this.lastFetch,
      status: 'ready',
      nextScheduledFetch: {
        aiTools: this.lastFetch.aiTools ?
          new Date(this.lastFetch.aiTools.getTime() + 24 * 60 * 60 * 1000) : null,
        news: this.lastFetch.news ?
          new Date(this.lastFetch.news.getTime() + 6 * 60 * 60 * 1000) : null
      }
    };
  }
}

module.exports = new DataAggregator();
