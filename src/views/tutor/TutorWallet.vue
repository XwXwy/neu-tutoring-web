<template>
  <div class="editorial-page-container">
    <el-row :gutter="24">
      <!-- 左侧：余额卡片与提现 -->
      <el-col :xs="24" :md="8">
        <el-card shadow="never" class="editorial-card balance-card">
          <div class="balance-content">
            <div class="balance-title">账户可提现余额</div>
            <div class="balance-amount">
              <span class="symbol">¥</span>
              <span class="num">{{ balance }}</span>
            </div>
            <button class="btn-withdraw" @click="withdraw_dialog_visible = true">
              申请提现
            </button>
          </div>
        </el-card>

        <!-- 提现弹窗 -->
        <el-dialog 
          v-model="withdraw_dialog_visible" 
          title="账户提现" 
          width="420px"
          class="editorial-dialog"
          destroy-on-close
        >
          <div class="dialog-subtitle">请确认提现金额及收款渠道</div>
          <el-form label-position="top" class="editorial-form form-stacked">
            <el-form-item label="提现金额 (元)" required>
              <el-input-number 
                v-model="withdraw_amount" 
                :precision="2" 
                :min="1" 
                :max="parseFloat(balance)" 
                class="warm-input-number"
              />
            </el-form-item>
            <el-form-item label="收款渠道" required>
              <el-radio-group v-model="withdraw_method" class="warm-radio-group pay-methods">
                <el-radio label="微信钱包" class="radio-item">
                  <el-icon class="pay-icon"><ChatDotRound /></el-icon> 微信钱包
                </el-radio>
                <el-radio label="支付宝" class="radio-item">
                  <el-icon class="pay-icon"><Platform /></el-icon> 支付宝
                </el-radio>
                <el-radio label="银行卡" class="radio-item">
                  <el-icon class="pay-icon"><CreditCard /></el-icon> 银行储蓄卡
                </el-radio>
              </el-radio-group>
            </el-form-item>
          </el-form>
          <template #footer>
            <div class="dialog-footer">
              <el-button class="btn-secondary" @click="withdraw_dialog_visible = false">取消</el-button>
              <el-button class="btn-brand" :loading="withdrawing" @click="submit_withdraw">确认提现</el-button>
            </div>
          </template>
        </el-dialog>
      </el-col>

      <!-- 右侧：ECharts 收入趋势图 -->
      <el-col :xs="24" :md="16">
        <el-card shadow="never" class="editorial-card chart-card">
          <template #header>
            <div class="card-header">
              <span class="header-title serif-title">
                <el-icon class="title-icon"><DataAnalysis /></el-icon> 近期教学收入走势
              </span>
            </div>
          </template>
          <div ref="chart_ref" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 下方：收支明细流水账 -->
    <el-card shadow="never" class="editorial-card statement-card">
      <template #header>
        <div class="card-header">
          <span class="header-title serif-title">资金流水明细</span>
        </div>
      </template>
      
      <el-table 
        :data="log_list" 
        style="width: 100%"
        class="editorial-table"
      >
        <el-table-column prop="create_time" label="交易时间" width="200" class-name="text-monospace text-stone" />
        <el-table-column prop="description" label="交易说明" min-width="240" class-name="text-main fw-500" />
        
        <el-table-column prop="type" label="类型" width="120">
          <template #default="scope">
            <div class="type-badge" :class="scope.row.type === 1 ? 'type-income' : 'type-withdraw'">
              {{ scope.row.type === 1 ? '课程收入' : '账户提现' }}
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="amount" label="金额(元)" width="160" align="right" fixed="right">
          <template #default="scope">
            <div class="amount-box" :class="scope.row.type === 1 ? 'is-income' : 'is-withdraw'">
              <span class="amount-symbol">{{ scope.row.type === 1 ? '+' : '-' }} ¥</span>
              <span class="amount-num">{{ scope.row.amount }}</span>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination 
          class="editorial-pagination"
          background 
          layout="total, prev, pager, next" 
          :total="total" 
          v-model:current-page="query_params.page_num" 
          @current-change="load_info" 
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onActivated, nextTick, markRaw } from 'vue'
import request from '../../utils/request'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { ChatDotRound, Platform, CreditCard, DataAnalysis } from '@element-plus/icons-vue'

const loading = ref(true)
const balance = ref('0.00')
const log_list = ref([])
const total = ref(0)
const query_params = ref({ page_num: 1, page_size: 10 })

const withdraw_dialog_visible = ref(false)
const withdrawing = ref(false)
const withdraw_amount = ref(100)
const withdraw_method = ref('微信钱包')

const chart_ref = ref(null)
let echart_instance = null

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
    load_info() 
  } catch (error) {}
  withdrawing.value = false
}

