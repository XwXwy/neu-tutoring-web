<template>
  <div class="editorial-page-container" v-loading="loading">
    
    <!-- ================= 1. 顶部核心指标区 (权威数字排版) ================= -->
    <el-row :gutter="24" class="panel-group">
      <el-col :xs="12" :sm="12" :md="6" :lg="6">
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">总学生用户</span>
            <el-icon class="metric-icon"><User /></el-icon>
          </div>
          <div class="metric-content">
            <span class="metric-num">{{ stat_data.total_users || 0 }}</span>
          </div>
        </div>
      </el-col>
      
      <el-col :xs="12" :sm="12" :md="6" :lg="6">
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">已入驻家教</span>
            <el-icon class="metric-icon"><Avatar /></el-icon>
          </div>
          <div class="metric-content">
            <span class="metric-num">{{ stat_data.total_tutors || 0 }}</span>
          </div>
        </div>
      </el-col>
      
      <el-col :xs="12" :sm="12" :md="6" :lg="6">
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">平台累计订单</span>
            <el-icon class="metric-icon"><Tickets /></el-icon>
          </div>
          <div class="metric-content">
            <span class="metric-num">{{ stat_data.total_orders || 0 }}</span>
          </div>
        </div>
      </el-col>
      
      <el-col :xs="12" :sm="12" :md="6" :lg="6">
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">累计交易流水</span>
            <el-icon class="metric-icon"><Money /></el-icon>
          </div>
          <div class="metric-content">
            <span class="metric-currency">¥</span>
            <span class="metric-num">{{ stat_data.total_revenue || '0.00' }}</span>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- ================= 2. 中间分析区 ================= -->
    <el-row :gutter="24" class="middle-section">
      <!-- 左：订单状态分布 (环形图) -->
      <el-col :xs="24" :md="8">
        <el-card shadow="never" class="editorial-card chart-card">
          <div class="card-header">
            <h3 class="serif-title"><el-icon><PieChart /></el-icon> 订单状态流转</h3>
          </div>
          <div ref="chart_status_ref" class="chart-box"></div>
        </el-card>
      </el-col>

      <!-- 中：热门辅导科目 (条形图) -->
      <el-col :xs="24" :md="8">
        <el-card shadow="never" class="editorial-card chart-card">
          <div class="card-header">
            <h3 class="serif-title"><el-icon><DataAnalysis /></el-icon> 热门辅导科目</h3>
          </div>
          <div ref="chart_subject_ref" class="chart-box"></div>
        </el-card>
      </el-col>

      <!-- 右：系统公告 (杂志化排版) -->
      <el-col :xs="24" :md="8">
        <el-card shadow="never" class="editorial-card notice-card">
          <div class="card-header notice-header">
            <h3 class="serif-title"><el-icon><BellFilled /></el-icon> 平台公告</h3>
            <button class="btn-text-action" @click="router.push('/notice-list')">更多</button>
          </div>
          <div v-if="notice_list.length > 0" class="notice-list">
            <div 
              v-for="item in notice_list" 
              :key="item.id" 
              class="notice-item" 
              @click="router.push({path:'/notice-detail', query:{id:item.id}})"
            >
              <div class="notice-main">
<span 
  class="notice-tag" 
  :class="[
    item.type === 0 ? 'tag-sys' : 
    item.type === 1 ? 'tag-activity' : 
    'tag-policy'
  ]"
>
  {{ 
    item.type === 0 ? '系统更新' : 
    item.type === 1 ? '活动通知' : 
    '政策变更' 
  }}
</span>
                <span class="notice-title-text">{{ item.title }}</span>
              </div>
              <div class="notice-time">{{ item.create_time.split(' ')[0] }}</div>
            </div>
          </div>
          <div v-else class="empty-state">
            <el-empty description="暂时没有新的公告" :image-size="60" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- ================= 3. 底部趋势区 ================= -->
    <el-row :gutter="24" class="bottom-section">
      <el-col :span="24">
        <el-card shadow="never" class="editorial-card chart-card">
          <div class="card-header">
            <h3 class="serif-title"><el-icon><TrendCharts /></el-icon> 平台订单增长趋势</h3>
          </div>
          <div ref="chart_trend_ref" class="chart-box-large"></div>
        </el-card>
      </el-col>
    </el-row>

  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, markRaw } from 'vue'
import request from '../utils/request'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { User, Avatar, Tickets, Money, PieChart, DataAnalysis, BellFilled, TrendCharts } from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(true)
const stat_data = ref({})
const notice_list = ref([])

const chart_status_ref = ref(null)
const chart_subject_ref = ref(null)
const chart_trend_ref = ref(null)

let chart_instances = []

// Claude 美学色板 (供 ECharts 使用)
const clr = {
  terracotta: '#c96442',
  coral: '#d97757',
  amber: '#d98f3e',
  olive: '#5e5d59',
  stone: '#87867f',
  charcoal: '#4d4c48',
  warm_sand: '#e8e6dc',
  ivory: '#faf9f5',
  parchment: '#f5f4ed'
}
// tooltip 通用配置
const tooltip_config = {
  backgroundColor: clr.ivory,
  borderColor: clr.warm_sand,
  textStyle: { color: '#141413', fontFamily: 'system-ui, sans-serif' }
}

