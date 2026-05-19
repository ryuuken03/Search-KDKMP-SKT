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

function copyAssetsPlugin() {
  return {
    name: 'copy-assets-plugin',
    closeBundle() {
      const srcDir = path.resolve(__dirname, 'assets')
      const destDir = path.resolve(__dirname, 'dist/assets')
      if (fs.existsSync(srcDir)) {
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true })
        }
        const files = fs.readdirSync(srcDir)
        for (const file of files) {
          const srcFile = path.join(srcDir, file)
          const destFile = path.join(destDir, file)
          fs.copyFileSync(srcFile, destFile)
        }
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), serveRootAssets(), copyAssetsPlugin()],
  publicDir: 'public',
  resolve: {
    alias: {
      '@assets': resolve(__dirname, 'assets'),
    },
  },
  server: {
    fs: { allow: ['.', 'assets'] },
  },
  build: {
    chunkSizeWarningLimit: 1600,
  },
})
