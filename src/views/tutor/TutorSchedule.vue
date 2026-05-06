
<template>
  <div class="editorial-page-container" v-loading="loading">
    <el-card shadow="never" class="editorial-card main-card">
      <template #header>
        <div class="card-header">
          <span class="header-title">
            <el-icon class="title-icon"><Calendar /></el-icon> 教学日程手账
          </span>
          <!-- 显示模式切换开关 -->
          <el-switch 
            v-model="is_show_all" 
            active-text="全部待办" 
            inactive-text="单日明细" 
            class="warm-switch"
          />
        </div>
      </template>

      <!-- 1. 顶部直观日历 -->
      <div class="calendar-wrapper">
        <el-calendar v-model="selected_date" class="editorial-calendar">
          <template #date-cell="{ data }">
            <div class="calendar-cell" :class="{ 'is-active-day': is_selected_day(data.day) }">
              <span class="date-text">
                {{ data.day.split('-')[2] }}
              </span>
              <!-- 课程数量角标 -->
              <div v-if="get_schedule_count(data.day) > 0" class="schedule-badge">
                <span class="badge-dot"></span> {{ get_schedule_count(data.day) }} 课
              </div>
            </div>
          </template>
        </el-calendar>
      </div>

      <div class="divider-line"></div>

      <!-- 2. 选中日期的时间轴详情 -->
      <div class="timeline-section">
        <div class="timeline-header">
          <h3 class="serif-title">
            {{ is_show_all ? '所有待办课程' : format_date_text(selected_date) }}
          </h3>
          <span class="course-counter">共 {{ display_list.length }} 节课</span>
        </div>

        <div v-if="display_list.length === 0" class="empty-state">
          <el-empty description="今天没有安排课程，好好休息吧。" :image-size="80" class="warm-empty" />
        </div>

        <el-timeline v-else class="editorial-timeline">
          <el-timeline-item 
            v-for="item in display_list" 
            :key="item.id" 
            :timestamp="item.appoint_time || '未指定时间'" 
            placement="top"
            :color="get_timeline_color(item.status)"
          >
            <div class="schedule-card">
              <div class="card-top">
                <h4 class="course-name">{{ item.course_name }}</h4>
                <!-- 状态徽章 -->
                <div class="status-badge" :class="'status-' + item.status">
                  <span class="status-dot"></span>
                  <span class="status-text">
                    {{ item.status === 0 ? '待接单' : (item.status === 1 ? '等待支付' : '授课中') }}
                  </span>
                </div>
              </div>
              
              <div class="info-grid">
                <div class="info-row">
                  <span class="label">学生姓名</span>
                  <span class="value">{{ item.student_name }}</span>
                </div>
                <div class="info-row">
                  <span class="label">联系方式</span>
                  <span class="value phone-value">{{ item.student_phone }}</span>
                </div>
                <div class="info-row" v-if="item.address">
                  <span class="label">上门地址</span>
                  <span class="value address-value">{{ item.address }}</span>
                </div>
                <div class="info-row full-width">
                  <span class="label">订单编号</span>
                  <span class="value order-value">{{ item.order_no }}</span>
                </div>
              </div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>
      
    </el-card>
  </div>
</template>

<script setup>
import { ref, onActivated, computed } from 'vue'
import request from '../../utils/request'
import { Calendar } from '@element-plus/icons-vue'

const loading = ref(true)
const all_schedule_list = ref([]) 
const selected_date = ref(new Date()) 
const is_show_all = ref(false) 

const get_schedule = async () => {
  loading.value = true
  try {
    const res = await request.get('/order/tutor/schedule')
    all_schedule_list.value = res.data
  } catch(error) {
    console.error("加载日程失败:", error)
  } finally {
    loading.value = false
  }
}

const display_list = computed(() => {
  if (is_show_all.value) {
    return all_schedule_list.value
  } else {
    const selected_day_str = format_date(selected_date.value)
    return all_schedule_list.value.filter(item => 
      item.appoint_time && item.appoint_time.startsWith(selected_day_str)
    )
  }
})

