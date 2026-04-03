<template>
  <div>
    <el-card shadow="never">
      <template #header>
        <div class="card-header"><span>待审核家教列表</span></div>
      </template>

      <el-table :data="auditList" v-loading="loading" style="width: 100%">
        <el-table-column prop="real_name" label="姓名" width="100" />
        <el-table-column prop="university" label="毕业院校" />
        <el-table-column prop="major" label="专业" />
        <el-table-column prop="teaching_years" label="教龄" width="80" />
        
        <!-- 学历证预览 -->
        <el-table-column label="学历证书">
          <template #default="scope">
            <el-image 
              v-if="scope.row.degree_cert"
              style="width: 60px; height: 60px; border-radius: 4px" 
              :src="scope.row.degree_cert" 
              :preview-src-list="[scope.row.degree_cert]"
              preview-teleported
            />
            <span v-else class="text-gray">未上传</span>
          </template>
        </el-table-column>

        <!-- 教师证预览 -->
        <el-table-column label="教师资格证">
          <template #default="scope">
            <el-image 
              v-if="scope.row.teacher_cert"
              style="width: 60px; height: 60px; border-radius: 4px" 
              :src="scope.row.teacher_cert" 
              :preview-src-list="[scope.row.teacher_cert]"
              preview-teleported
            />
            <span v-else class="text-gray">未上传</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button type="success" size="small" @click="handleAudit(scope.row, 1)">通过</el-button>
            <el-button type="danger" size="small" @click="handleAudit(scope.row, 0)">驳回</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '../../utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const auditList = ref([])

const getList = async () => {
  loading.value = true
  const res = await request.get('/sysUser/tutor/audit/list')
  auditList.value = res.data.records
  loading.value = false
}

const handleAudit = (row, status) => {
  const actionText = status === 1 ? '通过' : '驳回'
  ElMessageBox.confirm(`确定要${actionText}【${row.real_name}】的家教资质申请吗？`, '审核确认').then(async () => {
    await request.post('/sysUser/tutor/audit/handle', null, {
      params: { user_id: row.user_id, status: status }
    })
    ElMessage.success('操作成功')
    getList()
  })
}

onMounted(() => {
  getList()
})
</script>

<style scoped>
.text-gray { color: #999; font-size: 12px; }
</style>