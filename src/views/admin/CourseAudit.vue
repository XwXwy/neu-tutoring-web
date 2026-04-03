<template>
  <div>
    <el-card shadow="never">
      <el-table :data="audit_list" v-loading="loading">
        <el-table-column prop="title" label="课程标题" width="200" />
        <el-table-column prop="real_name" label="发布家教" width="100" />
        <el-table-column prop="category_name" label="科目" width="100" />
        <el-table-column prop="price" label="价格(元/课时)" width="120" />
        <el-table-column label="封面">
          <template #default="scope">
            <el-image
              style="width: 80px; height: 80px"
              :src="scope.row.cover_image"
              :preview-src-list="[scope.row.cover_image]"
              preview-teleported
            />
          </template>
        </el-table-column>
        <el-table-column prop="description" label="课程介绍" show-overflow-tooltip />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button type="success" size="small" @click="handle_audit(scope.row, 1)">通过</el-button>
            <el-button type="danger" size="small" @click="handle_audit(scope.row, 0)">驳回</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页组件 -->
      <el-pagination
        style="margin-top: 20px; justify-content: flex-end;"
        background
        layout="total, sizes, prev, pager, next"
        :total="total"
        v-model:current-page="query_params.page_num"
        v-model:page-size="query_params.page_size"
        @current-change="get_list"
        @size-change="get_list"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '../../utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(true)
const audit_list = ref([])
const total = ref(0)
const query_params = ref({
  page_num: 1,
  page_size: 10
})

const get_list = async () => {
  loading.value = true
  const res = await request.get('/course/admin/audit/list', { params: query_params.value })
  audit_list.value = res.data.records
  total.value = parseInt(res.data.total)
  loading.value = false
}

const handle_audit = (row, status) => {
  const action_text = status === 1 ? '通过' : '驳回'
  ElMessageBox.confirm(`确定要${action_text}课程【${row.title}】吗？`, '审核确认').then(async () => {
    await request.post('/course/admin/audit/handle', null, {
      params: { course_id: row.id, status }
    })
    ElMessage.success('操作成功')
    get_list()
  })
}

onMounted(() => {
  get_list()
})
</script>