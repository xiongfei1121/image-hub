<template>
  <div>
    <h1 class="text-2xl font-bold text-gray-900 mb-6">背景移除</h1>
    
    <div class="bg-white rounded-lg border p-6">
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          选择图片
        </label>
        <input
          type="file"
          accept="image/*"
          @change="handleFileSelect"
          class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      <div v-if="loading" class="text-center py-12">
        <div class="text-2xl mb-2">🤖</div>
        <p class="text-gray-600">加载模型中... 首次使用需要下载约 40MB</p>
      </div>

      <div v-else-if="result" class="space-y-4">
        <div class="flex gap-4">
          <div class="flex-1">
            <p class="text-sm text-gray-500 mb-2">原图</p>
            <img :src="originalPreview" class="max-w-full rounded border" />
          </div>
          <div class="flex-1">
            <p class="text-sm text-gray-500 mb-2">结果</p>
            <img :src="result" class="max-w-full rounded border" />
          </div>
        </div>
        <a
          :href="result"
          download="removed-bg.png"
          class="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          下载透明背景图片
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { pipeline, env } from '@xenova/transformers'

const file = ref(null)
const originalPreview = ref(null)
const result = ref(null)
const loading = ref(false)
let removeBackground = null

function handleFileSelect(e) {
  const selected = e.target.files[0]
  if (!selected) return
  
  file.value = selected
  originalPreview.value = URL.createObjectURL(selected)
  result.value = null
  processImage()
}

async function processImage() {
  if (!file.value) return
  
  loading.value = true
  
  try {
    // 设置模型路径
    env.allowLocalModels = false
    env.useBrowserCache = true
    
    // 加载模型
    if (!removeBackground) {
      removeBackground = await pipeline('image-segmentation', 'Xenova/modnet')
    }
    
    // 处理图片
    const output = await removeBackground(originalPreview.value, {
      return_pixmap: true,
      alpha_matting: true
    })
    
    result.value = output.toDataURL()
  } catch (e) {
    console.error('处理失败:', e)
  }
  
  loading.value = false
}
</script>