#!/bin/bash
# =====================================================
# 推送修复代码到GitHub并更新Railway部署
# 修复内容：
# 1. GitHub趋势采集CSS选择器更新
# 2. 添加更完善的错误处理
# =====================================================

echo "🚀 推送GitHub趋势修复代码到GitHub"
echo "========================================"
echo ""

cd "$(dirname "$0")"

# 检查Git状态
echo "📋 检查更改..."
git status --short

echo ""
echo "📝 变更内容："
echo "   - 更新 github-fetcher.js：修复GitHub HTML结构变化导致的采集失败"
echo "   - 更新CSS选择器以匹配新的GitHub趋势页面"
echo "   - 添加更完善的错误处理和网络连接检查"
echo "   - 添加模拟浏览器请求头以避免被封锁"
echo ""

# 添加更改
git add -A

# 检查是否有更改
if git diff --cached --quiet; then
    echo "✅ 没有新的更改需要推送"
    exit 0
fi

echo "📦 待推送的文件："
git status --short

echo ""
echo "📝 提交信息："
echo "   Fix: Update GitHub trending fetcher for new HTML structure"
echo ""

# 创建提交
git commit -m "Fix: Update GitHub trending fetcher for new HTML structure"

# 推送到GitHub
echo "📤 推送到GitHub..."
echo ""

if git push origin master; then
    echo ""
    echo "✅ ==============================================="
    echo "✅  推送成功！GitHub仓库已更新"
    echo "✅ ==============================================="
    echo ""
    echo "📋 GitHub仓库："
    echo "   https://github.com/chengxiaoke/industry-ai-tracker-api"
    echo ""
    echo "🎉 下一步操作："
    echo "   1. 访问 Railway：https://railway.app/dashboard"
    echo "   2. 进入 industry-ai-tracker-api 项目"
    echo "   3. 点击 'Deployments' 标签"
    echo "   4. 查看是否自动部署，或点击 'Deploy' 手动触发"
    echo ""
    echo "⚠️ 重要：还需要在Railway中配置RSS_FEEDS环境变量！"
    echo "   访问 Railway → Variables → 添加以下变量："
    echo ""
    echo "   RSS_FEEDS=["
    echo '     "https://techcrunch.com/feed/",'
    echo '     "https://www.theverge.com/rss/index.xml",'
    echo '     "https://blog.google/technology/ai/rss/",'
    echo '     "https://openai.com/blog/rss.xml",'
    echo '     "https://engineering.fb.com/feed/",'
    echo '     "https://netflixtechblog.com/feed"'
    echo "   ]"
    echo ""
else
    echo ""
    echo "❌ 推送失败！"
    echo ""
    echo "💡 提示："
    echo "   1. 如果看到 'non-fast-forward' 错误，先执行：git pull"
    echo "   2. 然后再次运行此脚本"
    echo ""
fi

echo ""
echo "========================================"
