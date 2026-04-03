<template>
  <div class="login-container">
    <el-card class="login-card">
      <h2>{{ is_register ? '家教服务平台 - 注册' : '家教服务平台 - 登录' }}</h2>
      
      <!-- 登录表单 -->
      <el-form v-if="!is_register" :model="login_form">
        <el-form-item>
          <el-input v-model="login_form.username" placeholder="账号" prefix-icon="User" @keyup.enter="handle_login"/>
        </el-form-item>
        <el-form-item>
          <el-input v-model="login_form.password" type="password" placeholder="密码" prefix-icon="Lock" show-password @keyup.enter="handle_login"/>
        </el-form-item>
        <el-button type="primary" style="width: 100%" @click="handle_login">登 录</el-button>
        <div class="toggle-box">
          <span>还没有账号？ <el-link type="primary" :underline="false" @click="is_register = true">立即注册</el-link></span>
        </div>
      </el-form>

      <!-- 注册表单 -->
      <el-form v-else :model="register_form" label-width="80px" label-position="left" @keyup.enter="handle_register">
        <!-- 基础信息 (通用) -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="账号">
              <el-input v-model="register_form.username" placeholder="设置账号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="密码">
              <el-input v-model="register_form.password" type="password" placeholder="设置密码" show-password />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="姓名">
              <el-input v-model="register_form.real_name" placeholder="真实姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="手机号">
              <el-input v-model="register_form.phone" placeholder="手机号码" />
            </el-form-item>
          </el-col>
		            <el-col :span="12">
		              <!-- 【新增】所在城市 -->
		              <el-form-item label="所在城市">
		                <el-input v-model="register_form.city" placeholder="如: 沈阳市" />
		              </el-form-item>
		            </el-col>
        </el-row>

        <el-form-item label="身份">
          <el-radio-group v-model="register_form.role">
            <el-radio :label="2">学生 / 用户</el-radio>
            <el-radio :label="1">家教老师</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 家教专属信息 -->
        <template v-if="register_form.role === 1">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="毕业院校">
                <el-input v-model="register_form.university" placeholder="如: 东北大学" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="所学专业">
                <el-input v-model="register_form.major" placeholder="如: 软件工程" />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="教龄(年)">
            <el-input-number v-model="register_form.teaching_years" :min="0" :max="50" style="width: 100%" />
          </el-form-item>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="学历证书" required>
                <el-upload
                  class="avatar-uploader"
                  action="http://localhost:8080/file/upload"
                  :show-file-list="false"
                  :on-success="handle_degree_success"
                  :before-upload="before_upload"
                >
                  <img v-if="register_form.degree_cert" :src="register_form.degree_cert" class="uploaded-img" />
                  <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
                </el-upload>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="教师证">
                <el-upload
                  class="avatar-uploader"
                  action="http://localhost:8080/file/upload"
                  :show-file-list="false"
                  :on-success="handle_teacher_success"
                  :before-upload="before_upload"
                >
                  <img v-if="register_form.teacher_cert" :src="register_form.teacher_cert" class="uploaded-img" />
                  <span v-else class="upload-tip">
                    <el-icon class="avatar-uploader-icon"><Plus /></el-icon>
                    <small style="color:#999; line-height: 1;">(如有可传)</small>
                  </span>
                </el-upload>
              </el-form-item>
            </el-col>
          </el-row>
        </template>

        <el-button type="success" style="width: 100%; margin-top: 10px;" @click="handle_register">注 册</el-button>
        <div class="toggle-box">
          <span>已有账号？ <el-link type="primary" :underline="false" @click="is_register = false">返回登录</el-link></span>
        </div>
      </el-form>

    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import request from '../utils/request'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

const router = useRouter()
const is_register = ref(false)

const login_form = ref({
  username: '',
  password: ''
})

const register_form = ref({
  username: '',
  password: '',
  real_name: '',
  phone: '',
  role: 2,
  city: '',
  university: '',      // 新增: 毕业院校
  major: '',           // 新增: 专业
  teaching_years: 0,   // 新增: 教龄
  degree_cert: '',
  teacher_cert: ''
})

// 登录逻辑
const handle_login = async () => {
  try {
    const res = await request.post('/sysUser/login', login_form.value)
    localStorage.setItem('token', res.data.tokenValue)
    localStorage.setItem('userInfo', JSON.stringify(res.data.userInfo))
    ElMessage.success('登录成功！')
    
    if (res.data.userInfo.role === 0) {
       router.push('/home') 
    } else {
       router.push('/home') 
    }
  } catch (error) {}
}

const handle_degree_success = (res) => {
  if (res.code === 200) {
    register_form.value.degree_cert = res.data
    ElMessage.success('学历证书上传成功')
  } else {
    ElMessage.error(res.message)
  }
}

const handle_teacher_success = (res) => {
  if (res.code === 200) {
    register_form.value.teacher_cert = res.data
    ElMessage.success('教师证上传成功')
  }
}

const before_upload = (file) => {
  const is_img = file.type === 'image/jpeg' || file.type === 'image/png'
  const is_lt2m = file.size / 1024 / 1024 < 2
  if (!is_img) ElMessage.error('只能上传 JPG/PNG 格式图片!')
  if (!is_lt2m) ElMessage.error('图片大小不能超过 2MB!')
  return is_img && is_lt2m
}

// 注册逻辑
const handle_register = async () => {
  // 通用必填校验
  if (!register_form.value.username || !register_form.value.password || !register_form.value.real_name) {
    ElMessage.warning('请填写完整的账号、密码和姓名')
    return
  }
  
  // 家教专属必填校验
  if (register_form.value.role === 1) {
    if (!register_form.value.university || !register_form.value.major) {
      ElMessage.warning('家教老师请填写毕业院校和专业')
      return
    }
    if (!register_form.value.degree_cert) {
      ElMessage.warning('家教老师必须上传学历证书图')
      return
    }
  }

  try {
    await request.post('/sysUser/register', register_form.value)
    if (register_form.value.role === 1) {
      ElMessage.success('家教注册成功！请等待管理员审核。')
    } else {
      ElMessage.success('注册成功！请登录。')
    }
    // 重置表单切回登录
    register_form.value = { username: '', password: '', real_name: '', phone: '', role: 2, university: '', major: '', teaching_years: 0, degree_cert: '', teacher_cert: '' }
    is_register.value = false
  } catch (error) {}
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f7fa;
}
.login-card {
  width: 500px; /* 进一步加宽，适应分栏布局 */
}
h2 {
  text-align: center;
  margin-bottom: 20px;
}
.toggle-box {
  margin-top: 15px;
  text-align: right;
  font-size: 14px;
}
.avatar-uploader .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}
.avatar-uploader .el-upload:hover {
  border-color: #409EFF;
}
.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 80px;  /* 缩小一点图片框以适应两列布局 */
  height: 80px;
  line-height: 80px;
  text-align: center;
}
.uploaded-img {
  width: 80px;
  height: 80px;
  display: block;
}
.upload-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
}
</style>