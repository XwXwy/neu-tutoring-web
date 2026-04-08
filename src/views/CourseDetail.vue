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

          <div class="tutor-card" style="cursor: pointer;" @click="go_tutor_profile(course_info.tutor_id)">
            <el-avatar :size="50" :src="course_info.tutor_avatar" />
            <div class="tutor-info">
              <div class="name">{{ course_info.tutor_name }} 老师 <el-icon><ArrowRight /></el-icon></div>
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
	
	
	<!-- 新增：免费试看资源 -->
	    <el-card shadow="never" class="desc-card" style="margin-top: 20px;">
	      <template #header>
	        <div class="card-header">
	          <span><el-icon><Collection /></el-icon> 免费试看资源</span>
	        </div>
	      </template>
	      
	      <el-table :data="free_resources" v-if="free_resources.length > 0">
	        <el-table-column prop="resource_name" label="资料名称" />
	        <el-table-column label="类型" width="100">
	          <template #default="scope">
	            <el-tag size="small">{{ scope.row.resource_type === 1 ? '视频' : '课件' }}</el-tag>
	          </template>
	        </el-table-column>
	        <el-table-column label="操作" width="120">
	          <template #default="scope">
	            <el-button type="primary" size="small" link @click="preview_free(scope.row)">立即试看</el-button>
	          </template>
	        </el-table-column>
	      </el-table>
	      <el-empty v-else :image-size="60" description="暂无试看资源" />
	    </el-card>
	
	    <!-- 复用之前的预览弹窗组件 (ResourceAudit.vue 里的那个) -->
	    <el-dialog v-model="preview_visible" :title="`试看: ${current_res.resource_name}`" width="800px">
	       <video v-if="current_res.resource_type === 1" :src="current_res.resource_url" controls style="width:100%"></video>
	       <iframe v-else :src="current_res.resource_url" style="width: 100%; height: 500px; border: none;"></iframe>
	    </el-dialog>
		
		
		<!-- 新增：课程专属评价列表 -->
		    <el-card shadow="never" class="desc-card" style="margin-top: 20px;">
		      <template #header>
		        <div class="card-header">
		          <span><el-icon><ChatSquare /></el-icon> 课程评价 ({{ comment_list.length }}条)</span>
		        </div>
		      </template>
		      <el-empty v-if="comment_list.length === 0" description="该课程暂无评价" />
		      <div v-else class="comment-list">
		        <!-- 样式复用了，和 TutorProfile 基本一致 -->
		        <div v-for="item in comment_list" :key="item.id" style="display: flex; padding: 15px 0; border-bottom: 1px solid #ebeef5;">
		          <el-avatar :size="40" :src="item.student_avatar" />
		          <div style="margin-left: 15px; flex: 1;">
		            <div style="margin-bottom: 5px; display: flex; align-items: center;">
		              <span style="font-weight: bold; font-size: 14px; margin-right: auto;">{{ item.student_name }}</span>
		              <span style="font-size: 12px; color: #909399;">{{ item.create_time }}</span>
		            </div>
		            <el-rate v-model="item.score" disabled size="small" />
		            <div style="font-size: 14px; color: #606266; margin-top: 8px;">{{ item.content }}</div>
		            <div style="margin-top: 5px; text-align: right;">
		                          <div style="margin-top: 5px; text-align: right;">
		                            <el-button 
		                              link 
		                              type="danger" 
		                              size="small" 
		                              :disabled="item.user_id === user_info.id" 
		                              @click="open_report_dialog(item.id)"
		                            >
		                              {{ item.user_id === user_info.id ? '我的评价' : '举报' }}
		                            </el-button>
		                          </div>
		            </div>
		          </div>
		        </div>
		      </div>
		    </el-card>
		
		    <!-- 举报弹窗 (和 TutorProfile 一模一样，你可以直接复制过来) -->
		    <el-dialog v-model="report_dialog_visible" title="举报违规评价" width="400px">
		      <el-form label-position="top">
		        <el-form-item label="请选择或填写举报理由：" required>
		          <el-radio-group v-model="report_reason" style="margin-bottom: 10px; display: flex; flex-direction: column; align-items: flex-start;">
		            <el-radio label="恶意攻击/辱骂老师">恶意攻击/辱骂老师</el-radio>
		            <el-radio label="虚假交易/刷单评价">虚假交易/刷单评价</el-radio>
		            <el-radio label="包含广告或违规信息">包含广告或违规信息</el-radio>
		            <el-radio label="其他">其他原因</el-radio>
		          </el-radio-group>
		          <el-input v-if="report_reason === '其他'" v-model="custom_reason" placeholder="请详细说明..." type="textarea" />
		        </el-form-item>
		      </el-form>
		      <template #footer>
		        <el-button @click="report_dialog_visible = false">取消</el-button>
		        <el-button type="primary" @click="submit_report">提交举报</el-button>
		      </template>
		    </el-dialog>
		
		
  </div>
  
