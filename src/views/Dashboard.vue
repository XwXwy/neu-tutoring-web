<template>
  <div class="dashboard-container" v-loading="loading">
    
    <!-- ================= 1. 顶部核心指标区 (微渐变卡片) ================= -->
    <el-row :gutter="20" class="panel-group">
      <el-col :xs="12" :sm="12" :md="6" :lg="6">
        <div class="data-card bg-blue">
          <div class="card-title">总学生用户</div>
          <div class="card-content">
            <span class="card-num">{{ stat_data.total_users || 0 }}</span>
            <el-icon class="card-icon"><User /></el-icon>
          </div>
          <div class="card-bottom-line"></div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6" :lg="6">
        <div class="data-card bg-cyan">
          <div class="card-title">已入驻家教</div>
          <div class="card-content">
            <span class="card-num">{{ stat_data.total_tutors || 0 }}</span>
            <el-icon class="card-icon"><Avatar /></el-icon>
          </div>
          <div class="card-bottom-line"></div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6" :lg="6">
        <div class="data-card bg-green">
          <div class="card-title">平台累计订单</div>
          <div class="card-content">
            <span class="card-num">{{ stat_data.total_orders || 0 }}</span>
            <el-icon class="card-icon"><Tickets /></el-icon>
          </div>
          <div class="card-bottom-line"></div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="12" :md="6" :lg="6">
        <div class="data-card bg-orange">
          <div class="card-title">累计交易流水</div>
          <div class="card-content">
            <span class="card-num">¥ {{ stat_data.total_revenue || '0.00' }}</span>
            <el-icon class="card-icon"><Money /></el-icon>
          </div>
          <div class="card-bottom-line"></div>
        </div>
      </el-col>
    </el-row>

    <!-- ================= 2. 中间分析区 ================= -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <!-- 左：订单状态分布 (环形图) -->
      <el-col :xs="24" :md="8">
        <el-card shadow="never" class="chart-card">
          <div class="card-header-title">
            <el-icon><PieChart /></el-icon> 订单状态流转分析
          </div>
          <div ref="chart_status_ref" class="chart-box"></div>
        </el-card>
      </el-col>

      <!-- 中：热门辅导科目 (条形图) -->
      <el-col :xs="24" :md="8">
        <el-card shadow="never" class="chart-card">
          <div class="card-header-title">
            <el-icon><DataAnalysis /></el-icon> 热门辅导科目排行
          </div>
          <div ref="chart_subject_ref" class="chart-box"></div>
        </el-card>
      </el-col>

      <!-- 右：系统公告 (保留实用功能) -->
      <el-col :xs="24" :md="8">
        <el-card shadow="never" class="notice-card">
          <div class="card-header-title" style="display:flex; justify-content:space-between; width:100%;">
            <span><el-icon color="#E6A23C"><BellFilled /></el-icon> 平台公告</span>
            <el-button link type="primary" @click="router.push('/notice_list')">更多 >></el-button>
          </div>
          <div v-if="notice_list.length > 0" class="notice-list">
            <div v-for="item in notice_list" :key="item.id" class="notice-item" @click="router.push({path:'/notice-detail', query:{id:item.id}})">
              <div class="notice-title">
                <el-tag size="small" :type="item.type === 0 ? 'danger' : 'primary'" class="notice-tag">
                  {{ item.type === 0 ? '系统' : '活动' }}
                </el-tag>
                <span class="title-text">{{ item.title }}</span>
              </div>
              <div class="notice-time">{{ item.create_time.split(' ')[0] }}</div>
            </div>
          </div>
          <el-empty v-else description="暂无公告" :image-size="60" />
        </el-card>
      </el-col>
    </el-row>

    <!-- ================= 3. 底部趋势区 ================= -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card shadow="never" class="chart-card">
          <div class="card-header-title">
            <el-icon><TrendCharts /></el-icon> 近期平台订单增长趋势
          </div>
          <div ref="chart_trend_ref" style="width: 100%; height: 320px;"></div>
        </el-card>
      </el-col>
    </el-row>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import request from '../utils/request'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { User, Avatar, Tickets, Money, PieChart, DataAnalysis, BellFilled, TrendCharts } from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(true)
const stat_data = ref({})
const notice_list = ref([])

// 图表 DOM 引用
const chart_status_ref = ref(null)
const chart_subject_ref = ref(null)
const chart_trend_ref = ref(null)

// 保存图表实例以便后续销毁或重置大小
let chart_instances =[]

// 加载看板数据
const load_dashboard_data = async () => {
  try {
    const res = await request.get('/dashboard/statistics')
    stat_data.value = res.data
    notice_list.value = res.data.recent_notices ||[]
    
    nextTick(() => {
      init_status_chart(res.data.order_status_data)
      init_subject_chart(res.data.subject_distribution)
      init_trend_chart(res.data.monthly_trend_data)
    })
  } finally {
    loading.value = false
  }
}

// 1. 初始化环形图 (订单状态)
const init_status_chart = (data) => {
  if (!chart_status_ref.value) return
  const chart = echarts.init(chart_status_ref.value)
  chart_instances.push(chart)
  
  chart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: '0%', left: 'center', itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 12 } },
    color:['#FF9F7F', '#37A2DA', '#9FE6B8', '#32C5E9', '#FB7293', '#E062AE'],
    series:[
      {
        name: '订单状态',
        type: 'pie',
        radius: ['50%', '70%'], // 环形
        center: ['50%', '42%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 5, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        data: data
      }
    ]
  })
}

