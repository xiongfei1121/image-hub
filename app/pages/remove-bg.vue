<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 mb-6">背景移除</h1>
    
    <!-- Status -->
    <div v-if="statusMsg" class="mb-4 p-3 rounded" :class="statusErr ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'">
      {{ statusMsg }}
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Settings Panel -->
      <div class="bg-white rounded-lg border p-4 space-y-4">
        <h2 class="font-medium border-b pb-2">设置</h2>
        
        <!-- Model Status -->
        <div class="p-3 rounded" :class="modelLoaded ? 'bg-green-50' : 'bg-gray-50'">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full" :class="modelLoaded ? 'bg-green-500' : 'bg-gray-300'"></div>
            <span class="text-sm">{{ modelLoaded ? '模型已加载' : '模型未加载' }}</span>
          </div>
          <p class="text-xs text-gray-500 mt-1">
            {{ modelLoaded ? '可以开始处理图片' : '首次使用需下载约 176MB 模型' }}
          </p>
        </div>
        
        <!-- Options -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">Alpha Matting</span>
            <input type="checkbox" v-model="alphaMatting" class="w-4 h-4" />
          </div>
          <p class="text-xs text-gray-400">启用后可获得更精细的边缘效果，但处理速度较慢</p>
        </div>
        
        <!-- Actions -->
        <div class="space-y-2 pt-4 border-t">
          <button
            v-if="!modelLoaded"
            @click="loadModel"
            :disabled="loadingModel"
            class="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {{ loadingModel ? '加载中...' : '加载模型' }}
          </button>
          <button
            v-if="processedImages.length > 0"
            @click="downloadAll"
            class="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            下载全部 ({{ processedImages.length }} 个)
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
          <p>• 支持 JPG、PNG、WebP 格式</p>
          <p>• 使用 MODNet 模型进行背景移除</p>
          <p>• 所有处理在本地完成，不上传服务器</p>
          <p>• 首次使用需下载模型（约 176MB）</p>
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
                已处理: {{ processedImages.length }} 个
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
            class="bg-white rounded-lg border p-3"
          >
            <div class="flex items-center gap-4">
              <!-- Original Preview -->
              <div class="flex-shrink-0">
                <img
                  :src="img.original"
                  class="w-20 h-20 object-cover rounded cursor-pointer"
                  @click="showPreview(img)"
                />
              </div>
              
              <!-- Info -->
              <div class="flex-1 min-w-0">
                <p class="font-medium text-gray-900 truncate">{{ img.name }}</p>
                <p class="text-sm text-gray-500">{{ formatSize(img.size) }}</p>
                <div v-if="img.status === 'processing'" class="mt-1 h-1 bg-gray-200 rounded overflow-hidden">
                  <div class="h-full bg-blue-500 animate-pulse" style="width: 60%"></div>
                </div>
                <p v-if="img.status === 'error'" class="text-sm text-red-600">{{ img.error }}</p>
              </div>
              
              <!-- Result Preview -->
              <div v-if="img.result" class="flex-shrink-0">
                <img
                  :src="img.result"
                  class="w-20 h-20 object-cover rounded cursor-pointer"
                  style="background: repeating-conic-gradient(#ccc 0% 25%, white 0% 50%) 50% / 10px 10px"
                  @click="showPreview(img)"
                />
              </div>
              
              <!-- Actions -->
              <div class="flex items-center gap-2 flex-shrink-0">
                <span v-if="img.status === 'processing'" class="text-sm text-blue-600">处理中...</span>
                <button
                  v-else-if="img.status === 'waiting'"
                  @click="processSingle(index)"
                  :disabled="!modelLoaded"
                  class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  处理
                </button>
                <a
                  v-else-if="img.result"
                  :href="img.result"
                  :download="'nobg_' + img.name.replace(/\.[^.]+$/, '.png')"
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
          
          <!-- Process All Button -->
          <button
            v-if="waitingImages.length > 0 && modelLoaded"
            @click="processAll"
            :disabled="isProcessing"
            class="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {{ isProcessing ? '处理中...' : `处理全部 (${waitingImages.length} 个)` }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- Preview Modal -->
    <div
      v-if="previewImage"
      class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      @click="previewImage = null"
    >
      <div class="bg-white rounded-lg p-4 max-w-4xl max-h-[90vh] overflow-auto" @click.stop>
        <div class="flex justify-between items-center mb-4">
          <h3 class="font-medium">{{ previewImage.name }}</h3>
          <button @click="previewImage = null" class="text-gray-500 hover:text-gray-700 text-xl">✕</button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-gray-500 mb-2">原图</p>
            <img :src="previewImage.original" class="max-w-full rounded" />
          </div>
          <div v-if="previewImage.result">
            <p class="text-sm text-gray-500 mb-2">背景移除后</p>
            <img 
              :src="previewImage.result" 
              class="max-w-full rounded"
              style="background: repeating-conic-gradient(#ccc 0% 25%, white 0% 50%) 50% / 20px 20px"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

