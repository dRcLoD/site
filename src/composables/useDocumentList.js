import { ref } from 'vue'

export function useDocumentList() {
  const files = ref([])
  const loading = ref(false)
  const error = ref('')
  const base = import.meta.env.BASE_URL

  async function load() {
    loading.value = true
    error.value = ''
    try {
      const res = await fetch(base + 'files.json', { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      files.value = (data || []).map(f => ({
        ...f,
        url: base + 'document/' + encodeURI(f.path),
      }))
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  return { files, loading, error, load }
}
