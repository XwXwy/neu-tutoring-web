<template>
  <div class="login-wrapper">
    <!-- ================= 左侧：自动轮播海报区 ================= -->
    <div class="banner-section">
      <!-- 轮播图组件，填满 100vh 高度 -->
      <el-carousel height="100vh" direction="vertical" :autoplay="true" :interval="4000" indicator-position="none" arrow="never">
        <el-carousel-item v-for="(img_url, index) in bg_images" :key="index">
          <div class="bg-image-item" :style="{ backgroundImage: 'url(' + img_url + ')' }"></div>
        </el-carousel-item>
      </el-carousel>

      <!-- 覆盖在轮播图上方的文字与遮罩层 -->
      <div class="banner-overlay">
        <div class="brand-info">
          <h1 class="brand-title">知行家教服务平台</h1>
          <p class="brand-slogan">连接优质师资 · 点亮学习之路</p>
        </div>
        <div class="copyright">
          © 2026 知行教育科技. All rights reserved. V1.0.0
        </div>
      </div>
    </div>

    <!-- ================= 右侧：登录/注册操作区 ================= -->
    <div class="form-section">
      <div class="form-container">
        <div class="form-header">
          <h2>{{ is_register ? '创建您的账号' : '欢迎登录平台' }}</h2>
          <p class="sub-title">
            {{ is_register ? '只需几步，开启专属学习/教学之旅' : '请输入账号和密码进入系统' }}
          </p>
        </div>

        <!-- 登录表单 -->
        <el-form v-if="!is_register" :model="login_form" class="auth-form" @keyup.enter="handle_login">
          <el-form-item>
            <el-input v-model="login_form.username" placeholder="请输入账号" prefix-icon="User" size="large" clearable />
          </el-form-item>
          <el-form-item>
            <el-input v-model="login_form.password" type="password" placeholder="请输入密码" prefix-icon="Lock" size="large" show-password />
          </el-form-item>
          <el-button type="primary" size="large" class="submit-btn" :loading="loading" @click="handle_login">
            立 即 登 录
          </el-button>
          <div class="action-bar">
            <el-link type="info" :underline="false" @click="open_forgot_dialog">忘记密码？</el-link>
            <el-link type="primary" :underline="false" @click="toggle_mode">注册新账号 <el-icon><ArrowRight /></el-icon></el-link>
          </div>
        </el-form>

        <!-- 注册表单 -->
        <el-form v-else :model="register_form" class="auth-form" @keyup.enter="handle_register" label-position="top">
          <!-- ... 注册表单内部字段保持与之前完全一致 ... -->
          <el-row :gutter="15">
            <el-col :span="12">
              <el-form-item label="账号"><el-input v-model="register_form.username" placeholder="设置账号" size="large" /></el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="密码"><el-input v-model="register_form.password" type="password" placeholder="设置密码" show-password size="large" /></el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="15">
            <el-col :span="12">
              <el-form-item label="真实姓名"><el-input v-model="register_form.real_name" placeholder="您的姓名" size="large" /></el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="手机号码"><el-input v-model="register_form.phone" placeholder="11位手机号" size="large" /></el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="注册身份">
            <el-radio-group v-model="register_form.role" class="role-radio-group">
              <el-radio-button :label="2">👨‍🎓 我是学生</el-radio-button>
              <el-radio-button :label="1">👩‍🏫 我是家教</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <div v-if="register_form.role === 1" class="tutor-extra-info">
            <el-row :gutter="15">
              <el-col :span="12"><el-form-item label="毕业院校"><el-input v-model="register_form.university" size="large" /></el-form-item></el-col>
              <el-col :span="12"><el-form-item label="所学专业"><el-input v-model="register_form.major" size="large" /></el-form-item></el-col>
            </el-row>
            <el-form-item label="教龄(年)">
              <el-input-number v-model="register_form.teaching_years" :min="0" :max="50" style="width: 100%" size="large" />
            </el-form-item>
            <el-row :gutter="15">
              <el-col :span="12">
                <el-form-item label="学历证书 (必填)" required>
                  <el-upload class="cert-uploader" action="http://localhost:8080/file/upload" :show-file-list="false" :on-success="handle_degree_success" :before-upload="before_upload">
                    <img v-if="register_form.degree_cert" :src="register_form.degree_cert" class="uploaded-img" />
                    <div v-else class="upload-placeholder"><el-icon><Plus /></el-icon><span>点击上传</span></div>
                  </el-upload>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="教师资格证 (选填)">
                  <el-upload class="cert-uploader" action="http://localhost:8080/file/upload" :show-file-list="false" :on-success="handle_teacher_success" :before-upload="before_upload">
                    <img v-if="register_form.teacher_cert" :src="register_form.teacher_cert" class="uploaded-img" />
                    <div v-else class="upload-placeholder"><el-icon><Plus /></el-icon><span>点击上传</span></div>
                  </el-upload>
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <el-button type="success" size="large" class="submit-btn" :loading="loading" @click="handle_register">
            立 即 注 册
          </el-button>
          <div class="action-bar center">
            <span style="color: #909399; font-size: 14px;">已有账号？</span>
            <el-link type="primary" :underline="false" @click="toggle_mode">返回登录</el-link>
          </div>
        </el-form>

        <!-- 底部协议区 -->
        <div class="agreement-box">
          <el-checkbox v-model="is_agreed" size="small">
            <span class="agreement-text">我已阅读并同意</span>
            <!-- 使用 @click.prevent 阻止点击链接时触发 checkbox 的选中状态切换 -->
            <el-link type="primary" :underline="false" style="font-size: 12px; margin: 0 2px;" @click.prevent="open_agreement">用户协议</el-link>
            <span class="agreement-text">和</span>
            <el-link type="primary" :underline="false" style="font-size: 12px; margin-left: 2px;" @click.prevent="open_privacy">隐私保护政策</el-link>
          </el-checkbox>
        </div>
      </div>
    </div>

    <!-- ================= 弹窗：用户协议 ================= -->
    <el-dialog v-model="agreement_visible" title="知行家教平台用户服务协议" width="600px" center destroy-on-close>
      <div class="legal-text-box">
        <h4>1. 总则</h4>
        <p>欢迎您注册并使用知行家教服务平台。本协议是您与平台之间关于使用本服务的法律文件。请您在注册前仔细阅读，点击“同意”即表示您完全接受本协议的所有条款。</p>
        <h4>2. 用户行为规范</h4>
        <p>用户在平台上应遵守国家法律法规，不得发布任何违法、违规、虚假的信息。家教老师需保证所上传的学历、证书等资质信息真实有效，不得进行虚假宣传或欺诈刷单行为。</p>
        <h4>3. 费用与结算</h4>
        <p>平台采用资金托管模式。学生支付的课时费将由平台暂管，待课程顺利完成且双方无异议后，资金将结算至家教的平台钱包。若发生交易纠纷，平台有权冻结相关资金并进行仲裁。</p>
        <h4>4. 违约责任</h4>
        <p>若用户违反本协议，平台有权采取包括但不限于：警告、隐藏评价、限制接单、永久封停账号等措施，并保留追究法律责任的权利。</p>
      </div>
      <template #footer>
        <el-button type="primary" @click="agreement_visible = false">我已阅读并了解</el-button>
      </template>
    </el-dialog>

    <!-- ================= 弹窗：隐私政策 ================= -->
    <el-dialog v-model="privacy_visible" title="个人信息保护政策" width="600px" center destroy-on-close>
      <div class="legal-text-box">
        <h4>1. 信息收集</h4>
        <p>为了给您提供精准的家教撮合服务，我们需要收集您的手机号码、真实姓名、所在城市等基本信息。对于家教老师，我们还将严格审核并存储您的学历证书扫描件。</p>
        <h4>2. 信息使用</h4>
        <p>我们承诺，收集的个人信息仅用于平台内部的身份核实、订单匹配和防欺诈机制，绝不向任何无合作关系的第三方泄露、出售或共享您的隐私数据。</p>
        <h4>3. 数据安全</h4>
        <p>平台采用国际标准的加密算法（如 MD5/SHA256）对您的登录密码进行加密存储。上传的证件图片存储于私有化对象存储集群（MinIO），拥有严格的安全访问策略控制。</p>
      </div>
      <template #footer>
        <el-button type="primary" @click="privacy_visible = false">我已阅读并了解</el-button>
      </template>
    </el-dialog>

