#!/bin/bash
# GitHub仓库创建和代码推送脚本

# 配置信息 - 请替换为你的信息
GITHUB_USERNAME="你的GitHub用户名"
REPO_NAME="industry-ai-tracker-api"
DESCRIPTION="AI智汇后端API服务 - 自动采集和更新AI工具与行业资讯"

echo "🚀 开始创建GitHub仓库并推送代码..."
echo "📝 请确保你已经安装了Git并配置了GitHub账户"

# 检查是否安装了GitHub CLI
if command -v gh &> /dev/null; then
    echo "✅ 检测到GitHub CLI"

    # 使用GitHub CLI创建仓库（需要登录）
    echo "请先登录GitHub CLI: gh auth login"
    echo "然后运行以下命令创建仓库:"
    echo "  gh repo create $REPO_NAME --public --description '$DESCRIPTION'"
    echo "  git remote add origin https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
    echo "  git push -u origin master"

else
    echo "ℹ️  未检测到GitHub CLI，使用Web方式创建仓库"

    echo ""
    echo "📋 方法1: 通过GitHub网页创建仓库"
    echo "================================"
    echo "1. 打开 https://github.com/new"
    echo "2. Repository name 输入: $REPO_NAME"
    echo "3. Description 输入: $DESCRIPTION"
    echo "4. 选择 Public"
    echo "5. 不要勾选 'Add a README file'"
    echo "6. 点击 'Create repository'"
    echo ""
    echo "7. 创建成功后，执行以下命令:"
    echo "   git remote add origin https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
    echo "   git push -u origin master"
    echo ""

    echo "📋 方法2: 使用GitHub API创建仓库（需要Token）"
    echo "============================================="
    echo "1. 创建GitHub Personal Access Token:"
    echo "   - 打开 https://github.com/settings/tokens"
    echo "   - 点击 'Generate new token (classic)'"
    echo "   - 设置名称，选择 'repo' 权限"
    echo "   - 生成token并保存"
    echo ""
    echo "2. 运行以下命令（将YOUR_TOKEN替换为你的token）:"
    echo ""
    cat << 'EOF'
export GITHUB_TOKEN="YOUR_TOKEN"
export GITHUB_USERNAME="你的用户名"

# 创建仓库
curl -X POST -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/user/repos \
  -d "{\"name\":\"$REPO_NAME\",\"description\":\"$DESCRIPTION\",\"private\":false}"

# 添加远程仓库并推送
git remote add origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
git push -u origin master
EOF
fi

echo ""
echo "✅ 完成！仓库创建并推送后，请告诉我，我会继续协助你部署到Railway。"
