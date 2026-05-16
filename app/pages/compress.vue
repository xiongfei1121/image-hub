<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- 页面标题 -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">图像压缩</h1>
      <p class="text-gray-600">减小文件体积，保持画质 - 支持 JPG、PNG、WebP 格式</p>
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
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                压缩设置
              </h2>
            </div>
            
            <!-- 压缩模式 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">压缩模式</label>
              <select v-model="compressionMode" class="select">
                <option value="quality">质量优先</option>
                <option value="size">大小限制</option>
              </select>
            </div>
            
            <!-- 质量模式 -->
            <div v-if="compressionMode === 'quality'">
              <div class="flex items-center justify-between mb-3">
                <label class="text-sm font-medium text-gray-700">压缩质量</label>
                <span class="text-sm font-semibold text-primary-600">{{ quality }}%</span>
              </div>
              <input
                v-model.number="quality"
                :disabled="lossless"
                type="range"
                min="1"
                max="100"
                class="w-full"
              />
              
              <!-- 无损压缩 -->
              <div class="flex items-center justify-between mt-4 p-3 bg-gray-50 rounded-lg">
                <div class="flex items-center gap-2">
                  <span class="text-sm text-gray-700">无损压缩</span>
                  <span class="text-xs text-gray-400 cursor-help" title="无损压缩不会降低图片质量，但压缩率较低">(?)</span>
                </div>
                <input type="checkbox" v-model="lossless" class="w-4 h-4" />
              </div>
            </div>
            
            <!-- 大小限制模式 -->
            <div v-if="compressionMode === 'size'">
              <label class="block text-sm font-medium text-gray-700 mb-2">最大输出大小</label>
              <div class="flex gap-2">
                <input
                  v-model.number="maxSizeValue"
                  type="number"
                  min="1"
                  class="input flex-1"
                />
                <select v-model.number="maxSizeUnit" class="select w-24">
                  <option :value="1000">KB</option>
                  <option :value="1000000">MB</option>
                </select>
              </div>
            </div>
            
            <!-- 保留元数据 -->
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span class="text-sm text-gray-700">保留元数据</span>
              <input type="checkbox" v-model="keepMetadata" class="w-4 h-4" />
            </div>
            
            <!-- 图片缩放 -->
            <div class="border-t pt-6">
              <div class="flex items-center justify-between mb-4">
                <span class="text-sm font-semibold text-gray-900">图片缩放</span>
                <select v-model="resizeMode" class="select w-32 text-sm">
                  <option value="none">不缩放</option>
                  <option value="dimensions">指定尺寸</option>
                  <option value="percentage">百分比</option>
                  <option value="short_edge">短边</option>
                  <option value="long_edge">长边</option>
                  <option value="fixed_width">固定宽度</option>
                  <option value="fixed_height">固定高度</option>
                </select>
              </div>
              
              <!-- 尺寸输入 -->
              <div v-if="resizeMode === 'dimensions'" class="flex gap-2 items-center">
                <input
                  v-model.number="resizeWidth"
                  type="number"
                  min="1"
                  placeholder="宽"
                  class="input flex-1 text-sm"
                />
                <span class="text-gray-400">×</span>
                <input
                  v-model.number="resizeHeight"
                  type="number"
                  min="1"
                  placeholder="高"
                  class="input flex-1 text-sm"
                />
                <span class="text-xs text-gray-500">px</span>
              </div>
              
              <!-- 百分比 -->
              <div v-if="resizeMode === 'percentage'">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm text-gray-600">缩放比例</span>
                  <span class="text-sm font-semibold text-primary-600">{{ resizePercentage }}%</span>
                </div>
                <input
                  v-model.number="resizePercentage"
                  type="range"
                  min="1"
                  max="200"
                  class="w-full"
                />
              </div>
              
              <!-- 边长输入 -->
              <div v-if="['short_edge', 'long_edge', 'fixed_width', 'fixed_height'].includes(resizeMode)" class="flex gap-2 items-center">
                <input
                  v-model.number="resizeEdge"
                  type="number"
                  min="1"
                  :placeholder="resizeLabels[resizeMode]"
                  class="input flex-1 text-sm"
                />
                <span class="text-xs text-gray-500">px</span>
              </div>
            </div>
            
            <!-- 操作按钮 -->
            <div class="space-y-3 pt-6 border-t">
              <button
                @click="compressAll"
                :disabled="files.length === 0 || isCompressing"
                class="btn-primary w-full flex items-center justify-center gap-2"
              >
                <svg v-if="isCompressing" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{{ isCompressing ? '压缩中...' : '压缩全部' }}</span>
              </button>
              <button
                @click="downloadAll"
                :disabled="compressedCount === 0"
                class="w-full px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>下载全部 ({{ compressedCount }} 个)</span>
              </button>
              <button
                @click="clearAll"
                :disabled="files.length === 0"
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
                支持 JPG、PNG、WebP 格式
              </p>
              <p class="flex items-center gap-2">
                <svg class="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd" />
                </svg>
                最多 {{ maxFiles }} 个文件
              </p>
              <p class="flex items-center gap-2">
                <svg class="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd" />
                </svg>
                单文件最大 {{ formatSize(maxFileSize) }}
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
          v-if="files.length === 0"
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
                    <span class="font-semibold text-gray-900">{{ files.length }} 个文件</span>
                    <span class="text-gray-500 ml-2">
                      原始: {{ formatSize(totalOriginalSize) }}
                      <span v-if="totalCompressedSize > 0">
                        → {{ formatSize(totalCompressedSize) }}
                        <span :class="savedPercent > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'">
                          ({{ savedPercent > 0 ? '-' : '+' }}{{ Math.abs(savedPercent) }}%)
                        </span>
                      </span>
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
            v-for="(file, index) in files"
            :key="file.id"
            class="file-item"
          >
            <!-- 预览图 -->
            <div class="relative flex-shrink-0">
              <img
                v-if="file.preview"
                :src="file.preview"
                class="w-20 h-20 object-cover rounded-xl cursor-pointer hover:opacity-80 transition-opacity"
                @click="showPreview(file)"
              />
              <div v-if="file.compressedUrl" class="absolute -bottom-2 -right-2 text-xs bg-green-500 text-white px-2 py-1 rounded-full font-medium shadow-md">
                -{{ Math.round((1 - file.compressedSize / file.originalSize) * 100) }}%
              </div>
            </div>
            
            <!-- 文件信息 -->
            <div class="flex-1 min-w-0">
              <p class="font-medium text-gray-900 truncate mb-1">{{ file.name }}</p>
              <p class="text-sm text-gray-500">
                {{ formatSize(file.originalSize) }}
                <span v-if="file.compressedSize > 0" class="text-green-600 font-medium">
                  → {{ formatSize(file.compressedSize) }}
                </span>
              </p>
              <!-- 进度条 -->
              <div v-if="file.status === 'compressing'" class="mt-2">
                <div class="progress-bar">
                  <div class="progress-bar-fill animate-pulse" style="width: 60%"></div>
                </div>
              </div>
              <p v-if="file.status === 'error'" class="text-sm text-red-600 mt-1">{{ file.error }}</p>
            </div>
            
            <!-- 操作按钮 -->
            <div class="flex items-center gap-2 flex-shrink-0">
              <span v-if="file.status === 'compressing'" class="text-sm text-primary-600 font-medium">压缩中...</span>
              <button
                v-else-if="file.status === 'waiting'"
                @click="compressSingle(index)"
                class="btn-primary btn-small"
              >
                压缩
              </button>
              <a
                v-else-if="file.compressedUrl"
                :href="file.compressedUrl"
                :download="'compressed_' + file.name"
                class="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                下载
              </a>
              <button
                @click="removeFile(index)"
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
    
    <!-- 预览模态框 -->
    <div
      v-if="previewFile"
      class="modal-overlay"
      @click="previewFile = null"
    >
      <div class="modal-content p-6" @click.stop>
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-lg font-semibold text-gray-900">{{ previewFile.name }}</h3>
          <button @click="previewFile = null" class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p class="text-sm text-gray-500 mb-3 font-medium">原始 ({{ formatSize(previewFile.originalSize) }})</p>
            <img :src="previewFile.preview" class="max-w-full rounded-xl shadow-md" />
          </div>
          <div v-if="previewFile.compressedUrl">
            <p class="text-sm text-gray-500 mb-3 font-medium">压缩后 ({{ formatSize(previewFile.compressedSize) }})</p>
            <img :src="previewFile.compressedUrl" class="max-w-full rounded-xl shadow-md" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

