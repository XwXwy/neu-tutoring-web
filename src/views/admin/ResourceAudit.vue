<template>
  <div>
    <el-card shadow="never">
      <template #header>
        <div class="card-header"><span style="color:#E6A23C; font-weight: bold;"><el-icon><Files /></el-icon> 待审核教学资料</span></div>
      </template>

      <el-table :data="audit_list" v-loading="loading">
        <el-table-column prop="resource_name" label="资料名称" width="200" />
        <el-table-column prop="course_title" label="所属课程" />
        <el-table-column prop="tutor_name" label="上传家教" width="100" />
        <el-table-column prop="resource_type" label="类型" width="80">
          <template #default="scope">
            <el-tag size="small" :type="scope.row.resource_type === 1 ? 'danger' : ''">
              {{ scope.row.resource_type === 1 ? '视频' : '课件' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="是否免费" width="100">
          <template #default="scope">
            <el-tag size="small" :type="scope.row.is_free === 1 ? 'success' : 'info'">
              {{ scope.row.is_free === 1 ? '免费试看' : '付费专享' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="scope">
            <!-- 预览按钮 -->
            <el-button type="primary" size="small" plain @click="preview_resource(scope.row)">
              <el-icon><View /></el-icon> 预览
            </el-button>
            <el-button type="success" size="small" @click="handle_audit(scope.row.id, 1)">通过</el-button>
            <el-button type="danger" size="small" @click="handle_audit(scope.row.id, 2)">驳回</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
        <el-pagination
          background
          layout="total, prev, pager, next"
          :total="total"
          v-model:current-page="query_params.page_num"
          @current-change="get_list"
        />
      </div>
    </el-card>

    <!-- 在线预览弹窗 -->
    <el-dialog v-model="preview_dialog_visible" :title="`预览: ${current_resource.resource_name}`" width="800px" destroy-on-close>
      <!-- 如果是视频 -->
      <div v-if="current_resource.resource_type === 1" class="preview-box">
        <video :src="current_resource.resource_url" controls autoplay style="width: 100%; max-height: 500px;"></video>
      </div>
      <!-- 如果是 PDF 等文档 (利用 iframe 原生预览) -->
      <div v-else class="preview-box">
        <iframe :src="current_resource.resource_url" style="width: 100%; height: 500px; border: none;"></iframe>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
	
import { ref, onMounted } from 'vue'
import request from '../../utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Files, View, VideoPlay } from '@element-plus/icons-vue' // 引入图标

const loading = ref(true)
const audit_list = ref([])
const total = ref(0)
const query_params = ref({
  page_num: 1,
  page_size: 10
})

// --- 预览弹窗相关 ---
const preview_dialog_visible = ref(false)
const current_resource = ref({})

// 获取待审核资料列表
const get_list = async () => {
  loading.value = true
  const res = await request.get('/course_resource/admin/audit/list', { params: query_params.value })
  audit_list.value = res.data.records
  total.value = parseInt(res.data.total)
  loading.value = false
}

// 打开预览弹窗
const preview_resource = (resource) => {
  current_resource.value = resource
  preview_dialog_visible.value = true
}

// 处理审核操作
const handle_audit = (resource_id, status) => {
  const action_text = status === 1 ? '通过' : '驳回'
  ElMessageBox.confirm(`确定要${action_text}这个教学资料吗？`, '审核确认').then(async () => {
    await request.post('/course_resource/admin/audit/handle', null, {
      params: { resource_id, status }
    })
    ElMessage.success('处理成功')
    get_list() // 刷新列表
  })
}

onMounted(() => {
  get_list()
})
</script>

<style scoped>
.preview-box {
  background-color: #333; /* 给个深色背景，预览视频时体验更好 */
  border-radius: 4px;
  overflow: hidden;
}
</style>