<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- 页面标题 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">图像水印</h1>
      <p class="text-gray-600">添加文字或图片水印 - 支持位置、透明度、平铺等设置</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- 设置面板 -->
      <div class="lg:col-span-4">
        <div class="card sticky top-24">
          <div class="card-body space-y-6">
            <div>
              <h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                水印设置
              </h2>
            </div>
            
            <!-- 水印类型 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">水印类型</label>
              <select v-model="watermarkType" class="select">
                <option value="text">文字水印</option>
                <option value="image">图片水印</option>
              </select>
            </div>
            
            <!-- 文字水印设置 -->
            <div v-if="watermarkType === 'text'" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">水印文字</label>
                <input
                  v-model="watermarkText"
                  type="text"
                  placeholder="请输入水印文字"
                  class="input"
                />
              </div>
              
              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="text-sm font-medium text-gray-700">字体大小</label>
                  <span class="text-sm font-semibold text-primary-600">{{ fontSize }}px</span>
                </div>
                <input
                  v-model.number="fontSize"
                  type="range"
                  min="12"
                  max="200"
                  class="w-full"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">字体颜色</label>
                <div class="flex gap-2">
                  <input
                    v-model="fontColor"
                    type="color"
                    class="w-12 h-10 border rounded-lg cursor-pointer"
                  />
                  <input
                    v-model="fontColor"
                    type="text"
                    class="input flex-1"
                  />
                </div>
              </div>
              
              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="text-sm font-medium text-gray-700">透明度</label>
                  <span class="text-sm font-semibold text-primary-600">{{ opacity }}%</span>
                </div>
                <input
                  v-model.number="opacity"
                  type="range"
                  min="10"
                  max="100"
                  class="w-full"
                />
              </div>
              
              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="text-sm font-medium text-gray-700">旋转角度</label>
                  <span class="text-sm font-semibold text-primary-600">{{ rotation }}°</span>
                </div>
                <input
                  v-model.number="rotation"
                  type="range"
                  min="-90"
                  max="90"
                  class="w-full"
                />
              </div>
            </div>
            
            <!-- 图片水印设置 -->
            <div v-if="watermarkType === 'image'" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">选择水印图片</label>
                <input
                  type="file"
                  accept="image/*"
                  @change="handleWatermarkImageSelect"
                  class="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
                />
              </div>
              
              <div v-if="watermarkImage">
                <img :src="watermarkImage" class="w-full max-h-32 object-contain rounded-xl border" />
              </div>
              
              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="text-sm font-medium text-gray-700">水印大小</label>
                  <span class="text-sm font-semibold text-primary-600">{{ watermarkScale }}%</span>
                </div>
                <input
                  v-model.number="watermarkScale"
                  type="range"
                  min="10"
                  max="100"
                  class="w-full"
                />
              </div>
              
              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="text-sm font-medium text-gray-700">透明度</label>
                  <span class="text-sm font-semibold text-primary-600">{{ opacity }}%</span>
                </div>
                <input
                  v-model.number="opacity"
                  type="range"
                  min="10"
                  max="100"
                  class="w-full"
                />
              </div>
            </div>
            
            <!-- 位置选择 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">位置</label>
              <div class="grid grid-cols-3 gap-1">
                <button
                  v-for="pos in positions"
                  :key="pos.value"
                  @click="position = pos.value"
                  class="px-2 py-2 text-xs border rounded-lg transition-all duration-200"
                  :class="position === pos.value ? 'bg-primary-100 border-primary-500 text-primary-700 font-medium' : 'border-gray-200 hover:bg-gray-50'"
                >
                  {{ pos.label }}
                </button>
              </div>
            </div>
            
            <!-- 平铺水印 -->
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span class="text-sm text-gray-700">平铺水印</span>
              <input type="checkbox" v-model="tiled" class="w-4 h-4" />
            </div>
            
            <!-- 输出格式 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">输出格式</label>
              <select v-model="outputFormat" class="select">
                <option value="png">PNG</option>
                <option value="jpeg">JPG</option>
                <option value="webp">WebP</option>
              </select>
            </div>
            
            <!-- 操作按钮 -->
            <div class="space-y-3 pt-6 border-t">
              <button
                @click="applyWatermark"
                :disabled="!currentImage || isProcessing"
                class="btn-primary w-full flex items-center justify-center gap-2"
              >
                <svg v-if="isProcessing" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{{ isProcessing ? '处理中...' : '添加水印' }}</span>
              </button>
              <a
                v-if="resultUrl"
                :href="resultUrl"
                :download="outputName"
                class="w-full px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>下载图片</span>
              </a>
            </div>
            
            <!-- 说明 -->
            <div class="text-xs text-gray-500 bg-gray-50 rounded-lg p-4 space-y-1">
              <p class="flex items-center gap-2">
                <svg class="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd" />
                </svg>
                支持文字和图片水印
              </p>
              <p class="flex items-center gap-2">
                <svg class="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd" />
                </svg>
                可调整位置、透明度、大小
              </p>
              <p class="flex items-center gap-2">
                <svg class="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd" />
                </svg>
                支持平铺模式
              </p>
              <p class="flex items-center gap-2">
                <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                所有处理在本地完成
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 上传区域和预览 -->
      <div class="lg:col-span-8">
        <!-- 上传区域 -->
        <div
          v-if="!currentImage"
          class="upload-area p-16 text-center animate-fade-in"
          :class="isDragging ? 'border-primary-500 bg-primary-50' : 'border-gray-300'"
          @dragover.prevent="isDragging = true"
          @dragleave="isDragging = false"
          @drop.prevent="handleDrop"
        >
          <div class="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary-100 flex items-center justify-center">
            <svg class="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p class="text-lg text-gray-700 mb-2">拖拽图片到这里</p>
          <p class="text-gray-500 mb-6">或点击选择文件</p>
          <input
            type="file"
            accept="image/*"
            @change="handleFileSelect"
            class="hidden"
            id="fileInput"
          />
          <label
            for="fileInput"
            class="btn-primary inline-flex items-center gap-2 cursor-pointer"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            选择图片
          </label>
        </div>
        
        <!-- 预览区域 -->
        <div v-else class="space-y-4 animate-fade-in">
          <!-- 文件信息 -->
          <div class="card">
            <div class="card-body">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                  <div class="text-sm">
                    <span class="font-semibold text-gray-900">{{ currentImage.name }}</span>
                    <span class="text-gray-500 ml-2">
                      {{ currentImage.width }} × {{ currentImage.height }}
                    </span>
                  </div>
                </div>
                <button @click="loadNewImage" class="btn-secondary btn-small flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  更换图片
                </button>
              </div>
            </div>
          </div>
          
          <!-- 预览画布 -->
          <div class="card">
            <div class="card-body">
              <div class="bg-gray-100 rounded-xl p-4 overflow-auto">
                <canvas
                  ref="previewCanvas"
                  class="max-w-full mx-auto block"
                ></canvas>
              </div>
            </div>
          </div>
          
          <!-- 结果预览 -->
          <div v-if="resultUrl" class="card">
            <div class="card-body">
              <p class="text-sm text-gray-500 mb-3 font-medium">处理结果预览</p>
              <img :src="resultUrl" class="max-w-full rounded-xl mx-auto shadow-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'

