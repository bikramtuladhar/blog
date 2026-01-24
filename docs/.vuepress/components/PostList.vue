<script setup lang="ts">
// @ts-ignore - generated at build time
import { posts } from '@temp/posts.js'

interface PostInfo {
  path: string
  title: string
  date: string
}

const postList: PostInfo[] = posts

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
    <ul v-if="postList.length > 0">
      <li v-for="post in postList" :key="post.path">
        <a :href="post.path">{{ post.title }}</a>
        <em v-if="post.date && post.date !== '1970-01-01'"> — {{ formatDate(post.date) }}</em>
      </li>
    </ul>
    <p v-else class="no-posts">No posts found.</p>
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
