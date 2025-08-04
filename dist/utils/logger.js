"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceMonitor = exports.ErrorHandler = exports.Logger = void 0;
/**
 * 日志工具类
 */
class Logger {
    /**
     * 设置日志级别
     */
    static setLevel(level) {
        Logger.level = level;
    }
    /**
     * 获取当前日志级别
     */
    static getLevel() {
        return Logger.level;
    }
    /**
     * 格式化时间戳
     */
    static formatTimestamp(date) {
        return date.toISOString();
    }
    /**
     * 获取日志颜色
     */
    static getColor(level) {
        switch (level) {
            case 'ERROR':
                return Logger.COLORS.red;
            case 'WARN':
                return Logger.COLORS.yellow;
            case 'INFO':
                return Logger.COLORS.green;
            case 'DEBUG':
                return Logger.COLORS.gray;
            default:
                return Logger.COLORS.reset;
        }
    }
    /**
     * 记录日志
     */
    static log(level, message, ...args) {
        if (Logger.LEVELS[level] > Logger.LEVELS[Logger.level]) {
            return;
        }
        const color = this.getColor(level);
        const timestamp = this.formatTimestamp(new Date());
        const levelStr = level.padEnd(5);
        const formattedMessage = `${color}[${timestamp}] [${levelStr}] ${Logger.COLORS.reset}${message}`;
        // 根据级别输出到不同的控制台
        switch (level) {
            case 'ERROR':
                console.error(formattedMessage, ...args);
                break;
            case 'WARN':
                console.warn(formattedMessage, ...args);
                break;
            case 'INFO':
                console.info(formattedMessage, ...args);
                break;
            case 'DEBUG':
                console.debug(formattedMessage, ...args);
                break;
        }
    }
    /**
     * 错误日志
     */
    static error(message, ...args) {
        Logger.log('ERROR', message, ...args);
    }
    /**
     * 警告日志
     */
    static warn(message, ...args) {
        Logger.log('WARN', message, ...args);
    }
    /**
     * 信息日志
     */
    static info(message, ...args) {
        Logger.log('INFO', message, ...args);
    }
    /**
     * 调试日志
     */
    static debug(message, ...args) {
        Logger.log('DEBUG', message, ...args);
    }
    /**
     * 开始计时器
     */
    static timer(label) {
        const start = Date.now();
        Logger.debug(`Timer started: ${label}`);
        return () => {
            const duration = Date.now() - start;
            Logger.debug(`Timer finished: ${label} - ${duration}ms`);
        };
    }
    /**
     * 记录性能信息
     */
    static performance(label, duration) {
        Logger.info(`Performance: ${label} - ${duration}ms`);
    }
    /**
     * 记录操作成功
     */
    static success(message, ...args) {
        Logger.log('INFO', `✓ ${message}`, ...args);
    }
    /**
     * 记录操作失败
     */
    static failure(message, ...args) {
        Logger.log('ERROR', `✗ ${message}`, ...args);
    }
    /**
     * 记录进度
     */
    static progress(current, total, message = '') {
        const percentage = Math.round((current / total) * 100);
        const bar = '█'.repeat(Math.floor(percentage / 10)) + '░'.repeat(10 - Math.floor(percentage / 10));
        Logger.info(`Progress: [${bar}] ${percentage}% (${current}/${total}) ${message}`);
    }
}
exports.Logger = Logger;
Logger.COLORS = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    gray: '\x1b[90m'
};
Logger.LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
};
Logger.level = 'INFO';
/**
 * 错误处理工具类
 */