<!-- ================= 弹窗：找回密码 ================= -->
    <el-dialog v-model="forgot_dialog_visible" title="找回密码" width="400px" center destroy-on-close>
      <el-form :model="forgot_form" label-position="top">
        <el-form-item label="绑定的手机号码" required>
          <el-input v-model="forgot_form.phone" placeholder="请输入注册时填写的手机号" size="large" prefix-icon="Phone" />
        </el-form-item>
        
        <el-form-item label="短信验证码" required>
          <div style="display: flex; gap: 10px; width: 100%;">
            <el-input v-model="forgot_form.code" placeholder="6位验证码" size="large" style="flex: 1;" />
            <el-button type="primary" size="large" :disabled="is_counting" @click="get_sms_code" style="width: 120px;">
              {{ is_counting ? `${countdown}s 后重试` : '获取验证码' }}
            </el-button>
          </div>
        </el-form-item>
        
        <el-form-item label="设置新密码" required>
          <el-input v-model="forgot_form.new_password" type="password" placeholder="请输入新密码" show-password size="large" prefix-icon="Lock" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="forgot_dialog_visible = false">取 消</el-button>
        <el-button type="primary" :loading="resetting" @click="submit_reset_password">确认重置</el-button>
      </template>
    </el-dialog>


  </div>
