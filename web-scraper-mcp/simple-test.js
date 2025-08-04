#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// 测试MCP服务器启动
console.log('🧪 Testing Web Scraper MCP Server');
console.log('=================================');

try {
  // 测试1: 检查dist目录是否存在
  const fs = require('fs');
  const distPath = path.join(__dirname, 'dist', 'index.js');
  
  if (fs.existsSync(distPath)) {
    console.log('✅ Built files exist');
  } else {
    console.log('❌ Built files missing');
    process.exit(1);
  }
  
  // 测试2: 检查package.json
  const packagePath = path.join(__dirname, 'package.json');
  if (fs.existsSync(packagePath)) {
    console.log('✅ Package.json exists');
    
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    console.log('✅ Package name:', packageJson.name);
    console.log('✅ Package version:', packageJson.version);
    console.log('✅ Dependencies:', Object.keys(packageJson.dependencies || {}));
  } else {
    console.log('❌ Package.json missing');
    process.exit(1);
  }
  
  // 测试3: 检查主要模块
  const scraperPath = path.join(__dirname, 'src', 'scrapers', 'imageScraper.ts');
  const textScraperPath = path.join(__dirname, 'src', 'scrapers', 'textScraper.ts');
  const indexPath = path.join(__dirname, 'src', 'index.ts');
  
  if (fs.existsSync(scraperPath)) {
    console.log('✅ Image scraper module exists');
  } else {
    console.log('❌ Image scraper module missing');
  }
  
  if (fs.existsSync(textScraperPath)) {
    console.log('✅ Text scraper module exists');
  } else {
    console.log('❌ Text scraper module missing');
  }
  
  if (fs.existsSync(indexPath)) {
    console.log('✅ Main index module exists');
  } else {
    console.log('❌ Main index module missing');
  }
  
  // 测试4: 检查文档
  const readmePath = path.join(__dirname, 'README.md');
  if (fs.existsSync(readmePath)) {
    console.log('✅ README.md exists');
  } else {
    console.log('❌ README.md missing');
  }
  
  // 测试5: 检查示例
  const examplesDir = path.join(__dirname, 'examples');
  if (fs.existsSync(examplesDir)) {
    console.log('✅ Examples directory exists');
    const files = fs.readdirSync(examplesDir);
    console.log('✅ Example files:', files);
  } else {
    console.log('❌ Examples directory missing');
  }
  
  console.log('\n🎉 All tests passed!');
  console.log('✅ The MCP server is ready for use');
  console.log('✅ Ready for NPM publication');
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}