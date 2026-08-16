<template>
  <div class="music-player">
    <div class="music-toggle" @click="open = !open">🎵</div>
    <div class="music-panel" :class="{ active: open }">
      <iframe
        frameborder="no"
        border="0"
        marginwidth="0"
        marginheight="0"
        width="330"
        height="450"
        src="https://music.163.com/outchain/player?type=0&id=4970305981&auto=0&height=430"
      ></iframe>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const open = ref(false)
</script>
