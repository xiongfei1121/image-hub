<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 py-4">
        <NuxtLink to="/" class="text-xl font-bold text-gray-900">
          Image Hub
        </NuxtLink>
      </div>
    </header>
    <main class="max-w-7xl mx-auto px-4 py-8">
      <slot />
    </main>
    <footer class="bg-white border-t mt-auto">
      <div class="max-w-7xl mx-auto px-4 py-4 text-center text-gray-500 text-sm">
        © 2026 Image Hub - 图像处理工具集合
      </div>
    </footer>
  </div>
</template>