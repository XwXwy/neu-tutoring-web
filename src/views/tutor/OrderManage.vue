<template>
  <div class="editorial-page-container">
    <el-card shadow="never" class="editorial-card">
      <template #header>
        <div class="card-header">
          <span class="header-title">
            <el-icon class="title-icon"><List /></el-icon> 订单接单管理
          </span>
        </div>
      </template>

      <el-table 
        :data="order_list" 
        v-loading="loading" 
        style="width: 100%"
        class="editorial-table"
      >
        <el-table-column prop="order_no" label="订单流水号" width="170" class-name="text-monospace" />
        <el-table-column prop="course_name" label="预约课程" min-width="180" show-overflow-tooltip class-name="text-main fw-500" />
        
        <el-table-column label="学生信息" width="120">
          <template #default="scope">
            <div class="user-info">
              <div class="user-name">{{ scope.row.student_name }}</div>
              <div class="user-phone">{{ scope.row.student_phone }}</div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="appoint_time" label="预约时间" width="100" class-name="text-stone" />
        
        <el-table-column prop="price" label="订单金额" width="90">
          <template #default="scope">
            <span class="price-text">¥ {{ scope.row.price }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="pay_time" label="支付时间" width="100">
          <template #default="scope">
            <span :class="scope.row.pay_time ? 'text-stone' : 'empty-text'">
              {{ scope.row.pay_time || '尚未支付' }}
            </span>
          </template>
        </el-table-column>
		
        <!-- 备注与平台处理结果 -->
        <el-table-column label="备注与处理结果" min-width="200" show-overflow-tooltip>
          <template #default="scope">
            <div v-if="scope.row.remark && scope.row.remark.includes('【平台裁决')">
              <span class="text-olive">{{ scope.row.remark.split('【平台裁决')[0] }}</span>
              <span class="remark-highlight">【平台裁决{{ scope.row.remark.split('【平台裁决')[1] }}</span>
            </div>
            <span v-else class="text-olive">{{ scope.row.remark || '暂无备注' }}</span>
          </template>
        </el-table-column>
		
        <!-- 订单状态 -->
        <el-table-column prop="status" label="订单状态" width="100">
          <template #default="scope">
            <div class="status-badge" :class="'status-' + scope.row.status">
              <span class="status-dot"></span>
              <span class="status-text">
                {{ 
                  scope.row.status === 0 ? '待确认' : 
                  scope.row.status === 1 ? '待支付' : 
                  scope.row.status === 2 ? '进行中' : 
                  scope.row.status === 3 ? '已完成' : 
                  scope.row.status === 4 ? '已取消' : 
                  scope.row.status === 5 ? '退款申请中' : 
                  scope.row.status === 6 ? '平台纠纷中' : '未知'
                }}
              </span>
            </div>
          </template>
        </el-table-column>
        
        <!-- 操作栏实体化 -->
        <el-table-column label="订单操作" width="200" fixed="right">
          <template #default="scope">
            <div class="action-buttons">
              <!-- 待确认 -->
              <template v-if="scope.row.status === 0">
                <button class="btn-action btn-accept" @click="handle_order(scope.row.id, 1)">接单</button>
                <button class="btn-action btn-reject" @click="handle_order(scope.row.id, -1)">拒单</button>
              </template>
              
              <!-- 待支付 -->
              <template v-else-if="scope.row.status === 1">
                <button class="btn-action btn-cancel" @click="handle_order(scope.row.id, -1)">取消订单</button>
              </template>
              
              <!-- 退款中 -->
              <template v-else-if="scope.row.status === 5">
                <button class="btn-action btn-accept" @click="handle_refund(scope.row.id, 1)">同意退款</button>
                <button class="btn-action btn-reject" @click="open_refuse_dialog(scope.row.id)">拒绝退款</button>
              </template>
              
              <!-- 纠纷中 -->
              <template v-else-if="scope.row.status === 6">
                <span class="status-waiting"><el-icon><Warning /></el-icon> 平台裁决中</span>
              </template>
              
              <!-- 其他无操作状态 -->
              <template v-else>
                <span class="empty-dash">---</span>
              </template>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- ================= 拒绝退款弹窗 ================= -->
    <el-dialog 
      v-model="refuse_dialog_visible" 
      title="填写拒绝退款理由" 
      width="440px"
      class="editorial-dialog"
      destroy-on-close
    >
      <div class="dialog-subtitle danger-subtitle">
        拒绝退款后，订单将交由平台管理员强制介入进行最终裁决。
      </div>
      <el-form label-position="top" class="editorial-form form-stacked">
        <el-form-item label="拒绝理由 (必填)" required>
          <el-input 
            v-model="refuse_reason" 
            type="textarea" 
            :rows="4" 
            placeholder="请详细说明您的教学情况及拒绝退款的理由，此信息将作为平台的裁判依据..." 
            class="warm-textarea"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button class="btn-secondary" @click="refuse_dialog_visible = false">取消</el-button>
          <el-button class="btn-danger" @click="submit_refuse">拒绝并交由平台裁决</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '../../utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'
import { List, Warning } from '@element-plus/icons-vue'

const loading = ref(true)
const order_list = ref([])
const refuse_dialog_visible = ref(false)
const refuse_reason = ref('')
const current_refund_order_id = ref(null)

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
    ElMessage.success('操作已完成')
    get_list() 
  } catch(error) {}
}

