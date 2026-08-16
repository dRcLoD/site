<template>
  <div class="file-explorer" :class="{ 'grid-mode': view === 'grid' }">
    <div class="explorer-toolbar">
      <button class="tool-btn" title="返回首页" @click="$router.push('/')">🏠</button>
      <button class="tool-btn" title="刷新" @click="load">🔄</button>
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input type="text" v-model="keyword" placeholder="搜索文档...">
      </div>
      <div class="view-toggle">
        <button class="tool-btn" :class="{ active: view === 'list' }" @click="view = 'list'" title="列表视图">☰</button>
        <button class="tool-btn" :class="{ active: view === 'grid' }" @click="view = 'grid'" title="网格视图">▦</button>
      </div>
    </div>

    <div class="breadcrumb-bar">
      <span class="crumb" @click="$router.push('/')">📁 我的网盘</span>
      <span class="crumb-sep">›</span>
      <span class="crumb current">📄 文档</span>
    </div>

    <div v-if="loading" class="empty-tip">
      <span class="empty-icon">⏳</span>正在加载文件列表...
    </div>
    <div v-else-if="error" class="empty-tip">
      <span class="empty-icon">⚠️</span>加载失败：{{ error }}
    </div>
    <template v-else>
      <div class="file-table-wrap">
        <table class="file-table">
          <thead>
            <tr>
              <th v-for="col in columns" :key="col.key" :class="{ sorted: sort.key === col.key }" @click="sortBy(col.key)">
                {{ col.label }} <span class="sort-arrow">{{ sort.key === col.key ? (sort.dir === 'asc' ? '▲' : '▼') : '' }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filtered.length === 0">
              <td colspan="3"><div class="empty-tip"><span class="empty-icon">📭</span>没有找到相关文档</div></td>
            </tr>
            <tr v-for="f in filtered" :key="f.path" @click="openFile(f)">
              <td><span class="name-cell"><span class="file-icon">{{ f.icon }}</span>{{ f.name }}</span></td>
              <td class="type-cell">{{ f.type }}</td>
              <td class="size-cell">{{ formatSize(f.size) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="grid-view">
        <div v-for="f in filtered" :key="f.path" class="grid-item" @click="openFile(f)">
          <span class="grid-icon">{{ f.icon }}</span>
          <div class="grid-name">{{ f.name }}</div>
          <div class="grid-size">{{ formatSize(f.size) }}</div>
        </div>
        <div v-if="filtered.length === 0" class="empty-tip">
          <span class="empty-icon">📭</span>没有找到相关文档
        </div>
      </div>
    </template>

    <div class="explorer-status">
      <span><span class="status-count">{{ filtered.length }}</span> 个项目</span>
      <span v-if="files.length">{{ files.length }} 个文件 · 总大小 {{ formatSize(totalSize) }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useDocumentList } from '../composables/useDocumentList.js'

const { files, loading, error, load } = useDocumentList()

const columns = [
  { key: 'name', label: '名称' },
  { key: 'type', label: '类型' },
  { key: 'size', label: '大小' },
]
const keyword = ref('')
const view = ref('list')
const sort = ref({ key: 'name', dir: 'asc' })

const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  let list = files.value.filter(f => !kw || f.name.toLowerCase().includes(kw))
  list = [...list].sort((a, b) => {
    let av, bv
    if (sort.value.key === 'size') {
      av = a.size
      bv = b.size
    } else {
      av = String(a[sort.value.key]).toLowerCase()
      bv = String(b[sort.value.key]).toLowerCase()
    }
    const r = av < bv ? -1 : av > bv ? 1 : 0
    return sort.value.dir === 'asc' ? r : -r
  })
  return list
})

const totalSize = computed(() => files.value.reduce((s, f) => s + f.size, 0))

function formatSize(bytes) {
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + ' GB'
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + ' MB'
  if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return bytes + ' B'
}

function sortBy(key) {
  if (sort.value.key === key) {
    sort.value.dir = sort.value.dir === 'asc' ? 'desc' : 'asc'
  } else {
    sort.value.key = key
    sort.value.dir = 'asc'
  }
}

function openFile(f) {
  window.open(f.url, '_blank')
}

onMounted(load)
</script>
