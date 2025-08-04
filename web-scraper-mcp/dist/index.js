#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const imageScraper_js_1 = require("./scrapers/imageScraper.js");
const textScraper_js_1 = require("./scrapers/textScraper.js");
// 创建MCP服务器实例
const server = new index_js_1.Server({
    name: 'web-scraper-mcp-server',
    version: '1.0.0',
});
// 全局实例
let imageScraper;
let textScraper;
// 定义可用工具
const tools = [
    {
        name: 'scrape_images',
        description: '从指定URL爬取网站上的所有图片并保存到本地',
        inputSchema: {
            type: 'object',
            properties: {
                url: {
                    type: 'string',
                    description: '要爬取图片的网站URL',
                },
                outputDir: {
                    type: 'string',
                    description: '图片保存目录（可选，默认为 ./scraped-images）',
                },
                maxConcurrent: {
                    type: 'number',
                    description: '并发下载数量（可选，默认为5）',
                    default: 5,
                },
            },
            required: ['url'],
        },
    },
    {
        name: 'scrape_text',
        description: '从指定URL爬取网站的文本内容并保存为Markdown文件',
        inputSchema: {
            type: 'object',
            properties: {
                url: {
                    type: 'string',
                    description: '要爬取文本的网站URL',
                },
                outputDir: {
                    type: 'string',
                    description: '文本保存目录（可选，默认为 ./scraped-text）',
                },
            },
            required: ['url'],
        },
    },
    {
        name: 'list_images',
        description: '列出所有已下载的图片信息',
        inputSchema: {
            type: 'object',
            properties: {
                outputDir: {
                    type: 'string',
                    description: '图片目录路径（可选，默认为 ./scraped-images）',
                },
            },
        },
    },
    {
        name: 'list_texts',
        description: '列出所有已提取的文本文件',
        inputSchema: {
            type: 'object',
            properties: {
                outputDir: {
                    type: 'string',
                    description: '文本目录路径（可选，默认为 ./scraped-text）',
                },
            },
        },
    },
    {
        name: 'cleanup_images',
        description: '清理所有下载的图片文件',
        inputSchema: {
            type: 'object',
            properties: {
                outputDir: {
                    type: 'string',
                    description: '要清理的图片目录路径（可选，默认为 ./scraped-images）',
                },
            },
        },
    },
    {
        name: 'cleanup_texts',
        description: '清理所有提取的文本文件',
        inputSchema: {
            type: 'object',
            properties: {
                outputDir: {
                    type: 'string',
                    description: '要清理的文本目录路径（可选，默认为 ./scraped-text）',
                },
            },
        },
    },
    {
        name: 'get_scraping_status',
        description: '获取爬虫状态信息',
        inputSchema: {
            type: 'object',
            properties: {
                outputDir: {
                    type: 'string',
                    description: '输出目录路径（可选）',
                },
            },
        },
    },
];
// 注册工具列表处理器
server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
    return {
        tools,
    };
});
// 注册工具调用处理器
server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        switch (name) {
            case 'scrape_images':
                return await handleScrapeImages(args);
            case 'scrape_text':
                return await handleScrapeText(args);
            case 'list_images':
                return await handleListImages(args);
            case 'list_texts':
                return await handleListTexts(args);
            case 'cleanup_images':
                return await handleCleanupImages(args);
            case 'cleanup_texts':
                return await handleCleanupTexts(args);
            case 'get_scraping_status':
                return await handleGetScrapingStatus(args);
            default:
                throw new Error(`未知工具: ${name}`);
        }
    }
    catch (error) {
        console.error(`工具调用失败: ${name}`, error);
        throw new Error(`工具调用失败: ${error}`);
    }
});
// 处理图片爬取
async function handleScrapeImages(args) {
    const { url, outputDir, maxConcurrent } = args;
    if (!imageScraper) {
        imageScraper = new imageScraper_js_1.ImageScraper(outputDir);
    }
    else if (outputDir) {
        imageScraper = new imageScraper_js_1.ImageScraper(outputDir);
    }
    console.log(`开始从 ${url} 爬取图片...`);
    const images = await imageScraper.scrapeImagesFromUrl(url);
    console.log(`成功下载 ${images.length} 张图片`);
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    success: true,
                    message: `成功从 ${url} 下载了 ${images.length} 张图片`,
                    images: images.map(img => ({
                        filename: img.filename,
                        size: img.size,
                        dimensions: img.width && img.height ? `${img.width}x${img.height}` : '未知',
                        url: img.url
                    }))
                }, null, 2)
            }
        ]
    };
}
// 处理文本爬取
async function handleScrapeText(args) {
    const { url, outputDir } = args;
    if (!textScraper) {
        textScraper = new textScraper_js_1.TextScraper(outputDir);
    }
    else if (outputDir) {
        textScraper = new textScraper_js_1.TextScraper(outputDir);
    }
    console.log(`开始从 ${url} 爬取文本...`);
    const content = await textScraper.scrapeTextFromUrl(url);
    console.log(`成功提取文本内容并保存为文件: ${content.title}`);
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    success: true,
                    message: `成功从 ${url} 提取文本内容`,
                    title: content.title,
                    metadata: content.metadata,
                    wordCount: content.paragraphs.join(' ').split(/\s+/).length,
                    extractedAt: content.extractedAt
                }, null, 2)
            }
        ]
    };
}
// 处理列出图片
async function handleListImages(args) {
    const { outputDir } = args;
    if (!imageScraper) {
        imageScraper = new imageScraper_js_1.ImageScraper(outputDir);
    }
    else if (outputDir) {
        imageScraper = new imageScraper_js_1.ImageScraper(outputDir);
    }
    const images = await imageScraper.getDownloadedImages();
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    success: true,
                    totalImages: images.length,
                    images: images
                }, null, 2)
            }
        ]
    };
}
// 处理列出文本
async function handleListTexts(args) {
    const { outputDir } = args;
    if (!textScraper) {
        textScraper = new textScraper_js_1.TextScraper(outputDir);
    }
    else if (outputDir) {
        textScraper = new textScraper_js_1.TextScraper(outputDir);
    }
    const texts = await textScraper.getExtractedTexts();
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    success: true,
                    totalTexts: texts.length,
                    texts: texts
                }, null, 2)
            }
        ]
    };
}
// 处理清理图片
async function handleCleanupImages(args) {
    const { outputDir } = args;
    if (!imageScraper) {
        imageScraper = new imageScraper_js_1.ImageScraper(outputDir);
    }
    else if (outputDir) {
        imageScraper = new imageScraper_js_1.ImageScraper(outputDir);
    }
    await imageScraper.cleanup();
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    success: true,
                    message: '所有图片文件已清理'
                }, null, 2)
            }
        ]
    };
}
// 处理清理文本
async function handleCleanupTexts(args) {
    const { outputDir } = args;
    if (!textScraper) {
        textScraper = new textScraper_js_1.TextScraper(outputDir);
    }
    else if (outputDir) {
        textScraper = new textScraper_js_1.TextScraper(outputDir);
    }
    await textScraper.cleanup();
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({
                    success: true,
                    message: '所有文本文件已清理'
                }, null, 2)
            }
        ]
    };
}
// 处理获取状态
async function handleGetScrapingStatus(args) {
    const { outputDir } = args;
    const status = {
        timestamp: new Date().toISOString(),
        images: { total: 0, directory: outputDir || './scraped-images' },
        texts: { total: 0, directory: outputDir || './scraped-text' }
    };
    try {
        if (!imageScraper) {
            imageScraper = new imageScraper_js_1.ImageScraper(outputDir);
        }
        else if (outputDir) {
            imageScraper = new imageScraper_js_1.ImageScraper(outputDir);
        }
        status.images.total = (await imageScraper.getDownloadedImages()).length;
    }
    catch (error) {
        status.images.error = error instanceof Error ? error.message : '获取图片状态失败';
    }
    try {
        if (!textScraper) {
            textScraper = new textScraper_js_1.TextScraper(outputDir);
        }
        else if (outputDir) {
            textScraper = new textScraper_js_1.TextScraper(outputDir);
        }
        status.texts.total = (await textScraper.getExtractedTexts()).length;
    }
    catch (error) {
        status.texts.error = error instanceof Error ? error.message : '获取文本状态失败';
    }
    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify(status, null, 2)
            }
        ]
    };
}
// 启动服务器
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    console.error('Web Scraper MCP Server 已启动');
}
main().catch((error) => {
    console.error('服务器启动失败:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map