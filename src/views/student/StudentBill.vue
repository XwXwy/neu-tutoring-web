<template>
  <div class="bill-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span style="font-weight: bold; font-size: 16px; color: #303133;">
            <el-icon><List /></el-icon> 我的费用支出明细
          </span>
        </div>
      </template>

      <el-table :data="bill_list" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="order_no" label="交易流水号" width="180" />
        <el-table-column prop="course_name" label="购买课程" min-width="180" show-overflow-tooltip />
        <el-table-column prop="tutor_name" label="收款方(家教)" width="120" />
        <el-table-column prop="pay_time" label="支付时间" width="180" />
        
        <el-table-column prop="status" label="当前状态" width="120">
          <template #default="scope">
            <el-tag v-if="scope.row.status === 2" type="primary">进行中</el-tag>
            <el-tag v-if="scope.row.status === 3" type="success">已完成</el-tag>
            <el-tag v-if="scope.row.status === 4" type="info">已退款</el-tag>
            <el-tag v-if="scope.row.status === 5" type="warning">退款处理中</el-tag>
            <el-tag v-if="scope.row.status === 6" type="danger">退款纠纷中</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="price" label="实付金额(元)" width="150" align="right" fixed="right">
          <template #default="scope">
            <span :style="{ 
              color: scope.row.status === 4 ? '#909399' : '#F56C6C', 
              fontWeight: 'bold',
              textDecoration: scope.row.status === 4 ? 'line-through' : 'none' 
            }">
              - ¥ {{ scope.row.price }}
            </span>
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '../../utils/request'
import { List } from '@element-plus/icons-vue'

const loading = ref(true)
const bill_list = ref([])
const total = ref(0)
const query_params = ref({
  page_num: 1,
  page_size: 15
})

const get_list = async () => {
  loading.value = true
  const res = await request.get('/order/student/expenditure', { params: query_params.value })
  bill_list.value = res.data.records
  total.value = parseInt(res.data.total)
  loading.value = false
}

onMounted(() => {
  get_list()
})
</script>