<template>
  <div class="editorial-layout-wrapper">
    <!-- ================= 左侧：自动轮播海报区 (书籍封面质感) ================= -->
    <div class="banner-section">
      <el-carousel height="100vh" direction="vertical" :autoplay="true" :interval="5000" indicator-position="none" arrow="never">
        <el-carousel-item v-for="(img_url, index) in bg_images" :key="index">
          <div class="bg-image-item" :style="{ backgroundImage: 'url(' + img_url + ')' }"></div>
        </el-carousel-item>
      </el-carousel>

      <!-- 暖黑场遮罩 -->
      <div class="banner-overlay">
        <div class="brand-info">
          <h1 class="brand-title serif-title">知行家教服务平台</h1>
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
          <h2 class="serif-title">{{ is_register ? '创建您的账号' : '欢迎登录平台' }}</h2>
          <p class="sub-title">
            {{ is_register ? '只需几步，开启专属学习与教学之旅' : '请输入您的账号密码以进入系统' }}
          </p>
        </div>

        <!-- 登录表单 -->
        <el-form v-if="!is_register" :model="login_form" class="editorial-form">
          <el-form-item>
            <el-input v-model="login_form.username" placeholder="请输入账号" prefix-icon="User" size="large" clearable class="warm-input" />
          </el-form-item>
          <el-form-item>
            <el-input v-model="login_form.password" type="password" placeholder="请输入密码" prefix-icon="Lock" size="large" @keyup.enter="handle_login" show-password class="warm-input" />
          </el-form-item>
          <button class="btn-brand-large" :class="{'is-loading': loading}" @click.prevent="handle_login">
            <el-icon v-if="loading" class="is-loading-icon"><Loading /></el-icon>
            {{ loading ? '登录中...' : '立 即 登 录' }}
          </button>
          
          <div class="action-bar">
            <button class="btn-text-stone" @click.prevent="open_forgot_dialog">忘记密码？</button>
            <button class="btn-text-terracotta" @click.prevent="toggle_mode">
              注册新账号 <el-icon><ArrowRight /></el-icon>
            </button>
          </div>
        </el-form>

        <!-- 注册表单 -->
        <el-form v-else :model="register_form" class="editorial-form" label-position="top">
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="账号"><el-input v-model="register_form.username" placeholder="设置账号" size="large" class="warm-input" /></el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="密码"><el-input v-model="register_form.password" type="password" placeholder="设置密码" show-password size="large" class="warm-input" /></el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="真实姓名"><el-input v-model="register_form.real_name" placeholder="您的姓名" size="large" class="warm-input" /></el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="手机号码"><el-input v-model="register_form.phone" placeholder="11位手机号" size="large" class="warm-input" /></el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="注册身份">
            <el-radio-group v-model="register_form.role" class="warm-radio-group">
              <el-radio-button :label="2">👨‍🎓 我是学生</el-radio-button>
              <el-radio-button :label="1">👩‍🏫 我是家教</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <!-- 家教额外信息 (沉浸式卡片) -->
          <div v-if="register_form.role === 1" class="tutor-extra-info">
            <el-row :gutter="16">
              <el-col :span="12"><el-form-item label="毕业院校"><el-input v-model="register_form.university" size="large" class="warm-input-inset" /></el-form-item></el-col>
              <el-col :span="12"><el-form-item label="所学专业"><el-input v-model="register_form.major" size="large" class="warm-input-inset" /></el-form-item></el-col>
            </el-row>
            <el-form-item label="教龄 (年)">
              <el-input-number v-model="register_form.teaching_years" :min="0" :max="50" class="warm-input-number" />
            </el-form-item>
            
            <el-row :gutter="16">
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

          <button class="btn-brand-large" :class="{'is-loading': loading}" @click.prevent="handle_register">
            <el-icon v-if="loading" class="is-loading-icon"><Loading /></el-icon>
            {{ loading ? '处理中...' : '立 即 注 册' }}
          </button>
          
          <div class="action-bar center">
            <span class="hint-text">已有账号？</span>
            <button class="btn-text-terracotta" @click.prevent="toggle_mode">返回登录</button>
          </div>
        </el-form>

        <!-- 底部协议区 -->
        <div class="agreement-box">
          <el-checkbox v-model="is_agreed" size="small" class="warm-checkbox">
            <span class="agreement-text">我已阅读并同意</span>
            <button class="btn-text-link" @click.prevent="open_agreement">用户协议</button>
            <span class="agreement-text">和</span>
            <button class="btn-text-link" @click.prevent="open_privacy">隐私保护政策</button>
          </el-checkbox>
        </div>
      </div>
    </div>

    <!-- ================= 弹窗：用户协议 ================= -->
    <el-dialog v-model="agreement_visible" title="用户服务协议" width="600px" center destroy-on-close class="editorial-dialog">
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
        <button class="btn-brand" @click="agreement_visible = false">我已阅读并了解</button>
      </template>
    </el-dialog>

    <!-- ================= 弹窗：隐私政策 ================= -->
    <el-dialog v-model="privacy_visible" title="个人信息保护政策" width="600px" center destroy-on-close class="editorial-dialog">
      <div class="legal-text-box">
        <h4>1. 信息收集</h4>
        <p>为了给您提供精准的家教撮合服务，我们需要收集您的手机号码、真实姓名、所在城市等基本信息。对于家教老师，我们还将严格审核并存储您的学历证书扫描件。</p>
        <h4>2. 信息使用</h4>
        <p>我们承诺，收集的个人信息仅用于平台内部的身份核实、订单匹配和防欺诈机制，绝不向任何无合作关系的第三方泄露、出售或共享您的隐私数据。</p>
        <h4>3. 数据安全</h4>
        <p>平台采用国际标准的加密算法对您的密码进行加密存储。上传的证件图片存储于私有化对象存储集群，拥有严格的安全访问策略控制。</p>
      </div>
      <template #footer>
        <button class="btn-brand" @click="privacy_visible = false">我已阅读并了解</button>
      </template>
    </el-dialog>

    <!-- ================= 弹窗：找回密码 ================= -->
    <el-dialog v-model="forgot_dialog_visible" title="找回密码" width="440px" center destroy-on-close class="editorial-dialog">
      <div class="dialog-subtitle text-center">请验证身份以重置您的登录密码</div>
      <el-form :model="forgot_form" label-position="top" class="editorial-form">
        <el-form-item label="绑定的手机号码" required>
          <el-input v-model="forgot_form.phone" placeholder="请输入注册时填写的手机号" size="large" prefix-icon="Phone" class="warm-input" />
        </el-form-item>
        
        <el-form-item label="短信验证码" required>
          <div style="display: flex; gap: 12px; width: 100%;">
            <el-input v-model="forgot_form.code" placeholder="6位验证码" size="large" style="flex: 1;" class="warm-input" />
            <button class="btn-secondary" :disabled="is_counting" @click.prevent="get_sms_code" style="width: 130px;">
              {{ is_counting ? `${countdown}s 后重试` : '获取验证码' }}
            </button>
          </div>
        </el-form-item>
        
        <el-form-item label="设置新密码" required>
          <el-input v-model="forgot_form.new_password" type="password" placeholder="请输入新密码" show-password size="large" prefix-icon="Lock" class="warm-input" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div style="display: flex; gap: 12px; justify-content: center; margin-top: 12px;">
          <button class="btn-secondary" @click="forgot_dialog_visible = false">取 消</button>
          <button class="btn-brand" :class="{'is-loading': resetting}" @click="submit_reset_password">确认重置</button>
        </div>
      </template>
    </el-dialog>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import request from '../utils/request'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { User, Lock, ArrowRight, Plus, Phone, Loading } from '@element-plus/icons-vue'

