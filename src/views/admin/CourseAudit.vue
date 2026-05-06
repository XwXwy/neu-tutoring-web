<template>
  <div class="editorial-page-container">
    <el-card shadow="never" class="editorial-card">
      <template #header>
        <div class="card-header">
          <span class="header-title">课程上架审核申请</span>
        </div>
      </template>

      <el-table 
        :data="audit_list" 
        v-loading="loading" 
        style="width: 100%"
        class="editorial-table"
      >
        <el-table-column prop="title" label="课程标题" min-width="220" show-overflow-tooltip class-name="text-main fw-500" />
        
        <el-table-column prop="real_name" label="发布家教" width="120" class-name="text-main" />
        
        <el-table-column prop="category_name" label="科目" width="120">
          <template #default="scope">
            <span class="category-tag">{{ scope.row.category_name }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="price" label="价格(元/课时)" width="140">
          <template #default="scope">
            <span class="price-text">¥ {{ scope.row.price }}</span>
          </template>
        </el-table-column>
        
        <!-- 封面图相框质感 -->
        <el-table-column label="课程封面" width="120">
          <template #default="scope">
            <div class="cover-wrapper" v-if="scope.row.cover_image">
              <el-image
                class="cover-image"
                :src="scope.row.cover_image"
                :preview-src-list="[scope.row.cover_image]"
                preview-teleported
                fit="cover"
              />
            </div>
            <span v-else class="empty-text">无封面</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="description" label="课程介绍" min-width="250" show-overflow-tooltip class-name="text-olive" />
        
        <!-- 实体化操作按钮 -->
        <el-table-column label="审核操作" width="180" fixed="right">
          <template #default="scope">
            <div class="action-buttons">
              <button class="btn-action btn-approve" @click="handle_audit(scope.row, 1)">通过</button>
              <button class="btn-action btn-reject" @click="handle_audit(scope.row, 0)">驳回</button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页组件 -->
      <div class="pagination-wrapper">
        <el-pagination
          class="editorial-pagination"
          background
          layout="total, sizes, prev, pager, next"
          :total="total"
          v-model:current-page="query_params.page_num"
          v-model:page-size="query_params.page_size"
          @current-change="get_list"
          @size-change="get_list"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onActivated } from 'vue'
import request from '../../utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(true)
const audit_list = ref([])
const total = ref(0)
const query_params = ref({
  page_num: 1,
  page_size: 10
})

const get_list = async () => {
  loading.value = true
  const res = await request.get('/course/admin/audit/list', { params: query_params.value })
  audit_list.value = res.data.records
  total.value = parseInt(res.data.total)
  loading.value = false
}

const handle_audit = (row, status) => {
  const action_text = status === 1 ? '通过' : '驳回'
  const isApprove = status === 1
  
  ElMessageBox.confirm(
    `确定要 ${action_text} 课程【${row.title}】的发布申请吗？`, 
    '审核确认',
    {
      confirmButtonText: `确认${action_text}`,
      cancelButtonText: '取消',
      confirmButtonClass: isApprove ? 'editorial-msgbox-btn-brand' : 'editorial-msgbox-btn-danger',
      cancelButtonClass: 'editorial-msgbox-btn-cancel',
      customClass: 'editorial-message-box',
    }
  ).then(async () => {
    await request.post('/course/admin/audit/handle', null, {
      params: { course_id: row.id, status }
    })
    ElMessage.success(`已${action_text}该课程`)
    get_list()
  }).catch(() => {})
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
  
  /* 高区分度色彩体系 */
  --clr-terracotta: #c96442;    /* 陶土红 (通过/放行) */
  --clr-danger-red: #b02a2a;    /* 深茜红 (驳回/危险) */
  
  --clr-olive: #5e5d59;         /* 橄榄灰 (次级文本/介绍) */
  --clr-stone: #87867f;         /* 石板灰 (空状态文本) */
  --clr-charcoal: #4d4c48;      /* 木炭灰 */
  --clr-warm-sand: #e8e6dc;     /* 暖沙色 (空底色) */
  --clr-border-cream: #f0eee6;  /* 柔和边框 */
  --clr-border-warm: #e8e6dc;   /* 加深边框 */
  --clr-ring-warm: #d1cfc5;     /* 交互光环 */
  
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
}

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
  padding: 16px 0; 
  border-bottom: 1px solid var(--clr-border-cream);
  vertical-align: middle;
}
:deep(.editorial-table--enable-row-hover .el-table__body tr:hover > td.el-table__cell) {
  background-color: var(--clr-parchment);
}

/* 文本辅助类 */
:deep(.text-main) { color: var(--clr-near-black); font-size: 15px; }
:deep(.fw-500) { font-weight: 500; font-family: var(--font-serif); }
:deep(.text-olive) { color: var(--clr-olive); font-size: 14px; line-height: 1.5; }

.price-text {
  font-family: monospace;
  font-size: 16px;
  color: var(--clr-near-black);
  font-weight: 500;
}

.category-tag {
  display: inline-block;
  padding: 4px 10px;
  background-color: var(--clr-border-cream);
  color: var(--clr-charcoal);
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}

/* ================= 封面图片预览 (相框质感) ================= */
.cover-wrapper {
  display: inline-block;
  padding: 4px;
  background-color: var(--clr-white);
  border: 1px solid var(--clr-border-warm);
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.03);
  transition: all 0.2s;
}
.cover-wrapper:hover {
  box-shadow: 0 0 0 1px var(--clr-ring-warm);
  transform: translateY(-1px);
}
.cover-image {
  width: 64px;
  height: 64px;
  border-radius: 4px;
  display: block;
}

/* 空状态文本 */
.empty-text {
  display: inline-block;
  padding: 4px 8px;
  background-color: var(--clr-warm-sand);
  border-radius: 6px;
  font-size: 12px;
  color: var(--clr-stone);
  font-style: italic;
}

/* ================= 操作按钮实体化 ================= */
.action-buttons { 
  display: flex; 
  gap: 8px; 
}
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

/* 通过按钮：陶土红底，代表肯定/发布 */
.btn-approve {
  background-color: var(--clr-terracotta);
  color: var(--clr-ivory);
}
.btn-approve:hover {
  opacity: 0.9;
  box-shadow: 0 2px 6px rgba(201, 100, 66, 0.2);
}

/* 驳回按钮：深茜红底透明，代表否决 */
.btn-reject {
  background-color: rgba(176, 42, 42, 0.08);
  color: var(--clr-danger-red);
}
.btn-reject:hover {
  background-color: rgba(176, 42, 42, 0.15);
  box-shadow: 0 0 0 1px rgba(176, 42, 42, 0.2);
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

/* ================= 全局反馈框重塑 ================= */
:global(.editorial-message-box) {
  border-radius: 12px !important;
  background-color: #faf9f5 !important;
  border: 1px solid #e8e6dc !important;
}
/* 品牌确认色 (陶土红) */
:global(.editorial-msgbox-btn-brand) {
  background-color: #c96442 !important; 
  border: none !important;
}
/* 危险确认色 (深茜红) */
:global(.editorial-msgbox-btn-danger) {
  background-color: #b02a2a !important; 
  border: none !important;
}
:global(.editorial-msgbox-btn-cancel) {
  background-color: #e8e6dc !important;
  color: #4d4c48 !important;
  border: none !important;
}
</style>