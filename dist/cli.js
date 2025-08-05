#!/usr/bin/env node
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
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const commander_1 = require("commander");
const path = __importStar(require("path"));
const program = new commander_1.Command();
program
    .name('web-scraper-mcp')
    .description('Web Scraper MCP Server CLI')
    .version('1.0.0');
program
    .command('start')
    .description('Start the MCP server in CLI mode')
    .option('-p, --port <port>', 'Port to listen on', '3000')
    .action((options) => {
    console.log('🚀 Starting Web Scraper MCP Server...');
    console.log('📝 Server will listen for MCP protocol requests');
    // 启动主服务器进程
    const serverPath = path.join(__dirname, 'index.js');
    const child = (0, child_process_1.spawn)('node', [serverPath], {
        stdio: ['pipe', 'pipe', 'pipe']
    });
    child.stdout?.on('data', (data) => {
        process.stdout.write(data);
    });
    child.stderr?.on('data', (data) => {
        process.stderr.write(data);
    });
    child.on('close', (code) => {
        console.log(`\n🛑 Server process exited with code ${code}`);
    });
    // 处理退出信号
    process.on('SIGINT', () => {
        console.log('\n🛑 Received SIGINT, shutting down...');
        child.kill('SIGINT');
        process.exit(0);
    });
    process.on('SIGTERM', () => {
        console.log('\n🛑 Received SIGTERM, shutting down...');
        child.kill('SIGTERM');
        process.exit(0);
    });
});
program
    .command('scrape')
    .description('Scrape images or text from a URL')
    .argument('<type>', 'Type to scrape: images or text')
    .argument('<url>', 'URL to scrape')
    .option('-o, --output <dir>', 'Output directory')
    .option('-c, --concurrent <number>', 'Max concurrent downloads', '5')
    .action(async (type, url, options) => {
    if (!['images', 'text'].includes(type)) {
        console.error('❌ Invalid type. Use "images" or "text"');
        process.exit(1);
    }
    if (!url) {
        console.error('❌ URL is required');
        process.exit(1);
    }
    console.log(`🔍 Scraping ${type} from ${url}...`);
    // 构建请求
    const toolName = type === 'images' ? 'scrape_images' : 'scrape_text';
    const args = { url };
    if (options.output) {
        args.outputDir = options.output;
    }
    if (type === 'images' && options.concurrent) {
        args.maxConcurrent = parseInt(options.concurrent);
    }
    // 启动服务器并发送请求
    await sendToolRequest(toolName, args);
});
program
    .command('list')
    .description('List scraped content')
    .argument('<type>', 'Type to list: images or texts')
    .option('-o, --output <dir>', 'Output directory')
    .action(async (type, options) => {
    if (!['images', 'texts'].includes(type)) {
        console.error('❌ Invalid type. Use "images" or "texts"');
        process.exit(1);
    }
    const toolName = type === 'images' ? 'list_images' : 'list_texts';
    const args = {};
    if (options.output) {
        args.outputDir = options.output;
    }
    console.log(`📋 Listing ${type}...`);
    await sendToolRequest(toolName, args);
});
program
    .command('status')
    .description('Get scraping status')
    .option('-o, --output <dir>', 'Output directory')
    .action(async (options) => {
    console.log('📊 Getting scraping status...');
    const args = {};
    if (options.output) {
        args.outputDir = options.output;
    }
    await sendToolRequest('get_scraping_status', args);
});
program
    .command('cleanup')
    .description('Clean up scraped content')
    .argument('<type>', 'Type to clean: images or texts')
    .option('-o, --output <dir>', 'Output directory')
    .action(async (type, options) => {
    if (!['images', 'texts'].includes(type)) {
        console.error('❌ Invalid type. Use "images" or "texts"');
        process.exit(1);
    }
    const toolName = type === 'images' ? 'cleanup_images' : 'cleanup_texts';
    const args = {};
    if (options.output) {
        args.outputDir = options.output;
    }
    console.log(`🧹 Cleaning up ${type}...`);
    await sendToolRequest(toolName, args);
});
// 发送工具请求到MCP服务器
async function sendToolRequest(toolName, args) {
    return new Promise((resolve, reject) => {
        // 启动服务器进程
        const serverPath = path.join(__dirname, 'index.js');
        const child = (0, child_process_1.spawn)('node', [serverPath]);
        let output = '';
        let error = '';
        child.stdout?.on('data', (data) => {
            output += data.toString();
        });
        child.stderr?.on('data', (data) => {
            error += data.toString();
        });
        child.on('close', (code) => {
            if (code !== 0) {
                console.error(`❌ Process exited with code ${code}`);
                console.error('Error output:', error);
                reject(new Error(`Process failed with code ${code}`));
                return;
            }
            try {
                // 解析输出
                const lines = output.split('\n').filter(line => line.trim());
                for (const line of lines) {
                    try {
                        const response = JSON.parse(line);
                        if (response.jsonrpc === '2.0' && response.id) {
                            if (response.result) {
                                console.log(JSON.stringify(response.result, null, 2));
                                resolve();
                                return;
                            }
                            else if (response.error) {
                                console.error('❌ Error:', response.error);
                                reject(new Error(response.error.message));
                                return;
                            }
                        }
                    }
                    catch (parseError) {
                        // 如果不是JSON，直接输出
                        if (line.trim()) {
                            console.log(line);
                        }
                    }
                }
                resolve();
            }
            catch (error) {
                console.error('❌ Failed to process output:', error);
                reject(error);
            }
        });
        // 发送工具调用请求
        const request = {
            jsonrpc: '2.0',
            id: Date.now(),
            method: 'tools/call',
            params: {
                name: toolName,
                arguments: args
            }
        };
        child.stdin?.write(JSON.stringify(request) + '\n');
        child.stdin?.end();
    });
}
// 如果没有提供命令，显示帮助信息
if (!process.argv.slice(2).length) {
    console.log('🌐 Web Scraper MCP Server');
    console.log('========================');
    console.log('A powerful web scraping tool that works with MCP protocol');
    console.log('');
    program.outputHelp();
    process.exit(0);
}
program.parse();
//# sourceMappingURL=cli.js.map