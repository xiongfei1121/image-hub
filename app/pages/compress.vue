<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 mb-6">图像压缩</h1>
    
    <!-- Status -->
    <div v-if="statusMsg" class="mb-4 p-3 rounded" :class="statusErr ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'">
      {{ statusMsg }}
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Settings Panel -->
      <div class="bg-white rounded-lg border p-4 space-y-4">
        <h2 class="font-medium border-b pb-2">压缩设置</h2>
        
        <!-- Compression Mode -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">压缩模式</label>
          <select v-model="compressionMode" class="w-full px-2 py-1 border rounded">
            <option value="quality">质量优先</option>
            <option value="size">大小限制</option>
          </select>
        </div>
        
        <!-- Quality Mode -->
        <div v-if="compressionMode === 'quality'">
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium text-gray-700">压缩质量</label>
            <span class="text-sm text-gray-500">{{ quality }}%</span>
          </div>
          <input
            v-model.number="quality"
            :disabled="lossless"
            type="range"
            min="1"
            max="100"
            class="w-full"
          />
          
          <!-- Lossless -->
          <div class="flex items-center justify-between mt-3">
            <div class="flex items-center gap-1">
              <span class="text-sm text-gray-600">无损压缩</span>
              <span class="text-xs text-gray-400 cursor-help" title="无损压缩不会降低图片质量，但压缩率较低">(?)</span>
            </div>
            <input type="checkbox" v-model="lossless" class="w-4 h-4" />
          </div>
        </div>
        
        <!-- Size Mode -->
        <div v-if="compressionMode === 'size'">
          <label class="block text-sm font-medium text-gray-700 mb-2">最大输出大小</label>
          <div class="flex gap-2">
            <input
              v-model.number="maxSizeValue"
              type="number"
              min="1"
              class="flex-1 px-2 py-1 border rounded"
            />
            <select v-model.number="maxSizeUnit" class="px-2 py-1 border rounded">
              <option :value="1000">KB</option>
              <option :value="1000000">MB</option>
            </select>
          </div>
        </div>
        
        <!-- Keep Metadata -->
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-600">保留元数据</span>
          <input type="checkbox" v-model="keepMetadata" class="w-4 h-4" />
        </div>
        
        <!-- Resize Section -->
        <div class="border-t pt-4">
          <div class="flex items-center justify-between mb-3">
            <span class="font-medium text-sm">图片缩放</span>
            <select v-model.number="resizeMode" class="px-2 py-1 border rounded text-sm">
              <option :value="0">不缩放</option>
              <option :value="1">指定尺寸</option>
              <option :value="2">百分比</option>
              <option :value="3">短边</option>
              <option :value="4">长边</option>
              <option :value="5">固定宽度</option>
              <option :value="6">固定高度</option>
            </select>
          </div>
          
          <!-- Dimensions -->
          <div v-if="resizeMode === 1" class="flex gap-2 items-center">
            <input
              v-model.number="resizeWidth"
              type="number"
              min="1"
              placeholder="宽"
              class="flex-1 px-2 py-1 border rounded text-sm"
            />
            <span class="text-gray-500">×</span>
            <input
              v-model.number="resizeHeight"
              type="number"
              min="1"
              placeholder="高"
              class="flex-1 px-2 py-1 border rounded text-sm"
            />
            <span class="text-xs text-gray-500">px</span>
          </div>
          
          <!-- Percentage -->
          <div v-if="resizeMode === 2">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-gray-600">缩放比例</span>
              <span class="text-sm text-gray-500">{{ resizePercentage }}%</span>
            </div>
            <input
              v-model.number="resizePercentage"
              type="range"
              min="1"
              max="200"
              class="w-full"
            />
          </div>
          
          <!-- Short/Long Edge / Fixed Width/Height -->
          <div v-if="[3, 4, 5, 6].includes(resizeMode)" class="flex gap-2 items-center">
            <input
              v-model.number="resizeEdge"
              type="number"
              min="1"
              :placeholder="resizeLabels[resizeMode]"
              class="flex-1 px-2 py-1 border rounded text-sm"
            />
            <span class="text-xs text-gray-500">px</span>
          </div>
        </div>
        
        <!-- Actions -->
        <div class="space-y-2 pt-4 border-t">
          <button
            @click="compressAll"
            :disabled="files.length === 0 || isCompressing"
            class="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {{ isCompressing ? '压缩中...' : '压缩全部' }}
          </button>
          <button
            @click="downloadAll"
            :disabled="compressedCount === 0"
            class="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            下载全部 ({{ compressedCount }} 个)
          </button>
          <button
            @click="clearAll"
            :disabled="files.length === 0"
            class="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
          >
            清空列表
          </button>
        </div>
        
        <!-- Restrictions -->
        <div class="text-xs text-gray-500 border-t pt-4">
          <p>• 支持 JPG、PNG、WebP 格式</p>
          <p>• 最多 {{ maxFiles }} 个文件</p>
          <p>• 单文件最大 {{ formatSize(maxFileSize) }}</p>
          <p>• 所有处理在本地完成，不上传服务器</p>
        </div>
      </div>
      
      <!-- Drop Area & File List -->
      <div class="lg:col-span-2">
        <!-- Drop Area -->
        <div
          v-if="files.length === 0"
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
        
        <!-- File List -->
        <div v-else class="space-y-3">
          <!-- Summary -->
          <div class="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
            <div class="text-sm">
              <span class="font-medium">{{ files.length }} 个文件</span>
              <span class="text-gray-500 ml-2">
                原始: {{ formatSize(totalOriginalSize) }}
                <span v-if="totalCompressedSize > 0">
                  → {{ formatSize(totalCompressedSize) }}
                  <span :class="savedPercent > 0 ? 'text-green-600' : 'text-red-600'">
                    ({{ savedPercent > 0 ? '-' : '+' }}{{ Math.abs(savedPercent) }}%)
                  </span>
                </span>
              </span>
            </div>
            <button @click="addMoreFiles" class="text-sm text-blue-600 hover:underline">
              + 添加更多
            </button>
          </div>
          
          <!-- Files -->
          <div
            v-for="(file, index) in files"
            :key="file.id"
            class="bg-white rounded-lg border p-3 flex items-center gap-4"
          >
            <!-- Preview -->
            <div class="relative flex-shrink-0">
              <img
                v-if="file.preview"
                :src="file.preview"
                class="w-16 h-16 object-cover rounded cursor-pointer"
                @click="showPreview(file)"
              />
              <div v-if="file.compressedUrl" class="absolute -bottom-1 -right-1 text-xs bg-green-500 text-white px-1 rounded">
                -{{ Math.round((1 - file.compressedSize / file.originalSize) * 100) }}%
              </div>
            </div>
            
            <!-- Info -->
            <div class="flex-1 min-w-0">
              <p class="font-medium text-gray-900 truncate">{{ file.name }}</p>
              <p class="text-sm text-gray-500">
                {{ formatSize(file.originalSize) }}
                <span v-if="file.compressedSize > 0">
                  → {{ formatSize(file.compressedSize) }}
                </span>
              </p>
              <!-- Progress -->
              <div v-if="file.status === 'compressing'" class="mt-1 h-1 bg-gray-200 rounded overflow-hidden">
                <div class="h-full bg-blue-500 animate-pulse" style="width: 60%"></div>
              </div>
              <p v-if="file.status === 'error'" class="text-sm text-red-600">{{ file.error }}</p>
            </div>
            
            <!-- Actions -->
            <div class="flex items-center gap-2 flex-shrink-0">
              <span v-if="file.status === 'compressing'" class="text-sm text-blue-600">压缩中...</span>
              <button
                v-else-if="file.status === 'waiting'"
                @click="compressSingle(index)"
                class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                压缩
              </button>
              <a
                v-else-if="file.compressedUrl"
                :href="file.compressedUrl"
                :download="'compressed_' + file.name"
                class="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
              >
                下载
              </a>
              <button
                @click="removeFile(index)"
                class="p-1 text-gray-400 hover:text-red-500"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Preview Modal -->
    <div
      v-if="previewFile"
      class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      @click="previewFile = null"
    >
      <div class="bg-white rounded-lg p-4 max-w-4xl max-h-[90vh] overflow-auto" @click.stop>
        <div class="flex justify-between items-center mb-4">
          <h3 class="font-medium">{{ previewFile.name }}</h3>
          <button @click="previewFile = null" class="text-gray-500 hover:text-gray-700 text-xl">✕</button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-gray-500 mb-2">原始 ({{ formatSize(previewFile.originalSize) }})</p>
            <img :src="previewFile.preview" class="max-w-full rounded" />
          </div>
          <div v-if="previewFile.compressedUrl">
            <p class="text-sm text-gray-500 mb-2">压缩后 ({{ formatSize(previewFile.compressedSize) }})</p>
            <img :src="previewFile.compressedUrl" class="max-w-full rounded" />
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