// 2. 初始化条形图 (热门科目)
const init_subject_chart = (data) => {
  if (!chart_subject_ref.value || !data) return
  const chart = echarts.init(chart_subject_ref.value)
  chart_instances.push(chart)
  
  const y_axis_data = data.map(item => item.name).reverse() // ECharts 条形图是从下往上画的
  const x_axis_data = data.map(item => item.value).reverse()

  chart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '10%', bottom: '3%', top: '5%', containLabel: true },
    xAxis: { type: 'value', show: false }, // 隐藏 X 轴
    yAxis: { type: 'category', data: y_axis_data, axisLine: { show: false }, axisTick: { show: false } },
    series:[
      {
        name: '课程数量',
        type: 'bar',
        barWidth: 15,
        data: x_axis_data,
        itemStyle: {
          borderRadius:[0, 10, 10, 0],
          // 参考图中的蓝紫渐变
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0,[
            { offset: 0, color: '#83bff6' },
            { offset: 1, color: '#188df0' }
          ])
        },
        label: { show: true, position: 'right', color: '#188df0', fontWeight: 'bold' }
      }
    ]
  })
}

// 3. 初始化趋势图 (折柱混合)
const init_trend_chart = (data) => {
  if (!chart_trend_ref.value || !data) return
  const chart = echarts.init(chart_trend_ref.value)
  chart_instances.push(chart)
  
  const x_data = data.map(item => item.month)
  const y_data = data.map(item => item.order_count)

  chart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '2%', right: '2%', bottom: '5%', top: '15%', containLabel: true },
    xAxis: { type: 'category', data: x_data, axisLine: { lineStyle: { color: '#ddd' } }, axisLabel: { color: '#666' } },
    yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed', color: '#eee' } } },
    series:[
      {
        name: '订单量',
        type: 'bar',
        barWidth: 20,
        itemStyle: { borderRadius:[4, 4, 0, 0], color: '#32C5E9' },
        data: y_data
      },
      {
        name: '订单量 (趋势)',
        type: 'line',
        smooth: true, // 平滑曲线
        symbolSize: 8,
        itemStyle: { color: '#FF9F7F' },
        lineStyle: { width: 3, shadowColor: 'rgba(255, 159, 127, 0.5)', shadowBlur: 10 },
        data: y_data,
		        tooltip: {
		          show: false
		        }
      }
    ]
  })
}

// 窗口自适应
const handle_resize = () => {
  chart_instances.forEach(chart => chart.resize())
}

onMounted(() => {
  load_dashboard_data()
  window.addEventListener('resize', handle_resize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handle_resize)
  chart_instances.forEach(chart => chart.dispose())
})
</script>

<style scoped>
.dashboard-container { padding: 10px 0; background-color: #f0f2f5; min-height: calc(100vh - 60px); }

/* ==== 顶部指标卡片美化 (致敬参考图的微渐变) ==== */
.data-card {
  border-radius: 12px;
  padding: 20px;
  color: white;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  transition: transform 0.3s;
}
.data-card:hover { transform: translateY(-5px); }

.card-title { font-size: 15px; margin-bottom: 10px; opacity: 0.9; letter-spacing: 1px; }
.card-content { display: flex; justify-content: space-between; align-items: baseline; }
.card-num { font-size: 32px; font-weight: bold; font-family: 'Arial', sans-serif; }
.card-icon { font-size: 40px; opacity: 0.2; position: absolute; right: -10px; bottom: -10px; }

/* 卡片底部的进度条装饰线 */
.card-bottom-line {
  height: 4px; width: 40px; background-color: rgba(255,255,255,0.5);
  border-radius: 2px; margin-top: 15px;
}

/* 四大配色方案 */
.bg-blue { background: linear-gradient(135deg, #5b8ff9, #3a73df); }
.bg-cyan { background: linear-gradient(135deg, #4bd1f4, #1ba4c8); }
.bg-green { background: linear-gradient(135deg, #74e3a4, #4dbd7f); }
.bg-orange { background: linear-gradient(135deg, #ffb45d, #e39334); }

/* ==== 中间与底部卡片通用 ==== */
.chart-card, .notice-card { border-radius: 12px; border: none; box-shadow: 0 2px 12px rgba(0,0,0,0.04); height: 100%; }
.card-header-title { font-size: 16px; font-weight: bold; color: #303133; padding-bottom: 15px; border-bottom: 1px solid #f0f0f0; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; }
.chart-box { width: 100%; height: 260px; }

/* ==== 公告列表精简美化 ==== */
.notice-card { height: 340px; } /* 和旁边的图表等高 */
.notice-list { height: 250px; overflow-y: auto; }
.notice-item { padding: 10px 0; border-bottom: 1px dashed #ebeef5; cursor: pointer; transition: all 0.2s; }
.notice-item:hover { background-color: #f5f7fa; padding-left: 5px; }
.notice-title { font-size: 14px; color: #333; margin-bottom: 5px; display: flex; align-items: center; }
.notice-tag { margin-right: 8px; }
.title-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
.notice-time { font-size: 12px; color: #999; text-align: right; }
</style>
