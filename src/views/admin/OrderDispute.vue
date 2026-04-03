<template>
  <div>
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span style="color: #F56C6C; font-weight: bold;"><el-icon><Warning /></el-icon> 待处理的订单纠纷</span>
        </div>
      </template>

      <el-table :data="dispute_list" v-loading="loading" style="width: 100%">
        <el-table-column prop="order_no" label="订单号" width="180" />
        <el-table-column prop="course_name" label="课程名称" width="150" show-overflow-tooltip />
        <el-table-column label="涉事双方" width="200">
          <template #default="scope">
            <div><strong>学生：</strong>{{ scope.row.student_name }} ({{ scope.row.student_phone }})</div>
            <div style="margin-top: 5px;"><strong>老师：</strong>{{ scope.row.tutor_name }} ({{ scope.row.tutor_phone }})</div>
          </template>
        </el-table-column>
        <el-table-column prop="price" label="涉案金额">
          <template #default="scope">
            <span style="color: #F56C6C; font-weight: bold;">¥{{ scope.row.price }}</span>
          </template>
        </el-table-column>
        
        <!-- 【核心展示】拒绝理由 -->
        <el-table-column prop="dispute_reason" label="家教拒绝退款理由" min-width="250">
          <template #default="scope">
            <el-alert
              :title="scope.row.dispute_reason"
              type="error"
              :closable="false"
            />
          </template>
        </el-table-column>

        <el-table-column label="仲裁操作" width="260" fixed="right" >
          <template #default="scope" >
            <el-button type="success" size="small" @click="handle_resolve(scope.row, 1)">判给学生(退款)</el-button>
            <el-button type="danger" size="small" @click="handle_resolve(scope.row, 2)">判给老师(打款)</el-button>
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
  </div>
</template>

<script setup>
	
	import { ref, onMounted } from 'vue'
	import request from '../../utils/request'
	import { ElMessage, ElMessageBox } from 'element-plus'
	
	const loading = ref(true)
	const dispute_list = ref([])
	const total = ref(0)
	const query_params = ref({
	  page_num: 1,
	  page_size: 10
	})
	
	// 获取纠纷订单列表
	const get_list = async () => {
	  loading.value = true
	  const res = await request.get('/order/admin/dispute_list', { params: query_params.value })
	  dispute_list.value = res.data.records
	  total.value = parseInt(res.data.total)
	  loading.value = false
	}
	
	// 管理员处理裁决
	const handle_resolve = (order, resolve_type) => {
	  const resolve_text = resolve_type === 1 ? '判给学生（退款）' : '判给老师（打款）'
	  const confirm_text = resolve_type === 1 
	    ? '此操作将使订单取消，资金原路退回学生账户。' 
	    : '此操作将使订单完成，并将课程费用结算给家教老师。'
	
	  ElMessageBox.confirm(
	    `你正在对订单【${order.order_no}】进行裁决，裁决结果为：<strong style="color: #F56C6C;">${resolve_text}</strong>。<br/>${confirm_text}<br/>此操作不可逆，请确认！`,
	    '最终裁决警告',
	    {
	      dangerouslyUseHTMLString: true, // 允许在消息中使用 HTML
	      confirmButtonText: '我确认裁决',
	      cancelButtonText: '再想想',
	      type: 'warning'
	    }
	  ).then(async () => {
	    await request.post('/order/admin/resolve_dispute', null, {
	      params: { order_id: order.id, resolve_type }
	    })
	    ElMessage.success('裁决已执行！')
	    get_list() // 刷新列表
	  }).catch(() => {
	    ElMessage.info('已取消裁决操作')
	  })
	}
	
	onMounted(() => {
	  get_list()
	})
	
</script>