const router = useRouter()
const is_register = ref(false)
const loading = ref(false)
const is_agreed = ref(false) 

// 轮播图背景数组
const bg_images = ref([
  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1920&auto=format&fit=crop', 
  'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1920&auto=format&fit=crop', 
  'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1920&auto=format&fit=crop'  
])

const agreement_visible = ref(false)
const privacy_visible = ref(false)
const open_agreement = () => { agreement_visible.value = true }
const open_privacy = () => { privacy_visible.value = true }

const forgot_dialog_visible = ref(false)
const forgot_form = ref({ phone: '', code: '', new_password: '' })
const resetting = ref(false)
const is_counting = ref(false)
const countdown = ref(60)
let timer = null

const open_forgot_dialog = () => {
  forgot_form.value = { phone: '', code: '', new_password: '' }
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
    const res = await request.post('/sysUser/send_sms', null, { params: { phone: forgot_form.value.phone } })
    ElMessage.success(res.data)
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
  if (!is_agreed.value) { ElMessage.warning('请先阅读并同意用户协议'); return }
  if (!login_form.value.username || !login_form.value.password) { ElMessage.warning('请输入账号和密码'); return }

  loading.value = true
  try {
    const res = await request.post('/sysUser/login', login_form.value)
    localStorage.setItem('token', res.data.tokenValue)
    localStorage.setItem('userInfo', JSON.stringify(res.data.userInfo))
    ElMessage.success('欢迎回来！')
    router.push('/home') 
  } catch (error) {}
  loading.value = false
}

