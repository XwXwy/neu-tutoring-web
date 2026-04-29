<template>
  <div class="editorial-page-container">
    <div class="form-wrapper">
      <el-card shadow="never" class="editorial-card">
        <template #header>
          <div class="card-header">
            <h2 class="serif-title">
              <el-icon class="title-icon"><Reading /></el-icon> 
              发布新课程
            </h2>
            <p class="subtitle">请详细描述您的教学内容与特色，优秀的展示能吸引更多学生。</p>
          </div>
        </template>
        
        <!-- 采用 Top 对齐，提供类似撰写文章的沉浸式体验 -->
        <el-form :model="course_form" label-position="top" class="editorial-form">
          <el-form-item label="课程标题" required>
            <el-input 
              v-model="course_form.title" 
              placeholder="如：初中数学一对一辅导 / 中考冲刺提分班" 
              class="warm-input title-input" 
              size="large" 
            />
          </el-form-item>

          <el-row :gutter="24">
            <el-col :span="12">
              <el-form-item label="课程科目" required>
                <el-select 
                  v-model="course_form.category_id" 
                  placeholder="请选择科目" 
                  style="width: 100%" 
                  popper-class="warm-select-popper" 
                  size="large"
                >
                  <el-option label="数学" :value="1" />
                  <el-option label="英语" :value="2" />
                  <el-option label="物理" :value="3" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="价格 (元 / 课时)" required>
                <el-input-number 
                  v-model="course_form.price" 
                  :precision="2" 
                  :step="10" 
                  :min="0" 
                  class="warm-input-number" 
                  size="large" 
                />
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="授课方式" required>
            <el-radio-group v-model="course_form.type" class="warm-radio-group horizontal-radio">
              <el-radio :label="0" class="radio-item">线下上门</el-radio>
              <el-radio :label="1" class="radio-item">在线视频课</el-radio>
            </el-radio-group>
          </el-form-item>
          
          <el-form-item label="课程封面图">
            <el-upload
              class="cover-uploader"
              action="http://localhost:8080/file/upload"
              :show-file-list="false"
              :on-success="handle_cover_success"
              :before-upload="before_upload"
            >
              <img v-if="course_form.cover_image" :src="course_form.cover_image" class="cover-img" />
              <div v-else class="upload-placeholder">
                <el-icon class="upload-icon"><Picture /></el-icon>
                <span class="upload-text">点击上传课程封面</span>
                <span class="upload-hint">建议比例 16:9，支持 JPG / PNG，不超过 2MB</span>
              </div>
            </el-upload>
          </el-form-item>

          <el-form-item label="课程详情介绍" required>
            <el-input
              v-model="course_form.description"
              type="textarea"
              :rows="8"
              placeholder="详细介绍您的课程大纲、教学特色、适用人群等，支持分段..."
              class="warm-textarea"
            />
          </el-form-item>

          <div class="submit-action-bar">
            <button class="btn-brand-large" @click.prevent="submit_course">
              提 交 审 核
            </button>
          </div>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import request from '../../utils/request'
import { ElMessage } from 'element-plus'
import { Picture, Reading } from '@element-plus/icons-vue'

const course_form = ref({
  title: '',
  category_id: null,
  price: 99.00,
  type: 0, 
  cover_image: '',
  description: ''
})

const before_upload = (file) => {
  const is_img = file.type === 'image/jpeg' || file.type === 'image/png'
  const is_lt2m = file.size / 1024 / 1024 < 2
  if (!is_img) ElMessage.error('仅支持 JPG/PNG 格式图片')
  if (!is_lt2m) ElMessage.error('图片体积不可超过 2MB')
  return is_img && is_lt2m
}

const handle_cover_success = (res) => {
  if (res.code === 200) {
    course_form.value.cover_image = res.data
    ElMessage.success('封面上传成功')
  } else {
    ElMessage.error(res.message || '上传失败')
  }
}

const submit_course = async () => {
  if (!course_form.value.title || !course_form.value.category_id || !course_form.value.description) {
    ElMessage.warning('请填写完整的课程标题、科目和详情介绍')
    return
  }

  try {
    await request.post('/course/add', course_form.value)
    ElMessage.success('课程已成功提交，请等待管理员审核！')
    course_form.value = { title: '', category_id: null, price: 99.00, type: 0, cover_image: '', description: '' }
  } catch (error) {}
}
</script>

