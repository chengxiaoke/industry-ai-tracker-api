#!/bin/bash
# =====================================================
# 一键推送修复代码到GitHub
# 用于修复 Railway 部署崩溃问题
# =====================================================

echo "🚀 AI智汇 - 修复代码推送工具"
echo "========================================"
echo ""

# 颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

step() { echo -e "${BLUE}📌 $1${NC}"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }

# =====================================================
# 第1步：检查Git
# =====================================================
step "检查Git环境..."

if ! command -v git &> /dev/null; then
    error "Git未安装！请先安装Git："
    echo "   Windows: https://git-scm.com/download/win"
    echo "   Mac: brew install git"
    echo "   Linux: sudo apt install git"
    exit 1
fi

success "Git已安装: $(git --version)"

# =====================================================
# 第2步：检查项目目录
# =====================================================
step "检查项目目录..."

# 获取当前目录
PROJECT_DIR=$(pwd)

# 检查是否是Git仓库
if [ ! -d ".git" ]; then
    error "当前目录不是Git仓库！"
    echo "请将项目文件夹下载到本地后，进入目录再运行此脚本"
    echo "   cd industry-ai-tracker-api"
    echo "   ./push-fix-to-github.sh"
    exit 1
fi

success "当前目录: $PROJECT_DIR"

# =====================================================
# 第3步：获取GitHub Token
# =====================================================
step "配置GitHub认证..."

echo ""
echo "请输入你的GitHub Personal Access Token:"
echo "   (用于推送代码到GitHub，输入时不会显示)"
read -s -p "> " GITHUB_TOKEN

if [ ${#GITHUB_TOKEN} -lt 10 ]; then
    error "Token太短，请检查是否输入正确"
    exit 1
fi

echo ""
success "Token已获取"

# =====================================================
# 第4步：修复index.js文件
# =====================================================
step "修复 src/index.js 文件..."

# 检查文件是否存在
if [ ! -f "src/index.js" ]; then
    error "src/index.js 文件不存在！"
    exit 1
fi

# 备份原文件
cp src/index.js src/index.js.backup

# 使用sed修复文件
# 替换第81-83行的内容
sed -i '81,83d' src/index.js
sed -i '80a\    // 数据库表会在首次操作时通过SQLite的IF NOT EXISTS自动创建\n    // 分类和数据源会在API首次访问时动态创建' src/index.js

# 验证修复
if grep -q "数据库表会在首次操作时通过SQLite的IF NOT EXISTS自动创建" src/index.js; then
    success "文件修复成功"
else
    warning "自动修复失败，尝试手动修复..."
    # 手动创建修复后的文件
    cat > src/index.js << 'INDEXJS'
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const config = require('./config');
const db = require('./models/database');
const apiRoutes = require('./routes/api');
const cronManager = require('./cron/jobs');
const aggregator = require('./services/aggregator');

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

    // 数据库表会在首次操作时通过SQLite的IF NOT EXISTS自动创建
    // 分类和数据源会在API首次访问时动态创建

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
INDEXJS
    success "已手动创建修复后的文件"
fi

# =====================================================
# 第5步：配置Git并推送
# =====================================================
step "配置Git用户信息..."

echo ""
echo "请输入你的GitHub用户名:"
read -p "> " GITHUB_USERNAME

echo "请输入你的邮箱:"
read -p "> " GITHUB_EMAIL

git config --global user.name "$GITHUB_USERNAME"
git config --global user.email "$GITHUB_EMAIL"

success "Git配置完成"
echo "   用户名: $GITHUB_USERNAME"
echo "   邮箱: $GITHUB_EMAIL"

# =====================================================
# 第6步：推送到GitHub
# =====================================================
step "添加到Git并提交..."

git add -A

if git diff --cached --quiet; then
    warning "没有需要提交的更改"
else
    git status --short

    echo ""
    echo "提交信息:"
    echo "   Fix: Remove invalid initDbScript call - fixes Railway crash"
    echo ""

    git commit -m "Fix: Remove invalid initDbScript call - fixes Railway crash"

    echo ""
    echo "📤 推送到GitHub..."
fi

# 设置远程URL（包含Token）
REMOTE_URL="https://${GITHUB_TOKEN}@github.com/${GITHUB_USERNAME}/industry-ai-tracker-api.git"

if git remote get-url origin &> /dev/null; then
    CURRENT_ORIGIN=$(git remote get-url origin)
    if [[ "$CURRENT_ORIGIN" != *"github.com"* ]]; then
        git remote set-url origin "$REMOTE_URL"
    fi
else
    git remote add origin "$REMOTE_URL"
fi

# 推送
if git push -u origin master; then
    echo ""
    success "✅ ==============================================="
    success "✅  修复代码已成功推送到GitHub！"
    success "✅ ==============================================="
    echo ""
    echo "📋 GitHub仓库："
    echo "   https://github.com/${GITHUB_USERNAME}/industry-ai-tracker-api"
    echo ""
    echo "🎉 下一步："
    echo "   1. Railway将自动重新部署（1-2分钟内）"
    echo "   2. 或访问 https://railway.app/dashboard 手动Redeploy"
    echo ""
    echo "💡 验证修复："
    echo "   访问 Railway > Deployments > View Logs"
    echo "   应该显示：✅ 服务器已启动"
else
    echo ""
    error "❌ 推送失败！"
    echo ""
    echo "💡 可能的原因："
    echo "   1. Token权限不足（需要repo权限）"
    echo "   2. 网络连接问题"
    echo "   3. 仓库不存在"
    echo ""
    echo "🔧 解决方案："
    echo "   1. 检查Token是否有repo权限"
    echo "   2. 确认网络连接正常"
    echo "   3. 确认仓库存在：https://github.com/${GITHUB_USERNAME}/industry-ai-tracker-api"
fi

echo ""
echo "========================================"
echo "脚本执行完成"
echo "========================================"
