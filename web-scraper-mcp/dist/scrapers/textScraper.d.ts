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
export declare class TextScraper {
    private readonly outputDir;
    private readonly excludeSelectors;
    constructor(outputDir?: string);
    /**
     * 从指定URL提取文本内容
     */
    scrapeTextFromUrl(url: string): Promise<TextContent>;
    /**
     * 提取页面标题
     */
    private extractTitle;
    /**
     * 提取页面元数据
     */
    private extractMetadata;
    /**
     * 提取标题层级
     */
    private extractHeadings;
    /**
     * 提取段落
     */
    private extractParagraphs;
    /**
     * 提取链接
     */
    private extractLinks;
    /**
     * 提取列表
     */
    private extractLists;
    /**
     * 提取引用
     */
    private extractQuotes;
    /**
     * 提取代码块
     */
    private extractCodeBlocks;
    /**
     * 解析相对URL为绝对URL
     */
    private resolveUrl;
    /**
     * 清理文本内容
     */
    private cleanText;
    /**
     * 保存内容到文件
     */
    private saveToFile;
    /**
     * 生成文件名
     */
    private generateFilename;
    /**
     * 获取已提取的文本文件列表
     */
    getExtractedTexts(): Promise<string[]>;
    /**
     * 清理文本文件
     */
    cleanup(): Promise<void>;
}
//# sourceMappingURL=textScraper.d.ts.map