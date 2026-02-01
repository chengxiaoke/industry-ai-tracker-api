---
AIGC:
    ContentProducer: Minimax Agent AI
    ContentPropagator: Minimax Agent AI
    Label: AIGC
    ProduceID: "00000000000000000000000000000000"
    PropagateID: "00000000000000000000000000000000"
    ReservedCode1: 30440220410aca3c1056f7b3947868ad7b1c6fcad59b6d2818c67852b4be91eba5da04d702206298d42122dde62a2791da50f0fb75511005ce0bab73391df1e65025ccf53c3c
    ReservedCode2: 3046022100eedb48f5dca009f011fe9da608aa4302916a9ca17010c440ab769f6c134bd49a022100e89dff9c716315bd1a90822d5fb9a3bf2da0223f01c53dc935de4defdd5cda8e
---

# AI智汇 - 自动数据采集系统

本系统用于自动采集和更新AI工具与行业资讯数据。

## 功能特性

- 🤖 自动采集知名AI工具信息
- 📰 自动聚合科技行业RSS资讯
- 🐙 自动追踪GitHub AI趋势项目
- ⏰ 定时任务自动更新数据
- 📊 提供RESTful API接口
- 💾 SQLite数据库存储

## 快速开始

### 1. 安装依赖

```bash
cd industry-ai-tracker-api
npm install
```

### 2. 初始化数据库

```bash
npm run db:init
```

### 3. 启动服务

开发模式（不启动定时任务）：

```bash
npm run dev
```

生产模式（启动定时任务）：

```bash
NODE_ENV=production npm start
```

## 可用脚本

```bash
# 初始化数据库
npm run db:init

# 仅采集AI工具
npm run fetch:ai-tools

# 仅采集行业资讯
npm run fetch:news

# 启动开发服务器
npm run dev

# 启动生产服务器
npm start
```

## API接口

### AI工具

- `GET /api/v1/ai-tools` - 获取AI工具列表
  - 参数: `category`, `search`, `limit`
- `GET /api/v1/ai-tools/:id` - 获取工具详情

### 行业资讯

- `GET /api/v1/news` - 获取资讯列表
  - 参数: `category`, `search`, `limit`
- `GET /api/v1/news/:id` - 获取资讯详情

### 分类

- `GET /api/v1/categories` - 获取所有分类
  - 参数: `type` (ai_tool | news)

### 统计

- `GET /api/v1/stats` - 获取统计数据

### 数据采集

- `POST /api/v1/fetch/ai-tools` - 手动触发AI工具更新
- `POST /api/v1/fetch/news` - 手动触发资讯更新
- `POST /api/v1/fetch/all` - 手动触发全量更新
- `GET /api/v1/logs` - 获取采集日志

### 健康检查

- `GET /api/v1/health` - 服务健康状态

## 定时任务

系统内置以下定时任务（生产模式）：

| 任务 | 频率 | 说明 |
|------|------|------|
| AI工具更新 | 每天 3:00 | 更新已知AI工具信息 |
| 行业资讯更新 | 每6小时 | 抓取最新行业资讯 |
| GitHub趋势 | 每周日 00:00 | 抓取AI相关趋势项目 |
| 全量更新 | 每天 4:00 | 执行完整数据同步 |

## 数据来源

### AI工具

- 知名AI工具官网
- Product Hunt（需要API Key）
- GitHub Trending

### 行业资讯

- TechCrunch
- The Verge
- Google AI Blog
- OpenAI Blog
- Netflix Tech Blog

## 配置说明

复制 `.env.example` 为 `.env` 并修改：

```env
PORT=3001                    # 服务端口
NODE_ENV=development         # 环境（development | production）
DATABASE_URL=./data/ai-tracker.db  # 数据库路径
FETCH_INTERVAL_AI_TOOLS=24   # AI工具更新间隔（小时）
FETCH_INTERVAL_NEWS=6        # 资讯更新间隔（小时）
REQUEST_TIMEOUT=30000        # 请求超时（毫秒）
```

## 技术栈

- **后端**: Node.js + Express
- **数据库**: SQLite (better-sqlite3)
- **任务调度**: node-cron
- **数据采集**: axios + cheerio
- **前端**: React + Vite

## 项目结构

```
industry-ai-tracker-api/
├── src/
│   ├── config/           # 配置文件
│   ├── models/           # 数据模型
│   ├── routes/           # API路由
│   ├── services/         # 数据采集服务
│   ├── cron/             # 定时任务
│   ├── scripts/          # 脚本文件
│   └── index.js          # 入口文件
├── data/                 # 数据库存储目录
├── .env                  # 环境变量
└── package.json
```

## 扩展到Supabase

如需使用Supabase作为生产数据库：

1. 创建Supabase项目
2. 运行 `supabase db push` 同步数据库结构
3. 更新 `.env` 中的 `DATABASE_URL` 为Supabase连接字符串

## License

MIT
