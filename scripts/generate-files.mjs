import { readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const docDir = join(root, 'public', 'document')
const outFile = join(root, 'public', 'files.json')

const TYPE_MAP = {
  pdf: ['PDF 文档', '📄'],
  doc: ['Word 文档', '📝'],
  docx: ['Word 文档', '📝'],
  xls: ['Excel 表格', '📊'],
  xlsx: ['Excel 表格', '📊'],
  ppt: ['PPT 演示文稿', '📽️'],
  pptx: ['PPT 演示文稿', '📽️'],
  txt: ['文本文档', '📄'],
  jpg: ['图片', '🖼️'],
  jpeg: ['图片', '🖼️'],
  png: ['图片', '🖼️'],
  gif: ['图片', '🖼️'],
  zip: ['压缩包', '🗜️'],
  rar: ['压缩包', '🗜️'],
  '7z': ['压缩包', '🗜️'],
  mp4: ['视频', '🎬'],
  mp3: ['音频', '🎵'],
}

function walk(dir) {
  const result = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      result.push(...walk(full))
    } else {
      result.push(full)
    }
  }
  return result
}

function pad(n) {
  return String(n).padStart(2, '0')
}

function formatDate(ms) {
  const d = new Date(ms)
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function getTypeInfo(name) {
  const dot = name.lastIndexOf('.')
  const ext = dot >= 0 ? name.slice(dot + 1).toLowerCase() : ''
  return TYPE_MAP[ext] || ['文件', '📄']
}

let files = []
if (statSync(docDir).isDirectory()) {
  files = walk(docDir).map(full => {
    const rel = relative(docDir, full).split(sep).join('/')
    const name = rel.split('/').pop()
    const st = statSync(full)
    const [type, icon] = getTypeInfo(name)
    return {
      name,
      path: rel,
      size: st.size,
      date: formatDate(st.mtimeMs),
      type,
      icon,
    }
  })
}

files.sort((a, b) => a.name.localeCompare(b.name, 'zh'))

writeFileSync(outFile, JSON.stringify(files, null, 2) + '\n', 'utf-8')
console.log(`已生成文件列表（${files.length} 个文件）: public/files.json`)
