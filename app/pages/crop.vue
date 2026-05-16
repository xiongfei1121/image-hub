<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- 页面标题 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">图像裁剪</h1>
      <p class="text-gray-600">精确裁剪图片，支持自定义宽高比和预设尺寸</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- 设置面板 -->
      <div class="lg:col-span-4">
        <div class="card sticky top-24">
          <div class="card-body space-y-6">
            <div>
              <h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
                裁剪设置
              </h2>
            </div>
            
            <!-- 宽高比 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">宽高比</label>
              <select v-model="aspectRatio" class="select">
                <option value="free">自由</option>
                <option value="1:1">1:1 (正方形)</option>
                <option value="4:3">4:3</option>
                <option value="3:4">3:4</option>
                <option value="16:9">16:9</option>
                <option value="9:16">9:16</option>
                <option value="2:3">2:3</option>
                <option value="3:2">3:2</option>
              </select>
            </div>
            
            <!-- 预设尺寸 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">预设尺寸</label>
              <select v-model="presetSize" @change="applyPreset" class="select">
                <option value="">自定义</option>
                <option value="800x600">800 × 600</option>
                <option value="1024x768">1024 × 768</option>
                <option value="1920x1080">1920 × 1080</option>
                <option value="1080x1920">1080 × 1920 (竖屏)</option>
                <option value="500x500">500 × 500</option>
                <option value="300x300">300 × 300</option>
              </select>
            </div>
            
            <!-- 手动尺寸 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">手动尺寸</label>
              <div class="flex gap-2 items-center">
                <input
                  v-model.number="cropWidth"
                  type="number"
                  min="1"
                  placeholder="宽"
                  class="input flex-1 text-sm"
                />
                <span class="text-gray-400">×</span>
                <input
                  v-model.number="cropHeight"
                  type="number"
                  min="1"
                  placeholder="高"
                  class="input flex-1 text-sm"
                />
                <span class="text-xs text-gray-500">px</span>
              </div>
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
                @click="applyCrop"
                :disabled="!currentImage || isProcessing"
                class="btn-primary w-full flex items-center justify-center gap-2"
              >
                <svg v-if="isProcessing" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{{ isProcessing ? '处理中...' : '应用裁剪' }}</span>
              </button>
              <button
                @click="resetCrop"
                :disabled="!currentImage"
                class="btn-secondary w-full"
              >
                重置选区
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
                <span>下载裁剪图片</span>
              </a>
            </div>
            
            <!-- 使用说明 -->
            <div class="text-xs text-gray-500 bg-gray-50 rounded-lg p-4 space-y-1">
              <p class="flex items-center gap-2">
                <svg class="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd" />
                </svg>
                拖拽选择裁剪区域
              </p>
              <p class="flex items-center gap-2">
                <svg class="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd" />
                </svg>
                支持锁定宽高比
              </p>
              <p class="flex items-center gap-2">
                <svg class="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd" />
                </svg>
                可输入精确尺寸
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Canvas Area -->
      <div class="lg:col-span-8">
        <!-- Upload Area -->
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
        
        <!-- Crop Canvas -->
        <div v-else class="space-y-4 animate-fade-in">
          <!-- Canvas Container -->
          <div class="card">
            <div class="card-body p-4">
              <div class="relative bg-gray-100 rounded-xl overflow-hidden" ref="canvasContainer">
                <canvas
                  ref="canvas"
                  class="max-w-full cursor-crosshair"
                  @mousedown="startCrop"
                  @mousemove="doCrop"
                  @mouseup="endCrop"
                  @mouseleave="endCrop"
                ></canvas>
                
                <!-- Crop Overlay -->
                <div
                  v-if="cropArea.width > 0"
                  class="absolute border-2 border-white bg-black bg-opacity-30 pointer-events-none"
                  :style="cropStyle"
                >
                  <div class="absolute inset-0 border border-dashed border-white opacity-50"></div>
                  <!-- Corner handles -->
                  <div class="absolute -top-1 -left-1 w-3 h-3 bg-white border border-blue-500"></div>
                  <div class="absolute -top-1 -right-1 w-3 h-3 bg-white border border-blue-500"></div>
                  <div class="absolute -bottom-1 -left-1 w-3 h-3 bg-white border border-blue-500"></div>
                  <div class="absolute -bottom-1 -right-1 w-3 h-3 bg-white border border-blue-500"></div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Info Bar -->
          <div class="card">
            <div class="card-body py-3">
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-600">
                  <span class="font-medium text-gray-900">原图:</span> {{ originalWidth }} × {{ originalHeight }}
                </span>
                <span v-if="cropArea.width > 0" class="text-primary-600 font-medium">
                  选区: {{ Math.round(cropArea.width / scale) }} × {{ Math.round(cropArea.height / scale) }}
                </span>
              </div>
            </div>
          </div>
          
          <!-- Result Preview -->
          <div v-if="resultUrl" class="card">
            <div class="card-body">
              <p class="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                裁剪结果预览
              </p>
              <img :src="resultUrl" class="max-w-full rounded-xl shadow-md" />
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
const aspectRatio = ref('free')
const presetSize = ref('')
const cropWidth = ref(0)
const cropHeight = ref(0)
const outputFormat = ref('png')

// State
const currentImage = ref(null)
const originalWidth = ref(0)
const originalHeight = ref(0)
const isDragging = ref(false)
const isProcessing = ref(false)
const resultUrl = ref(null)
const resultBlob = ref(null)

// Canvas
const canvas = ref(null)
const canvasContainer = ref(null)
const scale = ref(1)
const cropArea = ref({ x: 0, y: 0, width: 0, height: 0 })
const isCropping = ref(false)
const cropStart = ref({ x: 0, y: 0 })

