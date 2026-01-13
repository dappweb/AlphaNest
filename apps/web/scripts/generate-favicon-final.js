const fs = require('fs');
const path = require('path');

// 创建基于 PopCow 主题的 SVG
const createSVG = (size) => `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad${size}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#fb923c;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ea580c;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.1875}" fill="url(#grad${size})"/>
  <text x="${size / 2}" y="${size * 0.6875}" font-size="${size * 0.625}" text-anchor="middle" dominant-baseline="middle">🐄</text>
</svg>`;

const publicDir = path.join(__dirname, '../public');
const iconsDir = path.join(publicDir, 'icons');

// 确保目录存在
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 保存 SVG 文件
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), createSVG(32));
fs.writeFileSync(path.join(publicDir, 'logo.svg'), createSVG(128));

// 尝试使用 sharp 转换为 PNG
async function generateImages() {
  let sharp;
  try {
    sharp = require('sharp');
    console.log('✅ Sharp loaded successfully');
    
    // 生成 favicon PNG (32x32)
    const faviconSvg = Buffer.from(createSVG(32));
    await sharp(faviconSvg)
      .resize(32, 32)
      .png()
      .toFile(path.join(publicDir, 'favicon-32.png'));
    
    // 生成 logo PNG (128x128)
    const logoSvg = Buffer.from(createSVG(128));
    await sharp(logoSvg)
      .resize(128, 128)
      .png()
      .toFile(path.join(publicDir, 'logo.png'));
    
    // 生成图标文件
    const icon192Svg = Buffer.from(createSVG(192));
    await sharp(icon192Svg)
      .resize(192, 192)
      .png()
      .toFile(path.join(iconsDir, 'icon-192x192.png'));
    
    const icon144Svg = Buffer.from(createSVG(144));
    await sharp(icon144Svg)
      .resize(144, 144)
      .png()
      .toFile(path.join(iconsDir, 'icon-144x144.png'));
    
    // 尝试转换为 ICO
    try {
      const toIco = require('to-ico');
      const favicon32Buffer = fs.readFileSync(path.join(publicDir, 'favicon-32.png'));
      const icoBuffer = await toIco([favicon32Buffer]);
      fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
      console.log('✅ favicon.ico generated');
    } catch (icoError) {
      console.log('⚠️  ICO conversion failed, using PNG as favicon');
      fs.copyFileSync(path.join(publicDir, 'favicon-32.png'), path.join(publicDir, 'favicon.ico'));
    }
    
    // 清理临时文件
    if (fs.existsSync(path.join(publicDir, 'favicon-32.png'))) {
      fs.unlinkSync(path.join(publicDir, 'favicon-32.png'));
    }
    
    console.log('✅ All favicon files generated successfully!');
    console.log('   - favicon.ico');
    console.log('   - favicon.svg');
    console.log('   - logo.png');
    console.log('   - logo.svg');
    console.log('   - icons/icon-192x192.png');
    console.log('   - icons/icon-144x144.png');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('⚠️  Falling back to SVG-only favicon');
    // 如果 sharp 不可用，至少保存 SVG
    fs.copyFileSync(path.join(publicDir, 'favicon.svg'), path.join(publicDir, 'favicon.ico'));
    console.log('✅ Created SVG favicon (modern browsers support SVG favicons)');
  }
}

generateImages();