const load_chart = async () => {
  const res = await request.get('/wallet/report')
  const report_data = res.data || []
  
  if (chart_ref.value) {
    // 销毁旧实例防止内存泄漏
    if (echart_instance) {
      echart_instance.dispose()
    }
    
    // 使用 markRaw 避免 Vue 响应式代理导致的性能问题
    echart_instance = markRaw(echarts.init(chart_ref.value))
    
    const x_data = report_data.map(item => item.month)
    const y_data = report_data.map(item => item.total_income)

    // 应用 Claude 美学的渐变色 (陶土红 -> 珊瑚色)
    const terracotta = '#c96442'
    const coral = '#d97757'
    const warm_sand = '#e8e6dc'
    const olive = '#5e5d59'

    echart_instance.setOption({
      tooltip: { 
        trigger: 'axis',
        backgroundColor: '#faf9f5', /* ivory */
        borderColor: '#e8e6dc',     /* border-warm */
        textStyle: { color: '#141413', fontFamily: 'system-ui, sans-serif' },
        axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(232, 230, 220, 0.4)' } } /* warm-sand shadow */
      },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
      xAxis: { 
        type: 'category', 
        data: x_data, 
        axisLabel: { color: olive, fontFamily: 'system-ui, sans-serif', padding: [6, 0, 0, 0] },
        axisLine: { lineStyle: { color: warm_sand } },
        axisTick: { show: false }
      },
      yAxis: { 
        type: 'value', 
        axisLabel: { color: olive, fontFamily: 'monospace' }, 
        splitLine: { lineStyle: { type: 'dashed', color: warm_sand } } 
      },
      series: [
        {
          data: y_data,
          type: 'bar',
          barWidth: '35%',
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: coral },
              { offset: 1, color: terracotta }
            ]),
            borderRadius: [4, 4, 0, 0]
          },
          emphasis: {
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#e58e72' }, // 更亮的珊瑚色
                { offset: 1, color: terracotta }
              ])
            }
          }
        }
      ]
    })
    
    window.addEventListener('resize', () => { 
      if(echart_instance) echart_instance.resize() 
    })
  }
}

// 图表初始化只需执行一次，保留在 onMounted 中
onMounted(() => {
  nextTick(() => { load_chart() })
})

// 每次进入页面时刷新钱包数据和流水记录
onActivated(() => {
  load_info()
})
</script>

