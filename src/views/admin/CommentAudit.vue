<template>
  <div>
    <el-card shadow="never">
      <template #header>
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: bold; color: #303133;">
            <el-icon><Filter /></el-icon> 全站评价管理中心
          </span>
          <!-- 核心过滤开关：只看被举报的评论 -->
          <el-radio-group v-model="query_params.is_reported" @change="handle_filter_change">
            <el-radio-button :label="0">全部评价</el-radio-button>
            <el-radio-button :label="1">
              <span style="color: #F56C6C; font-weight: bold;">仅看被举报</span>
            </el-radio-button>
          </el-radio-group>
        </div>
      </template>

      <el-table :data="comment_list" v-loading="loading" style="width: 100%">
        <el-table-column prop="content" label="评价内容" min-width="250" show-overflow-tooltip />
        <el-table-column prop="score" label="打分" width="130">
          <template #default="scope">
            <el-rate v-model="scope.row.score" disabled />
          </template>
        </el-table-column>
        
        <el-table-column label="关联信息" width="200">
          <template #default="scope">
            <div style="font-size: 13px;"><strong>评价人：</strong>{{ scope.row.student_name }}</div>
            <div style="font-size: 13px; margin-top: 5px;"><strong>被评家教：</strong>{{ scope.row.tutor_name }}</div>
          </template>
        </el-table-column>

        <el-table-column prop="create_time" label="发表时间" width="160" />

        <!-- 举报次数高亮展示 -->
        <el-table-column label="被举报次数" width="120" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.report_count > 0" type="danger" effect="dark" round>
              {{ scope.row.report_count }} 次
            </el-tag>
            <span v-else style="color: #909399;">0</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <el-button type="danger" size="small" @click="handle_delete(scope.row.id)">
              <el-icon><Delete /></el-icon> 删除违规
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页组件 -->
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
  </div>
</template>

<script setup>
	import { ref, onMounted } from 'vue'
	import request from '../../utils/request'
	import { ElMessage, ElMessageBox } from 'element-plus'
	import { Filter, Delete } from '@element-plus/icons-vue' // 引入图标
	
	const loading = ref(true)
	const comment_list = ref([])
	const total = ref(0)
	const query_params = ref({
	  page_num: 1,
	  page_size: 10,
	  is_reported: 0 // 0-全部, 1-只看被举报
	})
	
	// 获取评价列表
	const get_list = async () => {
	  loading.value = true
	  try {
	    // 调用我们之前写好的、支持过滤的接口
	    const res = await request.get('/comment/admin/list', { params: query_params.value })
	    comment_list.value = res.data.records
	    total.value = parseInt(res.data.total)
	  } catch (error) {
	    console.error("加载评价列表失败:", error)
	  } finally {
	    loading.value = false
	  }
	}
	
	// 筛选开关变化时触发
	const handle_filter_change = () => {
	  // 切换筛选时，总是从第一页开始看
	  query_params.value.page_num = 1
	  get_list()
	}
	
	// 管理员删除违规评价
	const handle_delete = (comment_id) => {
	  ElMessageBox.confirm(
	    '确定要删除这条评价吗？删除后，家教的综合评分将自动重新计算。',
	    '删除确认',
	    { type: 'warning' }
	  ).then(async () => {
	    await request.post('/comment/admin/delete', null, {
	      params: { comment_id }
	    })
	    ElMessage.success('违规评价已删除，家教评分已更新')
	    get_list() // 刷新列表
	  })
	}
	
	// 组件挂载时自动加载数据
	onMounted(() => {
	  get_list()
	})
	
</script>