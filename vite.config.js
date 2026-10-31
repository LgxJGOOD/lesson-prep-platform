import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite 配置：使用 React 插件
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
