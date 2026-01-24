<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

const props = defineProps<{
  id: string
  file?: string
}>()

const gistContent = ref('')
const loading = ref(true)
const error = ref('')

// Build the gist URL
const gistUrl = computed(() => {
  const baseUrl = `https://gist.github.com/${props.id}.json`
  const params = new URLSearchParams()
  if (props.file) {
    params.set('file', props.file)
  }
  return baseUrl + (params.toString() ? `?${params.toString()}` : '')
})

// Get the separator for adding callback parameter
const urlSeparator = computed(() => {
  return gistUrl.value.includes('?') ? '&' : '?'
})

onMounted(async () => {
  // Only run on client side
  if (typeof window === 'undefined') return

  try {
    const callbackName = `gist_cb_${Date.now()}_${Math.random().toString(36).slice(2)}`

    const response = await new Promise<{ div: string; stylesheet: string }>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout loading gist'))
        cleanup()
      }, 10000)

      const cleanup = () => {
        clearTimeout(timeout)
        delete (window as any)[callbackName]
        if (script.parentNode) script.parentNode.removeChild(script)
      }

      ;(window as any)[callbackName] = (data: { div: string; stylesheet: string }) => {
        resolve(data)
        cleanup()
      }

      const script = document.createElement('script')
      script.src = `${gistUrl.value}${urlSeparator.value}callback=${callbackName}`
      script.onerror = () => {
        reject(new Error('Failed to load gist'))
        cleanup()
      }
      document.body.appendChild(script)
    })

    gistContent.value = response.div

    // Load stylesheet if not already present
    if (response.stylesheet && !document.querySelector(`link[href="${response.stylesheet}"]`)) {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = response.stylesheet
      document.head.appendChild(link)
    }

    loading.value = false
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load gist'
    loading.value = false
  }
})
</script>

<template>
  <ClientOnly>
    <div class="gist-embed">
      <div v-if="loading" class="gist-loading">Loading gist...</div>
      <div v-else-if="error" class="gist-error">{{ error }}</div>
      <div v-else v-html="gistContent" class="gist-content"></div>
    </div>
  </ClientOnly>
</template>

<style>
.gist-embed {
  margin: 1.5rem 0;
}

.gist-loading,
.gist-error {
  padding: 1rem;
  background: var(--c-code-bg);
  border-radius: 4px;
  font-size: 0.9rem;
  color: var(--c-text-muted);
}

.gist-error {
  color: #c0392b;
}

/* Override GitHub Gist styles for dark mode */
html.dark .gist .gist-file {
  border-color: var(--c-border) !important;
}

html.dark .gist .gist-data {
  background-color: var(--c-code-bg) !important;
  border-color: var(--c-border) !important;
}

html.dark .gist .gist-meta {
  background-color: var(--c-bg-light) !important;
  color: var(--c-text-muted) !important;
}

html.dark .gist .gist-meta a {
  color: var(--c-text-accent) !important;
}

html.dark .gist .blob-code,
html.dark .gist .blob-num {
  background-color: var(--c-code-bg) !important;
  color: var(--c-text) !important;
}

html.dark .gist .pl-c {
  color: #6a9955 !important;
}

html.dark .gist .pl-k {
  color: #569cd6 !important;
}

html.dark .gist .pl-s,
html.dark .gist .pl-pds {
  color: #ce9178 !important;
}

html.dark .gist .pl-en {
  color: #dcdcaa !important;
}

html.dark .gist .pl-smi {
  color: #9cdcfe !important;
}
</style>
