const axios = require('axios');
const cheerio = require('cheerio');
const config = require('../config');
const db = require('../models/database');

class AIToolsFetcher {
  constructor() {
    this.client = axios.create({
      timeout: config.requestTimeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    // 知名AI工具列表（备用数据源）
    this.knownTools = [
      {
        name: 'Claude',
        website: 'https://claude.ai',
        category: 'text',
        description: 'Anthropic开发的AI助手，擅长长文档处理和复杂推理',
        pricing: '免费/付费',
        tags: ['对话AI', '代码辅助', '长文本']
      },
      {
        name: 'ChatGPT',
        website: 'https://chatgpt.com',
        category: 'text',
        description: 'OpenAI开发的对话AI模型，支持多轮对话和任务完成',
        pricing: '免费/付费',
        tags: ['对话AI', '写作辅助', '知识问答']
      },
      {
        name: 'Midjourney',
        website: 'https://www.midjourney.com',
        category: 'image',
        description: '强大的AI图像生成工具，支持多种艺术风格',
        pricing: '付费订阅',
        tags: ['图像生成', '艺术创作', '设计']
      },
      {
        name: 'DALL-E 3',
        website: 'https://openai.com/dall-e-3',
        category: 'image',
        description: 'OpenAI的图像生成模型，支持精确的文字描述',
        pricing: '付费使用',
        tags: ['图像生成', 'AI艺术', '设计辅助']
      },
      {
        name: 'Stable Diffusion',
        website: 'https://stability.ai',
        category: 'image',
        description: '开源的AI图像生成模型，支持本地部署',
        pricing: '免费/付费',
        tags: ['图像生成', '开源', '可定制']
      },
      {
        name: 'Runway',
        website: 'https://runwayml.com',
        category: 'video',
        description: 'AI视频生成和编辑平台，支持文本转视频',
        pricing: '付费订阅',
        tags: ['视频生成', '视频编辑', '创意制作']
      },
      {
        name: 'Suno AI',
        website: 'https://suno.ai',
        category: 'audio',
        description: 'AI音乐生成工具，可以根据描述或歌词创作音乐',
        pricing: '免费/付费',
        tags: ['音乐生成', 'AI作曲', '音频创作']
      },
      {
        name: 'ElevenLabs',
        website: 'https://elevenlabs.io',
        category: 'audio',
        description: '高质量AI语音合成平台，支持多语言和声音克隆',
        pricing: '免费/付费',
        tags: ['语音合成', '文本转语音', '配音']
      },
      {
        name: 'GitHub Copilot',
        website: 'https://github.com/features/copilot',
        category: 'code',
        description: 'AI编程助手，支持多种编程语言的代码补全',
        pricing: '付费订阅',
        tags: ['编程辅助', '代码补全', '开发工具']
      },
      {
        name: 'Cursor',
        website: 'https://cursor.sh',
        category: 'code',
        description: 'AI优先的代码编辑器，支持智能代码生成和重构',
        pricing: '免费/付费',
        tags: ['代码编辑器', 'AI编程', '开发环境']
      },
      {
        name: 'Notion AI',
        website: 'https://www.notion.so/product/ai',
        category: 'office',
        description: 'Notion内置的AI助手，支持写作、总结和头脑风暴',
        pricing: '付费订阅',
        tags: ['办公助手', '笔记', '项目管理']
      },
      {
        name: 'Gamma',
        website: 'https://gamma.app',
        category: 'office',
        description: 'AI演示文稿生成工具，快速创建专业PPT',
        pricing: '免费/付费',
        tags: ['演示文稿', 'PPT制作', '幻灯片']
      },
      {
        name: 'Perplexity',
        website: 'https://www.perplexity.ai',
        category: 'data',
        description: 'AI驱动的搜索引擎，提供带来源引用的问题解答',
        pricing: '免费/付费',
        tags: ['搜索引擎', '研究助手', '知识检索']
      },
      {
        name: 'DeepL',
        website: 'https://www.deepl.com',
        category: 'translate',
        description: '高质量AI翻译服务，支持多种语言互译',
        pricing: '免费/付费',
        tags: ['翻译', '多语言', '文本处理']
      },
      {
        name: 'Meshy AI',
        website: 'https://meshy.ai',
        category: '3d',
        description: 'AI 3D建模工具，支持文本生成3D模型',
        pricing: '免费/付费',
        tags: ['3D建模', 'AI生成', '游戏开发']
      },
      {
        name: 'Luma Dream Machine',
        website: 'https://lumalabs.ai/dream-machine',
        category: 'video',
        description: '高质量AI视频生成模型，生成逼真的视频内容',
        pricing: '免费/付费',
        tags: ['视频生成', 'AI创作', '文本转视频']
      },
      {
        name: 'Pika',
        website: 'https://pika.art',
        category: 'video',
        description: 'AI视频生成平台，支持多种创意视频风格',
        pricing: '免费/付费',
        tags: ['视频生成', '创意制作', '动画']
      },
      {
        name: 'Kimi',
        website: 'https://kimi.ai',
        category: 'text',
        description: '国产长文本AI助手，支持超长上下文窗口',
        pricing: '免费',
        tags: ['对话AI', '长文本', '国产AI']
      },
      {
        name: '通义千问',
        website: 'https://tongyi.aliyun.com',
        category: 'text',
        description: '阿里巴巴的大语言模型，支持多场景应用',
        pricing: '免费/付费',
        tags: ['对话AI', '国产AI', '企业服务']
      },
      {
        name: '文心一言',
        website: 'https://yiyan.baidu.com',
        category: 'text',
        description: '百度的大语言模型，支持文学创作和代码编写',
        pricing: '免费/付费',
        tags: ['对话AI', '国产AI', '知识问答']
      }
    ];
  }

  // 从官网获取工具信息
  async fetchFromWebsite(url, toolInfo) {
    try {
      const response = await this.client.get(url, { maxRedirects: 5 });
      const $ = cheerio.load(response.data);

      // 提取网站标题和描述
      const title = $('title').text().trim();
      const metaDesc = $('meta[name="description"]').attr('content') || '';

      // 尝试提取更多信息
      const description = toolInfo.description || metaDesc.substring(0, 300);

      return {
        ...toolInfo,
        fullDescription: description,
        logoUrl: await this.extractLogo(url),
        source: 'Official Website'
      };
    } catch (error) {
      console.error(`获取失败 ${url}: ${error.message}`);
      return {
        ...toolInfo,
        source: 'Known Tool (Direct)'
      };
    }
  }

  async extractLogo(url) {
    try {
      const response = await this.client.get(url);
      const $ = cheerio.load(response.data);

      // 尝试多种方式获取logo
      const favicon = $('link[rel="icon"]').attr('href') ||
                    $('link[rel="shortcut icon"]').attr('href');

      if (favicon) {
        return new URL(favicon, url).href;
      }
    } catch (e) {
      // 忽略错误
    }
    return null;
  }

  // 获取所有已知工具的详细信息
  async fetchKnownTools() {
    console.log('🤖 开始获取AI工具信息...');
    const tools = [];
    const startTime = Date.now();

    // 获取已知工具信息
    for (const tool of this.knownTools) {
      const enrichedTool = await this.fetchFromWebsite(tool.website, tool);
      tools.push({
        ...enrichedTool,
        热度: Math.floor(Math.random() * 10000) + 1000, // 模拟热度
        发布时间: this.getRandomDate(),
        最后更新: new Date().toISOString()
      });
    }

    // 从Product Hunt获取最新工具
    const productHuntTools = await this.fetchProductHunt();
    tools.push(...productHuntTools);

    const duration = Date.now() - startTime;
    console.log(`✅ 完成！获取到 ${tools.length} 个AI工具，耗时 ${duration}ms`);

    return tools;
  }

  async fetchProductHunt() {
    // Product Hunt API需要认证，这里返回空数组作为占位
    // 实际使用时需要配置API Key
    console.log('⚠️ Product Hunt API需要配置API Key，跳过');
    return [];
  }

  getRandomDate() {
    const now = new Date();
    const past = new Date(now.getTime() - Math.random() * 365 * 24 * 60 * 60 * 1000);
    return past.toISOString().split('T')[0];
  }

  // 根据描述自动分类
  autoCategorize(description) {
    const lowerDesc = description.toLowerCase();

    const categoryKeywords = {
      'text': ['text', 'writing', 'chat', 'conversation', 'language model', 'llm', 'gpt', 'claude'],
      'image': ['image', 'art', 'design', 'generation', 'photo', 'picture', 'visual', 'diffusion'],
      'video': ['video', 'motion', 'animation', 'film', 'movie', 'clip'],
      'audio': ['audio', 'music', 'sound', 'voice', 'speech', 'tts', 'suno'],
      'code': ['code', 'programming', 'developer', 'copilot', 'coding', 'git', 'software'],
      'data': ['data', 'search', 'analytics', 'research', 'knowledge', 'information'],
      'office': ['office', 'document', 'presentation', 'slide', 'note', 'productivity', 'notion'],
      'translate': ['translate', 'translation', 'language', 'multilingual'],
      '3d': ['3d', 'model', 'geometry', 'scene', 'mesh']
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => lowerDesc.includes(keyword))) {
        return category;
      }
    }

    return 'text'; // 默认分类
  }

  // 主方法：获取所有AI工具数据
  async fetchAllTools() {
    try {
      const tools = await this.fetchKnownTools();

      // 保存到数据库
      let savedCount = 0;
      for (const tool of tools) {
        try {
          db.insertOrUpdateAITool(tool);
          savedCount++;
        } catch (e) {
          console.error(`保存工具失败: ${tool.name}`, e.message);
        }
      }

      console.log(`💾 已保存 ${savedCount} 个工具到数据库`);
      return { success: true, total: tools.length, saved: savedCount };
    } catch (error) {
      console.error('获取AI工具失败:', error);
      return { success: false, error: error.message, total: 0, saved: 0 };
    }
  }
}

module.exports = new AIToolsFetcher();
