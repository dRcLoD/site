<template>
  <aside class="sidebar">
    <div class="user-card">
      <img class="avatar" :src="base + 'image/touxiang.jpg'" alt="头像">
      <h1 class="username">dRcLoD</h1>
      <p class="signature">是否需要写下什么证明这里存在过什么</p>
      <nav class="nav-buttons">
        <router-link to="/" class="nav-btn">首页</router-link>
        <router-link to="/about" class="nav-btn">关于</router-link>
        <router-link to="/documents" class="nav-btn">资料下载</router-link>
        <a href="https://space.bilibili.com/293534745" class="nav-btn">B站首页</a>
      </nav>
      <div class="visitor-counter">
        <span>👁 访客数: </span>
        <span v-if="mode === 'busuanzi'" id="busuanzi_value_site_uv">--</span>
        <span v-else>{{ visitorCount }}</span>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const base = import.meta.env.BASE_URL
const route = useRoute()
const visitorCount = ref('--')

const mode = computed(() => {
  if (route.path === '/' || route.path.startsWith('/tools/')) return 'busuanzi'
  return 'counterapi'
})

function loadBusuanzi() {
  if (typeof document === 'undefined' || document.getElementById('busuanzi-script')) return
  const s = document.createElement('script')
  s.id = 'busuanzi-script'
  s.src = '//busuanzi.ibruce.info/busuanzi/2.3/busuanzi.pure.mini.js'
  s.async = true
  document.head.appendChild(s)
}

async function loadCounter() {
  try {
    const res = await fetch('https://api.counterapi.dev/v1/dRcLoD/site/count')
    const data = await res.json()
    visitorCount.value = data.count
  } catch (err) {
    console.log('访客数加载失败:', err)
  }
}

watch(mode, (m) => {
  if (m === 'busuanzi') loadBusuanzi()
  else loadCounter()
}, { immediate: true })
</script>
