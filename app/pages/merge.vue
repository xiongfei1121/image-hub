<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 mb-6">图像拼接</h1>
    
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Settings Panel -->
      <div class="bg-white rounded-lg border p-4">
        <h2 class="font-medium mb-4">设置</h2>
        
        <!-- Canvas Size -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">画布尺寸</label>
          <div class="flex gap-2">
            <div class="flex-1">
              <label class="text-xs text-gray-500">宽度 px</label>
              <input
                v-model.number="canvasWidth"
                type="number"
                min="100"
                max="10000"
                class="w-full px-2 py-1 border rounded"
              />
            </div>
            <div class="flex-1">
              <label class="text-xs text-gray-500">高度 px</label>
              <input
                v-model.number="canvasHeight"
                type="number"
                min="100"
                max="10000"
                class="w-full px-2 py-1 border rounded"
              />
            </div>
          </div>
          <button
            @click="autoSize = !autoSize"
            class="mt-2 text-sm text-blue-600 hover:underline"
          >
            {{ autoSize ? '关闭自动适应' : '自动适应画布' }}
          </button>
        </div>
        
        <!-- Background -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">背景色</label>
          <input
            v-model="backgroundColor"
            type="color"
            class="w-full h-10 border rounded cursor-pointer"
          />
        </div>
        
        <!-- Direction -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">默认排列</label>
          <select v-model="defaultLayout" class="w-full px-2 py-1 border rounded">
            <option value="grid">网格</option>
            <option value="horizontal">横向</option>
            <option value="vertical">纵向</option>
          </select>
        </div>
        
        <!-- Gap -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">间距 px</label>
          <input
            v-model.number="gap"
            type="number"
            min="0"
            max="100"
            class="w-full px-2 py-1 border rounded"
          />
        </div>
        
        <!-- Add Images -->
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">添加图片</label>
          <input
            type="file"
            accept="image/*"
            multiple
            @change="handleFileSelect"
            class="block w-full text-sm"
          />
        </div>
        
        <!-- Selected Images -->
        <div class="mb-4">
          <p class="text-sm font-medium text-gray-700 mb-2">
            已选 {{ placedImages.length }} 张
          </p>
          <div class="space-y-2 max-h-48 overflow-y-auto">
            <div
              v-for="(img, i) in placedImages"
              :key="img.id"
              class="flex items-center gap-2 p-2 bg-gray-50 rounded"
            >
              <img :src="img.preview" class="w-10 h-10 object-cover rounded" />
              <span class="flex-1 text-sm truncate">{{ img.name }}</span>
              <input
                v-model.number="img.x"
                type="number"
                class="w-16 px-1 py-0.5 border rounded text-xs"
                placeholder="X"
              />
              <input
                v-model.number="img.y"
                type="number"
                class="w-16 px-1 py-0.5 border rounded text-xs"
                placeholder="Y"
              />
              <button @click="removeImage(i)" class="text-red-500 text-sm">✕</button>
            </div>
          </div>
        </div>
        
        <button
          @click="renderCanvas"
          :disabled="placedImages.length === 0 || rendering"
          class="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {{ rendering ? '渲染中...' : '渲染画布' }}
        </button>
      </div>
      
      <!-- Canvas Preview -->
      <div class="lg:col-span-2 bg-gray-100 rounded-lg p-4">
        <div class="flex justify-between items-center mb-2">
          <span class="text-sm text-gray-600">画布预览</span>
          <span class="text-xs text-gray-500">
            {{ canvasWidth }} × {{ canvasHeight }} px
          </span>
        </div>
        
        <div class="relative bg-white rounded overflow-hidden border" :style="{ width: previewScale + 'px', height: previewScale + 'px' }">
          <!-- Canvas background -->
          <div
            class="absolute inset-0"
            :style="{ backgroundColor: backgroundColor }"
          />
          
          <!-- Placed images -->
          <div
            v-for="(img, i) in placedImages"
            :key="img.id"
            class="absolute cursor-move select-none"
            :style="{
              left: (img.x || 0) * previewScale / canvasWidth * 100 + '%',
              top: (img.y || 0) * previewScale / canvasHeight * 100 + '%',
              width: img.renderedWidth * previewScale / canvasWidth * 100 + '%',
              aspectRatio: img.renderedWidth + '/' + img.renderedHeight
            }"
          >
            <img
              :src="img.preview"
              class="w-full h-full object-contain pointer-events-none"
              draggable="false"
            />
          </div>
          
          <!-- Empty state -->
          <div
            v-if="placedImages.length === 0"
            class="absolute inset-0 flex items-center justify-center text-gray-400"
          >
            <p>添加图片到画布</p>
          </div>
        </div>
        
        <!-- Result -->
        <div v-if="resultUrl" class="mt-4 flex gap-4">
          <img :src="resultUrl" class="max-h-64 rounded border" />
          <div class="flex flex-col gap-2">
            <a
              :href="resultUrl"
              download="merged.png"
              class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 inline-block"
            >
              下载 PNG
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { v4 as uuidv4 } from 'uuid'

