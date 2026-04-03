<template>
  <div>
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>发布新课程</span>
        </div>
      </template>
      
      <el-form :model="course_form" label-width="120px">
        <el-form-item label="课程标题" required>
          <el-input v-model="course_form.title" placeholder="如：初中数学一对一辅导" />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="课程科目" required>
              <!-- 这里的 options 未来可以从后端动态获取 category 表数据 -->
              <el-select v-model="course_form.category_id" placeholder="请选择科目" style="width:100%">
                <el-option label="数学" :value="1" />
                <el-option label="英语" :value="2" />
                <el-option label="物理" :value="3" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="价格(元/课时)" required>
              <el-input-number v-model="course_form.price" :precision="2" :step="10" :min="0" style="width:100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="授课方式">
          <el-radio-group v-model="course_form.type">
            <el-radio :label="0">线下上门</el-radio>
            <el-radio :label="1">在线视频课</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="课程封面图">
          <el-upload
            class="cover-uploader"
            action="http://localhost:8080/file/upload"
            :show-file-list="false"
            :on-success="handle_cover_success"
          >
            <img v-if="course_form.cover_image" :src="course_form.cover_image" class="cover-img" />
            <el-icon v-else><Picture /></el-icon>
          </el-upload>
        </el-form-item>

        <el-form-item label="课程详情介绍">
          <el-input
            v-model="course_form.description"
            type="textarea"
            :rows="5"
            placeholder="详细介绍你的课程内容、教学特色、适合学生等..."
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="submit_course">提交审核</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import request from '../../utils/request'
import { ElMessage } from 'element-plus'


// 课程表单数据模型 (严格下划线)
const course_form = ref({
  title: '',
  category_id: null,
  price: 99.00,
  type: 0, // 默认线下
  cover_image: '',
  description: ''
})

// 封面图上传成功回调
const handle_cover_success = (res) => {
  if (res.code === 200) {
    course_form.value.cover_image = res.data
    ElMessage.success('封面上传成功')
  }
}

// 提交课程表单
const submit_course = async () => {
  // 简单校验
  if (!course_form.value.title || !course_form.value.category_id) {
    ElMessage.warning('请填写课程标题和选择科目')
    return
  }

  try {
    await request.post('/course/add', course_form.value)
    ElMessage.success('课程已提交审核！')
    // 成功后可以清空表单或跳转到课程管理列表页
    course_form.value = { title: '', category_id: null, price: 99.00, type: 0, cover_image: '', description: '' }
  } catch (error) {}
}
</script>

<style scoped>
.cover-uploader :deep(.el-upload) {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  width: 178px;
  height: 178px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.cover-img {
  width: 178px;
  height: 178px;
  object-fit: cover;
}
</style>