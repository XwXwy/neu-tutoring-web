<template>
  <div class="mall-container">
    <!-- 1. 顶部搜索与筛选栏 -->
    <el-card shadow="never" class="filter-card">
      <el-row :gutter="20" align="middle">
        <el-col :span="6">
          <el-input v-model="query_params.title" placeholder="搜索课程标题..." prefix-icon="Search" clearable @change="handle_search" />
        </el-col>
        <el-col :span="5">
          <el-input v-model="query_params.city" placeholder="按城市筛选 (如: 沈阳市)" clearable @change="handle_search" />
        </el-col>
        <el-col :span="4">
          <el-button type="primary" @click="handle_search">查询</el-button>
          <el-button @click="reset_query">重置</el-button>
        </el-col>
        <el-col :span="9" style="text-align: right">
          <el-tag type="info" effect="plain">当前城市：{{ user_info.city || '未设置' }}</el-tag>
          <el-button link type="primary" @click="filter_by_my_city" style="margin-left: 10px;">只看同城</el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 2. 【新增】猜你喜欢 (专属推荐展位) -->
    <div class="recommend-section" v-if="recommend_list.length > 0">
      <div class="section-header">
        <h2 class="section-title"><span style="color: #FF9900;">✨</span> 猜你喜欢</h2>
        <!-- 换一换按钮 -->
        <el-button link type="primary" @click="handle_refresh_recommend" :icon="Refresh" class="refresh-btn">
          换一换
        </el-button>
      </div>
      
      <el-row :gutter="20">
        <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="item in recommend_list" :key="item.id">
          <el-card :body-style="{ padding: '0px' }" class="course-card recommend-card" shadow="hover" @click="go_detail(item.id)">
            <div class="recommend-badge">推荐</div>
            <!-- 如果有封面图则显示图片 -->
            <img v-if="item.cover_image" :src="item.cover_image" class="course-cover" />
            
            <!-- 如果没有封面图，显示一个漂亮的占位区域 -->
            <div v-else class="no-cover-box">
              <el-icon class="no-cover-icon"><Picture /></el-icon>
              <div class="no-cover-text">该课程暂无封面</div>
            </div>
            <div class="course-info">
              <h3 class="course-title">{{ item.title }}</h3>
              <div class="tutor-line">
                <el-avatar :size="24" :src="item.tutor_avatar" />
                <span class="tutor-name">{{ item.tutor_name }}</span>
              </div>
              <div class="price-line">
                <span class="price-symbol">¥</span>
                <span class="price-num">{{ item.price }}</span>
                <span class="price-unit">/课时</span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 3. 全站课程大厅 (加个标题区分) -->
    <h2 class="section-title" style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">🏫 发现好课</h2>
    <el-row :gutter="20" class="course-grid" v-loading="loading">
      <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="item in course_list" :key="item.id">
        <el-card :body-style="{ padding: '0px' }" class="course-card" hover shadow="hover" @click="go_detail(item.id)">
          <!-- 如果有封面图则显示图片 -->
          <img v-if="item.cover_image" :src="item.cover_image" class="course-cover" />
          
          <!-- 如果没有封面图，显示一个漂亮的占位区域 -->
          <div v-else class="no-cover-box">
            <el-icon class="no-cover-icon"><Picture /></el-icon>
            <div class="no-cover-text">该课程暂无封面</div>
          </div>
          <div class="course-info">
            <h3 class="course-title">{{ item.title }}</h3>
            <div class="tutor-line">
              <el-avatar :size="24" :src="item.tutor_avatar" />
              <span class="tutor-name">{{ item.tutor_name }}</span>
              <el-tag size="small" effect="light" class="city-tag">{{ item.city }}</el-tag>
            </div>
            <div class="tag-line">
              <el-tag size="small" type="info">{{ item.category_name }}</el-tag>
              <el-tag size="small" :type="item.type === 1 ? 'success' : 'warning'">
                {{ item.type === 1 ? '在线视频' : '线下上门' }}
              </el-tag>
            </div>
            <div class="price-line">
              <span class="price-symbol">¥</span>
              <span class="price-num">{{ item.price }}</span>
              <span class="price-unit">/课时</span>
              <el-button type="primary" size="small" class="book-btn" @click.stop="go_detail(item.id)">
                立即查看
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 4. 分页 -->
    <div class="pagination-box" v-if="course_list.length > 0">
      <el-pagination
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
import { Refresh } from '@element-plus/icons-vue' // 引入刷新图标

