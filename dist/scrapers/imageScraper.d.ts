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
export declare class ImageScraper {
    private readonly outputDir;
    private readonly maxConcurrent;
    private readonly allowedExtensions;
    constructor(outputDir?: string);
    /**
     * 从指定URL获取页面中的所有图片
     */
    scrapeImagesFromUrl(url: string): Promise<ImageInfo[]>;
    /**
     * 解析相对URL为绝对URL
     */
    private resolveUrl;
    /**
     * 下载图片文件
     */
    private downloadImages;
    /**
     * 验证URL是否为有效的图片URL
     */
    private isValidImageUrl;
    /**
     * 下载单个图片
     */
    private downloadSingleImage;
    /**
     * 获取图片格式
     */
    private getImageExtension;
    /**
     * 检测图片格式
     */
    private detectImageFormat;
    /**
     * 生成文件名
     */
    private generateFilename;
    /**
     * 获取已下载图片列表
     */
    getDownloadedImages(): Promise<ImageInfo[]>;
    /**
     * 清理下载的图片
     */
    cleanup(): Promise<void>;
}
//# sourceMappingURL=imageScraper.d.ts.map