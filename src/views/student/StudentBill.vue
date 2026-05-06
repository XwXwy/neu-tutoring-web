<template>
  <div class="editorial-page-container">
    <el-card shadow="never" class="editorial-card">
      <template #header>
        <div class="card-header">
          <span class="header-title">
            <el-icon class="title-icon"><List /></el-icon> 
            费用支出明细
          </span>
        </div>
      </template>

      <!-- 移除了 stripe 斑马纹，依靠充裕的留白和细边框区隔 -->
      <el-table 
        :data="bill_list" 
        v-loading="loading" 
        style="width: 100%"
        class="editorial-table"
      >
        <el-table-column prop="order_no" label="交易流水号" width="220" class-name="text-monospace" />
        
        <el-table-column prop="course_name" label="购买课程" min-width="200" show-overflow-tooltip class-name="text-main fw-500" />
        
        <el-table-column prop="tutor_name" label="收款方 (家教)" width="140" class-name="text-olive" />
        
        <el-table-column prop="pay_time" label="支付时间" width="180" class-name="text-stone" />
        
        <!-- 重塑状态徽章 -->
        <el-table-column prop="status" label="当前状态" width="140">
          <template #default="scope">
            <div class="status-badge" :class="'status-' + scope.row.status">
              <span class="status-dot"></span>
              <span class="status-text">
                {{ 
                  scope.row.status === 2 ? '进行中' : 
                  scope.row.status === 3 ? '已完成' : 
                  scope.row.status === 4 ? '已退款' : 
                  scope.row.status === 5 ? '退款处理中' : 
                  scope.row.status === 6 ? '退款纠纷中' : '未知状态'
                }}
              </span>
            </div>
          </template>
        </el-table-column>

        <!-- 账单金额：等宽字体排版 -->
        <el-table-column prop="price" label="实付金额 (元)" width="160" align="right" fixed="right">
          <template #default="scope">
            <div class="amount-box" :class="{ 'is-refunded': scope.row.status === 4 }">
              <span class="amount-symbol">- ¥</span>
              <span class="amount-num">{{ scope.row.price }}</span>
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
  </div>
</template>

<script setup>
import { ref, onActivated } from 'vue'
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

onActivated(() => {
  get_list()
})
</script>

<style scoped>
/* ================= 美学色板与变量定义 ================= */
* {
  --clr-parchment: #f5f4ed;     /* 羊皮纸底色 */
  --clr-ivory: #faf9f5;         /* 卡片象牙白 */
  --clr-white: #ffffff;
  --clr-near-black: #141413;    /* 墨黑主文本 */
  
  --clr-terracotta: #c96442;    /* 陶土红 (已完成/金额支出) */
  --clr-coral: #d97757;         /* 珊瑚色 (进行中) */
  --clr-danger-red: #b02a2a;    /* 深茜红 (纠纷警示) */
  --clr-amber-warm: #d98f3e;    /* 暖琥珀 (处理中) */
  
  --clr-olive: #5e5d59;         /* 橄榄灰 (次级文本) */
  --clr-stone: #87867f;         /* 石板灰 (辅助文本/已退款) */
  --clr-charcoal: #4d4c48;      /* 木炭灰 */
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
  color: var(--clr-near-black);
  display: flex;
  align-items: center;
}
.title-icon { margin-right: 8px; font-size: 20px; color: var(--clr-stone); }

/* ================= 表格重塑 (财务报表排版) ================= */
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
  padding: 18px 0; /* 加宽行高，增加呼吸感 */
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
/* 交易流水号/时间 使用等宽字体，更显严谨 */
:deep(.text-monospace) { font-family: monospace; color: var(--clr-stone); font-size: 13px; letter-spacing: 0.5px; }
:deep(.text-stone) { color: var(--clr-stone); font-size: 13px; }

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

/* 2 进行中: 珊瑚色 */
.status-2 { border-color: rgba(217, 119, 87, 0.3); background: rgba(217, 119, 87, 0.05); }
.status-2 .status-dot { background-color: var(--clr-coral); }
.status-2 .status-text { color: var(--clr-coral); }

/* 3 已完成: 陶土红 (最正向的状态) */
.status-3 { border-color: rgba(201, 100, 66, 0.3); background: rgba(201, 100, 66, 0.05); }
.status-3 .status-dot { background-color: var(--clr-terracotta); box-shadow: 0 0 4px rgba(201, 100, 66, 0.4); }
.status-3 .status-text { color: var(--clr-terracotta); }

/* 4 已退款: 石板灰 (交易失效) */
.status-4 { border-color: var(--clr-border-warm); background: var(--clr-parchment); }
.status-4 .status-dot { background-color: var(--clr-stone); }
.status-4 .status-text { color: var(--clr-stone); }

/* 5 退款处理中: 暖琥珀色 (需等待) */
.status-5 { border-color: rgba(217, 143, 62, 0.3); background: rgba(217, 143, 62, 0.05); }
.status-5 .status-dot { background-color: var(--clr-amber-warm); }
.status-5 .status-text { color: var(--clr-amber-warm); }

/* 6 退款纠纷中: 深茜红 (高风险) */
.status-6 { border-color: rgba(176, 42, 42, 0.3); background: rgba(176, 42, 42, 0.05); }
.status-6 .status-dot { background-color: var(--clr-danger-red); box-shadow: 0 0 4px rgba(176, 42, 42, 0.4); }
.status-6 .status-text { color: var(--clr-danger-red); }

/* ================= 账单金额排版 ================= */
.amount-box {
  font-family: monospace;
  font-size: 16px;
  font-weight: 600;
  color: var(--clr-terracotta); /* 正常支出金额使用沉稳的陶土红 */
  display: flex;
  justify-content: flex-end;
  align-items: baseline;
}
.amount-symbol {
  font-size: 14px;
  margin-right: 4px;
}
.amount-num {
  letter-spacing: 0.5px;
}

/* 已退款的金额样式：灰色 + 删除线 */
.amount-box.is-refunded {
  color: var(--clr-stone);
  text-decoration: line-through;
  font-weight: 500;
  opacity: 0.7;
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
</style>