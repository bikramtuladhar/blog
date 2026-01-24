import { createPage } from 'vuepress/core'
import type { Plugin, Page } from 'vuepress/core'
import { path } from 'vuepress/utils'

interface PostInfo {
  path: string
  title: string
  date: string
}

export const postsPlugin = (): Plugin => {
  const posts: PostInfo[] = []

  return {
    name: 'posts-plugin',

    extendsPage: (page: Page) => {
      // Collect posts during build
      if (
        page.path.startsWith('/posts/') &&
        page.path !== '/posts/' &&
        !page.path.endsWith('/README.html')
      ) {
        const frontmatter = page.frontmatter as any

        // Skip drafts
        if (frontmatter?.draft === true) {
          return
        }

        posts.push({
          path: page.path,
          title: page.title || 'Untitled',
          date: frontmatter?.date || '1970-01-01',
        })
      }
    },

    onPrepared: async (app) => {
      // Sort by date descending (newest first)
      posts.sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      })

      // Write posts data to a temp file that can be imported
      await app.writeTemp(
        'posts.js',
        `export const posts = ${JSON.stringify(posts, null, 2)}`
      )
    },
  }
}
