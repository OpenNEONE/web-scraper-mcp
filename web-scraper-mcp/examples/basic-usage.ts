#!/usr/bin/env node

/**
 * 基本使用示例
 * 演示如何使用Web Scraper MCP Server的基本功能
 */

import { spawn } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const writeFileAsync = promisify(fs.writeFile);

// 配置MCP服务器
const MCP_SERVER_PATH = '../dist/index.js';
const TEMP_DIR = './temp-output';

// 创建测试用的输入JSON
async function createTestInput() {
  const testCases = [
    {
      name: 'scrape_images',
      arguments: {
        url: 'https://example.com',
        outputDir: join(TEMP_DIR, 'images')
      }
    },
    {
      name: 'scrape_text',
      arguments: {
        url: 'https://example.com',
        outputDir: join(TEMP_DIR, 'text')
      }
    },
    {
      name: 'list_images',
      arguments: {
        outputDir: join(TEMP_DIR, 'images')
      }
    },
    {
      name: 'list_texts',
      arguments: {
        outputDir: join(TEMP_DIR, 'text')
      }
    }
  ];

  // 创建JSON输入文件
  const inputJson = JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: testCases[0].name,
      arguments: testCases[0].arguments
    }
  }, null, 2);

  await writeFileAsync('test-input.json', inputJson);
  return testCases;
}

// 运行MCP服务器并执行工具调用
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

// 主函数
async function main() {
  try {
    console.log('🚀 Web Scraper MCP Server 基本使用示例');
    console.log('=====================================');

    // 创建测试用例
    const testCases = await createTestInput();
    
    // 创建临时目录
    const fs = await import('fs-extra');
    await fs.default.ensureDir(TEMP_DIR);
    await fs.default.ensureDir(join(TEMP_DIR, 'images'));
    await fs.default.ensureDir(join(TEMP_DIR, 'text'));

    // 执行测试用例
    for (const testCase of testCases) {
      console.log(`\n📋 执行工具: ${testCase.name}`);
      console.log(`参数:`, JSON.stringify(testCase.arguments, null, 2));

      try {
        const result = await runMCPTool(testCase.name, testCase.arguments);
        console.log('✅ 成功!');
        console.log('结果:', JSON.stringify(result, null, 2));
      } catch (error) {
        console.error('❌ 失败:', error.message);
      }
    }

    // 获取状态
    console.log('\n📊 获取爬虫状态');
    try {
      const status = await runMCPTool('get_scraping_status', {
        outputDir: TEMP_DIR
      });
      console.log('✅ 状态获取成功');
      console.log('状态:', JSON.stringify(status, null, 2));
    } catch (error) {
      console.error('❌ 状态获取失败:', error.message);
    }

    // 清理
    console.log('\n🧹 清理临时文件');
    try {
      await runMCPTool('cleanup_images', {
        outputDir: join(TEMP_DIR, 'images')
      });
      console.log('✅ 图片清理完成');
    } catch (error) {
      console.error('❌ 图片清理失败:', error.message);
    }

    try {
      await runMCPTool('cleanup_texts', {
        outputDir: join(TEMP_DIR, 'text')
      });
      console.log('✅ 文本清理完成');
    } catch (error) {
      console.error('❌ 文本清理失败:', error.message);
    }

    // 删除临时目录
    await fs.remove(TEMP_DIR);
    console.log('\n🎉 示例执行完成!');

  } catch (error) {
    console.error('❌ 示例执行失败:', error);
    process.exit(1);
  }
}

// 运行示例
main().catch(console.error);