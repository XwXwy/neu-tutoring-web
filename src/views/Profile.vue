<template>
  <div class="profile-container">
    <el-row :gutter="20">
      
      <!-- 左侧：资料完成度与时间信息 -->
      <el-col :span="8">
        <el-card shadow="never" class="info-card">
          <div class="avatar-box">
            <el-upload
              class="avatar-uploader-circle"
              action="http://localhost:8080/file/upload"
              :show-file-list="false"
              :on-success="handle_avatar_success"
            >
              <el-avatar v-if="user_profile.avatar" :size="100" :src="user_profile.avatar" />
              <el-icon v-else class="avatar-uploader-icon-circle"><Plus /></el-icon>
            </el-upload>
            <h3>{{ user_profile.username }}</h3>
            <el-tag :type="user_profile.role === 1 ? 'success' : 'info'">
              {{ user_profile.role === 1 ? '家教老师' : '学生用户' }}
            </el-tag>
          </div>

          <el-divider>资料完善度</el-divider>
          <el-progress 
            :percentage="completion_rate" 
            :color="custom_colors" 
            :stroke-width="12" 
            text-inside 
          />
          <p class="tip-text" v-if="completion_rate < 100">
            请完善以下资料以提供更好的服务
          </p>

          <el-divider>系统记录</el-divider>
          <div class="time-record">
            <p><strong>注册时间：</strong>{{ user_profile.create_time }}</p>
            <p><strong>最后更新：</strong>{{ user_profile.update_time }}</p>
          </div>
          
          <!-- 家教专属：资金与评分 -->
          <div class="tutor-stats" v-if="user_profile.role === 1">
            <el-divider>数据统计</el-divider>
            <el-row>
              <el-col :span="12" class="stat-item">
                <div class="stat-title">钱包余额</div>
                <div class="stat-value text-danger">¥ {{ user_profile.wallet_balance || '0.00' }}</div>
              </el-col>
              <el-col :span="12" class="stat-item">
                <div class="stat-title">综合评分</div>
                <div class="stat-value text-warning"><el-icon><StarFilled /></el-icon> {{ user_profile.rating || '5.0' }}</div>
              </el-col>
            </el-row>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：资料编辑表单 -->
      <el-col :span="16">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span>基本信息设置</span>
            </div>
          </template>
          
          <el-form :model="user_profile" label-width="100px" label-position="left">
            <!-- 通用信息 -->
            <el-form-item label="真实姓名">
              <el-input v-model="user_profile.real_name" />
            </el-form-item>
            <el-form-item label="手机号码">
              <el-input v-model="user_profile.phone" />
            </el-form-item>
            <el-form-item label="所在城市">
              <el-input v-model="user_profile.city" placeholder="填写您所在的城市，方便同城匹配" />
            </el-form-item>
            <!-- 家教专属字段 -->
            <template v-if="user_profile.role === 1">
              <el-form-item label="毕业院校">
                <el-input v-model="user_profile.university" />
              </el-form-item>
              <el-form-item label="所学专业">
                <el-input v-model="user_profile.major" />
              </el-form-item>
              <el-form-item label="教龄(年)">
                <el-input-number v-model="user_profile.teaching_years" :min="0" />
              </el-form-item>
              <el-form-item label="个人简介">
                <el-input v-model="user_profile.bio" type="textarea" :rows="4" placeholder="向学生介绍一下你的教学风格吧..." />
              </el-form-item>
              
              <el-form-item label="教师资格证">
                <el-upload
                  class="cert-uploader"
                  action="http://localhost:8080/file/upload"
                  :show-file-list="false"
                  :on-success="handle_teacher_cert_success"
                >
                  <img v-if="user_profile.teacher_cert" :src="user_profile.teacher_cert" class="cert-img" />
                  <div v-else class="upload-box">
                    <el-icon><Plus /></el-icon>
                    <div>点击上传</div>
                  </div>
                </el-upload>
              </el-form-item>
            </template>

            <!-- 学生专属字段 -->
            <template v-if="user_profile.role === 2">
              <el-form-item label="就读年级">
                <el-select v-model="user_profile.grade" placeholder="请选择年级" style="width:100%">
                  <el-option label="小学" value="小学" />
                  <el-option label="初中" value="初中" />
                  <el-option label="高中" value="高中" />
                </el-select>
              </el-form-item>
              <el-form-item label="就读学校">
                <el-input v-model="user_profile.school" placeholder="填写所在学校" />
              </el-form-item>
              <el-form-item label="学习偏好">
                <el-input v-model="user_profile.preference" type="textarea" :rows="4" placeholder="说说你在学习上的困难或期望的老师风格..." />
              </el-form-item>
            </template>

            <el-form-item>
              <el-button type="primary" @click="save_profile">保存修改</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import request from '../utils/request'
