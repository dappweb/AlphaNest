#!/usr/bin/env node

/**
 * GitBook 文档同步脚本
 * 将本地 Markdown 文档同步到 GitBook
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const GITBOOK_API_KEY = process.env.GITBOOK_API_KEY || 'gb_api_ANiQcNrXuLcNYWVOr9bQ10X2HZu8WWdij6bu0Eo4';
// GitBook API 必须使用 /v1/ 前缀
const GITBOOK_API_URL = 'https://api.gitbook.com/v1';
const GITBOOK_SPACE_ID = process.env.GITBOOK_SPACE_ID; // 需要先创建 Space 获取 ID

/**
 * GitBook API 请求
 */
function gitbookRequest(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${GITBOOK_API_URL}${endpoint}`);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Authorization': `Bearer ${GITBOOK_API_KEY}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`GitBook API Error: ${res.statusCode} - ${JSON.stringify(parsed)}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${body}`));
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * 创建或更新 GitBook Space
 */
async function createOrUpdateSpace(name, description) {
  try {
    if (GITBOOK_SPACE_ID) {
      // 更新现有 Space
      return await gitbookRequest('PATCH', `/spaces/${GITBOOK_SPACE_ID}`, {
        title: name,
        description: description,
      });
    } else {
      // 创建新 Space
      const space = await gitbookRequest('POST', '/spaces', {
        title: name,
        description: description,
      });
      console.log(`✅ Created GitBook Space: ${space.id}`);
      console.log(`   Add this to your .env: GITBOOK_SPACE_ID=${space.id}`);
      return space;
    }
  } catch (error) {
    console.error('Error creating/updating space:', error.message);
    throw error;
  }
}

/**
 * 读取 Markdown 文件
 */
function readMarkdownFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return null;
  }
}

/**
 * 创建或更新 GitBook 内容
 * 使用 GitBook Content API
 */
async function createOrUpdateContent(spaceId, contentPath, title, content) {
  try {
    // GitBook 使用 Pages API
    // 先尝试获取现有页面
    try {
      const pages = await gitbookRequest('GET', `/spaces/${spaceId}/pages`);
      const existingPage = pages.items?.find((p) => p.path === contentPath);
      
      if (existingPage) {
        // 更新现有页面
        console.log(`   Updating existing page...`);
        return await gitbookRequest('PATCH', `/spaces/${spaceId}/pages/${existingPage.uid}`, {
          title: title,
          body: content,
        });
      }
    } catch (error) {
      // 忽略，继续创建新页面
    }
    
    // 创建新页面
    console.log(`   Creating new page...`);
    return await gitbookRequest('POST', `/spaces/${spaceId}/pages`, {
      title: title,
      body: content,
      path: contentPath,
    });
  } catch (error) {
    console.error(`Error creating/updating content at ${contentPath}:`, error.message);
    throw error;
  }
}

/**
 * 文档映射配置
 */
const DOCUMENT_MAP = [
  {
    file: 'README.md',
    path: 'introduction',
    title: 'AlphaNest 介绍',
  },
  {
    file: 'PRODUCTION_CHECKLIST.md',
    path: 'deployment/production-checklist',
    title: '生产环境检查清单',
  },
  {
    file: 'DEPLOYMENT_GUIDE.md',
    path: 'deployment/guide',
    title: '部署指南',
  },
  {
    file: 'PRODUCTION_FEASIBILITY_REPORT.md',
    path: 'deployment/feasibility-report',
    title: '生产环境可行性报告',
  },
  {
    file: 'FUNCTIONAL_AVAILABILITY_REPORT.md',
    path: 'development/functional-availability',
    title: '功能可用性报告',
  },
  {
    file: 'SETUP_GUIDE.md',
    path: 'setup/guide',
    title: '设置指南',
  },
  {
    file: 'PRODUCTION_QUICK_START.md',
    path: 'deployment/quick-start',
    title: '快速启动指南',
  },
  {
    file: 'GITBOOK_SETUP.md',
    path: 'setup/gitbook',
    title: 'GitBook 文档同步设置',
  },
];

/**
 * 主函数
 */
async function main() {
  console.log('🚀 Starting GitBook sync...\n');

  // 检查 API Key
  if (!GITBOOK_API_KEY) {
    console.error('❌ GITBOOK_API_KEY is not set');
    process.exit(1);
  }

  // 创建或更新 Space
  const space = await createOrUpdateSpace(
    'AlphaNest Documentation',
    'AlphaNest - 去中心化 Meme 代币交易和保险平台完整文档'
  );

  const spaceId = space.id || GITBOOK_SPACE_ID;
  if (!spaceId) {
    console.error('❌ Space ID is required');
    process.exit(1);
  }

  console.log(`📚 Using Space ID: ${spaceId}\n`);

  // 同步文档
  for (const doc of DOCUMENT_MAP) {
    const filePath = path.join(__dirname, '..', doc.file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Skipping ${doc.file} (not found)`);
      continue;
    }

    console.log(`📄 Syncing ${doc.file} -> ${doc.path}...`);
    
    const content = readMarkdownFile(filePath);
    if (!content) {
      console.log(`   ⚠️  Failed to read ${doc.file}`);
      continue;
    }

    try {
      await createOrUpdateContent(spaceId, doc.path, doc.title, content);
      console.log(`   ✅ Successfully synced ${doc.title}\n`);
    } catch (error) {
      console.error(`   ❌ Error syncing ${doc.file}:`, error.message);
    }
  }

  console.log('✨ GitBook sync completed!');
  console.log(`\n📖 View your documentation at: https://app.gitbook.com/spaces/${spaceId}`);
}

// 运行主函数
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
