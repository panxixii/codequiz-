import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages 项目页部署在 https://panxixii.github.io/codequiz-/ 子路径下
export default defineConfig({
  base: '/codequiz-/',
  plugins: [react(), tailwindcss()],
})
