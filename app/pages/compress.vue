<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 mb-6">图像压缩</h1>
    
    <div class="bg-white rounded-lg border p-6">
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          选择图片
        </label>
        <input
          type="file"
          accept="image/*"
          multiple
          @change="handleFileSelect"
          class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      <div v-if="files.length > 0" class="space-y-4">
        <div
          v-for="(file, index) in files"
          :key="index"
          class="flex items-center justify-between p-4 bg-gray-50 rounded"
        >
          <div class="flex items-center gap-4">
            <img
              v-if="file.preview"
              :src="file.preview"
              class="w-16 h-16 object-cover rounded"
            />
            <div>
              <p class="font-medium text-gray-900">{{ file.name }}</p>
              <p class="text-sm text-gray-500">
                原始: {{ formatSize(file.originalSize) }} → 
                压缩后: {{ file.compressedSize ? formatSize(file.compressedSize) : '...' }}
              </p>
            </div>
          </div>
          <button
            v-if="!file.compressed"
            @click="compressImage(index)"
            :disabled="compressing"
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {{ compressing ? '压缩中...' : '压缩' }}
          </button>
          <a
            v-else
            :href="file.downloadUrl"
            :download="file.name"
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
const files = ref([])
const compressing = ref(false)

function handleFileSelect(e) {
  const selected = Array.from(e.target.files)
  files.value = selected.map(file => ({
    name: file.name,
    originalSize: file.size,
    file: file,
    preview: URL.createObjectURL(file),
    compressed: false,
    compressedSize: 0,
    downloadUrl: null
  }))
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

async function compressImage(index) {
  compressing.value = true
  const item = files.value[index]
  
  try {
    // 使用 Canvas 简单压缩
    const img = new Image()
    img.src = item.preview
    await new Promise(resolve => img.onload = resolve)
    
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = img.height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0)
    
    const blob = await new Promise(resolve => {
      canvas.toBlob(resolve, 'image/jpeg', 0.8)
    })
    
    item.compressedSize = blob.size
    item.downloadUrl = URL.createObjectURL(blob)
    item.compressed = true
  } catch (e) {
    console.error('压缩失败:', e)
  }
  
  compressing.value = false
}
</script>