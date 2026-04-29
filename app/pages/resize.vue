<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 mb-6">图像调整</h1>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Settings Panel -->
      <div class="bg-white rounded-lg border p-4 space-y-4">
        <h2 class="font-medium border-b pb-2">调整设置</h2>
        
        <!-- Resize -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">调整尺寸</label>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-xs text-gray-500 mb-1">宽度</label>
              <input
                v-model.number="newWidth"
                type="number"
                min="1"
                class="w-full px-2 py-1 border rounded text-sm"
              />
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">高度</label>
              <input
                v-model.number="newHeight"
                type="number"
                min="1"
                class="w-full px-2 py-1 border rounded text-sm"
              />
            </div>
          </div>
          <div class="flex items-center gap-2 mt-2">
            <input type="checkbox" v-model="keepRatio" id="keepRatio" class="w-4 h-4" />
            <label for="keepRatio" class="text-sm text-gray-600">保持宽高比</label>
          </div>
        </div>
        
        <!-- Scale -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">缩放比例</label>
          <div class="flex items-center gap-2">
            <input
              v-model.number="scalePercent"
              type="range"
              min="10"
              max="200"
              class="flex-1"
            />
            <span class="text-sm text-gray-500 w-12">{{ scalePercent }}%</span>
          </div>
        </div>
        
        <!-- Rotation -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">旋转</label>
          <div class="flex gap-2">
            <button
              @click="rotate(-90)"
              class="flex-1 px-3 py-2 border rounded hover:bg-gray-50 text-sm"
            >
              ↺ 左转90°
            </button>
            <button
              @click="rotate(90)"
              class="flex-1 px-3 py-2 border rounded hover:bg-gray-50 text-sm"
            >
              ↻ 右转90°
            </button>
          </div>
          <div class="flex gap-2 mt-2">
            <button
              @click="rotate(180)"
              class="flex-1 px-3 py-2 border rounded hover:bg-gray-50 text-sm"
            >
              ↻ 180°
            </button>
            <button
              @click="rotation = 0"
              class="flex-1 px-3 py-2 border rounded hover:bg-gray-50 text-sm"
            >
              重置
            </button>
          </div>
        </div>
        
        <!-- Flip -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">翻转</label>
          <div class="flex gap-2">
            <button
              @click="flipH = !flipH"
              class="flex-1 px-3 py-2 border rounded hover:bg-gray-50 text-sm"
              :class="{ 'bg-blue-100 border-blue-500': flipH }"
            >
              ↔ 水平翻转
            </button>
            <button
              @click="flipV = !flipV"
              class="flex-1 px-3 py-2 border rounded hover:bg-gray-50 text-sm"
              :class="{ 'bg-blue-100 border-blue-500': flipV }"
            >
              ↕ 垂直翻转
            </button>
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
            @click="applyChanges"
            :disabled="!currentImage || isProcessing"
            class="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {{ isProcessing ? '处理中...' : '应用更改' }}
          </button>
          <button
            @click="resetAll"
            :disabled="!currentImage"
            class="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
          >
            重置所有
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
          <p>• 支持旋转、翻转、缩放</p>
          <p>• 可保持宽高比</p>
          <p>• 所有处理在本地完成</p>
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
          <!-- Original Info -->
          <div class="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
            <div class="text-sm">
              <span class="font-medium">{{ currentImage.name }}</span>
              <span class="text-gray-500 ml-2">
                原始: {{ originalWidth }} × {{ originalHeight }}
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
          
          <!-- New Size Info -->
          <div class="text-sm text-gray-500 text-center">
            输出尺寸: {{ newWidth }} × {{ newHeight }}
            <span v-if="rotation !== 0"> (旋转 {{ rotation }}°)</span>
            <span v-if="flipH"> (水平翻转)</span>
            <span v-if="flipV"> (垂直翻转)</span>
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
  } catch (e) {
    console.error('处理失败:', e)
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
