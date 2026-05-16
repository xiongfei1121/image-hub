<template>
  <div class="min-h-screen flex flex-col bg-gray-50">
    <!-- 导航栏 -->
    <header class="bg-white shadow-sm sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo -->
          <NuxtLink to="/" class="flex items-center gap-2 group">
            <div class="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <span class="text-white text-xl">🖼️</span>
            </div>
            <span class="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
              Image Hub
            </span>
          </NuxtLink>

          <!-- 桌面导航 -->
          <nav class="hidden md:flex items-center gap-1">
            <NuxtLink
              v-for="item in navItems"
              :key="item.path"
              :to="item.path"
              class="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              :class="isActive(item.path) 
                ? 'text-primary-600 bg-primary-50' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'"
            >
              {{ item.name }}
            </NuxtLink>
          </nav>

          <!-- 移动端菜单按钮 -->
          <button 
            @click="mobileMenuOpen = !mobileMenuOpen"
            class="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            <svg v-if="!mobileMenuOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- 移动端导航菜单 -->
        <div v-if="mobileMenuOpen" class="md:hidden py-4 border-t">
          <nav class="flex flex-col gap-1">
            <NuxtLink
              v-for="item in navItems"
              :key="item.path"
              :to="item.path"
              @click="mobileMenuOpen = false"
              class="px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200"
              :class="isActive(item.path) 
                ? 'text-primary-600 bg-primary-50' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'"
            >
              {{ item.name }}
            </NuxtLink>
          </nav>
        </div>
      </div>
    </header>

    <!-- 主内容 -->
    <main class="flex-1">
      <slot />
    </main>

    <!-- 页脚 -->
    <footer class="bg-gray-900 text-gray-400 mt-auto">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Logo & 简介 -->
          <div class="col-span-1 md:col-span-2">
            <div class="flex items-center gap-2 mb-4">
              <div class="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <span class="text-white text-xl">🖼️</span>
              </div>
              <span class="text-xl font-bold text-white">Image Hub</span>
            </div>
            <p class="text-sm leading-relaxed max-w-md">
              图像处理工具集合 - 快速、安全、本地处理。所有操作在浏览器中完成，不上传服务器，保护您的隐私。
            </p>
          </div>

          <!-- 快速链接 -->
          <div>
            <h3 class="text-white font-semibold mb-4">快速链接</h3>
            <ul class="space-y-2 text-sm">
              <li>
                <NuxtLink to="/compress" class="hover:text-white transition-colors">图像压缩</NuxtLink>
              </li>
              <li>
                <NuxtLink to="/merge" class="hover:text-white transition-colors">图像拼接</NuxtLink>
              </li>
              <li>
                <NuxtLink to="/convert" class="hover:text-white transition-colors">格式转换</NuxtLink>
              </li>
              <li>
                <NuxtLink to="/crop" class="hover:text-white transition-colors">图像裁剪</NuxtLink>
              </li>
            </ul>
          </div>
        </div>

        <!-- 版权信息 -->
        <div class="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>© 2026 Image Hub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const mobileMenuOpen = ref(false)

const navItems = [
  { name: '首页', path: '/' },
  { name: '图像压缩', path: '/compress' },
  { name: '图像拼接', path: '/merge' },
  { name: '格式转换', path: '/convert' },
  { name: '图像裁剪', path: '/crop' },
  { name: '图像调整', path: '/resize' },
  { name: '图像水印', path: '/watermark' },
]

const isActive = (path) => {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}
</script>
