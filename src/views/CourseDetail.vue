<template>
  <div class="detail-container" v-loading="loading">
    <el-button icon="ArrowLeft" @click="router.back()" style="margin-bottom: 20px;">返回上一页</el-button>

    <el-card shadow="never" v-if="course_info.id">
      <el-row :gutter="40">
        <!-- 左侧：封面图 -->
        <el-col :span="10">
          <img :src="course_info.cover_image" class="detail-cover" />
        </el-col>

        <!-- 右侧：核心信息 -->
        <el-col :span="14" class="info-section">
          <h2>{{ course_info.title }}</h2>
          
          <div class="tags">
            <el-tag type="info">{{ course_info.category_name }}</el-tag>
            <el-tag :type="course_info.type === 1 ? 'success' : 'warning'">
              {{ course_info.type === 1 ? '在线视频' : '线下上门' }}
            </el-tag>
          </div>

          <div class="price-box">
            <span class="currency">¥</span>
            <span class="price">{{ course_info.price }}</span>
            <span class="unit"> / 课时</span>
          </div>

          <div class="tutor-card">
            <el-avatar :size="50" :src="course_info.tutor_avatar" />
            <div class="tutor-info">
              <div class="name">{{ course_info.tutor_name }} 老师</div>
              <div class="city"><el-icon><Location /></el-icon> {{ course_info.city }}</div>
            </div>
          </div>

          <el-divider />

          <!-- 底部操作按钮 (千人千面) -->
          <div class="action-box">
            <!-- 学生 (role = 2) 看到预约下单 -->
            <el-button 
              v-if="user_info.role === 2" 
              type="danger" 
              size="large" 
              class="action-btn"
              @click="handle_book"
            >
              立即预约下单
            </el-button>

            <!-- 管理员 (role = 0) 看到要求修改 -->
            <el-button 
              v-if="user_info.role === 0" 
              type="warning" 
              size="large" 
              class="action-btn"
              @click="handle_admin_modify"
            >
              要求修改 (强制下架)
            </el-button>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 下方：课程详细介绍 -->
    <el-card shadow="never" class="desc-card" v-if="course_info.id">
      <template #header>
        <div class="card-header">
          <span>课程详细介绍</span>
        </div>
      </template>
      <div class="desc-content">
        <!-- 保留换行符展示文本 -->
        <p style="white-space: pre-wrap;">{{ course_info.description }}</p>
      </div>
    </el-card>
  </div>
  
  <!-- 预约下单对话框 -->
      <el-dialog v-model="book_dialog_visible" title="填写预约信息" width="500px">
        <el-form :model="order_form" label-width="100px">
          <el-form-item label="预约时间">
            <el-input v-model="order_form.appoint_time" placeholder="如：每周六下午2点-4点" />
          </el-form-item>
          <el-form-item label="上课地址" v-if="course_info.type === 0">
            <el-input v-model="order_form.address" placeholder="请填写详细上门地址" />
          </el-form-item>
          <el-form-item label="备注留言">
            <el-input v-model="order_form.remark" type="textarea" placeholder="给老师说点什么吧..." />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="book_dialog_visible = false">取消</el-button>
          <el-button type="primary" @click="submit_order">提交预约</el-button>
        </template>
      </el-dialog>
  
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '../utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const course_info = ref({})

// 获取本地用户信息（用于判断按钮显示）
const user_info = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))
const book_dialog_visible = ref(false)
const order_form = ref({
  course_id: null,
  appoint_time: '',
  address: '',
  remark: ''
})


// 学生：点击预约下单按钮
const handle_book = () => {
  order_form.value = { course_id: course_info.value.id } // 把课程ID带上
  book_dialog_visible.value = true
}


// 提交订单
const submit_order = async () => {
  // 简单校验
  if (!order_form.value.appoint_time) {
    ElMessage.warning('请填写期望的预约时间')
    return
  }
  if (course_info.value.type === 0 && !order_form.value.address) {
    ElMessage.warning('线下课程请填写上课地址')
    return
  }

  try {
    await request.post('/order/create', order_form.value)
    ElMessage.success('预约请求已发送，请到“我的订单”中查看状态')
    book_dialog_visible.value = false
  } catch(error) {}
}

// 加载课程详情
const load_detail = async () => {
  const course_id = route.query.course_id
  if (!course_id) {
    ElMessage.error('课程ID丢失')
    return
  }
  
  const res = await request.get('/course/detail', { params: { course_id } })
  course_info.value = res.data
  loading.value = false
}



// 管理员：要求修改
const handle_admin_modify = () => {
  ElMessageBox.confirm(
    '确定要将该课程打回待审核状态，要求家教修改吗？课程将从大厅隐藏。',
    '警告',
    { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' }
  ).then(async () => {
    await request.post('/course/admin/require_modify', null, {
      params: { course_id: course_info.value.id }
    })
    ElMessage.success('已将该课程打回，等待家教修改')
    router.back() // 操作完返回大厅
  })
}

onMounted(() => {
  load_detail()
})
</script>

<style scoped>
.detail-container { max-width: 1000px; margin: 0 auto; }
.detail-cover { width: 100%; height: 300px; object-fit: cover; border-radius: 8px; }
.info-section { display: flex; flex-direction: column; justify-content: space-between; padding: 10px 20px; }
h2 { margin-top: 0; font-size: 24px; color: #303133; }
.tags { margin-bottom: 20px; display: flex; gap: 10px; }
.price-box { background-color: #fff0f0; padding: 15px 20px; border-radius: 8px; color: #f56c6c; margin-bottom: 20px; }
.currency { font-size: 18px; font-weight: bold; }
.price { font-size: 32px; font-weight: bold; margin: 0 5px; }
.unit { font-size: 14px; color: #999; }
.tutor-card { display: flex; align-items: center; background-color: #f8f9fa; padding: 15px; border-radius: 8px; }
.tutor-info { margin-left: 15px; }
.tutor-info .name { font-size: 16px; font-weight: bold; color: #333; margin-bottom: 5px; }
.tutor-info .city { font-size: 13px; color: #666; display: flex; align-items: center; }
.action-box { margin-top: 20px; text-align: right; }
.action-btn { width: 200px; border-radius: 8px; font-weight: bold; }
.desc-card { margin-top: 20px; }
.desc-content { font-size: 15px; line-height: 1.8; color: #606266; padding: 10px; }
</style>