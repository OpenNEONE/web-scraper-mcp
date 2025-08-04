# Web Scraper MCP Server

一个基于 Model Context Protocol (MCP) 的网站爬虫服务器，支持爬取网站图片和文本内容。

## 功能特性

### 图片爬取
- 从指定URL爬取网站上的所有图片
- 自动识别图片格式（JPG、PNG、GIF、WebP、SVG等）
- 支持并发下载，提高效率
- 自动处理图片路径和相对URL
- 图片格式优化和压缩
- 生成有序文件名

### 文本爬取
- 提取网站标题、段落、标题层级
- 收集链接、列表、引用、代码块
- 提取页面元数据（描述、关键词、作者等）
- 生成结构化的Markdown文件
- 支持多种文本内容类型

### MCP协议支持
- 标准的MCP服务器实现
- 支持工具调用和结果返回
- 与Claude等AI助手无缝集成
- 错误处理和状态监控

### 安全特性
- URL验证和路径安全检查
- 输入参数验证
- 错误处理和异常捕获
- 并发控制防止过载

## 安装

```bash
npm install web-scraper-mcp
```

## 快速开始

### 作为MCP服务器运行

1. 安装依赖：
```bash
cd web-scraper-mcp
npm install
npm run build
```

2. 启动服务器：
```bash
npm start
```

3. 在Claude Code中配置MCP服务器：
```json
{
  "mcpServers": {
    "web-scraper": {
      "command": "node",
      "args": ["/path/to/web-scraper-mcp/dist/index.js"],
      "env": {}
    }
  }
}
```

### 直接使用API

```typescript
import { ImageScraper, TextScraper } from 'web-scraper-mcp';

// 图片爬取
const imageScraper = new ImageScraper('./images');
const images = await imageScraper.scrapeImagesFromUrl('https://example.com');

// 文本爬取
const textScraper = new TextScraper('./text');
const content = await textScraper.scrapeTextFromUrl('https://example.com');
```

## 可用工具

### 1. scrape_images
爬取指定网站的所有图片并保存到本地。

**参数:**
- `url` (string, 必需): 要爬取图片的网站URL
- `outputDir` (string, 可选): 图片保存目录，默认为 `./scraped-images`
- `maxConcurrent` (number, 可选): 并发下载数量，默认为5

**示例:**
```json
{
  "name": "scrape_images",
  "arguments": {
    "url": "https://example.com",
    "outputDir": "./my-images",
    "maxConcurrent": 10
  }
}
```

### 2. scrape_text
爬取网站的文本内容并保存为Markdown文件。

**参数:**
- `url` (string, 必需): 要爬取文本的网站URL
- `outputDir` (string, 可选): 文本保存目录，默认为 `./scraped-text`

**示例:**
```json
{
  "name": "scrape_text",
  "arguments": {
    "url": "https://example.com",
    "outputDir": "./my-texts"
  }
}
```

### 3. list_images
列出所有已下载的图片信息。

**参数:**
- `outputDir` (string, 可选): 图片目录路径，默认为 `./scraped-images`

**示例:**
```json
{
  "name": "list_images",
  "arguments": {
    "outputDir": "./my-images"
  }
}
```

### 4. list_texts
列出所有已提取的文本文件。

**参数:**
- `outputDir` (string, 可选): 文本目录路径，默认为 `./scraped-text`

**示例:**
```json
{
  "name": "list_texts",
  "arguments": {
    "outputDir": "./my-texts"
  }
}
```

### 5. cleanup_images
清理所有下载的图片文件。

**参数:**
- `outputDir` (string, 可选): 要清理的图片目录路径，默认为 `./scraped-images`

**示例:**
```json
{
  "name": "cleanup_images",
  "arguments": {
    "outputDir": "./my-images"
  }
}
```

### 6. cleanup_texts
清理所有提取的文本文件。

**参数:**
- `outputDir` (string, 可选): 要清理的文本目录路径，默认为 `./scraped-text`

**示例:**
```json
{
  "name": "cleanup_texts",
  "arguments": {
    "outputDir": "./my-texts"
  }
}
```

### 7. get_scraping_status
获取爬虫状态信息。

