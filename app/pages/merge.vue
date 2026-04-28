<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 mb-6">图像拼接</h1>
    
    <div class="bg-white rounded-lg border p-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            选择图片（可多选）
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            @change="handleFileSelect"
            class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            拼接方向
          </label>
          <select
            v-model="direction"
            class="w-full px-3 py-2 border rounded"
          >
            <option value="horizontal">横向拼接</option>
            <option value="vertical">纵向拼接</option>
          </select>
        </div>
      </div>

      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          间距 (像素)
        </label>
        <input
          type="number"
          v-model="gap"
          min="0"
          max="50"
          class="w-24 px-3 py-2 border rounded"
        />
      </div>

      <button
        @click="mergeImages"
        :disabled="files.length < 2 || processing"
        class="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {{ processing ? '处理中...' : '拼接' }}
      </button>

      <div v-if="result" class="mt-6">
        <p class="text-sm text-gray-500 mb-2">预览</p>
        <img :src="result" class="max-w-full rounded border" />
        <a
          :href="result"
          download="merged.png"
          class="inline-block mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          下载
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
const files = ref([])
const direction = ref('horizontal')
const gap = ref(10)
const result = ref(null)
const processing = ref(false)

function handleFileSelect(e) {
  files.value = Array.from(e.target.files).map(file => ({
    name: file.name,
    file: file,
    preview: URL.createObjectURL(file)
  }))
}

async function mergeImages() {
  if (files.value.length < 2) return
  
  processing.value = true
  
  try {
    // 加载所有图片
    const images = await Promise.all(
      files.value.map(item => {
        return new Promise((resolve) => {
          const img = new Image()
          img.onload = () => resolve(img)
          img.src = item.preview
        })
      })
    )
    
    if (direction.value === 'horizontal') {
      // 横向拼接
      const maxHeight = Math.max(...images.map(img => img.height))
      const totalWidth = images.reduce((sum, img) => sum + img.width, 0) + gap.value * (images.length - 1)
      
      const canvas = document.createElement('canvas')
      canvas.width = totalWidth
      canvas.height = maxHeight
      const ctx = canvas.getContext('2d')
      
      let x = 0
      images.forEach(img => {
        const y = (maxHeight - img.height) / 2
        ctx.drawImage(img, x, y)
        x += img.width + gap.value
      })
      
      result.value = canvas.toDataURL('image/png')
    } else {
      // 纵向拼接
      const maxWidth = Math.max(...images.map(img => img.width))
      const totalHeight = images.reduce((sum, img) => sum + img.height, 0) + gap.value * (images.length - 1)
      
      const canvas = document.createElement('canvas')
      canvas.width = maxWidth
      canvas.height = totalHeight
      const ctx = canvas.getContext('2d')
      
      let y = 0
      images.forEach(img => {
        const x = (maxWidth - img.width) / 2
        ctx.drawImage(img, x, y)
        y += img.height + gap.value
      })
      
      result.value = canvas.toDataURL('image/png')
    }
  } catch (e) {
    console.error('拼接失败:', e)
  }
  
  processing.value = false
}
</script>