// Settings
const watermarkType = ref('text')
const watermarkText = ref('Watermark')
const fontSize = ref(48)
const fontColor = ref('#ffffff')
const opacity = ref(50)
const rotation = ref(-30)
const watermarkScale = ref(30)
const position = ref('center')
const tiled = ref(false)
const outputFormat = ref('png')

// Watermark image
const watermarkImage = ref(null)
let watermarkImgObj = null

// State
const currentImage = ref(null)
const isDragging = ref(false)
const isProcessing = ref(false)
const resultUrl = ref(null)
const resultBlob = ref(null)

// Canvas
const previewCanvas = ref(null)
let originalImage = null

// Positions
const positions = [
  { value: 'top-left', label: '↖ 左上' },
  { value: 'top-center', label: '↑ 上中' },
  { value: 'top-right', label: '↗ 右上' },
  { value: 'center-left', label: '← 左中' },
  { value: 'center', label: '● 居中' },
  { value: 'center-right', label: '→ 右中' },
  { value: 'bottom-left', label: '↙ 左下' },
  { value: 'bottom-center', label: '↓ 下中' },
  { value: 'bottom-right', label: '↘ 右下' },
]

// Computed
const outputName = computed(() => {
  if (!currentImage.value) return 'watermarked.png'
  const base = currentImage.value.name.replace(/\.[^.]+$/, '')
  const ext = outputFormat.value === 'jpeg' ? 'jpg' : outputFormat.value
  return `${base}_watermarked.${ext}`
})

