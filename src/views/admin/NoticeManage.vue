<template>
  <div class="editorial-page-container">
    <!-- 顶部搜索与操作区 -->
    <el-card shadow="never" class="warm-card search-card">
      <el-form :inline="true" :model="query_params" class="editorial-form">
        <el-form-item label="公告标题">
          <el-input 
            v-model="query_params.title" 
            placeholder="搜索公告标题..." 
            clearable 
            class="warm-input"
          />
        </el-form-item>
        <el-form-item class="form-actions-inline">
          <el-button class="btn-primary" @click="handle_search">查询</el-button>
          <el-button class="btn-secondary" @click="reset_query">重置</el-button>
        </el-form-item>
        <el-form-item class="publish-action">
          <el-button class="btn-brand" icon="Plus" @click="open_add_dialog">发布新公告</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 公告列表 -->
    <el-card shadow="never" class="warm-card table-card">
      <el-table :data="notice_list" v-loading="loading" style="width: 100%" class="editorial-table">
        <el-table-column prop="id" label="ID" width="160" class-name="text-stone" />
        <el-table-column prop="title" label="公告标题" show-overflow-tooltip class-name="text-main fw-500" />
        
        <!-- 类型徽章重塑 -->
        <el-table-column prop="type" label="类型" width="140">
          <template #default="scope">
            <div class="type-badge" :class="'type-' + scope.row.type">
              {{ scope.row.type === 0 ? '系统更新' : (scope.row.type === 1 ? '活动通知' : '政策变更') }}
            </div>
          </template>
        </el-table-column>
        
        <!-- 状态圆点重塑 -->
        <el-table-column prop="status" label="状态" width="120">
          <template #default="scope">
            <div class="status-badge" :class="scope.row.status === 1 ? 'status-active' : 'status-draft'">
              <span class="status-dot"></span>
              <span class="status-text">{{ scope.row.status === 1 ? '已发布' : '草稿/撤回' }}</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="create_time" label="创建时间" width="180" class-name="text-olive" />
        
        <!-- 操作按钮实体化 -->
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="scope">
            <div class="action-buttons">
              <button class="btn-action btn-edit" @click="open_edit_dialog(scope.row)">编辑</button>
              <button 
                class="btn-action" 
                :class="scope.row.status === 1 ? 'btn-revoke' : 'btn-publish'"
                @click="toggle_status(scope.row)"
              >
                {{ scope.row.status === 1 ? '撤回' : '发布' }}
              </button>
              <button class="btn-action btn-delete" @click="handle_delete(scope.row.id)">删除</button>
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

    <!-- 发布/编辑弹窗 -->
    <el-dialog 
      v-model="dialog_visible" 
      :title="form_data.id ? '编辑公告' : '撰写新公告'" 
      width="700px" 
      destroy-on-close
      class="editorial-dialog"
    >
      <div class="dialog-subtitle">
        {{ form_data.id ? '修改公告信息，注意已发布的公告修改后会立即生效。' : '在下方撰写您的公告，支持 Markdown 语法进行高级排版。' }}
      </div>
      <el-form :model="form_data" label-width="80px" label-position="top" class="editorial-form form-stacked">
        <el-form-item label="公告标题" required>
          <el-input v-model="form_data.title" placeholder="请输入具有概括性的标题..." class="warm-input title-input" />
        </el-form-item>
        <el-form-item label="公告类型" required>
          <el-radio-group v-model="form_data.type" class="warm-radio-group">
            <el-radio :label="0">系统更新</el-radio>
            <el-radio :label="1">活动通知</el-radio>
            <el-radio :label="2">政策变更</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="正文内容" required>
          <!-- 模拟写作纸张质感的输入框 -->
          <el-input 
            v-model="form_data.content" 
            type="textarea" 
            :rows="12" 
            placeholder="支持 Markdown 语法排版！&#10;例如：使用 **加粗**，使用 ### 作为标题..." 
            class="writing-textarea"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button class="btn-secondary" @click="dialog_visible = false">取 消</el-button>
          <el-button class="btn-brand" @click="submit_form">保存公告</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted,onActivated } from 'vue'
import request from '../../utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Notification } from '@element-plus/icons-vue'

const loading = ref(true)
const notice_list = ref([])
const total = ref(0)
const query_params = ref({
  page_num: 1,
  page_size: 10,
  title: ''
})

const dialog_visible = ref(false)
const form_data = ref({})

const get_list = async () => {
  loading.value = true
  const res = await request.get('/notice/admin/page', { params: query_params.value })
  notice_list.value = res.data.records
  total.value = parseInt(res.data.total)
  loading.value = false
}

const handle_search = () => {
  query_params.value.page_num = 1
  get_list()
}

const reset_query = () => {
  query_params.value.title = ''
  handle_search()
}

const open_add_dialog = () => {
  form_data.value = { type: 0 } 
  dialog_visible.value = true
}

