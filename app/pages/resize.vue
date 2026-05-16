<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- 页面标题 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">图像调整</h1>
      <p class="text-gray-600">调整尺寸、旋转、翻转 - 支持 JPG、PNG、WebP 格式</p>
    </div>
    
    <!-- 状态提示 -->
    <div v-if="statusMsg" class="mb-6 p-4 rounded-xl animate-fade-in" 
         :class="statusErr ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-primary-50 text-primary-700 border border-primary-200'">
      <div class="flex items-center gap-2">
        <svg v-if="statusErr" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
        <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
        <span>{{ statusMsg }}</span>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- 设置面板 -->
      <div class="lg:col-span-4">
        <div class="card sticky top-24">
          <div class="card-body space-y-6">
            <div>
              <h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                调整设置
              </h2>
            </div>
            
            <!-- 调整尺寸 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-3">调整尺寸</label>
              <div class="flex gap-2 items-center">
                <input
                  v-model.number="newWidth"
                  type="number"
                  min="1"
                  placeholder="宽"
                  class="input flex-1 text-sm"
                />
                <span class="text-gray-400">×</span>
                <input
                  v-model.number="newHeight"
                  type="number"
                  min="1"
                  placeholder="高"
                  class="input flex-1 text-sm"
                />
                <span class="text-xs text-gray-500">px</span>
              </div>
              <div class="flex items-center justify-between mt-3 p-3 bg-gray-50 rounded-lg">
                <span class="text-sm text-gray-700">保持宽高比</span>
                <input type="checkbox" v-model="keepRatio" class="w-4 h-4" />
              </div>
            </div>
            
            <!-- 缩放比例 -->
            <div>
              <div class="flex items-center justify-between mb-3">
                <label class="text-sm font-medium text-gray-700">缩放比例</label>
                <span class="text-sm font-semibold text-primary-600">{{ scalePercent }}%</span>
              </div>
              <input
                v-model.number="scalePercent"
                type="range"
                min="10"
                max="200"
                class="w-full"
              />
            </div>
            
            <!-- 旋转 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-3">旋转</label>
              <div class="grid grid-cols-2 gap-2">
                <button @click="rotate(-90)" class="btn-secondary flex items-center justify-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  左转90°
                </button>
                <button @click="rotate(90)" class="btn-secondary flex items-center justify-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
                  </svg>
                  右转90°
                </button>
              </div>
              <div class="grid grid-cols-2 gap-2 mt-2">
                <button @click="rotate(180)" class="btn-secondary">
                  旋转180°
                </button>
                <button @click="rotation = 0" class="btn-secondary">
                  重置
                </button>
              </div>
            </div>
            
            <!-- 翻转 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-3">翻转</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  @click="flipH = !flipH"
                  class="btn-secondary flex items-center justify-center gap-2"
                  :class="{ 'ring-2 ring-primary-500 bg-primary-50': flipH }"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  水平翻转
                </button>
                <button
                  @click="flipV = !flipV"
                  class="btn-secondary flex items-center justify-center gap-2"
                  :class="{ 'ring-2 ring-primary-500 bg-primary-50': flipV }"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                  垂直翻转
                </button>
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
                @click="applyChanges"
                :disabled="!currentImage || isProcessing"
                class="btn-primary w-full flex items-center justify-center gap-2"
              >
                <svg v-if="isProcessing" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{{ isProcessing ? '处理中...' : '应用更改' }}</span>
              </button>
              <button
                @click="resetAll"
                :disabled="!currentImage"
                class="btn-secondary w-full"
              >
                重置所有
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
            
            <!-- 限制说明 -->
            <div class="text-xs text-gray-500 bg-gray-50 rounded-lg p-4 space-y-1">
              <p class="flex items-center gap-2">
                <svg class="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd" />
                </svg>
                支持旋转、翻转、缩放
              </p>
              <p class="flex items-center gap-2">
                <svg class="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd" />
                </svg>
                可保持宽高比
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
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
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
                      原始: {{ originalWidth }} × {{ originalHeight }}
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
          
          <!-- 输出尺寸信息 -->
          <div class="card">
            <div class="card-body">
              <div class="text-sm text-gray-600 text-center">
                <span class="font-medium">输出尺寸:</span>
                <span class="text-gray-900 ml-2">{{ newWidth }} × {{ newHeight }}</span>
                <span v-if="rotation !== 0" class="ml-2 text-primary-600">(旋转 {{ rotation }}°)</span>
                <span v-if="flipH" class="ml-2 text-primary-600">(水平翻转)</span>
                <span v-if="flipV" class="ml-2 text-primary-600">(垂直翻转)</span>
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
const newWidth = ref(0)
const newHeight = ref(0)
const keepRatio = ref(true)
const scalePercent = ref(100)
const rotation = ref(0)
const flipH = ref(false)
const flipV = ref(false)
const outputFormat = ref('png')

// State
const currentImage = ref(null)
const originalWidth = ref(0)
const originalHeight = ref(0)
const isDragging = ref(false)
const isProcessing = ref(false)
const resultUrl = ref(null)
const resultBlob = ref(null)
const statusMsg = ref('')
const statusErr = ref(false)

