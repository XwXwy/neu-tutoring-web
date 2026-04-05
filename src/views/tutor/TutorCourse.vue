<template>
  <div>
    <el-card shadow="never">
      <template #header>
        <div class="card-header"><span>我发布的课程</span></div>
      </template>

      <el-table :data="course_list" v-loading="loading">
        <el-table-column prop="title" label="课程标题" />
        <el-table-column prop="price" label="价格" width="100" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.type === 1 ? 'success' : 'warning'">
              {{ scope.row.type === 1 ? '在线' : '线下' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="审核状态" width="120">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 0">已下架</el-tag>
            <el-tag v-if="scope.row.status === 1" type="success">已上架</el-tag>
            <el-tag v-if="scope.row.status === 2" type="warning">审核中</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <!-- 【核心按钮】点击打开资料管理抽屉 -->
            <el-button type="primary" size="small" @click="open_resource_drawer(scope.row)">
              <el-icon><FolderOpened /></el-icon> 资料管理
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 资料管理抽屉 (Drawer) -->
    <el-drawer v-model="drawer_visible" :title="`管理资料 - ${current_course.title}`" size="50%">
      
      <!-- 上传新资料表单 -->
      <el-card shadow="never" style="margin-bottom: 20px; background-color: #f9fafc;">
        <h4><el-icon><Upload /></el-icon> 上传新教学资料</h4>
        <el-form :model="resource_form" label-width="80px" style="margin-top: 15px;">
          <el-form-item label="资料名称" required>
            <el-input v-model="resource_form.resource_name" placeholder="如：第一章知识点串讲视频" />
          </el-form-item>
          <el-row>
            <el-col :span="12">
              <el-form-item label="资料类型">
                <el-radio-group v-model="resource_form.resource_type">
                  <el-radio :label="0">课件(PDF等)</el-radio>
                  <el-radio :label="1">教学视频</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="是否免费">
                <el-switch v-model="resource_form.is_free" :active-value="1" :inactive-value="0" active-text="免费试看" />
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-form-item label="选择文件" required>
            <!-- 复用我们之前写好的 MinIO 上传接口 -->
            <el-upload
              action="http://localhost:8080/file/upload"
              :show-file-list="false"
              :on-success="handle_upload_success"
              :before-upload="before_upload"
            >
              <el-button type="primary" :loading="uploading">
                {{ uploading ? '上传中...' : '点击上传文件到云盘' }}
              </el-button>
              <span style="margin-left: 10px; color: #67C23A;" v-if="resource_form.resource_url">
                <el-icon><Check /></el-icon> 文件已就绪
              </span>
            </el-upload>
          </el-form-item>

          <el-form-item>
            <el-button type="success" @click="submit_resource">提交资料申请</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 已上传资料列表 -->
      <h4>已上传的资料</h4>
      <el-table :data="resource_list" border>
        <el-table-column prop="resource_name" label="资料名称" />
        <el-table-column prop="resource_type" label="类型" width="80">
          <template #default="scope">
            <el-tag size="small" :type="scope.row.resource_type === 1 ? 'danger' : ''">
              {{ scope.row.resource_type === 1 ? '视频' : '课件' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="审核状态" width="100">
           <template #default="scope">
            <el-tag size="small" v-if="scope.row.status === 0" type="warning">待审核</el-tag>
            <el-tag size="small" v-if="scope.row.status === 1" type="success">已通过</el-tag>
            <el-tag size="small" v-if="scope.row.status === 2" type="danger">被驳回</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80">
          <template #default="scope">
            <el-button link type="danger" @click="delete_resource(scope.row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

    </el-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '../../utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'
import { FolderOpened, Upload, Check } from '@element-plus/icons-vue'

const loading = ref(true)
const course_list = ref([])

// 获取家教自己的课程列表
const get_course_list = async () => {
  loading.value = true
  try {
    // 假设你已经在 CourseController 中添加了 '/tutor/my_courses' 接口
    const res = await request.get('/course/tutor/my_courses') 
    course_list.value = res.data
  } catch(error) {
    console.error("加载课程列表失败:", error)
  } finally {
    loading.value = false
  }
}

// ---- 资料抽屉相关逻辑 ----
const drawer_visible = ref(false)
const current_course = ref({})
const resource_list = ref([])
const uploading = ref(false)

const resource_form = ref({
  course_id: null,
  resource_name: '',
  resource_type: 0, // 0-课件, 1-视频
  is_free: 0,       // 0-付费, 1-免费
  resource_url: ''
})

// 打开资料管理抽屉
const open_resource_drawer = async (course) => {
  current_course.value = course
  drawer_visible.value = true
  
  // 清空上一次的表单
  resource_form.value = {
    course_id: course.id,
    resource_name: '',
    resource_type: 0,
    is_free: 0,
    resource_url: ''
  }
  
  // 打开抽屉时，立刻加载该课程已有的资料列表
  load_resource_list(course.id)
}

// 加载指定课程的资料列表
const load_resource_list = async (course_id) => {
  const res = await request.get('/course_resource/list_by_course', {
    params: { course_id }
  })
  resource_list.value = res.data
}

// 文件上传成功回调
const handle_upload_success = (res) => {
  if (res.code === 200) {
    resource_form.value.resource_url = res.data
    ElMessage.success('文件已上传至云盘，待提交')
  } else {
    ElMessage.error(res.message)
  }
  uploading.value = false
}

// 文件上传前校验（可以上传更大的视频文件）
const before_upload = (file) => {
  const is_video = file.type.startsWith('video/')
  const is_doc = ['application/pdf', 'application/msword', 'application/vnd.ms-powerpoint'].includes(file.type)
  
  if (!is_video && !is_doc) {
    ElMessage.error('只能上传视频或 PDF/Word/PPT 格式的课件!')
    return false
  }

  const is_lt100m = file.size / 1024 / 1024 < 100 // 限制100MB
  if (!is_lt100m) {
    ElMessage.error('单个文件大小不能超过 100MB!')
    return false
  }
  
  uploading.value = true
  return true
}

// 提交新资料
const submit_resource = async () => {
  if (!resource_form.value.resource_name) {
    ElMessage.warning('请填写资料名称')
    return
  }
  if (!resource_form.value.resource_url) {
    ElMessage.warning('请先上传文件')
    return
  }
  
  await request.post('/course_resource/add', resource_form.value)
  ElMessage.success('资料提交成功，等待管理员审核')
  
  // 刷新列表并清空表单
  load_resource_list(current_course.value.id)
  resource_form.value.resource_name = ''
  resource_form.value.resource_url = ''
}

// 删除资料
const delete_resource = (resource_id) => {
  ElMessageBox.confirm('确定要删除这个教学资料吗？', '提示').then(async () => {
    await request.post('/course_resource/delete', null, {
      params: { resource_id }
    })
    ElMessage.success('删除成功')
    load_resource_list(current_course.value.id)
  })
}

// 组件挂载时自动加载
onMounted(() => {
  get_course_list()
})

</script>