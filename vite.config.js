import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import cesium from 'vite-plugin-cesium';

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), cesium()],
  define: {
    'process.env.API_URL': JSON.stringify('http://0.0.0.0:8080')
  }
})
