<template>
  <div class="editorial-page-container">
    <!-- 1. 顶部搜索与筛选栏 -->
    <el-card shadow="never" class="editorial-card filter-card">
      <el-row :gutter="20" align="middle" class="search-row">
        <el-col :span="6">
          <el-input 
            v-model="query_params.title" 
            placeholder="搜索课程标题..." 
            prefix-icon="Search" 
            clearable 
            @change="handle_search" 
            class="warm-input"
          />
        </el-col>
        <el-col :span="5">
          <el-input 
            v-model="query_params.city" 
            placeholder="按城市筛选 (如: 沈阳市)" 
            clearable 
            @change="handle_search" 
            class="warm-input"
          />
        </el-col>
        <el-col :span="4" class="btn-group-search">
          <el-button class="btn-primary" @click="handle_search">查询</el-button>
          <el-button class="btn-secondary" @click="reset_query">重置</el-button>
        </el-col>
        <el-col :span="9" class="city-filter-box">
          <span class="current-city-tag">当前城市：{{ user_info.city || '未设置' }}</span>
          <button class="btn-text-action" @click="filter_by_my_city">只看同城</button>
        </el-col>
      </el-row>
      
      <div class="divider-line"></div>
      
      <div class="category-filter">
        <span class="filter-label">科目分类：</span>
        <div class="category-tags">
          <!-- “全部” 按钮 -->
          <el-check-tag 
            class="editorial-check-tag"
            :class="{ 'is-checked': !query_params.category_id }"
            @change="select_category(null)"
          >
            全部
          </el-check-tag>
          <!-- 动态生成的科目按钮 -->
          <el-check-tag 
            v-for="cat in category_list" 
            :key="cat.id"
            class="editorial-check-tag"
            :class="{ 'is-checked': query_params.category_id === cat.id }"
            @change="select_category(cat.id)"
          >
            {{ cat.name }}
          </el-check-tag>
        </div>
      </div>
    </el-card>

    <!-- 2. 猜你喜欢 (专属推荐展位) -->
    <div class="recommend-section" v-if="recommend_list.length > 0">
      <div class="section-header">
        <h2 class="section-title serif-title">
          <el-icon class="title-icon"><Opportunity /></el-icon> 猜你喜欢
        </h2>
        <button class="btn-text-action refresh-btn" @click="handle_refresh_recommend">
          <el-icon><Refresh /></el-icon> 换一换
        </button>
      </div>
      
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="item in recommend_list" :key="item.id">
          <el-card :body-style="{ padding: '0px' }" class="course-card" shadow="hover" @click="go_detail(item.id)">
            <div class="recommend-badge">为你推荐</div>
            
            <div class="cover-wrapper">
              <img v-if="item.cover_image" :src="item.cover_image" class="course-cover" />
              <div v-else class="no-cover-box">
                <el-icon class="no-cover-icon"><Picture /></el-icon>
                <div class="no-cover-text">暂无封面图</div>
              </div>
            </div>
            
            <div class="course-info">
              <h3 class="course-title">{{ item.title }}</h3>
              <div class="tutor-line">
                <el-avatar :size="24" :src="item.tutor_avatar" class="tutor-avatar" />
                <span class="tutor-name">{{ item.tutor_name }}</span>
              </div>
              <div class="price-line">
                <div class="price-box">
                  <span class="price-symbol">¥</span>
                  <span class="price-num">{{ item.price }}</span>
                  <span class="price-unit">/课时</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 3. 全站课程大厅 -->
    <div class="hall-header">
      <h2 class="section-title serif-title">
        <el-icon class="title-icon"><Reading /></el-icon> 发现好课
      </h2>
    </div>
    
    <el-row :gutter="20" class="course-grid" v-loading="loading">
      <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="item in course_list" :key="item.id">
        <el-card :body-style="{ padding: '0px' }" class="course-card" shadow="hover" @click="go_detail(item.id)">
          
          <div class="cover-wrapper">
            <img v-if="item.cover_image" :src="item.cover_image" class="course-cover" />
            <div v-else class="no-cover-box">
              <el-icon class="no-cover-icon"><Picture /></el-icon>
              <div class="no-cover-text">暂无封面图</div>
            </div>
          </div>
          
          <div class="course-info">
            <h3 class="course-title">{{ item.title }}</h3>
            
            <div class="tutor-line">
              <el-avatar :size="24" :src="item.tutor_avatar" class="tutor-avatar" />
              <span class="tutor-name">{{ item.tutor_name }}</span>
              <span class="city-text">{{ item.city }}</span>
            </div>
            
            <div class="tag-line">
              <span class="soft-tag">{{ item.category_name }}</span>
              <!-- 类型指示器 -->
              <div class="type-indicator" :class="item.type === 1 ? 'type-online' : 'type-offline'">
                <span class="type-dot"></span>
                <span class="type-text">{{ item.type === 1 ? '在线视频' : '线下上门' }}</span>
              </div>
            </div>
            
            <div class="price-line">
              <div class="price-box">
                <span class="price-symbol">¥</span>
                <span class="price-num">{{ item.price }}</span>
                <span class="price-unit">/课时</span>
              </div>
              <button class="btn-action-small" @click.stop="go_detail(item.id)">
                查看
              </button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 4. 分页 -->
    <div class="pagination-wrapper" v-if="course_list.length > 0">
      <el-pagination
        class="editorial-pagination"
        background
        layout="prev, pager, next"
        :total="total"
        v-model:current-page="query_params.page_num"
        @current-change="get_list"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '../../utils/request'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { Refresh, Search, Picture, Opportunity, Reading } from '@element-plus/icons-vue' 

