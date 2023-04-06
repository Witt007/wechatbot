import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import config from './src/c'
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), vueJsx()],
  server: {
   proxy:{ '/chat': {
    target: 'http://jsonplaceholder.typicode.com',
    changeOrigin: true,
   // rewrite: path => path.replace(/^\/chat/, '')
  }}
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