<style scoped>
/* ================= 美学色板与变量定义 ================= */
* {
  --clr-parchment: #f5f4ed;     
  --clr-ivory: #faf9f5;         
  --clr-white: #ffffff;
  --clr-near-black: #141413;    /* 暗场底色 / 墨黑文字 */
  
  --clr-terracotta: #c96442;    /* 收入颜色 / 品牌色 */
  --clr-coral: #d97757;         
  
  --clr-olive: #5e5d59;         
  --clr-stone: #87867f;         
  --clr-charcoal: #4d4c48;      /* 提现颜色 */
  
  --clr-warm-sand: #e8e6dc;     
  --clr-border-cream: #f0eee6;  
  --clr-border-warm: #e8e6dc;   
  --clr-ring-warm: #d1cfc5;     
  --clr-focus-blue: #3898ec;
  
  --font-serif: "Georgia", "Times New Roman", serif;
  --font-sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.editorial-page-container {
  font-family: var(--font-sans);
  padding-top: 8px;
  padding-bottom: 40px;
}

/* ================= 柔和卡片系统 ================= */
.editorial-card {
  background-color: var(--clr-ivory);
  border: 1px solid var(--clr-border-cream);
  border-radius: 12px;
  box-shadow: rgba(0, 0, 0, 0.02) 0px 4px 12px !important;
}
:deep(.editorial-card .el-card__header) {
  padding: 20px 24px;
  border-bottom: 1px solid var(--clr-border-cream);
}
:deep(.editorial-card .el-card__body) { padding: 24px; }

.header-title {
  font-family: var(--font-serif);
  font-size: 18px;
  font-weight: 500;
  color: var(--clr-near-black);
  display: flex;
  align-items: center;
}
.title-icon { margin-right: 8px; font-size: 20px; color: var(--clr-stone); }

/* ================= 资产黑卡 (重构) ================= */
.balance-card {
  /* 摒弃廉价渐变，使用具有权威感的墨黑色 */
  background-color: var(--clr-near-black) !important;
  color: var(--clr-parchment);
  border: none !important;
  height: 100%;
  display: flex;
  flex-direction: column;
}
:deep(.balance-card .el-card__body) { 
  flex: 1; 
  display: flex; 
  flex-direction: column; 
  justify-content: center;
  align-items: center;
  padding: 32px 24px;
}

.balance-content { text-align: center; width: 100%; }
.balance-title { 
  font-size: 14px; 
  color: var(--clr-stone); 
  margin-bottom: 16px;
  letter-spacing: 0.5px;
}
.balance-amount { margin-bottom: 32px; display: flex; justify-content: center; align-items: baseline; }
.balance-amount .symbol { font-size: 24px; color: var(--clr-terracotta); margin-right: 8px; font-weight: 500; }
.balance-amount .num { 
  font-size: 48px; 
  font-weight: 500; 
  font-family: var(--font-serif);
  color: var(--clr-ivory); 
}

.btn-withdraw {
  background-color: var(--clr-charcoal);
  color: var(--clr-ivory);
  border: 1px solid var(--clr-olive);
  border-radius: 24px;
  padding: 12px 32px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  width: 70%;
}
.btn-withdraw:hover {
  background-color: var(--clr-olive);
  border-color: var(--clr-stone);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

/* ================= 图表区 ================= */
.chart-card { height: 100%; }
.chart-container { width: 100%; height: 280px; }

/* ================= 流水明细表格 ================= */
.statement-card { margin-top: 24px; }
.editorial-table {
  --el-table-border-color: var(--clr-border-cream);
  --el-table-header-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  background-color: transparent;
}
:deep(.editorial-table th.el-table__cell) { font-family: var(--font-serif); font-size: 15px; font-weight: 500; color: var(--clr-near-black); border-bottom: 2px solid var(--clr-border-warm); padding: 16px 0; }
:deep(.editorial-table td.el-table__cell) { padding: 20px 0; border-bottom: 1px solid var(--clr-border-cream); vertical-align: middle; }
:deep(.editorial-table--enable-row-hover .el-table__body tr:hover > td.el-table__cell) { background-color: var(--clr-parchment); }

/* 文本类 */
:deep(.text-main) { color: var(--clr-near-black); font-size: 15px; }
:deep(.fw-500) { font-weight: 500; }
:deep(.text-stone) { color: var(--clr-stone); font-size: 14px; }
:deep(.text-monospace) { font-family: monospace; letter-spacing: 0.5px; }

/* 类型徽章 */
.type-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}
.type-income { background-color: rgba(201, 100, 66, 0.08); color: var(--clr-terracotta); }
.type-withdraw { background-color: var(--clr-border-warm); color: var(--clr-charcoal); }

/* 金额对齐 */
.amount-box {
  font-family: monospace;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  justify-content: flex-end;
  align-items: baseline;
}
.amount-symbol { font-size: 14px; margin-right: 4px; }
/* 收入用陶土红，支出用中性灰 */
.is-income { color: var(--clr-terracotta); }
.is-withdraw { color: var(--clr-charcoal); font-weight: 500; }

/* ================= 提现弹窗 ================= */
:deep(.editorial-dialog) { border-radius: 16px; background-color: var(--clr-ivory); }
:deep(.editorial-dialog .el-dialog__header) { padding: 32px 32px 0; margin-right: 0; }
:deep(.editorial-dialog .el-dialog__title) { font-family: var(--font-serif); font-weight: 500; font-size: 22px; color: var(--clr-near-black); }
.dialog-subtitle { font-size: 14px; color: var(--clr-olive); margin-top: 8px; margin-bottom: 24px; padding: 0 32px; }
.form-stacked { padding: 0 32px; }
.dialog-footer { padding-top: 12px; }

.editorial-form :deep(.el-form-item__label) { font-weight: 500; color: var(--clr-olive); }
.warm-input-number { width: 100% !important; }
.warm-input-number :deep(.el-input__wrapper) { background-color: var(--clr-parchment); border: 1px solid var(--clr-border-warm); border-radius: 8px; box-shadow: none !important; }

/* 支付方式单选框组重塑 */
.warm-radio-group { display: flex; flex-direction: column; width: 100%; gap: 12px; }
.radio-item {
  margin-right: 0 !important;
  border: 1px solid var(--clr-border-warm) !important;
  border-radius: 8px !important;
  padding: 12px 16px !important;
  height: auto !important;
  background-color: var(--clr-white);
  transition: all 0.2s;
}
.radio-item.is-checked { border-color: var(--clr-terracotta) !important; background-color: var(--clr-parchment); }
.radio-item :deep(.el-radio__input.is-checked .el-radio__inner) { border-color: var(--clr-terracotta); background: var(--clr-terracotta); }
.radio-item :deep(.el-radio__label) { color: var(--clr-charcoal); display: flex; align-items: center; font-size: 14px; }
.pay-icon { font-size: 18px; margin-right: 8px; color: var(--clr-stone); }

.btn-brand { background: var(--clr-terracotta) !important; color: var(--clr-ivory) !important; border: none; border-radius: 8px; padding: 8px 24px; font-weight: 500; box-shadow: var(--clr-terracotta) 0px 0px 0px 0px, var(--clr-terracotta) 0px 0px 0px 1px; }
.btn-secondary { background: var(--clr-warm-sand) !important; color: var(--clr-charcoal) !important; border: none; border-radius: 8px; padding: 8px 24px; font-weight: 500; }

/* ================= 分页器 ================= */
.pagination-wrapper { margin-top: 24px; display: flex; justify-content: flex-end; }
.editorial-pagination :deep(.el-pager li:not(.is-active)) { background-color: var(--clr-parchment); color: var(--clr-olive); border-radius: 6px; }
.editorial-pagination :deep(.el-pager li.is-active) { background-color: var(--clr-terracotta) !important; color: var(--clr-ivory); border-radius: 6px; }
</style>