<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoutes } from 'vuepress/client'

interface PostInfo {
  path: string
  title: string
  date: string
}

const routes = useRoutes()
const posts = ref<PostInfo[]>([])

onMounted(async () => {
  const postList: PostInfo[] = []

  // Iterate over all routes
  for (const [path, route] of Object.entries(routes.value)) {
    // Only include pages in /posts/ directory, exclude the index
    if (path.startsWith('/posts/') &&
        path !== '/posts/' &&
        !path.endsWith('/README.html')) {

      try {
        // Load the page data to get title and frontmatter
        const pageChunk = await route.loader()
        const pageData = pageChunk.data
        const frontmatter = pageData.frontmatter as any

        // Skip drafts
        if (frontmatter?.draft === true) {
          continue
        }

        postList.push({
          path,
          title: pageData.title || 'Untitled',
          date: frontmatter?.date || '1970-01-01'
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
})

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>

<template>
  <div class="post-list">
    <ul v-if="posts.length > 0">
      <li v-for="post in posts" :key="post.path">
        <a :href="post.path">{{ post.title }}</a>
        <em v-if="post.date && post.date !== '1970-01-01'"> — {{ formatDate(post.date) }}</em>
      </li>
    </ul>
    <p v-else class="no-posts">Loading posts...</p>
  </div>
</template>

<style scoped>
.post-list ul {
  list-style: disc;
  padding-left: 1.5rem;
}

.post-list li {
  margin-bottom: 0.75rem;
}

.post-list a {
  color: var(--c-text);
  text-decoration: none;
}

.post-list a:hover {
  text-decoration: underline;
}

.post-list em {
  color: var(--c-text-muted);
  font-size: 0.9rem;
}

.no-posts {
  color: var(--c-text-muted);
  font-style: italic;
}
</style>
