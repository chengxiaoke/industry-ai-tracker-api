const cron = require('node-cron');
const aggregator = require('../services/aggregator');
const db = require('../models/database');

class CronManager {
  constructor() {
    this.jobs = new Map();
    this.isRunning = false;
  }

  // 初始化所有定时任务
  initialize() {
    console.log('\n⏰ 初始化定时任务...');

    // 每日AI工具更新（每天凌晨3点）
    this.jobs.set('ai-tools-daily', cron.schedule('0 3 * * *', async () => {
      console.log('\n🕒 执行每日AI工具更新任务...');
      await this.runJob('ai-tools-daily', async () => {
        const result = await aggregator.fetchAITools();
        return result;
      });
    }));

    // 每6小时行业资讯更新（每小时检查）
    this.jobs.set('news-6hours', cron.schedule('0 */6 * * *', async () => {
      console.log('\n🕒 执行行业资讯更新任务...');
      await this.runJob('news-6hours', async () => {
        const result = await aggregator.fetchNews();
        return result;
      });
    }));

    // 每周GitHub趋势更新（每周日午夜）
    this.jobs.set('github-weekly', cron.schedule('0 0 * * 0', async () => {
      console.log('\n🕒 执行GitHub趋势更新任务...');
      await this.runJob('github-weekly', async () => {
        const result = await aggregator.fetchGitHub();
        return result;
      });
    }));

    // 每日全量更新（每天凌晨4点）
    this.jobs.set('daily-full', cron.schedule('0 4 * * *', async () => {
      console.log('\n🕒 执行每日全量更新任务...');
      await this.runJob('daily-full', async () => {
        const result = await aggregator.fetchAll();
        return result;
      });
    }));

    console.log(`✅ 已启动 ${this.jobs.size} 个定时任务`);
    console.log('   - AI工具每日更新 (凌晨 3:00)');
    console.log('   - 行业资讯每6小时更新');
    console.log('   - GitHub趋势每周更新 (周日 00:00)');
    console.log('   - 全量每日更新 (凌晨 4:00)');
  }

  // 运行单个任务
  async runJob(jobId, task) {
    if (this.isRunning) {
      console.log('⚠️ 任务队列忙，请稍后重试');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      console.log(`▶️ 开始执行任务: ${jobId}`);
      const result = await task();
      const duration = Date.now() - startTime;

      console.log(`✅ 任务完成: ${jobId}, 耗时 ${duration}ms`);

      // 记录到数据库
      db.insertFetchLog({
        source: `Cron: ${jobId}`,
        status: result.success ? 'success' : 'error',
        itemsFetched: result.total || 0,
        itemsSaved: result.saved || 0,
        duration,
        error: result.error || null
      });

      return result;
    } catch (error) {
      console.error(`❌ 任务失败: ${jobId}`, error);

      db.insertFetchLog({
        source: `Cron: ${jobId}`,
        status: 'error',
        itemsFetched: 0,
        itemsSaved: 0,
        duration: Date.now() - startTime,
        error: error.message
      });

      return { success: false, error: error.message };
    } finally {
      this.isRunning = false;
    }
  }

  // 手动触发全量更新
  async triggerFullUpdate() {
    console.log('🔄 手动触发全量更新...');
    return await aggregator.fetchAll();
  }

  // 手动触发AI工具更新
  async triggerAIToolsUpdate() {
    console.log('🔄 手动触发AI工具更新...');
    return await aggregator.fetchAITools();
  }

  // 手动触发新闻更新
  async triggerNewsUpdate() {
    console.log('🔄 手动触发行业资讯更新...');
    return await aggregator.fetchNews();
  }

  // 获取任务状态
  getStatus() {
    const status = {
      jobs: [],
      isRunning: this.isRunning,
      aggregatorStatus: aggregator.getFetchStatus()
    };

    this.jobs.forEach((task, name) => {
      status.jobs.push({
        name,
        running: task.running || false
      });
    });

    return status;
  }

  // 停止所有任务
  stopAll() {
    console.log('\n🛑 停止所有定时任务...');
    this.jobs.forEach((task, name) => {
      task.stop();
      console.log(`   - 已停止: ${name}`);
    });
    this.jobs.clear();
    console.log('✅ 所有任务已停止');
  }
}

module.exports = new CronManager();
