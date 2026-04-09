<template>
  <div>
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span style="font-weight: bold; color: #303133;"><el-icon><Service /></el-icon> 用户与家教反馈大厅</span>
        </div>
      </template>

      <el-table :data="feedback_list" v-loading="loading" style="width: 100%">
        <el-table-column label="反馈人" width="150">
          <template #default="scope">
            <div>{{ scope.row.real_name }} ({{ scope.row.phone }})</div>
            <el-tag size="small" :type="scope.row.role === 1 ? 'success' : 'info'" style="margin-top: 5px;">
              {{ scope.row.role === 1 ? '家教老师' : '学生用户' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="content" label="反馈内容" min-width="250" />
        <el-table-column prop="create_time" label="提交时间" width="160" />
        
        <el-table-column label="处理状态" width="120">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 0" type="danger">待处理</el-tag>
            <el-tag v-if="scope.row.status === 1" type="success">已回复</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column prop="reply" label="平台回复内容" min-width="200">
          <template #default="scope">
            <span v-if="scope.row.status === 1" style="color: #67C23A;">{{ scope.row.reply }}</span>
            <span v-else style="color: #909399;">--</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <el-button v-if="scope.row.status === 0" type="primary" size="small" @click="open_reply_dialog(scope.row.id)">
              立即回复
            </el-button>
            <el-button v-else type="info" size="small" disabled>处理完毕</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
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

    <!-- 【核心】快速回复弹窗 -->
    <el-dialog v-model="reply_dialog_visible" title="回复用户反馈" width="500px">
      <div style="margin-bottom: 15px;">
        <span style="font-size: 13px; color: #606266; margin-right: 10px;">快捷模板：</span>
        <el-tag 
          v-for="(tpl, index) in quick_templates" 
          :key="index" 
          class="quick-tag" 
          type="info" 
          effect="plain"
          @click="use_template(tpl)"
        >
          {{ tpl }}
        </el-tag>
      </div>

      <el-input 
        v-model="reply_text" 
        type="textarea" 
        :rows="4" 
        placeholder="请输入回复内容，或点击上方模板快速填入..." 
      />
      
      <template #footer>
        <el-button @click="reply_dialog_visible = false">取消</el-button>
        <el-button type="primary" @click="submit_reply">发送回复</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '../../utils/request'
import { ElMessage } from 'element-plus'

const loading = ref(true)
const feedback_list = ref([])
const total = ref(0)
const query_params = ref({ page_num: 1, page_size: 10 })

// 回复弹窗相关
const reply_dialog_visible = ref(false)
const current_feedback_id = ref(null)
const reply_text = ref('')

// 快捷回复模板数组
const quick_templates =[
  '已知悉，感谢您的宝贵建议！',
  '该问题已记录，我们将尽快修复。',
  '非常抱歉给您带来不便，我们会核实处理。',
  '您的建议已采纳，期待您继续支持平台！'
]

const get_list = async () => {
  loading.value = true
  const res = await request.get('/feedback/admin/page', { params: query_params.value })
  feedback_list.value = res.data.records
  total.value = parseInt(res.data.total)
  loading.value = false
}

const open_reply_dialog = (id) => {
  current_feedback_id.value = id
  reply_text.value = ''
  reply_dialog_visible.value = true
}

// 点击模板直接填入输入框
const use_template = (text) => {
  reply_text.value = text
}

const submit_reply = async () => {
  if (!reply_text.value.trim()) {
    ElMessage.warning('回复内容不能为空')
    return
  }
  await request.post('/feedback/admin/reply', null, {
    params: { id: current_feedback_id.value, reply: reply_text.value }
  })
  ElMessage.success('回复成功')
  reply_dialog_visible.value = false
  get_list()
}

onMounted(() => { get_list() })
</script>

<style scoped>
.quick-tag {
  cursor: pointer;
  margin-right: 8px;
  margin-bottom: 8px;
  transition: all 0.2s;
}
.quick-tag:hover {
  background-color: #409EFF;
  color: white;
}
</style>