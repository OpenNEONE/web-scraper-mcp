#!/usr/bin/env node

/**
 * 发布脚本 - 用于将MCP服务器发布到NPM
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Preparing to publish Web Scraper MCP Server to NPM');
console.log('=====================================================');

// 检查是否在正确的目录中
const packagePath = path.join(__dirname, 'package.json');
if (!fs.existsSync(packagePath)) {
  console.error('❌ Error: package.json not found. Please run this script from the project root.');
  process.exit(1);
}

// 读取package.json
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// 检查版本号是否符合语义化版本规范
const versionRegex = /^\d+\.\d+\.\d+$/;
if (!versionRegex.test(packageJson.version)) {
  console.error('❌ Error: Invalid version format. Use semantic versioning (e.g., 1.0.0)');
  process.exit(1);
}

// 检查是否已经登录到NPM
try {
  const whoami = execSync('npm whoami', { stdio: 'pipe' });
  console.log('✅ NPM user:', whoami.toString().trim());
} catch (error) {
  console.error('❌ Error: Not logged into NPM. Please run "npm login" first.');
  process.exit(1);
}

// 检查是否有未提交的更改
try {
  const gitStatus = execSync('git status --porcelain', { stdio: 'pipe' });
  if (gitStatus.toString().trim()) {
    console.warn('⚠️  Warning: There are uncommitted changes in git.');
    console.log('Consider committing changes before publishing.');
  }
} catch (error) {
  console.warn('⚠️  Warning: Git not found or not a git repository.');
}

// 构建项目
console.log('\n🔨 Building project...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully');
} catch (error) {
  console.error('❌ Build failed');
  process.exit(1);
}

// 运行测试
console.log('\n🧪 Running tests...');
try {
  execSync('npm test', { stdio: 'inherit' });
  console.log('✅ Tests passed');
} catch (error) {
  console.error('❌ Tests failed');
  process.exit(1);
}

// 检查构建产物
const distPath = path.join(__dirname, 'dist');
if (!fs.existsSync(distPath)) {
  console.error('❌ Error: dist directory not found after build.');
  process.exit(1);
}

const distFiles = fs.readdirSync(distPath);
console.log('✅ Built files:', distFiles.join(', '));

// 询问确认
console.log('\n📋 Publishing Summary:');
console.log('====================');
console.log(`Package: ${packageJson.name}`);
console.log(`Version: ${packageJson.version}`);
console.log(`Description: ${packageJson.description}`);
console.log(`License: ${packageJson.license}`);
console.log(`Repository: ${packageJson.repository.url}`);

console.log('\n🤔 Ready to publish?');
console.log('This will publish the package to NPM registry.');
console.log('Type "yes" to continue or any other key to cancel:');

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('', (answer) => {
  rl.close();
  
  if (answer.toLowerCase() !== 'yes') {
    console.log('❌ Publishing cancelled.');
    process.exit(0);
  }
  
  // 执行发布
  console.log('\n🚀 Publishing to NPM...');
  try {
    execSync('npm publish', { stdio: 'inherit' });
    console.log('\n🎉 Successfully published to NPM!');
    console.log(`📦 Package available at: https://www.npmjs.com/package/${packageJson.name}`);
    console.log(`📖 Documentation: ${packageJson.homepage}`);
  } catch (error) {
    console.error('❌ Publishing failed');
    console.error('Error:', error.message);
    process.exit(1);
  }
});