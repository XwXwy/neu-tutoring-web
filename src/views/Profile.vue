<template>
  <div class="editorial-page-container">
    <el-row :gutter="24">
      
      <!-- ================= 左侧：个人名片与统计 ================= -->
      <el-col :xs="24" :md="8">
        <el-card shadow="never" class="editorial-card profile-card">
          <div class="profile-header">
            <el-upload
              class="avatar-uploader"
              action="http://localhost:8080/file/upload"
              :show-file-list="false"
              :on-success="handle_avatar_success"
            >
              <el-avatar v-if="user_profile.avatar" :size="100" :src="user_profile.avatar" class="avatar-image" />
              <div v-else class="avatar-placeholder">
                <el-icon><Plus /></el-icon>
              </div>
              <div class="avatar-hover-mask">更换头像</div>
            </el-upload>
            
            <h2 class="profile-name serif-title">{{ user_profile.username }}</h2>
            <div class="role-badge" :class="'role-' + user_profile.role">
              {{ user_profile.role === 1 ? '家教老师' : '学生用户' }}
            </div>
          </div>

          <!-- 资料完善度 -->
          <div class="profile-section">
            <div class="section-title">资料完善度</div>
            <div class="progress-box">
              <el-progress 
                :percentage="completion_rate" 
                :show-text="false" 
                :stroke-width="8" 
                class="warm-progress"
              />
              <span class="progress-num">{{ completion_rate }}%</span>
            </div>
            <p class="progress-tip" v-if="completion_rate < 100">
              请完善右侧信息，完整的资料能为您带来更多机会。
            </p>
          </div>

          <!-- 系统记录 -->
          <div class="profile-section">
            <div class="section-title">账号记录</div>
            <div class="record-list">
              <div class="record-item">
                <span class="record-label">注册时间</span>
                <span class="record-value">{{ user_profile.create_time?.split(' ')[0] }}</span>
              </div>
              <div class="record-item">
                <span class="record-label">最后更新</span>
                <span class="record-value">{{ user_profile.update_time?.split(' ')[0] }}</span>
              </div>
            </div>
          </div>
          
          <!-- 家教专属：资金与评分 -->
          <div class="profile-section stat-section" v-if="user_profile.role === 1">
            <el-row :gutter="16">
              <el-col :span="12">
                <div class="stat-box">
                  <div class="stat-label">钱包余额</div>
                  <div class="stat-value text-terracotta">
                    <span class="stat-currency">¥</span>
                    <span class="stat-num">{{ user_profile.wallet_balance || '0.00' }}</span>
                  </div>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="stat-box">
                  <div class="stat-label">综合评分</div>
                  <div class="stat-value text-amber">
                    <el-icon class="stat-icon"><StarFilled /></el-icon>
                    <span class="stat-num">{{ user_profile.rating || '5.0' }}</span>
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-card>
      </el-col>

      <!-- ================= 右侧：资料编辑表单 ================= -->
      <el-col :xs="24" :md="16">
        <el-card shadow="never" class="editorial-card form-card">
          <div class="card-header">
            <h3 class="serif-title">基本信息设置</h3>
            <div class="header-actions">
              <button class="btn-text-danger" @click="password_dialog_visible = true">修改密码</button>
              <button class="btn-brand" @click="save_profile">保存修改</button>
            </div>
          </div>
          
          <el-form :model="user_profile" label-position="top" class="editorial-form">
            <!-- 通用信息 -->
            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="真实姓名">
                  <el-input v-model="user_profile.real_name" class="warm-input" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="手机号码">
                  <el-input v-model="user_profile.phone" class="warm-input" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="所在城市">
              <el-input v-model="user_profile.city" placeholder="填写您所在的城市，方便系统进行同城匹配" class="warm-input" />
            </el-form-item>

            <!-- 家教专属字段 -->
            <template v-if="user_profile.role === 1">
              <div class="divider-line"></div>
              <h4 class="sub-section-title">教学资质信息</h4>
              
              <el-row :gutter="24">
                <el-col :span="12">
                  <el-form-item label="毕业院校">
                    <el-input v-model="user_profile.university" class="warm-input" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="所学专业">
                    <el-input v-model="user_profile.major" class="warm-input" />
                  </el-form-item>
                </el-col>
              </el-row>
              
              <el-form-item label="教龄 (年)">
                <el-input-number v-model="user_profile.teaching_years" :min="0" class="warm-input-number" />
              </el-form-item>
              
              <el-form-item label="个人简介">
                <el-input 
                  v-model="user_profile.bio" 
                  type="textarea" 
                  :rows="5" 
                  placeholder="向学生介绍一下您的教学风格、擅长领域或过往成绩吧..." 
                  class="warm-textarea" 
                />
              </el-form-item>
              
              <el-form-item label="教师资格证扫描件">
                <el-upload
                  class="cert-uploader"
                  action="http://localhost:8080/file/upload"
                  :show-file-list="false"
                  :on-success="handle_teacher_cert_success"
                >
                  <img v-if="user_profile.teacher_cert" :src="user_profile.teacher_cert" class="cert-img" />
                  <div v-else class="upload-placeholder">
                    <el-icon><Plus /></el-icon>
                    <span>点击上传证件</span>
                  </div>
                </el-upload>
              </el-form-item>
            </template>

            <!-- 学生专属字段 -->
            <template v-if="user_profile.role === 2">
              <div class="divider-line"></div>
              <h4 class="sub-section-title">学习需求信息</h4>
              
              <el-row :gutter="24">
                <el-col :span="12">
                  <el-form-item label="就读年级">
                    <el-select v-model="user_profile.grade" placeholder="请选择当前年级" style="width:100%" popper-class="warm-select-popper">
                      <el-option label="小学" value="小学" />
                      <el-option label="初中" value="初中" />
                      <el-option label="高中" value="高中" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="就读学校">
                    <el-input v-model="user_profile.school" placeholder="填写您所在的学校名称" class="warm-input" />
                  </el-form-item>
                </el-col>
              </el-row>
              
              <el-form-item label="学习偏好及困扰">
                <el-input 
                  v-model="user_profile.preference" 
                  type="textarea" 
                  :rows="5" 
                  placeholder="说说您在学习上遇到的困难，或者期望家教老师拥有什么样的讲课风格..." 
                  class="warm-textarea" 
                />
              </el-form-item>
            </template>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
  
  <!-- ================= 修改密码弹窗 ================= -->
  <el-dialog 
    v-model="password_dialog_visible" 
    title="修改账户密码" 
    width="420px"
    class="editorial-dialog"
    destroy-on-close
  >
    <div class="dialog-subtitle">密码修改成功后，您需要重新登录平台。</div>
    <el-form :model="password_form" label-position="top" class="editorial-form form-stacked">
      <el-form-item label="旧密码" required>
        <el-input v-model="password_form.old_password" type="password" show-password class="warm-input" />
      </el-form-item>
      <el-form-item label="新密码" required>
        <el-input v-model="password_form.new_password" type="password" show-password class="warm-input" />
      </el-form-item>
      <el-form-item label="确认新密码" required>
        <el-input v-model="password_form.confirm_password" type="password" show-password class="warm-input" />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button class="btn-secondary" @click="password_dialog_visible = false">取消</el-button>
        <el-button class="btn-danger" @click="submit_change_password">确认修改并重新登录</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, onMounted, onActivated, computed } from 'vue'