const open_edit_dialog = (row) => {
  form_data.value = JSON.parse(JSON.stringify(row)) 
  dialog_visible.value = true
}

const submit_form = async () => {
  if (!form_data.value.title || !form_data.value.content) {
    ElMessage.warning('请填写完整的标题和内容')
    return
  }
  await request.post('/notice/admin/save_or_update', form_data.value)
  ElMessage.success('公告保存成功')
  dialog_visible.value = false
  get_list()
}

const toggle_status = async (row) => {
  const new_status = row.status === 1 ? 0 : 1
  const action_text = new_status === 1 ? '发布' : '撤回'
  await request.post('/notice/admin/save_or_update', { id: row.id, status: new_status })
  ElMessage.success(`公告已${action_text}`)
  get_list()
}

const handle_delete = (id) => {
  ElMessageBox.confirm(
    '确定要永久删除这篇公告吗？此操作无法撤销。', 
    '确认删除',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '保留',
      confirmButtonClass: 'editorial-msgbox-btn-danger',
      cancelButtonClass: 'editorial-msgbox-btn-cancel',
      customClass: 'editorial-message-box',
    }
  ).then(async () => {
    await request.delete(`/notice/admin/delete/${id}`)
    ElMessage.success('删除成功')
    get_list()
  }).catch(() => {})
}

onActivated(() => { get_list() })
</script>

<style scoped>
/* ================= 美学色板与变量定义 ================= */
* {
  --clr-parchment: #f5f4ed;     /* 羊皮纸暖白 */
  --clr-ivory: #faf9f5;         /* 卡片象牙白 */
  --clr-white: #ffffff;         /* 纯白 */
  --clr-near-black: #141413;    /* 墨黑色 */
  --clr-terracotta: #c96442;    /* 品牌陶土红 */
  --clr-crimson: #b53333;       /* 警示红 */
  --clr-coral: #d97757;         /* 珊瑚暖色 */
  --clr-olive: #5e5d59;         /* 橄榄灰 */
  --clr-stone: #87867f;         /* 石板灰 */
  --clr-charcoal: #4d4c48;      /* 木炭灰 */
  --clr-warm-sand: #e8e6dc;     /* 暖沙色 */
  --clr-border-cream: #f0eee6;  /* 柔和边框色 */
  --clr-border-warm: #e8e6dc;   /* 加深边框色 */
  --clr-ring-warm: #d1cfc5;     /* 暖色交互光环 */
  --clr-focus-blue: #3898ec;    /* 焦点蓝(无障碍辅助) */
  
  --font-serif: "Georgia", "Times New Roman", serif;
  --font-sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.editorial-page-container {
  font-family: var(--font-sans);
}

/* ================= 柔和卡片系统 ================= */
.warm-card {
  background-color: var(--clr-ivory);
  border: 1px solid var(--clr-border-cream);
  border-radius: 12px;
  box-shadow: rgba(0, 0, 0, 0.02) 0px 4px 12px !important;
}
.search-card { margin-bottom: 24px; }
:deep(.warm-card .el-card__body) { padding: 24px; }

/* ================= 表单与输入框 ================= */
.editorial-form :deep(.el-form-item__label) {
  font-family: var(--font-sans);
  font-weight: 500;
  color: var(--clr-olive);
}

.warm-input :deep(.el-input__wrapper) {
  background-color: var(--clr-parchment);
  border: 1px solid var(--clr-border-warm);
  border-radius: 8px;
  box-shadow: none !important;
  transition: all 0.2s;
}
.warm-input :deep(.el-input__wrapper.is-focus) {
  background-color: var(--clr-white);
  border-color: var(--clr-focus-blue);
  box-shadow: 0 0 0 1px var(--clr-focus-blue) !important;
}
.title-input :deep(.el-input__inner) {
  font-family: var(--font-serif);
  font-size: 16px;
  font-weight: 500;
  color: var(--clr-near-black);
}

/* 右侧发布按钮占位 */
.form-actions-inline { margin-right: auto; }
.publish-action { float: right; margin-right: 0; }

/* ================= 按钮系统 ================= */
.btn-primary {
  background: var(--clr-terracotta) !important;
  color: var(--clr-ivory) !important;
  border: none;
  border-radius: 8px;
  padding: 8px 20px;
  font-weight: 500;
  box-shadow: var(--clr-charcoal) 0px 0px 0px 0px, var(--clr-charcoal) 0px 0px 0px 1px;
}
.btn-primary:hover { opacity: 0.9; }

.btn-secondary {
  background: var(--clr-warm-sand) !important;
  color: var(--clr-charcoal) !important;
  border: none;
  border-radius: 8px;
  padding: 8px 20px;
  box-shadow: var(--clr-warm-sand) 0px 0px 0px 0px, var(--clr-ring-warm) 0px 0px 0px 1px;
}
.btn-secondary:hover { background: var(--clr-border-warm) !important; }

/* 核心行动按钮 (陶土红) */
.btn-brand {
  background: var(--clr-terracotta) !important;
  color: var(--clr-ivory) !important;
  border: none;
  border-radius: 8px;
  padding: 8px 20px;
  font-weight: 500;
  box-shadow: var(--clr-terracotta) 0px 0px 0px 0px, var(--clr-terracotta) 0px 0px 0px 1px;
}
.btn-brand:hover { opacity: 0.9; }

/* ================= 表格：文学版式排版 ================= */
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
}
:deep(.editorial-table--enable-row-hover .el-table__body tr:hover > td.el-table__cell) {
  background-color: var(--clr-parchment);
}

