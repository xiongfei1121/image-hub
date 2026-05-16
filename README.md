# Image Hub

图像处理工具集合 - 图像压缩、背景移除、背景替换、证件照换底、图像拼接

## ✨ 特性

- 🎨 **现代简洁设计** - 参考 SlimImg 的设计风格，提供优雅的用户体验
- 🔒 **隐私优先** - 所有处理在本地完成，不上传服务器
- ⚡ **极速处理** - 毫秒级响应，无需等待上传
- 🆓 **永久免费** - 开箱即用，无需付费

## 🛠️ 功能列表

1. **图像压缩** - 减小文件体积，保持画质
2. **图像拼接** - 多图横向或纵向拼接
3. **格式转换** - JPG/PNG/WebP 格式互转
4. **图像裁剪** - 自定义裁剪区域
5. **图像调整** - 旋转、翻转、调整大小
6. **图像水印** - 添加文字或图片水印

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 本地开发
npm run dev

# 构建静态文件
npm run generate
```

## 📦 部署

### Cloudflare Pages

- Build command: `npm run generate`
- Output directory: `.output/public`

### Vercel

- Framework Preset: Nuxt.js
- Build Command: `npm run generate`
- Output Directory: `.output/public`

## 🎨 设计特点

- **配色方案**: Indigo 主色调 + 渐变背景
- **组件设计**: 圆角卡片 + 轻微阴影
- **动画效果**: 流畅的过渡和悬停效果
- **响应式设计**: 完美适配移动端和桌面端

## 📦 技术栈

- **框架**: Nuxt 4 + Vue 3
- **样式**: TailwindCSS
- **图像处理**: Canvas API
- **压缩引擎**: libcaesium-wasm

## 📝 更新日志

### v2.0.0 (2026-05-16)

**重大更新**
- 🎨 全新设计：参考 SlimImg 的现代简洁风格
- 🎯 优化用户体验：更直观的操作流程
- ⚡ 性能优化：更快的加载速度
- 📱 响应式设计：完美支持移动端

**视觉改进**
- 新增 Hero 区域和功能卡片
- 统一的配色方案（Indigo 主色调）
- 圆角卡片设计 + 轻微阴影
- 流畅的动画效果
- 优化的图标和排版

**功能优化**
- 改进的文件上传体验
- 更清晰的状态提示
- 优化的设置面板布局
- 增强的预览功能

## 🔗 链接

- **仓库**: https://github.com/xiongfei1121/image-hub
- **问题反馈**: https://github.com/xiongfei1121/image-hub/issues

## 📄 许可证

MIT License