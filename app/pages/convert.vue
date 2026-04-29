<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 mb-6">格式转换</h1>
    
    <!-- Status -->
    <div v-if="statusMsg" class="mb-4 p-3 rounded" :class="statusErr ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'">
      {{ statusMsg }}
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Settings Panel -->
      <div class="bg-white rounded-lg border p-4 space-y-4">
        <h2 class="font-medium border-b pb-2">转换设置</h2>
        
        <!-- Output Format -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">输出格式</label>
          <select v-model="outputFormat" class="w-full px-2 py-1 border rounded">
            <option value="jpeg">JPG / JPEG</option>
            <option value="png">PNG</option>
            <option value="webp">WebP</option>
          </select>
        </div>
        
        <!-- Quality (for lossy formats) -->
        <div v-if="outputFormat !== 'png'">
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium text-gray-700">质量</label>
            <span class="text-sm text-gray-500">{{ quality }}%</span>
          </div>
          <input
            v-model.number="quality"
            type="range"
            min="1"
            max="100"
            class="w-full"
          />
        </div>
        
        <!-- Actions -->
        <div class="space-y-2 pt-4 border-t">
          <button
            @click="convertAll"
            :disabled="images.length === 0 || isConverting"
            class="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {{ isConverting ? '转换中...' : '转换全部' }}
          </button>
          <button
            @click="downloadAll"
            :disabled="convertedCount === 0"
            class="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            下载全部 ({{ convertedCount }} 个)
          </button>
          <button
            @click="clearAll"
            :disabled="images.length === 0"
            class="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
          >
            清空列表
          </button>
        </div>
        
        <!-- Info -->
        <div class="text-xs text-gray-500 border-t pt-4">
          <p>• 支持 JPG、PNG、WebP 格式互转</p>
          <p>• PNG 为无损格式，不支持质量调节</p>
          <p>• 所有处理在本地完成</p>
        </div>
      </div>
      
      <!-- Drop Area & Image List -->
      <div class="lg:col-span-2">
        <!-- Drop Area -->
        <div
          v-if="images.length === 0"
          class="border-2 border-dashed rounded-lg p-12 text-center"
          :class="isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'"
          @dragover.prevent="isDragging = true"
          @dragleave="isDragging = false"
          @drop.prevent="handleDrop"
        >
          <p class="text-gray-500 mb-4">拖拽图片到这里，或点击选择</p>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
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
        
        <!-- Image List -->
        <div v-else class="space-y-3">
          <!-- Summary -->
          <div class="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
            <div class="text-sm">
              <span class="font-medium">{{ images.length }} 个文件</span>
              <span class="text-gray-500 ml-2">
                已转换: {{ convertedCount }} 个
              </span>
            </div>
            <button @click="addMoreFiles" class="text-sm text-blue-600 hover:underline">
              + 添加更多
            </button>
          </div>
          
          <!-- Images -->
          <div
            v-for="(img, index) in images"
            :key="img.id"
            class="bg-white rounded-lg border p-3 flex items-center gap-4"
          >
            <!-- Preview -->
            <div class="flex-shrink-0">
              <img
                :src="img.original"
                class="w-16 h-16 object-cover rounded"
              />
            </div>
            
            <!-- Info -->
            <div class="flex-1 min-w-0">
              <p class="font-medium text-gray-900 truncate">{{ img.name }}</p>
              <p class="text-sm text-gray-500">
                {{ img.format.toUpperCase() }} → {{ outputFormat.toUpperCase() }}
                <span v-if="img.convertedSize">({{ formatSize(img.originalSize) }} → {{ formatSize(img.convertedSize) }})</span>
              </p>
            </div>
            
            <!-- Actions -->
            <div class="flex items-center gap-2 flex-shrink-0">
              <span v-if="img.status === 'converting'" class="text-sm text-blue-600">转换中...</span>
              <button
                v-else-if="img.status === 'waiting'"
                @click="convertSingle(index)"
                class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                转换
              </button>
              <a
                v-else-if="img.convertedUrl"
                :href="img.convertedUrl"
                :download="getOutputName(img.name)"
                class="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                下载
              </a>
              <button
                @click="removeImage(index)"
                class="p-1 text-gray-400 hover:text-red-500"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

// Settings
const outputFormat = ref('jpeg')
const quality = ref(90)

