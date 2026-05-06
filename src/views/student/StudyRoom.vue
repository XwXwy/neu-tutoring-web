<template>
  <div class="editorial-page-container" v-loading="loading">
    
    <!-- 顶部导航栏 -->
    <div class="page-nav">
      <button class="btn-text-action" @click="router.back()">
        <el-icon class="nav-icon"><ArrowLeft /></el-icon> 返回我的书房
      </button>
    </div>
    
    <el-row :gutter="24">
      
      <!-- ================= 左侧：播放器 / 阅读器区域 ================= -->
      <el-col :span="16">
        <div class="player-wrapper">
          
          <!-- 1. 空状态提示 -->
          <div v-if="!current_resource.id" class="empty-player">
            <el-icon class="empty-icon"><VideoPlay /></el-icon>
            <p class="empty-text">请在右侧目录选择要学习的章节</p>
          </div>
          
          <!-- 2. 视频播放器 (带暗水印) -->
          <el-watermark 
            v-else-if="current_resource.resource_type === 1" 
            :content="[user_info.username + ' 专属', user_info.phone]" 
            :font="watermark_font"
            class="video-watermark"
          >
            <div class="media-container video-mode">
              <video 
                :src="current_resource.resource_url" 
                controls 
                autoplay 
                controlslist="nodownload"
                class="media-player"
              ></video>
            </div>
          </el-watermark>
          
          <!-- 3. 文档阅读器 -->
          <div v-else class="media-container doc-mode">
            <iframe :src="current_resource.resource_url" class="doc-viewer"></iframe>
          </div>

          <!-- 资源标题信息栏 -->
          <div class="resource-info-bar" v-if="current_resource.id">
            <h3 class="resource-title serif-title">{{ current_resource.resource_name }}</h3>
            <div class="status-badge status-learned" v-if="current_resource.is_learned === 1">
              <span class="status-dot"></span>
              <span class="status-text">已学习</span>
            </div>
          </div>
          
        </div>
      </el-col>

      <!-- ================= 右侧：课程目录 ================= -->
      <el-col :span="8">
        <el-card shadow="never" class="editorial-card playlist-card">
          <template #header>
            <div class="playlist-header">
              <span class="header-title">课程目录</span>
              <span class="chapter-count">共 {{ resource_list.length }} 节</span>
            </div>
          </template>
          
          <div class="playlist-content">
            <div v-if="resource_list.length === 0" class="playlist-empty">
              <span class="empty-msg">讲师正在准备资料，请稍后...</span>
            </div>
            
            <div 
              v-else 
              v-for="(item, index) in resource_list" 
              :key="item.id"
              :class="['playlist-item', { 'is-active': current_resource.id === item.id }]"
              @click="play_resource(item)"
            >
              <div class="item-left">
                <span class="item-index">{{ String(index + 1).padStart(2, '0') }}</span>
                <el-icon class="item-icon">
                  <VideoCamera v-if="item.resource_type === 1" />
                  <Document v-else />
                </el-icon>
                <span class="item-name" :title="item.resource_name">{{ item.resource_name }}</span>
              </div>
              
              <div class="item-right">
                <el-icon v-if="item.is_learned === 1" class="learned-icon"><CircleCheckFilled /></el-icon>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onActivated, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '../../utils/request'
import { ElMessage } from 'element-plus'
import { ArrowLeft, VideoPlay, VideoCamera, Document, CircleCheckFilled } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter() 
const loading = ref(true)

const course_id = ref(null)
const resource_list = ref([])
const current_resource = ref({})
const user_info = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))

const watermark_font = ref({
  color: 'rgba(200, 200, 200, 0.08)',
  fontSize: 16
})

const load_resources = async () => {
  loading.value = true
  course_id.value = route.query.course_id
  
  if (!course_id.value) {
    ElMessage.error('缺少课程ID参数')
    loading.value = false
    return
  }

  try {
    const res = await request.get('/course_resource/student/list_by_course', {
      params: { course_id: course_id.value }
    })
    resource_list.value = res.data

    if (resource_list.value.length > 0) {
      play_resource(resource_list.value[0])
    }
  } catch (error) {
    console.error('加载课程资源失败', error)
  }
  
  loading.value = false
}

const play_resource = async (resource) => {
  current_resource.value = resource
  
  if (resource.is_learned === 0) {
    try {
      await request.post('/study_record/mark_as_learned', null, {
        params: { resource_id: resource.id }
      })
      resource.is_learned = 1
    } catch(error) {
      console.error('记录学习进度失败', error)
    }
  }
}

// 首次挂载时加载
onMounted(() => {
  load_resources()
})

// 从缓存中激活时，如果课程ID变了就重新加载
onActivated(() => {
  if (course_id.value !== route.query.course_id) {
    load_resources()
  }
})

// 监听路由参数变化（同一页面切换不同课程时）
watch(() => route.query.course_id, (newId, oldId) => {
  if (newId && newId !== oldId) {
    load_resources()
  }
})
</script>

