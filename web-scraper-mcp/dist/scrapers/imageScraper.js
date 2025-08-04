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
exports.ImageScraper = void 0;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const sharp_1 = __importDefault(require("sharp"));
class ImageScraper {
    constructor(outputDir = './scraped-images') {
        this.maxConcurrent = 5;
        this.allowedExtensions = new Set([
            'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff'
        ]);
        this.outputDir = outputDir;
    }
    /**
     * 从指定URL获取页面中的所有图片
     */
    async scrapeImagesFromUrl(url) {
        try {
            // 创建输出目录
            await fs.ensureDir(this.outputDir);
            // 获取页面内容
            const response = await axios_1.default.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 10000
            });
            const $ = cheerio.load(response.data);
            const imageUrls = [];
            // 查找所有图片标签
            $('img').each((_, element) => {
                const src = $(element).attr('src');
                const srcset = $(element).attr('srcset');
                const dataSrc = $(element).attr('data-src');
                if (src && !imageUrls.includes(src)) {
                    imageUrls.push(this.resolveUrl(url, src));
                }
                if (srcset && !imageUrls.includes(srcset)) {
                    imageUrls.push(this.resolveUrl(url, srcset));
                }
                if (dataSrc && !imageUrls.includes(dataSrc)) {
                    imageUrls.push(this.resolveUrl(url, dataSrc));
                }
            });
            // 并发下载图片
            return await this.downloadImages(imageUrls, url);
        }
        catch (error) {
            console.error('获取图片失败:', error);
            throw new Error(`无法从 ${url} 获取图片: ${error}`);
        }
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
     * 下载图片文件
     */
    async downloadImages(urls, sourceUrl) {
        const validUrls = urls.filter(url => this.isValidImageUrl(url));
        const downloadedImages = [];
        // 控制并发数
        for (let i = 0; i < validUrls.length; i += this.maxConcurrent) {
            const batch = validUrls.slice(i, i + this.maxConcurrent);
            const promises = batch.map(async (url) => {
                try {
                    return await this.downloadSingleImage(url, sourceUrl);
                }
                catch (error) {
                    console.warn(`下载图片失败: ${url}`, error);
                    return null;
                }
            });
            const results = await Promise.all(promises);
            const validResults = results.filter((result) => result !== null);
            downloadedImages.push(...validResults);
        }
        return downloadedImages;
    }
    /**
     * 验证URL是否为有效的图片URL
     */
    isValidImageUrl(url) {
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname.toLowerCase();
            // 检查文件扩展名
            const extension = path.extname(pathname).substring(1);
            if (extension && !this.allowedExtensions.has(extension)) {
                return false;
            }
            // 检查是否包含图片相关的路径
            return pathname.includes('image') ||
                pathname.includes('img') ||
                pathname.includes('photo') ||
                pathname.includes('picture') ||
                extension !== '';
        }
        catch {
            return false;
        }
    }
    /**
     * 下载单个图片
     */
    async downloadSingleImage(url, sourceUrl) {
        try {
            const response = await axios_1.default.get(url, {
                responseType: 'arraybuffer',
                timeout: 15000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            // 获取图片信息
            const buffer = Buffer.from(response.data);
            const extension = this.getImageExtension(url, buffer);
            const filename = this.generateFilename(url, sourceUrl, extension);
            const filePath = path.join(this.outputDir, filename);
            // 使用sharp处理和保存图片
            const sharpInstance = (0, sharp_1.default)(buffer);
            await sharpInstance
                .toFormat(extension)
                .toFile(filePath);
            // 获取图片尺寸
            const metadata = await sharpInstance.metadata();
            const size = buffer.length;
            return {
                url,
                filename,
                extension,
                size,
                width: metadata.width,
                height: metadata.height
            };
        }
        catch (error) {
            throw new Error(`下载图片失败: ${url} - ${error}`);
        }
    }
    /**
     * 获取图片格式
     */
    getImageExtension(url, buffer) {
        // 根据URL扩展名判断
        const urlExtension = path.extname(url).toLowerCase().substring(1);
        if (this.allowedExtensions.has(urlExtension)) {
            return urlExtension;
        }
        // 根据文件内容判断
        const bufferExtension = this.detectImageFormat(buffer);
        return bufferExtension || 'jpg';
    }
    /**
     * 检测图片格式
     */
    detectImageFormat(buffer) {
        const signatures = {
            '\xFF\xD8\xFF': 'jpg',
            '\x89PNG\r\n\x1A\n': 'png',
            'GIF87a': 'gif',
            'GIF89a': 'gif',
            'RIFF': 'webp',
            '<?xml': 'svg',
            'BM': 'bmp'
        };
        for (const [signature, format] of Object.entries(signatures)) {
            if (buffer.toString('hex', 0, Math.min(signature.length, buffer.length)).startsWith(signature.split('').map(s => s.charCodeAt(0).toString(16).padStart(2, '0')).join(''))) {
                return format;
            }
        }
        return null;
    }
    /**
     * 生成文件名
     */
    generateFilename(url, sourceUrl, extension) {
        // 从URL中提取文件名
        const urlPath = new URL(url).pathname;
        const originalName = path.basename(urlPath, path.extname(urlPath)) || 'image';
        // 清理文件名
        const cleanName = originalName
            .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')
            .substring(0, 50);
        // 生成唯一文件名
        const timestamp = Date.now();
        const counter = Math.floor(Math.random() * 1000);
        return `${cleanName}_${timestamp}_${counter}.${extension}`;
    }
    /**
     * 获取已下载图片列表
     */
    async getDownloadedImages() {
        try {
            const files = await fs.readdir(this.outputDir);
            const images = [];
            for (const file of files) {
                const filePath = path.join(this.outputDir, file);
                const stats = await fs.stat(filePath);
                if (stats.isFile()) {
                    const extension = path.extname(file).substring(1);
                    if (this.allowedExtensions.has(extension)) {
                        const sharpInstance = (0, sharp_1.default)(filePath);
                        const metadata = await sharpInstance.metadata();
                        images.push({
                            url: 'local://' + filePath,
                            filename: file,
                            extension,
                            size: stats.size,
                            width: metadata.width,
                            height: metadata.height
                        });
                    }
                }
            }
            return images;
        }
        catch (error) {
            console.error('获取下载的图片失败:', error);
            return [];
        }
    }
    /**
     * 清理下载的图片
     */
    async cleanup() {
        try {
            if (await fs.pathExists(this.outputDir)) {
                await fs.remove(this.outputDir);
            }
        }
        catch (error) {
            console.error('清理图片目录失败:', error);
        }
    }
}
exports.ImageScraper = ImageScraper;
//# sourceMappingURL=imageScraper.js.map