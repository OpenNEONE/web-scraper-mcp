"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextScraper = void 0;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
class TextScraper {
    constructor(outputDir) {
        this.outputDir = './scraped-text';
        this.excludeSelectors = [
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
        if (outputDir) {
            this.outputDir = outputDir;
        }
    }
    /**
     * 从指定URL提取文本内容
     */
    async scrapeTextFromUrl(url) {
        try {
            // 创建输出目录
            await fs.ensureDir(this.outputDir);
            // 获取页面内容
            const response = await axios_1.default.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 15000
            });
            const $ = cheerio.load(response.data);
            const content = {
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
        }
        catch (error) {
            console.error('提取文本失败:', error);
            throw new Error(`无法从 ${url} 提取文本: ${error}`);
        }
    }
    /**
     * 提取页面标题
     */
    extractTitle($) {
        // 优先获取<title>标签
        let title = $('title').text().trim();
        // 如果没有<title>，尝试获取<h1>
        if (!title) {
            const h1 = $('h1').first().text().trim();
            if (h1)
                title = h1;
        }
        // 清理标题
        return this.cleanText(title);
    }
    /**
     * 提取页面元数据
     */
    extractMetadata($) {
        const metadata = {};
        // 提取描述
        const description = $('meta[name="description"]').attr('content') ||
            $('meta[property="og:description"]').attr('content');
        if (description) {
            metadata.description = this.cleanText(description);
        }
        // 提取关键词
        const keywords = $('meta[name="keywords"]').attr('content');
        if (keywords) {
            metadata.keywords = keywords.split(',').map((k) => k.trim()).filter((k) => k);
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
    extractHeadings($) {
        const headings = [];
        $('h1, h2, h3, h4, h5, h6').each((_, element) => {
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
    extractParagraphs($) {
        const paragraphs = [];
        // 移除不需要的元素
        const $filtered = $('body').clone();
        this.excludeSelectors.forEach(selector => {
            $filtered.find(selector).remove();
        });
        $filtered.find('p').each((_, element) => {
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
    extractLinks($, baseUrl) {
        const links = [];
        $('a[href]').each((_, element) => {
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
    extractLists($) {
        const lists = [];
        // 提取有序列表
        $('ol').each((_, element) => {
            const $ol = $(element);
            const items = [];
            $ol.find('li').each((_, li) => {
                const text = this.cleanText($(li).text());
                if (text)
                    items.push(text);
            });
            if (items.length > 0) {
                lists.push({ items, ordered: true });
            }
        });
        // 提取无序列表
        $('ul').each((_, element) => {
            const $ul = $(element);
            const items = [];
            $ul.find('li').each((_, li) => {
                const text = this.cleanText($(li).text());
                if (text)
                    items.push(text);
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
    extractQuotes($) {
        const quotes = [];
        // 提取块级引用
        $('blockquote').each((_, element) => {
            const text = this.cleanText($(element).text());
            if (text)
                quotes.push(text);
        });
        // 提取行内引用
        $('q').each((_, element) => {
            const text = this.cleanText($(element).text());
            if (text)
                quotes.push(text);
        });
        return quotes;
    }
    /**
     * 提取代码块
     */
    extractCodeBlocks($) {
        const codeBlocks = [];
        // 提取pre内的代码
        $('pre').each((_, element) => {
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
        $('code').each((_, element) => {
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
    resolveUrl(base, url) {
        try {
            const urlObj = new URL(url, base);
            return urlObj.toString();
        }
        catch {
            return url;
        }
    }
    /**
     * 清理文本内容
     */
    cleanText(text) {
        return text
            .replace(/\s+/g, ' ') // 合并多个空格
            .replace(/\n+/g, ' ') // 合并多个换行
            .trim(); // 去除首尾空格
    }
    /**
     * 保存内容到文件
     */
    async saveToFile(content, url) {
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
                }
                else {
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
    generateFilename(url) {
        const urlObj = new URL(url);
        const domain = urlObj.hostname.replace('www.', '');
        const path = urlObj.pathname.split('/').filter(Boolean).join('-');
        const timestamp = Date.now();
        return `${domain}-${path || 'home'}-${timestamp}.md`;
    }
    /**
     * 获取已提取的文本文件列表
     */
    async getExtractedTexts() {
        try {
            const files = await fs.readdir(this.outputDir);
            return files.filter(file => file.endsWith('.md'));
        }
        catch (error) {
            console.error('获取文本文件列表失败:', error);
            return [];
        }
    }
    /**
     * 清理文本文件
     */
    async cleanup() {
        try {
            if (await fs.pathExists(this.outputDir)) {
                await fs.remove(this.outputDir);
            }
        }
        catch (error) {
            console.error('清理文本目录失败:', error);
        }
    }
}
exports.TextScraper = TextScraper;
//# sourceMappingURL=textScraper.js.map