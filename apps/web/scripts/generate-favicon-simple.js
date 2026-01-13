const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 创建基于 PopCow 主题的 SVG favicon
const svgContent = `<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#fb923c;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ea580c;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="32" height="32" rx="6" fill="url(#grad)"/>
  <text x="16" y="22" font-size="20" text-anchor="middle" dominant-baseline="middle">🐄</text>
</svg>`;

const publicDir = path.join(__dirname, '../public');
const iconsDir = path.join(publicDir, 'icons');

// 确保目录存在
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 保存 SVG
const svgPath = path.join(publicDir, 'favicon.svg');
fs.writeFileSync(svgPath, svgContent);

// 尝试使用 ImageMagick 转换为 ICO（如果可用）
try {
  // 检查是否有 convert 命令
  execSync('which convert', { stdio: 'ignore' });
  
  // 创建临时 PNG
  const pngPath = path.join(publicDir, 'favicon-temp.png');
  execSync(`convert -background none -size 32x32 ${svgPath} ${pngPath}`, { stdio: 'inherit' });
  
  // 转换为 ICO
  execSync(`convert ${pngPath} ${path.join(publicDir, 'favicon.ico')}`, { stdio: 'inherit' });
  
  // 清理临时文件
  fs.unlinkSync(pngPath);
  
  console.log('✅ Favicon.ico generated using ImageMagick');
} catch (error) {
  // 如果 ImageMagick 不可用，创建一个简单的 PNG 作为 favicon
  console.log('⚠️  ImageMagick not available, creating PNG favicon instead');
  
  // 创建一个简单的 Base64 编码的 PNG favicon（32x32 橙色背景 + 牛 emoji）
  // 这是一个最小的有效 PNG（1x1 透明像素）
  // 实际应用中，我们需要真正的图片处理库
  
  // 作为临时方案，我们创建一个简单的 ICO 文件头 + PNG 数据
  // 或者直接使用 SVG favicon（现代浏览器支持）
  
  // 复制 SVG 作为 favicon（现代浏览器支持 SVG favicon）
  fs.copyFileSync(svgPath, path.join(publicDir, 'favicon.ico'));
  console.log('✅ Created SVG favicon (modern browsers will use it)');
}

// 创建 logo.png（使用更大的 SVG）
const logoSvg = `<svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#fb923c;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ea580c;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="24" fill="url(#grad2)"/>
  <text x="64" y="88" font-size="72" text-anchor="middle" dominant-baseline="middle">🐄</text>
</svg>`;

try {
  const logoPngPath = path.join(publicDir, 'logo-temp.png');
  execSync(`convert -background none -size 128x128 <(echo '${logoSvg}') ${logoPngPath}`, { 
    stdio: 'inherit',
    shell: '/bin/bash'
  });
  fs.renameSync(logoPngPath, path.join(publicDir, 'logo.png'));
  console.log('✅ logo.png generated');
} catch (error) {
  // 如果转换失败，至少保存 SVG
  fs.writeFileSync(path.join(publicDir, 'logo.svg'), logoSvg);
  console.log('⚠️  Created logo.svg (PNG conversion failed)');
}

console.log('✅ Favicon generation complete!');
console.log('   Files created:');
console.log('   - public/favicon.ico (or .svg)');
console.log('   - public/favicon.svg');
console.log('   - public/logo.png (or .svg)');