onUnmounted(() => {
  if (currentImage.value?.url) URL.revokeObjectURL(currentImage.value.url)
  if (resultUrl.value) URL.revokeObjectURL(resultUrl.value)
  if (watermarkImage.value) URL.revokeObjectURL(watermarkImage.value)
})

function handleDrop(e) {
  isDragging.value = false
  const file = e.dataTransfer.files[0]
  if (file && file.type.startsWith('image/')) {
    loadImage(file)
  }
}

function handleFileSelect(e) {
  const file = e.target.files[0]
  if (file) {
    loadImage(file)
  }
}

function loadNewImage() {
  if (!import.meta.client) return
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = (e) => {
    if (e.target.files[0]) {
      loadImage(e.target.files[0])
    }
  }
  input.click()
}

async function loadImage(file) {
  if (!import.meta.client) return
  
  if (currentImage.value?.url) URL.revokeObjectURL(currentImage.value.url)
  if (resultUrl.value) URL.revokeObjectURL(resultUrl.value)
  resultUrl.value = null
  resultBlob.value = null
  
  currentImage.value = {
    file: file,
    name: file.name,
    url: URL.createObjectURL(file)
  }
  
  originalImage = new Image()
  await new Promise((resolve, reject) => {
    originalImage.onload = () => {
      currentImage.value.width = originalImage.width
      currentImage.value.height = originalImage.height
      resolve()
    }
    originalImage.onerror = reject
    originalImage.src = currentImage.value.url
  })
  
  updatePreview()
}

function handleWatermarkImageSelect(e) {
  const file = e.target.files[0]
  if (file) {
    if (watermarkImage.value) URL.revokeObjectURL(watermarkImage.value)
    watermarkImage.value = URL.createObjectURL(file)
    
    watermarkImgObj = new Image()
    watermarkImgObj.onload = () => updatePreview()
    watermarkImgObj.src = watermarkImage.value
  }
}

function updatePreview() {
  if (!previewCanvas.value || !originalImage) return
  
  const canvas = previewCanvas.value
  const ctx = canvas.getContext('2d')
  
  // Scale preview
  const maxPreviewSize = 600
  const previewScale = Math.min(1, maxPreviewSize / originalImage.width, maxPreviewSize / originalImage.height)
  
  canvas.width = originalImage.width * previewScale
  canvas.height = originalImage.height * previewScale
  
  // Draw original image
  ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height)
  
  // Draw watermark
  if (watermarkType.value === 'text' && watermarkText.value) {
    drawTextWatermark(ctx, previewScale)
  } else if (watermarkType.value === 'image' && watermarkImgObj) {
    drawImageWatermark(ctx, previewScale)
  }
}

function drawTextWatermark(ctx, scale) {
  const text = watermarkText.value
  const size = fontSize.value * scale
  const color = fontColor.value
  const alpha = opacity.value / 100
  const angle = rotation.value * Math.PI / 180
  
  ctx.save()
  ctx.font = `${size}px Arial, sans-serif`
  ctx.fillStyle = color
  ctx.globalAlpha = alpha
  
  if (tiled.value) {
    // Tiled watermark
    const textWidth = ctx.measureText(text).width
    const gapX = textWidth + 50 * scale
    const gapY = size * 2
    
    for (let y = -canvas.height; y < canvas.height * 2; y += gapY) {
      for (let x = -canvas.width; x < canvas.width * 2; x += gapX) {
        ctx.save()
        ctx.translate(x + gapX / 2, y + size)
        ctx.rotate(angle)
        ctx.fillText(text, 0, 0)
        ctx.restore()
      }
    }
  } else {
    // Single watermark
    const pos = getWatermarkPosition(ctx, text, size, scale)
    ctx.translate(pos.x, pos.y)
    ctx.rotate(angle)
    ctx.fillText(text, 0, 0)
  }
  
  ctx.restore()
}

