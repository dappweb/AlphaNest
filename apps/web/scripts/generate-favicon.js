const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// 创建基于 PopCow 主题的 favicon
// 使用橙色渐变背景和牛 emoji

async function generateFavicon() {
  const sizes = [16, 32, 48];
  const publicDir = path.join(__dirname, '../public');
  
  // 创建 SVG 图标（PopCow 主题）
  const svg = `
    <svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#fb923c;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#ea580c;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="12" fill="url(#grad)"/>
      <text x="32" y="44" font-size="36" text-anchor="middle" dominant-baseline="middle">🐄</text>
    </svg>
  `;

  try {
    // 生成不同尺寸的 PNG
    const pngBuffers = [];
    for (const size of sizes) {
      const buffer = await sharp(Buffer.from(svg))
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toBuffer();
      pngBuffers.push({ size, buffer });
    }

    // 对于 ICO 格式，我们需要创建一个包含多个尺寸的 ICO 文件
    // 由于 sharp 不直接支持 ICO，我们使用一个简单的 ICO 生成方法
    // 或者直接使用最大的 PNG 作为 favicon
    
    // 保存 32x32 作为 favicon.ico（浏览器会使用）
    const favicon32 = await sharp(Buffer.from(svg))
      .resize(32, 32)
      .png()
      .toBuffer();
    
    // 复制为 favicon.ico（大多数浏览器支持 PNG 格式的 favicon）
    fs.writeFileSync(path.join(publicDir, 'favicon.ico'), favicon32);
    
    // 同时保存为 logo.png（如果为空）
    const logo128 = await sharp(Buffer.from(svg))
      .resize(128, 128)
      .png()
      .toBuffer();
    fs.writeFileSync(path.join(publicDir, 'logo.png'), logo128);
    
    // 更新图标文件
    for (const { size, buffer } of pngBuffers) {
      if (size === 192) {
        fs.writeFileSync(path.join(publicDir, 'icons', `icon-${size}x${size}.png`), buffer);
      }
    }
    
    // 创建 192x192 图标
    const icon192 = await sharp(Buffer.from(svg))
      .resize(192, 192)
      .png()
      .toBuffer();
    fs.writeFileSync(path.join(publicDir, 'icons', 'icon-192x192.png'), icon192);
    
    // 创建 144x144 图标
    const icon144 = await sharp(Buffer.from(svg))
      .resize(144, 144)
      .png()
      .toBuffer();
    fs.writeFileSync(path.join(publicDir, 'icons', 'icon-144x144.png'), icon144);
    
    console.log('✅ Favicon and icons generated successfully!');
    console.log('   - favicon.ico (32x32)');
    console.log('   - logo.png (128x128)');
    console.log('   - icons/icon-192x192.png');
    console.log('   - icons/icon-144x144.png');
  } catch (error) {
    console.error('❌ Error generating favicon:', error);
    process.exit(1);
  }
}

generateFavicon();
