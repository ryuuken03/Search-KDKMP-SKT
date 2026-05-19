import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import fs from 'fs'
import path from 'path'

function serveRootAssets() {
  return {
    name: 'serve-root-assets',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith('/assets/')) return next()
        const filePath = path.join(process.cwd(), req.url.replace(/^\//, '').split('?')[0])
        if (!fs.existsSync(filePath)) return next()
        if (filePath.endsWith('.pdf')) res.setHeader('Content-Type', 'application/pdf')
        fs.createReadStream(filePath).pipe(res)
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), serveRootAssets()],
  publicDir: 'public',
  resolve: {
    alias: {
      '@assets': resolve(__dirname, 'assets'),
    },
  },
  server: {
    fs: { allow: ['.', 'assets'] },
  },
})
