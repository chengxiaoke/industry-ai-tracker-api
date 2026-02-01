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
      const response = await this.client.get(url);
      const $ = cheerio.load(response.data);

      const repos = [];

      $('article.repository-list li').each((i, el) => {
        const repoEl = $(el);

        const name = repoEl.find('h2 a').text().trim().replace(/\s+/g, '');
        const description = repoEl.find('p').text().trim();
        const url = 'https://github.com' + repoEl.find('h2 a').attr('href');

        const langEl = repoEl.find('[itemprop="programmingLanguage"]');
        const language = langEl.text().trim();

        const starsText = repoEl.find('a[href*="stargazers"]').text().trim();
        const stars = this.parseStars(starsText);

        const forksText = repoEl.find('a[href*="forks"]').text().trim();
        const forks = this.parseStars(forksText);

        const todayStarsText = repoEl.find('.float-right').last().text().trim();
        const todayStars = this.parseStars(todayStarsText);

        // 检测是否是AI相关项目
        if (this.isAIRelated(name + ' ' + description)) {
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
