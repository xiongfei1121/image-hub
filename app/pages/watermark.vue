<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 mb-6">图像水印</h1>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Settings Panel -->
      <div class="bg-white rounded-lg border p-4 space-y-4">
        <h2 class="font-medium border-b pb-2">水印设置</h2>
        
        <!-- Watermark Type -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">水印类型</label>
          <select v-model="watermarkType" class="w-full px-2 py-1 border rounded">
            <option value="text">文字水印</option>
            <option value="image">图片水印</option>
          </select>
        </div>
        
        <!-- Text Watermark Settings -->
        <div v-if="watermarkType === 'text'" class="space-y-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">水印文字</label>
            <input
              v-model="watermarkText"
              type="text"
              placeholder="请输入水印文字"
              class="w-full px-2 py-1 border rounded"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">字体大小</label>
            <input
              v-model.number="fontSize"
              type="range"
              min="12"
              max="200"
              class="w-full"
            />
            <span class="text-sm text-gray-500">{{ fontSize }}px</span>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">字体颜色</label>
            <div class="flex gap-2">
              <input
                v-model="fontColor"
                type="color"
                class="w-12 h-8 border rounded cursor-pointer"
              />
              <input
                v-model="fontColor"
                type="text"
                class="flex-1 px-2 py-1 border rounded text-sm"
              />
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">透明度</label>
            <input
              v-model.number="opacity"
              type="range"
              min="10"
              max="100"
              class="w-full"
            />
            <span class="text-sm text-gray-500">{{ opacity }}%</span>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">旋转角度</label>
            <input
              v-model.number="rotation"
              type="range"
              min="-90"
              max="90"
              class="w-full"
            />
            <span class="text-sm text-gray-500">{{ rotation }}°</span>
          </div>
        </div>
        
        <!-- Image Watermark Settings -->
        <div v-if="watermarkType === 'image'" class="space-y-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">选择水印图片</label>
            <input
              type="file"
              accept="image/*"
              @change="handleWatermarkImageSelect"
              class="w-full text-sm"
            />
          </div>
          
          <div v-if="watermarkImage">
            <img :src="watermarkImage" class="w-full max-h-32 object-contain rounded border" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">水印大小</label>
            <input
              v-model.number="watermarkScale"
              type="range"
              min="10"
              max="100"
              class="w-full"
            />
            <span class="text-sm text-gray-500">{{ watermarkScale }}%</span>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">透明度</label>
            <input
              v-model.number="opacity"
              type="range"
              min="10"
              max="100"
              class="w-full"
            />
            <span class="text-sm text-gray-500">{{ opacity }}%</span>
          </div>
        </div>
        
        <!-- Position -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">位置</label>
          <div class="grid grid-cols-3 gap-1">
            <button
              v-for="pos in positions"
              :key="pos.value"
              @click="position = pos.value"
              class="px-2 py-1 text-xs border rounded hover:bg-gray-50"
              :class="{ 'bg-blue-100 border-blue-500': position === pos.value }"
            >
              {{ pos.label }}
            </button>
          </div>
        </div>
        
        <!-- Tiled Watermark -->
        <div class="flex items-center gap-2">
          <input type="checkbox" v-model="tiled" id="tiled" class="w-4 h-4" />
          <label for="tiled" class="text-sm text-gray-600">平铺水印</label>
        </div>
        
        <!-- Output Format -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">输出格式</label>
          <select v-model="outputFormat" class="w-full px-2 py-1 border rounded">
            <option value="png">PNG</option>
            <option value="jpeg">JPG</option>
            <option value="webp">WebP</option>
          </select>
        </div>
        
        <!-- Actions -->
        <div class="space-y-2 pt-4 border-t">
          <button
            @click="applyWatermark"
            :disabled="!currentImage || isProcessing"
            class="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {{ isProcessing ? '处理中...' : '添加水印' }}
          </button>
          <a
            v-if="resultUrl"
            :href="resultUrl"
            :download="outputName"
            class="block w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-center"
          >
            下载图片
          </a>
        </div>
        
        <!-- Info -->
        <div class="text-xs text-gray-500 border-t pt-4">
          <p>• 支持文字和图片水印</p>
          <p>• 可调整位置、透明度、大小</p>
          <p>• 支持平铺模式</p>
        </div>
      </div>
      
      <!-- Preview Area -->
      <div class="lg:col-span-2">
        <!-- Upload Area -->
        <div
          v-if="!currentImage"
          class="border-2 border-dashed rounded-lg p-12 text-center"
          :class="isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'"
          @dragover.prevent="isDragging = true"
          @dragleave="isDragging = false"
          @drop.prevent="handleDrop"
        >
          <p class="text-gray-500 mb-4">拖拽图片到这里，或点击选择</p>
          <input
            type="file"
            accept="image/*"
            @change="handleFileSelect"
            class="hidden"
            id="fileInput"
          />
          <label
            for="fileInput"
            class="px-4 py-2 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700"
          >
            选择图片
          </label>
        </div>
        
        <!-- Preview -->
        <div v-else class="space-y-4">
          <!-- Info -->
          <div class="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
            <div class="text-sm">
              <span class="font-medium">{{ currentImage.name }}</span>
              <span class="text-gray-500 ml-2">
                {{ currentImage.width }} × {{ currentImage.height }}
              </span>
            </div>
            <button @click="loadNewImage" class="text-sm text-blue-600 hover:underline">
              更换图片
            </button>
          </div>
          
          <!-- Preview Canvas -->
          <div class="bg-gray-100 rounded-lg p-4 overflow-auto">
            <canvas
              ref="previewCanvas"
              class="max-w-full mx-auto block"
            ></canvas>
          </div>
          
          <!-- Result Preview -->
          <div v-if="resultUrl" class="border rounded-lg p-4">
            <p class="text-sm text-gray-500 mb-2">处理结果预览</p>
            <img :src="resultUrl" class="max-w-full rounded mx-auto" />
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
