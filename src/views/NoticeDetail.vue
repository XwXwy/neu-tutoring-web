<template>
  <div class="editorial-page-container" v-loading="loading">
    
    <!-- 极简返回导航 -->
    <div class="page-nav">
      <button class="btn-text-action" @click="router.back()">
        <el-icon class="nav-icon"><ArrowLeft /></el-icon> 返回公告列表
      </button>
    </div>
    
    <div class="article-wrapper">
      <el-card shadow="never" class="editorial-card article-card" v-if="notice.id">
        
        <!-- 杂志化标题头部 -->
        <header class="article-header">
          <h1 class="article-title serif-title">{{ notice.title }}</h1>
          
          <div class="meta-info">
            <span class="type-badge" :class="'type-' + notice.type">
              {{ notice.type === 0 ? '系统更新' : (notice.type === 1 ? '活动通知' : '政策变更') }}
            </span>
            <span class="publish-time">发布时间：{{ notice.create_time }}</span>
          </div>
        </header>

        <div class="divider-line"></div>

        <!-- Markdown 渲染区 -->
        <article class="markdown-editorial" v-html="render_markdown(notice.content)"></article>
        
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onActivated, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '../utils/request'
import markdownit from 'markdown-it'
import { ArrowLeft } from '@element-plus/icons-vue'

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
  loading.value = true
  try {
    const res = await request.get('/notice/detail', { params: { id } })
    notice.value = res.data
  } finally {
    loading.value = false
  }
}

// 首次挂载时加载
onMounted(() => {
  load_detail()
})

// 从缓存中激活时，检查公告ID是否变化
onActivated(() => {
  if (notice.value.id && notice.value.id != route.query.id) {
    load_detail()
  }
})

// 监听路由参数变化（查看不同公告时）
watch(() => route.query.id, (newId, oldId) => {
  if (newId && newId !== oldId) {
    load_detail()
  }
})
</script>

<style scoped>
/* ================= 美学色板与变量定义 ================= */
* {
  --clr-parchment: #f5f4ed;     /* 羊皮纸底色 */
  --clr-ivory: #faf9f5;         /* 卡片象牙白 */
  --clr-white: #ffffff;
  --clr-near-black: #141413;    /* 墨黑主文本 */
  
  --clr-terracotta: #c96442;    /* 强调/高亮 */
  --clr-danger-red: #b02a2a;    
  
  --clr-olive: #5e5d59;         /* 次级文本 */
  --clr-stone: #87867f;         /* 辅助/元数据 */
  --clr-charcoal: #4d4c48;      
  
  --clr-warm-sand: #e8e6dc;     /* 引用块背景 */
  --clr-border-cream: #f0eee6;  /* 分割线 */
  --clr-border-warm: #e8e6dc;   
  
  --font-serif: "Georgia", "Times New Roman", serif;
  --font-sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.editorial-page-container {
  font-family: var(--font-sans);
  padding-bottom: 40px;
}

/* 居中收束阅读宽度，最适合人眼阅读的行宽 */
.article-wrapper {
  max-width: 860px;
  margin: 0 auto;
}

/* ================= 顶部导航 ================= */
.page-nav { 
  margin-bottom: 20px; 
  max-width: 860px;
  margin-left: auto;
  margin-right: auto;
}
.btn-text-action {
  background: transparent;
  border: none;
  color: var(--clr-olive);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  margin-left: -12px; /* 抵消内边距使图标对齐 */
  border-radius: 6px;
  transition: all 0.2s;
}
.btn-text-action:hover { color: var(--clr-near-black); background-color: var(--clr-border-cream); }
.nav-icon { margin-right: 6px; }

/* ================= 柔和卡片系统 ================= */
.editorial-card {
  background-color: var(--clr-ivory);
  border: 1px solid var(--clr-border-cream);
  border-radius: 12px;
  box-shadow: rgba(0, 0, 0, 0.02) 0px 4px 24px !important;
}
/* 给文章留出宽裕的呼吸空间 */
:deep(.editorial-card .el-card__body) { 
  padding: 48px 56px 64px; 
}

/* ================= 文章头部 ================= */
.article-header {
  text-align: center;
  margin-bottom: 32px;
}

.article-title {
  font-family: var(--font-serif);
  font-size: 32px;
  font-weight: 500;
  color: var(--clr-near-black);
  margin: 0 0 20px 0;
  line-height: 1.4;
  letter-spacing: 0.5px;
}

.meta-info {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
}

/* 徽章重置：温和的标识 */
.type-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}