// 设置
const compressionMode = ref('quality')
const quality = ref(80)
const lossless = ref(false)
const keepMetadata = ref(false)
const maxSizeValue = ref(500)
const maxSizeUnit = ref(1000)
const resizeMode = ref('none')
const resizeWidth = ref(0)
const resizeHeight = ref(0)
const resizePercentage = ref(100)
const resizeEdge = ref(0)

const resizeLabels = {
  short_edge: '短边',
  long_edge: '长边',
  fixed_width: '宽度',
  fixed_height: '高度'
}

// 限制
const maxFiles = 20
const maxFileSize = 20 * 1024 * 1024

// 状态
const files = ref([])
const isDragging = ref(false)
const isCompressing = ref(false)
const statusMsg = ref('')
const statusErr = ref(false)
const previewFile = ref(null)

// Worker
let worker = null
const fileCallbacks = new Map()
let workerReady = false

// 计算属性
const compressedCount = computed(() => files.value.filter(f => f.compressedUrl).length)
const totalOriginalSize = computed(() => files.value.reduce((sum, f) => sum + f.originalSize, 0))
const totalCompressedSize = computed(() => files.value.reduce((sum, f) => sum + f.compressedSize, 0))
const savedPercent = computed(() => {
  if (totalOriginalSize.value === 0 || totalCompressedSize.value === 0) return 0
  return Math.round((1 - totalCompressedSize.value / totalOriginalSize.value) * 100)
})

