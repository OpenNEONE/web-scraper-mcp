#!/usr/bin/env node

/**
 * MCP客户端示例
 * 演示如何与MCP服务器进行交互
 */

import { spawn } from 'child_process';
import { EventEmitter } from 'events';

export class MCPClient extends EventEmitter {
  private serverPath: string;
  private child: any;
  private requestId: number = 0;
  private pendingRequests: Map<number, { resolve: Function; reject: Function }> = new Map();

  constructor(serverPath: string) {
    super();
    this.serverPath = serverPath;
  }

  /**
   * 连接到MCP服务器
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.child = spawn('node', [this.serverPath]);
      
      let output = '';
      let error = '';

      this.child.stdout.on('data', (data: Buffer) => {
        output += data.toString();
        this.processOutput(output);
        output = '';
      });

      this.child.stderr.on('data', (data: Buffer) => {
        error += data.toString();
        this.emit('error', error);
      });

      this.child.on('close', (code: number) => {
        if (code !== 0) {
          reject(new Error(`Server exited with code ${code}`));
        }
      });

      this.child.on('error', (err: Error) => {
        reject(err);
      });

      // 等待服务器启动
      setTimeout(() => {
        if (this.child) {
          resolve();
        } else {
          reject(new Error('Failed to start server'));
        }
      }, 1000);
    });
  }

  /**
   * 处理服务器输出
   */
  private processOutput(output: string): void {
    const lines = output.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      try {
        const response = JSON.parse(line);
        this.handleResponse(response);
      } catch (error) {
        console.error('Failed to parse server response:', error);
      }
    }
  }

  /**
   * 处理服务器响应
   */
  private handleResponse(response: any): void {
    if (response.jsonrpc === '2.0') {
      if (response.id) {
        // 响应已完成的请求
        const pending = this.pendingRequests.get(response.id);
        if (pending) {
          this.pendingRequests.delete(response.id);
          if (response.error) {
            pending.reject(new Error(response.error.message));
          } else {
            pending.resolve(response.result);
          }
        }
      } else if (response.method) {
        // 服务器通知
        this.emit('notification', response);
      }
    }
  }

  /**
   * 调用工具
   */
  async callTool(name: string, arguments: any = {}): Promise<any> {
    const id = ++this.requestId;
    const request = {
      jsonrpc: '2.0',
      id,
      method: 'tools/call',
      params: {
        name,
        arguments
      }
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      this.child.stdin.write(JSON.stringify(request) + '\n');
    });
  }

  /**
   * 列出所有可用工具
   */
  async listTools(): Promise<any> {
    return this.callTool('list_tools');
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.child) {
      this.child.kill();
      this.child = null;
    }
    this.pendingRequests.clear();
  }
}

// 使用示例
async function main() {
  console.log('🚀 MCP客户端示例');
  console.log('=================');

  try {
    // 创建客户端实例
    const client = new MCPClient('../dist/index.js');
    
    // 连接到服务器
    console.log('📡 连接到MCP服务器...');
    await client.connect();
    console.log('✅ 连接成功');

    // 列出可用工具
    console.log('\n📋 获取可用工具列表...');
    const tools = await client.listTools();
    console.log('可用工具:', JSON.stringify(tools, null, 2));

    // 爬取图片
    console.log('\n📷 爬取图片...');
    const imageResult = await client.callTool('scrape_images', {
      url: 'https://example.com',
      outputDir: './client-images'
    });
    console.log('图片爬取结果:', JSON.stringify(imageResult, null, 2));

    // 爬取文本
    console.log('\n📝 爬取文本...');
    const textResult = await client.callTool('scrape_text', {
      url: 'https://example.com',
      outputDir: './client-text'
    });
    console.log('文本爬取结果:', JSON.stringify(textResult, null, 2));

    // 获取状态
    console.log('\n📊 获取状态...');
    const status = await client.callTool('get_scraping_status');
    console.log('状态信息:', JSON.stringify(status, null, 2));

    // 列出图片
    console.log('\n📋 列出图片...');
    const images = await client.callTool('list_images');
    console.log('图片列表:', JSON.stringify(images, null, 2));

    // 列出文本
    console.log('\n📋 列出文本...');
    const texts = await client.callTool('list_texts');
    console.log('文本列表:', JSON.stringify(texts, null, 2));

    // 清理资源
    console.log('\n🧹 清理资源...');
    await client.callTool('cleanup_images');
    await client.callTool('cleanup_texts');
    console.log('✅ 清理完成');

    console.log('\n🎉 客户端示例执行完成!');

  } catch (error) {
    console.error('❌ 客户端示例失败:', error);
    process.exit(1);
  }
}

// 运行示例
if (require.main === module) {
  main().catch(console.error);
}

export default MCPClient;