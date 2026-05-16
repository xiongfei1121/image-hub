<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- 页面标题 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">图像拼接</h1>
      <p class="text-gray-600">多图自由组合，支持拖拽、缩放、对齐 - 打造完美拼图</p>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- 设置面板 -->
      <div class="lg:col-span-4">
        <div class="card sticky top-24">
          <div class="card-body space-y-6">
            <div>
              <h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
                拼接设置
              </h2>
            </div>
            
            <!-- 画布尺寸 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">画布尺寸</label>
              <div class="flex gap-2 items-center">
                <input
                  v-model.number="canvasWidth"
                  type="number"
                  min="100"
                  max="10000"
                  placeholder="宽"
                  class="input flex-1 text-sm"
                />
                <span class="text-gray-400">×</span>
                <input
                  v-model.number="canvasHeight"
                  type="number"
                  min="100"
                  max="10000"
                  placeholder="高"
                  class="input flex-1 text-sm"
                />
                <span class="text-xs text-gray-500">px</span>
              </div>
            </div>
            
            <!-- 背景色 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">背景色</label>
              <input
                v-model="backgroundColor"
                type="color"
                class="w-full h-10 border rounded-xl cursor-pointer"
              />
            </div>
            
            <!-- 排列方式 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">排列方式</label>
              <select v-model="defaultLayout" class="select">
                <option value="free">自由拖拽</option>
                <option value="horizontal">横向平铺</option>
                <option value="vertical">纵向平铺</option>
                <option value="grid2x2">四宫格</option>
                <option value="grid3x3">九宫格</option>
              </select>
            </div>
            
            <!-- 磁吸对齐 -->
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div class="flex items-center gap-2">
                <span class="text-sm text-gray-700">磁吸对齐</span>
                <input type="checkbox" v-model="snapEnabled" class="w-4 h-4" />
              </div>
              <div v-if="snapEnabled" class="flex items-center gap-1">
                <input
                  v-model.number="snapThreshold"
                  type="number"
                  min="5"
                  max="50"
                  class="input w-16 text-sm"
                />
                <span class="text-xs text-gray-500">px</span>
              </div>
            </div>
            
            <!-- 间距 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">间距</label>
              <div class="flex gap-2 items-center">
                <input
                  v-model.number="gap"
                  type="number"
                  min="0"
                  max="100"
                  class="input flex-1 text-sm"
                />
                <span class="text-xs text-gray-500">px</span>
              </div>
            </div>
            
            <!-- 缩放比例 -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="text-sm font-medium text-gray-700">缩放比例</label>
                <span class="text-sm font-semibold text-primary-600">{{ globalScale }}%</span>
              </div>
              <input
                v-model.number="globalScale"
                type="range"
                min="10"
                max="200"
                class="w-full"
              />
            </div>
            
            <!-- 添加图片 -->
            <div class="border-t pt-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">添加图片</label>
              <input
                type="file"
                accept="image/*"
                multiple
                @change="handleFileSelect"
                class="block w-full text-sm"
              />
            </div>
            
            <!-- 操作按钮 -->
            <div class="space-y-3 pt-6 border-t">
              <button
                @click="applyLayout"
                :disabled="placedImages.length === 0"
                class="btn-secondary w-full"
              >
                应用排列
              </button>
            </div>
            
            <!-- 快捷键提示 -->
            <div class="text-xs text-gray-500 bg-gray-50 rounded-lg p-4 space-y-1">
              <p class="flex items-center gap-2">
                <svg class="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd" />
                </svg>
                方向键移动图片（Shift加速）
              </p>
              <p class="flex items-center gap-2">
                <svg class="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd" />
                </svg>
                滚轮缩放选中图片
              </p>
              <p class="flex items-center gap-2">
                <svg class="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd" />
                </svg>
                Delete 删除选中图片
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 画布预览区域 -->
      <div class="lg:col-span-8">
        <!-- 上传区域 -->
        <div
          v-if="placedImages.length === 0"
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
            multiple
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
        
        <!-- 画布预览 -->
        <div v-else class="space-y-4 animate-fade-in">
          <!-- 预览控制 -->
          <div class="card">
            <div class="card-body">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                  <span class="text-sm font-medium text-gray-700">画布预览</span>
                  <div class="flex items-center gap-2">
                    <input
                      v-model.number="previewScale"
                      type="range"
                      min="300"
                      max="1200"
                      step="50"
                      class="w-32"
                    />
                    <span class="text-xs text-gray-500 w-12">{{ previewScale }}px</span>
                  </div>
                </div>
                <div class="flex gap-2">
                  <button
                    @click="showGrid = !showGrid"
                    class="btn-secondary btn-small"
                    :class="showGrid ? 'bg-primary-50 text-primary-700 border-primary-200' : ''"
                  >
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    网格
                  </button>
                  <button
                    @click="autoSize = !autoSize"
                    class="btn-secondary btn-small"
                    :class="autoSize ? 'bg-primary-50 text-primary-700 border-primary-200' : ''"
                  >
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                    自动适应
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 画布容器 -->
          <div class="card overflow-hidden">
            <div class="p-4 bg-gray-50 overflow-auto max-h-[600px]">
              <div
                ref="canvasContainer"
                class="relative bg-white rounded-xl shadow-sm overflow-hidden mx-auto"
                :style="{
                  width: previewScale + 'px',
                  height: (previewScale * canvasHeight / canvasWidth) + 'px',
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
                    backgroundImage: 'linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                  }"
                />
                
                <!-- Placed images -->
                <div
                  v-for="(img, i) in placedImages"
                  :key="img.id"
                  class="absolute cursor-move group"
                  :class="{ 'ring-2 ring-primary-500 ring-offset-2': selectedImage === i }"
                  :style="{
                    left: (img.x / canvasWidth * previewScale) + 'px',
                    top: (img.y / canvasWidth * previewScale) + 'px',
                    width: (img.scaledWidth / canvasWidth * previewScale) + 'px',
                    height: (img.scaledHeight / canvasWidth * previewScale) + 'px'
                  }"
                  @mousedown.stop="startImageDrag($event, i)"
                  @click.stop="selectedImage = i"
                >
                  <img
                    :src="img.preview"
                    class="w-full h-full pointer-events-none select-none"
                    style="aspect-ratio: auto"
                    draggable="false"
                  />
                  <!-- Resize handle -->
                  <div
                    v-if="selectedImage === i"
                    class="absolute bottom-0 right-0 w-3 h-3 bg-primary-500 rounded-tr cursor-se-resize"
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
            </div>
          </div>
          
          <!-- 图片列表 -->
          <div class="card">
            <div class="card-body">
              <div class="flex items-center justify-between mb-4">
                <span class="text-sm font-semibold text-gray-900">{{ placedImages.length }} 张图片</span>
                <button @click="addMoreImages" class="btn-secondary btn-small flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  添加更多
                </button>
              </div>
              
              <div class="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                <div
                  v-for="(img, i) in placedImages"
                  :key="img.id"
                  class="file-item cursor-pointer"
                  :class="{ 'ring-2 ring-primary-500': selectedImage === i }"
                  @click="selectedImage = i"
                >
                  <img :src="img.preview" class="w-12 h-12 object-cover rounded-lg" />
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 truncate">{{ img.name }}</p>
                    <p class="text-xs text-gray-500">{{ round(img.scaledWidth) }}×{{ round(img.scaledHeight) }}</p>
                  </div>
                  <button
                    @click.stop="removeImage(i)"
                    class="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 选中图片控制 -->
          <div v-if="selectedImage !== null && placedImages[selectedImage]" class="card">
            <div class="card-body">
              <p class="text-sm font-semibold text-gray-900 mb-3">
                当前: {{ placedImages[selectedImage].name }}
              </p>
              <div class="grid grid-cols-4 gap-3">
                <div>
                  <label class="block text-xs text-gray-500 mb-1">宽</label>
                  <input
                    v-model.number="placedImages[selectedImage].scaledWidth"
                    type="number"
                    class="input text-sm"
                    @change="updateImageSize"
                  />
                </div>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">高</label>
                  <input
                    v-model.number="placedImages[selectedImage].scaledHeight"
                    type="number"
                    class="input text-sm"
                    @change="updateImageSize"
                  />
                </div>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">X</label>
                  <input
                    v-model.number="placedImages[selectedImage].x"
                    type="number"
                    class="input text-sm"
                  />
                </div>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">Y</label>
                  <input
                    v-model.number="placedImages[selectedImage].y"
                    type="number"
                    class="input text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <!-- 操作按钮 -->
          <div class="flex gap-3">
            <button
              @click="renderCanvas"
              :disabled="placedImages.length === 0 || rendering"
              class="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <svg v-if="rendering" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{{ rendering ? '渲染中...' : '渲染并下载' }}</span>
            </button>
            <button
              @click="clearAll"
              :disabled="placedImages.length === 0"
              class="btn-secondary"
            >
              清空
            </button>
          </div>
          
          <!-- 结果预览 -->
          <div v-if="resultUrl" class="card">
            <div class="card-body">
              <p class="text-sm font-semibold text-gray-900 mb-3">渲染结果</p>
              <img :src="resultUrl" class="max-h-64 rounded-xl shadow-md mx-auto" />
            </div>
          </div>
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
const snapEnabled = ref(true)
const snapThreshold = ref(10)
const isDragging = ref(false)

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
  addFiles(files)
  e.target.value = ''
}