const handle_refund = (order_id, is_agree) => {
  ElMessageBox.confirm(
    '确定同意该退款申请吗？同意后订单将取消，资金全额退回给学生。', 
    '退款确认', 
    {
      confirmButtonText: '同意退款',
      cancelButtonText: '取消',
      confirmButtonClass: 'editorial-msgbox-btn-brand',
      cancelButtonClass: 'editorial-msgbox-btn-cancel',
      customClass: 'editorial-message-box',
    }
  ).then(async () => {
    await request.post('/order/tutor/handle_refund', null, {
      params: { order_id, is_agree: 1 }
    })
    ElMessage.success('已同意退款，订单已关闭')
    get_list()
  }).catch(() => {})
}

const open_refuse_dialog = (order_id) => {
  current_refund_order_id.value = order_id
  refuse_reason.value = ''
  refuse_dialog_visible.value = true
}

const submit_refuse = async () => {
  if (!refuse_reason.value.trim()) {
    ElMessage.warning('请填写拒绝理由，作为平台裁决依据')
    return
  }
  await request.post('/order/tutor/handle_refund', null, {
    params: { order_id: current_refund_order_id.value, is_agree: 0, reason: refuse_reason.value }
  })
  ElMessage.success('已拒绝退款，等待平台管理员介入裁决')
  refuse_dialog_visible.value = false
  get_list()
}

onMounted(() => {
  get_list()
})
</script>

