<template>
  <div>
    <div class="page-title">
      <h1>dRcLoD的博客</h1>
      <div class="page-title-bottom">
        <p>发布一些东西的小站</p>
        <a href="https://github.com/dRcLoD/site" class="nav-btn">本站github仓库</a>
      </div>
    </div>

    <div class="content-cards">
      <a :href="base + 'image/QCU 游戏王狱友交流群群聊二维码.png'" class="card featured-card">
        <h3>置顶推荐</h3>
        <p class="content-cards-word">青岛城市学院游戏王群</p>
        <div class="card-meta">
          <span class="card-tag">置顶</span>
          <span>2026-08-13</span>
        </div>
      </a>

      <router-link v-for="a in articles" :key="a.id" :to="'/article/' + a.id" class="card">
        <h3>{{ a.title }}</h3>
        <p>{{ a.summary }}</p>
        <div class="card-meta">
          <span class="card-tag">{{ a.tag }}</span>
          <span>{{ a.date }}</span>
        </div>
      </router-link>

      <router-link to="/tools/deck" class="card">
        <h3>游戏王卡组综合工具</h3>
        <p>卡组展示 / 随机抽卡 / 双卡组对决模拟</p>
        <div class="card-meta">
          <span class="card-tag">工具</span>
          <span>2026-08-05</span>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { articles } from '../articles/index.js'

const base = import.meta.env.BASE_URL
</script>
