<template>
  <div class="editorial-page-container">
    <el-card shadow="never" class="editorial-card">
      <template #header>
        <div class="card-header">
          <span class="header-title">
            <el-icon class="title-icon"><Ticket /></el-icon> 
            我的预约订单
          </span>
        </div>
      </template>

      <el-table 
        :data="order_list" 
        v-loading="loading" 
        style="width: 100%"
        class="editorial-table"
      >
        <el-table-column prop="order_no" label="订单流水号" width="180" class-name="text-monospace" />
        <el-table-column prop="course_name" label="课程名称" min-width="180" show-overflow-tooltip class-name="text-main fw-500" />
        <el-table-column prop="tutor_name" label="家教老师" width="90" class-name="text-olive" />
        
        <el-table-column prop="price" label="金额 (元)" width="100">
          <template #default="scope">
            <span class="price-text">¥ {{ scope.row.price }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="appoint_time" label="预约时间" width="120" class-name="text-stone" />
        
        <el-table-column prop="pay_time" label="支付时间" width="120">
          <template #default="scope">
            <span :class="scope.row.pay_time ? 'text-stone' : 'empty-text'">
              {{ scope.row.pay_time || '尚未支付' }}
            </span>
          </template>
        </el-table-column>
        
        <!-- 备注与平台处理结果 -->
        <el-table-column label="备注与处理结果" min-width="250" show-overflow-tooltip>
          <template #default="scope">
            <div v-if="scope.row.remark && scope.row.remark.includes('【平台裁决')">
              <span class="text-olive">{{ scope.row.remark.split('【平台裁决')[0] }}</span>
              <span class="remark-highlight">【平台裁决{{ scope.row.remark.split('【平台裁决')[1] }}</span>
            </div>
            <span v-else class="text-olive">{{ scope.row.remark || '暂无备注' }}</span>
          </template>
        </el-table-column>

        <!-- 状态圆点重塑 -->
        <el-table-column prop="status" label="订单状态" width="120">
          <template #default="scope">
            <div class="status-badge" :class="'status-' + scope.row.status">
              <span class="status-dot"></span>
              <span class="status-text">
                {{ 
                  scope.row.status === 0 ? '等待接单' : 
                  scope.row.status === 1 ? '待支付' : 
                  scope.row.status === 2 ? '授课进行中' : 
                  scope.row.status === 3 ? '已完成' : 
                  scope.row.status === 4 ? '已取消' : 
                  scope.row.status === 5 ? '退款处理中' : 
                  scope.row.status === 6 ? '纠纷处理中' : '未知'
                }}
              </span>
            </div>
          </template>
        </el-table-column>

        <!-- 操作按钮实体化 -->
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <div class="action-buttons">
              <!-- 待支付 -->
              <template v-if="scope.row.status === 1">
                <button class="btn-action btn-pay" @click="open_pay_dialog(scope.row)">立即支付</button>
                <button class="btn-action btn-cancel" @click="cancel_order(scope.row.id)">取消</button>
              </template>

              <!-- 待确认 -->
              <template v-if="scope.row.status === 0">
                <button class="btn-action btn-cancel" @click="cancel_order(scope.row.id)">取消预约</button>
              </template>

              <!-- 进行中 -->
              <template v-if="scope.row.status === 2">
                <button class="btn-action btn-finish" @click="finish_order(scope.row.id)">确认完成</button>
                <button class="btn-action btn-refund" @click="apply_refund(scope.row.id)">申请退款</button>
              </template>

              <!-- 退款中 / 纠纷中 -->
              <template v-if="scope.row.status === 5">
                <span class="status-waiting"><el-icon><Timer /></el-icon> 等待家教处理</span>
              </template>
              <template v-if="scope.row.status === 6">
                <span class="status-danger"><el-icon><Warning /></el-icon> 等待平台裁决</span>
              </template>

              <!-- 已完成 -->
              <template v-if="scope.row.status === 3">
                <button 
                  v-if="scope.row.is_commented === 0 || !scope.row.is_commented" 
                  class="btn-action btn-comment" 
                  @click="open_comment_dialog(scope.row)"
                >
                  评价家教
                </button>
                <span v-else class="status-success"><el-icon><CircleCheck /></el-icon> 已评价</span>
              </template>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination 
          class="editorial-pagination"
          background 
          layout="total, prev, pager, next" 
          :total="total"
          v-model:current-page="query_params.page_num" 
          @current-change="get_list" 
        />
      </div>
    </el-card>

    <!-- 模拟收银台弹窗 -->
    <el-dialog 
      v-model="pay_dialog_visible" 
      title="收银台" 
      width="420px" 
      class="editorial-dialog"
      destroy-on-close
    >
      <div class="dialog-subtitle">请确认支付金额并选择支付方式</div>
      <div class="pay-container">
        <div class="pay-amount-box">
          <span class="currency">¥</span>
          <span class="amount">{{ current_pay_order.price }}</span>
        </div>

        <el-radio-group v-model="pay_method" class="pay-methods">
          <el-radio :label="1" class="pay-radio">
            <el-icon class="pay-icon wechat"><ChatDotRound /></el-icon> 微信支付
          </el-radio>
          <el-radio :label="2" class="pay-radio">
            <el-icon class="pay-icon alipay"><Platform /></el-icon> 支付宝
          </el-radio>
        </el-radio-group>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button class="btn-secondary" @click="pay_dialog_visible = false">稍后支付</el-button>
          <el-button class="btn-brand" :loading="pay_loading" @click="handle_pay">
            {{ pay_loading ? '处理中...' : '确认支付' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
    
    <!-- 评价弹窗 -->
    <el-dialog 
      v-model="comment_dialog_visible" 
      title="评价家教" 
      width="480px"
      class="editorial-dialog"
      destroy-on-close
    >
      <div class="dialog-subtitle">您的评价将帮助其他同学做出更好的选择。</div>
      <el-form :model="comment_form" label-position="top" class="editorial-form form-stacked">
        <el-form-item label="综合评分" required>
          <el-rate 
            v-model="comment_form.score" 
            :colors="['var(--clr-amber-warm)', 'var(--clr-amber-warm)', 'var(--clr-amber-warm)']"
            disabled-void-color="var(--clr-border-warm)"
            show-text 
            :texts="['极差', '失望', '一般', '满意', '强烈推荐']" 
            class="warm-rate"
          />
        </el-form-item>
        <el-form-item label="详细文字 (选填)">
          <el-input 
            v-model="comment_form.content" 
            type="textarea" 
            :rows="4" 
            placeholder="老师讲得怎么样？给其他同学一些参考吧..." 
            class="warm-textarea"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button class="btn-secondary" @click="comment_dialog_visible = false">取消</el-button>
          <el-button class="btn-brand" @click="submit_comment">提交评价</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '../../utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Ticket, Timer, Warning, CircleCheck, ChatDotRound, Platform } from '@element-plus/icons-vue'

const loading = ref(true)
const order_list = ref([])
const total = ref(0)
const query_params = ref({
  page_num: 1,
  page_size: 10
})

const pay_dialog_visible = ref(false)
const pay_loading = ref(false)
const pay_method = ref(1) 
const current_pay_order = ref({})

const comment_dialog_visible = ref(false)
const comment_form = ref({
  order_id: null,
  tutor_id: null,
  score: 5, 
  content: ''
})

const open_comment_dialog = (order) => {
  comment_form.value = {
    order_id: order.id,
    tutor_id: order.tutor_id,
    score: 5,
    content: ''
  }
  comment_dialog_visible.value = true
}

const submit_comment = async () => {
  if (!comment_form.value.score) {
    ElMessage.warning('请为老师打分')
    return
  }
  await request.post('/comment/add', comment_form.value)
  ElMessage.success('评价成功，感谢您的反馈！')
  comment_dialog_visible.value = false
  get_list() 
}

const get_list = async () => {
  loading.value = true
  const res = await request.get('/order/student/list', { params: query_params.value })
  order_list.value = res.data.records
  total.value = parseInt(res.data.total)
  loading.value = false
}

const open_pay_dialog = (order) => {
  current_pay_order.value = order
  pay_dialog_visible.value = true
}

const handle_pay = () => {
  pay_loading.value = true
  setTimeout(async () => {
    try {
      await request.post('/order/student/pay', null, { params: { order_id: current_pay_order.value.id } })
      ElMessage.success('支付成功！课程已开始')
      pay_dialog_visible.value = false
      get_list() 
    } catch (error) {
    } finally {
      pay_loading.value = false
    }
  }, 1500) 
}

const cancel_order = (order_id) => {
  ElMessageBox.confirm('确定要取消这个预约订单吗？', '提示', {
    confirmButtonClass: 'editorial-msgbox-btn-danger',
    cancelButtonClass: 'editorial-msgbox-btn-cancel',
    customClass: 'editorial-message-box',
  }).then(async () => {
    await request.post('/order/student/cancel', null, { params: { order_id } })
    ElMessage.success('订单已取消')
    get_list()
  }).catch(() => {})
}

const finish_order = (order_id) => {
  ElMessageBox.confirm('请确认课程是否已全部完成？操作后将为老师结算费用。', '确认完成', {
    confirmButtonClass: 'editorial-msgbox-btn-brand',
    cancelButtonClass: 'editorial-msgbox-btn-cancel',
    customClass: 'editorial-message-box',
  }).then(async () => {
    await request.post('/order/student/finish', null, { params: { order_id } })
    ElMessage.success('课程已完成，期待您的评价！')
    get_list()
  }).catch(() => {})
}

const apply_refund = (order_id) => {
  ElMessageBox.confirm('确定要为该课程申请退款吗？提交后将由家教老师处理。', '申请退款', {
    confirmButtonClass: 'editorial-msgbox-btn-warn',
    cancelButtonClass: 'editorial-msgbox-btn-cancel',
    customClass: 'editorial-message-box',
  }).then(async () => {
    await request.post('/order/student/apply_refund', null, { params: { order_id } })
    ElMessage.success('退款申请已提交')
    get_list()
  }).catch(() => {})
}

onMounted(() => { get_list() })
</script>

<style scoped>
/* ================= 美学色板与变量定义 ================= */
* {
  --clr-parchment: #f5f4ed;     
  --clr-ivory: #faf9f5;         
  --clr-white: #ffffff;
  --clr-near-black: #141413;    
  
  --clr-terracotta: #c96442;    /* 已完成/评价/主按钮 */
  --clr-coral: #d97757;         /* 进行中 */
  --clr-danger-red: #b02a2a;    /* 纠纷/警告/取消 */
  --clr-amber-warm: #d98f3e;    /* 待支付/待接单/退款中/星星打分 */
  
  --clr-olive: #5e5d59;         
  --clr-stone: #87867f;         
  --clr-charcoal: #4d4c48;      
  --clr-warm-sand: #e8e6dc;     
  --clr-border-cream: #f0eee6;  
  --clr-border-warm: #e8e6dc;   
  --clr-focus-blue: #3898ec;
  
  --font-serif: "Georgia", "Times New Roman", serif;
  --font-sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.editorial-page-container {
  font-family: var(--font-sans);
  padding-top: 8px;
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

/* ================= 表格排版 ================= */
.editorial-table {
  --el-table-border-color: var(--clr-border-cream);
  --el-table-header-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  background-color: transparent;
}
:deep(.editorial-table th.el-table__cell) {
  font-family: var(--font-serif);
  font-size: 15px;
  font-weight: 500;
  color: var(--clr-near-black);
  border-bottom: 2px solid var(--clr-border-warm);
  padding: 16px 0;
}
:deep(.editorial-table td.el-table__cell) {
  padding: 18px 0; 
  border-bottom: 1px solid var(--clr-border-cream);
  vertical-align: middle;
}
:deep(.editorial-table--enable-row-hover .el-table__body tr:hover > td.el-table__cell) {
  background-color: var(--clr-parchment);
}

/* 文本辅助类 */
:deep(.text-main) { color: var(--clr-near-black); font-size: 15px; }
:deep(.fw-500) { font-weight: 500; }
:deep(.text-olive) { color: var(--clr-olive); font-size: 14px; }
:deep(.text-stone) { color: var(--clr-stone); font-size: 13px; }
:deep(.text-monospace) { font-family: monospace; color: var(--clr-stone); font-size: 13px; letter-spacing: 0.5px; }

.empty-text { font-size: 13px; color: var(--clr-stone); font-style: italic; }

.price-text {
  font-family: monospace;
  font-size: 16px;
  font-weight: 600;
  color: var(--clr-terracotta);
}

/* 平台裁决高亮备注 */
.remark-highlight {
  display: inline-block;
  background-color: rgba(176, 42, 42, 0.05);
  color: var(--clr-danger-red);
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
  font-size: 13px;
  margin-left: 4px;
}

/* ================= 状态徽章体系 ================= */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px 4px 8px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  background: var(--clr-white);
  border: 1px solid var(--clr-border-warm);
}
.status-dot { width: 6px; height: 6px; border-radius: 50%; margin-right: 6px; }

/* 0 等待接单: 暖琥珀色 */
.status-0 { border-color: rgba(217, 143, 62, 0.3); background: rgba(217, 143, 62, 0.05); }
.status-0 .status-dot { background-color: var(--clr-amber-warm); }
.status-0 .status-text { color: var(--clr-amber-warm); }

/* 1 待支付: 暖琥珀色 */
.status-1 { border-color: rgba(217, 143, 62, 0.3); background: rgba(217, 143, 62, 0.05); }
.status-1 .status-dot { background-color: var(--clr-amber-warm); }
.status-1 .status-text { color: var(--clr-amber-warm); }

/* 2 进行中: 珊瑚色 */
.status-2 { border-color: rgba(217, 119, 87, 0.3); background: rgba(217, 119, 87, 0.05); }
.status-2 .status-dot { background-color: var(--clr-coral); box-shadow: 0 0 4px rgba(217, 119, 87, 0.4); }
.status-2 .status-text { color: var(--clr-coral); }

/* 3 已完成: 陶土红 */
.status-3 { border-color: rgba(201, 100, 66, 0.3); background: rgba(201, 100, 66, 0.05); }
.status-3 .status-dot { background-color: var(--clr-terracotta); }
.status-3 .status-text { color: var(--clr-terracotta); }

/* 4 已取消: 石板灰 */
.status-4 { border-color: var(--clr-border-warm); background: var(--clr-parchment); }
.status-4 .status-dot { background-color: var(--clr-stone); }
.status-4 .status-text { color: var(--clr-stone); }

/* 5 退款处理中: 暖琥珀色 */
.status-5 { border-color: rgba(217, 143, 62, 0.3); background: rgba(217, 143, 62, 0.05); }
.status-5 .status-dot { background-color: var(--clr-amber-warm); }
.status-5 .status-text { color: var(--clr-amber-warm); }

/* 6 纠纷处理中: 深茜红 */
.status-6 { border-color: rgba(176, 42, 42, 0.3); background: rgba(176, 42, 42, 0.05); }
.status-6 .status-dot { background-color: var(--clr-danger-red); box-shadow: 0 0 4px rgba(176, 42, 42, 0.4); }
.status-6 .status-text { color: var(--clr-danger-red); }


/* ================= 动作按钮与无按钮状态 ================= */
.action-buttons { display: flex; gap: 8px; flex-wrap: wrap; }
.btn-action {
  cursor: pointer;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

/* 支付：琥珀色高亮 */
.btn-pay { background-color: rgba(217, 143, 62, 0.1); color: var(--clr-amber-warm); }
.btn-pay:hover { background-color: rgba(217, 143, 62, 0.2); }

/* 取消/退款：中性暖沙 */
.btn-cancel, .btn-refund { background-color: var(--clr-warm-sand); color: var(--clr-charcoal); }
.btn-cancel:hover, .btn-refund:hover { background-color: var(--clr-border-warm); box-shadow: 0 0 0 1px var(--clr-ring-warm); }

/* 完成/评价：主品牌色陶土红 */
.btn-finish, .btn-comment { background-color: var(--clr-terracotta); color: var(--clr-ivory); }
.btn-finish:hover, .btn-comment:hover { opacity: 0.9; box-shadow: 0 2px 6px rgba(201, 100, 66, 0.2); }

/* 无按钮时的文本提示 */
.status-waiting { font-size: 13px; color: var(--clr-amber-warm); display: flex; align-items: center; gap: 4px; }
.status-danger { font-size: 13px; color: var(--clr-danger-red); display: flex; align-items: center; gap: 4px; }
.status-success { font-size: 13px; color: var(--clr-terracotta); display: flex; align-items: center; gap: 4px; }


/* ================= 分页器 ================= */
.pagination-wrapper { margin-top: 24px; display: flex; justify-content: flex-end; }
.editorial-pagination :deep(.el-pager li:not(.is-active)) {
  background-color: var(--clr-parchment);
  color: var(--clr-olive);
  border-radius: 6px;
}
.editorial-pagination :deep(.el-pager li.is-active) {
  background-color: var(--clr-terracotta) !important;
  color: var(--clr-ivory);
  border-radius: 6px;
}

/* ================= 弹窗定制 (收银台与评价) ================= */
:deep(.editorial-dialog) {
  border-radius: 16px;
  background-color: var(--clr-ivory);
}
:deep(.editorial-dialog .el-dialog__header) {
  padding: 32px 32px 0;
  margin-right: 0;
}
:deep(.editorial-dialog .el-dialog__title) {
  font-family: var(--font-serif);
  font-weight: 500;
  font-size: 22px;
  color: var(--clr-near-black);
}
.dialog-subtitle {
  font-size: 14px;
  color: var(--clr-olive);
  margin-top: 8px;
  margin-bottom: 24px;
  padding: 0 32px;
}
.dialog-footer { padding-top: 12px; }

/* 收银台内部 */
.pay-container { padding: 0 32px; }
.pay-amount-box {
  background-color: var(--clr-parchment);
  border: 1px solid var(--clr-border-cream);
  border-radius: 12px;
  padding: 24px;
  text-align: center;
  margin-bottom: 24px;
}
.pay-amount-box .currency { font-size: 18px; color: var(--clr-terracotta); margin-right: 4px; }
.pay-amount-box .amount { font-family: monospace; font-size: 36px; font-weight: bold; color: var(--clr-terracotta); }

.pay-methods { display: flex; flex-direction: column; gap: 12px; width: 100%; }
.pay-radio {
  margin-right: 0;
  padding: 16px;
  height: auto;
  border-radius: 8px;
  border: 1px solid var(--clr-border-warm) !important;
  background-color: var(--clr-white);
  transition: all 0.2s;
}
.pay-radio.is-checked { border-color: var(--clr-terracotta) !important; background-color: var(--clr-parchment); }
.pay-icon { font-size: 18px; margin-right: 8px; vertical-align: middle; }
.wechat { color: #10b981; }
.alipay { color: #3b82f6; }

/* 评价表单 */
.form-stacked { padding: 0 32px; }
.editorial-form :deep(.el-form-item__label) { font-weight: 500; color: var(--clr-olive); }

.warm-textarea :deep(.el-textarea__inner) {
  background-color: var(--clr-parchment);
  border: 1px solid var(--clr-border-warm);
  border-radius: 8px;
  padding: 16px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--clr-near-black);
  box-shadow: none !important;
}
.warm-textarea :deep(.el-textarea__inner:focus) { background-color: var(--clr-white); box-shadow: 0 0 0 1px var(--clr-focus-blue) !important; }
.warm-rate :deep(.el-rate__text) { font-size: 14px; margin-left: 8px; color: var(--clr-olive) !important; }

/* 弹窗按钮 */
.btn-brand {
  background: var(--clr-terracotta) !important;
  color: var(--clr-ivory) !important;
  border: none; border-radius: 8px; padding: 8px 20px; font-weight: 500;
  box-shadow: var(--clr-terracotta) 0px 0px 0px 0px, var(--clr-terracotta) 0px 0px 0px 1px;
}
.btn-secondary {
  background: var(--clr-warm-sand) !important;
  color: var(--clr-charcoal) !important;
  border: none; border-radius: 8px; padding: 8px 20px;
}

/* 全局 MessageBox */
:global(.editorial-message-box) {
  border-radius: 12px !important;
  background-color: #faf9f5 !important;
  border: 1px solid #e8e6dc !important;
}
:global(.editorial-msgbox-btn-brand) { background-color: #c96442 !important; border: none !important; }
:global(.editorial-msgbox-btn-danger) { background-color: #b02a2a !important; border: none !important; }
:global(.editorial-msgbox-btn-warn) { background-color: #d98f3e !important; border: none !important; }
:global(.editorial-msgbox-btn-cancel) { background-color: #e8e6dc !important; color: #4d4c48 !important; border: none !important; }


</style>