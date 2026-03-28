import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Use '/car-rent-manager/' for GitHub Pages, '/' for Vercel
  base: process.env.GITHUB_ACTIONS ? '/car-rent-manager/' : '/'
})
