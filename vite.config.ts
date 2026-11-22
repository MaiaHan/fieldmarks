import { writeFile } from 'node:fs/promises'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Lets the #/annotate screen save region boxes back to the photo manifest (dev only).
function savePhotos(): Plugin {
  return {
    name: 'fieldmarks-save-photos',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__fieldmarks/photos', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end()
          return
        }
        let body = ''
        req.on('data', (chunk) => (body += chunk))
        req.on('end', async () => {
          try {
            JSON.parse(body)
            await writeFile(new URL('./src/data/photos.json', import.meta.url), body)
            res.end('ok')
          } catch (err) {
            res.statusCode = 400
            res.end(String(err))
          }
        })
      })
    },
  }
}

export default defineConfig({
  base: './',
  plugins: [react(), savePhotos()],
})
