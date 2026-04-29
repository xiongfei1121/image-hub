<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 mb-6">图像拼接</h1>
    
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Settings Panel -->
      <div class="bg-white rounded-lg border p-4 space-y-4">
        <h2 class="font-medium border-b pb-2">设置</h2>
        
        <!-- Canvas Size -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">画布尺寸</label>
          <div class="flex gap-2">
            <div class="flex-1">
              <label class="text-xs text-gray-500">宽 px</label>
              <input
                v-model.number="canvasWidth"
                type="number"
                min="100"
                max="10000"
                class="w-full px-2 py-1 border rounded"
              />
            </div>
            <div class="flex-1">
              <label class="text-xs text-gray-500">高 px</label>
              <input
                v-model.number="canvasHeight"
                type="number"
                min="100"
                max="10000"
                class="w-full px-2 py-1 border rounded"
              />
            </div>
          </div>
        </div>
        
        <!-- Background -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">背景色</label>
          <input
            v-model="backgroundColor"
            type="color"
            class="w-full h-10 border rounded cursor-pointer"
          />
        </div>
        
        <!-- Layout -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">排列方式</label>
          <select v-model="defaultLayout" class="w-full px-2 py-1 border rounded">
            <option value="free">自由拖拽</option>
            <option value="horizontal">横向平铺</option>
            <option value="vertical">纵向平铺</option>
            <option value="grid">网格拼贴</option>
            <option value="masonry">瀑布流</option>
          </select>
        </div>
        
        <!-- Gap -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">间距 px</label>
          <input
            v-model.number="gap"
            type="number"
            min="0"
            max="100"
            class="w-full px-2 py-1 border rounded"
          />
        </div>
        
        <!-- Scale -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">缩放比例 %</label>
          <input
            v-model.number="globalScale"
            type="range"
            min="10"
            max="200"
            class="w-full"
          />
          <span class="text-xs text-gray-500">{{ globalScale }}%</span>
        </div>
        
        <!-- Add Images -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">添加图片</label>
          <input
            type="file"
            accept="image/*"
            multiple
            @change="handleFileSelect"
            class="block w-full text-sm"
          />
        </div>
        
        <button
          @click="applyLayout"
          :disabled="placedImages.length === 0"
          class="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
        >
          应用排列
        </button>
      </div>
      
      <!-- Canvas Preview -->
      <div class="lg:col-span-2 bg-gray-100 rounded-lg p-4">
        <div class="flex items-center gap-4 mb-2">
          <span class="text-sm text-gray-600">画布预览</span>
          <input
            v-model.number="previewScale"
            type="range"
            min="300"
            max="1200"
            step="50"
            class="w-32"
          />
          <span class="text-xs text-gray-500">{{ previewScale }}px</span>
        </div>
          <span class="text-sm text-gray-600">画布预览 - 拖拽移动 / 滚轮缩放</span>
          <span class="text-xs text-gray-500">
            {{ canvasWidth }} × {{ canvasHeight }} px | {{ placedImages.length }} 张
          </span>
        </div>
        
        <!-- Canvas Container -->
        <div
          ref="canvasContainer"
          class="relative bg-white rounded border overflow-hidden"
          :style="{
            width: previewScale + 'px',
            height: previewScale + 'px',
            backgroundColor: backgroundColor
          }"
          @wheel.prevent="handleWheel"
          @mousedown="startCanvasDrag"
          @mousemove="doCanvasDrag"
          @mouseup="endCanvasDrag"
          @mouseleave="endCanvasDrag"
        >
          <!-- Grid lines -->
          <div
            v-if="showGrid"
            class="absolute inset-0 pointer-events-none"
            :style="{
              backgroundImage: 'linear-gradient(#ccc 1px, transparent 1px), linear-gradient(90deg, #ccc 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }"
          />
          
          <!-- Placed images -->
          <div
            v-for="(img, i) in placedImages"
            :key="img.id"
            class="absolute cursor-move group"
            :class="{ 'ring-2 ring-blue-500': selectedImage === i }"
            :style="{
              left: (img.x / canvasWidth * previewScale) + 'px',
              top: (img.y / canvasHeight * previewScale) + 'px',
              width: ((img.scaledWidth / canvasWidth) * previewScale) + 'px',
              height: ((img.scaledHeight / canvasHeight) * previewScale) + 'px'
            }"
            @mousedown.stop="startImageDrag($event, i)"
            @click.stop="selectedImage = i"
          >
            <img
              :src="img.preview"
              class="w-full h-full object-contain pointer-events-none select-none"
              style="aspect-ratio: auto"
              draggable="false"
            />
            <!-- Resize handle -->
            <div
              v-if="selectedImage === i"
              class="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 rounded-tr cursor-se-resize"
              @mousedown.stop="startResize($event, i)"
            />
          </div>
          
          <!-- Empty state -->
          <div
            v-if="placedImages.length === 0"
            class="absolute inset-0 flex items-center justify-center text-gray-400"
          >
            <p>添加图片后拖拽移动位置</p>
          </div>
        </div>
        
        <!-- Image List -->
        <div class="mt-4 space-y-2">
          <div class="flex gap-2">
            <button
              @click="showGrid = !showGrid"
              class="px-3 py-1 text-sm rounded"
              :class="showGrid ? 'bg-blue-500 text-white' : 'bg-gray-200'"
            >
              网格 {{ showGrid ? '✓' : '' }}
            </button>
            <button
              @click="autoSize = !autoSize"
              class="px-3 py-1 text-sm rounded"
              :class="autoSize ? 'bg-blue-500 text-white' : 'bg-gray-200'"
            >
              自动适应 {{ autoSize ? '✓' : '' }}
            </button>
          </div>
          
          <div class="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-white rounded border">
            <div
              v-for="(img, i) in placedImages"
              :key="img.id"
              class="relative group flex items-center gap-2 p-1 bg-gray-50 rounded cursor-pointer"
              :class="{ 'ring-2 ring-blue-500': selectedImage === i }"
              @click="selectedImage = i"
            >
              <img :src="img.preview" class="w-12 h-12 object-cover rounded" />
              <div class="text-xs">
                <p class="truncate w-20">{{ img.name }}</p>
                <p class="text-gray-500">{{ round(img.scaledWidth) }}×{{ round(img.scaledHeight) }}</p>
              </div>
              <button
                @click.stop="removeImage(i)"
                class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100"
              >
                ✕
              </button>
            </div>
            
            <div
              v-if="placedImages.length === 0"
              class="text-gray-400 text-sm p-4"
            >
              点击上方"添加图片"按钮选择图片
            </div>
          </div>
        </div>
        
        <!-- Selected Image Controls -->
        <div v-if="selectedImage !== null && placedImages[selectedImage]" class="mt-4 p-3 bg-white rounded border">
          <p class="text-sm font-medium mb-2">
            当前: {{ placedImages[selectedImage].name }}
          </p>
          <div class="flex gap-4 text-sm">
            <label>
              宽
              <input
                v-model.number="placedImages[selectedImage].scaledWidth"
                type="number"
                class="w-20 px-1 py-0.5 border rounded"
                @change="updateImageSize"
              />
            </label>
            <label>
              高
              <input
                v-model.number="placedImages[selectedImage].scaledHeight"
                type="number"
                class="w-20 px-1 py-0.5 border rounded"
                @change="updateImageSize"
              />
            </label>
            <label>
              X
              <input
                v-model.number="placedImages[selectedImage].x"
                type="number"
                class="w-20 px-1 py-0.5 border rounded"
              />
            </label>
            <label>
              Y
              <input
                v-model.number="placedImages[selectedImage].y"
                type="number"
                class="w-20 px-1 py-0.5 border rounded"
              />
            </label>
          </div>
        </div>
        
        <!-- Actions -->
        <div class="mt-4 flex gap-2">
          <button
            @click="renderCanvas"
            :disabled="placedImages.length === 0 || rendering"
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {{ rendering ? '渲染中...' : '渲染并下载' }}
          </button>
          <button
            @click="clearAll"
            :disabled="placedImages.length === 0"
            class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
          >
            清空
          </button>
        </div>
        
        <!-- Result -->
        <div v-if="resultUrl" class="mt-4">
          <img :src="resultUrl" class="max-h-64 rounded border" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { v4 as uuidv4 } from 'uuid'

