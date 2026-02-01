#!/bin/bash
# =====================================================
# 一键推送到GitHub（包含最新部署配置）
# =====================================================

echo "🚀 推送到GitHub - Railway部署准备"
echo "========================================"
echo ""

# 检查是否有新的更改
cd "$(dirname \"$0\")\"

# 添加所有文件
git add -A

# 检查状态
if git diff --cached --quiet; then
    echo \"✅ 没有新的更改需要推送\"
else
    # 显示更改
    echo \"📦 待推送的文件：\"
    git status --short

    echo \"\"
    echo \"📝 提交信息：\"
    echo \"   Update: Railway deployment configuration\"
    echo \"\"

    # 创建提交
    git commit -m \"Update: Railway deployment configuration\"

    # 推送到GitHub
    echo \"📤 推送到GitHub...\"

    if git push origin master; then
        echo \"\"
        echo \"✅ ===============================================\"
        echo \"✅  推送成功！GitHub仓库已更新\"
        echo \"✅ ===============================================\"
        echo \"\"
        echo \"📋 GitHub仓库：\"
        echo \"   https://github.com/chengxiaoke/industry-ai-tracker-api\"
        echo \"\"
        echo \"🎉 下一步：部署到Railway\"
        echo \"   访问：https://railway.app/new\"
        echo \"\"
    else
        echo \"\"
        echo \"❌ 推送失败！\"
        echo \"\"
        echo \"💡 可能的原因：\"
        echo \"   1. 需要GitHub认证（使用Token）\"
        echo \"   2. 本地代码与远程代码有冲突\"
        echo \"   3. 网络连接问题\"
        echo \"\"
        echo \"🔧 解决方案：\"
        echo \"   1. 运行：git pull\"
        echo \"   2. 然后再次运行此脚本\"
    fi
fi

echo \"\"
echo \"========================================\"
