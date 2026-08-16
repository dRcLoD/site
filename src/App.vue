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
  fetch('https://t.alcy.cc/json?pc=1')
    .then(res => res.json())
    .then(data => {
      if (data.code === 200 && data.data.link) {
        document.body.style.backgroundImage = `url(${data.data.link})`
      }
    })
    .catch(err => console.log('背景加载失败:', err))
})
</script>