function drawImageWatermark(ctx, scale) {
  if (!watermarkImgObj) return
  
  const alpha = opacity.value / 100
  const wmWidth = watermarkImgObj.width * (watermarkScale.value / 100) * scale
  const wmHeight = watermarkImgObj.height * (watermarkScale.value / 100) * scale
  
  ctx.save()
  ctx.globalAlpha = alpha
  
  if (tiled.value) {
    const gapX = wmWidth + 50 * scale
    const gapY = wmHeight + 50 * scale
    
    for (let y = 0; y < previewCanvas.value.height + wmHeight; y += gapY) {
      for (let x = 0; x < previewCanvas.value.width + wmWidth; x += gapX) {
        ctx.drawImage(watermarkImgObj, x, y, wmWidth, wmHeight)
      }
    }
  } else {
    const pos = getImageWatermarkPosition(wmWidth, wmHeight)
    ctx.drawImage(watermarkImgObj, pos.x, pos.y, wmWidth, wmHeight)
  }
  
  ctx.restore()
}

function getWatermarkPosition(ctx, text, size, scale) {
  const textWidth = ctx.measureText(text).width
  const padding = 20 * scale
  const canvas = previewCanvas.value
  
  const positions = {
    'top-left': { x: padding + textWidth / 2, y: padding + size / 2 },
    'top-center': { x: canvas.width / 2, y: padding + size / 2 },
    'top-right': { x: canvas.width - padding - textWidth / 2, y: padding + size / 2 },
    'center-left': { x: padding + textWidth / 2, y: canvas.height / 2 },
    'center': { x: canvas.width / 2, y: canvas.height / 2 },
    'center-right': { x: canvas.width - padding - textWidth / 2, y: canvas.height / 2 },
    'bottom-left': { x: padding + textWidth / 2, y: canvas.height - padding - size / 2 },
    'bottom-center': { x: canvas.width / 2, y: canvas.height - padding - size / 2 },
    'bottom-right': { x: canvas.width - padding - textWidth / 2, y: canvas.height - padding - size / 2 },
  }
  
  return positions[position.value] || positions.center
}

function getImageWatermarkPosition(wmWidth, wmHeight) {
  const padding = 20
  const canvas = previewCanvas.value
  
  const positions = {
    'top-left': { x: padding, y: padding },
    'top-center': { x: (canvas.width - wmWidth) / 2, y: padding },
    'top-right': { x: canvas.width - wmWidth - padding, y: padding },
    'center-left': { x: padding, y: (canvas.height - wmHeight) / 2 },
    'center': { x: (canvas.width - wmWidth) / 2, y: (canvas.height - wmHeight) / 2 },
    'center-right': { x: canvas.width - wmWidth - padding, y: (canvas.height - wmHeight) / 2 },
    'bottom-left': { x: padding, y: canvas.height - wmHeight - padding },
    'bottom-center': { x: (canvas.width - wmWidth) / 2, y: canvas.height - wmHeight - padding },
    'bottom-right': { x: canvas.width - wmWidth - padding, y: canvas.height - wmHeight - padding },
  }
  
  return positions[position.value] || positions.center
}

async function applyWatermark() {
  if (!originalImage) return
  
  isProcessing.value = true
  
  try {
    const canvas = document.createElement('canvas')
    canvas.width = originalImage.width
    canvas.height = originalImage.height
    const ctx = canvas.getContext('2d')
    
    // Draw original
    ctx.drawImage(originalImage, 0, 0)
    
    // Draw watermark at full resolution
    if (watermarkType.value === 'text' && watermarkText.value) {
      drawTextWatermarkFull(ctx)
    } else if (watermarkType.value === 'image' && watermarkImgObj) {
      drawImageWatermarkFull(ctx)
    }
    
    const mimeType = outputFormat.value === 'jpeg' ? 'image/jpeg' : `image/${outputFormat.value}`
    const blob = await new Promise(resolve => {
      canvas.toBlob(resolve, mimeType, 0.92)
    })
    
    resultBlob.value = blob
    resultUrl.value = URL.createObjectURL(blob)
  } catch (e) {
    console.error('处理失败:', e)
  }
  
  isProcessing.value = false
}

