#!/bin/bash
# GitHub自动化推送脚本 - 完全自动化版

# ========================================
# 配置区域 - 请修改以下信息
# ========================================
GITHUB_USERNAME="your_username"      # 替换为你的GitHub用户名
GITHUB_EMAIL="your_email@example.com" # 替换为你的邮箱
GITHUB_TOKEN="ghp_your_token_here"   # 替换为你的GitHub Personal Access Token
REPO_NAME="industry-ai-tracker-api"   # 仓库名称
DESCRIPTION="AI智汇后端API服务 - 自动采集和更新AI工具与行业资讯"
# ========================================

echo "🚀 开始自动化GitHub仓库创建和代码推送..."
echo "📦 仓库信息:"
echo "   用户名: $GITHUB_USERNAME"
echo "   仓库名: $REPO_NAME"
echo "   描述: $DESCRIPTION"
echo ""

# 检查配置
if [ "$GITHUB_USERNAME" = "your_username" ]; then
    echo "❌ 错误: 请先修改脚本中的配置信息"
    echo "   1. 打开 push-to-github-automated.sh 文件"
    echo "   2. 修改 GITHUB_USERNAME 为你的GitHub用户名"
    echo "   3. 修改 GITHUB_EMAIL 为你的邮箱"
    echo "   4. 修改 GITHUB_TOKEN 为你的GitHub Personal Access Token"
    exit 1
fi

# 1. 配置Git用户信息
echo "🔧 配置Git用户信息..."
git config --global user.email "$GITHUB_EMAIL"
git config --global user.name "$GITHUB_USERNAME"
echo "✅ Git配置完成"

# 2. 检查远程仓库是否已存在
echo "🔍 检查仓库是否存在..."
EXISTING_REPO=$(curl -s -o /dev/null -w "%{http_code}" \
  -H "Authorization: token $GITHUB_TOKEN" \
  https://api.github.com/repos/$GITHUB_USERNAME/$REPO_NAME)

if [ "$EXISTING_REPO" = "200" ]; then
    echo "⚠️  仓库已存在，跳过创建步骤"
else
    # 3. 创建GitHub仓库
    echo "📦 创建GitHub仓库..."
    CREATE_RESPONSE=$(curl -s -X POST \
      -H "Authorization: token $GITHUB_TOKEN" \
      -H "Accept: application/vnd.github.v3+json" \
      https://api.github.com/user/repos \
      -d "{\"name\":\"$REPO_NAME\",\"description\":\"$DESCRIPTION\",\"private\":false}")

    # 检查创建是否成功
    CREATED=$(echo $CREATE_RESPONSE | grep -o '"id"' | head -1)
    if [ -n "$CREATED" ]; then
        echo "✅ GitHub仓库创建成功!"
    else
        echo "❌ 创建仓库失败"
        echo "响应: $CREATE_RESPONSE"
        exit 1
    fi
fi

# 4. 添加远程仓库并推送
echo "🔗 添加远程仓库..."
git remote remove origin 2>/dev/null
git remote add origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
echo "✅ 远程仓库添加成功"

# 5. 推送代码
echo "📤 推送代码到GitHub..."
if git push -u origin master; then
    echo ""
    echo "✅ ================================================="
    echo "✅  成功！代码已推送到GitHub！"
    echo "✅ ================================================="
    echo ""
    echo "📋 仓库地址:"
    echo "   https://github.com/$GITHUB_USERNAME/$REPO_NAME"
    echo ""
    echo "🎉 下一步: 部署到Railway"
    echo "   请告诉我已完成推送，我会帮你部署到Railway"
else
    echo "❌ 推送失败，可能是权限问题"
    echo "💡 提示:"
    echo "   1. 检查GitHub Token是否有repo权限"
    echo "   2. 确保Token未过期"
fi