// Canvas
const previewCanvas = ref(null)
let originalImage = null
let aspectRatio = 1

// Computed
const outputName = computed(() => {
  if (!currentImage.value) return 'adjusted.png'
  const base = currentImage.value.name.replace(/\.[^.]+$/, '')
  const ext = outputFormat.value === 'jpeg' ? 'jpg' : outputFormat.value
  return `${base}_adjusted.${ext}`
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
    originalImage.onload = resolve
    originalImage.onerror = reject
    originalImage.src = currentImage.value.url
  })
  
  originalWidth.value = originalImage.width
  originalHeight.value = originalImage.height
  aspectRatio = originalImage.width / originalImage.height
  
  newWidth.value = originalImage.width
  newHeight.value = originalImage.height
  scalePercent.value = 100
  rotation.value = 0
  flipH.value = false
  flipV.value = false
  
  updatePreview()
}

function updatePreview() {
  if (!previewCanvas.value || !originalImage) return
  
  const canvas = previewCanvas.value
  const ctx = canvas.getContext('2d')
  
  // Calculate output dimensions considering rotation
  let outputW = newWidth.value
  let outputH = newHeight.value
  const isRotated = Math.abs(rotation.value) === 90 || Math.abs(rotation.value) === 270
  
  if (isRotated) {
    outputW = newHeight.value
    outputH = newWidth.value
  }
  
  // Scale preview
  const maxPreviewSize = 600
  const previewScale = Math.min(1, maxPreviewSize / outputW, maxPreviewSize / outputH)
  
  canvas.width = outputW * previewScale
  canvas.height = outputH * previewScale
  
  ctx.save()
  ctx.scale(previewScale, previewScale)
  
  // Clear with white background for JPEG
  if (outputFormat.value === 'jpeg') {
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, outputW, outputH)
  }
  
  // Move to center
  ctx.translate(outputW / 2, outputH / 2)
  
  // Apply rotation
  ctx.rotate((rotation.value * Math.PI) / 180)
  
  // Apply flip
  ctx.scale(flipH.value ? -1 : 1, flipV.value ? -1 : 1)
  
  // Draw image
  if (isRotated) {
    ctx.drawImage(originalImage, -newWidth.value / 2, -newHeight.value / 2, newWidth.value, newHeight.value)
  } else {
    ctx.drawImage(originalImage, -outputW / 2, -outputH / 2, outputW, outputH)
  }
  
  ctx.restore()
}

function rotate(degrees) {
  rotation.value = (rotation.value + degrees) % 360
  updatePreview()
}

async function applyChanges() {
  if (!originalImage) return
  
  isProcessing.value = true
  
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    // Calculate output dimensions
    let outputW = newWidth.value
    let outputH = newHeight.value
    const isRotated = Math.abs(rotation.value) === 90 || Math.abs(rotation.value) === 270
    
    if (isRotated) {
      canvas.width = newHeight.value
      canvas.height = newWidth.value
    } else {
      canvas.width = newWidth.value
      canvas.height = newHeight.value
    }
    
    // White background for JPEG
    if (outputFormat.value === 'jpeg') {
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    
    ctx.save()
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate((rotation.value * Math.PI) / 180)
    ctx.scale(flipH.value ? -1 : 1, flipV.value ? -1 : 1)
    
    if (isRotated) {
      ctx.drawImage(originalImage, -newWidth.value / 2, -newHeight.value / 2, newWidth.value, newHeight.value)
    } else {
      ctx.drawImage(originalImage, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height)
    }
    
    ctx.restore()
    
    const mimeType = outputFormat.value === 'jpeg' ? 'image/jpeg' : `image/${outputFormat.value}`
    const blob = await new Promise(resolve => {
      canvas.toBlob(resolve, mimeType, 0.92)
    })
    
    resultBlob.value = blob
    resultUrl.value = URL.createObjectURL(blob)
    
    statusMsg.value = '处理完成'
    statusErr.value = false
    setTimeout(() => { statusMsg.value = '' }, 3000)
  } catch (e) {
    console.error('处理失败:', e)
    statusMsg.value = '处理失败: ' + e.message
    statusErr.value = true
  }
  
  isProcessing.value = false
}

function resetAll() {
  if (originalImage) {
    newWidth.value = originalWidth.value
    newHeight.value = originalHeight.value
    scalePercent.value = 100
    rotation.value = 0
    flipH.value = false
    flipV.value = false
    updatePreview()
  }
}

// Watch for changes
watch([newWidth, newHeight, scalePercent, rotation, flipH, flipV, outputFormat], () => {
  updatePreview()
})

// Keep aspect ratio
watch(newWidth, (val) => {
  if (keepRatio.value && originalImage) {
    newHeight.value = Math.round(val / aspectRatio)
  }
})

watch(newHeight, (val) => {
  if (keepRatio.value && originalImage) {
    newWidth.value = Math.round(val * aspectRatio)
  }
})

watch(scalePercent, (val) => {
  if (originalImage) {
    newWidth.value = Math.round(originalWidth.value * val / 100)
    newHeight.value = Math.round(originalHeight.value * val / 100)
  }
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