const canvasWidth = ref(1920)
const canvasHeight = ref(1080)
const autoSize = ref(true)
const backgroundColor = ref('#ffffff')
const defaultLayout = ref('grid')
const gap = ref(10)
const rendering = ref(false)
const resultUrl = ref('')
const placedImages = ref([])
const previewScale = ref(400)

// Layout images automatically
function autoLayout() {
  if (placedImages.value.length === 0) return
  
  if (defaultLayout.value === 'horizontal') {
    let x = gap.value
    placedImages.value.forEach(img => {
      img.x = x
      img.y = gap.value
      x += img.renderedWidth + gap.value
    })
    canvasWidth.value = x
    canvasHeight.value = placedImages.value[0].renderedHeight + gap.value * 2
  } else if (defaultLayout.value === 'vertical') {
    let y = gap.value
    placedImages.value.forEach(img => {
      img.x = gap.value
      img.y = y
      y += img.renderedHeight + gap.value
    })
    canvasWidth.value = placedImages.value[0].renderedWidth + gap.value * 2
    canvasHeight.value = y
  } else {
    // Grid - 2 columns
    let row = 0, col = 0
    placedImages.value.forEach((img, i) => {
      img.x = col * (img.renderedWidth + gap.value)
      img.y = row * (img.renderedHeight + gap.value)
      col++
      if (col >= 2) {
        col = 0
        row++
      }
    })
  }
}

function handleFileSelect(e) {
  const files = Array.from(e.target.files)
  
  files.forEach(async (file) => {
    if (!file.type.startsWith('image/')) return
    
    const preview = URL.createObjectURL(file)
    const img = new Image()
    
    img.onload = () => {
      let w = img.width
      let h = img.height
      const maxDim = 800
      
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = (h / w) * maxDim
          w = maxDim
        } else {
          w = (w / h) * maxDim
          h = maxDim
        }
      }
      
      placedImages.value.push({
        id: uuidv4(),
        name: file.name,
        file: file,
        preview: preview,
        width: img.width,
        height: img.height,
        renderedWidth: Math.round(w),
        renderedHeight: Math.round(h),
        x: gap.value,
        y: gap.value
      })
      
      if (autoSize.value) {
        autoLayout()
      }
    }
    
    img.src = preview
  })
}

function removeImage(index) {
  URL.revokeObjectURL(placedImages.value[index].preview)
  placedImages.value.splice(index, 1)
}

async function renderCanvas() {
  if (placedImages.value.length === 0) return
  
  rendering.value = true
  
  try {
    const canvas = document.createElement('canvas')
    canvas.width = canvasWidth.value
    canvas.height = canvasHeight.value
    const ctx = canvas.getContext('2d')
    
    ctx.fillStyle = backgroundColor.value
    ctx.fillRect(0, 0, canvasWidth.value, canvasHeight.value)
    
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
        img.renderedWidth,
        img.renderedHeight
      )
    }
    
    resultUrl.value = canvas.toDataURL('image/png')
  } catch (e) {
    console.error('Render failed:', e)
  }
  
  rendering.value = false
}

watch(autoSize, (val) => {
  if (val) autoLayout()
})

watch(gap, () => {
  if (autoSize.value) autoLayout()
})
</script>
