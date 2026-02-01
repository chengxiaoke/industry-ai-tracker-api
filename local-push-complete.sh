#!/bin/bash
# =====================================================
# 完整的GitHub推送脚本 - 本地运行版本
# =====================================================
# 使用方法：
# 1. 将整个 industry-ai-tracker-api 文件夹下载到你的电脑
# 2. 双击运行此脚本，或在终端执行：chmod +x local-push-complete.sh && ./local-push-complete.sh
# =====================================================

echo "🚀 AI智汇后端项目 - GitHub完整推送脚本"
echo "========================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 步骤提示函数
step() {
    echo -e "${BLUE}📌 $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# =====================================================
# 第1步：检查环境
# =====================================================
step "步骤1/5：检查环境..."

# 检查Git是否安装
if ! command -v git &> /dev/null; then
    error "Git未安装！请先安装Git："
    echo "   Windows: https://git-scm.com/download/win"
    echo "   Mac: brew install git"
    echo "   Linux: sudo apt install git"
    exit 1
fi
success "Git已安装: $(git --version)"

# 获取当前目录
CURRENT_DIR=$(pwd)
success "当前目录: $CURRENT_DIR"

# =====================================================
# 第2步：配置Git用户信息
# =====================================================
step "步骤2/5：配置Git用户信息..."

echo ""
echo "请输入你的GitHub用户名（纯字母数字，不要包含空格）:"
read -p "> " GITHUB_USERNAME

echo "请输入你的邮箱地址:"
read -p "> " GITHUB_EMAIL

# 配置Git
git config --global user.name "$GITHUB_USERNAME"
git config --global user.email "$GITHUB_EMAIL"
success "Git配置完成"
echo "   用户名: $GITHUB_USERNAME"
echo "   邮箱: $GITHUB_EMAIL"

# =====================================================
# 第3步：获取GitHub Token
# =====================================================
step "步骤3/5：获取GitHub Personal Access Token..."

echo ""
echo "ℹ️  GitHub Token是用于API访问的密码，不是普通密码"
echo ""

while true; do
    echo "请输入你的GitHub Personal Access Token:"
    echo "   (输入时不会显示，这是正常的)"
    read -s -p "> " GITHUB_TOKEN
    echo ""

    # 验证Token格式
    if [[ ${#GITHUB_TOKEN} -lt 10 ]]; then
        error "Token太短，请检查是否输入正确"
        continue
    fi

    # 测试Token是否有效
    echo "🔍 验证Token中..."
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
        -H "Authorization: token $GITHUB_TOKEN" \
        https://api.github.com/user)

    if [ "$RESPONSE" = "200" ]; then
        success "Token验证成功！"
        break
    else
        error "Token验证失败 (HTTP $RESPONSE)"
        echo "请重新输入，或创建新的Token"
        echo ""
        echo "创建Token步骤："
        echo "   1. 打开 https://github.com/settings/tokens"
        echo "   2. 点击 'Generate new token (classic)'"
        echo "   3. Note填写: 'Industry AI Tracker'"
        echo "   4. 勾选 'repo' 权限"
        echo "   5. 点击生成并复制Token"
        echo ""
    fi
done

# =====================================================
# 第4步：推送到GitHub
# =====================================================
step "步骤4/5：推送到GitHub..."

# 设置远程仓库URL（包含Token）
REMOTE_URL="https://${GITHUB_TOKEN}@github.com/${GITHUB_USERNAME}/industry-ai-tracker-api.git"

# 检查远程是否已存在
if git remote get-url origin &> /dev/null; then
    CURRENT_ORIGIN=$(git remote get-url origin)
    if [[ "$CURRENT_ORIGIN" == *"github.com"* ]]; then
        echo "ℹ️  已配置远程仓库: $CURRENT_ORIGIN"
        echo "   是否更新为新的URL? (y/n)"
        read -p "> " UPDATE_REMOTE
        if [[ "$UPDATE_REMOTE" == "y" || "$UPDATE_REMOTE" == "Y" ]]; then
            git remote set-url origin "$REMOTE_URL"
            success "远程仓库URL已更新"
        fi
    fi
else
    git remote add origin "$REMOTE_URL"
    success "远程仓库已添加"
fi

# 推送代码
echo ""
echo "📤 开始推送代码到GitHub..."
echo "   仓库: https://github.com/$GITHUB_USERNAME/industry-ai-tracker-api"
echo ""

if git push -u origin master; then
    success "推送成功！"
else
    error "推送失败！"
    echo ""
    echo "可能的解决方案："
    echo "   1. 检查Token是否有repo权限"
    echo "   2. 确保仓库不存在或已删除"
    echo "   3. 本地是否有未提交的更改？"
    exit 1
fi

# =====================================================
# 第5步：验证结果
# =====================================================
step "步骤5/5：验证推送结果..."

# 等待几秒让GitHub更新
sleep 3

# 检查仓库是否存在
REPO_CHECK=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: token $GITHUB_TOKEN" \
    "https://api.github.com/repos/${GITHUB_USERNAME}/industry-ai-tracker-api")

if [ "$REPO_CHECK" = "200" ]; then
    success "✅ 仓库访问成功！"
    echo ""
    echo "🎉 ==============================================="
    echo "🎉  恭喜！代码已成功推送到GitHub！"
    echo "🎉 ==============================================="
    echo ""
    echo "📋 仓库信息："
    echo "   仓库地址: https://github.com/${GITHUB_USERNAME}/industry-ai-tracker-api"
    echo "   仓库类型: 公开仓库"
    echo ""
    echo "📦 已推送的内容："
    git log --oneline -3
    echo ""
    echo "🚀 下一步：部署到Railway"
    echo "   访问: https://railway.app/new"
    echo "   选择: 'Deploy from GitHub repo'"
    echo ""
    echo "💡 提示：将此脚本保存好，下次部署可能还需要用到！"
else
    warning "仓库访问检查返回: HTTP $REPO_CHECK"
    echo "请手动访问仓库页面确认："
    echo "   https://github.com/${GITHUB_USERNAME}/industry-ai-tracker-api"
fi

echo ""
echo "========================================"
echo "脚本执行完成"
echo "========================================"
