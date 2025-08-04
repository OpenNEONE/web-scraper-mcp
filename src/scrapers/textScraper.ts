import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs-extra';
import * as path from 'path';

export interface TextContent {
  title: string;
  headings: {
    level: number;
    text: string;
  }[];
  paragraphs: string[];
  links: {
    text: string;
    href: string;
  }[];
  lists: {
    items: string[];
    ordered: boolean;
  }[];
  quotes: string[];
  codeBlocks: {
    language?: string;
    code: string;
  }[];
  metadata: {
    description?: string;
    keywords?: string[];
    author?: string;
    publishDate?: string;
    lastModified?: string;
  };
  extractedAt: string;
}

export class TextScraper {
  private readonly outputDir: string = './scraped-text';
  private readonly excludeSelectors: string[] = [
    'script',
    'style',
    'noscript',
    'iframe',
    'embed',
    'object',
    'video',
    'audio',
    'canvas',
    'svg',
    'nav',
    'footer',
    'header',
    'aside'
  ];

  constructor(outputDir?: string) {
    if (outputDir) {
      this.outputDir = outputDir;
    }
  }

  /**
   * 从指定URL提取文本内容
   */
  async scrapeTextFromUrl(url: string): Promise<TextContent> {
    try {
      // 创建输出目录
      await fs.ensureDir(this.outputDir);

      // 获取页面内容
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 15000
      });

      const $ = cheerio.load(response.data);
      const content: TextContent = {
        title: '',
        headings: [],
        paragraphs: [],
        links: [],
        lists: [],
        quotes: [],
        codeBlocks: [],
        metadata: {},
        extractedAt: new Date().toISOString()
      };

      // 提取标题
      content.title = this.extractTitle($);

      // 提取元数据
      content.metadata = this.extractMetadata($);

      // 提取标题层级
      content.headings = this.extractHeadings($);

      // 提取段落
      content.paragraphs = this.extractParagraphs($);

      // 提取链接
      content.links = this.extractLinks($, url);

      // 提取列表
      content.lists = this.extractLists($);

      // 提取引用
      content.quotes = this.extractQuotes($);

      // 提取代码块
      content.codeBlocks = this.extractCodeBlocks($);

      // 保存到文件
      await this.saveToFile(content, url);