// Computed
const cropStyle = computed(() => ({
  left: cropArea.value.x + 'px',
  top: cropArea.value.y + 'px',
  width: cropArea.value.width + 'px',
  height: cropArea.value.height + 'px'
}))

const outputName = computed(() => {
  if (!currentImage.value) return 'cropped.png'
  const base = currentImage.value.name.replace(/\.[^.]+$/, '')
  const ext = outputFormat.value === 'jpeg' ? 'jpg' : outputFormat.value
  return `${base}_cropped.${ext}`
})

onUnmounted(() => {
  if (currentImage.value?.url) URL.revokeObjectURL(currentImage.value.url)
  if (resultUrl.value) URL.revokeObjectURL(resultUrl.value)
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

async function loadImage(file) {
  if (!import.meta.client) return
  
  if (currentImage.value?.url) URL.revokeObjectURL(currentImage.value.url)
  if (resultUrl.value) URL.revokeObjectURL(resultUrl.value)
  resultUrl.value = null
  resultBlob.value = null
  cropArea.value = { x: 0, y: 0, width: 0, height: 0 }
  
  currentImage.value = {
    file: file,
    name: file.name,
    url: URL.createObjectURL(file)
  }
  
  const img = new Image()
  await new Promise((resolve, reject) => {
    img.onload = resolve
    img.onerror = reject
    img.src = currentImage.value.url
  })
  
  originalWidth.value = img.width
  originalHeight.value = img.height
  
  // Calculate scale to fit canvas
  const container = canvasContainer.value
  const maxWidth = container.clientWidth - 32
  const maxHeight = 600
  
  scale.value = Math.min(1, maxWidth / img.width, maxHeight / img.height)
  
  const cv = canvas.value
  cv.width = img.width * scale.value
  cv.height = img.height * scale.value
  
  const ctx = cv.getContext('2d')
  ctx.drawImage(img, 0, 0, cv.width, cv.height)
}

function startCrop(e) {
  if (!canvas.value) return
  isCropping.value = true
  const rect = canvas.value.getBoundingClientRect()
  cropStart.value = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  }
  cropArea.value = { x: cropStart.value.x, y: cropStart.value.y, width: 0, height: 0 }
}

function doCrop(e) {
  if (!isCropping.value || !canvas.value) return
  
  const rect = canvas.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  
  let width = x - cropStart.value.x
  let height = y - cropStart.value.y
  
  // Apply aspect ratio
  if (aspectRatio.value !== 'free') {
    const [w, h] = aspectRatio.value.split(':').map(Number)
    const ratio = w / h
    if (Math.abs(width) > Math.abs(height * ratio)) {
      height = width / ratio
    } else {
      width = height * ratio
    }
  }
  
  // Calculate crop area
  cropArea.value = {
    x: width >= 0 ? cropStart.value.x : cropStart.value.x + width,
    y: height >= 0 ? cropStart.value.y : cropStart.value.y + height,
    width: Math.abs(width),
    height: Math.abs(height)
  }
  
  // Clamp to canvas bounds
  cropArea.value.x = Math.max(0, Math.min(cropArea.value.x, canvas.value.width - cropArea.value.width))
  cropArea.value.y = Math.max(0, Math.min(cropArea.value.y, canvas.value.height - cropArea.value.height))
}

function endCrop() {
  isCropping.value = false
}

function applyPreset() {
  if (!presetSize.value) return
  const [w, h] = presetSize.value.split('x').map(Number)
  cropWidth.value = w
  cropHeight.value = h
  
  // Apply to crop area
  if (currentImage.value && canvas.value) {
    const scaledW = w * scale.value
    const scaledH = h * scale.value
    cropArea.value = {
      x: (canvas.value.width - scaledW) / 2,
      y: (canvas.value.height - scaledH) / 2,
      width: scaledW,
      height: scaledH
    }
  }
}

function resetCrop() {
  cropArea.value = { x: 0, y: 0, width: 0, height: 0 }
  presetSize.value = ''
  cropWidth.value = 0
  cropHeight.value = 0
}

async function applyCrop() {
  if (!currentImage.value || cropArea.value.width === 0) return
  
  isProcessing.value = true
  
  try {
    const img = new Image()
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
      img.src = currentImage.value.url
    })
    
    // Calculate actual crop coordinates
    const actualX = cropArea.value.x / scale.value
    const actualY = cropArea.value.y / scale.value
    const actualW = cropArea.value.width / scale.value
    const actualH = cropArea.value.height / scale.value
    
    // Create output canvas
    const outputCanvas = document.createElement('canvas')
    outputCanvas.width = actualW
    outputCanvas.height = actualH
    const ctx = outputCanvas.getContext('2d')
    
    ctx.drawImage(img, actualX, actualY, actualW, actualH, 0, 0, actualW, actualH)
    
    const mimeType = outputFormat.value === 'jpeg' ? 'image/jpeg' : `image/${outputFormat.value}`
    const blob = await new Promise(resolve => {
      outputCanvas.toBlob(resolve, mimeType, 0.92)
    })
    
    resultBlob.value = blob
    resultUrl.value = URL.createObjectURL(blob)
  } catch (e) {
    console.error('裁剪失败:', e)
  }
  
  isProcessing.value = false
}

// Watch manual size input
watch([cropWidth, cropHeight], ([w, h]) => {
  if (w > 0 && h > 0 && canvas.value) {
    const scaledW = w * scale.value
    const scaledH = h * scale.value
    cropArea.value = {
      x: (canvas.value.width - scaledW) / 2,
      y: (canvas.value.height - scaledH) / 2,
      width: Math.min(scaledW, canvas.value.width),
      height: Math.min(scaledH, canvas.value.height)
    }
  }
})
</script>
