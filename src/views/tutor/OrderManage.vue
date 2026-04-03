<template>
  <div>
    <el-card shadow="never">
      <el-table :data="order_list" v-loading="loading">
        <el-table-column prop="order_no" label="订单号" width="200" />
        <el-table-column prop="course_name" label="预约课程" />
        <el-table-column prop="student_name" label="学生姓名" />
        <el-table-column prop="student_phone" label="联系电话" width="130" />
        <el-table-column prop="appoint_time" label="预约时间" />
        <el-table-column prop="price" label="订单金额" />
		<el-table-column prop="pay_time" label="对方支付时间" width="160">
		          <template #default="scope">
		            {{ scope.row.pay_time || '未支付' }}
		          </template>
		        </el-table-column>
		
		<!-- 新增：备注与平台处理结果 -->
		        <el-table-column label="备注与平台处理结果" min-width="200" show-overflow-tooltip>
		          <template #default="scope">
		            <span v-if="scope.row.remark && scope.row.remark.includes('【平台裁决')">
		              <span style="color: #666;">{{ scope.row.remark.split('【平台裁决')[0] }}</span>
		              <strong style="color: #F56C6C;">【平台裁决{{ scope.row.remark.split('【平台裁决')[1] }}</strong>
		            </span>
		            <span v-else>{{ scope.row.remark || '无备注' }}</span>
		          </template>
		        </el-table-column>
		
        <el-table-column prop="status" label="订单状态" width="120">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 0" type="warning">待确认</el-tag>
            <el-tag v-if="scope.row.status === 1">待支付</el-tag>
            <el-tag v-if="scope.row.status === 2" type="primary">进行中</el-tag>
            <el-tag v-if="scope.row.status === 3" type="success">已完成</el-tag>
            <el-tag v-if="scope.row.status === 4" type="info">已取消</el-tag>
			            <el-tag v-if="scope.row.status === 5" type="warning">退款申请中</el-tag>
			            <el-tag v-if="scope.row.status === 6" type="danger">平台介入(纠纷中)</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="scope">
             <!-- 状态0 (待确认)：显示接单和拒单 -->
            <div v-if="scope.row.status === 0">
              <el-button type="success" size="small" @click="handle_order(scope.row.id, 1)">接单</el-button>
              <el-button type="danger" size="small" @click="handle_order(scope.row.id, -1)">拒单</el-button>
            </div>
			
			            <!-- 状态1 (待支付)：显示取消订单 -->
			            <div v-else-if="scope.row.status === 1">
			              <el-button type="warning" size="small" @click="handle_order(scope.row.id, -1)">取消订单</el-button>
			            </div>
			            <!-- 其他状态不显示操作 -->
						
						            <!-- 状态5 (退款中)：显示同意和拒绝退款 -->
            <div v-else-if="scope.row.status === 5" style="display: flex; justify-content; gap: 10px;">
              <el-button type="success" size="small" style="margin: 0;" @click="handle_refund(scope.row.id, 1)">同意退款</el-button>
              <el-button type="danger" size="small" style="margin: 0;" @click="open_refuse_dialog(scope.row.id)">拒绝退款</el-button>
            </div>
						            
						            <!-- 状态6 (纠纷中)：不可操作，只提示 -->
						            <div v-else-if="scope.row.status === 6">
						              <span style="color: #999; font-size: 12px;">等待管理员处理</span>
						            </div>
            <span v-else>不可操作</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
  
  
  <!-- 拒绝退款弹窗 -->
      <el-dialog v-model="refuse_dialog_visible" title="填写拒绝退款理由" width="400px">
        <el-input 
          v-model="refuse_reason" 
          type="textarea" 
          :rows="3" 
          placeholder="请详细说明拒绝退款的理由，此信息将提交给平台管理员进行裁判..." 
        />
        <template #footer>
          <el-button @click="refuse_dialog_visible = false">取消</el-button>
          <el-button type="primary" @click="submit_refuse">提交</el-button>
        </template>
      </el-dialog>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '../../utils/request'
import { ElMessage } from 'element-plus'

const loading = ref(true)
const order_list = ref([])
const refuse_dialog_visible = ref(false)
const refuse_reason = ref('')
const current_refund_order_id = ref(null)

// 家教同意退款
const handle_refund = (order_id, is_agree) => {
  ElMessageBox.confirm('确定同意退款吗？订单将直接取消，资金退回给学生。', '提示').then(async () => {
    await request.post('/order/tutor/handle_refund', null, {
      params: { order_id, is_agree: 1 }
    })
    ElMessage.success('已同意退款')
    get_list()
  })
}

// 家教打开拒绝退款弹窗
const open_refuse_dialog = (order_id) => {
  current_refund_order_id.value = order_id
  refuse_reason.value = ''
  refuse_dialog_visible.value = true
}

// 提交拒绝退款申请
const submit_refuse = async () => {
  if (!refuse_reason.value.trim()) {
    ElMessage.warning('请填写拒绝理由')
    return
  }
  await request.post('/order/tutor/handle_refund', null, {
    params: { order_id: current_refund_order_id.value, is_agree: 0, reason: refuse_reason.value }
  })
  ElMessage.success('已拒绝退款，等待平台管理员介入处理')
  refuse_dialog_visible.value = false
  get_list()
}

const get_list = async () => {
  loading.value = true
  const res = await request.get('/order/tutor/list')
  order_list.value = res.data.records
  loading.value = false
}

const handle_order = async (order_id, action) => {
  try {
    await request.post('/order/tutor/handle', null, {
      params: { order_id, action }
    })
    ElMessage.success('操作成功！')
    get_list() // 刷新列表
  } catch(error) {}
}

onMounted(() => {
  get_list()
})
</script>