const canvasWidth = ref(1920)
const canvasHeight = ref(1080)
const autoSize = ref(true)
const showGrid = ref(false)
const backgroundColor = ref('#ffffff')
const defaultLayout = ref('free')
const gap = ref(10)
const globalScale = ref(100)
const rendering = ref(false)
const resultUrl = ref('')
const placedImages = ref([])
const previewScale = ref(800)

// Compute actual dimensions for display
const getDisplaySize = (img) => ({
  left: round(img.x / canvasWidth.value * previewScale.value),
  top: round(img.y / canvasHeight.value * previewScale.value),
  width: round(img.scaledWidth / canvasWidth.value * previewScale.value),
  height: round(img.scaledHeight / canvasHeight.value * previewScale.value)
})
const canvasContainer = ref(null)

// Selection
const selectedImage = ref(null)

// Helper functions
const round = (n) => Math.round(n)
const getImgStyle = (img) => ({
  left: round(img.x / canvasWidth * previewScale) + 'px',
  top: round(img.y / canvasHeight * previewScale) + 'px'
})
const getImgSize = (img) => ({
  width: round(img.scaledWidth / canvasWidth * previewScale) + 'px',
  height: round(img.scaledHeight / canvasHeight * previewScale) + 'px'
})

// Drag state
const dragging = ref(null)
const dragStart = ref({ x: 0, y: 0 })
const imageStart = ref({ x: 0, y: 0, w: 0, h: 0 })