.type-0 { 
background-color: rgba(176, 42, 42, 0.06); color: var(--clr-danger-red); border: 1px solid rgba(176, 42, 42, 0.15);
}

.type-1 { 
  background-color: rgba(217, 143, 62, 0.1); color: var(--clr-amber-warm); border: 1px solid rgba(217, 143, 62, 0.2);
}

.type-2 { 
background-color: var(--clr-border-cream); color: var(--clr-charcoal); border: 1px solid var(--clr-border-warm);
}
.publish-time {
  font-family: monospace;
  font-size: 14px;
  color: var(--clr-stone);
  letter-spacing: 0.5px;
}

.divider-line {
  height: 1px;
  width: 100px;
  margin: 0 auto 40px;
  background-color: var(--clr-border-warm);
}

/* ================= Markdown 排版 (核心文学体验) ================= */
.markdown-editorial {
  font-size: 16px; /* 适合长文阅读的字号 */
  line-height: 1.8; /* 宽松的行高 */
  color: var(--clr-near-black);
  word-wrap: break-word;
}

/* 标题应用衬线体，层次分明 */
.markdown-editorial :deep(h1), 
.markdown-editorial :deep(h2), 
.markdown-editorial :deep(h3), 
.markdown-editorial :deep(h4) {
  font-family: var(--font-serif);
  color: var(--clr-near-black);
  font-weight: 500;
  margin-top: 1.8em;
  margin-bottom: 0.8em;
  line-height: 1.3;
}
.markdown-editorial :deep(h1) { font-size: 1.8em; border-bottom: 1px solid var(--clr-border-cream); padding-bottom: 0.3em; }
.markdown-editorial :deep(h2) { font-size: 1.5em; }
.markdown-editorial :deep(h3) { font-size: 1.25em; }

/* 正文与段落 */
.markdown-editorial :deep(p) { 
  margin-top: 0;
  margin-bottom: 1.2em; 
}

/* 强调文字 */
.markdown-editorial :deep(strong) {
  color: var(--clr-terracotta);
  font-weight: 600;
}

/* 列表缩进与样式 */
.markdown-editorial :deep(ul), 
.markdown-editorial :deep(ol) {
  padding-left: 1.5em;
  margin-top: 0;
  margin-bottom: 1.2em;
}
.markdown-editorial :deep(li) { 
  margin-bottom: 0.4em; 
}
.markdown-editorial :deep(li::marker) {
  color: var(--clr-stone); /* 原点的颜色调淡 */
}

/* 引言区块 (Blockquote) */
.markdown-editorial :deep(blockquote) {
  margin: 1.5em 0;
  padding: 1em 1.5em;
  background-color: var(--clr-parchment);
  border-left: 4px solid var(--clr-border-warm);
  border-radius: 0 8px 8px 0;
  color: var(--clr-olive);
  font-style: italic;
}
.markdown-editorial :deep(blockquote p:last-child) {
  margin-bottom: 0;
}

/* 行内代码 */
.markdown-editorial :deep(code) {
  background-color: var(--clr-warm-sand);
  padding: 0.2em 0.4em;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.9em;
  color: var(--clr-charcoal);
}

/* 代码块 */
.markdown-editorial :deep(pre) {
  background-color: var(--clr-parchment);
  border: 1px solid var(--clr-border-warm);
  padding: 1em;
  border-radius: 8px;
  overflow-x: auto;
  margin-bottom: 1.5em;
}
.markdown-editorial :deep(pre code) {
  background-color: transparent;
  padding: 0;
  color: var(--clr-near-black);
}

/* 表格：淡雅风格 */
.markdown-editorial :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 1.5em 0;
  background-color: var(--clr-white);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 0 0 1px var(--clr-border-warm);
}
.markdown-editorial :deep(th), 
.markdown-editorial :deep(td) {
  border: 1px solid var(--clr-border-cream);
  padding: 12px 16px;
}
.markdown-editorial :deep(th) {
  background-color: var(--clr-parchment);
  font-weight: 500;
  color: var(--clr-charcoal);
  text-align: left;
}

/* 链接 */
.markdown-editorial :deep(a) {
  color: var(--clr-terracotta);
  text-decoration: underline;
  text-underline-offset: 4px;
  text-decoration-color: rgba(201, 100, 66, 0.3);
  transition: all 0.2s;
}
.markdown-editorial :deep(a:hover) {
  text-decoration-color: var(--clr-terracotta);
}
</style>