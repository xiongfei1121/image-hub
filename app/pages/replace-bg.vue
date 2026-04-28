<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 mb-6">背景替换</h1>
    
    <div class="bg-white rounded-lg border p-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            选择图片
          </label>
          <input
            type="file"
            accept="image/*"
            @change="handleFileSelect"
            class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            背景类型
          </label>
          <select
            v-model="bgType"
            class="w-full px-3 py-2 border rounded"
          >
            <option value="color">纯色背景</option>
            <option value="image">图片背景</option>
          </select>
        </div>
      </div>

      <div v-if="bgType === 'color'" class="mt-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          选择颜色
        </label>
        <div class="flex gap-2">
          <button
            v-for="color in colors"
            :key="color"
            :style="{ backgroundColor: color }"
            @click="selectColor(color)"
            class="w-12 h-12 rounded border-2"
            :class="selectedColor === color ? 'border-blue-600' : 'border-gray-300'"
          />
        </div>
      </div>

      <div v-if="bgType === 'image'" class="mt-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          选择背景图片
        </label>
        <input
          type="file"
          accept="image/*"
          @change="handleBgSelect"
          class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      <button
        @click="replaceBackground"
        :disabled="!file || processing"
        class="mt-6 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {{ processing ? '处理中...' : '替换背景' }}
      </button>

      <div v-if="result" class="mt-6">
        <p class="text-sm text-gray-500 mb-2">结果</p>
        <img :src="result" class="max-w-full rounded border" />
        <a
          :href="result"
          download="replaced-bg.png"
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
const bgFile = ref(null)
const originalPreview = ref(null)
const bgPreview = ref(null)
const result = ref(null)
const bgType = ref('color')
const selectedColor = ref('#ffffff')
const processing = ref(false)
const removeBackground = ref(null)

const colors = ['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00']

function handleFileSelect(e) {
  const selected = e.target.files[0]
  if (!selected) return
  file.value = selected
  originalPreview.value = URL.createObjectURL(selected)
}

function handleBgSelect(e) {
  const selected = e.target.files[0]
  if (!selected) return
  bgFile.value = selected
  bgPreview.value = URL.createObjectURL(selected)
}

function selectColor(color) {
  selectedColor.value = color
}

async function replaceBackground() {
  if (!file.value) return
  
  processing.value = true
  
  try {
    env.allowLocalModels = false
    env.useBrowserCache = true
    
    if (!removeBackground.value) {
      removeBackground.value = await pipeline('image-segmentation', 'Xenova/modnet')
    }
    
    // 移除背景
    const mask = await removeBackground.value(originalPreview.value, {
      return_pixmap: true,
      alpha_matting: true
    })
    
    // 创建结果图
    const img = new Image()
    img.src = originalPreview.value
    await new Promise(resolve => img.onload = resolve)
    
    let bg
    if (bgType.value === 'color') {
      bg = selectedColor.value
    } else {
      const bgImg = new Image()
      bgImg.src = bgPreview.value
      await new Promise(resolve => bgImg.onload = resolve)
      bg = bgPreview.value
    }
    
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')
    
    // 绘制背景
    if (bgType.value === 'color') {
      ctx.fillStyle = selectedColor.value
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    } else {
      const bgImg = new Image()
      bgImg.src = bgPreview.value
      await new Promise(resolve => bgImg.onload = resolve)
      ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height)
    }
    
    // 绘制原图（应用为遮罩）
    ctx.globalCompositeOperation = 'source-atop'
    ctx.drawImage(img, 0, 0)
    
    result.value = canvas.toDataURL('image/png')
  } catch (e) {
    console.error('处理失败:', e)
  }
  
  processing.value = false
}
</script>