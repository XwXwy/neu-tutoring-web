<template>
  <div>
    <!-- 顶部搜索与操作区 -->
    <el-card shadow="never" style="margin-bottom: 16px;">
      <el-form :inline="true" :model="query_params">
        <el-form-item label="公告标题">
          <el-input v-model="query_params.title" placeholder="搜索公告标题..." clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handle_search">查询</el-button>
          <el-button @click="reset_query">重置</el-button>
        </el-form-item>
        <el-form-item style="float: right; margin-right: 0;">
          <el-button type="success" icon="Plus" @click="open_add_dialog">发布新公告</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 公告列表 -->
    <el-card shadow="never">
      <el-table :data="notice_list" v-loading="loading" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="公告标题" show-overflow-tooltip />
        <el-table-column prop="type" label="类型" width="120">
          <template #default="scope">
            <el-tag :type="scope.row.type === 0 ? 'danger' : (scope.row.type === 1 ? 'warning' : 'primary')">
              {{ scope.row.type === 0 ? '系统更新' : (scope.row.type === 1 ? '活动通知' : '政策变更') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">
              {{ scope.row.status === 1 ? '已发布' : '草稿/撤回' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="create_time" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button type="primary" size="small" link @click="open_edit_dialog(scope.row)">编辑</el-button>
            <el-button 
              :type="scope.row.status === 1 ? 'warning' : 'success'" 
              size="small" 
              link 
              @click="toggle_status(scope.row)"
            >
              {{ scope.row.status === 1 ? '撤回' : '发布' }}
            </el-button>
            <el-button type="danger" size="small" link @click="handle_delete(scope.row.id)">删除</el-button>
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

    <!-- 发布/编辑弹窗 -->
    <el-dialog v-model="dialog_visible" :title="form_data.id ? '编辑公告' : '发布新公告'" width="700px" destroy-on-close>
      <el-form :model="form_data" label-width="100px" label-position="left">
        <el-form-item label="公告标题" required>
          <el-input v-model="form_data.title" placeholder="请输入标题..." />
        </el-form-item>
        <el-form-item label="公告类型" required>
          <el-radio-group v-model="form_data.type">
            <el-radio :label="0">系统更新</el-radio>
            <el-radio :label="1">活动通知</el-radio>
            <el-radio :label="2">政策变更</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="公告正文" required>
          <!-- 这里可以直接写 Markdown 语法，前端详情页会用 markdown-it 解析！ -->
          <el-input 
            v-model="form_data.content" 
            type="textarea" 
            :rows="10" 
            placeholder="支持 Markdown 语法排版！例如：使用 **加粗**，使用 ### 作为标题..." 
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog_visible = false">取 消</el-button>
        <el-button type="primary" @click="submit_form">确 定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
	
	import { ref, onMounted } from 'vue'
	import request from '../../utils/request'
	import { ElMessage, ElMessageBox } from 'element-plus'
	import { Plus, Notification } from '@element-plus/icons-vue' // 引入图标
	
	const loading = ref(true)
	const notice_list = ref([])
	const total = ref(0)
	const query_params = ref({
	  page_num: 1,
	  page_size: 10,
	  title: ''
	})
	
	// --- 对话框相关 ---
	const dialog_visible = ref(false)
	const form_data = ref({})
	
	// 获取公告列表
	const get_list = async () => {
	  loading.value = true
	  const res = await request.get('/notice/admin/page', { params: query_params.value })
	  notice_list.value = res.data.records
	  total.value = parseInt(res.data.total)
	  loading.value = false
	}
	
	// 搜索
	const handle_search = () => {
	  query_params.value.page_num = 1
	  get_list()
	}
	
	// 重置
	const reset_query = () => {
	  query_params.value.title = ''
	  handle_search()
	}
	
	// 打开新增弹窗
	const open_add_dialog = () => {
	  form_data.value = { type: 0 } // 初始化表单
	  dialog_visible.value = true
	}
	
	// 打开编辑弹窗
	const open_edit_dialog = (row) => {
	  form_data.value = JSON.parse(JSON.stringify(row)) // 深拷贝数据
	  dialog_visible.value = true
	}
	
	// 提交表单（新增/修改）
	const submit_form = async () => {
	  if (!form_data.value.title || !form_data.value.content) {
	    ElMessage.warning('请填写完整的标题和内容')
	    return
	  }
	  await request.post('/notice/admin/save_or_update', form_data.value)
	  ElMessage.success('公告保存成功')
	  dialog_visible.value = false
	  get_list()
	}
	
	// 切换状态（发布/撤回）
	const toggle_status = async (row) => {
	  const new_status = row.status === 1 ? 0 : 1
	  const action_text = new_status === 1 ? '发布' : '撤回'
	  await request.post('/notice/admin/save_or_update', { id: row.id, status: new_status })
	  ElMessage.success(`公告已${action_text}`)
	  get_list()
	}
	
	// 删除公告
	const handle_delete = (id) => {
	  ElMessageBox.confirm('确定要删除这篇公告吗？', '提示').then(async () => {
	    await request.delete(`/notice/admin/delete/${id}`)
	    ElMessage.success('删除成功')
	    get_list()
	  })
	}
	
	onMounted(() => {
	  get_list()
	})
	
</script>