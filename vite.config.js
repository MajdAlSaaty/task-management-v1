import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { cwd } from 'node:process'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, cwd(), '')
  const backendUrl = env.VITE_BACKEND_URL || 'http://127.0.0.1:8000'

  return {
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      port: 5173,
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
        },
      },
    },
  }
})