const router = useRouter()
const loading = ref(false)
const course_list = ref([])
const total = ref(0)
const user_info = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))

const category_list = ref([])

const get_categories = async () => {
  try {
    const res = await request.get('/category/list', { params: { type: 1 } }) 
    category_list.value = res.data
  } catch (error) {}
}

const select_category = (category_id) => {
  query_params.value.category_id = category_id
  handle_search() 
}

const query_params = ref({
  page_num: 1,
  page_size: 8,
  title: '',
  city: '',
  category_id: null
})

const recommend_list = ref([])
const recommend_params = ref({
  page_num: 1,
  page_size: 4
})
const recommend_total_pages = ref(0)

const get_list = async () => {
  loading.value = true
  const res = await request.get('/course/mall/list', { params: query_params.value })
  course_list.value = res.data.records
  total.value = parseInt(res.data.total)
  loading.value = false
}

const get_recommend_list = async () => {
  try {
    const res = await request.get('/course/mall/recommend', { params: recommend_params.value })
    if (res.data && res.data.records.length > 0) {
      recommend_list.value = res.data.records
      recommend_total_pages.value = res.data.pages
    }
  } catch(error) {}
}

const handle_refresh_recommend = () => {
  if (recommend_params.value.page_num >= recommend_total_pages.value) {
    ElMessage({
      message: '已经翻阅到底部啦，为您返回第一页推荐~',
      type: 'warning',
      duration: 2000 
    });
    recommend_params.value.page_num = 1;
  } else {
    recommend_params.value.page_num++;
  }
  get_recommend_list();
}

const handle_search = () => {
  query_params.value.page_num = 1
  get_list()
}

const reset_query = () => {
  query_params.value = { page_num: 1, page_size: 8, title: '', city: '', category_id: null }
  get_list()
}

const filter_by_my_city = () => {
  if (!user_info.value.city) {
    ElMessage.warning('请先在个人中心设置您的所在城市')
    return
  }
  query_params.value.city = user_info.value.city
  handle_search()
}

const go_detail = (id) => {
  router.push({ path: '/course-detail', query: { course_id: id } })
}

