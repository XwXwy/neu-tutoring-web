<template>
  <div class="editorial-page-container">
    <el-card shadow="never" class="editorial-card">
      <template #header>
        <div class="card-header">
          <span class="header-title dispute-title">
            <el-icon class="title-icon"><Warning /></el-icon> 
            待处理的订单纠纷
          </span>
        </div>
      </template>

      <el-table 
        :data="dispute_list" 
        v-loading="loading" 
        style="width: 100%"
        class="editorial-table"
      >
        <el-table-column prop="order_no" label="订单号" width="180" class-name="text-monospace" />
        <el-table-column prop="course_name" label="课程名称" width="180" show-overflow-tooltip class-name="text-main fw-500" />
        
        <el-table-column label="涉事双方" width="220">
          <template #default="scope">
            <div class="parties-box">
              <div class="party-row">
                <span class="party-label">学生</span>
                <div class="party-details">
                  <span class="party-name">{{ scope.row.student_name }}</span>
                  <span class="party-phone">{{ scope.row.student_phone }}</span>
                </div>
              </div>
              <div class="party-row">
                <span class="party-label">老师</span>
                <div class="party-details">
                  <span class="party-name">{{ scope.row.tutor_name }}</span>
                  <span class="party-phone">{{ scope.row.tutor_phone }}</span>
                </div>
              </div>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="涉及金额">
          <template #default="scope">
            <span class="dispute-amount">¥ {{ scope.row.price }}</span>
          </template>
        </el-table-column>
        
        <!-- 重构拒绝理由展示 -->
        <el-table-column label="家教拒绝退款理由" min-width="280">
          <template #default="scope">
            <div class="reason-box">
              <p class="reason-text">{{ scope.row.dispute_reason }}</p>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="仲裁操作" width="260" fixed="right">
          <template #default="scope">
            <div class="action-buttons">
              <button class="btn-action btn-resolve-student" @click="handle_resolve(scope.row, 1)">判给学生(退款)</button>
              <button class="btn-action btn-reject" @click="handle_resolve(scope.row, 2)">判给老师(打款)</button>
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
import { Warning } from '@element-plus/icons-vue'

const loading = ref(true)
const dispute_list = ref([])
const total = ref(0)
const query_params = ref({
  page_num: 1,
  page_size: 10
})

const get_list = async () => {
  loading.value = true
  const res = await request.get('/order/admin/dispute_list', { params: query_params.value })
  dispute_list.value = res.data.records
  total.value = parseInt(res.data.total)
  loading.value = false
}

const handle_resolve = (order, resolve_type) => {
  const resolve_text = resolve_type === 1 ? '判给学生（全额退款）' : '判给老师（完成结算）'
  const confirm_text = resolve_type === 1 
    ? '此操作将使订单取消，资金原路退回学生账户。' 
    : '此操作将使订单完成，并将课程费用结算给家教老师。'
  const isStudentWin = resolve_type === 1

  ElMessageBox.confirm(
    `你正在对订单【${order.order_no}】进行裁决，裁决结果为：<strong style="color: ${isStudentWin ? '#141413' : '#b02a2a'};">${resolve_text}</strong>。<br/><br/>${confirm_text}<br/><br/>此操作不可逆，请确认！`,
    '最终裁决警告',
    {
      dangerouslyUseHTMLString: true, 
      confirmButtonText: '我确认裁决',
      cancelButtonText: '再想想',
      // 根据裁决结果动态赋予不同的按钮颜色
      confirmButtonClass: isStudentWin ? 'editorial-msgbox-btn-neutral' : 'editorial-msgbox-btn-danger',
      cancelButtonClass: 'editorial-msgbox-btn-cancel',
      customClass: 'editorial-message-box',
    }
  ).then(async () => {
    await request.post('/order/admin/resolve_dispute', null, {
      params: { order_id: order.id, resolve_type }
    })
    ElMessage.success('裁决已执行！')
    get_list() 
  }).catch(() => {
    ElMessage.info('已取消裁决操作')
  })
}

onMounted(() => {
  get_list()
})
</script>

