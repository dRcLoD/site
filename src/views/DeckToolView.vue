<template>
  <div class="deck-layout">
    <section class="deck-main">
      <div class="deck-main-header">
        <h1>游戏王卡组综合工具</h1>
        <p>卡组展示 / 随机抽卡 / 双卡组对决模拟 / 小世界现象计算</p>
      </div>

      <!-- 小世界现象计算器 -->
      <template v-if="mode === 'smallworld'">
        <div class="sw-panel">
          <div class="sw-tabs">
            <button :class="{ active: swTab === 'route' }" @click="swTab = 'route'">路线检索</button>
            <button :class="{ active: swTab === 'bridge' }" @click="swTab = 'bridge'">跳板查找</button>
          </div>

          <template v-if="swDeckMonsters.length">
            <div class="sw-slots">
              <template v-if="swTab === 'route'">
                <div class="sw-slot" :class="{ active: swPick === 'A', filled: swA }" @click="swPick = 'A'">
                  <div class="sw-slot-img">
                    <img v-if="swA && !picFailed['sw' + swA.id]" :src="picUrl(swA.id)" :alt="swA.name" @error="picFailed['sw' + swA.id] = true">
                    <span v-else class="sw-slot-placeholder">?</span>
                  </div>
                  <span class="sw-slot-label">手卡展示怪兽</span>
                  <button v-if="swA" class="sw-slot-clear" title="清除" @click.stop="clearSwSlot('A')">×</button>
                </div>
                <span class="sw-arrow">➜ 🌍 ➜</span>
                <div class="sw-slot" :class="{ active: swPick === 'C', filled: swC }" @click="swPick = 'C'">
                  <div class="sw-slot-img">
                    <img v-if="swC && !picFailed['sw' + swC.id]" :src="picUrl(swC.id)" :alt="swC.name" @error="picFailed['sw' + swC.id] = true">
                    <span v-else class="sw-slot-placeholder">?</span>
                  </div>
                  <span class="sw-slot-label">目标怪兽</span>
                  <button v-if="swC" class="sw-slot-clear" title="清除" @click.stop="clearSwSlot('C')">×</button>
                </div>
                <button class="sw-reset" @click="resetSwRoute">重置</button>
              </template>
              <template v-else>
                <div class="sw-slot" :class="{ active: swPick === 'S', filled: swSingle }" @click="swPick = 'S'">
                  <div class="sw-slot-img">
                    <img v-if="swSingle && !picFailed['sw' + swSingle.id]" :src="picUrl(swSingle.id)" :alt="swSingle.name" @error="picFailed['sw' + swSingle.id] = true">
                    <span v-else class="sw-slot-placeholder">?</span>
                  </div>
                  <span class="sw-slot-label">查询怪兽</span>
                  <button v-if="swSingle" class="sw-slot-clear" title="清除" @click.stop="clearSwSlot('S')">×</button>
                </div>
                <button class="sw-reset" @click="swSingle = null; swPick = 'S'">重置</button>
              </template>
            </div>

            <p class="sw-hint">
              <template v-if="swTab === 'route'">
                {{ swPick === 'A' ? '请点击下方卡图，选择【手卡展示怪兽】' : swPick === 'C' ? '请点击下方卡图，选择【目标怪兽】' : '已选完，下方展示跳板结果；点击卡图可重新选择手卡展示怪兽' }}
              </template>
              <template v-else>
                {{ swSingle ? '下方展示可与它互相连接的怪兽；点击卡图可更换查询怪兽' : '请点击下方卡图，选择要查跳板的怪兽' }}
              </template>
            </p>

            <div class="sw-legend">
              <span class="sw-legend-item"><i class="sw-legend-dot sw-legend-dot-blue"></i>蓝色框：已选中的卡（手卡展示怪兽 / 查询怪兽）</span>
              <span class="sw-legend-item"><i class="sw-legend-dot sw-legend-dot-orange"></i>橙色框：已选中的目标怪兽（仅路线检索）</span>
              <span class="sw-legend-item"><i class="sw-legend-dot sw-legend-dot-green"></i>绿色框：可作为跳板的候选卡</span>
              <span class="sw-legend-item"><i class="sw-legend-dot sw-legend-dot-plain"></i>黑色无框：普通卡</span>
            </div>

            <h3 class="sw-grid-title">牌组怪兽（{{ swDeckMonsters.length }} 种，点击选择）</h3>
            <div class="card-grid">
              <div
                v-for="m in swDeckMonsters"
                :key="m.id"
                class="card-cell"
                :class="{
                  'sw-sel-a': swA && swA.id === m.id,
                  'sw-sel-c': swC && swC.id === m.id,
                  'sw-sel-single': swSingle && swSingle.id === m.id,
                  'sw-candidate': isSwCandidate(m),
                }"
                :title="m.name"
                @click="onSwPick(m)"
              >
                <img v-if="!picFailed[m.id]" :src="picUrl(m.id)" :alt="m.name" loading="lazy" @error="picFailed[m.id] = true">
                <div v-else class="card-fallback">{{ m.name }}</div>
                <span v-if="m.count > 1" class="card-count">×{{ m.count }}</span>
              </div>
            </div>

            <template v-if="swSelectionDone && swDeckBridges">
              <h3 class="sw-result-title">
                {{ swTab === 'route' ? `跳板结果（牌组内 ${swDeckBridges.length} 张可从手卡怪兽检索到目标怪兽）` : `跳板结果（牌组内 ${swDeckBridges.length} 张可与查询怪兽连接）` }}
              </h3>
              <div v-if="swDeckBridges.length" class="card-grid sw-results">
                <div v-for="r in swDeckBridges" :key="r.card.id" class="sw-result-card" @click="openDetail(r.card)">
                  <div class="card-cell">
                    <img v-if="!picFailed[r.card.id]" :src="picUrl(r.card.id)" :alt="r.card.name" loading="lazy" @error="picFailed[r.card.id] = true">
                    <div v-else class="card-fallback">{{ r.card.name }}</div>
                  </div>
                  <div class="sw-badges">
                    <span class="sw-badge">{{ swTab === 'route' ? '与手卡：' : '' }}{{ fmtMatch(r.m1) }}</span>
                    <span v-if="r.m2" class="sw-badge sw-badge-2">与目标：{{ fmtMatch(r.m2) }}</span>
                  </div>
                </div>
              </div>

              <div v-else class="sw-db-section">
                <h3>数据库跳板（不在牌组内）</h3>
                <p v-if="swDbState === 'loading'" class="load-hint">⏳ 正在下载数据库（首次约2-3MB，之后本会话内复用）...</p>
                <p v-else-if="swDbState === 'error'" class="sw-error">数据库加载失败：{{ swDbError }}（仅影响数据库跳板，可继续使用其他功能）</p>
                <template v-else-if="swDbState === 'ready'">
                  <div class="sw-db-toolbar">
                    <input v-model="swDbFilter" type="text" class="tool-input sw-filter" placeholder="按卡名筛选...">
                    <span class="sw-note">共 {{ swDbFiltered.length }} 张{{ swDbFiltered.length > SW_DB_SHOW ? `，展示前 ${SW_DB_SHOW} 张` : '' }}</span>
                  </div>
                  <div v-if="swDbShown.length" class="card-grid sw-results">
                    <div v-for="r in swDbShown" :key="r.card.id" class="sw-result-card" @click="openDetail(r.card)">
                      <div class="card-cell">
                        <img v-if="!picFailed[r.card.id]" :src="picUrl(r.card.id)" :alt="r.card.name" loading="lazy" @error="picFailed[r.card.id] = true">
                        <div v-else class="card-fallback">{{ r.card.name }}</div>
                      </div>
                      <div class="sw-badges">
                        <span class="sw-badge">{{ swTab === 'route' ? '与手卡：' : '' }}{{ fmtMatch(r.m1) }}</span>
                        <span v-if="r.m2" class="sw-badge sw-badge-2">与目标：{{ fmtMatch(r.m2) }}</span>
                      </div>
                    </div>
                  </div>
                  <p v-else class="load-hint">没有符合条件的数据库跳板</p>
                </template>
              </div>
            </template>
          </template>

          <div v-else class="empty-tip">
            <span class="empty-icon">🌍</span>
            在右侧选择YDK文件后开始计算（自动忽略魔法/陷阱卡，仅使用主卡组怪兽）
          </div>
        </div>
      </template>

      <!-- 原有卡组展示 -->
      <template v-else>
        <template v-if="displayGroups.length">
          <div v-for="group in displayGroups" :key="group.key" class="deck-group">
            <h2 v-if="group.label" class="deck-group-title">{{ group.label }}</h2>
            <p v-if="group.deck.preload.done < group.deck.preload.total" class="load-hint">
              ⏳ 正在预载卡牌信息（{{ group.deck.preload.done }}/{{ group.deck.preload.total }}）...
            </p>
            <div v-for="(sec, i) in group.deck.sections" :key="i" class="deck-section">
              <h3 :class="sec.hCls">{{ sec.title }}</h3>
              <div class="card-grid">
                <div v-for="card in sec.cards" :key="card.id" class="card-cell" @click="openDetail(card)">
                  <img
                    v-if="!picFailed[card.id]"
                    :src="picUrl(card.id)"
                    :alt="nameOf(card.id)"
                    loading="lazy"
                    @error="picFailed[card.id] = true"
                  >
                  <div v-else class="card-fallback">{{ nameOf(card.id) }}</div>
                  <span v-if="card.count > 1" class="card-count">×{{ card.count }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>
        <div v-else class="empty-tip">
          <span class="empty-icon">🎴</span>
          在右侧选择YDK文件后，这里将展示卡组卡图，点击卡图可查看卡牌详情
        </div>
      </template>
    </section>

    <aside class="deck-side">
      <div class="tool-card">
        <h2>文件设置</h2>
        <div v-show="mode === 'single' || mode === 'smallworld'">
          <div class="tool-row">
            <span class="tool-label">选择YDK文件：</span>
            <input type="file" accept=".ydk" class="tool-file" @change="onSingleFile">
          </div>
          <p v-if="mode === 'smallworld'" class="tool-suffix sw-file-hint">小世界计算使用该卡组的主卡组怪兽，与「单卡组统计」模式通用</p>
        </div>
        <div v-show="mode === 'battle'">
          <div class="tool-row">
            <span class="tool-label">卡组A（YDK）：</span>
            <input type="file" accept=".ydk" class="tool-file" @change="onFileA">
          </div>
          <div class="tool-row">
            <span class="tool-label">卡组B（YDK）：</span>
            <input type="file" accept=".ydk" class="tool-file" @change="onFileB">
          </div>
        </div>
        <div v-show="mode !== 'smallworld'" class="tool-row">
          <span class="tool-label">CSV保存名称：</span>
          <input type="text" v-model="excelName" class="tool-input">
          <span class="tool-suffix">.csv</span>
        </div>
        <div v-show="mode === 'single'">
          <div class="tool-row">
            <span class="tool-label">抽取次数：</span>
            <input type="number" v-model.number="drawTimes" min="1" max="100" class="tool-input">
            <span class="tool-suffix">轮</span>
          </div>
          <div class="tool-row">
            <span class="tool-label">每次抽取张数：</span>
            <input type="number" v-model.number="drawCount" min="1" max="60" class="tool-input">
            <span class="tool-suffix">张/轮</span>
          </div>
        </div>
        <div v-show="mode === 'battle'">
          <div class="tool-row">
            <span class="tool-label">对决次数：</span>
            <input type="number" v-model.number="battleTimes" min="1" max="100" class="tool-input">
            <span class="tool-suffix">次（双方各抽5张+先攻额外1张）</span>
          </div>
        </div>
      </div>

      <div class="tool-card">
        <h2>功能模式</h2>
        <div class="tool-radio-group">
          <label><input type="radio" name="mode" value="single" v-model="mode">单卡组统计 + 随机抽卡</label>
          <label><input type="radio" name="mode" value="battle" v-model="mode">双卡组对决模拟</label>
          <label><input type="radio" name="mode" value="smallworld" v-model="mode">小世界现象计算器</label>
        </div>
        <template v-if="mode !== 'smallworld'">
          <h2 class="operate-title">操作</h2>
          <div>
            <button class="tool-btn" :disabled="isRunning" @click="start">开始执行</button>
            <button class="tool-btn tool-btn-stop" :disabled="!isRunning" @click="stop">停止</button>
          </div>
          <div class="progress-wrap">
            <div class="progress-bar" :style="{ width: progress + '%' }"></div>
          </div>
        </template>
      </div>
    </aside>
  </div>

  <div v-if="detail" class="detail-overlay" @click.self="closeDetail">
    <div class="detail-panel">
      <button class="detail-close" @click="closeDetail">×</button>
      <div class="detail-img-wrap">
        <img
          v-if="!picFailed['detail-' + detail.id]"
          :src="picUrl(detail.id, '')"
          :alt="nameOf(detail.id)"
          @error="picFailed['detail-' + detail.id] = true"
        >
        <div v-else class="card-fallback">{{ nameOf(detail.id) }}</div>
      </div>
      <div class="detail-info">
        <template v-if="detailInfo">
          <h2 class="detail-name">{{ detailInfo.text?.name || detail.id }}</h2>
          <p v-if="detailInfo.text?.jp_name" class="detail-alt">日文名：{{ detailInfo.text.jp_name }}</p>
          <p v-if="detailInfo.text?.en_name" class="detail-alt">英文名：{{ detailInfo.text.en_name }}</p>
          <p v-if="detailInfo.text?.types" class="detail-types">{{ detailInfo.text.types }}</p>
          <p v-if="detailInfo.text?.desc" class="detail-desc">{{ detailInfo.text.desc }}</p>
          <p v-if="detailInfo.text?.pdesc" class="detail-desc"><strong>灵摆效果：</strong>{{ detailInfo.text.pdesc }}</p>
        </template>
        <template v-else>
          <h2 class="detail-name">{{ detail.id }}</h2>
          <p class="load-hint">⏳ 正在获取卡牌信息...</p>
        </template>
        <p class="detail-code">卡密：{{ detail.id }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { SW_DB_SHOW, loadSwDb, swConnect, fmtMatch } from '../composables/smallWorld.js'

// 卡牌数据缓存：卡密 → ygocdb /api/v0/card 返回的完整 JSON（获取失败时缓存占位对象）
const CACHE = {}
// 卡图 CDN（ygocdb 提供的 YGOPro 卡图，按卡密直连，列表用 !half 缩略图）
const PIC_CDN = 'https://cdn.233.momobako.com/ygopro/pics/'

const mode = ref('single')
const excelName = ref('卡组综合结果')
const drawTimes = ref(1)
const drawCount = ref(5)
const battleTimes = ref(1)
const isRunning = ref(false)
const progress = ref(0)

let abortController = null
let parsedDeckSingle = null
let parsedDeckA = null
let parsedDeckB = null
let deckAFileName = null
let deckBFileName = null

const deckSingle = ref(null)
const deckA = ref(null)
const deckB = ref(null)

const picFailed = reactive({})
const detail = ref(null)
const detailInfo = ref(null)

// ===== 小世界计算器状态 =====
const swTab = ref('route') // 'route' | 'bridge'
const swPick = ref('A') // 下一次点击分配给谁：'A' | 'C' | 'S' | null
const swA = ref(null)
const swC = ref(null)
const swSingle = ref(null)
const swDbState = ref('idle') // idle | loading | ready | error
const swDbError = ref('')
const swDbMonsters = ref([])
const swDbFilter = ref('')

const displayGroups = computed(() => {
  if (mode.value === 'single') {
    return deckSingle.value ? [{ key: 'single', label: '', deck: deckSingle.value }] : []
  }
  const groups = []
  if (deckA.value) groups.push({ key: 'A', label: `卡组A · ${deckA.value.label}`, deck: deckA.value })
  if (deckB.value) groups.push({ key: 'B', label: `卡组B · ${deckB.value.label}`, deck: deckB.value })
  return groups
})

watch(detail, (val) => {
  document.body.style.overflow = val ? 'hidden' : ''
  if (val) window.addEventListener('keydown', onKeydown)
  else window.removeEventListener('keydown', onKeydown)
})

function onKeydown(e) {
  if (e.key === 'Escape') closeDetail()
}

function setRunning(running) {
  isRunning.value = running
  progress.value = running ? 10 : 0
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target.result)
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsText(file, 'utf-8')
  })
}

