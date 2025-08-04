#!/usr/bin/env node

/**
 * 批量处理示例
 * 演示如何批量处理多个网站
 */

import { spawn } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const writeFileAsync = promisify(fs.writeFile);

// 配置MCP服务器
const MCP_SERVER_PATH = '../dist/index.js';
const OUTPUT_BASE = './batch-output';

// 要处理的网站列表
const WEBSITES = [
  'https://example.com',
  'https://jsonplaceholder.typicode.com',
  'https://httpbin.org'
];

// 输出目录结构
const OUTPUT_DIRS = {
  images: join(OUTPUT_BASE, 'images'),
  text: join(OUTPUT_BASE, 'text'),
  logs: join(OUTPUT_BASE, 'logs')
};

// 运行MCP工具调用
async function runMCPTool(toolName: string, arguments: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [MCP_SERVER_PATH]);
    
    let output = '';
    let error = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      error += data.toString();
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Process exited with code ${code}: ${error}`));
        return;
      }

      try {
        const result = JSON.parse(output);
        resolve(result);
      } catch (parseError) {
        reject(new Error(`Failed to parse output: ${parseError}`));
      }
    });

    // 发送工具调用请求
    const request = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: toolName,
        arguments
      }
    };

    child.stdin.write(JSON.stringify(request) + '\n');
    child.stdin.end();
  });
}

// 创建日志文件
async function logToFile(message: string, filename: string = 'batch.log') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  try {
    await writeFileAsync(join(OUTPUT_DIRS.logs, filename), logMessage, { flag: 'a' });
  } catch (error) {
    console.error('写入日志文件失败:', error);
  }
}

// 处理单个网站
async function processWebsite(website: string, index: number, total: number) {
  const websiteDomain = new URL(website).hostname.replace('www.', '');
  const websiteOutput = {
    images: join(OUTPUT_DIRS.images, websiteDomain),
    text: join(OUTPUT_DIRS.text, websiteDomain)
  };

  console.log(`\n🔄 处理网站 ${index + 1}/${total}: ${website}`);
  console.log(`域名: ${websiteDomain}`);

  try {
    // 记录开始时间
    const startTime = Date.now();
    await logToFile(`开始处理网站: ${website}`);

    // 爬取图片
    console.log('📷 正在爬取图片...');
    const imageResult = await runMCPTool('scrape_images', {
      url: website,
      outputDir: websiteOutput.images,
      maxConcurrent: 3 // 降低并发数避免过载
    });

    console.log(`✅ 图片爬取完成: ${imageResult.content[0].text}`);
    await logToFile(`图片爬取完成: ${imageResult.content[0].text}`);

    // 爬取文本
    console.log('📝 正在爬取文本...');
    const textResult = await runMCPTool('scrape_text', {
      url: website,
      outputDir: websiteOutput.text
    });

    console.log(`✅ 文本爬取完成: ${textResult.content[0].text}`);
    await logToFile(`文本爬取完成: ${textResult.content[0].text}`);

    // 获取该网站的统计信息
    const imageList = await runMCPTool('list_images', {
      outputDir: websiteOutput.images
    });

    const textList = await runMCPTool('list_texts', {
      outputDir: websiteOutput.text
    });

    // 记录处理结果
    const processingTime = Date.now() - startTime;
    const summary = {
      website,
      domain: websiteDomain,
      processingTime,
      images: imageList.content[0].text,
      texts: textList.content[0].text,
      timestamp: new Date().toISOString()
    };

    console.log('📊 处理摘要:');
    console.log(`   处理时间: ${processingTime}ms`);
    console.log(`   图片数量: ${JSON.parse(imageList.content[0].text).totalImages}`);
    console.log(`   文本数量: ${JSON.parse(textList.content[0].text).totalTexts}`);

    await logToFile(`处理完成: ${JSON.stringify(summary, null, 2)}`, 'summary.log');

    return summary;

  } catch (error) {
    console.error(`❌ 处理网站失败: ${website}`);
    console.error('错误:', error.message);
    await logToFile(`处理失败: ${website} - ${error.message}`, 'errors.log');
    return null;
  }
}

// 生成批量处理报告
async function generateBatchReport(results: any[]) {
  const successful = results.filter(r => r !== null);
  const failed = results.filter(r => r === null);

  const report = {
    batchId: `batch-${Date.now()}`,
    startTime: new Date().toISOString(),
    endTime: new Date().toISOString(),
    totalWebsites: WEBSITES.length,
    successful: successful.length,
    failed: failed.length,
    successRate: (successful.length / WEBSITES.length * 100).toFixed(2) + '%',
    totalProcessingTime: successful.reduce((sum, r) => sum + r.processingTime, 0),
    averageProcessingTime: successful.length > 0 ? 
      (successful.reduce((sum, r) => sum + r.processingTime, 0) / successful.length).toFixed(2) : 0,
    results: successful,
    failedWebsites: failed.map((_, index) => WEBSITES[index])
  };

  console.log('\n📋 批量处理报告');
  console.log('================');
  console.log(`批次ID: ${report.batchId}`);
  console.log(`开始时间: ${report.startTime}`);
  console.log(`结束时间: ${report.endTime}`);
  console.log(`总网站数: ${report.totalWebsites}`);
  console.log(`成功数量: ${report.successful}`);
  console.log(`失败数量: ${report.failed}`);
  console.log(`成功率: ${report.successRate}`);
  console.log(`总处理时间: ${report.totalProcessingTime}ms`);
  console.log(`平均处理时间: ${report.averageProcessingTime}ms`);

  if (failed.length > 0) {
    console.log('\n❌ 失败的网站:');
    failedWebsites.forEach((website, index) => {
      console.log(`   ${index + 1}. ${website}`);
    });
  }

  // 保存报告
  await writeFileAsync(
    join(OUTPUT_BASE, 'batch-report.json'),
    JSON.stringify(report, null, 2)
  );

  await logToFile(`批量处理完成: ${JSON.stringify(report, null, 2)}`, 'report.log');
}

// 主函数
async function main() {
  try {
    console.log('🚀 Web Scraper MCP Server 批量处理示例');
    console.log('=====================================');

    // 创建输出目录
    const fs = await import('fs-extra');
    await fs.default.ensureDir(OUTPUT_BASE);
    Object.values(OUTPUT_DIRS).forEach(dir => {
      fs.default.ensureDirSync(dir);
    });

    // 记录开始时间
    const batchStartTime = Date.now();
    await logToFile(`开始批量处理 ${WEBSITES.length} 个网站`);

    // 处理每个网站
    const results = [];
    for (let i = 0; i < WEBSITES.length; i++) {
      const result = await processWebsite(WEBSITES[i], i, WEBSITES.length);
      results.push(result);
      
      // 添加延迟避免请求过于频繁
      if (i < WEBSITES.length - 1) {
        console.log('\n⏳ 等待 2 秒...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // 生成报告
    await generateBatchReport(results);

    // 清理资源
    console.log('\n🧹 清理资源...');
    await runMCPTool('cleanup_images', { outputDir: OUTPUT_DIRS.images });
    await runMCPTool('cleanup_texts', { outputDir: OUTPUT_DIRS.text });

    const batchEndTime = Date.now();
    console.log(`\n🎉 批量处理完成! 总耗时: ${batchEndTime - batchStartTime}ms`);
    console.log(`输出目录: ${OUTPUT_BASE}`);

  } catch (error) {
    console.error('❌ 批量处理失败:', error);
    await logToFile(`批量处理失败: ${error.message}`, 'errors.log');
    process.exit(1);
  }
}

// 运行示例
main().catch(console.error);