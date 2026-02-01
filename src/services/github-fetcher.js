const axios = require('axios');
const cheerio = require('cheerio');
const config = require('../config');
const db = require('../models/database');

class GitHubTrendingFetcher {
  constructor() {
    this.client = axios.create({
      timeout: config.requestTimeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
  }

  async fetchTrending(language = 'javascript', since = 'daily') {
    try {
      console.log(`🔍 正在获取GitHub趋势: language=${language}, since=${since}`);
      const url = `${config.githubTrendingUrl}?l=${language}&since=${since}`;

      // 添加更多请求头，模拟真实浏览器
      const response = await this.client.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Cache-Control': 'max-age=0',
        }
      });

      const $ = cheerio.load(response.data);
      const repos = [];

      // GitHub已更新HTML结构，使用新的选择器
      // 新结构: <article class="Box-row"> 或直接使用 li 元素
      $('li.repo-list-item, article.Box-row, .repo-list li').each((i, el) => {
        const repoEl = $(el);

        // 尝试多种方式获取仓库名称
        let name = '';
        const h2Link = repoEl.find('h2 a');
        const h3Link = repoEl.find('h3 a');

        if (h2Link.length > 0) {
          name = h2Link.text().trim().replace(/\s+/g, ' ').replace(/\s+/g, '');
        } else if (h3Link.length > 0) {
          name = h3Link.text().trim().replace(/\s+/g, ' ').replace(/\s+/g, '');
        } else {
          // 尝试直接获取链接
          const directLink = repoEl.find('a[href^="/"]').first();
          if (directLink.length > 0) {
            name = directLink.text().trim().replace(/\s+/g, ' ').replace(/\s+/g, '');
          }
        }

        if (!name) return; // 跳过无效项

        const description = repoEl.find('p').text().trim() || '';
        let url = '';

        const linkEl = repoEl.find('h2 a, h3 a, a[href^="/"]').first();
        if (linkEl.length > 0 && linkEl.attr('href')) {
          url = 'https://github.com' + linkEl.attr('href');
        }

        // 获取编程语言
        let language = '';
        const langEl = repoEl.find('[itemprop="programmingLanguage"], .repo-language-color + span, span.color-fg-default');
        if (langEl.length > 0) {
          language = langEl.text().trim();
        } else {
          // 尝试从文本中提取语言
          const langTextEl = repoEl.find('.d-inline-block span').first();
          if (langTextEl.length > 0) {
            language = langTextEl.text().trim();
          }
        }

        // 获取星标数
        let stars = 0;
        const starsLink = repoEl.find('a[href*="stargazers"], a.Link--muted');
        if (starsLink.length > 0) {
          stars = this.parseStars(starsLink.text().trim());
        }

        // 获取今日新增星标
        let todayStars = 0;
        const todayStarsEl = repoEl.find('.float-right, .d-inline-block span.text-gray-dark');
        if (todayStarsEl.length > 0) {
          todayStarsEl.each((i, span) => {
            const text = $(span).text().trim();
            if (text.includes('stars today') || text.includes('今日')) {
              todayStars = this.parseStars(text.replace('stars today', '').replace('今日', ''));
            }
          });
        }

        // 获取Fork数
        let forks = 0;

        // 检测是否是AI相关项目
        if (this.isAIRelated(name + ' ' + description + ' ' + language)) {
          repos.push({
            name,
            description,
            url,
            language,
            stars,
            forks,
            todayStars,
            category: this.categorizeRepo(name, description, language),
            source: 'GitHub Trending',
            publishDate: new Date().toISOString()
          });
        }
      });

      console.log(`   ✅ 获取到 ${repos.length} 个AI相关项目`);
      return { success: true, repos };
    } catch (error) {
      console.error(`   ❌ 获取失败: ${error.message}`);
      // 如果是网络错误，返回空结果而不是错误
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.message.includes('network')) {
        console.error(`   ⚠️ 网络连接失败，可能是GitHub被屏蔽或网络问题`);
        return { success: true, repos: [], warning: '网络连接失败' };
      }
      return { success: false, error: error.message, repos: [] };
    }
  }

  parseStars(text) {
    if (!text) return 0;
    text = text.trim().toUpperCase();
    if (text.includes('K')) {
      return parseFloat(text) * 1000;
    }
    return parseInt(text) || 0;
  }

  isAIRelated(text) {
    const aiKeywords = [
      'ai', 'artificial intelligence', 'machine learning', 'deep learning',
      'neural', 'llm', 'gpt', 'transformer', 'nlp', 'computer vision',
      'chatbot', 'generative', 'diffusion', 'stable diffusion', 'midjourney',
      'tensorflow', 'pytorch', 'huggingface', 'langchain', 'autogpt',
      'copilot', 'code assistant', 'text generation', 'image generation',
      'voice', 'speech', 'audio generation', 'music generation'
    ];

    const lowerText = text.toLowerCase();
    return aiKeywords.some(keyword => lowerText.includes(keyword));
  }

  categorizeRepo(name, description, language) {
    const lowerText = (name + ' ' + description).toLowerCase();

    if (/\b(gpt|llm|chatbot|conversation|text.*generation|language.*model)\b/i.test(lowerText)) {
      return 'text';
    }
    if (/\b(stable.?diffusion|midjourney|image.*generation|diffusion|art.*generator|picture|visual)\b/i.test(lowerText)) {
      return 'image';
    }
    if (/\b(video|motion|animation|frame)\b/i.test(lowerText)) {
      return 'video';
    }
    if (/\b(audio|speech|voice|tts|music|sound)\b/i.test(lowerText)) {
      return 'audio';
    }
    if (/\b(code|programming|developer|copilot|assistant|cli|tool)\b/i.test(lowerText)) {
      return 'code';
    }
    if (/\b(search|research|data|analytics|knowledge|rag)\b/i.test(lowerText)) {
      return 'data';
    }

    return 'code'; // 默认归类为代码辅助
  }

  async fetchAllLanguages() {
    const languages = ['javascript', 'python', 'typescript', 'go', 'rust', 'java'];
    const allRepos = [];

    for (const lang of languages) {
      const result = await this.fetchTrending(lang, 'daily');
      if (result.success) {
        allRepos.push(...result.repos);
      }
    }

    // 去重
    const uniqueRepos = allRepos.filter((repo, index, self) =>
      index === self.findIndex(r => r.url === repo.url)
    );

    console.log(`📊 GitHub趋势总计获取 ${uniqueRepos.length} 个项目`);
    return uniqueRepos;
  }
}

module.exports = new GitHubTrendingFetcher();