function drawTextWatermarkFull(ctx) {
  const text = watermarkText.value
  const size = fontSize.value
  const color = fontColor.value
  const alpha = opacity.value / 100
  const angle = rotation.value * Math.PI / 180
  
  ctx.save()
  ctx.font = `${size}px Arial, sans-serif`
  ctx.fillStyle = color
  ctx.globalAlpha = alpha
  
  if (tiled.value) {
    const textWidth = ctx.measureText(text).width
    const gapX = textWidth + 100
    const gapY = size * 2
    
    for (let y = -ctx.canvas.height; y < ctx.canvas.height * 2; y += gapY) {
      for (let x = -ctx.canvas.width; x < ctx.canvas.width * 2; x += gapX) {
        ctx.save()
        ctx.translate(x + gapX / 2, y + size)
        ctx.rotate(angle)
        ctx.fillText(text, 0, 0)
        ctx.restore()
      }
    }
  } else {
    const textWidth = ctx.measureText(text).width
    const padding = 40
    const canvas = ctx.canvas
    
    const positions = {
      'top-left': { x: padding + textWidth / 2, y: padding + size / 2 },
      'top-center': { x: canvas.width / 2, y: padding + size / 2 },
      'top-right': { x: canvas.width - padding - textWidth / 2, y: padding + size / 2 },
      'center-left': { x: padding + textWidth / 2, y: canvas.height / 2 },
      'center': { x: canvas.width / 2, y: canvas.height / 2 },
      'center-right': { x: canvas.width - padding - textWidth / 2, y: canvas.height / 2 },
      'bottom-left': { x: padding + textWidth / 2, y: canvas.height - padding - size / 2 },
      'bottom-center': { x: canvas.width / 2, y: canvas.height - padding - size / 2 },
      'bottom-right': { x: canvas.width - padding - textWidth / 2, y: canvas.height - padding - size / 2 },
    }
    
    const pos = positions[position.value] || positions.center
    ctx.translate(pos.x, pos.y)
    ctx.rotate(angle)
    ctx.fillText(text, 0, 0)
  }
  
  ctx.restore()
}

function drawImageWatermarkFull(ctx) {
  if (!watermarkImgObj) return
  
  const alpha = opacity.value / 100
  const wmWidth = watermarkImgObj.width * (watermarkScale.value / 100)
  const wmHeight = watermarkImgObj.height * (watermarkScale.value / 100)
  
  ctx.save()
  ctx.globalAlpha = alpha
  
  if (tiled.value) {
    const gapX = wmWidth + 100
    const gapY = wmHeight + 100
    
    for (let y = 0; y < ctx.canvas.height + wmHeight; y += gapY) {
      for (let x = 0; x < ctx.canvas.width + wmWidth; x += gapX) {
        ctx.drawImage(watermarkImgObj, x, y, wmWidth, wmHeight)
      }
    }
  } else {
    const padding = 40
    const canvas = ctx.canvas
    
    const positions = {
      'top-left': { x: padding, y: padding },
      'top-center': { x: (canvas.width - wmWidth) / 2, y: padding },
      'top-right': { x: canvas.width - wmWidth - padding, y: padding },
      'center-left': { x: padding, y: (canvas.height - wmHeight) / 2 },
      'center': { x: (canvas.width - wmWidth) / 2, y: (canvas.height - wmHeight) / 2 },
      'center-right': { x: canvas.width - wmWidth - padding, y: (canvas.height - wmHeight) / 2 },
      'bottom-left': { x: padding, y: canvas.height - wmHeight - padding },
      'bottom-center': { x: (canvas.width - wmWidth) / 2, y: canvas.height - wmHeight - padding },
      'bottom-right': { x: canvas.width - wmWidth - padding, y: canvas.height - wmHeight - padding },
    }
    
    const pos = positions[position.value] || positions.center
    ctx.drawImage(watermarkImgObj, pos.x, pos.y, wmWidth, wmHeight)
  }
  
  ctx.restore()
}

// Watch for changes
watch([
  watermarkType, watermarkText, fontSize, fontColor, opacity, rotation,
  watermarkScale, position, tiled
], () => {
  updatePreview()
})
</script>

<style scoped>
input[type="range"] {
  -webkit-appearance: none;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background: #3b82f6;
  border-radius: 50%;
  cursor: pointer;
}
</style>