const handle_register = async () => {
  if (!is_agreed.value) { ElMessage.warning('请先阅读并同意用户协议'); return }
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
      ElMessage.success('资料已提交，请等待管理员审核您的家教资质。')
    } else {
      ElMessage.success('注册成功！欢迎加入平台。')
    }
    register_form.value = { username: '', password: '', real_name: '', phone: '', role: 2, university: '', major: '', teaching_years: 0, degree_cert: '', teacher_cert: '' }
    toggle_mode()
  } catch (error) {}
  loading.value = false
}

const handle_degree_success = (res) => {
  if (res.code === 200) { register_form.value.degree_cert = res.data; ElMessage.success('学历证书已上传') } 
  else { ElMessage.error(res.message) }
}
const handle_teacher_success = (res) => {
  if (res.code === 200) { register_form.value.teacher_cert = res.data; ElMessage.success('教师资格证已上传') }
}
const before_upload = (file) => {
  const is_img = file.type === 'image/jpeg' || file.type === 'image/png'
  const is_lt2m = file.size / 1024 / 1024 < 2
  if (!is_img) ElMessage.error('仅支持 JPG/PNG 格式图片')
  if (!is_lt2m) ElMessage.error('图片体积不可超过 2MB')
  return is_img && is_lt2m
}
</script>

<style scoped>
/* ================= 美学色板与变量定义 ================= */
* {
  --clr-parchment: #f5f4ed;     /* 羊皮纸输入框底色 */
  --clr-ivory: #faf9f5;         /* 右侧表单主背景 */
  --clr-white: #ffffff;
  --clr-near-black: #141413;    /* 墨黑主文本 */
  
  --clr-terracotta: #c96442;    /* 陶土红 (核心按钮/品牌色) */
  --clr-coral: #d97757;         /* 珊瑚色 (Hover状态) */
  
  --clr-olive: #5e5d59;         /* 橄榄灰 (次级文本) */
  --clr-stone: #87867f;         /* 石板灰 (辅助说明) */
  --clr-charcoal: #4d4c48;      /* 木炭灰 */
  
  --clr-warm-sand: #e8e6dc;     /* 暖沙色 (次级按钮/嵌入底色) */
  --clr-border-cream: #f0eee6;  /* 柔和边框 */
  --clr-border-warm: #e8e6dc;   /* 加深边框 */
  --clr-focus-blue: #3898ec;    /* 焦点状态 */
  
  --font-serif: "Georgia", "Times New Roman", serif;
  --font-sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.editorial-layout-wrapper {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: var(--clr-ivory);
  font-family: var(--font-sans);
}

/* ================= 左侧海报区 ================= */
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
  transition: transform 6s ease-out; /* 缓慢的呼吸感缩放 */
}
.el-carousel__item.is-active .bg-image-item { transform: scale(1.04); }

.banner-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(20, 20, 19, 0.55); /* 暖黑场半透明遮罩 */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: var(--clr-ivory);
  z-index: 10;
  pointer-events: none;
}
.brand-info { text-align: center; }
.serif-title { font-family: var(--font-serif); font-weight: 500; }
.brand-title {
  font-size: 52px;
  letter-spacing: 6px;
  margin-bottom: 24px;
  text-shadow: 0 4px 16px rgba(0,0,0,0.4);
}
.brand-slogan {
  font-size: 18px;
  letter-spacing: 4px;
  opacity: 0.9;
  font-weight: 300;
}
.copyright {
  position: absolute;
  bottom: 32px;
  left: 40px;
  font-size: 13px;
  opacity: 0.6;
  letter-spacing: 1px;
}

