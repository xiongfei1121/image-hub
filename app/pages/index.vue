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
  { id: 2, name: '背景移除', desc: 'AI 自动移除背景', icon: '✂️', path: '/remove-bg' },
  { id: 3, name: '背景替换', desc: '替换为纯色或图片背景', icon: '🎨', path: '/replace-bg' },
  { id: 4, name: '证件照换底', desc: '红/白/蓝底一键互换', icon: '📄', path: '/photo-bg' },
  { id: 5, name: '图像拼接', desc: '多图横向或纵向拼接', icon: '🖼️', path: '/merge' },
]
</script>