<style scoped>
/* ================= 美学色板与变量定义 ================= */
* {
  --clr-parchment: #f5f4ed;     /* 羊皮纸底色 */
  --clr-ivory: #faf9f5;         /* 卡片象牙白 */
  --clr-white: #ffffff;
  --clr-near-black: #141413;    /* 墨黑主文本/暗场背景 */
  
  /* 高区分度色彩体系 */
  --clr-terracotta: #c96442;    /* 陶土红 */
  --clr-danger-red: #b02a2a;    /* 深茜红 (驳回/危险) */
  --clr-amber-warm: #d98f3e;    /* 暖琥珀 */
  
  --clr-olive: #5e5d59;         /* 橄榄灰 (次级文本) */
  --clr-stone: #87867f;         /* 石板灰 (辅助文本) */
  --clr-charcoal: #4d4c48;      /* 木炭灰 (中性按钮) */
  --clr-warm-sand: #e8e6dc;     /* 暖沙色 */
  --clr-border-cream: #f0eee6;  /* 柔和边框 */
  --clr-border-warm: #e8e6dc;   /* 加深边框 */
  
  --font-serif: "Georgia", "Times New Roman", serif;
  --font-sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.editorial-page-container {
  font-family: var(--font-sans);
  padding-top: 8px;
}

/* ================= 柔和卡片与头部系统 ================= */
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
  display: flex;
  align-items: center;
}
/* 纠纷标题应用深茜红 */
.dispute-title { color: var(--clr-danger-red); }
.title-icon { margin-right: 8px; font-size: 20px; }

/* ================= 表格重塑 ================= */
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
  vertical-align: top;
}
:deep(.editorial-table--enable-row-hover .el-table__body tr:hover > td.el-table__cell) {
  background-color: var(--clr-parchment);
}

:deep(.text-main) { color: var(--clr-near-black); }
:deep(.fw-500) { font-weight: 500; font-family: var(--font-serif); font-size: 15px; }
:deep(.text-monospace) { font-family: monospace; color: var(--clr-stone); font-size: 14px; }

/* 涉事双方信息区块 */
.parties-box { display: flex; flex-direction: column; gap: 8px; }
.party-row { display: flex; align-items: baseline; }
.party-label { color: var(--clr-stone); margin-right: 8px; width: 40px; font-size: 13px; }
.party-details { display: flex; flex-direction: column; }
.party-name { font-weight: 500; color: var(--clr-near-black); font-size: 14px; }
.party-phone { color: var(--clr-olive); font-size: 13px; font-family: monospace; margin-top: 2px; }

/* 涉案金额 */
.dispute-amount {
  font-family: monospace;
  font-size: 18px;
  font-weight: 500;
  color: var(--clr-danger-red);
}

/* 拒绝理由框 */
.reason-box {
  background-color: rgba(176, 42, 42, 0.04);
  border: 1px solid rgba(176, 42, 42, 0.2);
  border-radius: 8px;
  padding: 16px;
}
.reason-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--clr-near-black);
}

/* ================= 仲裁操作按钮 ================= */
.action-buttons { 
  display: flex; 
  gap: 8px; 
}
.btn-action {
  cursor: pointer;
  border-radius: 6px;
  padding: 8px 14px; /* 加大按钮，操作更明确 */
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

/* 判给学生：中性、严肃的墨黑色 */
.btn-resolve-student {
  background-color: var(--clr-near-black);
  color: var(--clr-ivory);
}
.btn-resolve-student:hover { background-color: var(--clr-charcoal); }

/* 判给老师：警示性的深茜红 */
.btn-reject {
  background-color: var(--clr-danger-red);
  color: var(--clr-ivory);
}
.btn-reject:hover { 
  opacity: 0.9;
  box-shadow: 0 2px 6px rgba(176, 42, 42, 0.25);
}

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

/* ================= 全局 MessageBox 重塑 ================= */
:global(.editorial-message-box) {
  border-radius: 12px !important;
  background-color: #faf9f5 !important;
  border: 1px solid #e8e6dc !important;
}
:global(.editorial-msgbox-btn-danger) {
  background-color: #b02a2a !important; /* 判给老师（驳回学生） */
  border: none !important;
}
:global(.editorial-msgbox-btn-neutral) {
  background-color: #141413 !important; /* 判给学生（中性裁决） */
  border: none !important;
}
:global(.editorial-msgbox-btn-cancel) {
  background-color: #e8e6dc !important;
  color: #4d4c48 !important;
  border: none !important;
}
</style>