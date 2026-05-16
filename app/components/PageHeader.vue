<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- 页面标题 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-2">
        <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" :class="iconBg">
          {{ icon }}
        </div>
        <div>
          <h1 class="text-3xl font-bold text-gray-900">{{ title }}</h1>
          <p class="text-gray-600 text-sm">{{ description }}</p>
        </div>
      </div>
    </div>

    <!-- 插槽内容 -->
    <slot />
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: '🖼️'
  },
  iconBg: {
    type: String,
    default: 'bg-primary-100'
  }
})
</script>
