<template>
  <div class="editorial-page-container" v-loading="loading">
    
    <!-- 返回按钮区 -->
    <div class="page-nav">
      <button class="btn-text-action" @click="router.back()">
        <el-icon class="nav-icon"><ArrowLeft /></el-icon> 返回上一页
      </button>
    </div>

    <!-- ================= 核心信息区 ================= -->
    <el-card shadow="never" class="editorial-card hero-card" v-if="course_info.id">
      <el-row :gutter="40">
        <!-- 左侧：封面图 (相框质感) -->
        <el-col :xs="24" :md="10">
          <div class="cover-wrapper">
            <img :src="course_info.cover_image" class="detail-cover" v-if="course_info.cover_image" />
            <div v-else class="no-cover-box">
              <el-icon class="no-cover-icon"><Picture /></el-icon>
              <div class="no-cover-text">暂无封面图</div>
            </div>
          </div>
        </el-col>

        <!-- 右侧：核心信息 -->
        <el-col :xs="24" :md="14" class="info-section">
          <div>
            <h2 class="course-title serif-title">{{ course_info.title }}</h2>
            
            <div class="tag-line">
              <span class="soft-tag">{{ course_info.category_name }}</span>
              <!-- 沉浸式圆点徽章 -->
              <div class="type-indicator" :class="course_info.type === 1 ? 'type-online' : 'type-offline'">
                <span class="type-dot"></span>
                <span class="type-text">{{ course_info.type === 1 ? '在线视频' : '线下上门' }}</span>
              </div>
            </div>

            <!-- 价格框 -->
            <div class="price-box">
              <span class="currency">¥</span>
              <span class="price-num">{{ course_info.price }}</span>
              <span class="unit">/ 课时</span>
            </div>

            <!-- 讲师名片 -->
            <div class="tutor-card" @click="go_tutor_profile(course_info.tutor_id)">
              <el-avatar :size="52" :src="course_info.tutor_avatar" class="tutor-avatar" />
              <div class="tutor-info">
                <div class="tutor-name">{{ course_info.tutor_name }} 老师 <el-icon class="arrow-icon"><ArrowRight /></el-icon></div>
                <div class="tutor-city"><el-icon><Location /></el-icon> {{ course_info.city }}</div>
              </div>
            </div>
          </div>

          <div class="divider-line"></div>

          <!-- 底部操作按钮 -->
          <div class="action-box">
            <!-- 学生：预约下单 -->
            <button 
              v-if="user_info.role === 2" 
              class="btn-primary-large"
              @click="handle_book"
            >
              立即预约下单
            </button>

            <!-- 管理员：要求修改 (深茜红) -->
            <button 
              v-if="user_info.role === 0" 
              class="btn-danger-large"
              @click="handle_admin_modify"
            >
              要求修改 (强制下架)
            </button>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- ================= 课程详细介绍 ================= -->
    <el-card shadow="never" class="editorial-card desc-card" v-if="course_info.id">
      <template #header>
        <div class="card-header">
          <span class="section-title"><el-icon><Reading /></el-icon> 课程详细介绍</span>
        </div>
      </template>
      <div class="desc-content">
        <p class="pre-wrap-text">{{ course_info.description }}</p>
      </div>
    </el-card>
  
    <!-- ================= 免费试看资源 ================= -->
    <el-card shadow="never" class="editorial-card desc-card">
      <template #header>
        <div class="card-header">
          <span class="section-title"><el-icon><Collection /></el-icon> 免费试看资源</span>
        </div>
      </template>
      
      <el-table 
        :data="free_resources" 
        v-if="free_resources.length > 0"
        class="editorial-table"
      >
        <el-table-column prop="resource_name" label="资料名称" class-name="text-main fw-500" />
        <el-table-column label="类型" width="140">
          <template #default="scope">
            <div class="type-badge" :class="scope.row.resource_type === 1 ? 'type-video' : 'type-doc'">
              {{ scope.row.resource_type === 1 ? '视频课件' : '图文文档' }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" align="right">
          <template #default="scope">
            <button class="btn-action-small" @click="preview_free(scope.row)">立即试看</button>
          </template>
        </el-table-column>
      </el-table>
      <div v-else class="empty-state">
        <el-empty :image-size="60" description="讲师暂未提供试看资源" />
      </div>
    </el-card>
  
    <!-- ================= 课程评价列表 ================= -->
    <el-card shadow="never" class="editorial-card desc-card">
      <template #header>
        <div class="card-header">
          <span class="section-title"><el-icon><ChatSquare /></el-icon> 课程评价 ({{ comment_list.length }}条)</span>
        </div>
      </template>
      
      <div v-if="comment_list.length === 0" class="empty-state">
        <el-empty :image-size="60" description="该课程暂无评价" />
      </div>
      
      <div v-else class="comment-list">
        <div v-for="item in comment_list" :key="item.id" class="comment-item">
          <el-avatar :size="48" :src="item.student_avatar" class="comment-avatar" />
          <div class="comment-body">
            <div class="comment-top">
              <span class="comment-author">{{ item.student_name }}</span>
              <span class="comment-time">{{ item.create_time }}</span>
            </div>
            
            <el-rate 
              v-model="item.score" 
              disabled 
              size="small" 
              :colors="['var(--clr-amber-warm)', 'var(--clr-amber-warm)', 'var(--clr-amber-warm)']"
              disabled-void-color="var(--clr-border-warm)"
              class="comment-rate"
            />
            
            <div class="comment-content">{{ item.content }}</div>
            
            <div class="comment-actions">
              <button 
                class="btn-text-danger" 
                :disabled="item.user_id === user_info.id" 
                @click="open_report_dialog(item.id)"
              >
                {{ item.user_id === user_info.id ? '我的评价' : '举报' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </el-card>
    
    <!-- ================= 弹窗：免费试看 (剧院模式) ================= -->
    <el-dialog 
      v-model="preview_visible" 
      :title="`试看: ${current_res.resource_name}`" 
      width="800px"
      class="editorial-dialog preview-dialog"
      destroy-on-close
    >
       <div class="preview-container">
         <div v-if="current_res.resource_type === 1" class="media-box">
           <video :src="current_res.resource_url" controls autoplay class="media-player"></video>
         </div>
         <div v-else class="media-box">
           <iframe :src="current_res.resource_url" class="document-frame"></iframe>
         </div>
       </div>
    </el-dialog>

    <!-- ================= 弹窗：预约下单 ================= -->
    <el-dialog 
      v-model="book_dialog_visible" 
      title="填写预约信息" 
      width="500px"
      class="editorial-dialog"
      destroy-on-close
    >
      <div class="dialog-subtitle">请确认上课时间及细节要求，预约后讲师将尽快回应。</div>
      <el-form ref="order_form_ref" :model="order_form" :rules="order_rules" label-width="80px" label-position="top" class="editorial-form form-stacked">
        
        <el-form-item label="首次上课时间" prop="appoint_time" required>
          <el-date-picker
            v-model="order_form.appoint_time"
            type="datetime"
            placeholder="请选择期望的上课时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm"
            :disabled-date="disabled_date"
            class="warm-date-picker"
          />
        </el-form-item>
        
        <el-form-item label="上门地址" prop="address" v-if="course_info.type === 0" required>
          <el-input v-model="order_form.address" placeholder="请填写详细的线下上门地址" class="warm-input" />
        </el-form-item>
        
        <el-form-item label="备注留言" prop="remark">
          <el-input 
            v-model="order_form.remark" 
            type="textarea" 
            :rows="4" 
            maxlength="200" 
            show-word-limit
            placeholder="向讲师说明您的学习痛点或特殊要求..." 
            class="warm-textarea"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button class="btn-secondary" @click="book_dialog_visible = false">取消</el-button>
          <el-button class="btn-brand" @click="submit_order">提交预约申请</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- ================= 弹窗：举报评价 ================= -->
    <el-dialog 
      v-model="report_dialog_visible" 
      title="举报违规评价" 
      width="440px"
      class="editorial-dialog"
      destroy-on-close
    >
      <div class="dialog-subtitle">维护社区清朗环境，请如实反馈。</div>
      <el-form label-position="top" class="editorial-form form-stacked">
        <el-form-item label="举报理由" required>
          <el-radio-group v-model="report_reason" class="warm-radio-group">
            <el-radio label="恶意攻击/辱骂老师" class="radio-item">恶意攻击/辱骂老师</el-radio>
            <el-radio label="虚假交易/刷单评价" class="radio-item">虚假交易/刷单评价</el-radio>
            <el-radio label="包含广告或违规信息" class="radio-item">包含广告或违规信息</el-radio>
            <el-radio label="其他" class="radio-item">其他原因</el-radio>
          </el-radio-group>
          <div style="margin-top: 12px; width: 100%;" v-if="report_reason === '其他'">
            <el-input v-model="custom_reason" placeholder="请详细说明情况..." type="textarea" :rows="3" class="warm-textarea" />
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button class="btn-secondary" @click="report_dialog_visible = false">取消</el-button>
          <el-button class="btn-danger" @click="submit_report">提交给平台</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onActivated, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '../utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Picture, Location, ArrowRight, Reading, Collection, ChatSquare } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const course_info = ref({})

const user_info = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))

// ================= 预约下单 =================
const book_dialog_visible = ref(false)
const order_form = ref({
  course_id: null,
  appoint_time: '',
  address: '',
  remark: ''
})
const order_form_ref = ref(null)

const disabled_date = (time) => {
  return time.getTime() < Date.now() - 8.64e7 
}

const order_rules = ref({
  appoint_time:[ { required: true, message: '请选择预约上课时间', trigger: 'change' } ],
  address:[
    { required: true, message: '线下课程必须填写上门地址', trigger: 'blur' },
    { min: 5, max: 100, message: '地址长度需在 5 到 100 个字符之间', trigger: 'blur' }
  ]
})

const handle_book = () => {
  order_form.value = { 
    course_id: course_info.value.id,
    appoint_time: '',
    address: '',
    remark: ''
  } 
  book_dialog_visible.value = true
  if (order_form_ref.value) {
    order_form_ref.value.clearValidate()
  }
}

const submit_order = () => {
  order_form_ref.value.validate(async (valid) => {
    if (valid) {
      try {
        await request.post('/order/create', order_form.value)
        ElMessage.success('预约请求已发送，请到"我的订单"中查看状态')
        book_dialog_visible.value = false
      } catch(error) {}
    } else {
      ElMessage.warning('请检查输入信息是否正确完整')
      return false
    }
  })
}

// ================= 评价相关 =================
const comment_list = ref([])

const load_course_comments = async () => {
  const course_id = route.query.course_id
  if (!course_id) return
  try {
    const res = await request.get('/comment/course_list', { params: { course_id } })
    comment_list.value = res.data
  } catch(error) {}
}

// ================= 举报相关 =================
const report_dialog_visible = ref(false)
const current_comment_id = ref(null)
const report_reason = ref('恶意攻击/辱骂老师')
const custom_reason = ref('')

const open_report_dialog = (comment_id) => {
  current_comment_id.value = comment_id
  report_reason.value = '恶意攻击/辱骂老师'
  custom_reason.value = ''
  report_dialog_visible.value = true
}

const submit_report = async () => {
  const final_reason = report_reason.value === '其他' ? custom_reason.value : report_reason.value
  if (!final_reason.trim()) {
    ElMessage.warning('请提供举报理由')
    return
  }
  try {
    await request.post('/comment/report', null, {
      params: { comment_id: current_comment_id.value, reason: final_reason }
    })
    ElMessage.success('举报已提交，平台将尽快核实处理')
    report_dialog_visible.value = false
  } catch (error) {}
}

// ================= 试看相关 =================
const free_resources = ref([])
const preview_visible = ref(false)
const current_res = ref({})

const load_free_resources = async () => {
  const course_id = route.query.course_id
  if (!course_id) return
  const res = await request.get('/course_resource/list_by_course', { params: { course_id } })
  free_resources.value = res.data.filter(item => item.status === 1 && item.is_free === 1)
}

const preview_free = (res) => {
  current_res.value = res
  preview_visible.value = true
}

// ================= 课程主体与通用 =================
const go_tutor_profile = (tutor_id) => {
  router.push({ path: '/tutor-profile', query: { tutor_id } })
}

const load_detail = async () => {
  const course_id = route.query.course_id
  if (!course_id) {
    ElMessage.error('课程ID丢失')
    return
  }
  loading.value = true
  const res = await request.get('/course/detail', { params: { course_id } })
  course_info.value = res.data
  loading.value = false
}

const handle_admin_modify = () => {
  ElMessageBox.confirm(
    '确定要将该课程打回待审核状态，要求家教修改吗？课程将从大厅隐藏。',
    '警告',
    {
      confirmButtonText: '确定打回',
      cancelButtonText: '取消',
      confirmButtonClass: 'editorial-msgbox-btn-danger',
      cancelButtonClass: 'editorial-msgbox-btn-cancel',
      customClass: 'editorial-message-box',
    }
  ).then(async () => {
    await request.post('/course/admin/require_modify', null, {
      params: { course_id: course_info.value.id }
    })
    ElMessage.success('已将该课程打回，等待家教修改')
    router.back() 
  }).catch(() => {})
}

// 首次挂载时加载所有数据
onMounted(() => {
  load_detail()
  load_free_resources()
  load_course_comments()
})

// 从缓存中激活时，检查课程ID是否变化，变化则重新加载
onActivated(() => {
  const current_course_id = route.query.course_id
  if (course_info.value.id && course_info.value.id != current_course_id) {
    load_detail()
    load_free_resources()
    load_course_comments()
  }
})

// 监听路由参数变化（同一页面切换不同课程时）
watch(() => route.query.course_id, (newId, oldId) => {
  if (newId && newId !== oldId) {
    load_detail()
    load_free_resources()
    load_course_comments()
  }
})
</script>

watch(
  () => route.query.course_id,
  (newId, oldId) => {
    if (newId && newId !== oldId) {
      load_detail()
	    load_free_resources()
	    load_course_comments()
    }
  },
  { immediate: true }
)
</script>

<style scoped>
/* ================= 美学色板与变量定义 ================= */
* {
  --clr-parchment: #f5f4ed;     
  --clr-ivory: #faf9f5;         
  --clr-white: #ffffff;
  --clr-near-black: #141413;    
  
  --clr-terracotta: #c96442;    /* 核心品牌色/预约 */
  --clr-danger-red: #b02a2a;    /* 举报/打回/删除 */
  --clr-amber-warm: #d98f3e;    /* 星星/在线标识 */
  
  --clr-olive: #5e5d59;         /* 次级文本 */
  --clr-stone: #87867f;         /* 辅助说明 */
  --clr-charcoal: #4d4c48;      /* 中性按钮 */
  
  --clr-warm-sand: #e8e6dc;     
  --clr-border-cream: #f0eee6;  
  --clr-border-warm: #e8e6dc;   
  --clr-ring-warm: #d1cfc5;     
  --clr-focus-blue: #3898ec;
  
  --font-serif: "Georgia", "Times New Roman", serif;
  --font-sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.editorial-page-container {
  font-family: var(--font-sans);
  max-width: 1040px;
  margin: 0 auto;
  padding-bottom: 40px;
}

/* ================= 顶部导航 ================= */
.page-nav { margin-bottom: 20px; }
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
.btn-text-action:hover { color: var(--clr-near-black); background-color: var(--clr-border-cream); }
.nav-icon { margin-right: 6px; }

/* ================= 柔和卡片基础 ================= */
.editorial-card {
  background-color: var(--clr-ivory);
  border: 1px solid var(--clr-border-cream);
  border-radius: 12px;
  margin-bottom: 24px;
  box-shadow: rgba(0, 0, 0, 0.02) 0px 4px 12px !important;
}
:deep(.editorial-card .el-card__header) {
  padding: 20px 28px;
  border-bottom: 1px solid var(--clr-border-cream);
}
:deep(.editorial-card .el-card__body) { padding: 28px; }

.section-title {
  font-family: var(--font-serif);
  font-size: 18px;
  font-weight: 500;
  color: var(--clr-near-black);
  display: flex;
  align-items: center;
}
.section-title .el-icon { margin-right: 8px; color: var(--clr-stone); font-size: 20px; }

/* ================= 核心区：左侧封面 ================= */
.cover-wrapper {
  width: 100%;
  height: 320px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--clr-border-warm);
  background-color: var(--clr-parchment);
}
.detail-cover { width: 100%; height: 100%; object-fit: cover; }
.no-cover-box {
  width: 100%; height: 100%;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  color: var(--clr-stone);
}
.no-cover-icon { font-size: 48px; margin-bottom: 12px; opacity: 0.6; }

/* ================= 核心区：右侧信息 ================= */
.info-section { display: flex; flex-direction: column; }
.course-title {
  margin: 0 0 16px 0;
  font-size: 26px;
  color: var(--clr-near-black);
  line-height: 1.3;
}

.tag-line { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
.soft-tag {
  background-color: var(--clr-border-cream);
  color: var(--clr-charcoal);
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 13px;
}
/* 类型指示器 */
.type-indicator { display: inline-flex; align-items: center; font-size: 13px; }
.type-dot { width: 6px; height: 6px; border-radius: 50%; margin-right: 6px; }
.type-online .type-dot { background-color: var(--clr-amber-warm); }
.type-online .type-text { color: var(--clr-amber-warm); }
.type-offline .type-dot { background-color: var(--clr-stone); }
.type-offline .type-text { color: var(--clr-stone); }

/* 价格框排版 */
.price-box {
  background-color: var(--clr-parchment);
  border: 1px solid var(--clr-border-warm);
  padding: 16px 24px;
  border-radius: 8px;
  color: var(--clr-terracotta);
  margin-bottom: 24px;
  display: inline-flex;
  align-items: baseline;
}
.currency { font-size: 16px; margin-right: 4px; }
.price-num { font-size: 36px; font-weight: bold; font-family: monospace; }
.unit { font-size: 14px; color: var(--clr-stone); margin-left: 6px; }

/* 讲师名片 */
.tutor-card {
  display: flex;
  align-items: center;
  background-color: var(--clr-white);
  border: 1px solid var(--clr-border-cream);
  padding: 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  width: fit-content;
  min-width: 240px;
}
.tutor-card:hover {
  background-color: var(--clr-parchment);
  border-color: var(--clr-border-warm);
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
}
.tutor-avatar { border: 1px solid var(--clr-border-warm); }
.tutor-info { margin-left: 16px; }
.tutor-name { font-size: 16px; font-weight: 500; color: var(--clr-near-black); margin-bottom: 4px; display: flex; align-items: center; }
.arrow-icon { color: var(--clr-stone); margin-left: 4px; font-size: 14px; }
.tutor-city { font-size: 13px; color: var(--clr-olive); display: flex; align-items: center; }

.divider-line { height: 1px; background-color: var(--clr-border-cream); margin: 32px 0 24px; width: 100%; }

/* 核心操作按钮 */
.action-box { display: flex; justify-content: flex-start; }
.btn-primary-large {
  background: var(--clr-terracotta);
  color: var(--clr-ivory);
  border: none; border-radius: 12px; padding: 14px 40px; font-size: 16px; font-weight: 500;
  box-shadow: var(--clr-terracotta) 0px 0px 0px 0px, var(--clr-terracotta) 0px 0px 0px 1px;
  cursor: pointer; transition: opacity 0.2s;
}
.btn-primary-large:hover { opacity: 0.9; }

.btn-danger-large {
  background: var(--clr-danger-red);
  color: var(--clr-ivory);
  border: none; border-radius: 12px; padding: 14px 40px; font-size: 16px; font-weight: 500;
  cursor: pointer; transition: opacity 0.2s;
}
.btn-danger-large:hover { opacity: 0.9; box-shadow: 0 2px 8px rgba(176, 42, 42, 0.3); }

/* ================= 详细介绍 ================= */
.pre-wrap-text {
  font-size: 15px;
  line-height: 1.8;
  color: var(--clr-near-black);
  white-space: pre-wrap;
  margin: 0;
}

/* ================= 试看资源表格 ================= */
.editorial-table {
  --el-table-border-color: var(--clr-border-cream);
  --el-table-header-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  background-color: transparent;
}
:deep(.editorial-table th.el-table__cell) { font-family: var(--font-serif); font-size: 15px; font-weight: 500; color: var(--clr-near-black); border-bottom: 2px solid var(--clr-border-warm); padding: 12px 0; }
:deep(.editorial-table td.el-table__cell) { padding: 16px 0; border-bottom: 1px solid var(--clr-border-cream); }
:deep(.editorial-table--enable-row-hover .el-table__body tr:hover > td.el-table__cell) { background-color: var(--clr-parchment); }
:deep(.text-main) { color: var(--clr-near-black); font-size: 15px; }

.type-badge { display: inline-flex; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 500; }
.type-video { background-color: var(--clr-near-black); color: var(--clr-ivory); }
.type-doc { background-color: var(--clr-border-warm); color: var(--clr-charcoal); }

.btn-action-small { background-color: var(--clr-warm-sand); color: var(--clr-charcoal); border: none; border-radius: 6px; padding: 6px 14px; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s; }
.btn-action-small:hover { background-color: var(--clr-border-warm); box-shadow: 0 0 0 1px var(--clr-ring-warm); }

.empty-state { padding: 20px 0; }

/* ================= 评论列表 ================= */
.comment-list { display: flex; flex-direction: column; }
.comment-item { display: flex; padding: 24px 0; border-bottom: 1px solid var(--clr-border-cream); }
.comment-item:last-child { border-bottom: none; padding-bottom: 0; }

.comment-avatar { border: 1px solid var(--clr-border-warm); margin-right: 20px; }
.comment-body { flex: 1; }
.comment-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.comment-author { font-weight: 500; font-size: 15px; color: var(--clr-near-black); }
.comment-time { font-size: 13px; color: var(--clr-stone); }
.comment-content { font-size: 15px; color: var(--clr-near-black); line-height: 1.6; margin: 12px 0; }
.comment-actions { text-align: right; }
.btn-text-danger { background: transparent; border: none; color: var(--clr-stone); font-size: 13px; cursor: pointer; transition: color 0.2s; padding: 4px 8px; }
.btn-text-danger:hover:not(:disabled) { color: var(--clr-danger-red); }
.btn-text-danger:disabled { cursor: not-allowed; opacity: 0.6; }

/* ================= 弹窗统一样式 ================= */
:deep(.editorial-dialog) { border-radius: 16px; background-color: var(--clr-ivory); }
:deep(.editorial-dialog .el-dialog__header) { padding: 32px 32px 0; margin-right: 0; }
:deep(.editorial-dialog .el-dialog__title) { font-family: var(--font-serif); font-weight: 500; font-size: 22px; color: var(--clr-near-black); }
:deep(.editorial-dialog .el-dialog__body) { padding: 24px 32px; }
.dialog-subtitle { font-size: 14px; color: var(--clr-olive); margin-top: -16px; margin-bottom: 24px; }
.dialog-footer { padding-top: 12px; }

/* 表单输入 */
.editorial-form :deep(.el-form-item__label) { font-weight: 500; color: var(--clr-olive); }
.warm-input :deep(.el-input__wrapper) { background-color: var(--clr-parchment); border: 1px solid var(--clr-border-warm); border-radius: 8px; box-shadow: none !important; }
.warm-input :deep(.el-input__wrapper.is-focus) { background-color: var(--clr-white); box-shadow: 0 0 0 1px var(--clr-focus-blue) !important; }
.warm-textarea :deep(.el-textarea__inner) { background-color: var(--clr-parchment); border: 1px solid var(--clr-border-warm); border-radius: 8px; padding: 12px; font-size: 14px; color: var(--clr-near-black); box-shadow: none !important; }
.warm-textarea :deep(.el-textarea__inner:focus) { background-color: var(--clr-white); box-shadow: 0 0 0 1px var(--clr-focus-blue) !important; }
.warm-date-picker { width: 100% !important; }
.warm-date-picker :deep(.el-input__wrapper) { background-color: var(--clr-parchment); border: 1px solid var(--clr-border-warm); border-radius: 8px; box-shadow: none !important; }

/* 单选框组 */
.warm-radio-group { display: flex; flex-direction: column; width: 100%; gap: 12px; }
.radio-item { margin-right: 0; }
.warm-radio-group :deep(.el-radio__input.is-checked .el-radio__inner) { border-color: var(--clr-terracotta); background: var(--clr-terracotta); }
.warm-radio-group :deep(.el-radio__input.is-checked + .el-radio__label) { color: var(--clr-terracotta); font-weight: 500; }

/* 试看剧院模式 */
:deep(.preview-dialog .el-dialog__body) { padding: 0; }
.preview-container { background-color: var(--clr-near-black); padding: 20px; display: flex; justify-content: center; }
.media-box { width: 100%; border-radius: 8px; overflow: hidden; background-color: #000; }
.media-player { width: 100%; max-height: 550px; display: block; }
.document-frame { width: 100%; height: 550px; border: none; display: block; background-color: var(--clr-white); }

/* 弹窗按钮 */
.btn-brand { background: var(--clr-terracotta) !important; color: var(--clr-ivory) !important; border: none; border-radius: 8px; padding: 8px 20px; font-weight: 500; box-shadow: var(--clr-terracotta) 0px 0px 0px 0px, var(--clr-terracotta) 0px 0px 0px 1px; }
.btn-danger { background: var(--clr-danger-red) !important; color: var(--clr-ivory) !important; border: none; border-radius: 8px; padding: 8px 20px; font-weight: 500; }
.btn-secondary { background: var(--clr-warm-sand) !important; color: var(--clr-charcoal) !important; border: none; border-radius: 8px; padding: 8px 20px; }

/* 全局 MessageBox */
:global(.editorial-message-box) { border-radius: 12px !important; background-color: #faf9f5 !important; border: 1px solid #e8e6dc !important; }
:global(.editorial-msgbox-btn-danger) { background-color: #b02a2a !important; border: none !important; }
:global(.editorial-msgbox-btn-cancel) { background-color: #e8e6dc !important; color: #4d4c48 !important; border: none !important; }
</style>