class ErrorHandler {
    /**
     * 包装异步函数，添加错误处理
     */
    static async wrapAsync(fn, errorMessage) {
        try {
            return await fn();
        }
        catch (error) {
            Logger.error(errorMessage || '异步操作失败', error);
            throw error;
        }
    }
    /**
     * 包装同步函数，添加错误处理
     */
    static wrapSync(fn, errorMessage) {
        try {
            return fn();
        }
        catch (error) {
            Logger.error(errorMessage || '同步操作失败', error);
            throw error;
        }
    }
    /**
     * 处理网络错误
     */
    static handleNetworkError(error) {
        if (error.response) {
            // 服务器响应了但是状态码不在 2xx 范围内
            const status = error.response.status;
            const message = error.response.data?.message || error.message;
            switch (status) {
                case 400:
                    throw new Error(`请求参数错误: ${message}`);
                case 401:
                    throw new Error('未授权访问，请检查认证信息');
                case 403:
                    throw new Error('禁止访问，权限不足');
                case 404:
                    throw new Error('请求的资源不存在');
                case 429:
                    throw new Error('请求过于频繁，请稍后再试');
                case 500:
                    throw new Error('服务器内部错误');
                case 502:
                    throw new Error('网关错误');
                case 503:
                    throw new Error('服务不可用');
                default:
                    throw new Error(`网络错误 (${status}): ${message}`);
            }
        }
        else if (error.request) {
            // 请求已经发出，但没有收到响应
            throw new Error('网络连接失败，请检查网络连接');
        }
        else {
            // 请求配置出错
            throw new Error(`请求配置错误: ${error.message}`);
        }
    }
    /**
     * 处理文件系统错误
     */
    static handleFileError(error) {
        const code = error.code;
        switch (code) {
            case 'ENOENT':
                throw new Error('文件或目录不存在');
            case 'EACCES':
                throw new Error('权限不足，无法访问文件');
            case 'EISDIR':
                throw new Error('路径是目录，不是文件');
            case 'ENOTDIR':
                throw new Error('路径不是目录');
            case 'EEXIST':
                throw new Error('文件已存在');
            case 'ENOSPC':
                throw new Error('磁盘空间不足');
            default:
                throw new Error(`文件系统错误 (${code}): ${error.message}`);
        }
    }
    /**
     * 处理URL错误
     */
    static handleUrlError(error) {
        if (error instanceof TypeError && error.message.includes('URL')) {
            throw new Error('无效的URL格式');
        }
        throw new Error(`URL处理错误: ${error.message}`);
    }
    /**
     * 创建标准化错误
     */
    static createStandardError(type, message, originalError) {
        const error = new Error(`${type}: ${message}`);
        error.name = type;
        if (originalError) {
            error.originalError = originalError;
            error.stack = originalError.stack;
        }
        return error;
    }
    /**
     * 检查是否为可重试错误
     */
    static isRetryable(error) {
        const retryableCodes = [
            'ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED', 'ECONNRESET',
            'EHOSTUNREACH', 'EPIPE', 'ENETUNREACH', 'EAI_AGAIN'
        ];
        if (error.code && retryableCodes.includes(error.code)) {
            return true;
        }
        if (error.response && error.response.status >= 500) {
            return true;
        }
        return false;
    }
}
exports.ErrorHandler = ErrorHandler;
/**
 * 性能监控工具
 */
class PerformanceMonitor {
    /**
     * 开始计时
     */
    static startTimer(name) {
        const start = performance.now();
        return () => {
            const duration = performance.now() - start;
            this.recordMetric(name, duration);
            return duration;
        };
    }
    /**
     * 记录指标
     */
    static recordMetric(name, value) {
        if (!this.metrics[name]) {
            this.metrics[name] = [];
        }
        this.metrics[name].push(value);
    }
    /**
     * 获取指标统计
     */
    static getMetrics(name) {
        const values = this.metrics[name];
        if (!values || values.length === 0) {
            return null;
        }
        const sum = values.reduce((a, b) => a + b, 0);
        const average = sum / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);
        return {
            count: values.length,
            average,
            min,
            max
        };
    }
    /**
     * 获取所有指标
     */
    static getAllMetrics() {
        const result = {};
        for (const [name, values] of Object.entries(this.metrics)) {
            result[name] = this.getMetrics(name);
        }
        return result;
    }
    /**
     * 重置指标
     */
    static resetMetrics() {
        this.metrics = {};
    }
    /**
     * 打印指标报告
     */
    static printReport() {
        const metrics = this.getAllMetrics();
        Logger.info('=== 性能报告 ===');
        for (const [name, data] of Object.entries(metrics)) {
            if (data) {
                Logger.info(`${name}: 平均=${data.average.toFixed(2)}ms, 最小=${data.min.toFixed(2)}ms, 最大=${data.max.toFixed(2)}ms, 次数=${data.count}`);
            }
        }
        Logger.info('===============');
    }
}
exports.PerformanceMonitor = PerformanceMonitor;
PerformanceMonitor.metrics = {};
//# sourceMappingURL=logger.js.map