import request from '../utils/request'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { Plus, StarFilled } from '@element-plus/icons-vue'

const router = useRouter()
const user_profile = ref({})

const password_dialog_visible = ref(false)
const password_form = ref({
  old_password: '',
  new_password: '',
  confirm_password: ''
})

const submit_change_password = async () => {
  if (password_form.value.new_password !== password_form.value.confirm_password) {
    ElMessage.error('两次输入的新密码不一致')
    return
  }
  try {
    const res = await request.post('/sysUser/change_password', {
      old_password: password_form.value.old_password,
      new_password: password_form.value.new_password
    })
    ElMessage.success(res.message) 
    
    localStorage.clear()
    router.push('/login')
  } catch (error) {}
}

const load_profile = async () => {
  const res = await request.get('/sysUser/profile')
  user_profile.value = res.data || {}
}

const completion_rate = computed(() => {
  const p = user_profile.value
  if (!p.role) return 0
  
  let filled = 0
  let total = 0
  
  const base_keys = ['avatar', 'real_name', 'phone','city']
  total += base_keys.length
  base_keys.forEach(k => { if (p[k]) filled++ })

  if (p.role === 1) { 
    const tutor_keys = ['university', 'major', 'teaching_years', 'degree_cert', 'bio']
    total += tutor_keys.length
    tutor_keys.forEach(k => { if (p[k] !== null && p[k] !== '') filled++ })
  } else if (p.role === 2) { 
    const student_keys = ['grade', 'school', 'preference']
    total += student_keys.length
    student_keys.forEach(k => { if (p[k]) filled++ })
  }
  
  return Math.round((filled / total) * 100)
})

