import build from '@hono/vite-build/cloudflare-pages'
import devServer from '@hono/vite-dev-server'
import adapter from '@hono/vite-dev-server/cloudflare'
import { defineConfig } from 'vite'

export default defineConfig({  

  root: ".",          // ⭐ 프로젝트 루트를 기준으로
  build: {
    outDir: "dist",   // 결과물은 dist
    emptyOutDir: true
  },
});
  // plugins: [
  //   build(),
  //   devServer({
  //     adapter,
  //     entry: 'src/index.tsx'
  //   })
  // ]
  //})
