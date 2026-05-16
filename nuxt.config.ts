export default defineNuxtConfig({
  devtools: { enabled: true },
  
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
  ],

  css: [
    '~/assets/css/main.css'
  ],

  app: {
    head: {
      title: '老熊图像处理工具站',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '老熊图像处理工具站 - 图像压缩、拼接、格式转换、裁剪、调整、水印等在线工具' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  },

  nitro: {
    preset: 'static'
  },

  compatibilityDate: '2025-04-28'
})