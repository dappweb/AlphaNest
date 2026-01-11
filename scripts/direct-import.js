#!/usr/bin/env node

/**
 * GitBook 直接导入脚本
 * 尝试使用 GitBook API 直接创建页面
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const GITBOOK_API_KEY = 'gb_api_ANiQcNrXuLcNYWVOr9bQ10X2HZu8WWdij6bu0Eo4';
const GITBOOK_SPACE_ID = 'lXNHdMcZvKclDpQx8AXm';
const API_BASE = 'https://api.gitbook.com/v1';

/**
 * GitBook API 请求
 */
function apiRequest(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${API_BASE}${endpoint}`);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Authorization': `Bearer ${GITBOOK_API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Node.js GitBook Importer',
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            resolve(body);
          }
        } else {
          reject(new Error(`API Error ${res.statusCode}: ${body.substring(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

/**
 * 读取文件
 */
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    return null;
  }
}

/**
 * 创建页面
 */
async function createPage(spaceId, title, content, parentId = null) {
  try {
    const payload = {
      title: title,
      body: content,
    };
    
    if (parentId) {
      payload.parentId = parentId;
    }

    return await apiRequest('POST', `/spaces/${spaceId}/pages`, payload);
  } catch (error) {
    console.error(`   ❌ 创建失败: ${error.message}`);
    return null;
  }
}

/**
 * 获取 Space 信息
 */
async function getSpace(spaceId) {
  try {
    return await apiRequest('GET', `/spaces/${spaceId}`);
  } catch (error) {
    throw new Error(`无法访问 Space: ${error.message}`);
  }
}

/**
 * 获取现有页面
 */
async function getPages(spaceId) {
  try {
    const result = await apiRequest('GET', `/spaces/${spaceId}/pages`);
    return result.items || [];
  } catch (error) {
    console.log(`   ⚠️  无法获取现有页面列表: ${error.message}`);
    return [];
  }
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始导入文档到 GitBook...\n');
  console.log(`📚 Space ID: ${GITBOOK_SPACE_ID}`);
  console.log(`🔗 Space URL: https://app.gitbook.com/spaces/${GITBOOK_SPACE_ID}\n`);

  // 验证 Space
  try {
    const space = await getSpace(GITBOOK_SPACE_ID);
    console.log(`✅ Space 验证成功: ${space.title || space.name || 'AlphaNest Documentation'}\n`);
  } catch (error) {
    console.error(`❌ ${error.message}`);
    console.log('\n💡 建议: 请检查 Space ID 和 API Key 是否正确');
    process.exit(1);
  }

  // 文档列表
  const documents = [
    { file: 'README.md', title: 'AlphaNest 介绍', path: 'introduction' },
    { file: 'SETUP_GUIDE.md', title: '设置指南', path: 'setup/guide' },
    { file: 'PRODUCTION_QUICK_START.md', title: '快速启动指南', path: 'deployment/quick-start' },
    { file: 'DEPLOYMENT_GUIDE.md', title: '部署指南', path: 'deployment/guide' },
    { file: 'PRODUCTION_CHECKLIST.md', title: '生产环境检查清单', path: 'deployment/production-checklist' },
    { file: 'PRODUCTION_FEASIBILITY_REPORT.md', title: '生产环境可行性报告', path: 'deployment/feasibility-report' },
    { file: 'FUNCTIONAL_AVAILABILITY_REPORT.md', title: '功能可用性报告', path: 'development/functional-availability' },
    { file: 'GITBOOK_SETUP.md', title: 'GitBook 文档同步设置', path: 'setup/gitbook' },
  ];

  // 获取现有页面
  const existingPages = await getPages(GITBOOK_SPACE_ID);
  console.log(`📄 现有页面数: ${existingPages.length}\n`);

  // 导入文档
  let successCount = 0;
  let failCount = 0;

  for (const doc of documents) {
    const filePath = path.join(__dirname, '..', doc.file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  ${doc.file} - 文件不存在，跳过`);
      failCount++;
      continue;
    }

    console.log(`📄 导入: ${doc.file} -> ${doc.title}...`);
    
    const content = readFile(filePath);
    if (!content) {
      console.log(`   ❌ 无法读取文件`);
      failCount++;
      continue;
    }

    // 检查是否已存在
    const existing = existingPages.find(p => p.title === doc.title || p.path === doc.path);
    if (existing) {
      console.log(`   ⚠️  页面已存在，跳过 (${existing.uid})`);
      continue;
    }

    // 创建页面
    const result = await createPage(GITBOOK_SPACE_ID, doc.title, content);
    
    if (result) {
      console.log(`   ✅ 成功创建页面`);
      successCount++;
    } else {
      failCount++;
    }
    
    console.log('');
  }

  // 总结
  console.log('='.repeat(50));
  console.log(`✨ 导入完成!`);
  console.log(`   ✅ 成功: ${successCount}`);
  console.log(`   ❌ 失败: ${failCount}`);
  console.log(`   📊 总计: ${documents.length}`);
  console.log(`\n📖 查看文档: https://app.gitbook.com/spaces/${GITBOOK_SPACE_ID}`);
}

// 运行
main().catch((error) => {
  console.error('\n❌ 致命错误:', error.message);
  console.log('\n💡 如果 API 导入失败，请使用 GitBook Web UI 手动导入:');
  console.log(`   https://app.gitbook.com/spaces/${GITBOOK_SPACE_ID}`);
  process.exit(1);
});
