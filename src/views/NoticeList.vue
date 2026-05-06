<template>
  <div class="editorial-page-container" v-loading="loading">
    
    <!-- 极简返回导航 -->
    <div class="page-nav">
      <button class="btn-text-action" @click="router.back()">
        <el-icon class="nav-icon"><ArrowLeft /></el-icon> 返回首页
      </button>
    </div>

    <el-card shadow="never" class="editorial-card list-card">
      <template #header>
        <div class="card-header">
          <span class="header-title serif-title">
            <el-icon class="title-icon"><Notification /></el-icon> 平台历史公告
          </span>
        </div>
      </template>

      <!-- 公告列表区域 -->
      <div v-if="notice_list.length > 0" class="list-wrapper">
        <div 
          v-for="item in notice_list" 
          :key="item.id" 
          class="notice-item" 
          @click="go_to_detail(item.id)"
        >
          <div class="notice-main">
            <!-- 定制化分类徽章 -->
            <span class="type-badge" :class="'type-' + item.type">
              {{ item.type === 0 ? '系统更新' : (item.type === 1 ? '活动通知' : '政策变更') }}
            </span>
            <span class="notice-title">{{ item.title }}</span>
          </div>
          <div class="notice-time">{{ item.create_time }}</div>
        </div>
      </div>
      
      <!-- 空状态 -->
      <div v-else class="empty-state">
        <el-empty description="暂无历史公告" :image-size="80" />
      </div>

      <!-- 分页组件 -->
      <div class="pagination-wrapper" v-if="notice_list.length > 0">
        <el-pagination
          class="editorial-pagination"
          background
          layout="total, prev, pager, next"
          :total="total"
          v-model:current-page="query_params.page_num"
          @current-change="get_list"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import request from '../utils/request'
import { Notification, ArrowLeft } from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(true)
const notice_list = ref([])
const total = ref(0)
const query_params = ref({
  page_num: 1,
  page_size: 15
})

const get_list = async () => {
  loading.value = true
  try {
    const res = await request.get('/notice/page', { params: query_params.value })
    notice_list.value = res.data.records
    total.value = parseInt(res.data.total)
  } finally {
    loading.value = false
  }
}

const go_to_detail = (id) => {
  router.push({ path: '/notice-detail', query: { id } })
}

onActivated(() => {
  get_list()
})
</script>

<style scoped>
/* ================= 美学色板与变量定义 ================= */
* {
  --clr-parchment: #f5f4ed;     /* 羊皮纸底色 / 悬停背景 */
  --clr-ivory: #faf9f5;         /* 卡片象牙白 */
  --clr-white: #ffffff;
  --clr-near-black: #141413;    /* 墨黑主文本 */
  
  --clr-terracotta: #c96442;    /* 品牌红 / 悬停标题 */
  --clr-danger-red: #b02a2a;    /* 系统公告标红 */
  --clr-amber-warm: #d98f3e;    /* 活动公告标黄 */
  
  --clr-olive: #5e5d59;         /* 次级文本 */
  --clr-stone: #87867f;         /* 时间戳 */
  --clr-charcoal: #4d4c48;      /* 政策公告标灰 */
  
  --clr-warm-sand: #e8e6dc;     
  --clr-border-cream: #f0eee6;  /* 柔和分割线 */
  --clr-border-warm: #e8e6dc;   
  
  --font-serif: "Georgia", "Times New Roman", serif;
  --font-sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.editorial-page-container {
  font-family: var(--font-sans);
  max-width: 900px;
  margin: 0 auto;
  padding-top: 8px;
  padding-bottom: 40px;
}

/* ================= 极简顶部导航 ================= */
.page-nav {
  margin-bottom: 20px;
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
  margin-left: -12px;
  border-radius: 6px;
  transition: all 0.2s;
}
.btn-text-action:hover {
  color: var(--clr-near-black);
  background-color: var(--clr-border-cream);
}
.nav-icon { margin-right: 6px; }

/* ================= 柔和卡片系统 ================= */
.editorial-card {
  background-color: var(--clr-ivory);
  border: 1px solid var(--clr-border-cream);
  border-radius: 12px;
  box-shadow: rgba(0, 0, 0, 0.02) 0px 4px 12px !important;
}
:deep(.editorial-card .el-card__header) {
  padding: 24px 32px;
  border-bottom: 1px solid var(--clr-border-cream);
}
/* 消除默认 padding 以便列表贴边 */
:deep(.editorial-card .el-card__body) { padding: 0; }

.header-title {
  display: flex;
  align-items: center;
  margin: 0;
}
.serif-title {
  font-family: var(--font-serif);
  font-size: 20px;
  font-weight: 500;
  color: var(--clr-near-black);
}
.title-icon { margin-right: 10px; color: var(--clr-stone); font-size: 22px; }

/* ================= 列表排版区 ================= */
.list-wrapper {
  display: flex;
  flex-direction: column;
}

.notice-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 32px;
  border-bottom: 1px solid var(--clr-border-cream);
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.notice-item:last-child {
  border-bottom: none;
}
/* 克制的悬停交互：背景泛黄，标题染红，不用夸张的阴影缩放 */
.notice-item:hover {
  background-color: var(--clr-parchment);
}
.notice-item:hover .notice-title {
  color: var(--clr-terracotta);
}

.notice-main {
  display: flex;
  align-items: center;
  flex: 1;
  overflow: hidden; /* 为溢出省略做准备 */
}

/* 徽章重置：温和的标识 */
.type-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  margin-right: 16px;
  flex-shrink: 0;
}
.type-0 { background-color: rgba(176, 42, 42, 0.06); color: var(--clr-danger-red); border: 1px solid rgba(176, 42, 42, 0.15); } /* 系统 */
.type-1 { background-color: rgba(217, 143, 62, 0.1); color: var(--clr-amber-warm); border: 1px solid rgba(217, 143, 62, 0.2); } /* 活动 */
.type-2 { background-color: var(--clr-border-cream); color: var(--clr-charcoal); border: 1px solid var(--clr-border-warm); } /* 政策 */

.notice-title {
  font-size: 16px;
  color: var(--clr-near-black);
  font-weight: 500;
  transition: color 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 20px;
}

/* 时间戳使用等宽字体，像印刷物的目录边距 */
.notice-time {
  font-size: 14px;
  color: var(--clr-stone);
  font-family: monospace;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

.empty-state {
  padding: 60px 0;
}

/* ================= 分页器 ================= */
.pagination-wrapper { 
  padding: 24px 0; 
  display: flex; 
  justify-content: center; 
  border-top: 1px solid var(--clr-border-cream);
}
.editorial-pagination :deep(.el-pager li:not(.is-active)) {
  background-color: var(--clr-ivory);
  border: 1px solid var(--clr-border-cream);
  color: var(--clr-olive);
  border-radius: 6px;
}
.editorial-pagination :deep(.el-pager li.is-active) {
  background-color: var(--clr-terracotta) !important;
  color: var(--clr-ivory);
  border-radius: 6px;
  border-color: var(--clr-terracotta);
}
</style>