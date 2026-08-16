<template>
  <div v-if="article">
    <div class="article-header">
      <router-link to="/" class="back-btn">← 返回首页</router-link>
      <span class="article-tag">{{ article.tag }}</span>
      <h1 class="article-title">{{ article.title }}</h1>
      <div class="article-meta">
        <span class="article-date">{{ article.date }}</span>
        <span class="article-author">{{ article.author }}</span>
      </div>
    </div>
    <article class="article-content">
      <component :is="article.component" />
    </article>
  </div>
  <div v-else class="article-content">
    <p>文章不存在，<router-link to="/" class="back-btn">返回首页</router-link></p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { getArticle } from '../articles/index.js'

const route = useRoute()
const article = computed(() => getArticle(route.params.id))
</script>