function handleDrop(e) {
  isDragging.value = false
  addFiles(Array.from(e.dataTransfer.files))
}

function addMoreImages() {
  const input = document.createElement('input')
  input.type = 'file'
  input.multiple = true
  input.accept = 'image/*'
  input.onchange = (e) => addFiles(Array.from(e.target.files))
  input.click()
}

function addFiles(files) {
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

// 磁吸对齐函数
function snapToGuides(x, y, width, height, currentIndex) {
  if (!snapEnabled.value) return { x, y }
  
  const threshold = snapThreshold.value
  let snappedX = x
  let snappedY = y
  
  // 收集所有对齐参考线
  const guides = {
    left: [0],  // 画布左边缘
    right: [canvasWidth.value],  // 画布右边缘
    top: [0],  // 画布上边缘
    bottom: [canvasHeight.value],  // 画布下边缘
    centerX: [canvasWidth.value / 2],  // 画布中心
    centerY: [canvasHeight.value / 2],  // 画布中心
  }
  
  // 添加其他图片的边缘作为参考线
  placedImages.value.forEach((img, i) => {
    if (i === currentIndex) return
    guides.left.push(img.x)
    guides.right.push(img.x + img.scaledWidth)
    guides.top.push(img.y)
    guides.bottom.push(img.y + img.scaledHeight)
    guides.centerX.push(img.x + img.scaledWidth / 2)
    guides.centerY.push(img.y + img.scaledHeight / 2)
  })
  
  // 当前图片的各个边和中心
  const currentLeft = x
  const currentRight = x + width
  const currentTop = y
  const currentBottom = y + height
  const currentCenterX = x + width / 2
  const currentCenterY = y + height / 2
  
  // 检查左边缘对齐
  for (const guide of guides.left) {
    if (Math.abs(currentLeft - guide) < threshold) {
      snappedX = guide
      break
    }
    if (Math.abs(currentRight - guide) < threshold) {
      snappedX = guide - width
      break
    }
  }
  
  // 检查右边缘对齐
  for (const guide of guides.right) {
    if (Math.abs(currentRight - guide) < threshold) {
      snappedX = guide - width
      break
    }
    if (Math.abs(currentLeft - guide) < threshold) {
      snappedX = guide
      break
    }
  }
  
  // 检查上边缘对齐
  for (const guide of guides.top) {
    if (Math.abs(currentTop - guide) < threshold) {
      snappedY = guide
      break
    }
    if (Math.abs(currentBottom - guide) < threshold) {
      snappedY = guide - height
      break
    }
  }
  
  // 检查下边缘对齐
  for (const guide of guides.bottom) {
    if (Math.abs(currentBottom - guide) < threshold) {
      snappedY = guide - height
      break
    }
    if (Math.abs(currentTop - guide) < threshold) {
      snappedY = guide
      break
    }
  }
  
  // 检查中心线对齐
  for (const guide of guides.centerX) {
    if (Math.abs(currentCenterX - guide) < threshold) {
      snappedX = guide - width / 2
      break
    }
  }
  
  for (const guide of guides.centerY) {
    if (Math.abs(currentCenterY - guide) < threshold) {
      snappedY = guide - height / 2
      break
    }
  }
  
  return { x: snappedX, y: snappedY }
}

function doCanvasDrag(e) {
  if (!dragging.value) return
  
  const dx = (e.clientX - dragStart.value.x) * canvasWidth.value / previewScale.value
  const dy = (e.clientY - dragStart.value.y) * canvasWidth.value / previewScale.value
  
  if (dragging.value.type === 'image') {
    const img = placedImages.value[dragging.value.index]
    let newX = imageStart.value.x + dx
    let newY = imageStart.value.y + dy
    
    // 应用磁吸对齐
    const snapped = snapToGuides(newX, newY, img.scaledWidth, img.scaledHeight, dragging.value.index)
    
    // 限制在画布范围内
    img.x = Math.max(0, Math.min(canvasWidth.value - img.scaledWidth, snapped.x))
    img.y = Math.max(0, Math.min(canvasHeight.value - img.scaledHeight, snapped.y))
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
  
  // 保存原始宽高比
  const aspectRatio = img.scaledWidth / img.scaledHeight
  
  const onMove = (ev) => {
    if (dragging.value?.type !== 'resize') return
    const dx = (ev.clientX - dragStart.value.x) * canvasWidth.value / previewScale.value
    const dy = (ev.clientY - dragStart.value.y) * canvasWidth.value / previewScale.value
    
    // 使用对角线距离计算缩放，保持宽高比
    const diagonal = Math.sqrt(dx * dx + dy * dy)
    const sign = (dx + dy) > 0 ? 1 : -1
    const scale = 1 + sign * diagonal / Math.max(imageStart.value.w, imageStart.value.h)
    
    const img = placedImages.value[index]
    img.scaledWidth = Math.max(10, imageStart.value.w * scale)
    img.scaledHeight = Math.max(10, imageStart.value.h * scale)
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
  
  // 保持宽高比：根据原始图片比例调整
  const aspectRatio = img.origWidth / img.origHeight
  img.scaledWidth = Math.max(10, img.scaledWidth)
  img.scaledHeight = Math.max(10, Math.round(img.scaledWidth / aspectRatio))
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
  else if (layout === 'grid2x2') {
    // 四宫格：2列布局
    const cols = 2
    // 计算单元格大小，取最大图片尺寸
    const maxWidth = Math.max(...placedImages.value.map(i => i.scaledWidth))
    const maxHeight = Math.max(...placedImages.value.map(i => i.scaledHeight))
    const cellWidth = maxWidth
    const cellHeight = maxHeight
    
    placedImages.value.forEach((img, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      // 图片居中放置在单元格内
      img.x = col * (cellWidth + g) + g + (cellWidth - img.scaledWidth) / 2
      img.y = row * (cellHeight + g) + g + (cellHeight - img.scaledHeight) / 2
    })
    
    canvasWidth.value = cellWidth * 2 + g * 3
    canvasHeight.value = cellHeight * Math.ceil(placedImages.value.length / 2) + g * (Math.ceil(placedImages.value.length / 2) + 1)
  }
  else if (layout === 'grid3x3') {
    // 九宫格：3列布局
    const cols = 3
    const maxWidth = Math.max(...placedImages.value.map(i => i.scaledWidth))
    const maxHeight = Math.max(...placedImages.value.map(i => i.scaledHeight))
    const cellWidth = maxWidth
    const cellHeight = maxHeight
    
    placedImages.value.forEach((img, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      img.x = col * (cellWidth + g) + g + (cellWidth - img.scaledWidth) / 2
      img.y = row * (cellHeight + g) + g + (cellHeight - img.scaledHeight) / 2
    })
    
    canvasWidth.value = cellWidth * 3 + g * 4
    canvasHeight.value = cellHeight * Math.ceil(placedImages.value.length / 3) + g * (Math.ceil(placedImages.value.length / 3) + 1)
  }
  
  if (autoSize.value && layout !== 'grid2x2' && layout !== 'grid3x3') {
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