onMounted(() => {
  initWorker()
})

onUnmounted(() => {
  if (worker) worker.terminate()
  files.value.forEach(f => {
    if (f.preview) URL.revokeObjectURL(f.preview)
    if (f.compressedUrl) URL.revokeObjectURL(f.compressedUrl)
  })
})

function initWorker() {
  statusMsg.value = '正在初始化压缩引擎...'
  
  try {
    worker = new Worker(new URL('~/assets/workers/compression-worker.js', import.meta.url), { type: 'module' })
    
    worker.onmessage = (e) => {
      if (e.data === 'initFinished') {
        workerReady = true
        statusMsg.value = ''
      } else if (e.data && e.data.uuid) {
        const cb = fileCallbacks.get(e.data.uuid)
        if (cb) {
          cb(e.data)
          fileCallbacks.delete(e.data.uuid)
        }
      }
    }
    
    worker.onerror = (err) => {
      console.error('Worker error:', err)
      statusMsg.value = '压缩引擎错误: ' + err.message
      statusErr.value = true
    }
    
    worker.postMessage('initLib')
  } catch (err) {
    statusMsg.value = '初始化失败: ' + err.message
    statusErr.value = true
  }
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
  const supported = newFiles.filter(f => ['image/jpeg', 'image/png', 'image/webp'].includes(f.type))
  
  if (files.value.length + supported.length > maxFiles) {
    statusMsg.value = `最多只能添加 ${maxFiles} 个文件`
    statusErr.value = true
    setTimeout(() => { statusMsg.value = ''; statusErr.value = false }, 3000)
    return
  }
  
  const valid = supported.filter(f => f.size <= maxFileSize)
  if (valid.length !== supported.length) {
    statusMsg.value = `部分文件超过 ${formatSize(maxFileSize)} 限制`
    statusErr.value = true
    setTimeout(() => { statusMsg.value = ''; statusErr.value = false }, 3000)
  }
  
  valid.forEach(file => {
    files.value.push({
      id: uuidv4(),
      name: file.name,
      file: file,
      preview: URL.createObjectURL(file),
      originalSize: file.size,
      compressedUrl: null,
      compressedSize: 0,
      compressedBlob: null,
      status: 'waiting',
      error: ''
    })
  })
}

