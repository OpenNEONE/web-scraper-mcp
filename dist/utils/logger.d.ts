/**
 * 日志工具类
 */
export declare class Logger {
    private static readonly COLORS;
    private static readonly LEVELS;
    private static level;
    /**
     * 设置日志级别
     */
    static setLevel(level: keyof typeof Logger.LEVELS): void;
    /**
     * 获取当前日志级别
     */
    static getLevel(): keyof typeof Logger.LEVELS;
    /**
     * 格式化时间戳
     */
    private static formatTimestamp;
    /**
     * 获取日志颜色
     */
    private static getColor;
    /**
     * 记录日志
     */
    private static log;
    /**
     * 错误日志
     */
    static error(message: string, ...args: any[]): void;
    /**
     * 警告日志
     */
    static warn(message: string, ...args: any[]): void;
    /**
     * 信息日志
     */
    static info(message: string, ...args: any[]): void;
    /**
     * 调试日志
     */
    static debug(message: string, ...args: any[]): void;
    /**
     * 开始计时器
     */
    static timer(label: string): () => void;
    /**
     * 记录性能信息
     */
    static performance(label: string, duration: number): void;
    /**
     * 记录操作成功
     */
    static success(message: string, ...args: any[]): void;
    /**
     * 记录操作失败
     */
    static failure(message: string, ...args: any[]): void;
    /**
     * 记录进度
     */
    static progress(current: number, total: number, message?: string): void;
}
/**
 * 错误处理工具类
 */
export declare class ErrorHandler {
    /**
     * 包装异步函数，添加错误处理
     */
    static wrapAsync<T>(fn: () => Promise<T>, errorMessage?: string): Promise<T>;
    /**
     * 包装同步函数，添加错误处理
     */
    static wrapSync<T>(fn: () => T, errorMessage?: string): T;
    /**
     * 处理网络错误
     */
    static handleNetworkError(error: any): never;
    /**
     * 处理文件系统错误
     */
    static handleFileError(error: any): never;
    /**
     * 处理URL错误
     */
    static handleUrlError(error: any): never;
    /**
     * 创建标准化错误
     */
    static createStandardError(type: string, message: string, originalError?: any): Error;
    /**
     * 检查是否为可重试错误
     */
    static isRetryable(error: any): boolean;
}
/**
 * 性能监控工具
 */
export declare class PerformanceMonitor {
    private static metrics;
    /**
     * 开始计时
     */
    static startTimer(name: string): () => number;
    /**
     * 记录指标
     */
    static recordMetric(name: string, value: number): void;
    /**
     * 获取指标统计
     */
    static getMetrics(name: string): {
        count: number;
        average: number;
        min: number;
        max: number;
    } | null;
    /**
     * 获取所有指标
     */
    static getAllMetrics(): {
        [key: string]: any;
    };
    /**
     * 重置指标
     */
    static resetMetrics(): void;
    /**
     * 打印指标报告
     */
    static printReport(): void;
}
//# sourceMappingURL=logger.d.ts.map