function handleFileSelect(e) {
  const files = Array.from(e.target.files)
  
  files.forEach(async (file) => {
    if (!file.type.startsWith('image/')) return
    
    const preview = URL.createObjectURL(file)
    const img = new Image()
    
    await new Promise(resolve => {
      img.onload = resolve
      img.src = preview
    })
    
    let w = img.width * globalScale.value / 100
    let h = img.height * globalScale.value / 100
    
    placedImages.value.push({
      id: uuidv4(),
      name: file.name,
      file: file,
      preview: preview,
      origWidth: img.width,
      origHeight: img.height,
      scaledWidth: Math.round(w),
      scaledHeight: Math.round(h),
      x: gap.value,
      y: gap.value
    })
  })
}

function removeImage(index) {
  URL.revokeObjectURL(placedImages.value[index].preview)
  placedImages.value.splice(index, 1)
  selectedImage.value = null
}

function clearAll() {
  placedImages.value.forEach(img => URL.revokeObjectURL(img.preview))
  placedImages.value = []
  selectedImage.value = null
  resultUrl.value = ''
}

// Image drag
function startImageDrag(e, index) {
  dragging.value = { type: 'image', index }
  dragStart.value = { x: e.clientX, y: e.clientY }
  const img = placedImages.value[index]
  imageStart.value = { x: img.x, y: img.y }
}

function doCanvasDrag(e) {
  if (!dragging.value) return
  
  const dx = (e.clientX - dragStart.value.x) * canvasWidth.value / previewScale.value
  const dy = (e.clientY - dragStart.value.y) * canvasHeight.value / previewScale.value
  
  if (dragging.value.type === 'image') {
    const img = placedImages.value[dragging.value.index]
    img.x = Math.max(0, Math.min(canvasWidth.value - img.scaledWidth, imageStart.value.x + dx))
    img.y = Math.max(0, Math.min(canvasHeight.value - img.scaledHeight, imageStart.value.y + dy))
  } else if (dragging.value.type === 'canvas') {
    // Pan canvas - simplified
  }
}

function endCanvasDrag() {
  dragging.value = null
}

