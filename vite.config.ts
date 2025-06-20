import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  logLevel: 'info',
  plugins: [
    tailwindcss(),
  ],
})