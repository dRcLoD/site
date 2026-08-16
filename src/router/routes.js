export const routes = [
  { path: '/', name: 'home', component: () => import('../views/HomeView.vue') },
  { path: '/about', name: 'about', component: () => import('../views/AboutView.vue') },
  { path: '/article/:id', name: 'article', component: () => import('../views/ArticleView.vue'), props: true },
  { path: '/documents', name: 'documents', component: () => import('../views/DocumentsView.vue') },
  { path: '/tools/deck', name: 'deck-tool', component: () => import('../views/DeckToolView.vue') },
  { path: '/index.html', redirect: '/' },
  { path: '/text/about.html', redirect: '/about' },
  { path: '/text/1.html', redirect: '/article/feipin' },
  { path: '/document/index.html', redirect: '/documents' },
  { path: '/tools/:pathMatch(.*).html', redirect: '/tools/deck' },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]
