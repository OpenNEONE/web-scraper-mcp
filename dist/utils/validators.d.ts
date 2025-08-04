/**
 * URL 验证器
 */
export declare class UrlValidator {
    /**
     * 验证是否为有效的URL
     */
    static isValidUrl(url: string): boolean;
    /**
     * 验证URL是否包含域名
     */
    static hasDomain(url: string): boolean;
    /**
     * 验证URL是否为本地文件路径
     */
    static isLocalFile(url: string): boolean;
    /**
     * 提取域名
     */
    static extractDomain(url: string): string;
    /**
     * 检查URL是否在允许的域名列表中
     */
    static isAllowedDomain(url: string, allowedDomains: string[]): boolean;
}
/**
 * 文件路径验证器
 */
export declare class PathValidator {
    /**
     * 验证路径是否合法
     */
    static isValidPath(path: string): boolean;
    /**
     * 规范化路径
     */
    static normalizePath(path: string): string;
    /**
     * 获取安全路径
     */
    static getSafePath(baseDir: string, relativePath: string): string;
}
/**
 * 输入验证器
 */
export declare class InputValidator {
    /**
     * 验证URL输入
     */
    static validateUrl(url: string, fieldName?: string): string;
    /**
     * 验证目录路径
     */
    static validateOutputDir(dir: string | undefined, defaultDir: string): string;
    /**
     * 验证并发数量
     */
    static validateMaxConcurrent(maxConcurrent: number | undefined): number;
    /**
     * 验证数字输入
     */
    static validateNumber(value: number, fieldName: string, min?: number, max?: number): number;
    /**
     * 验证字符串输入
     */
    static validateString(value: string, fieldName: string, minLength?: number, maxLength?: number): string;
}
/**
 * 验证错误类
 */
export declare class ValidationError extends Error {
    constructor(message: string);
}
/**
 * 工具函数
 */
export declare const ValidationUtils: {
    /**
     * 批量验证输入参数
     */
    validateInputs(inputs: {
        [key: string]: any;
    }, rules: {
        [key: string]: (value: any) => any;
    }): {
        [key: string]: any;
    };
    /**
     * 检查是否为空值
     */
    isEmpty(value: any): boolean;
    /**
     * 检查是否为有效的文件名
     */
    isValidFilename(filename: string): boolean;
};
//# sourceMappingURL=validators.d.ts.map