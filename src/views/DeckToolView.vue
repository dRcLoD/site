<template>
  <div>
    <div class="page-title">
      <h1>游戏王卡组综合工具</h1>
      <p>卡组展示 / 随机抽卡 / 双卡组对决模拟</p>
    </div>

    <div class="tool-card">
      <h2>功能模式</h2>
      <div class="tool-radio-group">
        <label><input type="radio" name="mode" value="single" v-model="mode">单卡组统计 + 随机抽卡</label>
        <label><input type="radio" name="mode" value="battle" v-model="mode">双卡组对决模拟</label>
      </div>
    </div>

    <div class="tool-card">
      <h2>文件设置</h2>
      <div v-show="mode === 'single'">
        <div class="tool-row">
          <span class="tool-label">选择YDK文件：</span>
          <input type="file" accept=".ydk" class="tool-file" @change="onSingleFile">
        </div>
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
      <div class="tool-row">
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
      <h2>卡组展示（主 / 副 / 额外）</h2>
      <div v-show="mode === 'single'">
        <template v-if="deckSingle">
          <div v-for="(sec, i) in deckSingle" :key="'s' + i" class="deck-section">
            <h3 :class="sec.hCls">{{ sec.title }}</h3>
            <div class="deck-grid">
              <span v-if="sec.items.length === 0" class="tool-tip">（空）</span>
              <span v-for="(item, j) in sec.items" :key="j" class="card-badge" :class="sec.cls">{{ item[1] > 1 ? item[0] + ' ×' + item[1] : item[0] }}</span>
            </div>
          </div>
        </template>
        <p v-else class="tool-tip">选择YDK文件后将自动展示卡组内容...</p>
      </div>
      <div v-show="mode === 'battle'">
        <div class="deck-section"><h3>卡组A</h3></div>
        <template v-if="deckA">
          <div v-for="(sec, i) in deckA" :key="'a' + i" class="deck-section">
            <h3 :class="sec.hCls">{{ sec.title }}</h3>
            <div class="deck-grid">
              <span v-if="sec.items.length === 0" class="tool-tip">（空）</span>
              <span v-for="(item, j) in sec.items" :key="j" class="card-badge" :class="sec.cls">{{ item[1] > 1 ? item[0] + ' ×' + item[1] : item[0] }}</span>
            </div>
          </div>
        </template>
        <div class="deck-section"><h3>卡组B</h3></div>
        <template v-if="deckB">
          <div v-for="(sec, i) in deckB" :key="'b' + i" class="deck-section">
            <h3 :class="sec.hCls">{{ sec.title }}</h3>
            <div class="deck-grid">
              <span v-if="sec.items.length === 0" class="tool-tip">（空）</span>
              <span v-for="(item, j) in sec.items" :key="j" class="card-badge" :class="sec.cls">{{ item[1] > 1 ? item[0] + ' ×' + item[1] : item[0] }}</span>
            </div>
          </div>
        </template>
      </div>
    </div>

    <div class="tool-card">
      <h2>操作</h2>
      <div>
        <button class="tool-btn" :disabled="isRunning" @click="start">开始执行</button>
        <button class="tool-btn tool-btn-stop" :disabled="!isRunning" @click="stop">停止</button>
      </div>
      <div class="progress-wrap">
        <div class="progress-bar" :style="{ width: progress + '%' }"></div>
      </div>
    </div>

    <div class="tool-card">
      <h2>操作日志</h2>
      <div class="log-box" ref="logBox">
        <div v-for="(log, i) in logs" :key="i">{{ log }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { nextTick, onMounted, ref } from 'vue'

const CACHE = {}

const mode = ref('single')
const excelName = ref('卡组综合结果')
const drawTimes = ref(1)
const drawCount = ref(5)
const battleTimes = ref(1)
const isRunning = ref(false)
const progress = ref(0)
const logs = ref([])
const logBox = ref(null)

let abortController = null
let parsedDeckSingle = null
let parsedDeckA = null
let parsedDeckB = null
let deckAFileName = null
let deckBFileName = null
const deckSingle = ref(null)
const deckA = ref(null)
const deckB = ref(null)

function log(msg) {
  const time = new Date().toLocaleTimeString()
  logs.value.push(`[${time}] ${msg}`)
  nextTick(() => {
    if (logBox.value) logBox.value.scrollTop = logBox.value.scrollHeight
  })
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

async function getCardName(cardCode) {
  if (CACHE[cardCode]) return CACHE[cardCode]
  abortController = new AbortController()
  try {
    log(`正在获取卡牌 ${cardCode} 名称...`)
    const response = await fetch(`https://ygocdb.com/api/v0/card/${cardCode}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: abortController.signal,
    })
    if (!response.ok) throw new Error(`HTTP错误：${response.status}`)
    const cardData = await response.json()
    let cardName = cardCode
    if (cardData && cardData.text && cardData.text.name) {
      cardName = cardData.text.name.trim()
      log(`成功获取卡牌 ${cardCode}：${cardName}`)
    } else {
      log(`未找到卡牌 ${cardCode} 的名称信息`)
    }
    CACHE[cardCode] = cardName
    return cardName
  } catch (error) {
    if (error.name !== 'AbortError') {
      log(`获取卡牌 ${cardCode} 失败：${error.message}`)
    }
    CACHE[cardCode] = cardCode
    return cardCode
  }
}

async function getCardsWithNames(cardList) {
  const result = []
  for (const [code, count] of cardList) {
    if (!isRunning.value) break
    const name = await getCardName(code)
    result.push([name, count])
  }
  return result
}

async function buildDeckSections(deckData) {
  const sections = []
  const defs = [
    { title: '主卡组', cards: deckData.main, cls: '', hCls: '' },
    { title: '额外卡组', cards: deckData.extra, cls: 'extra', hCls: 'extra-h' },
    { title: '副卡组', cards: deckData.side, cls: 'side', hCls: 'side-h' },
  ]
  for (const sec of defs) {
    const counter = countCards(sec.cards)
    const ordered = getOrderedItems(counter, sec.cards)
    const items = []
    for (const [code, count] of ordered) {
      const name = await getCardName(code)
      items.push([name, count])
    }
    sections.push({
      title: `${sec.title}（共${sec.cards.length}张，${ordered.length}种）`,
      cls: sec.cls,
      hCls: sec.hCls,
      items,
    })
  }
  return sections
}

async function onSingleFile(e) {
  const file = e.target.files[0]
  if (!file) return
  deckSingle.value = null
  log(`已选择YDK文件：${file.name}`)
  try {
    const text = await readFileAsText(file)
    parsedDeckSingle = parseYdkFile(text)
    log(`解析完成 - 主卡组：${parsedDeckSingle.main.length}张，额外：${parsedDeckSingle.extra.length}张，副卡组：${parsedDeckSingle.side.length}张`)
    deckSingle.value = await buildDeckSections(parsedDeckSingle)
  } catch (err) {
    log(`解析失败：${err.message}`)
  }
}

async function onFileA(e) {
  const file = e.target.files[0]
  if (!file) return
  deckA.value = null
  deckAFileName = file.name
  log(`已选择卡组A：${file.name}`)
  try {
    const text = await readFileAsText(file)
    parsedDeckA = parseYdkFile(text)
    log(`卡组A解析完成 - 主：${parsedDeckA.main.length}，额外：${parsedDeckA.extra.length}，副：${parsedDeckA.side.length}`)
    deckA.value = await buildDeckSections(parsedDeckA)
  } catch (err) {
    log(`卡组A解析失败：${err.message}`)
  }
}

async function onFileB(e) {
  const file = e.target.files[0]
  if (!file) return
  deckB.value = null
  deckBFileName = file.name
  log(`已选择卡组B：${file.name}`)
  try {
    const text = await readFileAsText(file)
    parsedDeckB = parseYdkFile(text)
    log(`卡组B解析完成 - 主：${parsedDeckB.main.length}，额外：${parsedDeckB.extra.length}，副：${parsedDeckB.side.length}`)
    deckB.value = await buildDeckSections(parsedDeckB)
  } catch (err) {
    log(`卡组B解析失败：${err.message}`)
  }
}

async function start() {
  if (mode.value === 'single') await runSingleMode()
  else await runBattleMode()
}

function stop() {
  isRunning.value = false
  if (abortController) abortController.abort()
  progress.value = 0
  log('用户手动停止')
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
  log('=== 开始单卡组抽卡模拟 ===')
  log(`抽取次数：${dTimes}轮，每轮${dCount}张`)
  try {
    const { main, extra, side } = parsedDeckSingle
    log('统计卡牌出现次数...')
    const mainOrdered = getOrderedItems(countCards(main), main)
    const extraOrdered = getOrderedItems(countCards(extra), extra)
    const sideOrdered = getOrderedItems(countCards(side), side)
    log('获取卡牌名称（用于统计）...')
    const mainWithNames = await getCardsWithNames(mainOrdered)
    const extraWithNames = await getCardsWithNames(extraOrdered)
    const sideWithNames = await getCardsWithNames(sideOrdered)
    if (!isRunning.value) return
    progress.value = 40
    log(`开始随机抽卡（${dTimes}轮，每轮${dCount}张）...`)
    const drawResults = await randomDrawCards(main, dTimes, dCount)
    if (!isRunning.value) return
    progress.value = 90
    log('生成CSV文件...')
    generateSingleCSV(mainWithNames, extraWithNames, sideWithNames, drawResults, dCount)
    log('=== 完成！ ===')
    alert(`完成！\n文件已下载：${excelName.value}.csv`)
  } catch (error) {
    log(`失败：${error.message}`)
    alert(`失败：${error.message}`)
  } finally {
    setRunning(false)
  }
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
      const name = await getCardName(code)
      drawnNames.push(name)
    }
    results.push([i, ...drawnNames])
    log(`第${i}轮抽卡结果：${drawnNames.join(' | ')}`)
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
  log('=== 开始卡组对决模拟 ===')
  log('卡组A：' + (deckAFileName || '已选择'))
  log('卡组B：' + (deckBFileName || '已选择'))
  log(`对决次数：${bTimes}次`)
  try {
    const battleResults = []
    for (let i = 1; i <= bTimes; i++) {
      if (!isRunning.value) break
      log(`\n--- 第${i}次对决 ---`)
      const result = await simulateBattle(i, parsedDeckA.main, parsedDeckB.main)
      battleResults.push(result)
      progress.value = 30 + (i / bTimes) * 60
    }
    if (!isRunning.value) return
    progress.value = 95
    log('生成CSV结果文件...')
    generateBattleCSV(battleResults)
    log('=== 对决模拟完成！ ===')
    alert(`完成！共${battleResults.length}次对决\n文件已下载：${excelName.value}.csv`)
  } catch (error) {
    log(`失败：${error.message}`)
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
    const name = await getCardName(code)
    drawnNames.push(name)
  }
  return drawnNames
}

async function simulateBattle(battleNum, deckA_, deckB_) {
  const firstAttackerIsA = Math.random() > 0.5
  const firstAttacker = firstAttackerIsA ? '卡组A' : '卡组B'
  const secondAttacker = firstAttackerIsA ? '卡组B' : '卡组A'
  log(`先攻方：${firstAttacker}`)
  log(`正在抽取${firstAttacker}初始手牌（5张）...`)
  const firstDraw5 = await drawCards(firstAttackerIsA ? deckA_ : deckB_, 5)
  log(`${firstAttacker}初始手牌：${firstDraw5.join(' | ')}`)
  log(`正在抽取${secondAttacker}初始手牌（5张）...`)
  const secondDraw5 = await drawCards(firstAttackerIsA ? deckB_ : deckA_, 5)
  log(`${secondAttacker}初始手牌：${secondDraw5.join(' | ')}`)
  log(`正在抽取${firstAttacker}额外抽卡（1张）...`)
  const firstDraw1 = await drawCards(firstAttackerIsA ? deckA_ : deckB_, 1)
  log(`${firstAttacker}额外抽卡：${firstDraw1[0]}`)
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

onMounted(() => log('工具已就绪，请选择模式与YDK文件'))
</script>

<style scoped>
.tool-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  margin-bottom: 20px;
}
.tool-card h2 {
  font-size: 20px;
  color: #1a1a1a;
  margin-bottom: 18px;
  padding-left: 12px;
  border-left: 4px solid #667eea;
  display: flex;
  align-items: center;
}
.tool-row {
  display: flex;
  align-items: center;
  margin-bottom: 14px;
}
.tool-row:last-child { margin-bottom: 0; }
.tool-label {
  width: 140px;
  color: #4b5563;
  font-size: 14px;
  margin-right: 10px;
  flex-shrink: 0;
}
.tool-input, .tool-file {
  flex: 1;
  padding: 9px 14px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  background: #fff;
  transition: all 0.3s ease;
}
.tool-input:focus, .tool-file:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
}
.tool-suffix {
  margin-left: 10px;
  color: #8590a6;
  font-size: 13px;
}
.tool-radio-group {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}
.tool-radio-group label {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 14px;
  color: #333;
  padding: 8px 18px;
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 10px 28px;
  border-radius: 20px;
  font-size: 14px;
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
.log-box {
  background: #f9fafb;
  border-radius: 8px;
  padding: 14px;
  height: 200px;
  overflow-y: auto;
  font-family: Consolas, monospace;
  font-size: 13px;
  line-height: 1.7;
}
.log-box div { margin-bottom: 2px; }
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
.deck-grid { display: flex; flex-wrap: wrap; }
.card-badge {
  display: inline-block;
  padding: 5px 12px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.12) 0%, rgba(118, 75, 162, 0.12) 100%);
  border: 1px solid rgba(102, 126, 234, 0.3);
  border-radius: 16px;
  font-size: 13px;
  color: #4a4a8a;
  margin: 3px;
  transition: all 0.3s ease;
}
.card-badge:hover {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
  transform: translateY(-1px);
}
.card-badge.extra {
  background: linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(99, 102, 241, 0.12) 100%);
  border-color: rgba(168, 85, 247, 0.3);
  color: #5b21b6;
}
.card-badge.side {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(239, 68, 68, 0.12) 100%);
  border-color: rgba(245, 158, 11, 0.3);
  color: #9a3412;
}
.tool-tip { color: #8590a6; font-size: 14px; }
@media (max-width: 768px) {
  .tool-row { flex-direction: column; align-items: flex-start; }
  .tool-label { width: auto; margin-bottom: 6px; margin-right: 0; }
}
</style>