<style scoped>
/* ================= 美学色板与变量定义 ================= */
* {
  --clr-parchment: #f5f4ed;     /* 羊皮纸底色 */
  --clr-ivory: #faf9f5;         /* 卡片象牙白 */
  --clr-white: #ffffff;
  --clr-near-black: #141413;    /* 墨黑主文本/暗场背景 */
  
  --clr-terracotta: #c96442;    /* 陶土红 (活跃指示) */
  --clr-olive: #5e5d59;         /* 橄榄灰 (次级文本) */
  --clr-stone: #87867f;         /* 石板灰 (序号/未激活) */
  --clr-charcoal: #4d4c48;      /* 木炭灰 */
  
  --clr-warm-sand: #e8e6dc;     /* 暖沙色 (选中背景) */
  --clr-border-cream: #f0eee6;  /* 柔和边框 */
  --clr-border-warm: #e8e6dc;   /* 加深边框 */
  
  --font-serif: "Georgia", "Times New Roman", serif;
  --font-sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.editorial-page-container {
  font-family: var(--font-sans);
  max-width: 1200px;
  margin: 0 auto;
  padding-bottom: 40px;
}

/* ================= 顶部导航 ================= */
.page-nav {
  margin-bottom: 24px;
}
.btn-text-action {
  background: transparent;
  border: none;
  color: var(--clr-olive);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
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

/* ================= 左侧播放器包裹区 ================= */
.player-wrapper {
  background-color: var(--clr-ivory);
  border: 1px solid var(--clr-border-cream);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: rgba(0, 0, 0, 0.02) 0px 4px 12px;
  display: flex;
  flex-direction: column;
}

/* 空状态 */
.empty-player {
  height: 520px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: var(--clr-parchment);
}
.empty-icon { font-size: 64px; margin-bottom: 16px; color: var(--clr-border-warm); }
.empty-text { color: var(--clr-stone); font-size: 15px; letter-spacing: 0.5px; }

/* 媒体播放区 */
.video-watermark {
  width: 100%;
  height: 520px;
  background-color: var(--clr-near-black); /* 视频暗场 */
}
.media-container {
  width: 100%;
  height: 520px;
}
.video-mode {
  background-color: var(--clr-near-black);
  display: flex;
  align-items: center;
  justify-content: center;
}
.media-player {
  width: 100%;
  height: 100%;
  outline: none;
}
.doc-mode {
  background-color: var(--clr-parchment); /* 文档阅读使用羊皮纸底色护眼 */
}
.doc-viewer {
  width: 100%;
  height: 100%;
  border: none;
  background-color: var(--clr-white); /* 保证内部页面不受外部底色影响 */
}

/* 资源标题栏 */
.resource-info-bar {
  padding: 24px 32px;
  background-color: var(--clr-ivory);
  border-top: 1px solid var(--clr-border-cream);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.serif-title {
  font-family: var(--font-serif);
  font-size: 20px;
  font-weight: 500;
  color: var(--clr-near-black);
  margin: 0;
}

/* 已学习徽章 (陶土红强调) */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px 4px 8px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
  background: var(--clr-white);
  border: 1px solid var(--clr-border-warm);
}
.status-dot { width: 6px; height: 6px; border-radius: 50%; margin-right: 6px; }
.status-learned { border-color: rgba(201, 100, 66, 0.3); background: rgba(201, 100, 66, 0.05); }
.status-learned .status-dot { background-color: var(--clr-terracotta); box-shadow: 0 0 4px rgba(201, 100, 66, 0.4); }
.status-learned .status-text { color: var(--clr-terracotta); }


/* ================= 右侧播放列表 ================= */
.editorial-card {
  background-color: var(--clr-ivory);
  border: 1px solid var(--clr-border-cream);
  border-radius: 12px;
}
:deep(.playlist-card .el-card__header) {
  padding: 24px;
  border-bottom: 1px solid var(--clr-border-cream);
}
:deep(.playlist-card .el-card__body) { 
  padding: 0;
  flex: 1;
  overflow-y: auto;
}

.playlist-card {
  height: calc(520px + 80px); /* 与左侧高度对齐 */
  display: flex;
  flex-direction: column;
}

.playlist-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.header-title { font-weight: 500; font-size: 16px; color: var(--clr-near-black); }
.chapter-count { font-size: 13px; color: var(--clr-stone); }

/* 列表内容区 */
.playlist-content {
  padding: 8px 12px;
}
.playlist-empty {
  padding: 40px 20px;
  text-align: center;
}
.empty-msg { font-size: 13px; color: var(--clr-stone); font-style: italic; }

/* 目录项：书签质感排版 */
.playlist-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  margin-bottom: 4px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  color: var(--clr-olive);
}
.playlist-item:hover {
  background-color: rgba(232, 230, 220, 0.4); /* 透明暖沙色 */
}

/* 激活状态：左侧陶土红指示条 */
.playlist-item.is-active {
  background-color: var(--clr-warm-sand);
  color: var(--clr-near-black);
}
.playlist-item.is-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 20%;
  height: 60%;
  width: 3px;
  background-color: var(--clr-terracotta);
  border-radius: 0 4px 4px 0;
}
.playlist-item.is-active .item-name {
  font-weight: 500;
  color: var(--clr-near-black);
}

.item-left {
  display: flex;
  align-items: center;
  overflow: hidden;
  flex: 1;
}
.item-index {
  color: var(--clr-stone);
  font-family: monospace;
  font-size: 14px;
  margin-right: 12px;
}
.item-icon {
  margin-right: 10px;
  font-size: 16px;
  color: var(--clr-stone); /* 图标统一使用石板灰，保持静谧感 */
}
.item-name {
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 16px;
}

/* 右侧打勾图标 */
.learned-icon {
  font-size: 16px;
  color: var(--clr-terracotta); /* 将原版的亮绿色改为品牌的陶土红 */
  opacity: 0.9;
}

/* 隐藏滚动条 */
.playlist-card :deep(.el-card__body)::-webkit-scrollbar { width: 4px; }
.playlist-card :deep(.el-card__body)::-webkit-scrollbar-thumb { background: var(--clr-border-warm); border-radius: 8px; }
</style>