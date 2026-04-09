<template>
  <div class="wallet-container" v-loading="loading">
    
    <el-row :gutter="20">
      <!-- 左侧：余额卡片与提现 -->
      <el-col :xs="24" :md="8">
        <el-card shadow="hover" class="balance-card">
          <div class="balance-title">账户可提现余额</div>
          <div class="balance-amount">
            <span class="symbol">¥</span>
            <span class="num">{{ balance }}</span>
          </div>
          <el-button type="success" size="large" class="withdraw-btn" @click="withdraw_dialog_visible = true" round>
            申请提现
          </el-button>
        </el-card>

        <!-- 提现弹窗 -->
        <el-dialog v-model="withdraw_dialog_visible" title="账户提现" width="400px">
          <el-form label-position="top">
            <el-form-item label="提现金额 (元)" required>
              <el-input-number v-model="withdraw_amount" :precision="2" :min="1" :max="parseFloat(balance)" style="width: 100%" />
            </el-form-item>
            <el-form-item label="提现到" required>
              <el-radio-group v-model="withdraw_method" class="pay-methods">
                <el-radio label="微信钱包" border><el-icon color="#67C23A"><ChatDotRound /></el-icon> 微信</el-radio>
                <el-radio label="支付宝" border><el-icon color="#409EFF"><Platform /></el-icon> 支付宝</el-radio>
                <el-radio label="银行卡" border><el-icon color="#E6A23C"><CreditCard /></el-icon> 银行卡</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="withdraw_dialog_visible = false">取消</el-button>
            <el-button type="primary" :loading="withdrawing" @click="submit_withdraw">确认提现</el-button>
          </template>
        </el-dialog>
      </el-col>

      <!-- 右侧：ECharts 收入趋势图 -->
      <el-col :xs="24" :md="16">
        <el-card shadow="hover" class="chart-card">
          <template #header>
            <div class="card-header">
              <span style="font-weight: bold;"><el-icon><DataAnalysis /></el-icon> 近期教学收入走势</span>
            </div>
          </template>
          <div ref="chart_ref" style="width: 100%; height: 260px;"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 下方：收支明细流水账 -->
    <el-card shadow="never" style="margin-top: 20px;">
      <template #header>
        <span style="font-weight: bold;">资金明细</span>
      </template>
      <el-table :data="log_list" style="width: 100%">
        <el-table-column prop="create_time" label="时间" width="180" />
        <el-table-column prop="description" label="交易说明" min-width="200" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.type === 1 ? 'success' : 'warning'" effect="light">
              {{ scope.row.type === 1 ? '课程收入' : '账户提现' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="金额(元)" width="150" align="right">
          <template #default="scope">
            <span :style="{ color: scope.row.type === 1 ? '#67C23A' : '#E6A23C', fontWeight: 'bold' }">
              {{ scope.row.type === 1 ? '+' : '-' }} {{ scope.row.amount }}
            </span>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
        <el-pagination background layout="total, prev, pager, next" :total="total" v-model:current-page="query_params.page_num" @current-change="load_info" />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import request from '../../utils/request'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'

const loading = ref(true)
const balance = ref('0.00')
const log_list = ref([])
const total = ref(0)
const query_params = ref({ page_num: 1, page_size: 10 })

// 提现相关
const withdraw_dialog_visible = ref(false)
const withdrawing = ref(false)
const withdraw_amount = ref(100)
const withdraw_method = ref('微信钱包')

// 图表相关
const chart_ref = ref(null)

const load_info = async () => {
  loading.value = true
  const res = await request.get('/wallet/info', { params: query_params.value })
  balance.value = res.data.balance
  log_list.value = res.data.logs.records
  total.value = parseInt(res.data.logs.total)
  loading.value = false
}

const submit_withdraw = async () => {
  withdrawing.value = true
  try {
    await request.post('/wallet/withdraw', null, {
      params: { amount: withdraw_amount.value, method: withdraw_method.value }
    })
    ElMessage.success('提现申请成功！')
    withdraw_dialog_visible.value = false
    load_info() // 刷新余额和流水
  } catch (error) {}
  withdrawing.value = false
}

// 加载并渲染图表
const load_chart = async () => {
  const res = await request.get('/wallet/report')
  const report_data = res.data ||[]
  
  if (chart_ref.value) {
    const my_chart = echarts.init(chart_ref.value)
    
    // 拆分出 x 轴月份和 y 轴金额
    const x_data = report_data.map(item => item.month)
    const y_data = report_data.map(item => item.total_income)

    my_chart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: x_data, axisLabel: { color: '#666' } },
      yAxis: { type: 'value', axisLabel: { color: '#666' }, splitLine: { lineStyle: { type: 'dashed' } } },
      series:[
        {
          data: y_data,
          type: 'bar',
          barWidth: '40%',
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1,[
              { offset: 0, color: '#83bff6' },
              { offset: 0.5, color: '#188df0' },
              { offset: 1, color: '#188df0' }
            ]),
            borderRadius:[4, 4, 0, 0]
          }
        }
      ]
    })
    
    window.addEventListener('resize', () => { my_chart.resize() })
  }
}

onMounted(() => {
  load_info()
  nextTick(() => { load_chart() })
})
</script>

<style scoped>
.balance-card {
  background: linear-gradient(135deg, #188df0, #83bff6);
  color: white;
  text-align: center;
  height: 88%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 20px 0;
  border: none;
}
.balance-title { font-size: 16px; opacity: 0.9; margin-bottom: 10px; }
.balance-amount { margin-bottom: 25px; }
.balance-amount .symbol { font-size: 24px; font-weight: bold; margin-right: 5px; }
.balance-amount .num { font-size: 48px; font-weight: bold; letter-spacing: 1px; }
.withdraw-btn { width: 60%; font-weight: bold; color: #188df0; background-color: #fff; border: none; }
.withdraw-btn:hover { background-color: #f0f2f5; }
.pay-methods { display: flex; flex-direction: column; gap: 10px; width: 100%; }
.pay-methods .el-radio { margin-right: 0; width: 100%; }
</style>