<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- 页面标题 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">格式转换</h1>
      <p class="text-gray-600">JPG、PNG、WebP 格式互转 - 本地处理，安全快速</p>
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
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                转换设置
              </h2>
            </div>
            
            <!-- 输出格式 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">输出格式</label>
              <select v-model="outputFormat" class="select">
                <option value="jpeg">JPG / JPEG</option>
                <option value="png">PNG</option>
                <option value="webp">WebP</option>
              </select>
            </div>
            
            <!-- 质量 (有损格式) -->
            <div v-if="outputFormat !== 'png'">
              <div class="flex items-center justify-between mb-3">
                <label class="text-sm font-medium text-gray-700">输出质量</label>
                <span class="text-sm font-semibold text-primary-600">{{ quality }}%</span>
              </div>
              <input
                v-model.number="quality"
                type="range"
                min="1"
                max="100"
                class="w-full"
              />
            </div>
            
            <!-- 格式说明 -->
            <div class="p-3 bg-gray-50 rounded-lg">
              <p class="text-sm text-gray-600">
                <span v-if="outputFormat === 'png'" class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd" />
                  </svg>
                  PNG 为无损格式，不支持质量调节
                </span>
                <span v-else class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd" />
                  </svg>
                  质量越高，文件越大，画质越好
                </span>
              </p>
            </div>
            
            <!-- 操作按钮 -->
            <div class="space-y-3 pt-6 border-t">
              <button
                @click="convertAll"
                :disabled="images.length === 0 || isConverting"
                class="btn-primary w-full flex items-center justify-center gap-2"
              >
                <svg v-if="isConverting" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{{ isConverting ? '转换中...' : '转换全部' }}</span>
              </button>
              <button
                @click="downloadAll"
                :disabled="convertedCount === 0"
                class="w-full px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>下载全部 ({{ convertedCount }} 个)</span>
              </button>
              <button
                @click="clearAll"
                :disabled="images.length === 0"
                class="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                清空列表
              </button>
            </div>
            
            <!-- 限制说明 -->
            <div class="text-xs text-gray-500 bg-gray-50 rounded-lg p-4 space-y-1">
              <p class="flex items-center gap-2">
                <svg class="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd" />
                </svg>
                支持 JPG、PNG、WebP 格式互转
              </p>
              <p class="flex items-center gap-2">
                <svg class="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd" />
                </svg>
                PNG 为无损格式，不支持质量调节
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
      
      <!-- 上传区域和文件列表 -->
      <div class="lg:col-span-8">
        <!-- 上传区域 -->
        <div
          v-if="images.length === 0"
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
            accept="image/jpeg,image/png,image/webp"
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
        
        <!-- 文件列表 -->
        <div v-else class="space-y-4 animate-fade-in">
          <!-- 统计信息 -->
          <div class="card">
            <div class="card-body">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                  <div class="text-sm">
                    <span class="font-semibold text-gray-900">{{ images.length }} 个文件</span>
                    <span class="text-gray-500 ml-2">
                      已转换: {{ convertedCount }} 个
                    </span>
                  </div>
                </div>
                <button @click="addMoreFiles" class="btn-secondary btn-small flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  添加更多
                </button>
              </div>
            </div>
          </div>
          
          <!-- 文件项 -->
          <div
            v-for="(img, index) in images"
            :key="img.id"
            class="file-item"
          >
            <!-- 预览图 -->
            <div class="relative flex-shrink-0">
              <img
                :src="img.original"
                class="w-20 h-20 object-cover rounded-xl cursor-pointer hover:opacity-80 transition-opacity"
              />
              <div v-if="img.convertedUrl" class="absolute -bottom-2 -right-2 text-xs bg-green-500 text-white px-2 py-1 rounded-full font-medium shadow-md">
                {{ outputFormat.toUpperCase() }}
              </div>
            </div>
            
            <!-- 文件信息 -->
            <div class="flex-1 min-w-0">
              <p class="font-medium text-gray-900 truncate mb-1">{{ img.name }}</p>
              <p class="text-sm text-gray-500">
                {{ img.format.toUpperCase() }} → {{ outputFormat.toUpperCase() }}
                <span v-if="img.convertedSize" class="text-green-600 font-medium">
                  ({{ formatSize(img.originalSize) }} → {{ formatSize(img.convertedSize) }})
                </span>
              </p>
              <!-- 进度条 -->
              <div v-if="img.status === 'converting'" class="mt-2">
                <div class="progress-bar">
                  <div class="progress-bar-fill animate-pulse" style="width: 60%"></div>
                </div>
              </div>
            </div>
            
            <!-- 操作按钮 -->
            <div class="flex items-center gap-2 flex-shrink-0">
              <span v-if="img.status === 'converting'" class="text-sm text-primary-600 font-medium">转换中...</span>
              <button
                v-else-if="img.status === 'waiting'"
                @click="convertSingle(index)"
                class="btn-primary btn-small"
              >
                转换
              </button>
              <a
                v-else-if="img.convertedUrl"
                :href="img.convertedUrl"
                :download="getOutputName(img.name)"
                class="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                下载
              </a>
              <button
                @click="removeImage(index)"
                class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
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
  if (!import.meta.client) return
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