<!-- 预约下单对话框 -->
    <el-dialog v-model="book_dialog_visible" title="填写预约信息" width="500px">
      <!-- 1. 绑定 ref 用于校验，绑定 rules 定义规则 -->
      <el-form ref="order_form_ref" :model="order_form" :rules="order_rules" label-width="100px">
        
        <!-- 2. 加上 prop 属性，对应 rules 里的字段名 -->
        <el-form-item label="预约时间" prop="appoint_time">
          <!-- 3. 使用日期时间选择器，限定格式 -->
          <el-date-picker
            v-model="order_form.appoint_time"
            type="datetime"
            placeholder="请选择期望的首次上课时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm"
            :disabled-date="disabled_date"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item label="上课地址" prop="address" v-if="course_info.type === 0">
          <el-input v-model="order_form.address" placeholder="请填写详细上门地址（如：xx小区x栋x号）" />
        </el-form-item>
        
        <el-form-item label="备注留言" prop="remark">
          <el-input 
            v-model="order_form.remark" 
            type="textarea" 
            :rows="3" 
            maxlength="200" 
            show-word-limit
            placeholder="给老师说点什么吧...(最多200字)" 
          />
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

// 【追加】评论列表相关
const comment_list = ref([])

// 【追加】举报弹窗相关
const report_dialog_visible = ref(false)
const current_comment_id = ref(null)
const report_reason = ref('恶意攻击/辱骂老师')
const custom_reason = ref('')

// 【追加】加载本课程专属的评论
const load_course_comments = async () => {
  const course_id = route.query.course_id
  if (!course_id) return
  try {
    const res = await request.get('/comment/course_list', { params: { course_id } })
    comment_list.value = res.data
  } catch(error) {}
}

// 【追加】跳转到家教个人主页
const go_tutor_profile = (tutor_id) => {
  router.push({ path: '/tutor-profile', query: { tutor_id } })
}

// 【追加】打开举报弹窗
const open_report_dialog = (comment_id) => {
  current_comment_id.value = comment_id
  report_reason.value = '恶意攻击/辱骂老师'
  custom_reason.value = ''
  report_dialog_visible.value = true
}

// 【追加】提交举报
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


// 【新增 1】表单的 DOM 引用
const order_form_ref = ref(null)

// 【新增 2】禁用今天之前的日期（不能预约过去的时间）
const disabled_date = (time) => {
  return time.getTime() < Date.now() - 8.64e7 // 减去一天的毫秒数，表示只能选今天及以后
}

// 【新增 3】定义表单校验规则
const order_rules = ref({
  appoint_time:[
    { required: true, message: '请选择预约上课时间', trigger: 'change' }
  ],
  address:[
    { required: true, message: '线下课程必须填写上门地址', trigger: 'blur' },
    { min: 5, max: 100, message: '地址长度需在 5 到 100 个字符之间', trigger: 'blur' }
  ]
})


const free_resources = ref([])
const preview_visible = ref(false)
const current_res = ref({})

// 在 load_detail 方法中顺便加载资料
const load_free_resources = async () => {
  const res = await request.get('/course_resource/list_by_course', { params: { course_id: route.query.course_id } })
  // 过滤出：1.已通过(status=1) 2.免费(is_free=1)
  free_resources.value = res.data.filter(item => item.status === 1 && item.is_free === 1)
}

const preview_free = (res) => {
  current_res.value = res
  preview_visible.value = true
}

// 学生：点击预约下单按钮 (保持不变，只是每次打开前清空一下旧数据)
const handle_book = () => {
  order_form.value = { 
    course_id: course_info.value.id,
    appoint_time: '',
    address: '',
    remark: ''
  } 
  book_dialog_visible.value = true
  // 移除上一次的校验红字提示
  if (order_form_ref.value) {
    order_form_ref.value.clearValidate()
  }
}

// 【修改】提交订单（加入校验拦截）
const submit_order = () => {
  // 调用 Element Plus 的表单校验方法
  order_form_ref.value.validate(async (valid) => {
    if (valid) {
      // 校验通过，发请求
      try {
        await request.post('/order/create', order_form.value)
        ElMessage.success('预约请求已发送，请到“我的订单”中查看状态')
        book_dialog_visible.value = false
      } catch(error) {}
    } else {
      // 校验不通过
      ElMessage.warning('请检查输入信息是否正确完整')
      return false
    }
  })
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
  load_free_resources()
  load_course_comments()
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