import { ref } from 'vue'

const OWNER = 'dRcLoD'
const REPO = 'site'
const BRANCH = 'main'
const FOLDER = 'public/document'

function getTypeInfo(name) {
  const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : ''
  const map = {
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
  return map[ext] || ['文件', '📄']
}

export function useDocumentList() {
  const files = ref([])
  const loading = ref(false)
  const error = ref('')

  async function load() {
    loading.value = true
    error.value = ''
    try {
      const res = await fetch(
        `https://api.github.com/repos/${OWNER}/${REPO}/git/trees/${BRANCH}?recursive=1`
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const prefix = FOLDER + '/'
      const entries = (data.tree || []).filter(
        e => e.type === 'blob' && e.path.startsWith(prefix)
      )
      files.value = entries
        .map(e => {
          const rel = e.path.slice(prefix.length)
          const name = rel.split('/').pop()
          const [label, icon] = getTypeInfo(name)
          return {
            name,
            path: rel,
            size: e.size || 0,
            type: label,
            icon,
            url: `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${e.path}`,
          }
        })
        .sort((a, b) => a.name.localeCompare(b.name, 'zh'))
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  return { files, loading, error, load }
}
