<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 mb-6">图像压缩</h1>
    
    <!-- Quality Setting -->
    <div class="bg-white rounded-lg border p-4 mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        压缩质量: {{ quality }}%
      </label>
      <input
        v-model="quality"
        type="range"
        min="1"
        max="100"
        class="w-full"
      />
      <div class="flex gap-4 mt-4">
        <label class="flex items-center gap-2">
          <input type="checkbox" v-model="keepMetadata" class="rounded" />
          <span class="text-sm text-gray-600">保留元数据</span>
        </label>
      </div>
    </div>

    <!-- Drop Area -->
    <div
      class="border-2 border-dashed rounded-lg p-8 text-center mb-4"
      :class="isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'"
      @dragover.prevent="isDragging = true"
      @dragleave="isDragging = false"
      @drop.prevent="handleDrop"
    >
      <p class="text-gray-500 mb-4">拖拽图片到这里，或点击选择</p>
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
        class="px-4 py-2 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700"
      >
        选择图片
      </label>
    </div>

    <!-- File List -->
    <div v-if="files.length > 0" class="space-y-4">
      <div
        v-for="(file, index) in files"
        :key="file.id"
        class="flex items-center justify-between p-4 bg-gray-50 rounded"
      >
        <!-- Preview -->
        <div class="flex items-center gap-4">
          <img
            v-if="file.preview"
            :src="file.preview"
            class="w-16 h-16 object-cover rounded"
          />
          <div>
            <p class="font-medium text-gray-900">{{ file.name }}</p>
            <p class="text-sm text-gray-500">
              原始: {{ formatSize(file.originalSize) }}
              <span v-if="file.compressedSize > 0">
                → 压缩后: {{ formatSize(file.compressedSize) }}
                <span class="text-green-600">
                  (-{{ Math.round((1 - file.compressedSize / file.originalSize) * 100) }}%)
                </span>
              </span>
            </p>
          </div>
        </div>
        
        <!-- Status -->
        <div>
          <span v-if="file.status === 'compressing'" class="text-blue-600">
            压缩中...
          </span>
          <span v-else-if="file.status === 'error'" class="text-red-600">
            失败: {{ file.error }}
          </span>
          <button
            v-else-if="!file.compressedUrl"
            @click="compressImage(index)"
            :disabled="compressing || !workerReady"
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            压缩
          </button>
          <a
            v-else
            :href="file.compressedUrl"
            :download="'compressed_' + file.name"
            class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            下载
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { v4 as uuidv4 } from 'uuid'

const quality = ref(80)
const keepMetadata = ref(false)
const isDragging = ref(false)
const compressing = ref(false)
const workerReady = ref(false)
let worker = null
const fileCallbacks = new Map()

// Initialize WASM worker
onMounted(() => {
  worker = new Worker('/assets/workers/compression-worker.js')
  
  worker.onmessage = (e) => {
    if (e.data === 'initFinished') {
      workerReady.value = true
      console.log('WASM initialized')
    } else if (e.data.uuid) {
      const callback = fileCallbacks.get(e.data.uuid)
      if (callback) {
        callback(e.data)
        fileCallbacks.delete(e.data.uuid)
      }
    }
  }
  
  worker.onerror = (e) => {
    console.error('Worker error:', e)
  }
  
  // Initialize the library
  worker.postMessage('initLib')
})

onUnmounted(() => {
  if (worker) {
    worker.terminate()
  }
})

const files = ref([])

function handleDrop(e) {
  isDragging.value = false
  const dropped = Array.from(e.dataTransfer.files)
  addFiles(dropped)
}

function handleFileSelect(e) {
  const selected = Array.from(e.target.files)
  addFiles(selected)
}

function addFiles(newFiles) {
  for (const file of newFiles) {
    if (!file.type.startsWith('image/')) continue
    
    files.value.push({
      id: uuidv4(),
      name: file.name,
      originalSize: file.size,
      file: file,
      preview: URL.createObjectURL(file),
      compressedUrl: null,
      compressedSize: 0,
      compressedBlob: null,
      status: 'waiting',
      error: ''
    })
  }
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function compressImage(index) {
  const item = files.value[index]
  item.status = 'compressing'
  compressing.value = true
  
  // Store callback for this file
  fileCallbacks.set(item.id, (result) => {
    if (result.success) {
      const blob = new Blob([result.data], { type: 'image/jpeg' })
      item.compressedSize = result.size
      item.compressedBlob = blob
      item.compressedUrl = URL.createObjectURL(blob)
      item.status = 'done'
    } else {
      item.status = 'error'
      item.error = result.errorString || '压缩失败'
    }
    compressing.value = false
  })
  
  // Message: [file, quality, keepMetadata, maxSize, compressionMode, uuid]
  // compressionMode 0 = QUALITY (based on quality percentage)
  worker.postMessage([
    item.file,
    quality.value / 100,
    keepMetadata.value ? 1 : 0,
    0, // maxSize (0 = no limit)
    0, // compressionMode.QUALITY
    item.id
  ])
}
</script>
