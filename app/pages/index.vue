<template>
  <div>
    <h1 class="text-3xl font-bold text-gray-900 mb-8">图像处理工具</h1>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <NuxtLink
        v-for="tool in tools"
        :key="tool.id"
        :to="tool.path"
        class="block p-6 bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow"
      >
        <div class="text-3xl mb-3">{{ tool.icon }}</div>
        <h2 class="text-lg font-semibold text-gray-900 mb-2">{{ tool.name }}</h2>
        <p class="text-gray-600 text-sm">{{ tool.desc }}</p>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
const tools = [
  { id: 1, name: '图像压缩', desc: '减小文件体积，保持画质', icon: '🗜️', path: '/compress' },
  { id: 2, name: '图像拼接', desc: '多图横向或纵向拼接', icon: '🖼️', path: '/merge' },
  { id: 3, name: '格式转换', desc: 'JPG/PNG/WebP 格式互转', icon: '🔄', path: '/convert' },
  { id: 4, name: '图像裁剪', desc: '自定义裁剪区域', icon: '✂️', path: '/crop' },
  { id: 5, name: '图像调整', desc: '旋转、翻转、调整大小', icon: '📐', path: '/resize' },
  { id: 6, name: '图像水印', desc: '添加文字或图片水印', icon: '💧', path: '/watermark' },
]
</script>