import { ElMessage } from 'element-plus'

const user_profile = ref({})

// 进度条颜色分级
const custom_colors =[
  { color: '#f56c6c', percentage: 20 },
  { color: '#e6a23c', percentage: 60 },
  { color: '#6f7ad3', percentage: 80 },
  { color: '#5cb87a', percentage: 100 }
]

// 获取个人资料
const load_profile = async () => {
  const res = await request.get('/sysUser/profile')
  user_profile.value = res.data || {}
}

// 计算资料完善度 (%)
const completion_rate = computed(() => {
  const p = user_profile.value
  if (!p.role) return 0
  
  let filled = 0
  let total = 0
  
  // 基础必填项 (算4项)
  const base_keys = ['avatar', 'real_name', 'phone','city']
  total += base_keys.length
  base_keys.forEach(k => { if (p[k]) filled++ })

  if (p.role === 1) { // 家教 (额外5项)
    const tutor_keys =['university', 'major', 'teaching_years', 'degree_cert', 'bio']
    total += tutor_keys.length
    tutor_keys.forEach(k => { if (p[k] !== null && p[k] !== '') filled++ })
  } else if (p.role === 2) { // 学生 (额外3项)
    const student_keys = ['grade', 'school', 'preference']
    total += student_keys.length
    student_keys.forEach(k => { if (p[k]) filled++ })
  }
  
  return Math.round((filled / total) * 100)
})

// 保存个人资料
const save_profile = async () => {
  // 1. 调用后端更新接口
  await request.post('/sysUser/update_profile', user_profile.value)
  ElMessage.success('个人资料已保存')
  
  // 2. 【新增】同步更新 localStorage 里的本地缓存数据
  let local_user = JSON.parse(localStorage.getItem('userInfo') || '{}')
  local_user.avatar = user_profile.value.avatar      // 更新头像
  local_user.real_name = user_profile.value.real_name // 更新姓名
  local_user.city = user_profile.value.city          // 更新城市
  localStorage.setItem('userInfo', JSON.stringify(local_user))
  
  // 3. 【新增】向全局派发一个自定义事件，大声告诉其他组件：用户信息更新
  window.dispatchEvent(new Event('user_info_updated'))
  
  // 4. 重新拉取以更新 update_time
  load_profile() 
}

// 上传头像回调
const handle_avatar_success = (res) => {
  if (res.code === 200) {
    user_profile.value.avatar = res.data
    ElMessage.success('头像上传成功')
  }
}

// 上传教师证回调
const handle_teacher_cert_success = (res) => {
  if (res.code === 200) {
    user_profile.value.teacher_cert = res.data
    ElMessage.success('教师证上传成功')
  }
}

onMounted(() => {
  load_profile()
})
</script>

<style scoped>
.info-card {
  text-align: center;
}
.avatar-box {
  margin-bottom: 20px;
}
.avatar-uploader-circle :deep(.el-upload) {
  border: 1px dashed #d9d9d9;
  border-radius: 50%; /* 圆形上传框 */
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.avatar-uploader-circle :deep(.el-upload:hover) {
  border-color: #409EFF;
}
.avatar-uploader-icon-circle {
  font-size: 28px;
  color: #8c939d;
}
.tip-text {
  font-size: 12px;
  color: #909399;
  margin-top: 10px;
}
.time-record {
  text-align: left;
  font-size: 13px;
  color: #606266;
  line-height: 1.8;
}
.stat-item {
  text-align: center;
  margin-top: 10px;
}
.stat-title {
  font-size: 12px;
  color: #909399;
}
.stat-value {
  font-size: 20px;
  font-weight: bold;
  margin-top: 5px;
}
.text-danger { color: #F56C6C; }
.text-warning { color: #E6A23C; }

/* 教师证上传框 */
.cert-uploader :deep(.el-upload) {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  width: 160px;
  height: 120px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.cert-img {
  width: 160px;
  height: 120px;
  object-fit: cover;
}
.upload-box {
  color: #8c939d;
  font-size: 14px;
}
</style>