function removeFile(index) {
  const f = files.value[index]
  if (f.preview) URL.revokeObjectURL(f.preview)
  if (f.compressedUrl) URL.revokeObjectURL(f.compressedUrl)
  files.value.splice(index, 1)
}

function clearAll() {
  files.value.forEach(f => {
    if (f.preview) URL.revokeObjectURL(f.preview)
    if (f.compressedUrl) URL.revokeObjectURL(f.compressedUrl)
  })
  files.value = []
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function compressFile(fileItem) {
  return new Promise((resolve) => {
    if (!workerReady || !worker) {
      fileItem.status = 'error'
      fileItem.error = '压缩引擎未就绪'
      resolve(false)
      return
    }
    
    fileItem.status = 'compressing'
    
    fileCallbacks.set(fileItem.id, (result) => {
      if (result.success) {
        const blob = new Blob([result.data], { type: getMimeType(fileItem.file.type) })
        fileItem.compressedBlob = blob
        fileItem.compressedSize = result.size
        fileItem.compressedUrl = URL.createObjectURL(blob)
        fileItem.status = 'done'
        resolve(true)
      } else {
        fileItem.status = 'error'
        fileItem.error = result.errorString || '压缩失败'
        resolve(false)
      }
    })
    
    let rw = 0, rh = 0, rp = resizePercentage.value
    if (resizeMode.value === 'dimensions') {
      rw = resizeWidth.value || 0
      rh = resizeHeight.value || 0
    } else if (['short_edge', 'long_edge', 'fixed_width', 'fixed_height'].includes(resizeMode.value)) {
      rw = resizeEdge.value || 0
    }
    
    const maxSize = compressionMode.value === 'size' ? maxSizeValue.value * maxSizeUnit.value : 0
    const q = lossless.value ? 0 : quality.value
    const cm = compressionMode.value === 'quality' ? 0 : 1
    
    worker.postMessage([
      fileItem.file,
      q,
      keepMetadata.value ? 1 : 0,
      maxSize,
      cm,
      fileItem.id,
      resizeMode.value,
      rw,
      rh,
      rp
    ])
  })
}

function getMimeType(type) {
  if (['image/jpeg', 'image/png', 'image/webp'].includes(type)) return type
  return 'image/jpeg'
}

async function compressSingle(index) {
  isCompressing.value = true
  await compressFile(files.value[index])
  isCompressing.value = false
}

async function compressAll() {
  isCompressing.value = true
  const waiting = files.value.filter(f => f.status === 'waiting')
  
  for (const file of waiting) {
    await compressFile(file)
  }
  
  isCompressing.value = false
  
  const success = files.value.filter(f => f.status === 'done').length
  const failed = files.value.filter(f => f.status === 'error').length
  
  if (failed === 0) {
    statusMsg.value = `成功压缩 ${success} 个文件，节省 ${formatSize(totalOriginalSize.value - totalCompressedSize.value)}`
    statusErr.value = false
  } else {
    statusMsg.value = `压缩完成: ${success} 成功, ${failed} 失败`
    statusErr.value = true
  }
  
  setTimeout(() => { statusMsg.value = ''; statusErr.value = false }, 5000)
}

async function downloadAll() {
  const finished = files.value.filter(f => f.compressedBlob)
  if (finished.length === 0) return
  
  if (finished.length === 1) {
    saveAs(finished[0].compressedBlob, 'compressed_' + finished[0].name)
  } else {
    const zip = new JSZip()
    finished.forEach(f => {
      zip.file(f.name, f.compressedBlob)
    })
    
    const content = await zip.generateAsync({ type: 'blob' })
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')
    saveAs(content, `compressed_${timestamp}.zip`)
  }
}

function showPreview(file) {
  previewFile.value = file
}
</script>