const load_dashboard_data = async () => {
  try {
    const res = await request.get('/dashboard/statistics')
    stat_data.value = res.data
    notice_list.value = res.data.recent_notices || []
    
    nextTick(() => {
      init_status_chart(res.data.order_status_data)
      init_subject_chart(res.data.subject_distribution)
      init_trend_chart(res.data.monthly_trend_data)
    })
  } finally {
    loading.value = false
  }
}

// 1. 环形图 (高对比度人文色板)
const init_status_chart = (data) => {
  if (!chart_status_ref.value) return
  const chart = markRaw(echarts.init(chart_status_ref.value))
  chart_instances.push(chart)
  
  chart.setOption({
    tooltip: { trigger: 'item', ...tooltip_config },
    legend: { 
      bottom: '0%', 
      left: 'center', 
      itemWidth: 10, 
      itemHeight: 10, 
      textStyle: { fontSize: 12, color: clr.olive } 
    },
    // --- 核心优化：高对比度色板 ---
    color: [
      clr.terracotta, 
      '#141413',       
      clr.amber,   
      '#5e5d59',   
      '#e8e6dc',       
      '#ff7b7d'        
    ],
    series: [
      {
        name: '订单状态',
        type: 'pie',
        radius: ['50%', '70%'], 
        center: ['50%', '42%'],
        avoidLabelOverlap: false,
        itemStyle: { 
          borderRadius: 4, 
          borderColor: clr.ivory, // 象牙白边框线，增加间隙感
          borderWidth: 3 
        },
        label: { show: false },
        data: data
      }
    ]
  })
}

// 2. 条形图 (陶土红渐变)
const init_subject_chart = (data) => {
  if (!chart_subject_ref.value || !data) return
  const chart = markRaw(echarts.init(chart_subject_ref.value))
  chart_instances.push(chart)
  
  const y_axis_data = data.map(item => item.name).reverse() 
  const x_axis_data = data.map(item => item.value).reverse()

  chart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(232, 230, 220, 0.4)' } }, ...tooltip_config },
    grid: { left: '3%', right: '12%', bottom: '3%', top: '5%', containLabel: true },
    xAxis: { type: 'value', show: false }, 
    yAxis: { type: 'category', data: y_axis_data, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: clr.olive } },
    series: [
      {
        name: '课程数量',
        type: 'bar',
        barWidth: 16,
        data: x_axis_data,
        itemStyle: {
          borderRadius: [0, 4, 4, 0],
          // 使用陶土红至珊瑚色的柔和渐变
          color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
            { offset: 0, color: clr.coral },
            { offset: 1, color: clr.terracotta }
          ])
        },
        label: { show: true, position: 'right', color: clr.terracotta, fontWeight: '500', fontFamily: 'monospace' }
      }
    ]
  })
}

