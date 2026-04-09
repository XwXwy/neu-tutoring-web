<template>
  <div class="notice-list-container" v-loading="loading">
    <!-- 顶部导航条 -->
    <el-button icon="ArrowLeft" @click="router.back()" style="margin-bottom: 20px;">返回首页</el-button>

    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span style="font-weight: bold; font-size: 18px; color: #303133;">
            <el-icon><Notification /></el-icon> 平台历史公告
          </span>
        </div>
      </template>

      <!-- 公告列表区域 -->
      <div v-if="notice_list.length > 0" class="list-wrapper">
        <div 
          v-for="item in notice_list" 
          :key="item.id" 
          class="notice-item-hover" 
          @click="go_to_detail(item.id)"
        >
          <div class="notice-title-box">
            <el-tag size="small" :type="item.type === 0 ? 'danger' : (item.type === 1 ? 'warning' : 'primary')" class="notice-tag">
              {{ item.type === 0 ? '系统' : (item.type === 1 ? '活动' : '政策') }}
            </el-tag>
            <span class="notice-title">{{ item.title }}</span>
          </div>
          <div class="notice-time">{{ item.create_time }}</div>
        </div>
      </div>
      <el-empty v-else description="暂无公告发布" />

      <!-- 分页 -->
      <div style="margin-top: 30px; display: flex; justify-content: center;">
        <el-pagination
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
	
	import { ref, onMounted } from 'vue'
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
	
	// 获取公共公告列表
	const get_list = async () => {
	  loading.value = true
	  const res = await request.get('/notice/page', { params: query_params.value })
	  notice_list.value = res.data.records
	  total.value = parseInt(res.data.total)
	  loading.value = false
	}
	
	// 跳转到详情页
	const go_to_detail = (id) => {
	  router.push({ path: '/notice-detail', query: { id } })
	}
	
	onMounted(() => {
	  get_list()
	})
	
</script>

<style scoped>
.notice-list-container {
  max-width: 900px;
  margin: 0 auto;
}

.notice-item-hover {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 20px;
  border-bottom: 1px solid #f0f2f5;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  background-color: #fff;
}
.notice-item-hover:hover {
  background-color: #fafafa;
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-radius: 8px;
}

.notice-title-box {
  display: flex;
  align-items: center;
}
.notice-tag {
  flex-shrink: 0; /* 防止标签被压缩 */
  margin-right: 15px;
}
.notice-title {
  font-size: 16px;
  color: #303133;
  font-weight: 500;
  transition: color 0.2s;
}
.notice-item-hover:hover .notice-title {
  color: #409EFF; /* 鼠标悬停时标题变蓝 */
}

.notice-time {
  font-size: 14px;
  color: #909399;
}
</style>