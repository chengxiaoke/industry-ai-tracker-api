const express = require('express');
const db = require('../models/database');
const cronManager = require('../cron/jobs');
const aggregator = require('../services/aggregator');

const router = express.Router();

// ========== AI工具接口 ==========

// 获取AI工具列表
router.get('/ai-tools', (req, res) => {
  try {
    const { category, search, limit } = req.query;
    const tools = db.getAITools({
      category: category || 'all',
      search: search || '',
      limit: limit ? parseInt(limit) : undefined
    });

    res.json({
      success: true,
      data: tools,
      total: tools.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取单个AI工具详情
router.get('/ai-tools/:id', (req, res) => {
  try {
    const tool = db.getAIToolById(req.params.id);

    if (!tool) {
      return res.status(404).json({
        success: false,
        error: '工具不存在'
      });
    }

    res.json({
      success: true,
      data: tool
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========== 行业资讯接口 ==========

// 获取行业资讯列表
router.get('/news', (req, res) => {
  try {
    const { category, search, limit } = req.query;
    const news = db.getNews({
      category: category || 'all',
      search: search || '',
      limit: limit ? parseInt(limit) : undefined
    });

    res.json({
      success: true,
      data: news,
      total: news.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取单条资讯详情
router.get('/news/:id', (req, res) => {
  try {
    const news = db.getNewsById(req.params.id);

    if (!news) {
      return res.status(404).json({
        success: false,
        error: '资讯不存在'
      });
    }

    res.json({
      success: true,
      data: news
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========== 分类接口 ==========

// 获取所有分类
router.get('/categories', (req, res) => {
  try {
    const { type } = req.query;
    const categories = db.getCategories(type);

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========== 统计接口 ==========

// 获取统计数据
router.get('/stats', (req, res) => {
  try {
    const stats = db.getStats();
    const fetchStatus = aggregator.getFetchStatus();

    res.json({
      success: true,
      data: {
        ...stats,
        lastFetch: fetchStatus.lastFetch,
        nextScheduledFetch: fetchStatus.nextScheduledFetch
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========== 采集任务接口 ==========

// 手动触发AI工具更新
router.post('/fetch/ai-tools', async (req, res) => {
  try {
    const result = await cronManager.triggerAIToolsUpdate();
    res.json({
      success: result.success,
      message: result.success ? 'AI工具更新完成' : '更新失败',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 手动触发行业资讯更新
router.post('/fetch/news', async (req, res) => {
  try {
    const result = await cronManager.triggerNewsUpdate();
    res.json({
      success: result.success,
      message: result.success ? '行业资讯更新完成' : '更新失败',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 手动触发全量更新
router.post('/fetch/all', async (req, res) => {
  try {
    const result = await cronManager.triggerFullUpdate();
    res.json({
      success: result.errors?.length === 0,
      message: result.errors?.length === 0 ? '全量更新完成' : '部分更新失败',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取采集日志
router.get('/logs', (req, res) => {
  try {
    const { limit } = req.query;
    const logs = db.getRecentLogs(limit ? parseInt(limit) : 100);

    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 获取任务状态
router.get('/cron/status', (req, res) => {
  try {
    const status = cronManager.getStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ========== 健康检查 ==========

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;
