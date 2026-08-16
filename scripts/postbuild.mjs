import { copyFileSync, existsSync } from 'node:fs'

const src = 'dist/index.html'
const dest = 'dist/404.html'

if (existsSync(src)) {
  copyFileSync(src, dest)
  console.log('已生成 dist/404.html（History 路由回退）')
} else {
  console.error('未找到 dist/index.html，跳过 404.html 生成')
  process.exit(1)
}