function parseYdkFile(text) {
  const main = []
  const extra = []
  const side = []
  let currentSection = null
  const lines = text.split('\n')
  for (const line of lines) {
    const cleanLine = line.trim()
    if (!cleanLine || (cleanLine.startsWith('#') && !['#main', '#extra'].includes(cleanLine))) {
      continue
    }
    if (cleanLine === '#main') { currentSection = 'main'; continue }
    if (cleanLine === '#extra') { currentSection = 'extra'; continue }
    if (cleanLine === '!side') { currentSection = 'side'; continue }
    if (/^\d+$/.test(cleanLine)) {
      if (currentSection === 'main') main.push(cleanLine)
      else if (currentSection === 'extra') extra.push(cleanLine)
      else if (currentSection === 'side') side.push(cleanLine)
    }
  }
  return { main, extra, side }
}

function countCards(cardList) {
  const counter = {}
  for (const code of cardList) counter[code] = (counter[code] || 0) + 1
  return counter
}

function getOrderedItems(counter, originalList) {
  const ordered = []
  const seen = new Set()
  for (const code of originalList) {
    if (!seen.has(code)) {
      ordered.push([code, counter[code]])
      seen.add(code)
    }
  }
  return ordered
}

function picUrl(id, suffix = '!half') {
  return `${PIC_CDN}${id}.jpg${suffix}`
}