const router = useRouter()
const loading = ref(false)
const course_list = ref([])
const total = ref(0)
const user_info = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))

// 大厅列表的查询参数
const query_params = ref({
  page_num: 1,
  page_size: 8,
  title: '',
  city: '',
  category_id: null
})

// 【新增】推荐列表相关状态
const recommend_list = ref([])
const recommend_params = ref({
  page_num: 1,
  page_size: 4
})
const recommend_total_pages = ref(0)


// 获取大厅列表
const get_list = async () => {
  loading.value = true
  const res = await request.get('/course/mall/list', { params: query_params.value })
  course_list.value = res.data.records
  total.value = parseInt(res.data.total)
  loading.value = false
}

// 【新增】获取推荐列表
const get_recommend_list = async () => {
  try {
    const res = await request.get('/course/mall/recommend', { params: recommend_params.value })
    if (res.data && res.data.records.length > 0) {
      recommend_list.value = res.data.records
      recommend_total_pages.value = res.data.pages
    }
  } catch(error) {}
}

// 处理“换一换”
const handle_refresh_recommend = () => {
  // 1. 判断是否已经是最后一页
  if (recommend_params.value.page_num >= recommend_total_pages.value) {
    // 【核心修改】给用户一个友好的提示
    ElMessage({
      message: '已经到底啦，为您返回第一页推荐~',
      type: 'warning',
      duration: 1500 // 提示显示1.5秒
    });
    // 自动重置到第一页
    recommend_params.value.page_num = 1;
  } else {
    // 否则，页码加 1
    recommend_params.value.page_num++;
  }
  
  // 2. 重新获取推荐列表
  get_recommend_list();
}

// 大厅搜索
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
  // 如果是学生，就加载推荐列表
  if (user_info.value.role === 2) {
    get_recommend_list()
  }
})
</script>

<style scoped>
/* 推荐模块专属样式 */
.recommend-section {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 30px;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.section-title {
  margin: 0;
  font-size: 22px;
  color: #333;
}
.refresh-btn {
  font-size: 14px;
}
.recommend-card {
  position: relative;
  overflow: hidden;
}
.recommend-badge {
  position: absolute;
  top: 0;
  left: 0;
  background-color: #f56c6c;
  color: white;
  padding: 2px 8px;
  font-size: 12px;
  border-top-left-radius: 12px;
  border-bottom-right-radius: 12px;
  z-index: 10;
}
.recommend-card .price-line {
  border-top: none;
  padding-top: 0;
}
.recommend-card .course-info {
  padding-bottom: 10px;
}

/* 通用样式 */
.filter-card { margin-bottom: 20px; border-radius: 8px; }
.course-grid { min-height: 400px; }
.course-card { margin-bottom: 20px; border-radius: 12px; transition: all 0.3s; cursor: pointer; }
.course-card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
.course-cover { width: 100%; height: 180px; object-fit: cover; border-top-left-radius: 12px; border-top-right-radius: 12px; }
.course-info { padding: 15px; }
.course-title { margin: 0 0 10px 0; font-size: 16px; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tutor-line { display: flex; align-items: center; margin-bottom: 12px; }
.tutor-name { margin-left: 8px; font-size: 14px; color: #666; flex: 1; }
.city-tag { font-size: 10px; }
.tag-line { margin-bottom: 15px; display: flex; gap: 5px; }
.price-line { display: flex; align-items: baseline; border-top: 1px solid #f0f0f0; padding-top: 12px; }
.price-symbol { color: #f56c6c; font-size: 14px; font-weight: bold; }
.price-num { color: #f56c6c; font-size: 22px; font-weight: bold; margin: 0 2px; }
.price-unit { color: #999; font-size: 12px; flex: 1; }
.book-btn { border-radius: 20px; padding: 8px 15px; }
.pagination-box { display: flex; justify-content: center; margin-top: 30px; }

/* 暂无封面的占位框样式 */
.no-cover-box {
  width: 100%;
  height: 180px; /* 保持与图片高度一致 */
  background-color: #f5f7fa;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #909399;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
}
.no-cover-icon {
  font-size: 40px;
  margin-bottom: 8px;
  opacity: 0.5;
}
.no-cover-text {
  font-size: 14px;
  letter-spacing: 1px;
}
</style>