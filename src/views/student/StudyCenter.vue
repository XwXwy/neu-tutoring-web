<template>
  <div class="editorial-page-container">
    <!-- 页面顶部的氛围感标题 -->
    <div class="page-header">
      <h2 class="page-title serif-title">
        <el-icon class="title-icon"><Collection /></el-icon> 我的书房
      </h2>
      <p class="page-subtitle">宁静致远，在这里继续您的学习之旅。</p>
    </div>

    <!-- 空状态 -->
    <div v-if="my_courses.length === 0" class="empty-state-wrapper">
      <el-empty 
        description="您的书桌上空空如也，快去选课中心挑几本好书吧！" 
        class="editorial-empty"
      />
    </div>
    
    <!-- 课程网格 -->
    <el-row :gutter="24" class="course-grid">
      <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="item in my_courses" :key="item.id">
        <el-card 
          :body-style="{ padding: '0px' }" 
          class="course-card" 
          shadow="hover" 
          @click="go_study(item.id)"
        >
          <!-- 封面图区域 -->
          <div class="cover-wrapper">
            <img v-if="item.cover_image" :src="item.cover_image" class="course-cover" />
            <div v-else class="no-cover-box">
              <el-icon class="no-cover-icon"><Picture /></el-icon>
              <div class="no-cover-text">暂无课程封面</div>
            </div>
          </div>
          
          <!-- 内容区域 -->
          <div class="course-info">
            <h4 class="course-title">{{ item.title }}</h4>
            <div class="tutor-line">
              <span class="label">授课讲师</span>
              <span class="value">{{ item.tutor_name }}</span>
            </div>
            
            <!-- 重写进度条 -->
            <div class="progress-box">
              <div class="progress-header">
                <span class="progress-label">学习进度</span>
                <span class="progress-value">{{ item.progress }}%</span>
              </div>
              <el-progress 
                :percentage="item.progress" 
                :show-text="false" 
                :stroke-width="6" 
                class="editorial-progress"
              />
            </div>
            
            <!-- 沉浸式操作按钮 -->
            <button class="btn-action-block" @click.stop="go_study(item.id)">
              继续阅读
            </button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '../../utils/request'
import { useRouter } from 'vue-router'
import { Collection, Picture } from '@element-plus/icons-vue'

const router = useRouter()
const my_courses = ref([])

const load_data = async () => {
  const res = await request.get('/course/student/purchased')
  my_courses.value = res.data
}

const go_study = (id) => {
  // 点击跳转到具体的课程学习室页面
  router.push({ path: '/study-room', query: { course_id: id } })
}

onMounted(load_data)
</script>

<style scoped>
/* ================= 美学色板与变量定义 ================= */
* {
  --clr-parchment: #f5f4ed;     /* 羊皮纸底色 */
  --clr-ivory: #faf9f5;         /* 卡片象牙白 */
  --clr-white: #ffffff;
  --clr-near-black: #141413;    /* 墨黑主文本 */
  
  --clr-terracotta: #c96442;    /* 陶土红 (进度条/强调) */
  --clr-olive: #5e5d59;         /* 橄榄灰 (次级文本) */
  --clr-stone: #87867f;         /* 石板灰 (辅助说明) */
  --clr-charcoal: #4d4c48;      /* 木炭灰 (按钮) */
  
  --clr-warm-sand: #e8e6dc;     /* 暖沙色 (底色/按钮背景) */
  --clr-border-cream: #f0eee6;  /* 柔和边框 */
  --clr-border-warm: #e8e6dc;   /* 加深边框 */
  --clr-ring-warm: #d1cfc5;     /* 交互光环 */
  
  --font-serif: "Georgia", "Times New Roman", serif;
  --font-sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.editorial-page-container {
  font-family: var(--font-sans);
  padding-bottom: 40px;
}

/* ================= 页面头部 ================= */
.page-header {
  margin-bottom: 32px;
  padding: 0 8px;
}
.serif-title {
  font-family: var(--font-serif);
  font-size: 24px;
  font-weight: 500;
  color: var(--clr-near-black);
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
}
.title-icon {
  margin-right: 12px;
  color: var(--clr-terracotta);
  font-size: 26px;
}
.page-subtitle {
  font-size: 14px;
  color: var(--clr-olive);
  margin: 0;
  padding-left: 38px;
}

/* ================= 空状态 ================= */
.empty-state-wrapper {
  background-color: var(--clr-ivory);
  border: 1px solid var(--clr-border-cream);
  border-radius: 12px;
  padding: 60px 0;
}
.editorial-empty :deep(.el-empty__description p) {
  color: var(--clr-olive);
  font-size: 14px;
}

/* ================= 课程卡片 (书籍感) ================= */
.course-grid {
  min-height: 400px;
}
.course-card {
  border-radius: 12px;
  border: 1px solid var(--clr-border-cream);
  background-color: var(--clr-ivory);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  cursor: pointer;
  margin-bottom: 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.course-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.04) !important;
  border-color: var(--clr-border-warm);
}