// Settings
const compressionMode = ref('quality') // 'quality' or 'size'
const quality = ref(80)
const lossless = ref(false)
const keepMetadata = ref(false)
const maxSizeValue = ref(500)
const maxSizeUnit = ref(1000) // 1000 = KB, 1000000 = MB
const resizeMode = ref(0) // 0=none, 1=dimensions, 2=percentage, 3=shortEdge, 4=longEdge, 5=fixedWidth, 6=fixedHeight
const resizeWidth = ref(0)
const resizeHeight = ref(0)
const resizePercentage = ref(100)
const resizeEdge = ref(0)

const resizeLabels = {
  3: '短边',
  4: '长边',
  5: '宽度',
  6: '高度'
}

// Limits
const maxFiles = 20
const maxFileSize = 20 * 1024 * 1024 // 20MB

// State
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

// Computed
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
  // Clean up object URLs
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
  e.target.value = '' // Reset input
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
    
    // Calculate resize params based on mode
    let rw = 0, rh = 0, rp = resizePercentage.value
    if (resizeMode.value === 1) { // dimensions
      rw = resizeWidth.value || 0
      rh = resizeHeight.value || 0
    } else if ([3, 4, 5, 6].includes(resizeMode.value)) { // shortEdge, longEdge, fixedWidth, fixedHeight
      rw = resizeEdge.value || 0
    }
    
    const maxSize = compressionMode.value === 'size' ? maxSizeValue.value * maxSizeUnit.value : 0
    const q = lossless.value ? 0 : quality.value
    const cm = compressionMode.value === 'quality' ? 0 : 1 // COMPRESSION_MODE enum
    
    // Worker message format: [file, quality, keepMetadata, maxSize, compressionMode, uuid, resizeMode, resizeWidth, resizeHeight, resizePercentage]
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
  
  // Show summary
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
    // Single file: direct download
    saveAs(finished[0].compressedBlob, 'compressed_' + finished[0].name)
  } else {
    // Multiple files: create zip
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

input[type="range"]::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: #3b82f6;
  border-radius: 50%;
  cursor: pointer;
  border: none;
}
</style>
