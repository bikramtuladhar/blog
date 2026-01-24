<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { usePageData, useRoutes } from 'vuepress/client'
import { Content } from 'vuepress/client'

interface PostInfo {
  path: string
  title: string
  date: string
}

const page = usePageData()
const routes = useRoutes()

// Theme state
const isDark = ref(false)

// Posts list for navigation
const posts = ref<PostInfo[]>([])

onMounted(async () => {
  // Check for saved preference or system preference
  const saved = localStorage.getItem('vuepress-color-scheme')
  if (saved) {
    isDark.value = saved === 'dark'
  } else {
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  updateTheme()

  // Load all posts for navigation
  await loadPosts()
})

async function loadPosts() {
  const postList: PostInfo[] = []

  for (const [path, route] of Object.entries(routes.value)) {
    if (path.startsWith('/posts/') &&
        path !== '/posts/' &&
        !path.endsWith('/README.html')) {
      try {
        const pageChunk = await route.loader()
        const pageData = pageChunk.data
        postList.push({
          path,
          title: pageData.title || 'Untitled',
          date: (pageData.frontmatter as any)?.date || '1970-01-01'
        })
      } catch (e) {
        console.error(`Failed to load page data for ${path}`, e)
      }
    }
  }

  // Sort by date descending (newest first)
  postList.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })

  posts.value = postList
}

const updateTheme = () => {
  if (isDark.value) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
  localStorage.setItem('vuepress-color-scheme', isDark.value ? 'dark' : 'light')
}

const toggleTheme = () => {
  isDark.value = !isDark.value
  updateTheme()
}

const currentIndex = computed(() => {
  return posts.value.findIndex(p => p.path === page.value.path)
})

const isPost = computed(() => currentIndex.value !== -1)

const hasPrev = computed(() => currentIndex.value > 0)
const hasNext = computed(() => currentIndex.value < posts.value.length - 1 && currentIndex.value !== -1)

const prevPost = computed(() => hasPrev.value ? posts.value[currentIndex.value - 1] : null)
const nextPost = computed(() => hasNext.value ? posts.value[currentIndex.value + 1] : null)
</script>

<template>
  <div class="book-layout">
    <!-- Header -->
    <header class="book-header">
      <h1 class="site-title">
        <a href="/">Bikram's Tech Journey</a>
      </h1>
      <p class="site-tagline">Technical notes and writings</p>
    </header>

    <!-- Main Content -->
    <main class="book-content">
      <Content />
    </main>

    <!-- Navigation -->
    <nav v-if="isPost" class="book-nav">
      <a
        v-if="hasPrev && prevPost"
        :href="prevPost.path"
        class="nav-link nav-prev"
      >
        ← Previous
      </a>
      <span v-else class="nav-link nav-disabled">← Previous</span>

      <a
        v-if="hasNext && nextPost"
        :href="nextPost.path"
        class="nav-link nav-next"
      >
        Next →
      </a>
      <span v-else class="nav-link nav-disabled">Next →</span>
    </nav>

    <!-- Footer -->
    <footer class="book-footer">
      <p>© 2026 · Crafted with care</p>
    </footer>

    <!-- Theme Toggle -->
    <button
      class="theme-toggle"
      @click="toggleTheme"
      :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
    >
      <svg v-if="isDark" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
    </button>
  </div>
</template>

<style scoped>
.book-layout {
  min-height: 100vh;
  padding: 3rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: var(--c-bg);
}

.book-header {
  text-align: center;
  margin-bottom: 3rem;
}

.site-title {
  font-size: 1.75rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  font-family: var(--font-family);
}

.site-title a {
  color: var(--c-text);
  text-decoration: none;
}

.site-title a:hover {
  color: var(--c-text-accent);
}

.site-tagline {
  color: var(--c-text-muted);
  font-size: 1rem;
  margin: 0;
  font-family: var(--font-family);
}

.book-content {
  max-width: 680px;
  width: 100%;
  flex: 1;
}

.book-nav {
  max-width: 680px;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 2rem;
  margin-top: 2rem;
  border-top: 1px solid var(--c-border);
  font-family: var(--font-family);
}

.nav-link {
  color: var(--c-text-muted);
  text-decoration: none;
  font-size: 0.95rem;
  transition: opacity 0.2s ease;
}

.nav-link:hover:not(.nav-disabled) {
  color: var(--c-text);
}

.nav-disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.book-footer {
  margin-top: 2rem;
  text-align: center;
  color: var(--c-text-muted);
  font-size: 0.85rem;
  opacity: 0.5;
  font-family: var(--font-family);
}

.book-footer p {
  margin: 0;
}

.theme-toggle {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  padding: 0.5rem;
  background: transparent;
  border: 1px solid var(--c-border);
  border-radius: 50%;
  cursor: pointer;
  opacity: 0.4;
  transition: opacity 0.2s ease;
  color: var(--c-text);
  display: flex;
  align-items: center;
  justify-content: center;
}

.theme-toggle:hover {
  opacity: 0.8;
}

.theme-toggle svg {
  display: block;
}
</style>