/* ================= 右侧表单区 ================= */
.form-section {
  width: 520px; /* 稍微加宽，让排版更从容 */
  background-color: var(--clr-ivory);
  box-shadow: -10px 0 40px rgba(0,0,0,0.06);
  display: flex;
  flex-direction: column;
  z-index: 20;
  overflow-y: auto; 
}
.form-section::-webkit-scrollbar { width: 4px; }
.form-section::-webkit-scrollbar-thumb { background: var(--clr-border-warm); border-radius: 4px; }

.form-container {
  width: 100%;
  padding: 60px 56px;
  box-sizing: border-box;
  margin: auto 0; 
}

.form-header { margin-bottom: 48px; }
.form-header h2 { font-size: 32px; color: var(--clr-near-black); margin: 0 0 12px 0; }
.sub-title { font-size: 15px; color: var(--clr-olive); margin: 0; line-height: 1.6; }

/* 表单与输入框 */
.editorial-form :deep(.el-form-item__label) { color: var(--clr-olive); font-weight: 500; }

.warm-input :deep(.el-input__wrapper) {
  background-color: var(--clr-parchment);
  border: 1px solid var(--clr-border-warm);
  border-radius: 12px;
  box-shadow: none !important;
  padding: 4px 12px;
  transition: all 0.2s;
}
.warm-input :deep(.el-input__wrapper.is-focus) {
  background-color: var(--clr-white);
  border-color: var(--clr-focus-blue);
  box-shadow: 0 0 0 1px var(--clr-focus-blue) !important;
}

/* ================= 核心操作按钮 ================= */
.btn-brand-large {
  width: 100%;
  background-color: var(--clr-terracotta);
  color: var(--clr-ivory);
  border: none;
  border-radius: 12px;
  padding: 16px 0;
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 2px;
  cursor: pointer;
  margin-top: 16px;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(201, 100, 66, 0.2);
  display: flex;
  justify-content: center;
  align-items: center;
}
.btn-brand-large:hover:not(.is-loading) {
  background-color: var(--clr-coral);
  transform: translateY(-1px);
}
.btn-brand-large.is-loading { opacity: 0.8; cursor: not-allowed; }
.is-loading-icon { animation: rotating 2s linear infinite; margin-right: 8px; font-size: 18px; }
@keyframes rotating { 100% { transform: rotate(360deg); } }

/* 文本操作链 */
.action-bar { display: flex; justify-content: space-between; align-items: center; margin-top: 24px; }
.action-bar.center { justify-content: center; gap: 8px; }
.hint-text { color: var(--clr-stone); font-size: 14px; }

.btn-text-stone { background: transparent; border: none; color: var(--clr-stone); font-size: 14px; cursor: pointer; transition: color 0.2s; }
.btn-text-stone:hover { color: var(--clr-near-black); }

.btn-text-terracotta {
  background: transparent; border: none; color: var(--clr-terracotta); font-size: 14px; font-weight: 500;
  cursor: pointer; display: inline-flex; align-items: center; transition: color 0.2s;
}
.btn-text-terracotta:hover { color: var(--clr-coral); }
.btn-text-terracotta .el-icon { margin-left: 2px; }

/* ================= 注册特有样式 ================= */
/* 单选切换组 */
.warm-radio-group { width: 100%; display: flex; }
.warm-radio-group :deep(.el-radio-button) { flex: 1; }
.warm-radio-group :deep(.el-radio-button__inner) { 
  width: 100%; 
  background-color: var(--clr-parchment);
  border: 1px solid var(--clr-border-warm);
  color: var(--clr-olive);
  box-shadow: none !important;
  transition: all 0.2s;
}
.warm-radio-group :deep(.el-radio-button:first-child .el-radio-button__inner) { border-top-left-radius: 8px; border-bottom-left-radius: 8px; }
.warm-radio-group :deep(.el-radio-button:last-child .el-radio-button__inner) { border-top-right-radius: 8px; border-bottom-right-radius: 8px; }
.warm-radio-group :deep(.el-radio-button.is-active .el-radio-button__inner) {
  background-color: var(--clr-terracotta);
  border-color: var(--clr-terracotta);
  color: var(--clr-ivory);
}

