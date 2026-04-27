<template>
  <div class="editorial-page-container">
    <el-card shadow="never" class="editorial-card">
      <template #header>
        <div class="card-header">
          <span class="header-title">
            <el-icon class="title-icon"><Filter /></el-icon> 全站评价管理中心
          </span>
          
          <!-- 核心过滤开关：重塑为柔和的分段控制器 -->
          <el-radio-group v-model="query_params.is_reported" @change="handle_filter_change" class="editorial-radio-group">
            <el-radio-button :label="0">全部评价</el-radio-button>
            <el-radio-button :label="1" class="danger-radio">
              <span class="danger-dot"></span>仅看被举报
            </el-radio-button>
          </el-radio-group>
        </div>
      </template>

      <el-table 
        :data="comment_list" 
        v-loading="loading" 
        style="width: 100%"
        class="editorial-table"
      >
        <el-table-column prop="content" label="评价内容" min-width="280">
          <template #default="scope">
            <div class="content-text">{{ scope.row.content }}</div>
          </template>
        </el-table-column>
        
        <el-table-column prop="score" label="打分" width="140">
          <template #default="scope">
            <!-- 使用暖琥珀色替代刺眼的明黄色 -->
            <el-rate 
              v-model="scope.row.score" 
              disabled 
              :colors="['var(--clr-amber-warm)', 'var(--clr-amber-warm)', 'var(--clr-amber-warm)']"
              disabled-void-color="var(--clr-border-warm)"
            />
          </template>
        </el-table-column>
        
        <el-table-column label="关联信息" width="200">
          <template #default="scope">
            <div class="relation-box">
              <div class="relation-row">
                <span class="relation-label">评价人</span>
                <span class="relation-value">{{ scope.row.student_name }}</span>
              </div>
              <div class="relation-row">
                <span class="relation-label">被评家教</span>
                <span class="relation-value text-olive">{{ scope.row.tutor_name }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="create_time" label="发表时间" width="160" class-name="text-olive" />

        <!-- 举报次数高亮展示 -->
        <el-table-column label="违规预警" width="120" align="center">
          <template #default="scope">
            <div v-if="scope.row.report_count > 0" class="report-badge">
              {{ scope.row.report_count }} 次被举报
            </div>
            <span v-else class="empty-text">无异常</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="140" fixed="right">
          <template #default="scope">
            <button class="btn-action btn-delete" @click="handle_delete(scope.row.id)">
              <el-icon><Delete /></el-icon> 删除违规
            </button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页组件 -->
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
import { Filter, Delete } from '@element-plus/icons-vue'

const loading = ref(true)
const comment_list = ref([])
const total = ref(0)
const query_params = ref({
  page_num: 1,
  page_size: 10,
  is_reported: 0 
})

const get_list = async () => {
  loading.value = true
  try {
    const res = await request.get('/comment/admin/list', { params: query_params.value })
    comment_list.value = res.data.records
    total.value = parseInt(res.data.total)
  } catch (error) {
    console.error("加载评价列表失败:", error)
  } finally {
    loading.value = false
  }
}

const handle_filter_change = () => {
  query_params.value.page_num = 1
  get_list()
}

const handle_delete = (comment_id) => {
  ElMessageBox.confirm(
    '确定要永久删除这条违规评价吗？删除后，该家教的综合评分将自动重新计算。',
    '确认删除',
    {
      confirmButtonText: '强制删除',
      cancelButtonText: '保留',
      confirmButtonClass: 'editorial-msgbox-btn-danger',
      cancelButtonClass: 'editorial-msgbox-btn-cancel',
      customClass: 'editorial-message-box',
    }
  ).then(async () => {
    await request.post('/comment/admin/delete', null, {
      params: { comment_id }
    })
    ElMessage.success('违规评价已删除，综合评分已更新')
    get_list() 
  }).catch(() => {})
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
  --clr-near-black: #141413;    /* 墨黑主文本 */
  
  /* 高区分度色彩体系 */
  --clr-terracotta: #c96442;    /* 陶土红 (常规品牌色) */
  --clr-danger-red: #b02a2a;    /* 深茜红 (违规/举报/删除) */
  --clr-amber-warm: #d98f3e;    /* 暖琥珀 (星星打分色) */
  
  --clr-olive: #5e5d59;         /* 橄榄灰 (次级文本) */
  --clr-stone: #87867f;         /* 石板灰 (无异常/零值) */
  --clr-charcoal: #4d4c48;      /* 木炭灰 */
  --clr-warm-sand: #e8e6dc;     /* 暖沙色 (背景/分段器底色) */
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
  padding: 16px 24px;
  border-bottom: 1px solid var(--clr-border-cream);
}
:deep(.editorial-card .el-card__body) { padding: 24px; }

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-title {
  font-family: var(--font-serif);
  font-size: 18px;
  font-weight: 500;
  color: var(--clr-near-black);
  display: flex;
  align-items: center;
}
.title-icon { margin-right: 8px; font-size: 20px; color: var(--clr-stone); }

/* ================= 分段控制器 (Radio Group 深度重写) ================= */
.editorial-radio-group {
  background-color: var(--clr-warm-sand);
  padding: 4px;
  border-radius: 8px;
  display: inline-flex;
}
.editorial-radio-group :deep(.el-radio-button__inner) {
  background: transparent;
  border: none !important;
  box-shadow: none !important;
  color: var(--clr-olive);
  font-weight: 500;
  border-radius: 6px !important;
  padding: 6px 16px;
  transition: all 0.2s;
  font-size: 13px;
}
/* 选中状态 */
.editorial-radio-group :deep(.el-radio-button.is-active .el-radio-button__inner) {
  background-color: var(--clr-white);
  color: var(--clr-near-black);
  box-shadow: 0 2px 8px rgba(0,0,0,0.05) !important;
}

/* 仅看被举报的特殊指示点 */
.danger-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  background-color: var(--clr-danger-red);
  border-radius: 50%;
  margin-right: 6px;
  vertical-align: middle;
  transform: translateY(-1px);
}
.danger-radio :deep(.el-radio-button.is-active .el-radio-button__inner) {
  color: var(--clr-danger-red);
}