const save_profile = async () => {
  await request.post('/sysUser/update_profile', user_profile.value)
  ElMessage.success('个人资料已保存')
  
  let local_user = JSON.parse(localStorage.getItem('userInfo') || '{}')
  local_user.avatar = user_profile.value.avatar      
  local_user.real_name = user_profile.value.real_name 
  local_user.city = user_profile.value.city          
  localStorage.setItem('userInfo', JSON.stringify(local_user))
  
  window.dispatchEvent(new Event('user_info_updated'))
  load_profile() 
}

const handle_avatar_success = (res) => {
  if (res.code === 200) {
    user_profile.value.avatar = res.data
    ElMessage.success('头像上传成功')
  }
}

const handle_teacher_cert_success = (res) => {
  if (res.code === 200) {
    user_profile.value.teacher_cert = res.data
    ElMessage.success('教师证上传成功')
  }
}

// 首次挂载时加载
onMounted(() => {
  load_profile()
})

// 从缓存中恢复时刷新（防止在个人中心修改后回来看到旧数据）
onActivated(() => {
  load_profile()
})
</script>

<style scoped>
/* ================= 美学色板与变量定义 ================= */
* {
  --clr-parchment: #f5f4ed;     
  --clr-ivory: #faf9f5;         
  --clr-white: #ffffff;
  --clr-near-black: #141413;    
  
  --clr-terracotta: #c96442;    /* 进度条/资金/品牌色 */
  --clr-coral: #d97757;         
  --clr-danger-red: #b02a2a;    /* 修改密码操作 */
  --clr-amber-warm: #d98f3e;    /* 评分星标/提示 */
  
  --clr-olive: #5e5d59;         /* 表单Label/次级文本 */
  --clr-stone: #87867f;         /* 记录值/辅助说明 */
  --clr-charcoal: #4d4c48;      
  
  --clr-warm-sand: #e8e6dc;     /* 进度条底轨/占位图 */
  --clr-border-cream: #f0eee6;  /* 分割线 */
  --clr-border-warm: #e8e6dc;   /* 输入框边框 */
  --clr-focus-blue: #3898ec;
  
  --font-serif: "Georgia", "Times New Roman", serif;
  --font-sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.editorial-page-container {
  font-family: var(--font-sans);
  padding-bottom: 40px;
}

/* ================= 柔和卡片系统 ================= */
.editorial-card {
  background-color: var(--clr-ivory);
  border: 1px solid var(--clr-border-cream);
  border-radius: 12px;
  box-shadow: rgba(0, 0, 0, 0.02) 0px 4px 12px !important;
  height: 100%;
}
.card-header {
  padding: 24px 32px 16px;
  border-bottom: 1px solid var(--clr-border-cream);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.form-card :deep(.el-card__body) { padding: 32px; }
.profile-card :deep(.el-card__body) { padding: 0; }

.serif-title {
  font-family: var(--font-serif);
  font-size: 20px;
  font-weight: 500;
  color: var(--clr-near-black);
  margin: 0;
}

.divider-line {
  height: 1px; width: 100%;
  background-color: var(--clr-border-cream);
  margin: 32px 0 24px;
}
.sub-section-title {
  font-family: var(--font-serif);
  font-size: 16px;
  font-weight: 500;
  color: var(--clr-near-black);
  margin: 0 0 20px 0;
}

/* ================= 左侧：个人名片区 ================= */
.profile-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px 32px;
  background: linear-gradient(180deg, var(--clr-parchment) 0%, var(--clr-ivory) 100%);
  border-bottom: 1px solid var(--clr-border-cream);
}

/* 头像上传 (带有优雅的悬停遮罩) */
.avatar-uploader { position: relative; border-radius: 50%; overflow: hidden; margin-bottom: 20px; cursor: pointer; }
.avatar-image { border: 2px solid var(--clr-white); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
.avatar-placeholder { width: 100px; height: 100px; border-radius: 50%; background-color: var(--clr-warm-sand); display: flex; align-items: center; justify-content: center; font-size: 28px; color: var(--clr-stone); border: 2px dashed var(--clr-border-warm); }
.avatar-hover-mask { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(20, 20, 19, 0.5); color: var(--clr-ivory); display: flex; align-items: center; justify-content: center; font-size: 13px; opacity: 0; transition: opacity 0.2s; }
.avatar-uploader:hover .avatar-hover-mask { opacity: 1; }

.profile-name { margin: 0 0 12px 0; font-size: 22px; }
.role-badge { display: inline-block; padding: 4px 12px; border-radius: 16px; font-size: 13px; font-weight: 500; }
.role-1 { background-color: rgba(217, 119, 87, 0.1); color: var(--clr-coral); border: 1px solid rgba(217, 119, 87, 0.2); }
.role-2 { background-color: var(--clr-border-cream); color: var(--clr-charcoal); border: 1px solid var(--clr-border-warm); }

.profile-section { padding: 24px 32px; border-bottom: 1px solid var(--clr-border-cream); }
.profile-section:last-child { border-bottom: none; }
.section-title { font-size: 13px; color: var(--clr-stone); font-weight: 500; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 16px; }

/* 重写进度条 */
.progress-box { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
.warm-progress { flex: 1; }
.warm-progress :deep(.el-progress-bar__outer) { background-color: var(--clr-border-warm) !important; border-radius: 4px; }
.warm-progress :deep(.el-progress-bar__inner) { background-color: var(--clr-terracotta) !important; border-radius: 4px; transition: width 0.6s ease; }
.progress-num { font-family: monospace; font-size: 14px; font-weight: 500; color: var(--clr-terracotta); }
.progress-tip { font-size: 13px; color: var(--clr-amber-warm); margin: 0; line-height: 1.5; }

/* 账号记录 */
.record-list { display: flex; flex-direction: column; gap: 12px; }
.record-item { display: flex; justify-content: space-between; align-items: center; font-size: 14px; }
.record-label { color: var(--clr-olive); }
.record-value { color: var(--clr-near-black); font-family: monospace; }

/* 数据统计区 */
.stat-section { background-color: var(--clr-parchment); }
.stat-box { display: flex; flex-direction: column; gap: 8px; }
.stat-label { font-size: 13px; color: var(--clr-olive); }
.stat-value { font-family: monospace; font-size: 24px; font-weight: 600; display: flex; align-items: baseline; }
.text-terracotta { color: var(--clr-terracotta); }
.text-amber { color: var(--clr-amber-warm); }
.stat-currency { font-size: 16px; margin-right: 4px; }
.stat-icon { font-size: 20px; margin-right: 6px; }

/* ================= 右侧：表单区 ================= */
.header-actions { display: flex; align-items: center; gap: 16px; }
.btn-text-danger { background: transparent; border: none; color: var(--clr-stone); font-size: 14px; font-weight: 500; cursor: pointer; transition: color 0.2s; padding: 0; }
.btn-text-danger:hover { color: var(--clr-danger-red); }
.btn-brand { background: var(--clr-terracotta) !important; color: var(--clr-ivory) !important; border: none; border-radius: 8px; padding: 8px 24px; font-weight: 500; box-shadow: var(--clr-terracotta) 0px 0px 0px 0px, var(--clr-terracotta) 0px 0px 0px 1px; cursor: pointer; transition: opacity 0.2s; }
.btn-brand:hover { opacity: 0.9; }

.editorial-form :deep(.el-form-item__label) { font-weight: 500; color: var(--clr-olive); font-size: 14px; padding-bottom: 6px; }
.editorial-form :deep(.el-form-item) { margin-bottom: 20px; }

/* 统一暖色输入框 */
.warm-input :deep(.el-input__wrapper) { background-color: var(--clr-parchment); border: 1px solid var(--clr-border-warm); border-radius: 8px; box-shadow: none !important; transition: all 0.2s; }
.warm-input :deep(.el-input__wrapper.is-focus) { background-color: var(--clr-white); box-shadow: 0 0 0 1px var(--clr-focus-blue) !important; }
.warm-textarea :deep(.el-textarea__inner) { background-color: var(--clr-parchment); border: 1px solid var(--clr-border-warm); border-radius: 8px; padding: 12px; font-size: 14px; color: var(--clr-near-black); box-shadow: none !important; line-height: 1.6;}
.warm-textarea :deep(.el-textarea__inner:focus) { background-color: var(--clr-white); box-shadow: 0 0 0 1px var(--clr-focus-blue) !important; }
.warm-input-number { width: 100% !important; }
.warm-input-number :deep(.el-input__wrapper) { background-color: var(--clr-parchment); border: 1px solid var(--clr-border-warm); border-radius: 8px; box-shadow: none !important; }

:global(.warm-select-popper) { border-radius: 8px !important; border: 1px solid var(--clr-border-warm) !important; }
:global(.warm-select-popper .el-select-dropdown__item.selected) { color: var(--clr-terracotta) !important; font-weight: 500; }

/* 证件上传相框 */
.cert-uploader :deep(.el-upload) {
  border: 1px dashed var(--clr-stone); border-radius: 8px; cursor: pointer; position: relative; overflow: hidden;
  width: 240px; height: 160px; background-color: var(--clr-parchment); transition: all 0.2s ease;
}
.cert-uploader :deep(.el-upload:hover) { border-color: var(--clr-terracotta); background-color: var(--clr-white); }
.cert-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.upload-placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%; color: var(--clr-olive); font-size: 13px; }
.upload-placeholder .el-icon { font-size: 28px; margin-bottom: 8px; color: var(--clr-stone); }

/* ================= 修改密码弹窗 ================= */
:deep(.editorial-dialog) { border-radius: 16px; background-color: var(--clr-ivory); }
:deep(.editorial-dialog .el-dialog__header) { padding: 32px 32px 0; margin-right: 0; }
:deep(.editorial-dialog .el-dialog__title) { font-family: var(--font-serif); font-weight: 500; font-size: 22px; color: var(--clr-near-black); }
:deep(.editorial-dialog .el-dialog__body) { padding: 24px 32px; }
.dialog-subtitle { font-size: 14px; color: var(--clr-danger-red); margin-top: -16px; margin-bottom: 24px; }

.dialog-footer { padding-top: 12px; display: flex; justify-content: flex-end; gap: 12px; }
.btn-danger { background: var(--clr-danger-red) !important; color: var(--clr-ivory) !important; border: none; border-radius: 8px; padding: 8px 24px; font-weight: 500; }
.btn-secondary { background: var(--clr-warm-sand) !important; color: var(--clr-charcoal) !important; border: none; border-radius: 8px; padding: 8px 24px; font-weight: 500; }
</style>