<style scoped>
/* ================= 美学色板与变量定义 ================= */
* {
  --clr-parchment: #f5f4ed;     
  --clr-ivory: #faf9f5;         
  --clr-white: #ffffff;
  --clr-near-black: #141413;    
  
  --clr-terracotta: #c96442;    /* 核心品牌色/激活色 */
  --clr-coral: #d97757;         
  
  --clr-olive: #5e5d59;         /* 标签/次级文本 */
  --clr-stone: #87867f;         /* 提示文本 */
  --clr-charcoal: #4d4c48;      
  
  --clr-warm-sand: #e8e6dc;     
  --clr-border-cream: #f0eee6;  
  --clr-border-warm: #e8e6dc;   
  --clr-focus-blue: #3898ec;
  
  --font-serif: "Georgia", "Times New Roman", serif;
  --font-sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.editorial-page-container {
  font-family: var(--font-sans);
  padding-top: 12px;
  padding-bottom: 40px;
}

/* 将表单宽度收束在 800px，居中显示，避免阅读疲劳 */
.form-wrapper {
  max-width: 800px;
  margin: 0 auto;
}

/* ================= 柔和卡片系统 ================= */
.editorial-card {
  background-color: var(--clr-ivory);
  border: 1px solid var(--clr-border-cream);
  border-radius: 12px;
  box-shadow: rgba(0, 0, 0, 0.02) 0px 4px 12px !important;
}
:deep(.editorial-card .el-card__header) {
  padding: 32px 40px 24px;
  border-bottom: 1px solid var(--clr-border-cream);
}
:deep(.editorial-card .el-card__body) { padding: 32px 40px 40px; }

/* 页眉文字排版 */
.serif-title {
  font-family: var(--font-serif);
  font-size: 24px;
  font-weight: 500;
  color: var(--clr-near-black);
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
}
.title-icon { margin-right: 12px; color: var(--clr-terracotta); font-size: 26px; }
.subtitle { margin: 0 0 0 38px; font-size: 14px; color: var(--clr-olive); }

/* ================= 统一表单元素重塑 ================= */
.editorial-form :deep(.el-form-item__label) {
  font-weight: 500;
  color: var(--clr-olive);
  font-size: 14px;
  padding-bottom: 8px;
}
.editorial-form :deep(.el-form-item) {
  margin-bottom: 24px;
}

/* 输入框 */
.warm-input :deep(.el-input__wrapper) {
  background-color: var(--clr-parchment);
  border: 1px solid var(--clr-border-warm);
  border-radius: 8px;
  box-shadow: none !important;
  transition: all 0.2s;
}
.warm-input :deep(.el-input__wrapper.is-focus) {
  background-color: var(--clr-white);
  border-color: var(--clr-focus-blue);
  box-shadow: 0 0 0 1px var(--clr-focus-blue) !important;
}
/* 标题输入框特定样式，字体加粗 */
.title-input :deep(.el-input__inner) {
  font-weight: 500;
  color: var(--clr-near-black);
  font-size: 15px;
}

/* 多行文本框 */
.warm-textarea :deep(.el-textarea__inner) {
  background-color: var(--clr-parchment);
  border: 1px solid var(--clr-border-warm);
  border-radius: 8px;
  padding: 16px;
  font-size: 15px;
  line-height: 1.6;
  color: var(--clr-near-black);
  box-shadow: none !important;
  transition: all 0.2s;
}
.warm-textarea :deep(.el-textarea__inner:focus) {
  background-color: var(--clr-white);
  border-color: var(--clr-focus-blue);
  box-shadow: 0 0 0 1px var(--clr-focus-blue) !important;
}

/* 数字输入框 */
.warm-input-number { width: 100% !important; }
.warm-input-number :deep(.el-input__wrapper) {
  background-color: var(--clr-parchment);
  border: 1px solid var(--clr-border-warm);
  border-radius: 8px;
  box-shadow: none !important;
}
.warm-input-number :deep(.el-input-number__increase),
.warm-input-number :deep(.el-input-number__decrease) {
  background-color: var(--clr-border-cream);
  border-color: var(--clr-border-warm);
  color: var(--clr-charcoal);
}

/* 下拉框弹窗全局样式 */
:global(.warm-select-popper) {
  border-radius: 8px !important;
  border: 1px solid var(--clr-border-warm) !important;
}
:global(.warm-select-popper .el-select-dropdown__item.selected) {
  color: var(--clr-terracotta) !important;
  font-weight: 500;
}

/* ================= 块级单选组合 ================= */
.warm-radio-group { display: flex; width: 100%; }
.horizontal-radio :deep(.el-radio) {
  flex: 1; 
  margin-right: 16px !important; 
  border: 1px solid var(--clr-border-warm) !important; 
  border-radius: 8px; 
  padding: 16px; 
  height: auto; 
  background-color: var(--clr-parchment); 
  transition: all 0.2s;
}
.horizontal-radio :deep(.el-radio:last-child) { margin-right: 0 !important; }
.horizontal-radio :deep(.el-radio.is-checked) {
  border-color: var(--clr-terracotta) !important;
  background-color: var(--clr-white);
  box-shadow: 0 2px 8px rgba(201, 100, 66, 0.05);
}
.horizontal-radio :deep(.el-radio__input.is-checked .el-radio__inner) {
  border-color: var(--clr-terracotta);
  background: var(--clr-terracotta);
}
.horizontal-radio :deep(.el-radio__label) {
  color: var(--clr-charcoal);
  font-weight: 500;
  font-size: 15px;
}

/* ================= 精致的相框上传区 ================= */
.cover-uploader :deep(.el-upload) {
  border: 1px dashed var(--clr-stone);
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 220px;
  background-color: var(--clr-parchment);
  transition: all 0.2s ease;
}
.cover-uploader :deep(.el-upload:hover) {
  border-color: var(--clr-terracotta);
  background-color: var(--clr-white);
}
.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
.upload-icon { font-size: 36px; margin-bottom: 12px; color: var(--clr-stone); }
.upload-text { color: var(--clr-near-black); font-size: 15px; font-weight: 500; margin-bottom: 6px; }
.upload-hint { color: var(--clr-olive); font-size: 13px; }

/* ================= 提交按钮 ================= */
.submit-action-bar {
  margin-top: 40px;
}
.btn-brand-large {
  width: 100%;
  background: var(--clr-terracotta);
  color: var(--clr-ivory);
  border: none;
  border-radius: 8px;
  padding: 16px 0;
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 2px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: var(--clr-terracotta) 0px 0px 0px 0px, var(--clr-terracotta) 0px 0px 0px 1px;
}
.btn-brand-large:hover {
  background: var(--clr-coral);
  transform: translateY(-1px);
}
</style>