/* ================= 表格重塑 (书籍排版感) ================= */
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
  padding: 18px 0; /* 宽松行高 */
  border-bottom: 1px solid var(--clr-border-cream);
  vertical-align: top; /* 评价文本长，顶部对齐更美观 */
}
:deep(.editorial-table--enable-row-hover .el-table__body tr:hover > td.el-table__cell) {
  background-color: var(--clr-parchment);
}

/* 内容区域 */
.content-text {
  font-size: 14px;
  line-height: 1.6;
  color: var(--clr-near-black);
  padding-right: 16px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 关联信息区块 */
.relation-box {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.relation-row {
  font-size: 13px;
  display: flex;
  align-items: baseline;
}
.relation-label {
  color: var(--clr-stone);
  margin-right: 8px;
  width: 56px;
}
.relation-value {
  font-weight: 500;
  color: var(--clr-near-black);
}

/* 文本辅助 */
:deep(.text-olive) { color: var(--clr-olive); }
.empty-text { font-size: 13px; color: var(--clr-stone); }

/* ================= 违规预警胶囊 ================= */
.report-badge {
  display: inline-block;
  padding: 4px 12px;
  background-color: var(--clr-danger-red);
  color: var(--clr-white);
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 6px rgba(176, 42, 42, 0.25);
}

/* ================= 操作按钮实体化 ================= */
.btn-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}
.btn-action .el-icon { margin-right: 4px; }

/* 删除违规：应用深茜红透明底，悬浮加深 */
.btn-delete {
  background-color: rgba(176, 42, 42, 0.08);
  color: var(--clr-danger-red);
}
.btn-delete:hover {
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

/* ================= 全局 MessageBox 重塑 ================= */
:global(.editorial-message-box) {
  border-radius: 12px !important;
  background-color: #faf9f5 !important;
  border: 1px solid #e8e6dc !important;
}
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