</template>

<script setup>
import { ref } from 'vue'
import request from '../utils/request'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { User, Lock, ArrowRight, Plus } from '@element-plus/icons-vue'

const router = useRouter()
const is_register = ref(false)
const loading = ref(false)
const is_agreed = ref(false) 

// 【新增】轮播图背景数组 (使用精美的高清壁纸作为演示)
const bg_images = ref([
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1920&auto=format&fit=crop', // 图书馆/学习氛围
  'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1920&auto=format&fit=crop', // 笔记/探讨
  'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1920&auto=format&fit=crop'  // 课堂视角
])

// 【新增】协议弹窗控制
const agreement_visible = ref(false)
const privacy_visible = ref(false)

const open_agreement = () => { agreement_visible.value = true }
const open_privacy = () => { privacy_visible.value = true }

// 【新增】忘记密码相关逻辑
const forgot_dialog_visible = ref(false)
const forgot_form = ref({ phone: '', code: '', new_password: '' })
const resetting = ref(false)

// 倒计时相关
const is_counting = ref(false)
const countdown = ref(60)
let timer = null

const open_forgot_dialog = () => {
  forgot_form.value = { phone: '', code: '', new_password: '' }
  // 清除倒计时状态（如果上次没走完）
  if (timer) clearInterval(timer)
  is_counting.value = false
  countdown.value = 60
  forgot_dialog_visible.value = true
}

const get_sms_code = async () => {
  if (!forgot_form.value.phone || forgot_form.value.phone.length !== 11) {
    ElMessage.warning('请输入正确的11位手机号码')
    return
  }
  
  try {
    const res = await request.post('/sysUser/send_sms', null, { 
      params: { phone: forgot_form.value.phone } 
    })
    
    // 显示后端返回的模拟验证码信息
    ElMessage.success(res.data)
    
    // 开启 60 秒倒计时
    is_counting.value = true
    countdown.value = 60
    timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
        is_counting.value = false
      }
    }, 1000)
    
  } catch (error) {}
}

const submit_reset_password = async () => {
  if (!forgot_form.value.code || !forgot_form.value.new_password) {
    ElMessage.warning('请填写完整的验证码和新密码')
    return
  }
  
  resetting.value = true
  try {
    await request.post('/sysUser/reset_password', forgot_form.value)
    ElMessage.success('密码重置成功！请使用新密码登录')
    forgot_dialog_visible.value = false
  } catch (error) {}
  resetting.value = false
}
const login_form = ref({ username: '', password: '' })
const register_form = ref({ username: '', password: '', real_name: '', phone: '', role: 2, university: '', major: '', teaching_years: 0, degree_cert: '', teacher_cert: '' })

const toggle_mode = () => {
  is_register.value = !is_register.value
  is_agreed.value = false 
}

const handle_login = async () => {
  if (!is_agreed.value) { ElMessage.warning('请先勾选同意用户协议和隐私保护政策'); return }
  if (!login_form.value.username || !login_form.value.password) { ElMessage.warning('请输入账号和密码'); return }

  loading.value = true
  try {
    const res = await request.post('/sysUser/login', login_form.value)
    localStorage.setItem('token', res.data.tokenValue)
    localStorage.setItem('userInfo', JSON.stringify(res.data.userInfo))
    ElMessage.success('登录成功！')
    router.push('/home') 
  } catch (error) {}
  loading.value = false
}

const handle_register = async () => {
  if (!is_agreed.value) { ElMessage.warning('请先勾选同意用户协议和隐私保护政策'); return }
  if (!register_form.value.username || !register_form.value.password || !register_form.value.real_name) {
    ElMessage.warning('请填写完整的账号、密码和姓名'); return
  }
  if (register_form.value.role === 1) {
    if (!register_form.value.university || !register_form.value.major) { ElMessage.warning('家教老师请填写毕业院校和专业'); return }
    if (!register_form.value.degree_cert) { ElMessage.warning('家教老师必须上传学历证书'); return }
  }

  loading.value = true
  try {
    await request.post('/sysUser/register', register_form.value)
    if (register_form.value.role === 1) {
      ElMessage.success('家教注册成功！请等待管理员审核。')
    } else {
      ElMessage.success('注册成功！欢迎加入平台，请登录。')
    }
    register_form.value = { username: '', password: '', real_name: '', phone: '', role: 2, university: '', major: '', teaching_years: 0, degree_cert: '', teacher_cert: '' }
    toggle_mode()
  } catch (error) {}
  loading.value = false
}

