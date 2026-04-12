
<template>
  <div class="schedule-container" v-loading="loading">
    <el-card shadow="never">
      <template #header>
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: bold; font-size: 16px; color: #303133;">
            <el-icon><Calendar /></el-icon> 我的教学日程看板
          </span>
          <!-- 显示模式切换开关 -->
          <el-switch 
            v-model="is_show_all" 
            active-text="显示全部日程" 
            inactive-text="仅看选中日期" 
          />
        </div>
      </template>

      <!-- 1. 顶部直观日历 -->
      <el-calendar v-model="selected_date" class="custom-calendar">
        <!-- 自定义日历单元格，有课的日子显示小红点 -->
<template #date-cell="{ data }">
          <div class="calendar-cell">
            <span class="date-text" :class="{ 'is-selected': is_selected_day(data.day) }">
              {{ data.day.split('-')[2] }}
            </span>
            <!-- 计算当天的课程数量 -->
            <div v-if="get_schedule_count(data.day) > 0" class="schedule-count-badge">
              {{ get_schedule_count(data.day) }} 节课
            </div>
          </div>
        </template>
      </el-calendar>

      <el-divider border-style="dashed" />

      <!-- 2. 选中日期的时间轴详情 -->
      <div class="timeline-header">
        <h3>
          <el-icon><List /></el-icon> 
          {{ is_show_all ? '全部待办日程' : format_date_text(selected_date) + ' 的日程安排' }}
        </h3>
        <el-tag type="info" size="small">共 {{ display_list.length }} 节课</el-tag>
      </div>

      <el-empty v-if="display_list.length === 0" description="当天没有安排课程，好好休息吧！" :image-size="80" />

      <el-timeline v-else style="padding-left: 10px; margin-top: 15px;">
        <el-timeline-item 
          v-for="item in display_list" 
          :key="item.id" 
          :timestamp="item.appoint_time || '未指定时间'" 
          placement="top"
          :type="item.status === 2 ? 'success' : (item.status === 1 ? 'primary' : 'warning')"
          :size="item.status === 2 ? 'large' : 'normal'"
        >
          <el-card shadow="hover" class="schedule-card">
            <h4 class="course-name">{{ item.course_name }}</h4>
            
            <div class="info-grid">
              <div class="info-item">
                <span class="label">预约学生：</span>
                <span class="value">{{ item.student_name }}</span>
              </div>
              <div class="info-item">
                <span class="label">联系电话：</span>
                <span class="value" style="color: #409EFF;">{{ item.student_phone }}</span>
              </div>
              <div class="info-item" v-if="item.address">
                <span class="label">上门地址：</span>
                <span class="value">{{ item.address }}</span>
              </div>
              <div class="info-item">
                <span class="label">当前状态：</span>
                <el-tag size="small" v-if="item.status === 0" type="warning">待接单</el-tag>
                <el-tag size="small" v-if="item.status === 1">等待学生支付</el-tag>
                <el-tag size="small" v-if="item.status === 2" type="success">授课进行中</el-tag>
              </div>
              <div class="info-item" style="width: 100%;">
                <span class="label">订单编号：</span>
                <span class="value" style="font-size: 12px; color: #999;">{{ item.order_no }}</span>
              </div>
            </div>
          </el-card>
        </el-timeline-item>
      </el-timeline>
      
    </el-card>
  </div>
</template>

<script setup>
	import { ref, onMounted, computed } from 'vue'
	import request from '../../utils/request'
	import { Calendar, List } from '@element-plus/icons-vue' // 引入图标
	
	const loading = ref(true)
	const all_schedule_list = ref([]) // 存放从后端获取的所有日程
	const selected_date = ref(new Date()) // 日历选中的日期，默认为今天
	const is_show_all = ref(false) // 模式切换，默认只看选中日期
	
	// 加载家教的所有待办日程
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
	
	// 【核心逻辑】根据模式动态计算出要展示的列表
	const display_list = computed(() => {
	  if (is_show_all.value) {
	    // 如果是“显示全部”模式，直接返回所有日程
	    return all_schedule_list.value
	  } else {
	    // 否则，过滤出与选中日期匹配的日程
	    const selected_day_str = format_date(selected_date.value)
	    return all_schedule_list.value.filter(item => 
	      item.appoint_time && item.appoint_time.startsWith(selected_day_str)
	    )
	  }
	})
	
	// --- 辅助函数 ---
	
	// 格式化日期为 YYYY-MM-DD
	const format_date = (date) => {
	  if (!date) return ''
	  const d = new Date(date)
	  const year = d.getFullYear()
	  const month = (d.getMonth() + 1).toString().padStart(2, '0')
	  const day = d.getDate().toString().padStart(2, '0')
	  return `${year}-${month}-${day}`
	}
	
	// 格式化日期为中文文本，用于标题
	const format_date_text = (date) => {
	  if (!date) return ''
	  const d = new Date(date)
	  const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }
	  return new Intl.DateTimeFormat('zh-CN', options).format(d)
	}
	
	// 判断某一天在日程列表中是否存在
	const has_schedule = (day_str) => {
	  // 遍历所有日程，看 appoint_time 是否以这一天开头
	  return all_schedule_list.value.some(item => 
	    item.appoint_time && item.appoint_time.startsWith(day_str)
	  )
	}
	// 计算某一天有几节课
	const get_schedule_count = (day_str) => {
	  return all_schedule_list.value.filter(item => 
	    item.appoint_time && item.appoint_time.startsWith(day_str)
	  ).length
	}
	
	// 判断某一天是否是当前日历选中的那一天（用于高亮日期数字）
	const is_selected_day = (day_str) => {
	  return day_str === format_date(selected_date.value)
	}
	
	onMounted(() => {
	  get_schedule()
	})
	
</script>

<style scoped>
.schedule-container {
  max-width: 900px;
  margin: 0 auto;
}

/* 自定义日历样式 */
.custom-calendar {
  border-radius: 8px;
}
.custom-calendar :deep(.el-calendar-table .el-calendar-day) {
  height: 60px; /* 增加单元格高度 */
  padding: 4px;
}
.calendar-cell {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}
.calendar-cell .date-text {
  position: absolute;
  top: 5px;
  left: 8px;
  font-size: 14px;
}
/* 有日程的日子的背景高亮 */
.has-course-bg {
  background-color: #f0f9eb;
}
/* 小红点 */
.schedule-dot {
  position: absolute;
  bottom: 8px;
  width: 6px;
  height: 6px;
  background-color: #F56C6C;
  border-radius: 50%;
}

.timeline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
}
.timeline-header h3 {
  color: #303133;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.schedule-card {
  border-radius: 8px;
  background-color: #fafcff;
}
/* 日期数字的样式 */
.date-text {
  position: absolute;
  top: 5px;
  left: 8px;
  font-size: 14px;
  transition: all 0.3s;
}
/* 被选中日期的数字高亮 */
.is-selected {
  background-color: #409EFF;
  color: white;
  border-radius: 50%;
  padding: 2px 6px;
}

/* 课程数量角标样式 */
.schedule-count-badge {
  position: absolute;
  bottom: 8px;
  background-color: #fef0f0;
  color: #f56c6c;
  border: 1px solid #fde2e2;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  white-space: nowrap;
}
.course-name { margin: 0 0 15px 0; font-size: 16px; color: #303133; }
.info-grid { display: flex; flex-wrap: wrap; gap: 10px 20px; font-size: 14px; }
.info-item { min-width: 45%; }
.info-item .label { color: #909399; }
.info-item .value { color: #606266; font-weight: 500; }
</style>