/* 家教专属信息块 */
.tutor-extra-info {
  background-color: var(--clr-parchment);
  padding: 24px;
  border-radius: 12px;
  margin-bottom: 24px;
  border: 1px solid var(--clr-border-cream);
}
.warm-input-inset :deep(.el-input__wrapper) { background-color: var(--clr-white); border-color: var(--clr-border-cream); box-shadow: none !important; border-radius: 8px; }
.warm-input-number { width: 100%; }
.warm-input-number :deep(.el-input__wrapper) { background-color: var(--clr-white); border-color: var(--clr-border-cream); border-radius: 8px; box-shadow: none !important; }

/* 图片上传框 */
.cert-uploader :deep(.el-upload) {
  border: 1px dashed var(--clr-stone);
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 110px;
  background-color: var(--clr-white);
  transition: all 0.2s;
}
.cert-uploader :deep(.el-upload:hover) {
  border-color: var(--clr-terracotta);
  background-color: var(--clr-ivory);
}
.uploaded-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.upload-placeholder { display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; color: var(--clr-olive); font-size: 13px; }
.upload-placeholder .el-icon { font-size: 24px; margin-bottom: 8px; color: var(--clr-stone); }

/* ================= 底部协议区 ================= */
.agreement-box { margin-top: 40px; text-align: center; }
.warm-checkbox :deep(.el-checkbox__label) { color: var(--clr-stone); font-size: 12px; display: inline-flex; align-items: center; }
.warm-checkbox :deep(.el-checkbox__inner) { border-color: var(--clr-border-warm); background-color: var(--clr-white); }
.warm-checkbox :deep(.el-checkbox__input.is-checked .el-checkbox__inner) { background-color: var(--clr-terracotta); border-color: var(--clr-terracotta); }

.agreement-text { margin: 0 4px; }
.btn-text-link {
  background: transparent; border: none; color: var(--clr-near-black); font-size: 12px; font-weight: 500;
  text-decoration: underline; text-decoration-color: var(--clr-border-warm); text-underline-offset: 4px;
  cursor: pointer; transition: all 0.2s; padding: 0;
}
.btn-text-link:hover { color: var(--clr-terracotta); text-decoration-color: var(--clr-terracotta); }

/* ================= 弹窗统一样式 ================= */
:deep(.editorial-dialog) {
  border-radius: 16px;
  background-color: var(--clr-ivory);
}
:deep(.editorial-dialog .el-dialog__header) {
  padding: 32px 32px 0;
  margin-right: 0;
}
:deep(.editorial-dialog .el-dialog__title) {
  font-family: var(--font-serif);
  font-weight: 500;
  font-size: 22px;
  color: var(--clr-near-black);
}
.dialog-subtitle {
  font-size: 14px;
  color: var(--clr-olive);
  margin-top: 8px;
  margin-bottom: 24px;
}
.text-center { text-align: center; }

/* 法律文本排版 */
.legal-text-box {
  max-height: 50vh;
  overflow-y: auto;
  padding: 0 16px 20px;
  color: var(--clr-near-black);
  line-height: 1.8; /* 宽松的阅读行高 */
  font-size: 15px;
}
.legal-text-box::-webkit-scrollbar { width: 4px; }
.legal-text-box::-webkit-scrollbar-thumb { background: var(--clr-border-warm); border-radius: 4px; }
.legal-text-box h4 {
  font-family: var(--font-serif);
  color: var(--clr-near-black);
  font-size: 17px;
  margin: 24px 0 12px;
}
.legal-text-box h4:first-child { margin-top: 0; }
.legal-text-box p { margin: 0; color: var(--clr-olive); }

/* 弹窗按钮 */
.btn-brand {
  background: var(--clr-terracotta) !important;
  color: var(--clr-ivory) !important;
  border: none; border-radius: 8px; padding: 10px 24px; font-weight: 500; font-size: 14px;
  box-shadow: var(--clr-terracotta) 0px 0px 0px 0px, var(--clr-terracotta) 0px 0px 0px 1px;
  cursor: pointer; transition: opacity 0.2s;
}
.btn-brand:hover:not(.is-loading) { opacity: 0.9; }
.btn-brand.is-loading { opacity: 0.8; cursor: not-allowed; }

.btn-secondary {
  background: var(--clr-warm-sand) !important;
  color: var(--clr-charcoal) !important;
  border: none; border-radius: 8px; padding: 10px 24px; font-weight: 500; font-size: 14px;
  cursor: pointer; transition: background 0.2s;
}
.btn-secondary:hover:not(:disabled) { background: var(--clr-border-warm) !important; }
.btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }
</style>