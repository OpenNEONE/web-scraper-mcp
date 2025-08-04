import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs-extra';
import * as path from 'path';
import sharp from 'sharp';

export interface ImageInfo {
  url: string;
  filename: string;
  extension: string;
  size: number;
  width?: number;
  height?: number;
  alt?: string;
  title?: string;
}

export class ImageScraper {
  private readonly outputDir: string;
  private readonly maxConcurrent: number = 5;
  private readonly allowedExtensions: Set<string> = new Set([
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff'
  ]);

  constructor(outputDir: string = './scraped-images') {
    this.outputDir = outputDir;
  }

  /**
   * 从指定URL获取页面中的所有图片
   */
  async scrapeImagesFromUrl(url: string): Promise<ImageInfo[]> {
    try {
      // 创建输出目录
      await fs.ensureDir(this.outputDir);

      // 获取页面内容
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const imageUrls: string[] = [];

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
    } catch (error) {
      console.error('获取图片失败:', error);
      throw new Error(`无法从 ${url} 获取图片: ${error}`);
    }
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
   * 下载图片文件
   */
  private async downloadImages(urls: string[], sourceUrl: string): Promise<ImageInfo[]> {
    const validUrls = urls.filter(url => this.isValidImageUrl(url));
    const downloadedImages: ImageInfo[] = [];

    // 控制并发数
    for (let i = 0; i < validUrls.length; i += this.maxConcurrent) {
      const batch = validUrls.slice(i, i + this.maxConcurrent);
      const promises = batch.map(async (url) => {
        try {
          return await this.downloadSingleImage(url, sourceUrl);
        } catch (error) {
          console.warn(`下载图片失败: ${url}`, error);
          return null;
        }
      });

      const results = await Promise.all(promises);
      const validResults = results.filter((result): result is ImageInfo => result !== null);
      downloadedImages.push(...validResults);
    }

    return downloadedImages;
  }

  /**
   * 验证URL是否为有效的图片URL
   */
  private isValidImageUrl(url: string): boolean {
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
    } catch {
      return false;
    }
  }

  /**
   * 下载单个图片
   */
  private async downloadSingleImage(url: string, sourceUrl: string): Promise<ImageInfo> {
    try {
      const response = await axios.get(url, {
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
      const sharpInstance = sharp(buffer);
      await sharpInstance
        .toFormat(extension as any)
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
    } catch (error) {
      throw new Error(`下载图片失败: ${url} - ${error}`);
    }
  }

  /**
   * 获取图片格式
   */
  private getImageExtension(url: string, buffer: Buffer): string {
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
  private detectImageFormat(buffer: Buffer): string | null {
    const signatures: { [key: string]: string } = {
      '\xFF\xD8\xFF': 'jpg',
      '\x89PNG\r\n\x1A\n': 'png',
      'GIF87a': 'gif',
      'GIF89a': 'gif',
      'RIFF': 'webp',
      '<?xml': 'svg',
      'BM': 'bmp'
    };

    for (const [signature, format] of Object.entries(signatures)) {
      if (buffer.toString('hex', 0, Math.min(signature.length, buffer.length)).startsWith(
        signature.split('').map(s => s.charCodeAt(0).toString(16).padStart(2, '0')).join('')
      )) {
        return format;
      }
    }

    return null;
  }

  /**
   * 生成文件名
   */
  private generateFilename(url: string, sourceUrl: string, extension: string): string {
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
  async getDownloadedImages(): Promise<ImageInfo[]> {
    try {
      const files = await fs.readdir(this.outputDir);
      const images: ImageInfo[] = [];

      for (const file of files) {
        const filePath = path.join(this.outputDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.isFile()) {
          const extension = path.extname(file).substring(1);
          if (this.allowedExtensions.has(extension)) {
            const sharpInstance = sharp(filePath);
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
    } catch (error) {
      console.error('获取下载的图片失败:', error);
      return [];
    }
  }

  /**
   * 清理下载的图片
   */
  async cleanup(): Promise<void> {
    try {
      if (await fs.pathExists(this.outputDir)) {
        await fs.remove(this.outputDir);
      }
    } catch (error) {
      console.error('清理图片目录失败:', error);
    }
  }
}