onMounted(() => {
  get_list()
  get_categories() 
  if (user_info.value.role === 2) {
    get_recommend_list()
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
  
  --clr-terracotta: #c96442;    /* 陶土红 (推荐/价格/按钮/高亮) */
  --clr-amber-warm: #d98f3e;    /* 暖琥珀 */
  --clr-coral: #d97757;
  
  --clr-olive: #5e5d59;         /* 橄榄灰 (次级文本) */
  --clr-stone: #87867f;         /* 石板灰 (辅助文本) */
  --clr-charcoal: #4d4c48;      /* 木炭灰 */
  --clr-warm-sand: #e8e6dc;     /* 暖沙色 (占位背景/分隔线) */
  --clr-border-cream: #f0eee6;  /* 柔和边框 */
  --clr-border-warm: #e8e6dc;   /* 加深边框 */
  --clr-focus-blue: #3898ec;
  
  --font-serif: "Georgia", "Times New Roman", serif;
  --font-sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.editorial-page-container {
  font-family: var(--font-sans);
  padding-bottom: 40px;
}

/* ================= 柔和卡片系统 (顶部筛选) ================= */
.editorial-card {
  background-color: var(--clr-ivory);
  border: 1px solid var(--clr-border-cream);
  border-radius: 12px;
  box-shadow: rgba(0, 0, 0, 0.02) 0px 4px 12px !important;
}
.filter-card { margin-bottom: 24px; }
:deep(.editorial-card .el-card__body) { padding: 24px 32px; }

/* 搜索框组 */
.search-row { margin-bottom: 4px; }
.warm-input :deep(.el-input__wrapper) {
  background-color: var(--clr-parchment);
  border: 1px solid var(--clr-border-warm);
  border-radius: 8px;
  box-shadow: none !important;
  transition: all 0.2s;
}
.warm-input :deep(.el-input__wrapper.is-focus) {
  background-color: var(--clr-white);
  border-color: var(--clr-focus-blue);
  box-shadow: 0 0 0 1px var(--clr-focus-blue) !important;
}

/* 按钮组 */
.btn-group-search { display: flex; gap: 8px; }
.btn-primary {
  background: var(--clr-near-black) !important;
  color: var(--clr-ivory) !important;
  border: none; border-radius: 8px; padding: 8px 20px; font-weight: 500;
}
.btn-primary:hover { background: var(--clr-charcoal) !important; }
.btn-secondary {
  background: var(--clr-warm-sand) !important;
  color: var(--clr-charcoal) !important;
  border: none; border-radius: 8px; padding: 8px 20px;
}

/* 城市文本与链接 */
.city-filter-box { text-align: right; display: flex; justify-content: flex-end; align-items: center; gap: 16px; }
.current-city-tag {
  font-size: 13px;
  color: var(--clr-stone);
  padding: 4px 12px;
  border-radius: 16px;
  background-color: var(--clr-white);
  border: 1px solid var(--clr-border-warm);
}
.btn-text-action {
  background: transparent;
  border: none;
  color: var(--clr-olive);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
}
.btn-text-action:hover { color: var(--clr-near-black); background-color: var(--clr-border-cream); }

/* 分割线 */
.divider-line {
  height: 1px;
  background-color: var(--clr-border-cream);
  margin: 20px 0;
}

/* 科目标签重写 */
.category-filter { display: flex; align-items: flex-start; }
.filter-label { font-size: 14px; color: var(--clr-olive); margin-right: 16px; flex-shrink: 0; padding-top: 6px; }
.category-tags { display: flex; flex-wrap: wrap; gap: 10px; }

.editorial-check-tag {
  background-color: transparent !important;
  border: 1px solid var(--clr-border-warm) !important;
  color: var(--clr-olive) !important;
  font-weight: normal !important;
  padding: 6px 16px !important;
  border-radius: 20px !important;
  transition: all 0.2s;
}
.editorial-check-tag:hover { background-color: var(--clr-parchment) !important; color: var(--clr-near-black) !important; }
.editorial-check-tag.is-checked {
  background-color: var(--clr-terracotta) !important;
  border-color: var(--clr-terracotta) !important;
  color: var(--clr-ivory) !important;
  font-weight: 500 !important;
  box-shadow: 0 2px 6px rgba(201, 100, 66, 0.2);
}

/* ================= 猜你喜欢 (柔和画框包裹) ================= */
.recommend-section {
  background-color: var(--clr-ivory);
  border: 1px solid var(--clr-border-warm);
  padding: 24px 32px 32px;
  border-radius: 16px;
  margin-bottom: 40px;
}
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.serif-title {
  font-family: var(--font-serif);
  margin: 0;
  font-size: 22px;
  font-weight: 500;
  color: var(--clr-near-black);
  display: flex;
  align-items: center;
}
.title-icon { margin-right: 10px; color: var(--clr-terracotta); font-size: 24px; }
.refresh-btn { display: flex; align-items: center; gap: 4px; color: var(--clr-terracotta); }

/* ================= 课程卡片 (大厅与推荐通用) ================= */
.hall-header { margin-bottom: 20px; padding: 0 8px; }
.course-grid { min-height: 400px; }

.course-card {
  border-radius: 12px;
  border: 1px solid var(--clr-border-cream);
  background-color: var(--clr-white);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  cursor: pointer;
  margin-bottom: 24px;
  position: relative;
}
.course-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 24px rgba(0,0,0,0.04) !important;
  border-color: var(--clr-border-warm);
}

/* 推荐专属角标 (陶土红) */
.recommend-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  background-color: var(--clr-terracotta);
  color: var(--clr-white);
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 16px;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(201, 100, 66, 0.3);
}

/* 封面区 */
.cover-wrapper { position: relative; width: 100%; height: 160px; overflow: hidden; border-top-left-radius: 11px; border-top-right-radius: 11px; border-bottom: 1px solid var(--clr-border-cream); }
.course-cover { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s; }
.course-card:hover .course-cover { transform: scale(1.05); }

/* 占位图 (暖沙色底) */
.no-cover-box {
  width: 100%; height: 100%;
  background-color: var(--clr-warm-sand);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  color: var(--clr-stone);
}
.no-cover-icon { font-size: 32px; margin-bottom: 8px; opacity: 0.6; }
.no-cover-text { font-size: 13px; font-style: italic; }

/* 文本信息区 */
.course-info { padding: 16px; }
.course-title { 
  margin: 0 0 12px 0; 
  font-family: var(--font-serif);
  font-size: 17px; 
  font-weight: 500;
  color: var(--clr-near-black); 
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
  height: 2.8em;
}

/* 家教信息行 */
.tutor-line { display: flex; align-items: center; margin-bottom: 12px; }
.tutor-avatar { border: 1px solid var(--clr-border-warm); }
.tutor-name { margin-left: 8px; font-size: 13px; color: var(--clr-olive); flex: 1; font-weight: 500; }
.city-text { font-size: 12px; color: var(--clr-stone); background: var(--clr-parchment); padding: 2px 6px; border-radius: 4px; }

/* 标签行 */
.tag-line { margin-bottom: 16px; display: flex; align-items: center; gap: 10px; }
.soft-tag {
  background-color: var(--clr-border-cream);
  color: var(--clr-charcoal);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}
/* 类型圆点指示器 */
.type-indicator { display: inline-flex; align-items: center; font-size: 12px; }
.type-dot { width: 5px; height: 5px; border-radius: 50%; margin-right: 6px; }
.type-online .type-dot { background-color: var(--clr-amber-warm); }
.type-online .type-text { color: var(--clr-amber-warm); }
.type-offline .type-dot { background-color: var(--clr-stone); }
.type-offline .type-text { color: var(--clr-stone); }

/* 价格与操作区 */
.price-line { display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid var(--clr-border-cream); padding-top: 12px; }
.price-box { display: flex; align-items: baseline; }
.price-symbol { color: var(--clr-terracotta); font-size: 14px; font-weight: 500; margin-right: 2px; }
.price-num { color: var(--clr-terracotta); font-size: 22px; font-weight: bold; font-family: monospace; }
.price-unit { color: var(--clr-stone); font-size: 12px; margin-left: 4px; }

.btn-action-small {
  background-color: var(--clr-warm-sand);
  color: var(--clr-charcoal);
  border: none;
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.course-card:hover .btn-action-small {
  background-color: var(--clr-terracotta);
  color: var(--clr-ivory);
}

/* ================= 分页器 ================= */
.pagination-wrapper { margin-top: 32px; display: flex; justify-content: center; }
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