function cardName(info) {
  return info?.text?.name || String(info?.id ?? '')
}

function nameOf(id) {
  return cardName(CACHE[id])
}

async function getCardInfo(cardCode) {
  if (CACHE[cardCode]) return CACHE[cardCode]
  abortController = new AbortController()
  try {
    const response = await fetch(`https://ygocdb.com/api/v0/card/${cardCode}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: abortController.signal,
    })
    if (!response.ok) throw new Error(`HTTP错误：${response.status}`)
    const cardData = await response.json()
    CACHE[cardCode] = cardData
    return cardData
  } catch (error) {
    if (error.name !== 'AbortError') {
      CACHE[cardCode] = { id: cardCode, text: { name: cardCode } }
    }
    return CACHE[cardCode] || { id: cardCode, text: { name: cardCode } }
  }
}

function buildSections(deckData) {
  const defs = [
    { title: '主卡组', cards: deckData.main, hCls: '' },
    { title: '额外卡组', cards: deckData.extra, hCls: 'extra-h' },
    { title: '副卡组', cards: deckData.side, hCls: 'side-h' },
  ]
  return defs.map(def => {
    const counter = countCards(def.cards)
    const ordered = getOrderedItems(counter, def.cards)
    return {
      title: `${def.title}（共${def.cards.length}张，${ordered.length}种）`,
      hCls: def.hCls,
      cards: ordered.map(([code, count]) => ({ id: code, count })),
    }
  })
}

function makeDeck(parsed, label) {
  const deck = reactive({
    label,
    sections: buildSections(parsed),
    // 小世界计算用：主卡组怪兽（含数量），数据在预载完成后可用
    mainCards: getOrderedItems(countCards(parsed.main), parsed.main).map(([code, count]) => ({ id: code, count })),
    preload: { done: 0, total: 0 },
  })
  prefetchDeck(parsed, deck.preload)
  return deck
}

async function prefetchDeck(deckData, preload) {
  const ids = [...new Set([...deckData.main, ...deckData.extra, ...deckData.side])]
  preload.total = ids.length
  for (const id of ids) {
    await getCardInfo(id)
    preload.done++
  }
}

async function openDetail(card) {
  detail.value = card
  detailInfo.value = CACHE[card.id] || null
  const info = await getCardInfo(card.id)
  if (detail.value && detail.value.id === card.id) detailInfo.value = info
}

function closeDetail() {
  detail.value = null
  detailInfo.value = null
}

// ===== 小世界计算器 =====
// 牌组内怪兽池（主卡组，去重，带数量）。
// 注意：必须读取响应式的 deckSingle / preload，否则 CACHE（普通对象）变化不会触发重算
const swDeckMonsters = computed(() => {
  const deck = deckSingle.value
  if (!deck) return []
  deck.preload.done // 预载进度变化时重算（每张卡的信息到达后逐个进入怪兽池）
  const out = []
  for (const { id, count } of deck.mainCards) {
    const info = CACHE[id]
    if (!info?.data || !(info.data.type & 1)) continue
    const d = info.data
    out.push({
      id,
      name: info.text?.name || id,
      count,
      race: d.race,
      attribute: d.attribute,
      level: d.level,
      atk: d.atk,
      def: d.def,
    })
  }
  return out
})

const swSelectionDone = computed(() => {
  if (swTab.value === 'bridge') return !!swSingle.value
  return !!(swA.value && swC.value)
})

const swDeckBridges = computed(() => {
  if (!swSelectionDone.value) return null
  if (swTab.value === 'bridge') {
    return swDeckMonsters.value
      .map(b => ({ card: b, m1: swConnect(swSingle.value, b) }))
      .filter(r => r.m1)
  }
  return swDeckMonsters.value
    .map(b => ({ card: b, m1: swConnect(swA.value, b), m2: swConnect(b, swC.value) }))
    .filter(r => r.m1 && r.m2)
})

// 牌组内没有跳板时才需要数据库
const swNeedDb = computed(() => !!swDeckBridges.value && swDeckBridges.value.length === 0)

watch(swNeedDb, (need) => {
  if (!need || swDbState.value !== 'idle') return
  swDbState.value = 'loading'
  loadSwDb().then((monsters) => {
    swDbMonsters.value = monsters
    swDbState.value = 'ready'
  }).catch((err) => {
    swDbError.value = err.message
    swDbState.value = 'error'
  })
})

const swDbBridgesAll = computed(() => {
  if (swDbState.value !== 'ready' || !swNeedDb.value) return []
  const deckIds = new Set(swDeckMonsters.value.map(m => m.id))
  const out = []
  for (const b of swDbMonsters.value) {
    if (deckIds.has(b.id)) continue
    if (swTab.value === 'bridge') {
      const m1 = swConnect(swSingle.value, b)
      if (m1) out.push({ card: b, m1 })
    } else {
      const m1 = swConnect(swA.value, b)
      const m2 = swConnect(b, swC.value)
      if (m1 && m2) out.push({ card: b, m1, m2 })
    }
  }
  return out
})

const swDbFiltered = computed(() => {
  const kw = swDbFilter.value.trim().toLowerCase()
  if (!kw) return swDbBridgesAll.value
  return swDbBridgesAll.value.filter(r => r.card.name.toLowerCase().includes(kw))
})

const swDbShown = computed(() => swDbFiltered.value.slice(0, SW_DB_SHOW))

function onSwPick(m) {
  if (swTab.value === 'bridge') {
    swSingle.value = m
    swPick.value = 'S'
    return
  }
  if (swPick.value === 'A') {
    swA.value = m
    swPick.value = swC.value ? null : 'C'
    return
  }
  if (swPick.value === 'C') {
    swC.value = m
    swPick.value = null
    return
  }
  swA.value = m
  swC.value = null
  swPick.value = 'C'
}

function clearSwSlot(slot) {
  if (slot === 'A') { swA.value = null; swPick.value = 'A' }
  else if (slot === 'C') { swC.value = null; swPick.value = 'C' }
  else { swSingle.value = null; swPick.value = 'S' }
}

function resetSwRoute() {
  swA.value = null
  swC.value = null
  swPick.value = 'A'
  swDbFilter.value = ''
}

// 牌组网格中可作为跳板的卡（绿色细框提示）
function isSwCandidate(m) {
  if (swTab.value === 'bridge') {
    return !!swSingle.value && !!swConnect(swSingle.value, m)
  }
  if (!swA.value || !swC.value) return false
  return !!swConnect(swA.value, m) && !!swConnect(m, swC.value)
}

function onSingleFile(e) {
  const file = e.target.files[0]
  if (!file) return
  deckSingle.value = null
  readFileAsText(file).then(text => {
    parsedDeckSingle = parseYdkFile(text)
    deckSingle.value = makeDeck(parsedDeckSingle, file.name)
  }).catch(err => alert(`解析失败：${err.message}`))
}

function onFileA(e) {
  const file = e.target.files[0]
  if (!file) return
  deckA.value = null
  deckAFileName = file.name
  readFileAsText(file).then(text => {
    parsedDeckA = parseYdkFile(text)
    deckA.value = makeDeck(parsedDeckA, file.name)
  }).catch(err => alert(`卡组A解析失败：${err.message}`))
}

function onFileB(e) {
  const file = e.target.files[0]
  if (!file) return
  deckB.value = null
  deckBFileName = file.name
  readFileAsText(file).then(text => {
    parsedDeckB = parseYdkFile(text)
    deckB.value = makeDeck(parsedDeckB, file.name)
  }).catch(err => alert(`卡组B解析失败：${err.message}`))
}

async function start() {
  if (mode.value === 'single') await runSingleMode()
  else await runBattleMode()
}

function stop() {
  isRunning.value = false
  if (abortController) abortController.abort()
  progress.value = 0
}

async function runSingleMode() {
  if (!parsedDeckSingle) { alert('请先选择有效的YDK文件！'); return }
  if (parsedDeckSingle.main.length === 0) { alert('主卡组为空，无法抽卡！'); return }
  const dTimes = parseInt(drawTimes.value)
  const dCount = parseInt(drawCount.value)
  if (isNaN(dTimes) || dTimes < 1 || dTimes > 100) { alert('请输入有效的抽取次数（1-100）！'); return }
  if (isNaN(dCount) || dCount < 1 || dCount > 60) { alert('请输入有效的每次抽取张数（1-60）！'); return }
  if (dCount > parsedDeckSingle.main.length) { alert(`每次抽取张数不能超过主卡组数量（${parsedDeckSingle.main.length}张）！`); return }
  setRunning(true)
  try {
    const { main, extra, side } = parsedDeckSingle
    const mainOrdered = getOrderedItems(countCards(main), main)
    const extraOrdered = getOrderedItems(countCards(extra), extra)
    const sideOrdered = getOrderedItems(countCards(side), side)
    const mainWithNames = await getCardsWithNames(mainOrdered)
    const extraWithNames = await getCardsWithNames(extraOrdered)
    const sideWithNames = await getCardsWithNames(sideOrdered)
    if (!isRunning.value) return
    progress.value = 40
    const drawResults = await randomDrawCards(main, dTimes, dCount)
    if (!isRunning.value) return
    progress.value = 90
    generateSingleCSV(mainWithNames, extraWithNames, sideWithNames, drawResults, dCount)
    alert(`完成！\n文件已下载：${excelName.value}.csv`)
  } catch (error) {
    alert(`失败：${error.message}`)
  } finally {
    setRunning(false)
  }
}

async function getCardsWithNames(cardList) {
  const result = []
  for (const [code, count] of cardList) {
    if (!isRunning.value) break
    const info = await getCardInfo(code)
    result.push([cardName(info), count])
  }
  return result
}

async function randomDrawCards(mainDeckCodes, dTimes, dCount) {
  const results = []
  const deck = [...mainDeckCodes]
  for (let i = 1; i <= dTimes; i++) {
    if (!isRunning.value) break
    const shuffled = [...deck].sort(() => Math.random() - 0.5)
    const drawnCodes = shuffled.slice(0, dCount)
    const drawnNames = []
    for (const code of drawnCodes) {
      const info = await getCardInfo(code)
      drawnNames.push(cardName(info))
    }
    results.push([i, ...drawnNames])
    progress.value = 40 + (i / dTimes) * 50
  }
  return results
}

function generateSingleCSV(main, extra, side, drawResults, dCount) {
  const data = []
  const header = ['主卡组-卡名', '主卡组-数量', '额外卡组-卡名', '额外卡组-数量', '副卡组-卡名', '副卡组-数量', '抽卡序号']
  for (let j = 1; j <= dCount; j++) header.push(`第${j}张`)
  data.push(header)
  const maxRows = Math.max(main.length, extra.length, side.length, drawResults.length)
  for (let i = 0; i < maxRows; i++) {
    const row = []
    row.push(main[i] ? main[i][0] : '')
    row.push(main[i] ? main[i][1] : '')
    row.push(extra[i] ? extra[i][0] : '')
    row.push(extra[i] ? extra[i][1] : '')
    row.push(side[i] ? side[i][0] : '')
    row.push(side[i] ? side[i][1] : '')
    if (drawResults[i]) {
      row.push(drawResults[i][0])
      for (let j = 1; j <= dCount; j++) {
        row.push(drawResults[i][j] || '')
      }
    } else {
      row.push('')
    }
    data.push(row)
  }
  downloadCSV(data, `${excelName.value.trim() || '卡组综合结果'}.csv`)
}

async function runBattleMode() {
  if (!parsedDeckA || !parsedDeckB) { alert('请选择两个YDK卡组文件！'); return }
  if (parsedDeckA.main.length === 0 || parsedDeckB.main.length === 0) { alert('主卡组为空，无法对决！'); return }
  const bTimes = parseInt(battleTimes.value)
  if (isNaN(bTimes) || bTimes < 1 || bTimes > 100) { alert('请输入有效的对决次数（1-100）！'); return }
  setRunning(true)
  try {
    const battleResults = []
    for (let i = 1; i <= bTimes; i++) {
      if (!isRunning.value) break
      const result = await simulateBattle(i, parsedDeckA.main, parsedDeckB.main)
      battleResults.push(result)
      progress.value = 30 + (i / bTimes) * 60
    }
    if (!isRunning.value) return
    progress.value = 95
    generateBattleCSV(battleResults)
    alert(`完成！共${battleResults.length}次对决\n文件已下载：${excelName.value}.csv`)
  } catch (error) {
    alert(`失败：${error.message}`)
  } finally {
    setRunning(false)
  }
}

async function drawCards(deck, count) {
  const shuffled = [...deck].sort(() => Math.random() - 0.5)
  const drawnCodes = shuffled.slice(0, count)
  const drawnNames = []
  for (const code of drawnCodes) {
    const info = await getCardInfo(code)
    drawnNames.push(cardName(info))
  }
  return drawnNames
}

async function simulateBattle(battleNum, deckA_, deckB_) {
  const firstAttackerIsA = Math.random() > 0.5
  const firstAttacker = firstAttackerIsA ? '卡组A' : '卡组B'
  const secondAttacker = firstAttackerIsA ? '卡组B' : '卡组A'
  const firstDraw5 = await drawCards(firstAttackerIsA ? deckA_ : deckB_, 5)
  const secondDraw5 = await drawCards(firstAttackerIsA ? deckB_ : deckA_, 5)
  const firstDraw1 = await drawCards(firstAttackerIsA ? deckA_ : deckB_, 1)
  return {
    battleNum,
    firstAttacker: firstAttackerIsA ? 'A' : 'B',
    deckA: {
      draw5: firstAttackerIsA ? firstDraw5 : secondDraw5,
      draw1: firstAttackerIsA ? firstDraw1[0] : '',
    },
    deckB: {
      draw5: firstAttackerIsA ? secondDraw5 : firstDraw5,
      draw1: firstAttackerIsA ? '' : firstDraw1[0],
    },
  }
}

function generateBattleCSV(battleResults) {
  const data = [
    ['对决次数', '先攻方', '卡组A-初始5张', '卡组A-额外1张', '卡组B-初始5张', '卡组B-额外1张'],
    ['', '', '(卡1|卡2|卡3|卡4|卡5)', '(单独抽卡)', '(卡1|卡2|卡3|卡4|卡5)', '(单独抽卡)'],
  ]
  battleResults.forEach(result => {
    data.push([
      result.battleNum,
      result.firstAttacker,
      result.deckA.draw5.join(' | '),
      result.deckA.draw1 || '-',
      result.deckB.draw5.join(' | '),
      result.deckB.draw1 || '-',
    ])
  })
  downloadCSV(data, `${excelName.value.trim() || '卡组综合结果'}.csv`)
}

function downloadCSV(data, filename) {
  const csv = data.map(row =>
    row.map(cell => {
      const s = String(cell == null ? '' : cell)
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return '"' + s.replace(/"/g, '""') + '"'
      }
      return s
    }).join(',')
  ).join('\n')
  const bom = '\uFEFF'
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.deck-layout {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

/* 中间：卡组卡图展示区 */
.deck-main {
  flex: 1;
  min-width: 0;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  padding: 25px 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.deck-main-header {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.deck-main-header h1 {
  font-size: 26px;
  color: #1a1a1a;
  margin-bottom: 8px;
}

.deck-main-header p {
  color: #8590a6;
  font-size: 14px;
}

/* 右栏：与左侧边栏一致，固定不动 */
.deck-side {
  width: 320px;
  flex-shrink: 0;
  position: sticky;
  top: 40px;
}

.deck-group { margin-bottom: 25px; }
.deck-group:last-child { margin-bottom: 0; }

.deck-group-title {
  font-size: 20px;
  color: #1a1a1a;
  margin-bottom: 14px;
  padding-left: 12px;
  border-left: 4px solid #667eea;
}

.deck-section { margin-bottom: 18px; }
.deck-section:last-child { margin-bottom: 0; }

.deck-section h3 {
  font-size: 15px;
  color: #1a1a1a;
  margin-bottom: 10px;
  padding-left: 10px;
  border-left: 3px solid #667eea;
}

.deck-section h3.extra-h { border-left-color: #a855f7; }
.deck-section h3.side-h { border-left-color: #f59e0b; }

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
  gap: 12px;
}

.card-cell {
  position: relative;
  aspect-ratio: 59 / 86;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  background: #2b2b3a;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card-cell:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.45);
}

.card-cell img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.card-count {
  position: absolute;
  top: 5px;
  right: 5px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  font-size: 12px;
  line-height: 1.6;
  padding: 1px 8px;
  border-radius: 10px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
}

.card-fallback {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 8px;
  font-size: 12px;
  color: #cfd3ff;
  border: 1px dashed #667eea;
  border-radius: 8px;
  background: rgba(102, 126, 234, 0.08);
  word-break: break-all;
}

.load-hint {
  color: #8590a6;
  font-size: 13px;
  margin-bottom: 12px;
}

.empty-tip {
  text-align: center;
  padding: 60px 20px;
  color: #8590a6;
  font-size: 14px;
}

.empty-tip .empty-icon {
  font-size: 44px;
  display: block;
  margin-bottom: 10px;
  opacity: 0.6;
}

/* ===== 小世界现象计算器 ===== */
.sw-panel { min-height: 200px; }

.sw-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 18px;
}

.sw-tabs button {
  border: 1px solid #e0e0e0;
  background: #fff;
  color: #4b5563;
  padding: 8px 22px;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.sw-tabs button:hover { border-color: #667eea; }

.sw-tabs button.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-color: transparent;
}

.sw-slots {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.sw-slot {
  position: relative;
  width: 92px;
  text-align: center;
  cursor: pointer;
}

.sw-slot-img {
  width: 68px;
  height: 98px;
  margin: 0 auto;
  border-radius: 8px;
  border: 2px dashed #c9cfeb;
  background: rgba(102, 126, 234, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: all 0.2s ease;
}

.sw-slot img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sw-slot-placeholder {
  font-size: 26px;
  color: #a0a6d0;
}

.sw-slot:hover .sw-slot-img { border-color: #667eea; }

.sw-slot.active .sw-slot-img {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.3);
}

.sw-slot.filled .sw-slot-img {
  border-style: solid;
  border-color: #667eea;
}

.sw-slot-label {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: #4b5563;
}

.sw-slot-clear {
  position: absolute;
  top: -6px;
  right: 6px;
  width: 18px;
  height: 18px;
  border: none;
  border-radius: 50%;
  background: #f5576c;
  color: #fff;
  font-size: 12px;
  line-height: 18px;
  padding: 0;
  cursor: pointer;
}

.sw-arrow {
  color: #667eea;
  font-size: 18px;
  font-weight: bold;
}

.sw-reset {
  align-self: center;
  border: 1px solid #e0e0e0;
  background: #fff;
  color: #8590a6;
  padding: 6px 16px;
  border-radius: 16px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.sw-reset:hover {
  border-color: #f5576c;
  color: #f5576c;
}

.sw-hint {
  color: #8590a6;
  font-size: 13px;
  margin-bottom: 16px;
}

/* 三种框的图例说明 */
.sw-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  padding: 8px 12px;
  margin-bottom: 14px;
  background: rgba(102, 126, 234, 0.06);
  border-radius: 8px;
  font-size: 12px;
  color: #4b5563;
}

.sw-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.sw-legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  display: inline-block;
  flex-shrink: 0;
}

.sw-legend-dot-blue { background: #667eea; }
.sw-legend-dot-orange { background: #f59e0b; }
.sw-legend-dot-green { background: #22c55e; }
.sw-legend-dot-plain { background: #2b2b3a; }

.sw-grid-title,
.sw-result-title {
  font-size: 15px;
  color: #1a1a1a;
  margin-bottom: 10px;
  padding-left: 10px;
  border-left: 3px solid #667eea;
}

.sw-result-title { margin-top: 22px; }

/* 选中态描边：A 紫 / C 橙 / 查询单卡 紫 / 可连接 绿 */
.card-cell.sw-sel-a,
.card-cell.sw-sel-single {
  outline: 3px solid #667eea;
  outline-offset: -3px;
}

.card-cell.sw-sel-c {
  outline: 3px solid #f59e0b;
  outline-offset: -3px;
}

.card-cell.sw-candidate {
  outline: 3px solid #22c55e;
  outline-offset: -3px;
}

/* 跳板结果卡：卡图 + 徽章 */
.sw-result-card {
  cursor: pointer;
}

.sw-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}

.sw-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%);
  border: 1px solid rgba(102, 126, 234, 0.35);
  color: #4a4a8a;
}

.sw-badge-2 {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(239, 68, 68, 0.15) 100%);
  border-color: rgba(245, 158, 11, 0.4);
  color: #9a3412;
}

/* 数据库跳板分区 */
.sw-db-section {
  margin-top: 14px;
  padding: 16px;
  border: 1px dashed #c9cfeb;
  border-radius: 8px;
  background: rgba(102, 126, 234, 0.04);
}

.sw-db-section h3 {
  font-size: 15px;
  color: #1a1a1a;
  margin-bottom: 12px;
  padding-left: 10px;
  border-left: 3px solid #a855f7;
}

.sw-db-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.sw-filter {
  max-width: 220px;
  flex: none;
}

.sw-note {
  font-size: 12px;
  color: #8590a6;
}

.sw-error {
  color: #d9534f;
  font-size: 13px;
}

.sw-file-hint {
  display: block;
  margin-top: 8px;
}

/* 右栏卡片 */
.tool-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  padding: 24px 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  margin-bottom: 20px;
}

.tool-card:last-child { margin-bottom: 0; }

.tool-card h2 {
  font-size: 18px;
  color: #1a1a1a;
  margin-bottom: 16px;
  padding-left: 12px;
  border-left: 4px solid #667eea;
  display: flex;
  align-items: center;
}

.tool-card h2.operate-title { margin-top: 22px; }

.tool-row {
  display: flex;
  align-items: center;
  margin-bottom: 14px;
}

.tool-row:last-child { margin-bottom: 0; }

.tool-label {
  width: 118px;
  color: #4b5563;
  font-size: 13px;
  margin-right: 8px;
  flex-shrink: 0;
}

.tool-input, .tool-file {
  flex: 1;
  min-width: 0;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 13px;
  outline: none;
  background: #fff;
  transition: all 0.3s ease;
}

.tool-input:focus, .tool-file:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
}

.tool-suffix {
  margin-left: 8px;
  color: #8590a6;
  font-size: 12px;
}

.tool-radio-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tool-radio-group label {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 13px;
  color: #333;
  padding: 8px 14px;
  border-radius: 20px;
  border: 1px solid #e0e0e0;
  background: #fff;
  transition: all 0.3s ease;
}

.tool-radio-group label:hover {
  border-color: #667eea;
  box-shadow: 0 2px 10px rgba(102, 126, 234, 0.2);
}

.tool-radio-group input { margin-right: 8px; }

.tool-radio-group label:has(input:checked) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  border-color: transparent;
}

.tool-btn {
  width: auto;
  height: auto;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 20px;
  font-size: 14px;
  line-height: 1.5;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-right: 12px;
}

.tool-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
}

.tool-btn:disabled {
  background: #c0c0c0;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.tool-btn-stop {
  background: linear-gradient(135deg, #f5576c 0%, #f093fb 100%);
}

.tool-btn-stop:hover {
  box-shadow: 0 4px 15px rgba(245, 87, 108, 0.4);
}

.progress-wrap {
  height: 12px;
  background: #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  margin-top: 18px;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  width: 0;
  transition: width 0.3s ease;
  border-radius: 8px;
}

/* 卡牌详情弹窗 */
.detail-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 10, 25, 0.72);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.detail-panel {
  position: relative;
  background: #fff;
  border-radius: 12px;
  padding: 22px;
  display: flex;
  gap: 22px;
  max-width: 720px;
  width: 100%;
  max-height: 88vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
}

.detail-close {
  position: absolute;
  top: 10px;
  right: 12px;
  border: none;
  background: none;
  font-size: 26px;
  line-height: 1;
  color: #8590a6;
  cursor: pointer;
  transition: color 0.2s ease;
}

.detail-close:hover { color: #f5576c; }

.detail-img-wrap {
  width: 240px;
  flex-shrink: 0;
}

.detail-img-wrap img {
  width: 100%;
  border-radius: 10px;
  display: block;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
}

.detail-img-wrap .card-fallback { aspect-ratio: 59 / 86; }

.detail-info {
  flex: 1;
  min-width: 0;
}

.detail-name {
  font-size: 22px;
  color: #1a1a1a;
  margin-bottom: 10px;
  padding-right: 24px;
}

.detail-alt {
  font-size: 13px;
  color: #8590a6;
  margin-bottom: 4px;
}

.detail-types {
  font-size: 14px;
  color: #4a4a8a;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 6px;
  padding: 8px 10px;
  margin: 10px 0;
  white-space: pre-line;
}

.detail-desc {
  font-size: 14px;
  color: #444;
  line-height: 1.9;
  white-space: pre-wrap;
}

.detail-code {
  margin-top: 12px;
  font-size: 12px;
  color: #a0a6bf;
}

@media (max-width: 960px) {
  .deck-layout { flex-direction: column; }
  .deck-side {
    width: 100%;
    position: static;
  }
}

@media (max-width: 560px) {
  .detail-panel {
    flex-direction: column;
    align-items: center;
  }
  .detail-img-wrap { width: 200px; }
  .detail-info { width: 100%; }
  .tool-row { flex-direction: column; align-items: flex-start; }
  .tool-label { width: auto; margin-bottom: 6px; margin-right: 0; }
}
</style>