// Resize image
function startResize(e, index) {
  dragging.value = { type: 'resize', index }
  dragStart.value = { x: e.clientX, y: e.clientY }
  const img = placedImages.value[index]
  imageStart.value = { w: img.scaledWidth, h: img.scaledHeight }
  
  const onMove = (ev) => {
    if (dragging.value?.type !== 'resize') return
    const dx = (ev.clientX - dragStart.value.x) * canvasWidth.value / previewScale.value
    const dy = (ev.clientY - dragStart.value.y) * canvasHeight.value / previewScale.value
    const img = placedImages.value[index]
    img.scaledWidth = Math.max(10, imageStart.value.w + dx)
    img.scaledHeight = Math.max(10, imageStart.value.h + dy)
  }
  
  const onUp = () => {
    dragging.value = null
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
  }
  
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

function startCanvasDrag(e) {
  // Canvas pan if needed
}

function updateImageSize() {
  const img = placedImages.value[selectedImage.value]
  if (!img) return
  img.scaledWidth = Math.max(10, img.scaledWidth)
  img.scaledHeight = Math.max(10, img.scaledHeight)
}

// Wheel zoom
function handleWheel(e) {
  if (selectedImage.value === null) return
  const img = placedImages.value[selectedImage.value]
  const delta = e.deltaY > 0 ? 0.9 : 1.1
  img.scaledWidth = Math.max(10, img.scaledWidth * delta)
  img.scaledHeight = Math.max(10, img.scaledHeight * delta)
}

// Layout functions
function applyLayout() {
  if (placedImages.value.length === 0) return
  
  const layout = defaultLayout.value
  const g = gap.value
  
  if (layout === 'horizontal') {
    let x = g
    placedImages.value.forEach((img, i) => {
      img.x = x
      img.y = g
      x += img.scaledWidth + g
    })
    canvasWidth.value = x
    canvasHeight.value = Math.max(...placedImages.value.map(i => i.scaledHeight)) + g * 2
  } 
  else if (layout === 'vertical') {
    let y = g
    placedImages.value.forEach((img, i) => {
      img.x = g
      img.y = y
      y += img.scaledHeight + g
    })
    canvasWidth.value = Math.max(...placedImages.value.map(i => i.scaledWidth)) + g * 2
    canvasHeight.value = y
  }
  else if (layout === 'grid') {
    // Calculate columns based on canvas width
    const cols = 3
    let row = 0, col = 0
    placedImages.value.forEach((img, i) => {
      img.x = col * (img.scaledWidth + g) + g
      img.y = row * (img.scaledHeight + g) + g
      col++
      if (col >= cols) {
        col = 0
        row++
      }
    })
  }
  else if (layout === 'masonry') {
    // Simple masonry - fill shortest column
    const cols = 3
    const colHeights = new Array(cols).fill(g)
    placedImages.value.forEach((img, i) => {
      const minCol = colHeights.indexOf(Math.min(...colHeights))
      img.x = minCol * 400 + g // Simplified
      img.y = colHeights[minCol]
      colHeights[minCol] += img.scaledHeight + g
    })
  }
  
  if (autoSize.value) {
    const maxX = Math.max(...placedImages.value.map(i => i.x + i.scaledWidth))
    const maxY = Math.max(...placedImages.value.map(i => i.y + i.scaledHeight))
    canvasWidth.value = maxX + g
    canvasHeight.value = maxY + g
  }
}

async function renderCanvas() {
  if (placedImages.value.length === 0) return
  
  rendering.value = true
  
  try {
    const canvas = document.createElement('canvas')
    canvas.width = canvasWidth.value
    canvas.height = canvasHeight.value
    const ctx = canvas.getContext('2d')
    
    // Fill background
    ctx.fillStyle = backgroundColor.value
    ctx.fillRect(0, 0, canvasWidth.value, canvasHeight.value)
    
    // Draw images
    for (const img of placedImages.value) {
      const image = new Image()
      await new Promise(resolve => {
        image.onload = resolve
        image.src = img.preview
      })
      
      ctx.drawImage(
        image,
        img.x,
        img.y,
        img.scaledWidth,
        img.scaledHeight
      )
    }
    
    resultUrl.value = canvas.toDataURL('image/png')
  } catch (e) {
    console.error('Render failed:', e)
  }
  
  rendering.value = false
}

// Keyboard shortcuts
function handleKeydown(e) {
  if (selectedImage.value === null) return
  const img = placedImages.value[selectedImage.value]
  const step = e.shiftKey ? 10 : 1
  
  if (e.key === 'ArrowLeft') img.x -= step
  if (e.key === 'ArrowRight') img.x += step
  if (e.key === 'ArrowUp') img.y -= step
  if (e.key === 'ArrowDown') img.y += step
  if (e.key === 'Delete') removeImage(selectedImage.value)
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.cursor-move:active {
  cursor: grabbing;
}
</style>
