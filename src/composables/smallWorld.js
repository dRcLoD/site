// 小世界现象计算器共享逻辑（模块级缓存，跨组件实例复用）
export const SW_DB_SHOW = 60
const SW_DB_URL = 'https://ygocdb.com/api/v0/cards.zip'

const RACE_NAMES = {
  1: '战士', 2: '魔法师', 4: '天使', 8: '恶魔', 16: '不死', 32: '机械', 64: '水',
  128: '炎', 256: '岩石', 512: '鸟兽', 1024: '植物', 2048: '昆虫', 4096: '雷',
  8192: '龙', 16384: '兽', 32768: '兽战士', 65536: '爬虫', 131072: '鱼',
  262144: '海龙', 524288: '幻神兽', 1048576: '恐龙', 2097152: '幻龙',
  4194304: '电子界', 8388608: '幻想',
}
const ATTR_NAMES = { 1: '地', 2: '水', 4: '炎', 8: '风', 16: '光', 32: '暗', 64: '神' }

let swDbPromise = null

// 懒加载全卡数据库：只保留怪兽的精简字段（id/名/五项数值），完整 JSON 立即丢弃
export async function loadSwDb() {
  if (!swDbPromise) {
    swDbPromise = (async () => {
      const res = await fetch(SW_DB_URL)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const { unzipSync } = await import('fflate')
      const files = unzipSync(new Uint8Array(await res.arrayBuffer()))
      const jsonName = Object.keys(files).find(n => n.endsWith('.json'))
      if (!jsonName) throw new Error('数据包中没有找到JSON文件')
      const all = JSON.parse(new TextDecoder().decode(files[jsonName]))
      // cards.json 是以 cid 为键的对象映射（也可能是数组），统一转成列表
      const list = Array.isArray(all) ? all : Object.values(all)
      const monsters = []
      for (const c of list) {
        const d = c.data
        if (!d || !(d.type & 1)) continue
        monsters.push({
          id: String(c.id),
          // 全量包的卡名是扁平字段 cn_name（单卡接口才有 text.name）
          name: c.cn_name || (c.text && c.text.name) || String(c.id),
          race: d.race,
          attribute: d.attribute,
          level: d.level,
          atk: d.atk,
          def: d.def,
        })
      }
      monsters.sort((a, b) => a.name.localeCompare(b.name, 'zh'))
      return monsters
    })()
    swDbPromise.catch(() => { swDbPromise = null }) // 失败后允许重试
  }
  return swDbPromise
}

function swDims(m) {
  return [
    { key: 'race', label: '种族', val: m.race },
    { key: 'attribute', label: '属性', val: m.attribute },
    { key: 'level', label: '星级', val: m.level },
    { key: 'atk', label: '攻击', val: m.atk },
    { key: 'def', label: '守备', val: m.def },
  ]
}

// 小世界判定：五项数值恰好一项相同才可连接（同卡因五项全同自然排除）
export function swConnect(a, b) {
  const matches = swDims(a).filter(d => {
    const e = swDims(b).find(x => x.key === d.key)
    return d.val != null && e != null && e.val != null && d.val === e.val
  })
  return matches.length === 1 ? matches[0] : null
}

// 共同项的展示文案，如「龙」「暗」「★7」「1300攻」
export function fmtMatch(d) {
  if (d.key === 'race') {
    const names = []
    for (const [bit, name] of Object.entries(RACE_NAMES)) {
      if (d.val & Number(bit)) names.push(name)
    }
    return names.length ? names[0] : `种族${d.val}`
  }
  if (d.key === 'attribute') return ATTR_NAMES[d.val] || `属性${d.val}`
  if (d.key === 'level') return `★${d.val}`
  if (d.key === 'atk') return `${d.val}攻`
  if (d.key === 'def') return `${d.val}守`
  return String(d.val)
}
