import { createServer } from 'vite'
import { renderToString } from '@vue/server-renderer'
import { createSSRApp } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const vite = await createServer({ root, server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })

const { routes } = await vite.ssrLoadModule('/src/router/routes.js')
const { default: App } = await vite.ssrLoadModule('/src/App.vue')

for (const url of ['/', '/article/feipin', '/about', '/documents', '/tools/deck']) {
  const router = createRouter({ history: createMemoryHistory(), routes })
  await router.push(url)
  await router.isReady()
  const app = createSSRApp(App)
  app.use(router)
  let html = ''
  try {
    html = await renderToString(app)
  } catch (e) {
    console.log('URL', url, 'RENDER ERROR:', e.message)
    continue
  }
  console.log('URL', url, 'len=' + html.length)
  console.log('  hasArticleTitle: ' + html.includes('从0.5开始的废品小学习'))
  console.log('  hasArticleBody:  ' + html.includes('我是dRcLoD'))
  console.log('  hasArticleImg:   ' + html.includes('image/1/1.png'))
}

await vite.close()
