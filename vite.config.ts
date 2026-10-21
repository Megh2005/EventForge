import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'
import { diskStoragePlugin } from './server/diskStoragePlugin.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    svelte(),
    diskStoragePlugin()
  ],
  server: {
    port: 5173,
    host: true
  }
})
