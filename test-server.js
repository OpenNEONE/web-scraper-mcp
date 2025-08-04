#!/usr/bin/env node

const { spawn } = require('child_process');

// 测试MCP服务器
function testMCPServer() {
  const server = spawn('node', ['dist/index.js']);
  
  let output = '';
  let error = '';
  
  server.stdout.on('data', (data) => {
    output += data.toString();
    console.log('STDOUT:', data.toString());
  });
  
  server.stderr.on('data', (data) => {
    error += data.toString();
    console.log('STDERR:', data.toString());
  });
  
  server.on('close', (code) => {
    console.log('Server closed with code:', code);
    if (code === 0) {
      console.log('✅ MCP Server test passed');
    } else {
      console.log('❌ MCP Server test failed');
    }
  });
  
  server.on('error', (err) => {
    console.error('❌ Failed to start server:', err);
  });
  
  // 等待几秒后关闭
  setTimeout(() => {
    server.kill();
  }, 5000);
}

// 测试工具列表
function testListTools() {
  console.log('\n📋 Testing tools list...');
  
  const child = spawn('node', ['dist/index.js']);
  
  let output = '';
  
  child.stdout.on('data', (data) => {
    output += data.toString();
    const lines = output.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      try {
        const response = JSON.parse(line);
        if (response.method === 'tools/list') {
          console.log('✅ Tools list received');
          console.log('Available tools:', JSON.stringify(response.params.tools, null, 2));
          child.kill();
          return;
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
  });
  
  child.on('close', (code) => {
    if (code !== 0) {
      console.log('❌ Tools list test failed');
    }
  });
  
  // 发送工具列表请求
  const request = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
    params: {}
  };
  
  child.stdin.write(JSON.stringify(request) + '\n');
}

// 运行测试
console.log('🧪 Testing Web Scraper MCP Server');
console.log('=================================');

testMCPServer();

setTimeout(() => {
  testListTools();
}, 3000);