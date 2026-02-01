---
AIGC:
    ContentProducer: Minimax Agent AI
    ContentPropagator: Minimax Agent AI
    Label: AIGC
    ProduceID: "00000000000000000000000000000000"
    PropagateID: "00000000000000000000000000000000"
    ReservedCode1: 3046022100a3a09c5fc7d93496e81bd65000a1bcdcea3933a3fe45a211402e9b92d84840f2022100f6c93bc8ecb8dd00b855708daf67267bfe6cb09d2bd8dc74b78e52623721ea73
    ReservedCode2: 304502207a192182306723db695a0c45345f9755acb0ab687216df849224ab4c9b7a8cb4022100a4c19f74a9c577e77636ff1686ca6b028c252e0d3a1fc7bcc6ae69859b03e2dc
---

# 🚀 GitHub上传完整指南

## 方式一：使用自动化脚本（推荐）⭐

### 步骤1：获取GitHub Personal Access Token

1. **打开GitHub Token创建页面**
   ```
   https://github.com/settings/tokens
   ```

2. **点击 "Generate new token (classic)"**
   - 点击绿色的 "Generate new token" 按钮
   - 选择 "classic" 选项

3. **配置Token信息**
   - **Note**: 输入 "Industry AI Tracker"
   - **Expiration**: 选择 "No expiration"（或自定义期限）
   - **Select scopes**: ✅ 勾选 `repo` （完整控制私有和公开仓库）

4. **生成并保存Token**
   ```
   ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
   ⚠️ **重要**: 这个token只显示一次，请立即复制并保存！

### 步骤2：配置自动化脚本

1. **编辑脚本文件**
   ```bash
   cd /workspace/industry-ai-tracker-api
   nano push-to-github-automated.sh
   ```

2. **修改以下配置**（按Ctrl+O保存，Ctrl+X退出）
   ```bash
   GITHUB_USERNAME="你的GitHub用户名"
   GITHUB_EMAIL="your_email@example.com"
   GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
   ```

### 步骤3：运行自动化脚本

```bash
# 给脚本添加执行权限
chmod +x push-to-github-automated.sh

# 运行脚本
./push-to-github-automated.sh
```

### 预期输出
```
🚀 开始自动化GitHub仓库创建和代码推送...
📦 仓库信息:
   用户名: your_username
   仓库名: industry-ai-tracker-api
   描述: AI智汇后端API服务 - 自动采集和更新AI工具与行业资讯

🔧 配置Git用户信息...
✅ Git配置完成

🔍 检查仓库是否存在...
📦 创建GitHub仓库...
✅ GitHub仓库创建成功!

🔗 添加远程仓库...
✅ 远程仓库添加成功

📤 推送代码到GitHub...
To https://github.com/your_username/industry-ai-tracker-api.git
 * [new branch]      master -> master
Branch 'master' set up to track 'origin'.

✅ =================================================
✅  成功！代码已推送到GitHub！
✅ =================================================

📋 仓库地址:
   https://github.com/your_username/industry-ai-tracker-api
```

---

## 方式二：手动操作（详细图文步骤）

### 步骤1：创建GitHub仓库

1. **登录GitHub**
   - 打开 https://github.com
   - 登录你的账户

2. **创建新仓库**
   - 点击右上角 "+" → "New repository"
   - 或者直接打开: https://github.com/new

3. **填写仓库信息**
   ```
   Repository name: industry-ai-tracker-api
   Description: AI智汇后端API服务 - 自动采集和更新AI工具与行业资讯
   Visibility: Public (选择公开)
   ☑️ Add a README file: ❌ 不勾选
   ☑️ Add .gitignore: ❌ 不勾选
   ☑️ Choose a license: ❌ 不勾选
   ```

4. **创建仓库**
   - 点击 "Create repository"
   - 创建成功后，页面会显示仓库URL

### 步骤2：连接本地仓库并推送

在终端中执行以下命令（替换为你的信息）:

```bash
# 进入项目目录
cd /workspace/industry-ai-tracker-api

# 配置Git用户信息
git config user.email "your_email@example.com"
git config user.username "你的GitHub用户名"

# 添加远程仓库（替换URL中的 your_username）
git remote add origin https://github.com/你的用户名/industry-ai-tracker-api.git

# 推送代码
git push -u origin master
```

### 步骤3：输入凭证

- **Username**: 输入你的GitHub用户名
- **Password**: 输入你的GitHub Personal Access Token（不是密码！）

---

## 验证上传成功

1. **打开浏览器访问**
   ```
   https://github.com/你的用户名/industry-ai-tracker-api
   ```

2. **你应该看到**
   - ✅ 所有源代码文件
   - ✅ README.md
   - ✅ package.json
   - ✅ .env.example

---

## 常见问题排查

### 问题1: Permission denied
```bash
# 错误信息
remote: Permission to username/repo.git denied to username.
fatal: unable to access 'https://github.com/.../': The requested URL returned error: 403
```

**解决方案**: 使用Personal Access Token而不是密码

### 问题2: Token没有权限
```bash
# 错误信息
"message": "Resource not accessible by integration"
```

**解决方案**: 确保创建Token时勾选了 `repo` 权限

### 问题3: 仓库已存在
```bash
# 错误信息
remote: Repository already exists.
```

**解决方案**:
```bash
# 删除现有的远程仓库配置
git remote remove origin

# 或者重命名当前分支并推送
git branch -M main
git push -u origin main
```

---

## 下一步操作

代码成功上传到GitHub后，请告诉我：
1. ✅ GitHub仓库URL
2. 我将帮你部署到Railway

或者你可以直接按照以下链接继续：
- [Railway部署指南](https://github.com/your_username/industry-ai-tracker-api#deployment)