:deep(.text-main) { color: var(--clr-near-black); font-size: 15px; }
:deep(.fw-500) { font-weight: 500; font-family: var(--font-serif); }
:deep(.text-olive) { color: var(--clr-olive); font-size: 14px; }
:deep(.text-stone) { color: var(--clr-stone); font-size: 13px; font-family: monospace; }

/* ================= 徽章系统 ================= */
/* 1. 类型徽章 (文字底色) */
.type-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.5px;
}
.type-0 { background: rgba(181, 51, 51, 0.08); color: var(--clr-crimson); } /* 系统更新 - 警示红 */
.type-1 { background: rgba(201, 100, 66, 0.1); color: var(--clr-terracotta); } /* 活动通知 - 品牌红 */
.type-2 { background: var(--clr-border-warm); color: var(--clr-charcoal); } /* 政策变更 - 中性灰 */

/* 2. 状态徽章 (圆点指示器) */
.status-badge {
  display: inline-flex;
  align-items: center;
  font-size: 13px;
  font-weight: 500;
}
.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 8px;
}
.status-active .status-dot { background-color: var(--clr-coral); box-shadow: 0 0 4px rgba(217, 119, 87, 0.4); }
.status-active .status-text { color: var(--clr-near-black); }

.status-draft .status-dot { background-color: var(--clr-stone); }
.status-draft .status-text { color: var(--clr-stone); }

/* ================= 操作列按钮实体化 ================= */
.action-buttons {
  display: flex;
  gap: 8px;
}
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

.btn-edit {
  background-color: var(--clr-warm-sand);
  color: var(--clr-charcoal);
}
.btn-edit:hover { background-color: var(--clr-border-warm); box-shadow: 0 0 0 1px var(--clr-ring-warm); }

.btn-publish {
  background-color: rgba(217, 119, 87, 0.1);
  color: var(--clr-coral);
}
.btn-publish:hover { background-color: rgba(217, 119, 87, 0.2); }

.btn-revoke {
  background-color: var(--clr-border-cream);
  color: var(--clr-stone);
}
.btn-revoke:hover { background-color: var(--clr-border-warm); }

.btn-delete {
  background-color: rgba(181, 51, 51, 0.05);
  color: var(--clr-crimson);
}
.btn-delete:hover { background-color: rgba(181, 51, 51, 0.12); }

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

/* ================= 写作弹窗定制 ================= */
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
  font-size: 24px;
  color: var(--clr-near-black);
}
.dialog-subtitle {
  font-size: 14px;
  color: var(--clr-olive);
  margin-top: 8px;
  margin-bottom: 24px;
  padding: 0 32px;
  line-height: 1.6;
}
.form-stacked { padding: 0 32px; }
.dialog-footer { padding-top: 12px; }

/* 单选框美化 (注入品牌色) */
.warm-radio-group :deep(.el-radio__input.is-checked .el-radio__inner) {
  border-color: var(--clr-terracotta);
  background: var(--clr-terracotta);
}
.warm-radio-group :deep(.el-radio__input.is-checked + .el-radio__label) {
  color: var(--clr-terracotta);
  font-weight: 500;
}

/* 沉浸式写作输入框 (羊皮纸质感) */
.writing-textarea :deep(.el-textarea__inner) {
  background-color: var(--clr-parchment);
  border: 1px solid var(--clr-border-warm);
  border-radius: 12px;
  padding: 20px;
  font-family: monospace;
  font-size: 15px;
  line-height: 1.8;
  color: var(--clr-near-black);
  box-shadow: none;
  transition: all 0.2s;
}
.writing-textarea :deep(.el-textarea__inner:focus) {
  background-color: var(--clr-white);
  border-color: var(--clr-focus-blue);
  box-shadow: 0 0 0 1px var(--clr-focus-blue);
}

/* 全局 MessageBox 暖色系重写 (不带品牌名) */
:global(.editorial-message-box) {
  border-radius: 12px !important;
  background-color: #faf9f5 !important;
  border: 1px solid #e8e6dc !important;
}
:global(.editorial-msgbox-btn-danger) {
  background-color: #b53333 !important;
  border: none !important;
}
:global(.editorial-msgbox-btn-cancel) {
  background-color: #e8e6dc !important;
  color: #4d4c48 !important;
  border: none !important;
}
</style>