// 为时间轴原点分配颜色
const get_timeline_color = (status) => {
  if (status === 2) return 'var(--clr-coral)';      // 授课中
  if (status === 0) return 'var(--clr-amber-warm)'; // 待接单
  return 'var(--clr-terracotta)';                   // 等待支付
}

const format_date = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const year = d.getFullYear()
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

const format_date_text = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const options = { month: 'long', day: 'numeric', weekday: 'short' }
  return new Intl.DateTimeFormat('zh-CN', options).format(d)
}

const get_schedule_count = (day_str) => {
  return all_schedule_list.value.filter(item => 
    item.appoint_time && item.appoint_time.startsWith(day_str)
  ).length
}

const is_selected_day = (day_str) => {
  return day_str === format_date(selected_date.value)
}

onActivated(() => {
  get_schedule()
})
</script>

<style scoped>
/* ================= 美学色板与变量定义 ================= */
* {
  --clr-parchment: #f5f4ed;     /* 羊皮纸底色 */
  --clr-ivory: #faf9f5;         /* 卡片象牙白 */
  --clr-white: #ffffff;
  --clr-near-black: #141413;    /* 墨黑主文本 */
  
  --clr-terracotta: #c96442;    /* 陶土红 (关键标点) */
  --clr-coral: #d97757;         /* 珊瑚色 (进行中) */
  --clr-amber-warm: #d98f3e;    /* 暖琥珀 (待办) */
  
  --clr-olive: #5e5d59;         /* 橄榄灰 (次级文本) */
  --clr-stone: #87867f;         /* 石板灰 (日历数字/说明) */
  --clr-charcoal: #4d4c48;      /* 木炭灰 */
  
  --clr-warm-sand: #e8e6dc;     /* 暖沙色 (卡片背景) */
  --clr-border-cream: #f0eee6;  /* 柔和边框 */
  --clr-border-warm: #e8e6dc;   /* 加深边框 */
  
  --font-serif: "Georgia", "Times New Roman", serif;
  --font-sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.editorial-page-container {
  font-family: var(--font-sans);
  max-width: 900px;
  margin: 0 auto;
  padding-bottom: 40px;
}

/* ================= 柔和卡片系统 ================= */
.editorial-card {
  background-color: var(--clr-ivory);
  border: 1px solid var(--clr-border-cream);
  border-radius: 12px;
  box-shadow: rgba(0, 0, 0, 0.02) 0px 4px 12px !important;
}
:deep(.editorial-card .el-card__header) {
  padding: 20px 24px;
  border-bottom: 1px solid var(--clr-border-cream);
}
:deep(.editorial-card .el-card__body) { padding: 24px; }

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-title {
  font-family: var(--font-serif);
  font-size: 18px;
  font-weight: 500;
  color: var(--clr-near-black);
  display: flex;
  align-items: center;
}
.title-icon { margin-right: 8px; font-size: 20px; color: var(--clr-stone); }

/* Switch 开关颜色定制 */
.warm-switch :deep(.el-switch__core) { border-color: var(--clr-border-warm); background-color: var(--clr-stone); }
.warm-switch.is-checked :deep(.el-switch__core) { border-color: var(--clr-near-black); background-color: var(--clr-near-black); }

/* ================= 日历组件重置 ================= */
.calendar-wrapper { margin-bottom: 24px; }

.editorial-calendar {
  background-color: transparent;
  --el-calendar-border: none;
  --el-calendar-selected-bg-color: transparent;
}
:deep(.editorial-calendar .el-calendar__header) {
  border-bottom: none;
  padding: 0 0 16px 0;
}
:deep(.editorial-calendar .el-calendar__title) {
  color: var(--clr-near-black);
  font-family: var(--font-serif);
  font-weight: 500;
  font-size: 18px;
}
:deep(.editorial-calendar .el-calendar-table thead th) {
  color: var(--clr-stone);
  font-weight: normal;
}
:deep(.editorial-calendar .el-calendar-table td) {
  border: 1px solid transparent; /* 移除死板的原生边框 */
  border-bottom: 1px solid var(--clr-border-cream);
}
:deep(.editorial-calendar .el-calendar-table td.is-today) {
  color: var(--clr-terracotta);
}

/* 单元格自定排版 */
.calendar-cell {
  height: 64px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s;
  box-sizing: border-box;
}
.calendar-cell:hover { background-color: var(--clr-parchment); }
.date-text { font-size: 15px; color: var(--clr-charcoal); font-weight: 500; }

/* 选中日期的强对比强调 */
.is-active-day { background-color: var(--clr-near-black) !important; }
.is-active-day .date-text { color: var(--clr-ivory); }

/* 课程角标 */
.schedule-badge {
  align-self: flex-start;
  font-size: 11px;
  color: var(--clr-terracotta);
  background-color: rgba(201, 100, 66, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  font-weight: 500;
}
.badge-dot {
  width: 4px; height: 4px; border-radius: 50%;
  background-color: var(--clr-terracotta);
  margin-right: 4px;
}

.divider-line {
  height: 1px;
  background-color: var(--clr-border-cream);
  margin: 0 0 32px 0;
  width: 100%;
}

/* ================= 时间轴详情区 ================= */
.timeline-section { padding: 0 16px; }

.timeline-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 24px;
}
.serif-title {
  font-family: var(--font-serif);
  font-size: 20px;
  font-weight: 500;
  color: var(--clr-near-black);
  margin: 0;
}
.course-counter {
  font-size: 14px;
  color: var(--clr-olive);
  background-color: var(--clr-parchment);
  padding: 4px 12px;
  border-radius: 12px;
}

/* 时间轴排版覆写 */
.editorial-timeline { padding-left: 2px; }
.editorial-timeline :deep(.el-timeline-item__timestamp) {
  font-size: 14px;
  color: var(--clr-olive);
  margin-bottom: 12px;
  font-family: monospace; /* 时间采用等宽字体 */
}
.editorial-timeline :deep(.el-timeline-item__tail) { border-left-color: var(--clr-border-warm); }

/* 日程卡片 (便签质感) */
.schedule-card {
  background-color: var(--clr-parchment);
  border: 1px solid var(--clr-border-cream);
  border-left: 3px solid var(--clr-border-warm); /* 左侧加粗作为点缀 */
  border-radius: 8px;
  padding: 20px;
  transition: all 0.2s;
}
.schedule-card:hover {
  background-color: var(--clr-white);
  border-color: var(--clr-border-warm);
  box-shadow: 0 4px 12px rgba(0,0,0,0.02);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}
.course-name {
  margin: 0;
  font-family: var(--font-serif);
  font-size: 17px;
  color: var(--clr-near-black);
  font-weight: 500;
}

/* 徽章体系 */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}
.status-dot { width: 5px; height: 5px; border-radius: 50%; margin-right: 6px; }
/* 0 待接单 */
.status-0 { background-color: rgba(217, 143, 62, 0.1); color: var(--clr-amber-warm); }
.status-0 .status-dot { background-color: var(--clr-amber-warm); }
/* 1 待支付 */
.status-1 { background-color: rgba(201, 100, 66, 0.1); color: var(--clr-terracotta); }
.status-1 .status-dot { background-color: var(--clr-terracotta); }
/* 2 进行中 */
.status-2 { background-color: rgba(217, 119, 87, 0.1); color: var(--clr-coral); }
.status-2 .status-dot { background-color: var(--clr-coral); }

/* 信息网格排版 */
.info-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 24px;
}
.info-row {
  display: flex;
  align-items: baseline;
  min-width: 40%;
}
.info-row.full-width { width: 100%; margin-top: 4px; }

.info-row .label {
  color: var(--clr-stone);
  font-size: 13px;
  margin-right: 12px;
  width: 56px;
}
.info-row .value {
  color: var(--clr-near-black);
  font-size: 14px;
  font-weight: 500;
}
.phone-value { font-family: monospace; color: var(--clr-olive) !important; letter-spacing: 0.5px; }
.address-value { color: var(--clr-olive) !important; }
.order-value { font-family: monospace; font-size: 12px !important; color: var(--clr-stone) !important; }

/* 空状态提示 */
.empty-state { padding: 40px 0; }
.warm-empty :deep(.el-empty__description p) { color: var(--clr-olive); }
</style>