**参数:**
- `outputDir` (string, 可选): 输出目录路径

**示例:**
```json
{
  "name": "get_scraping_status",
  "arguments": {
    "outputDir": "./output"
  }
}
```

## 使用示例

### 示例1: 爬取网站图片和文本

```typescript
// 1. 爬取图片
const imageResult = await server.requestToolCall({
  name: 'scrape_images',
  arguments: {
    url: 'https://example.com',
    outputDir: './example-images'
  }
});

// 2. 爬取文本
const textResult = await server.requestToolCall({
  name: 'scrape_text',
  arguments: {
    url: 'https://example.com',
    outputDir: './example-texts'
  }
});

// 3. 检查状态
const status = await server.requestToolCall({
  name: 'get_scraping_status'
});
```

### 示例2: 批量处理多个网站

```typescript
const websites = [
  'https://example1.com',
  'https://example2.com',
  'https://example3.com'
];

for (const website of websites) {
  // 爬取图片
  await server.requestToolCall({
    name: 'scrape_images',
    arguments: {
      url: website,
      outputDir: `./images-${new Date().toISOString().split('T')[0]}`
    }
  });

  // 爬取文本
  await server.requestToolCall({
    name: 'scrape_text',
    arguments: {
      url: website,
      outputDir: `./texts-${new Date().toISOString().split('T')[0]}`
    }
  });
}
```

## 配置选项

### 环境变量
- `SCRAPER_OUTPUT_DIR`: 默认输出目录
- `SCRAPER_MAX_CONCURRENT`: 默认并发数量
- `SCRAPER_USER_AGENT`: 自定义User-Agent
- `SCRAPER_TIMEOUT`: 请求超时时间（毫秒）

### 配置文件
创建 `config.json` 文件：

```json
{
  "imageScraper": {
    "outputDir": "./scraped-images",
    "maxConcurrent": 5,
    "allowedFormats": ["jpg", "png", "gif", "webp", "svg"]
  },
  "textScraper": {
    "outputDir": "./scraped-text",
    "excludeSelectors": ["script", "style", "nav", "footer"]
  }
}
```

## 开发指南

### 项目结构
```
web-scraper-mcp/
├── src/
│   ├── scrapers/
│   │   ├── imageScraper.ts     # 图片爬虫
│   │   └── textScraper.ts      # 文本爬虫
│   ├── utils/
│   │   ├── validators.ts       # 输入验证
│   │   └── logger.ts           # 日志工具
│   └── index.ts               # MCP服务器入口
├── package.json
├── tsconfig.json
├── README.md
└── dist/                      # 编译输出
```

### 运行测试
```bash
npm test
```

### 构建项目
```bash
npm run build
```

### 开发模式
```bash
npm run dev
```

## 故障排除

### 常见问题

1. **网络错误**
   - 检查网络连接
   - 确认URL格式正确
   - 验证目标网站可访问

2. **权限错误**
   - 确认输出目录有写入权限
   - 检查文件路径是否合法

3. **内存溢出**
   - 减少并发下载数量
   - 分批处理大量图片

4. **超时错误**
   - 增加超时时间
   - 检查网络速度

### 调试模式
启用调试日志：
```typescript
import { Logger } from './utils/logger';
Logger.setLevel('DEBUG');
```

## 性能优化

### 图片爬取优化
- 使用合适的并发数量
- 限制图片文件大小
- 排除不需要的图片格式

### 文本爬取优化
- 排除不必要的HTML元素
- 使用高效的文本提取算法
- 优化文件写入操作

### 内存管理
- 及时释放不再使用的资源
- 使用流式处理大文件
- 避免内存泄漏

## 许可证

MIT License

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 支持

- 提交问题: [GitHub Issues](https://github.com/yourusername/web-scraper-mcp/issues)
- 文档: [Wiki](https://github.com/yourusername/web-scraper-mcp/wiki)
- 示例: [Examples](https://github.com/yourusername/web-scraper-mcp/tree/main/examples)

## 更新日志

### v1.0.0
- 初始版本发布
- 支持图片和文本爬取
- MCP协议集成
- 错误处理和验证
- 完整的API文档