// State
const images = ref([])
const isDragging = ref(false)
const isConverting = ref(false)
const statusMsg = ref('')
const statusErr = ref(false)

// Computed
const convertedCount = computed(() => images.value.filter(i => i.convertedUrl).length)

onUnmounted(() => {
  images.value.forEach(img => {
    if (img.original) URL.revokeObjectURL(img.original)
    if (img.convertedUrl) URL.revokeObjectURL(img.convertedUrl)
  })
})

function handleDrop(e) {
  isDragging.value = false
  addFiles(Array.from(e.dataTransfer.files))
}

function handleFileSelect(e) {
  addFiles(Array.from(e.target.files))
  e.target.value = ''
}

function addMoreFiles() {
  const input = document.createElement('input')
  input.type = 'file'
  input.multiple = true
  input.accept = 'image/jpeg,image/png,image/webp'
  input.onchange = (e) => addFiles(Array.from(e.target.files))
  input.click()
}

function addFiles(newFiles) {
  const supported = newFiles.filter(f => ['image/jpeg', 'image/png', 'image/webp'].includes(f.type))
  
  supported.forEach(file => {
    const format = file.type.split('/')[1]
    images.value.push({
      id: uuidv4(),
      name: file.name,
      file: file,
      original: URL.createObjectURL(file),
      originalSize: file.size,
      format: format === 'jpeg' ? 'jpg' : format,
      convertedUrl: null,
      convertedBlob: null,
      convertedSize: 0,
      status: 'waiting'
    })
  })
}

function removeImage(index) {
  const img = images.value[index]
  if (img.original) URL.revokeObjectURL(img.original)
  if (img.convertedUrl) URL.revokeObjectURL(img.convertedUrl)
  images.value.splice(index, 1)
}

function clearAll() {
  images.value.forEach(img => {
    if (img.original) URL.revokeObjectURL(img.original)
    if (img.convertedUrl) URL.revokeObjectURL(img.convertedUrl)
  })
  images.value = []
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function getOutputName(name) {
  const base = name.replace(/\.[^.]+$/, '')
  const ext = outputFormat.value === 'jpeg' ? 'jpg' : outputFormat.value
  return `${base}.${ext}`
}

function getMimeType() {
  const types = {
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp'
  }
  return types[outputFormat.value]
}

async function convertImage(img) {
  img.status = 'converting'
  
  try {
    const image = new Image()
    await new Promise((resolve, reject) => {
      image.onload = resolve
      image.onerror = reject
      image.src = img.original
    })
    
    const canvas = document.createElement('canvas')
    canvas.width = image.width
    canvas.height = image.height
    const ctx = canvas.getContext('2d')
    
    // 白色背景（对于 JPG，透明区域会变成白色）
    if (outputFormat.value === 'jpeg') {
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    
    ctx.drawImage(image, 0, 0)
    
    const blob = await new Promise(resolve => {
      canvas.toBlob(resolve, getMimeType(), quality.value / 100)
    })
    
    img.convertedBlob = blob
    img.convertedSize = blob.size
    img.convertedUrl = URL.createObjectURL(blob)
    img.status = 'done'
    return true
  } catch (e) {
    console.error('转换失败:', e)
    img.status = 'error'
    return false
  }
}

async function convertSingle(index) {
  isConverting.value = true
  await convertImage(images.value[index])
  isConverting.value = false
}

async function convertAll() {
  isConverting.value = true
  
  for (const img of images.value) {
    if (img.status === 'waiting') {
      await convertImage(img)
    }
  }
  
  isConverting.value = false
  statusMsg.value = `转换完成: ${convertedCount.value} 个文件`
  setTimeout(() => { statusMsg.value = '' }, 3000)
}

async function downloadAll() {
  const finished = images.value.filter(i => i.convertedBlob)
  if (finished.length === 0) return
  
  if (finished.length === 1) {
    saveAs(finished[0].convertedBlob, getOutputName(finished[0].name))
  } else {
    const zip = new JSZip()
    finished.forEach(img => {
      zip.file(getOutputName(img.name), img.convertedBlob)
    })
    
    const content = await zip.generateAsync({ type: 'blob' })
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')
    saveAs(content, `converted_${timestamp}.zip`)
  }
}
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
