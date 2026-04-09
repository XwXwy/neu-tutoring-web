
<template>
  <div class="dashboard-container" v-loading="loading">
    
    <!-- 1. 顶部核心数据指标卡片 -->
    <el-row :gutter="20" class="panel-group">
      <el-col :xs="12" :sm="12" :md="6" :lg="6">
        <el-card shadow="hover" class="data-card bg-blue">
          <div class="card-icon"><el-icon><User /></el-icon></div>
          <div class="card-info">
            <div class="card-title">总学生用户</div>
            <div class="card-num">{{ stat_data.total_users || 0 }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6" :lg="6">
        <el-card shadow="hover" class="data-card bg-green">
          <div class="card-icon"><el-icon><Avatar /></el-icon></div>
          <div class="card-info">
            <div class="card-title">入驻家教数</div>
            <div class="card-num">{{ stat_data.total_tutors || 0 }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6" :lg="6">
        <el-card shadow="hover" class="data-card bg-orange">
          <div class="card-icon"><el-icon><Tickets /></el-icon></div>
          <div class="card-info">
            <div class="card-title">累计订单量</div>
            <div class="card-num">{{ stat_data.total_orders || 0 }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6" :lg="6">
        <el-card shadow="hover" class="data-card bg-red">
          <div class="card-icon"><el-icon><Money /></el-icon></div>
          <div class="card-info">
            <div class="card-title">平台总流水 (元)</div>
            <div class="card-num">¥ {{ stat_data.total_revenue || '0.00' }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 2. 图表与系统公告区域 -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <!-- 左侧：ECharts 饼图 -->
      <el-col :xs="24" :md="16">
        <el-card shadow="never" class="chart-card">
          <template #header>
            <div class="card-header">
              <span style="font-weight: bold;"><el-icon><PieChart /></el-icon> 平台订单状态分布</span>
            </div>
          </template>
          <!-- 图表容器，必须指定高度 -->
          <div ref="chart_ref" style="width: 100%; height: 350px;"></div>
        </el-card>
      </el-col>

      <!-- 右侧：系统公告 -->
          <el-col :xs="24" :md="8">
            <el-card shadow="never" class="notice-card">
              <template #header>
                <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-weight: bold; color: #E6A23C;"><el-icon><BellFilled /></el-icon> 最新系统公告</span>
                  <!-- 【新增】查看全部按钮 -->
                  <el-button link type="primary" @click="router.push('/notice-list')">全部公告</el-button>
                </div>
              </template>
              
              <div v-if="notice_list.length > 0" class="notice-list">
                <!-- 【修改】给每个 item 加上点击事件 -->
                <div 
                  v-for="item in notice_list" 
                  :key="item.id" 
                  class="notice-item" 
                  @click="go_to_notice_detail(item.id)"
                >
              <div class="notice-title">
                <el-tag size="small" :type="item.type === 0 ? 'danger' : (item.type === 1 ? 'warning' : 'primary')" class="notice-tag">
                  {{ item.type === 0 ? '系统' : (item.type === 1 ? '活动' : '政策') }}
                </el-tag>
                <span class="title-text">{{ item.title }}</span>
              </div>
              <div class="notice-content">{{ item.content }}</div>
              <div class="notice-time">{{ item.create_time }}</div>
            </div>
          </div>
          <el-empty v-else description="暂无最新公告" :image-size="100" />
          
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import request from '../utils/request'
// 引入 ECharts
import * as echarts from 'echarts'

const loading = ref(true)
const stat_data = ref({})
const notice_list = ref([])

// 获取图表 DOM 容器的引用
const chart_ref = ref(null)
let my_chart = null
import { useRouter } from 'vue-router'
const router = useRouter()

// 跳转到公告详情页的方法
const go_to_notice_detail = (id) => {
  router.push({ path: '/notice-detail', query: { id } })
}
// 加载看板数据
const load_dashboard_data = async () => {
  try {
    const res = await request.get('/dashboard/statistics')
    stat_data.value = res.data
    notice_list.value = res.data.recent_notices ||[]
    
    // 数据加载完毕后，初始化图表
    nextTick(() => {
      init_echarts(res.data.order_status_data)
    })
  } finally {
    loading.value = false
  }
}

// 初始化 ECharts 饼图
const init_echarts = (pie_data) => {
  if (!chart_ref.value) return
  
  // 初始化 echarts 实例
  my_chart = echarts.init(chart_ref.value)
  
  // 配置项
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b} : {c} 单 ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    color:['#E6A23C', '#F56C6C', '#409EFF', '#67C23A', '#909399', '#8e44ad'],
    series: [
      {
        name: '订单状态',
        type: 'pie',
        radius:['40%', '70%'], // 环形图效果
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: pie_data // 后端传来的动态数据
      }
    ]
  }
  
  // 渲染图表
  my_chart.setOption(option)
}

// 监听窗口大小变化，让图表自适应缩放
const handle_resize = () => {
  if (my_chart) {
    my_chart.resize()
  }
}

onMounted(() => {
  load_dashboard_data()
  window.addEventListener('resize', handle_resize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handle_resize)
  if (my_chart) {
    my_chart.dispose()
  }
})
</script>

<style scoped>
.dashboard-container {
  padding: 10px 0;
}

/* 顶部卡片样式 */
.data-card {
  border-radius: 10px;
  border: none;
  color: #fff;
  margin-bottom: 20px;
}
.data-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  padding: 20px;
}
.card-icon {
  font-size: 48px;
  opacity: 0.8;
  margin-right: 15px;
}
.card-info {
  flex: 1;
}
.card-title {
  font-size: 14px;
  margin-bottom: 10px;
  opacity: 0.9;
}
.card-num {
  font-size: 26px;
  font-weight: bold;
}

/* 四种颜色主题 */
.bg-blue { background: linear-gradient(135deg, #409EFF, #73b3f3); }
.bg-green { background: linear-gradient(135deg, #67C23A, #95d475); }
.bg-orange { background: linear-gradient(135deg, #E6A23C, #f3d19e); }
.bg-red { background: linear-gradient(135deg, #F56C6C, #f89898); }

/* 公告列表样式 */
.notice-card {
  height: 430px;
  overflow-y: auto;
}
/* 修改公告列表样式，增加悬停效果 */
.notice-item {
  padding: 12px 15px;
  border-bottom: 1px dashed #ebeef5;
  cursor: pointer;
  transition: all 0.3s ease; /* 平滑过渡 */
  border-radius: 6px;
}
.notice-item:last-child {
  border-bottom: none;
}
.notice-item:hover {
  background-color: #f5f7fa; /* 悬停时背景变灰 */
  transform: translateX(8px); /* 悬停时整体向右微微滑动，交互感极强 */
}
.notice-title {
  font-size: 15px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  transition: color 0.3s;
}
.notice-item:hover .title-text {
  color: #409EFF; /* 悬停时标题文字变蓝 */
}
.notice-tag {
  margin-right: 8px;
}
.title-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.notice-content {
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2; /* 最多显示两行 */
  overflow: hidden;
}
.notice-time {
  font-size: 12px;
  color: #999;
  text-align: right;
}
</style>