/* 封面区：顶部相框 */
.cover-wrapper {
  width: 100%;
  height: 160px;
  position: relative;
  overflow: hidden;
  border-bottom: 1px solid var(--clr-border-cream);
}
.course-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}
.course-card:hover .course-cover {
  transform: scale(1.05);
}

/* 无封面占位图 (暖沙底色) */
.no-cover-box {
  width: 100%;
  height: 100%;
  background-color: var(--clr-warm-sand);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--clr-stone);
}
.no-cover-icon { font-size: 32px; margin-bottom: 8px; opacity: 0.6; }
.no-cover-text { font-size: 13px; font-style: italic; }

/* ================= 卡片内容区 ================= */
.course-info {
  padding: 20px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

/* 标题：衬线体，书名质感 */
.course-title {
  margin: 0 0 12px 0;
  font-family: var(--font-serif);
  font-size: 17px;
  font-weight: 500;
  color: var(--clr-near-black);
  line-height: 1.4;
  /* 限制两行 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  height: 2.8em;
}

/* 讲师信息行 */
.tutor-line {
  font-size: 13px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}
.tutor-line .label {
  color: var(--clr-stone);
  margin-right: 8px;
}
.tutor-line .value {
  color: var(--clr-near-black);
  font-weight: 500;
}

/* ================= 进度条重构 ================= */
.progress-box {
  margin-top: auto; /* 将进度条和按钮推到底部 */
  margin-bottom: 20px;
}
.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8px;
}
.progress-label {
  font-size: 12px;
  color: var(--clr-olive);
}
.progress-value {
  font-family: monospace;
  font-size: 14px;
  font-weight: 600;
  color: var(--clr-terracotta);
}

/* 覆盖 Element 原生进度条的冷色调 */
.editorial-progress :deep(.el-progress-bar__outer) {
  background-color: var(--clr-border-warm) !important;
  border-radius: 4px;
}
.editorial-progress :deep(.el-progress-bar__inner) {
  background-color: var(--clr-terracotta) !important;
  border-radius: 4px;
  transition: width 0.6s ease;
}

/* ================= 沉浸式块级按钮 ================= */
.btn-action-block {
  width: 100%;
  display: block;
  background-color: var(--clr-warm-sand);
  color: var(--clr-charcoal);
  border: none;
  border-radius: 8px;
  padding: 10px 0;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}
.course-card:hover .btn-action-block {
  /* 悬停卡片时，按钮自动变为引导视觉的黑色 */
  background-color: var(--clr-near-black);
  color: var(--clr-ivory);
}
.btn-action-block:hover {
  /* 鼠标悬停到按钮本身，按钮稍稍抬起并加深 */
  background-color: var(--clr-charcoal) !important;
  transform: translateY(-1px);
}
</style>