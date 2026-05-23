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
      const copyRecursive = (src, dest) => {
        const stats = fs.statSync(src)
        if (stats.isDirectory()) {
          if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true })
          }
          const files = fs.readdirSync(src)
          for (const file of files) {
            copyRecursive(path.join(src, file), path.join(dest, file))
          }
        } else {
          if (path.basename(src) === 'source.pdf') return // Lewatkan file PDF besar untuk menghindari batas ukuran file Vercel (50MB)
          fs.copyFileSync(src, dest)
        }
      }

      const srcDir = path.resolve(__dirname, 'assets')
      const destDir = path.resolve(__dirname, 'dist/assets')
      copyRecursive(srcDir, destDir)
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
