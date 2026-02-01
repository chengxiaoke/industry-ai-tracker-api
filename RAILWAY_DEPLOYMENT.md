# 🚀 Railway部署完整指南

## 概述

本指南将帮助你将 **AI智汇后端API服务** 部署到Railway云平台。部署后，你将获得一个可公开访问的API服务地址，用于为前端网站提供数据支持。

## 📋 目录

- [第一步：准备工作](#第一步准备工作)
- [第二步：创建Railway项目](#第二步创建railway项目)
- [第三步：配置环境变量](#第三步配置环境变量)
- [第四步：部署服务](#第四步部署服务)
- [第五步：验证部署](#第五步验证部署)
- [第六步：更新前端API配置](#第六步更新前端api配置)
- [常见问题排查](#常见问题排查)

---

## 第一步：准备工作

### 1.1 确保已有GitHub仓库

✅ **确认代码已推送**
- 仓库地址：https://github.com/chengxiaoke/industry-ai-tracker-api
- 检查方式：在浏览器中打开上述URL，应该能看到所有文件

### 1.2 注册Railway账户

1. **访问Railway官网**
   ```
   https://railway.app/
   ```

2. **点击 "Start Deploying" 或 "Sign Up"**

3. **选择登录方式**
   - 推荐使用 **GitHub账号登录**（最简单）
   - 也可以使用邮箱注册

4. **授权访问**
   - 如果使用GitHub登录，需要授权Railway访问你的GitHub账户
   - 选择 "Authorize railwayapp"

---

## 第二步：创建Railway项目

### 2.1 新建项目

1. **登录Railway控制台**
   - 访问：https://railway.app/dashboard

2. **点击 "New Project"**
   - 位置：页面右上角或 "Deploy" 标签页

3. **选择部署方式**
   ```
   ✅ Deploy from GitHub repo
   ```

### 2.2 连接GitHub仓库

1. **选择仓库**
   - 在列表中找到：`chengxiaoke/industry-ai-tracker-api`
   - 或者使用搜索框搜索仓库名称

2. **点击仓库名称进行选择**
   ```
   industry-ai-tracker-api
   ```

3. **确认选择**
   - 点击 "Deploy" 按钮

### 2.3 配置基础设置

1. **项目名称（可选）**
   ```
   Industry AI Tracker API
   ```

2. **选择区域（Region）**
   - 推荐选择：**Asia Pacific (Tokyo)** 或 **US East (N. Virginia)**
   - 选择离你最近的区域以获得更好的性能

3. **点击 "Deploy" 开始部署**

---

## 第三步：配置环境变量

### 3.1 进入环境变量设置

1. **部署完成后，点击进入项目**
   - 在项目列表中找到刚创建的项目
   - 点击项目名称进入详情页

2. **点击 "Variables" 标签**
   ```
   📊 Overview | 🚀 Deployments | 🔧 Variables | 📈 Settings
   ```

### 3.2 添加环境变量

在Variables页面，点击 "Add Variable"，添加以下环境变量：

#### 必填变量

```env
# 端口号（Railway会自动设置，但建议保留默认值）
PORT=3000

# Node环境
NODE_ENV=production

# 数据库配置（Railway会自动创建SQLite数据库）
# 不需要手动配置，Railway会自动设置 DATABASE_URL

# 数据源配置（可选，自定义RSS源）
# RSS_FEEDS_1=https://techcrunch.com/feed/
# RSS_FEEDS_2=https://theverge.com/rss/index.xml
```

#### 环境变量说明

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `PORT` | `3000` | 服务端口，Railway会覆盖此值 |
| `NODE_ENV` | `production` | 生产环境模式 |
| `DATABASE_URL` | (自动生成) | SQLite数据库连接字符串，由Railway自动创建 |

### 3.3 保存配置

1. **添加完所有变量后**
   - 变量会自动保存

2. **点击 "Deploy" 重新部署**
   - 位置：顶部或 "Deployments" 标签页

---

## 第四步：部署服务

### 4.1 监控部署进度

1. **进入 "Deployments" 标签页**
   ```
   📊 Overview | 🚀 Deployments | 🔧 Variables | 📈 Settings
   ```

2. **查看部署状态**
   - 🔵 **Building**: 正在构建（安装依赖、编译代码）
   - 🟢 **Deploying**: 正在部署（启动服务）
   - ✅ **Deployed**: 部署成功
   - 🔴 **Failed**: 部署失败

### 4.2 等待构建完成

构建过程通常需要 **2-5分钟**，取决于网络速度。期间会显示：
- 安装的依赖包数量
- 构建日志输出
- 任何错误或警告

### 4.3 部署成功标识

看到以下提示表示部署成功：
```
✅ Deployed
🎉 Your service is live!
```

---

## 第五步：验证部署

### 5.1 获取服务地址

1. **在 "Deployments" 页面**
   - 找到已部署的服务
   - 复制 **"View Logs"** 按钮旁边的URL

2. **服务URL格式**
   ```
   https://your-service-name.up.railway.app
   ```
   例如：
   ```
   https://industry-ai-tracker-api-production.up.railway.app
   ```

### 5.2 测试API端点

使用浏览器或curl测试以下端点：

#### 健康检查
```bash
curl https://你的服务地址.up.railway.app/health
```
预期响应：
```json
{"status":"ok","timestamp":"2026-02-01T..."}
```

#### 获取AI工具列表
```bash
curl https://你的服务地址.up.railway.app/api/v1/ai-tools
```
预期响应：AI工具列表数据

#### 获取行业新闻
```bash
curl https://你的服务地址.up.railway.app/api/v1/news
```
预期响应：行业新闻列表数据

### 5.3 查看日志

1. **点击 "View Logs"**
   - 位置：部署记录旁边的按钮

2. **查看内容**
   - 服务启动日志
   - API请求日志
   - 错误信息（如果有）

---

## 第六步：更新前端API配置

### 6.1 获取API基础地址

假设你的后端服务地址为：
```
https://industry-ai-tracker-api-production.up.railway.app
```

那么API基础地址为：
```
https://industry-ai-tracker-api-production.up.railway.app/api/v1
```

### 6.2 更新前端配置

编辑前端项目文件 `src/App.tsx`，找到：

```typescript
// 开发环境
const API_BASE = '/api/v1'

// 或生产环境（需要修改为你的Railway地址）
// const API_BASE = 'https://your-railway-url.up.railway.app/api/v1'
```

修改为：
```typescript
// 生产环境 - 替换为你的Railway服务地址
const API_BASE = 'https://你的服务地址.up.railway.app/api/v1'
```

### 6.3 重新部署前端

1. **修改配置后**
   - 保存文件
   - 重新构建前端项目

2. **部署到静态托管**
   - 如果使用Vercel/Netlify：自动部署
   - 如果使用GitHub Pages：需要提交代码并等待构建

---

## 常见问题排查

### 问题1：部署失败 - 依赖安装超时

**错误信息**
```
npm ERR! network request to https://registry.npmjs.org/ failed
```

**解决方案**
- Railway会自动重试构建
- 如果持续失败，检查 `package.json` 中的依赖是否正确
- 确保没有使用私有npm仓库

### 问题2：服务启动失败 - 端口错误

**错误信息**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**解决方案**
- Railway会自动分配端口，不需要手动设置
- 确保代码中没有硬编码端口
- 使用 `process.env.PORT || 3000`

### 问题3：数据库连接失败

**错误信息**
```
Error: Cannot open database
```

**解决方案**
- 确保 `DATABASE_URL` 环境变量已设置
- Railway会自动创建SQLite数据库
- 检查数据库文件路径是否正确

### 问题4：API返回500错误

**排查步骤**
1. 点击 "View Logs" 查看详细错误日志
2. 检查代码中是否有未捕获的异常
3. 确认所有必要的环境变量已设置

### 问题5：静态资源无法访问

**排查步骤**
1. 确认服务已完全启动
2. 检查API基础URL是否正确
3. 使用curl测试端点返回的数据格式

---

## 📊 部署完成后的数据

部署成功后，你将拥有：

- ✅ **后端API服务**：自动采集和更新AI工具与行业资讯
- ✅ **定时任务**：
  - 每天3:00 AM 更新AI工具数据
  - 每6小时 更新新闻数据
  - 每周日 更新GitHub趋势
- ✅ **RESTful API接口**：
  - `GET /api/v1/ai-tools` - 获取AI工具列表
  - `GET /api/v1/news` - 获取行业新闻
  - `GET /api/v1/stats` - 获取统计数据
  - `POST /api/v1/fetch/all` - 手动触发数据更新

---

## 🎉 下一步

1. **测试所有API端点**
2. **更新前端配置**
3. **访问前端网站验证数据展示**

---

## 📞 获取帮助

如果遇到问题：
- Railway文档：https://docs.railway.app/
- GitHub Issues：在你的仓库中创建Issue
- 查看日志：点击 "View Logs" 查看详细错误信息

**祝你部署顺利！** 🚀
