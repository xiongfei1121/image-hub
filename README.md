# Image Hub

图像处理工具集合 - 图像压缩、背景移除、背景替换、证件照换底、图像拼接

## 🛠️ 功能列表

1. **图像压缩** - 减小文件体积，保持画质
2. **背景移除** - AI 自动移除背景 (SM MobileNet)
3. **背景替换** - 替换为纯色或图片背景
4. **证件照换底** - 红/白/蓝底一键互换
5. **图像拼接** - 多图横向或纵向拼接

## 🚀 部署

```bash
# 安装依赖
npm install

# 本地开发
npm run dev

# 构建静态文件
npm run generate
```

部署到 Cloudflare Pages:
- Build command: `npm run generate`
- Output directory: `.output/public`

## 📦 技术栈

- Nuxt 4 + Vue 3
- TailwindCSS
- @xenova/transformers (Background Removal)
- Canvas API (图像处理)

## 🔗 链接

- 仓库: https://github.com/xiongfei1121/image-hub
- 演示: (Cloudflare Pages URL)