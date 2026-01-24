import { defineClientConfig } from 'vuepress/client'
import BookLayout from './components/BookLayout.vue'
import Gist from './components/Gist.vue'
import PostList from './components/PostList.vue'

export default defineClientConfig({
  layouts: {
    BookLayout,
  },
  enhance({ app }) {
    app.component('Gist', Gist)
    app.component('PostList', PostList)
  },
})