const handle_degree_success = (res) => {
  if (res.code === 200) { register_form.value.degree_cert = res.data; ElMessage.success('学历证书上传成功') } 
  else { ElMessage.error(res.message) }
}
const handle_teacher_success = (res) => {
  if (res.code === 200) { register_form.value.teacher_cert = res.data; ElMessage.success('教师资格证上传成功') }
}
const before_upload = (file) => {
  const is_img = file.type === 'image/jpeg' || file.type === 'image/png'
  const is_lt2m = file.size / 1024 / 1024 < 2
  if (!is_img) ElMessage.error('只能上传 JPG/PNG 格式图片!')
  if (!is_lt2m) ElMessage.error('图片大小不能超过 2MB!')
  return is_img && is_lt2m
}
</script>

<style scoped>
.login-wrapper {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: #ffffff;
}

/* ================= 左侧海报区 (轮播图版) ================= */
.banner-section {
  flex: 1;
  position: relative;
  overflow: hidden;
}
.bg-image-item {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  /* 轮播图切换时的平滑缩放特效，商业级质感 */
  transition: transform 5s ease;
}
.el-carousel__item.is-active .bg-image-item {
  transform: scale(1.05);
}

/* 覆盖在轮播图上的遮罩与文字 */
.banner-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 33, 71, 0.4); /* 深蓝色半透明遮罩，保证文字清晰 */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  z-index: 10;
  pointer-events: none; /* 让遮罩不阻挡下面元素的事件(如果有) */
}
.brand-info {
  text-align: center;
}
.brand-title {
  font-size: 48px;
  font-weight: 800;
  letter-spacing: 4px;
  margin-bottom: 20px;
  text-shadow: 0 4px 10px rgba(0,0,0,0.5);
}
.brand-slogan {
  font-size: 20px;
  letter-spacing: 2px;
  opacity: 0.9;
  text-shadow: 0 2px 5px rgba(0,0,0,0.5);
}
.copyright {
  position: absolute;
  bottom: 30px;
  left: 40px;
  font-size: 13px;
  opacity: 0.7;
}

/* ================= 右侧表单区 ================= */
.form-section {
  width: 480px; 
  background-color: #ffffff;
  box-shadow: -10px 0 30px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  z-index: 20;
  overflow-y: auto; 
}
.form-container {
  width: 100%;
  padding: 60px 50px;
  box-sizing: border-box;
  margin: auto 0; 
}

.form-header { margin-bottom: 40px; }
.form-header h2 { font-size: 28px; color: #303133; margin: 0 0 10px 0; }
.sub-title { font-size: 14px; color: #909399; margin: 0; }

.auth-form :deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px #e4e7ed inset;
  background-color: #f5f7fa; 
}
.auth-form :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #409eff inset;
  background-color: #ffffff;
}

.submit-btn { width: 100%; margin-top: 15px; border-radius: 6px; font-weight: bold; letter-spacing: 2px; }
.action-bar { display: flex; justify-content: space-between; align-items: center; margin-top: 20px; }
.action-bar.center { justify-content: center; }

/* 注册特有样式 */
.role-radio-group { width: 100%; display: flex; }
.role-radio-group :deep(.el-radio-button) { flex: 1; }
.role-radio-group :deep(.el-radio-button__inner) { width: 100%; }
.tutor-extra-info {
  background-color: #fcfcfc; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px dashed #e4e7ed;
}

.cert-uploader :deep(.el-upload) {
  border: 1px dashed #d9d9d9; border-radius: 6px; cursor: pointer; position: relative; overflow: hidden;
  width: 100%; height: 100px; background-color: #fff; transition: all 0.3s;
}
.cert-uploader :deep(.el-upload:hover) { border-color: #409EFF; }
.uploaded-img { width: 100%; height: 100px; object-fit: cover; display: block; }
.upload-placeholder { display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; color: #8c939d; font-size: 13px; }
.upload-placeholder .el-icon { font-size: 24px; margin-bottom: 5px; }

/* 底部协议与法律文本样式 */
.agreement-box { margin-top: 40px; text-align: center; }
.agreement-text { color: #909399; font-size: 12px; }
.legal-text-box {
  max-height: 400px;
  overflow-y: auto;
  padding: 0 10px;
  color: #606266;
  line-height: 1.8;
  font-size: 14px;
}
.legal-text-box h4 {
  color: #303133;
  margin-top: 20px;
  margin-bottom: 10px;
}
.legal-text-box h4:first-child {
  margin-top: 0;
}
</style>