// 动态导入背景移除库
let removeBackgroundLib = null

// Settings
const alphaMatting = ref(false)

// State
const images = ref([])
const isDragging = ref(false)
const statusMsg = ref('')
const statusErr = ref(false)
const previewImage = ref(null)

// Model
const modelLoaded = ref(false)
const loadingModel = ref(false)
const isProcessing = ref(false)

// Computed
const processedImages = computed(() => images.value.filter(i => i.result))
const waitingImages = computed(() => images.value.filter(i => i.status === 'waiting'))

onMounted(() => {
  // Auto load library on page load
  loadModel()
})

async function loadModel() {
  if (modelLoaded.value || loadingModel.value) return
  
  loadingModel.value = true
  statusMsg.value = '正在加载背景移除引擎...'
  
  try {
    // 动态导入 @imgly/background-removal
    const module = await import('@imgly/background-removal')
    removeBackgroundLib = module.removeBackground
    modelLoaded.value = true
    statusMsg.value = '引擎加载完成，可以开始处理图片'
    statusErr.value = false
    setTimeout(() => { statusMsg.value = '' }, 3000)
  } catch (e) {
    console.error('引擎加载失败:', e)
    statusMsg.value = '引擎加载失败: ' + e.message
    statusErr.value = true
  }
  
  loadingModel.value = false
}

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
  const supported = newFiles.filter(f => f.type.startsWith('image/'))
  
  supported.forEach(file => {
    images.value.push({
      id: uuidv4(),
      name: file.name,
      file: file,
      original: URL.createObjectURL(file),
      size: file.size,
      result: null,
      resultBlob: null,
      status: 'waiting',
      error: ''
    })
  })
}

function removeImage(index) {
  const img = images.value[index]
  if (img.original) URL.revokeObjectURL(img.original)
  if (img.result) URL.revokeObjectURL(img.result)
  images.value.splice(index, 1)
}

function clearAll() {
  images.value.forEach(img => {
    if (img.original) URL.revokeObjectURL(img.original)
    if (img.result) URL.revokeObjectURL(img.result)
  })
  images.value = []
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

async function processImage(img) {
  if (!removeBackgroundLib) {
    await loadModel()
    if (!removeBackgroundLib) return false
  }
  
  img.status = 'processing'
  
  try {
    // 使用 @imgly/background-removal 处理图片
    const blob = await removeBackgroundLib(img.file, {
      progress: (key, current, total) => {
        if (key === 'compute:inference') {
          const percent = Math.round((current / total) * 100)
          statusMsg.value = `处理中... ${percent}%`
        }
      }
    })
    
    img.resultBlob = blob
    img.result = URL.createObjectURL(blob)
    img.status = 'done'
    statusMsg.value = ''
    return true
  } catch (e) {
    console.error('处理失败:', e)
    img.status = 'error'
    img.error = e.message || '处理失败'
    return false
  }
}

async function processSingle(index) {
  isProcessing.value = true
  await processImage(images.value[index])
  isProcessing.value = false
}

async function processAll() {
  isProcessing.value = true
  
  for (const img of waitingImages.value) {
    await processImage(img)
  }
  
  isProcessing.value = false
  
  const success = processedImages.value.length
  statusMsg.value = `处理完成: ${success} 个成功`
  setTimeout(() => { statusMsg.value = '' }, 3000)
}

async function downloadAll() {
  const finished = images.value.filter(i => i.resultBlob)
  if (finished.length === 0) return
  
  if (finished.length === 1) {
    saveAs(finished[0].resultBlob, 'nobg_' + finished[0].name.replace(/\.[^.]+$/, '.png'))
  } else {
    const zip = new JSZip()
    finished.forEach(img => {
      zip.file('nobg_' + img.name.replace(/\.[^.]+$/, '.png'), img.resultBlob)
    })
    
    const content = await zip.generateAsync({ type: 'blob' })
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')
    saveAs(content, `nobg_${timestamp}.zip`)
  }
}

function showPreview(img) {
  previewImage.value = img
}
</script>

<style scoped>
input[type="checkbox"] {
  accent-color: #3b82f6;
}
</style>