      return content;
    } catch (error) {
      console.error('提取文本失败:', error);
      throw new Error(`无法从 ${url} 提取文本: ${error}`);
    }
  }

  /**
   * 提取页面标题
   */
  private extractTitle($: any): string {
    // 优先获取<title>标签
    let title = $('title').text().trim();
    
    // 如果没有<title>，尝试获取<h1>
    if (!title) {
      const h1 = $('h1').first().text().trim();
      if (h1) title = h1;
    }

    // 清理标题
    return this.cleanText(title);
  }

  /**
   * 提取页面元数据
   */
  private extractMetadata($: any): TextContent['metadata'] {
    const metadata: TextContent['metadata'] = {};

    // 提取描述
    const description = $('meta[name="description"]').attr('content') ||
                       $('meta[property="og:description"]').attr('content');
    if (description) {
      metadata.description = this.cleanText(description);
    }

    // 提取关键词
    const keywords = $('meta[name="keywords"]').attr('content');
    if (keywords) {
      metadata.keywords = keywords.split(',').map((k: string) => k.trim()).filter((k: string) => k);
    }

    // 提取作者
    const author = $('meta[name="author"]').attr('content') ||
                   $('meta[property="article:author"]').attr('content');
    if (author) {
      metadata.author = this.cleanText(author);
    }

    // 提取发布日期
    const publishDate = $('meta[property="article:published_time"]').attr('content') ||
                        $('time').attr('datetime');
    if (publishDate) {
      metadata.publishDate = publishDate;
    }

    // 提取最后修改时间
    const lastModified = $('meta[property="article:modified_time"]').attr('content') ||
                         $('time').last().attr('datetime');
    if (lastModified) {
      metadata.lastModified = lastModified;
    }

    return metadata;
  }

  /**
   * 提取标题层级
   */
  private extractHeadings($: any): TextContent['headings'] {
    const headings: TextContent['headings'] = [];

    $('h1, h2, h3, h4, h5, h6').each((_: any, element: any) => {
      const $el = $(element);
      const level = parseInt(element.tagName?.substring(1) || '1');
      const text = this.cleanText($el.text());
      
      if (text) {
        headings.push({ level, text });
      }
    });

    return headings;
  }

  /**
   * 提取段落
   */
  private extractParagraphs($: any): string[] {
    const paragraphs: string[] = [];

    // 移除不需要的元素
    const $filtered = $('body').clone();
    this.excludeSelectors.forEach(selector => {
      $filtered.find(selector).remove();
    });

    $filtered.find('p').each((_: any, element: any) => {
      const $p = $(element);
      const text = this.cleanText($p.text());
      
      if (text && text.length > 10) { // 过滤掉太短的段落
        paragraphs.push(text);
      }
    });

    return paragraphs;
  }

  /**
   * 提取链接
   */
  private extractLinks($: any, baseUrl: string): TextContent['links'] {
    const links: TextContent['links'] = [];

    $('a[href]').each((_: any, element: any) => {
      const $a = $(element);
      const href = $a.attr('href');
      const text = this.cleanText($a.text());

      if (href && text && text.length > 0) {
        // 转换为绝对URL
        const absoluteUrl = this.resolveUrl(baseUrl, href);
        
        links.push({
          text,
          href: absoluteUrl
        });
      }
    });

    return links;
  }

  /**
   * 提取列表
   */
  private extractLists($: any): TextContent['lists'] {
    const lists: TextContent['lists'] = [];

    // 提取有序列表
    $('ol').each((_: any, element: any) => {
      const $ol = $(element);
      const items: string[] = [];

      $ol.find('li').each((_: any, li: any) => {
        const text = this.cleanText($(li).text());
        if (text) items.push(text);
      });

      if (items.length > 0) {
        lists.push({ items, ordered: true });
      }
    });

    // 提取无序列表
    $('ul').each((_: any, element: any) => {
      const $ul = $(element);
      const items: string[] = [];

      $ul.find('li').each((_: any, li: any) => {
        const text = this.cleanText($(li).text());
        if (text) items.push(text);
      });

      if (items.length > 0) {
        lists.push({ items, ordered: false });
      }
    });

    return lists;
  }

  /**
   * 提取引用
   */
  private extractQuotes($: any): string[] {
    const quotes: string[] = [];

    // 提取块级引用
    $('blockquote').each((_: any, element: any) => {
      const text = this.cleanText($(element).text());
      if (text) quotes.push(text);
    });

    // 提取行内引用
    $('q').each((_: any, element: any) => {
      const text = this.cleanText($(element).text());
      if (text) quotes.push(text);
    });

    return quotes;
  }

  /**
   * 提取代码块
   */
  private extractCodeBlocks($: any): TextContent['codeBlocks'] {
    const codeBlocks: TextContent['codeBlocks'] = [];

    // 提取pre内的代码
    $('pre').each((_: any, element: any) => {
      const $pre = $(element);
      const code = this.cleanText($pre.text());
      
      if (code) {
        // 尝试获取语言
        const language = $pre.find('code').first().attr('class')?.match(/language-(\w+)/)?.[1];
        
        codeBlocks.push({
          language,
          code
        });
      }
    });

    // 提取代码标签内的代码
    $('code').each((_: any, element: any) => {
      const $code = $(element);
      // 只提取不是在pre内的code标签
      if (!$code.closest('pre').length) {
        const code = this.cleanText($code.text());
        if (code && code.length > 10) {
          codeBlocks.push({
            language: undefined,
            code
          });
        }
      }
    });

    return codeBlocks;
  }

  /**
   * 解析相对URL为绝对URL
   */
  private resolveUrl(base: string, url: string): string {
    try {
      const urlObj = new URL(url, base);
      return urlObj.toString();
    } catch {
      return url;
    }
  }

  /**
   * 清理文本内容
   */
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // 合并多个空格
      .replace(/\n+/g, ' ') // 合并多个换行
      .trim(); // 去除首尾空格
  }

  /**
   * 保存内容到文件
   */
  private async saveToFile(content: TextContent, url: string): Promise<void> {
    const filename = this.generateFilename(url);
    const filePath = path.join(this.outputDir, filename);
    
    // 创建Markdown格式的内容
    let markdown = `# ${content.title}\n\n`;
    
    // 元数据
    if (content.metadata.description) {
      markdown += `**描述**: ${content.metadata.description}\n\n`;
    }
    if (content.metadata.author) {
      markdown += `**作者**: ${content.metadata.author}\n\n`;
    }
    if (content.metadata.publishDate) {
      markdown += `**发布日期**: ${content.metadata.publishDate}\n\n`;
    }
    if (content.metadata.lastModified) {
      markdown += `**最后修改**: ${content.metadata.lastModified}\n\n`;
    }
    
    // 标题
    if (content.headings.length > 0) {
      markdown += '## 目录结构\n\n';
      content.headings.forEach(heading => {
        markdown += `${'#'.repeat(heading.level + 2)} ${heading.text}\n`;
      });
      markdown += '\n';
    }
    
    // 段落
    if (content.paragraphs.length > 0) {
      markdown += '## 正文内容\n\n';
      content.paragraphs.forEach(paragraph => {
        markdown += `${paragraph}\n\n`;
      });
    }
    
    // 链接
    if (content.links.length > 0) {
      markdown += '## 相关链接\n\n';
      content.links.forEach(link => {
        markdown += `- [${link.text}](${link.href})\n`;
      });
      markdown += '\n';
    }
    
    // 列表
    if (content.lists.length > 0) {
      markdown += '## 列表内容\n\n';
      content.lists.forEach(list => {
        list.items.forEach(item => {
          markdown += list.ordered ? `${list.items.indexOf(item) + 1}. ${item}\n` : `- ${item}\n`;
        });
        markdown += '\n';
      });
    }
    
    // 引用
    if (content.quotes.length > 0) {
      markdown += '## 引用内容\n\n';
      content.quotes.forEach(quote => {
        markdown += `> ${quote}\n\n`;
      });
    }
    
    // 代码块
    if (content.codeBlocks.length > 0) {
      markdown += '## 代码示例\n\n';
      content.codeBlocks.forEach(block => {
        if (block.language) {
          markdown += `\`\`\`${block.language}\n${block.code}\n\`\`\`\n\n`;
        } else {
          markdown += `\`\`\`\n${block.code}\n\`\`\`\n\n`;
        }
      });
    }
    
    // 添加提取时间
    markdown += `\n---\n*提取时间: ${content.extractedAt}*`;
    
    await fs.writeFile(filePath, markdown, 'utf8');
  }

  /**
   * 生成文件名
   */
  private generateFilename(url: string): string {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');
    const path = urlObj.pathname.split('/').filter(Boolean).join('-');
    const timestamp = Date.now();
    
    return `${domain}-${path || 'home'}-${timestamp}.md`;
  }

  /**
   * 获取已提取的文本文件列表
   */
  async getExtractedTexts(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.outputDir);
      return files.filter(file => file.endsWith('.md'));
    } catch (error) {
      console.error('获取文本文件列表失败:', error);
      return [];
    }
  }

  /**
   * 清理文本文件
   */
  async cleanup(): Promise<void> {
    try {
      if (await fs.pathExists(this.outputDir)) {
        await fs.remove(this.outputDir);
      }
    } catch (error) {
      console.error('清理文本目录失败:', error);
    }
  }
}