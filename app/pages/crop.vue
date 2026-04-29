<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 mb-6">图像裁剪</h1>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Settings Panel -->
      <div class="bg-white rounded-lg border p-4 space-y-4">
        <h2 class="font-medium border-b pb-2">裁剪设置</h2>
        
        <!-- Aspect Ratio -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">宽高比</label>
          <select v-model="aspectRatio" class="w-full px-2 py-1 border rounded">
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
        
        <!-- Preset Sizes -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">预设尺寸</label>
          <select v-model="presetSize" @change="applyPreset" class="w-full px-2 py-1 border rounded">
            <option value="">自定义</option>
            <option value="800x600">800 × 600</option>
            <option value="1024x768">1024 × 768</option>
            <option value="1920x1080">1920 × 1080</option>
            <option value="1080x1920">1080 × 1920 (竖屏)</option>
            <option value="500x500">500 × 500</option>
            <option value="300x300">300 × 300</option>
          </select>
        </div>
        
        <!-- Manual Size -->
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-xs text-gray-500 mb-1">宽度</label>
            <input
              v-model.number="cropWidth"
              type="number"
              min="1"
              class="w-full px-2 py-1 border rounded text-sm"
            />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">高度</label>
            <input
              v-model.number="cropHeight"
              type="number"
              min="1"
              class="w-full px-2 py-1 border rounded text-sm"
            />
          </div>
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
            @click="applyCrop"
            :disabled="!currentImage || isProcessing"
            class="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {{ isProcessing ? '处理中...' : '应用裁剪' }}
          </button>
          <button
            @click="resetCrop"
            :disabled="!currentImage"
            class="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
          >
            重置选区
          </button>
          <a
            v-if="resultUrl"
            :href="resultUrl"
            :download="outputName"
            class="block w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-center"
          >
            下载裁剪图片
          </a>
        </div>
        
        <!-- Info -->
        <div class="text-xs text-gray-500 border-t pt-4">
          <p>• 拖拽选择裁剪区域</p>
          <p>• 支持锁定宽高比</p>
          <p>• 可输入精确尺寸</p>
        </div>
      </div>
      
      <!-- Canvas Area -->
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
        
        <!-- Crop Canvas -->
        <div v-else class="space-y-4">
          <!-- Canvas Container -->
          <div class="relative bg-gray-100 rounded-lg overflow-hidden" ref="canvasContainer">
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
          
          <!-- Info Bar -->
          <div class="flex items-center justify-between text-sm text-gray-500">
            <span>原图: {{ originalWidth }} × {{ originalHeight }}</span>
            <span v-if="cropArea.width > 0">
              选区: {{ Math.round(cropArea.width / scale) }} × {{ Math.round(cropArea.height / scale) }}
            </span>
          </div>
          
          <!-- Result Preview -->
          <div v-if="resultUrl" class="border rounded-lg p-4">
            <p class="text-sm text-gray-500 mb-2">裁剪结果预览</p>
            <img :src="resultUrl" class="max-w-full rounded" />
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
  const maxHeight = window.innerHeight * 0.6
  
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
