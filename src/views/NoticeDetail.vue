<template>
  <div class="notice-detail-container" v-loading="loading">
    <el-page-header @back="router.back()">
      <template #content>
        <span class="text-large font-600 mr-3"> 公告详情 </span>
      </template>
    </el-page-header>
    
    <el-card shadow="never" class="content-card" v-if="notice.id">
      <!-- 标题 -->
      <h1 class="notice-title">{{ notice.title }}</h1>
      
      <!-- 信息栏：类型和时间 -->
      <div class="meta-info">
        <el-tag :type="notice.type === 0 ? 'danger' : (notice.type === 1 ? 'warning' : 'primary')">
          {{ notice.type === 0 ? '系统更新' : (notice.type === 1 ? '活动通知' : '政策变更') }}
        </el-tag>
        <span class="publish-time">发布于：{{ notice.create_time }}</span>
      </div>

      <el-divider />

      <!-- 【核心】用 markdown-it 渲染正文 -->
      <div class="markdown-body" v-html="render_markdown(notice.content)"></div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '../utils/request'
import markdownit from 'markdown-it'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const notice = ref({})

const md = markdownit({ html: true, breaks: true, linkify: true })

const render_markdown = (text) => {
  if (!text) return ''
  return md.render(text)
}

const load_detail = async () => {
  const id = route.query.id
  if (!id) return
  try {
    const res = await request.get('/notice/detail', { params: { id } })
    notice.value = res.data
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  load_detail()
})
</script>

<style scoped>
.notice-detail-container {
  max-width: 800px;
  margin: 0 auto;
}
.content-card {
  margin-top: 20px;
}
.notice-title {
  font-size: 24px;
  font-weight: 600;
  text-align: center;
  color: #303133;
}
.meta-info {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 15px;
  color: #909399;
  font-size: 14px;
}

/* 引入我们之前在 AiChat.vue 里写的 Markdown 样式 */
.markdown-body :deep(h1), .markdown-body :deep(h2), .markdown-body :deep(h3) {
  margin-top: 1.5em;
  margin-bottom: 1em;
  font-weight: 600;
  color: #2c3e50;
}
.markdown-body :deep(p) {
  line-height: 1.8;
  margin-bottom: 1em;
}
.markdown-body :deep(ul), .markdown-body :deep(ol) {
  padding-left: 2em;
  margin-bottom: 1em;
}
.markdown-body :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 1em;
}
.markdown-body :deep(th), .markdown-body :deep(td) {
  border: 1px solid #dfe2e5;
  padding: .6em 1em;
}
.markdown-body :deep(th) {
  background-color: #f6f8fa;
}
</style>