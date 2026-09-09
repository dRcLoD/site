<template>
  <div class="container">
    <Sidebar />
    <main class="main-content">
      <router-view />
      <div class="footer">
        <p>© 2026 dRcLoD | 用文字记录生活</p>
      </div>
    </main>
  </div>
  <MusicPlayer />
</template>

<script setup>
import { onMounted } from 'vue'
import Sidebar from './components/Sidebar.vue'
import MusicPlayer from './components/MusicPlayer.vue'

onMounted(() => {
  // /json 接口无 CORS 头，fetch 会被浏览器拦截；直接加载图片端点绕过 CORS
  const img = new Image()
  img.onload = () => {
    document.body.style.backgroundImage = `url(${img.currentSrc})`
  }
  img.onerror = () => console.log('背景加载失败:', img.src)
  img.src = 'https://t.alcy.cc/moe'
})
</script>