// 3. 趋势图 (沉静折柱)
const init_trend_chart = (data) => {
  if (!chart_trend_ref.value || !data) return
  const chart = markRaw(echarts.init(chart_trend_ref.value))
  chart_instances.push(chart)
  
  const x_data = data.map(item => item.month)
  const y_data = data.map(item => item.order_count)

  chart.setOption({
    tooltip: { trigger: 'axis', ...tooltip_config },
    grid: { left: '2%', right: '2%', bottom: '5%', top: '15%', containLabel: true },
    xAxis: { 
      type: 'category', data: x_data, 
      axisLine: { lineStyle: { color: clr.warm_sand } }, 
      axisLabel: { color: clr.olive },
      axisTick: { show: false }
    },
    yAxis: { 
      type: 'value', 
      splitLine: { lineStyle: { type: 'dashed', color: clr.warm_sand } },
      axisLabel: { color: clr.stone, fontFamily: 'monospace' }
    },
    series: [
      {
        name: '基础订单量',
        type: 'bar',
        barWidth: 24,
        // 背景柱子使用极弱的暖沙色，退居幕后
        itemStyle: { borderRadius: [4, 4, 0, 0], color: clr.coral },
        data: y_data
      },
      {
        name: '订单量趋势',
        type: 'line',
        smooth: true, 
        symbolSize: 8,
        // 折线使用显眼的陶土红，去除浮夸的发光阴影
        itemStyle: { color: clr.terracotta },
        lineStyle: { width: 3 },
        data: y_data,
        tooltip: { show: false }
      }
    ]
  })
}

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
/* ================= 美学色板与变量定义 ================= */
* {
  --clr-parchment: #f5f4ed;     /* 羊皮纸底色 */
  --clr-ivory: #faf9f5;         /* 卡片象牙白 */
  --clr-white: #ffffff;
  --clr-near-black: #141413;    /* 墨黑主文本 */
  
  --clr-terracotta: #c96442;    /* 陶土红 (核心品牌色) */
  --clr-coral: #d97757;         /* 珊瑚色 */
  --clr-amber-warm: #d98f3e;    
  
  --clr-olive: #5e5d59;         /* 橄榄灰 (次级文本) */
  --clr-stone: #87867f;         /* 石板灰 (辅助数字) */
  --clr-charcoal: #4d4c48;      
  
  --clr-warm-sand: #e8e6dc;     /* 暖沙色 (分隔/底图) */
  --clr-border-cream: #f0eee6;  /* 柔和边框 */
  --clr-border-warm: #e8e6dc;   
  
  --font-serif: "Georgia", "Times New Roman", serif;
  --font-sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.editorial-page-container {
  font-family: var(--font-sans);
  padding-bottom: 40px;
}

/* ================= 1. 核心指标卡片重构 ================= */
.panel-group {
  margin-bottom: 24px;
}
.metric-card {
  background-color: var(--clr-ivory);
  border: 1px solid var(--clr-border-cream);
  border-top: 3px solid var(--clr-terracotta); /* 顶部红线作为品牌点缀 */
  border-radius: 8px;
  padding: 24px;
  box-shadow: rgba(0, 0, 0, 0.02) 0px 4px 12px;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease;
  height: 100%;
  box-sizing: border-box;
}
.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: rgba(0, 0, 0, 0.04) 0px 8px 24px;
  border-color: var(--clr-border-warm);
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.metric-label {
  font-size: 14px;
  color: var(--clr-olive);
  font-weight: 500;
}
.metric-icon {
  font-size: 20px;
  color: var(--clr-stone);
  opacity: 0.6;
}

.metric-content {
  display: flex;
  align-items: baseline;
  margin-top: auto;
}
.metric-currency {
  font-size: 18px;
  color: var(--clr-near-black);
  margin-right: 4px;
  font-weight: 500;
}
.metric-num {
  font-family: var(--font-serif);
  font-size: 36px;
  font-weight: 500;
  color: var(--clr-near-black);
  line-height: 1;
}

/* ================= 2. 中间分析区与图表卡片 ================= */
.middle-section { margin-bottom: 24px; }
.bottom-section { margin-bottom: 24px; }

.editorial-card {
  background-color: var(--clr-ivory);
  border: 1px solid var(--clr-border-cream);
  border-radius: 12px;
  box-shadow: rgba(0, 0, 0, 0.02) 0px 4px 12px !important;
  height: 100%;
}
.chart-card { display: flex; flex-direction: column; }
:deep(.editorial-card .el-card__body) { 
  padding: 24px; 
  flex: 1;
  display: flex;
  flex-direction: column;
}

.card-header {
  margin-bottom: 20px;
}
.serif-title {
  font-family: var(--font-serif);
  font-size: 18px;
  font-weight: 500;
  color: var(--clr-near-black);
  margin: 0;
  display: flex;
  align-items: center;
}
.serif-title .el-icon { margin-right: 8px; color: var(--clr-terracotta); }

.chart-box { width: 100%; height: 260px; flex: 1; }
.chart-box-large { width: 100%; height: 320px; }

/* ================= 3. 公告列表杂志化 ================= */
.notice-card { height: 100%; }
.notice-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--clr-border-cream);
  padding-bottom: 16px;
  margin-bottom: 16px;
}
.btn-text-action {
  background: transparent;
  border: none;
  color: var(--clr-olive);
  font-size: 13px;
  cursor: pointer;
  transition: color 0.2s;
}
.btn-text-action:hover { color: var(--clr-terracotta); }

.notice-list {
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
}
/* 隐藏滚动条 */
.notice-list::-webkit-scrollbar { width: 4px; }
.notice-list::-webkit-scrollbar-thumb { background: var(--clr-border-warm); border-radius: 4px; }

.notice-item {
  padding: 14px 0;
  border-bottom: 1px solid var(--clr-border-cream);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.notice-item:last-child { border-bottom: none; }
.notice-item:hover {
  background-color: var(--clr-parchment);
  padding-left: 8px;
  padding-right: 8px;
  border-radius: 6px;
  border-bottom-color: transparent;
}

.notice-main {
  display: flex;
  align-items: center;
}
/* 标签克制化设计 */
.notice-tag {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  margin-right: 10px;
  font-weight: 500;
  border: 1px solid;
}
.tag-sys { 
  color: var(--clr-danger-red); 
  border-color: rgba(176, 42, 42, 0.15); 
  background-color: rgba(176, 42, 42, 0.06); 
}
.tag-activity { 
  color: var(--clr-amber-warm); 
  border-color: rgba(217, 143, 62, 0.2); 
  background-color: rgba(217, 143, 62, 0.1); 
}
.tag-policy { 
  color: var(--clr-charcoal); 
  border-color: var(--clr-border-warm); 
  background-color: var(--clr-border-cream); 
}

.notice-title-text {
  font-size: 14px;
  color: var(--clr-near-black);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}
.notice-item:hover .notice-title-text { color: var(--clr-terracotta); }

.notice-time {
  font-size: 12px;
  color: var(--clr-stone);
  font-family: monospace;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>