<template>
  <div>
    <!-- Hero 区域 -->
    <section class="gradient-hero py-20 lg:py-32">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 animate-fade-in">
          老熊图像处理工具站
        </h1>
        <p class="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto animate-fade-in">
          快速、安全、本地处理 - 所有操作在浏览器中完成，不上传服务器，保护您的隐私
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
          <NuxtLink to="/compress" class="btn-primary">
            开始使用
          </NuxtLink>
          <a href="#features" class="btn-secondary">
            了解更多
          </a>
        </div>
      </div>
    </section>

    <!-- 特性介绍 -->
    <section class="py-16 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="text-center">
            <div class="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">极速处理</h3>
            <p class="text-gray-600">毫秒级响应，无需等待上传</p>
          </div>
          <div class="text-center">
            <div class="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">隐私优先</h3>
            <p class="text-gray-600">所有处理在本地完成，不上传服务器</p>
          </div>
          <div class="text-center">
            <div class="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">永久免费</h3>
            <p class="text-gray-600">开箱即用，无需付费</p>
          </div>
        </div>
      </div>
    </section>

    <!-- 功能卡片 -->
    <section id="features" class="py-16 bg-gray-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-gray-900 mb-4">功能列表</h2>
          <p class="text-gray-600 max-w-2xl mx-auto">
            提供多种图像处理工具，满足您的各种需求
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <NuxtLink
            v-for="tool in tools"
            :key="tool.id"
            :to="tool.path"
            class="card group cursor-pointer"
          >
            <div class="card-body">
              <div class="w-14 h-14 rounded-xl mb-4 flex items-center justify-center text-3xl transition-transform group-hover:scale-110"
                   :class="tool.bgColor">
                {{ tool.icon }}
              </div>
              <h3 class="text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                {{ tool.name }}
              </h3>
              <p class="text-gray-600 text-sm leading-relaxed">
                {{ tool.desc }}
              </p>
            </div>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- 使用步骤 -->
    <section class="py-16 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-gray-900 mb-4">如何使用</h2>
          <p class="text-gray-600">简单三步，轻松完成图像处理</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="text-center">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 flex items-center justify-center">
              <span class="text-2xl font-bold text-primary-600">01</span>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">选择工具</h3>
            <p class="text-gray-600 text-sm">选择您需要的图像处理工具</p>
          </div>
          <div class="text-center">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 flex items-center justify-center">
              <span class="text-2xl font-bold text-primary-600">02</span>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">上传图片</h3>
            <p class="text-gray-600 text-sm">拖拽或点击上传您的图片</p>
          </div>
          <div class="text-center">
            <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 flex items-center justify-center">
              <span class="text-2xl font-bold text-primary-600">03</span>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">下载保存</h3>
            <p class="text-gray-600 text-sm">处理完成后下载到本地</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA 区域 -->
    <section class="py-16 gradient-primary">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="text-3xl font-bold text-white mb-4">
          开始使用老熊图像处理工具站
        </h2>
        <p class="text-white text-opacity-90 mb-8 max-w-2xl mx-auto">
          无需注册，无需安装，打开浏览器即可使用
        </p>
        <NuxtLink to="/compress" class="inline-block px-8 py-4 bg-white text-primary-600 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5">
          立即开始
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup>
const tools = [
  { 
    id: 1, 
    name: '图像压缩', 
    desc: '减小文件体积，保持画质。支持 JPG、PNG、WebP 格式，可批量处理', 
    icon: '🗜️', 
    path: '/compress',
    bgColor: 'bg-blue-100'
  },
  { 
    id: 2, 
    name: '图像拼接', 
    desc: '多图横向或纵向拼接，支持自定义间距和背景色', 
    icon: '🖼️', 
    path: '/merge',
    bgColor: 'bg-green-100'
  },
  { 
    id: 3, 
    name: '格式转换', 
    desc: 'JPG、PNG、WebP 格式互转，支持批量转换', 
    icon: '🔄', 
    path: '/convert',
    bgColor: 'bg-purple-100'
  },
  { 
    id: 4, 
    name: '图像裁剪', 
    desc: '自定义裁剪区域，支持预设比例和自由裁剪', 
    icon: '✂️', 
    path: '/crop',
    bgColor: 'bg-red-100'
  },
  { 
    id: 5, 
    name: '图像调整', 
    desc: '旋转、翻转、调整大小，支持自定义尺寸', 
    icon: '📐', 
    path: '/resize',
    bgColor: 'bg-yellow-100'
  },
  { 
    id: 6, 
    name: '图像水印', 
    desc: '添加文字或图片水印，支持位置和透明度调整', 
    icon: '💧', 
    path: '/watermark',
    bgColor: 'bg-indigo-100'
  },
]
</script>