<style scoped>
/* ================= 美学色板与变量定义 ================= */
* {
  --clr-parchment: #f5f4ed;     
  --clr-ivory: #faf9f5;         
  --clr-white: #ffffff;
  --clr-near-black: #141413;    
  
  --clr-terracotta: #c96442;    /* 进行中/完成/接单/同意 */
  --clr-danger-red: #b02a2a;    /* 拒单/拒绝退款/纠纷 */
  --clr-amber-warm: #d98f3e;    /* 待确认/待支付/退款中 */
  
  --clr-olive: #5e5d59;         
  --clr-stone: #87867f;         
  --clr-charcoal: #4d4c48;      
  
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

/* ================= 柔和卡片与表头 ================= */
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
:deep(.editorial-table th.el-table__cell) { font-family: var(--font-serif); font-size: 15px; font-weight: 500; color: var(--clr-near-black); border-bottom: 2px solid var(--clr-border-warm); padding: 16px 0; }
:deep(.editorial-table td.el-table__cell) { padding: 18px 0; border-bottom: 1px solid var(--clr-border-cream); vertical-align: middle; }
:deep(.editorial-table--enable-row-hover .el-table__body tr:hover > td.el-table__cell) { background-color: var(--clr-parchment); }

/* 文本辅助类 */
:deep(.text-main) { color: var(--clr-near-black); font-size: 15px; }
:deep(.fw-500) { font-weight: 500; }
:deep(.text-olive) { color: var(--clr-olive); font-size: 14px; }
:deep(.text-stone) { color: var(--clr-stone); font-size: 13px; }
:deep(.text-monospace) { font-family: monospace; color: var(--clr-stone); font-size: 13px; letter-spacing: 0.5px; }

.empty-text { font-size: 13px; color: var(--clr-stone); font-style: italic; }
.empty-dash { color: var(--clr-border-warm); font-weight: 300; padding-left: 8px; }

.price-text {
  font-family: monospace;
  font-size: 16px;
  font-weight: 600;
  color: var(--clr-terracotta);
}

.user-info { display: flex; flex-direction: column; }
.user-name { color: var(--clr-near-black); font-weight: 500; font-size: 14px; margin-bottom: 2px; }
.user-phone { color: var(--clr-olive); font-size: 12px; font-family: monospace; }

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

/* 0 待确认 / 1 待支付 / 5 退款中: 暖琥珀色 */
.status-0, .status-1, .status-5 { border-color: rgba(217, 143, 62, 0.3); background: rgba(217, 143, 62, 0.05); }
.status-0 .status-dot, .status-1 .status-dot, .status-5 .status-dot { background-color: var(--clr-amber-warm); }
.status-0 .status-text, .status-1 .status-text, .status-5 .status-text { color: var(--clr-amber-warm); }

/* 2 进行中 / 3 已完成: 陶土红 */
.status-2, .status-3 { border-color: rgba(201, 100, 66, 0.3); background: rgba(201, 100, 66, 0.05); }
.status-2 .status-dot, .status-3 .status-dot { background-color: var(--clr-terracotta); }
.status-2 .status-text, .status-3 .status-text { color: var(--clr-terracotta); }

/* 4 已取消: 石板灰 */
.status-4 { border-color: var(--clr-border-warm); background: var(--clr-parchment); }
.status-4 .status-dot { background-color: var(--clr-stone); }
.status-4 .status-text { color: var(--clr-stone); }

/* 6 纠纷中: 深茜红 */
.status-6 { border-color: rgba(176, 42, 42, 0.3); background: rgba(176, 42, 42, 0.05); }
.status-6 .status-dot { background-color: var(--clr-danger-red); box-shadow: 0 0 4px rgba(176, 42, 42, 0.4); }
.status-6 .status-text { color: var(--clr-danger-red); }

/* ================= 操作按钮 ================= */
.action-buttons { display: flex; gap: 8px; flex-wrap: wrap; }
.btn-action {
  cursor: pointer;
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

/* 接受/同意/放行：陶土红 */
.btn-accept { background-color: var(--clr-terracotta); color: var(--clr-ivory); }
.btn-accept:hover { opacity: 0.9; box-shadow: 0 2px 6px rgba(201, 100, 66, 0.2); }

/* 拒绝/驳回/危险：深茜红透明底 */
.btn-reject { background-color: rgba(176, 42, 42, 0.08); color: var(--clr-danger-red); }
.btn-reject:hover { background-color: rgba(176, 42, 42, 0.15); box-shadow: 0 0 0 1px rgba(176, 42, 42, 0.2); }

/* 取消：中性暖沙 */
.btn-cancel { background-color: var(--clr-warm-sand); color: var(--clr-charcoal); }
.btn-cancel:hover { background-color: var(--clr-border-warm); box-shadow: 0 0 0 1px var(--clr-ring-warm); }

/* 提示文本 */
.status-waiting { font-size: 13px; color: var(--clr-danger-red); display: flex; align-items: center; gap: 4px; padding-left: 4px; opacity: 0.8; }

/* ================= 拒绝退款弹窗 ================= */
:deep(.editorial-dialog) { border-radius: 16px; background-color: var(--clr-ivory); }
:deep(.editorial-dialog .el-dialog__header) { padding: 32px 32px 0; margin-right: 0; }
:deep(.editorial-dialog .el-dialog__title) { font-family: var(--font-serif); font-weight: 500; font-size: 22px; color: var(--clr-near-black); }
:deep(.editorial-dialog .el-dialog__body) { padding: 24px 32px; }

.dialog-subtitle { font-size: 14px; color: var(--clr-olive); margin-top: -16px; margin-bottom: 24px; line-height: 1.5; }
.danger-subtitle { color: var(--clr-danger-red); background-color: rgba(176, 42, 42, 0.05); padding: 8px 12px; border-radius: 6px; margin-top: -12px;}

.editorial-form :deep(.el-form-item__label) { font-weight: 500; color: var(--clr-olive); }
.warm-textarea :deep(.el-textarea__inner) { background-color: var(--clr-parchment); border: 1px solid var(--clr-border-warm); border-radius: 8px; padding: 12px; font-size: 14px; color: var(--clr-near-black); box-shadow: none !important; }
.warm-textarea :deep(.el-textarea__inner:focus) { background-color: var(--clr-white); box-shadow: 0 0 0 1px var(--clr-focus-blue) !important; }

.dialog-footer { padding-top: 12px; display: flex; justify-content: flex-end; gap: 12px; }
.btn-danger { background: var(--clr-danger-red) !important; color: var(--clr-ivory) !important; border: none; border-radius: 8px; padding: 8px 20px; font-weight: 500; }
.btn-secondary { background: var(--clr-warm-sand) !important; color: var(--clr-charcoal) !important; border: none; border-radius: 8px; padding: 8px 20px; }

/* 全局 MessageBox */
:global(.editorial-message-box) { border-radius: 12px !important; background-color: #faf9f5 !important; border: 1px solid #e8e6dc !important; }
:global(.editorial-msgbox-btn-brand) { background-color: #c96442 !important; border: none !important; }
:global(.editorial-msgbox-btn-cancel) { background-color: #e8e6dc !important; color: #4d4c48 !important; border: none !important; }
</style>