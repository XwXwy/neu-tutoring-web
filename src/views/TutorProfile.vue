<template>
  <div class="profile-container" v-loading="loading">
    <el-button icon="ArrowLeft" @click="router.back()" style="margin-bottom: 20px;">返回</el-button>

    <!-- 1. 家教基本信息卡片 -->
    <el-card shadow="never" class="info-card" v-if="tutor_info.id">
      <div class="tutor-header">
        <el-avatar :size="80" :src="tutor_info.avatar" />
        <div class="tutor-main-info">
          <h2>{{ tutor_info.real_name }} 老师</h2>
          <div class="tutor-tags">
            <el-tag type="success">{{ tutor_info.university }}</el-tag>
            <el-tag type="warning">{{ tutor_info.major }}</el-tag>
            <el-tag type="info">教龄 {{ tutor_info.teaching_years }} 年</el-tag>
          </div>
          <div class="contact-info">联系电话：{{ tutor_info.phone }}</div>
        </div>
        <div class="tutor-rating">
          <div class="score-text">{{ tutor_info.rating }} 分</div>
          <el-rate v-model="tutor_info.rating" disabled show-score text-color="#ff9900" />
        </div>
      </div>
      <el-divider />
      <div class="bio-box">
        <strong>个人简介：</strong>
        <p>{{ tutor_info.bio || '这位老师很神秘，还没写简介~' }}</p>
      </div>
    </el-card>

    <!-- 2. 家教收到的全部评价 -->
    <el-card shadow="never" class="comment-card" style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span style="font-weight: bold;"><el-icon><ChatLineRound /></el-icon> TA的全部评价 ({{ comment_list.length }}条)</span>
        </div>
      </template>

      <el-empty v-if="comment_list.length === 0" description="暂无评价" />
      
      <div v-else class="comment-list">
        <div v-for="item in comment_list" :key="item.id" class="comment-item">
          <el-avatar :size="40" :src="item.student_avatar" />
          <div class="comment-content">
            <div class="comment-header">
              <span class="student-name">{{ item.student_name }}</span>
              <span class="course-tag">学习了《{{ item.course_name }}》</span>
              <span class="comment-time">{{ item.create_time }}</span>
            </div>
            <el-rate v-model="item.score" disabled size="small" />
            <div class="comment-text">{{ item.content }}</div>
            <!-- 举报按钮 -->
            <div class="comment-actions">
              <el-button 
                link 
                type="danger" 
                size="small" 
                :disabled="item.user_id === user_info.id"
                @click="open_report_dialog(item.id)"
              >
                <el-icon><Warning /></el-icon> 
                {{ item.user_id === user_info.id ? '我的评价' : '举报' }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 3. 举报弹窗 -->
    <el-dialog v-model="report_dialog_visible" title="举报违规评价" width="400px">
      <el-form label-position="top">
        <el-form-item label="请选择或填写举报理由：" required>
          <el-radio-group v-model="report_reason" style="margin-bottom: 10px; display: flex; flex-direction: column; align-items: flex-start;">
            <el-radio label="恶意攻击/辱骂老师">恶意攻击/辱骂老师</el-radio>
            <el-radio label="虚假交易/刷单评价">虚假交易/刷单评价</el-radio>
            <el-radio label="包含广告或违规信息">包含广告或违规信息</el-radio>
            <el-radio label="其他">其他原因</el-radio>
          </el-radio-group>
          <el-input v-if="report_reason === '其他'" v-model="custom_reason" placeholder="请详细说明情况..." type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="report_dialog_visible = false">取消</el-button>
        <el-button type="primary" @click="submit_report">提交举报</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '../utils/request'
import { ElMessage } from 'element-plus'
import { Location, ArrowRight, ChatSquare, Collection } from '@element-plus/icons-vue'
const route = useRoute()
const router = useRouter()
const loading = ref(true)

const tutor_info = ref({})
const comment_list = ref([])

// 举报相关
const report_dialog_visible = ref(false)
const current_comment_id = ref(null)
const report_reason = ref('恶意攻击/辱骂老师')
const custom_reason = ref('')
const user_info = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))

// 加载家教主页信息
const load_tutor_data = async () => {
  const tutor_id = route.query.tutor_id
  if (!tutor_id) return
  
  loading.value = true
  try {
    // 1. 查家教资料
    const res1 = await request.get('/sysUser/tutor/public_profile', { params: { tutor_id } })
    tutor_info.value = res1.data

    // 2. 查家教所有评价
    const res2 = await request.get('/comment/tutor_list', { params: { tutor_id } })
    comment_list.value = res2.data
  } catch (error) {}
  loading.value = false
}

// 举报功能
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
  } catch (error) {
    // 后端抛出的“您已经举报过该评论”会在这里被 request.js 拦截提示
  }
}

onMounted(() => {
  load_tutor_data()
})
</script>

<style scoped>
.profile-container { max-width: 1000px; margin: 0 auto; }
.tutor-header { display: flex; align-items: center; justify-content: space-between; }
.tutor-main-info { flex: 1; margin-left: 20px; }
.tutor-main-info h2 { margin: 0 0 10px 0; color: #303133; }
.tutor-tags { margin-bottom: 10px; display: flex; gap: 10px; }
.contact-info { font-size: 14px; color: #909399; }
.tutor-rating { text-align: center; }
.score-text { font-size: 28px; font-weight: bold; color: #ff9900; }
.bio-box p { font-size: 14px; color: #606266; line-height: 1.6; white-space: pre-wrap; }

/* 评价列表样式 */
.comment-item { display: flex; padding: 15px 0; border-bottom: 1px solid #ebeef5; }
.comment-item:last-child { border-bottom: none; }
.comment-content { margin-left: 15px; flex: 1; }
.comment-header { margin-bottom: 5px; display: flex; align-items: center; }
.student-name { font-weight: bold; font-size: 14px; color: #303133; margin-right: 10px; }
.course-tag { font-size: 12px; color: #409EFF; background: #ecf5ff; padding: 2px 6px; border-radius: 4px; margin-right: auto; }
.comment-time { font-size: 12px; color: #909399; }
.comment-text { font-size: 14px; color: #606266; margin-top: 8px; line-height: 1.5; }
.comment-actions { margin-top: 5px; text-align: right; }
</style>