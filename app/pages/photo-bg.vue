<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 mb-6">证件照换底</h1>
    
    <div class="bg-white rounded-lg border p-6">
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          选择证件照
        </label>
        <input
          type="file"
          accept="image/*"
          @change="handleFileSelect"
          class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          目标底色
        </label>
        <div class="flex gap-2">
          <button
            v-for="item in bgColors"
            :key="item.color"
            @click="targetBg = item.color"
            class="px-4 py-2 rounded border-2 flex items-center gap-2"
            :class="targetBg === item.color ? 'border-blue-600 bg-blue-50' : 'border-gray-300'"
          >
            <span
              :style="{ backgroundColor: item.color }"
              class="w-4 h-4 rounded border"
            />
            {{ item.name }}
          </button>
        </div>
      </div>

      <button
        @click="processImage"
        :disabled="!file || processing"
        class="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {{ processing ? '处理中...' : '换底' }}
      </button>

      <div v-if="result" class="mt-6">
        <div class="flex gap-4">
          <div>
            <p class="text-sm text-gray-500 mb-2">原图</p>
            <img :src="preview" class="max-w-xs rounded border" />
          </div>
          <div>
            <p class="text-sm text-gray-500 mb-2">结果</p>
            <img :src="result" class="max-w-xs rounded border" />
          </div>
        </div>
        <a
          :href="result"
          download="photo-bg.png"
          class="inline-block mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          下载
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { pipeline, env } from '@xenova/transformers'

const file = ref(null)
const preview = ref(null)
const result = ref(null)
const targetBg = ref('#ffffff')
const processing = ref(false)
let removeBackground = null

const bgColors = [
  { name: '白色', color: '#ffffff' },
  { name: '红色', color: '#ff0000' },
  { name: '蓝色', color: '#0066cc' },
  { name: '蓝色(深)', color: '#003399' },
]

function handleFileSelect(e) {
  const selected = e.target.files[0]
  if (!selected) return
  file.value = selected
  preview.value = URL.createObjectURL(selected)
  result.value = null
}

async function processImage() {
  if (!file.value) return
  
  processing.value = true
  
  try {
    env.allowLocalModels = false
    env.useBrowserCache = true
    
    if (!removeBackground) {
      removeBackground = await pipeline('image-segmentation', 'Xenova/modnet')
    }
    
    // 移除背景
    const mask = await removeBackground(preview.value, {
      return_pixmap: true,
      alpha_matting: true
    })
    
    // 创建结果图
    const img = new Image()
    img.src = preview.value
    await new Promise(resolve => img.onload = resolve)
    
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')
    
    // 绘制背景
    ctx.fillStyle = targetBg.value
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // 绘制原图
    ctx.globalCompositeOperation = 'source-atop'
    ctx.drawImage(img, 0, 0)
    
    result.value = canvas.toDataURL('image/png')
  } catch (e) {
    console.error('处理失败:', e)
  }
  
  processing.value = false
}
</script>