require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const config = require('./config');
const db = require('./models/database');
const apiRoutes = require('./routes/api');
const cronManager = require('./cron/jobs');

const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use(express.static(path.join(__dirname, '../../industry-ai-tracker/dist')));

// API路由
app.use(config.apiPrefix, apiRoutes);

// SPA路由支持 - 所有非API请求返回index.html
app.get('*', (req, res, next) => {
  if (req.path.startsWith(config.apiPrefix)) {
    return next();
  }

  const indexPath = path.join(__dirname, '../../industry-ai-tracker/dist/index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.json({
      message: 'AI智汇 API服务运行中',
      version: '1.0.0',
      endpoints: {
        aiTools: `${config.apiPrefix}/ai-tools`,
        news: `${config.apiPrefix}/news`,
        categories: `${config.apiPrefix}/categories`,
        stats: `${config.apiPrefix}/stats`,
        fetch: {
          aiTools: `POST ${config.apiPrefix}/fetch/ai-tools`,
          news: `POST ${config.apiPrefix}/fetch/news`,
          all: `POST ${config.apiPrefix}/fetch/all`
        },
        logs: `${config.apiPrefix}/logs`,
        health: `${config.apiPrefix}/health`
      },
      documentation: '查看 https://github.com/matrix-ai/industry-ai-tracker 获取更多信息'
    });
  }
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({
    success: false,
    error: config.nodeEnv === 'development' ? err.message : 'Internal server error'
  });
});

// 启动服务器
async function startServer() {
  try {
    console.log('🚀 启动AI智汇数据服务...');

    // 初始化数据库
    console.log('📦 初始化数据库...');
    db.connect();

    // 确保数据目录存在
    const dataDir = path.dirname(path.resolve(__dirname, '../', config.databaseUrl));
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // 初始化数据库表
    //const initDbScript = require('./scripts/init-db');
    //initDbScript();

    // 启动HTTP服务器
    const server = app.listen(config.port, () => {
      console.log(`✅ 服务器已启动`);
      console.log(`   - 本地地址: http://localhost:${config.port}`);
      console.log(`   - API地址: http://localhost:${config.apiPrefix}`);
      console.log(`   - 环境: ${config.nodeEnv}`);
    });

    // 初始化定时任务（仅生产环境）
    if (config.nodeEnv === 'production') {
      console.log('\n⏰ 初始化定时任务...');
      cronManager.initialize();
    } else {
      console.log('\n⚠️ 开发模式下定时任务已禁用');
      console.log('   如需启用，请在.env中将NODE_ENV设置为production');
    }

    // 初始数据采集（开发模式下也执行）
    console.log('\n📊 执行初始数据采集...');
    try {
      await aggregator.fetchAll();
    } catch (error) {
      console.error('初始数据采集失败:', error.message);
    }

    // 优雅关闭
    process.on('SIGTERM', () => gracefulShutdown(server));
    process.on('SIGINT', () => gracefulShutdown(server));

    return server;
  } catch (error) {
    console.error('❌ 启动服务器失败:', error);
    process.exit(1);
  }
}

async function gracefulShutdown(server) {
  console.log('\n🛑 正在关闭服务器...');

  cronManager.stopAll();
  db.close();

  server.close(() => {
    console.log('✅ 服务器已关闭');
    process.exit(0);
  });

  // 强制关闭（30秒后）
  setTimeout(() => {
    console.log('⚠️ 强制关闭服务器');
    process.exit(1);
  }, 30000);
}

// 启动
startServer();

module.exports = app;
