"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationUtils = exports.ValidationError = exports.InputValidator = exports.PathValidator = exports.UrlValidator = void 0;
/**
 * URL 验证器
 */
class UrlValidator {
    /**
     * 验证是否为有效的URL
     */
    static isValidUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
        }
        catch {
            return false;
        }
    }
    /**
     * 验证URL是否包含域名
     */
    static hasDomain(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.length > 0;
        }
        catch {
            return false;
        }
    }
    /**
     * 验证URL是否为本地文件路径
     */
    static isLocalFile(url) {
        return url.startsWith('file://') || url.startsWith('/');
    }
    /**
     * 提取域名
     */
    static extractDomain(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname;
        }
        catch {
            return '';
        }
    }
    /**
     * 检查URL是否在允许的域名列表中
     */
    static isAllowedDomain(url, allowedDomains) {
        const domain = this.extractDomain(url);
        return allowedDomains.includes(domain);
    }
}
exports.UrlValidator = UrlValidator;
/**
 * 文件路径验证器
 */
class PathValidator {
    /**
     * 验证路径是否合法
     */
    static isValidPath(path) {
        // 基本路径验证
        if (!path || path.length === 0) {
            return false;
        }
        // 检查危险字符
        const dangerousChars = ['..', '~', '$'];
        for (const char of dangerousChars) {
            if (path.includes(char)) {
                return false;
            }
        }
        // 检查路径开头
        if (path.startsWith('/') && path.length > 1) {
            return false;
        }
        return true;
    }
    /**
     * 规范化路径
     */
    static normalizePath(path) {
        // 移除首尾空格
        path = path.trim();
        // 移除斜杠
        if (path.startsWith('/')) {
            path = path.substring(1);
        }
        // 移除反斜杠
        if (path.startsWith('\\')) {
            path = path.substring(1);
        }
        return path;
    }
    /**
     * 获取安全路径
     */
    static getSafePath(baseDir, relativePath) {
        const normalized = this.normalizePath(relativePath);
        if (!normalized) {
            return baseDir;
        }
        return `${baseDir}/${normalized}`;
    }
}
exports.PathValidator = PathValidator;
/**
 * 输入验证器
 */
class InputValidator {
    /**
     * 验证URL输入
     */
    static validateUrl(url, fieldName = 'URL') {
        if (!url || typeof url !== 'string') {
            throw new Error(`${fieldName} 不能为空`);
        }
        if (url.trim().length === 0) {
            throw new Error(`${fieldName} 不能为空白字符串`);
        }
        if (!UrlValidator.isValidUrl(url)) {
            throw new Error(`${fieldName} 不是有效的URL格式`);
        }
        if (!UrlValidator.hasDomain(url)) {
            throw new Error(`${fieldName} 必须包含域名`);
        }
        return url.trim();
    }
    /**
     * 验证目录路径
     */
    static validateOutputDir(dir, defaultDir) {
        if (!dir || typeof dir !== 'string') {
            return defaultDir;
        }
        const trimmedDir = dir.trim();
        if (trimmedDir.length === 0) {
            return defaultDir;
        }
        if (!PathValidator.isValidPath(trimmedDir)) {
            throw new Error('输出目录路径包含非法字符');
        }
        return trimmedDir;
    }
    /**
     * 验证并发数量
     */
    static validateMaxConcurrent(maxConcurrent) {
        const defaultMax = 5;
        if (typeof maxConcurrent !== 'number' || isNaN(maxConcurrent)) {
            return defaultMax;
        }
        if (maxConcurrent < 1) {
            return defaultMax;
        }
        if (maxConcurrent > 20) {
            throw new Error('并发数量不能超过20');
        }
        return maxConcurrent;
    }
    /**
     * 验证数字输入
     */
    static validateNumber(value, fieldName, min = 0, max = Infinity) {
        if (typeof value !== 'number' || isNaN(value)) {
            throw new Error(`${fieldName} 必须是数字`);
        }
        if (value < min) {
            throw new Error(`${fieldName} 不能小于 ${min}`);
        }
        if (value > max) {
            throw new Error(`${fieldName} 不能大于 ${max}`);
        }
        return value;
    }
    /**
     * 验证字符串输入
     */
    static validateString(value, fieldName, minLength = 0, maxLength = Infinity) {
        if (typeof value !== 'string') {
            throw new Error(`${fieldName} 必须是字符串`);
        }
        const trimmed = value.trim();
        if (trimmed.length < minLength) {
            throw new Error(`${fieldName} 长度不能小于 ${minLength}`);
        }
        if (trimmed.length > maxLength) {
            throw new Error(`${fieldName} 长度不能大于 ${maxLength}`);
        }
        return trimmed;
    }
}
exports.InputValidator = InputValidator;
/**
 * 验证错误类
 */
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
/**
 * 工具函数
 */
exports.ValidationUtils = {
    /**
     * 批量验证输入参数
     */
    validateInputs(inputs, rules) {
        const result = {};
        for (const [key, validator] of Object.entries(rules)) {
            try {
                result[key] = validator(inputs[key]);
            }
            catch (error) {
                if (error instanceof ValidationError) {
                    throw new ValidationError(`${key}: ${error.message}`);
                }
                throw error;
            }
        }
        return result;
    },
    /**
     * 检查是否为空值
     */
    isEmpty(value) {
        return value === null || value === undefined || value === '';
    },
    /**
     * 检查是否为有效的文件名
     */
    isValidFilename(filename) {
        if (!filename || typeof filename !== 'string') {
            return false;
        }
        const invalidChars = /[<>:"/\\|?*]/;
        const invalidNames = ['CON', 'PRN', 'AUX', 'NUL'];
        // 检查非法字符
        if (invalidChars.test(filename)) {
            return false;
        }
        // 检查保留文件名
        const basename = filename.split('.')[0].toUpperCase();
        if (invalidNames.includes(basename)) {
            return false;
        }
        // 检查长度
        if (filename.length > 255) {
            return false;
        }
        return true;
    }
};
//# sourceMappingURL=validators.js.map