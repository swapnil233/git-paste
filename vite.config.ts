import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        content: resolve(__dirname, 'src/contentScript.tsx'),
      },
      output: {
        entryFileNames: 'assets/[name].js',
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
})
