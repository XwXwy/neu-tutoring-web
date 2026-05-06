<template>
  <div class="editorial-page-container">
    <el-row :gutter="24">
      
      <!-- 左侧：科目分类管理 -->
      <el-col :xs="24" :sm="8" :md="6">
        <el-card shadow="never" class="editorial-card sidebar-card">
          <template #header>
            <div class="card-header">
              <span class="header-title">分类管理</span>
              <button class="btn-action btn-add" @click="open_category_dialog(null)">
                <el-icon><Plus /></el-icon> 新建
              </button>
            </div>
          </template>
          
          <div class="category-list">
            <div 
              class="category-item" 
              :class="{ 'is-active': selected_category_id === null }"
              @click="select_category(null)"
            >
              <span class="item-name">全部课程</span>
            </div>
            <div 
              v-for="cat in category_list" 
              :key="cat.id" 
              class="category-item"
              :class="{ 'is-active': selected_category_id === cat.id }"
              @click="select_category(cat.id)"
            >
              <span class="item-name">{{ cat.name }}</span>
              <div class="actions">
                <el-icon class="action-icon edit-icon" @click.stop="open_category_dialog(cat)"><Edit /></el-icon>
                <el-icon class="action-icon delete-icon" @click.stop="delete_category(cat.id)"><Delete /></el-icon>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：课程列表 -->
      <el-col :xs="24" :sm="16" :md="18">
        <el-card shadow="never" class="editorial-card table-card">
          <el-table :data="course_list" v-loading="loading" style="width: 100%" class="editorial-table">
            <el-table-column prop="title" label="课程标题" min-width="180" show-overflow-tooltip class-name="text-main fw-500" />
            <el-table-column prop="tutor_name" label="发布家教" width="120" class-name="text-olive" />
            <el-table-column prop="price" label="价格" width="100">
              <template #default="scope">
                <span class="price-text">¥ {{ scope.row.price }}</span>
              </template>
            </el-table-column>
            
            <!-- 状态圆点重塑 -->
            <el-table-column prop="status" label="状态" width="120">
              <template #default="scope">
                <div class="status-badge" :class="'status-' + scope.row.status">
                  <span class="status-dot"></span>
                  <span class="status-text">
                    {{ scope.row.status === 0 ? '已下架' : (scope.row.status === 1 ? '已上架' : '待审核') }}
                  </span>
                </div>
              </template>
            </el-table-column>

            <!-- 操作按钮实体化 -->
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="scope">
                <div class="table-actions">
                  <button class="btn-action btn-view" @click="go_to_detail(scope.row.id)">查看详情</button>
                  <button 
                    v-if="scope.row.status === 1" 
                    class="btn-action btn-warn" 
                    @click="require_modify(scope.row.id)"
                  >
                    打回
                  </button>
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
              @current-change="get_course_list"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 分类编辑/新建弹窗 -->
    <el-dialog 
      v-model="category_dialog_visible" 
      :title="category_form.id ? '编辑分类' : '新建分类'" 
      width="420px"
      class="editorial-dialog"
      destroy-on-close
    >
      <div class="dialog-subtitle">设定课程的科目分类及展示顺序</div>
      <el-form :model="category_form" label-position="top" class="editorial-form form-stacked">
        <el-form-item label="分类名称" required>
          <el-input v-model="category_form.name" class="warm-input" placeholder="例如：高中数学" />
        </el-form-item>
        <el-form-item label="排序权重">
          <div class="sort-input-wrapper">
            <el-input-number v-model="category_form.sort" :min="0" class="warm-input-number" />
            <span class="input-tip">数值越小，展示越靠前</span>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button class="btn-secondary" @click="category_dialog_visible = false">取消</el-button>
          <el-button class="btn-brand" @click="submit_category">保存设置</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onActivated, watch } from 'vue'
import request from '../../utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'

const router = useRouter()
const loading = ref(false)

// --- 左侧分类逻辑 ---
const category_list = ref([])
const selected_category_id = ref(null)
const category_dialog_visible = ref(false)
const category_form = ref({})

const get_category_list = async () => {
  const res = await request.get('/category/list', { params: { type: 1 } })
  category_list.value = res.data
}

const select_category = (id) => {
  selected_category_id.value = id
}

const open_category_dialog = (cat) => {
  category_form.value = cat ? { ...cat } : { type: 1, sort: 0 } 
  category_dialog_visible.value = true
}

const submit_category = async () => {
  if (!category_form.value.name) {
    ElMessage.warning('分类名称不能为空')
    return
  }
  await request.post('/category/admin/save_or_update', category_form.value)
  ElMessage.success('分类保存成功')
  category_dialog_visible.value = false
  get_category_list() 
}

const delete_category = (id) => {
  ElMessageBox.confirm(
    '确定要永久删除这个科目分类吗？', 
    '确认删除',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '保留',
      confirmButtonClass: 'editorial-msgbox-btn-danger',
      cancelButtonClass: 'editorial-msgbox-btn-cancel',
      customClass: 'editorial-message-box',
    }
  ).then(async () => {
    await request.delete(`/category/admin/delete/${id}`)
    ElMessage.success('删除成功')
    if (selected_category_id.value === id) {
      selected_category_id.value = null
    }
    get_category_list()
  }).catch(() => {})
}

// --- 右侧课程列表逻辑 ---
const course_list = ref([])
const total = ref(0)
const query_params = ref({
  page_num: 1,
  page_size: 10,
  category_id: null
})

watch(selected_category_id, (new_val) => {
  query_params.value.category_id = new_val
  query_params.value.page_num = 1 
  get_course_list()
})

const get_course_list = async () => {
  loading.value = true
  const res = await request.get('/course/admin/list', { params: query_params.value })
  course_list.value = res.data.records
  total.value = parseInt(res.data.total)
  loading.value = false
}

const go_to_detail = (id) => {
  router.push({ path: '/course-detail', query: { course_id: id } })
}

const require_modify = (id) => {
  ElMessageBox.confirm(
    '确定要将该课程打回，要求其重新修改并提交审核吗？', 
    '操作确认',
    {
      confirmButtonText: '确认打回',
      cancelButtonText: '取消',
      confirmButtonClass: 'editorial-msgbox-btn-warn',
      cancelButtonClass: 'editorial-msgbox-btn-cancel',
      customClass: 'editorial-message-box',
    }
  ).then(async () => {
    await request.post('/course/admin/require_modify', null, { params: { course_id: id } })
    ElMessage.success('已打回该课程')
    get_course_list()
  }).catch(() => {})
}

onActivated(() => {
  get_category_list()
  get_course_list()
})
</script>

<style scoped>
/* ================= 优化后的色板 ================= */
* {
  --clr-parchment: #f5f4ed;     /* 羊皮纸暖白 (背景) */
  --clr-ivory: #faf9f5;         /* 象牙白 (卡片) */
  --clr-white: #ffffff;         
  --clr-near-black: #141413;    /* 墨黑 (主文本) */
  
  /* --- 色彩区分度加强版 --- */
  --clr-terracotta: #c96442;    /* 【品牌陶土红】：用于主操作、正常上架状态、分类选中 */
  --clr-danger-red: #b02a2a;    /* 【警示深红】：加深并去黄，专门用于删除、危险操作 */
  --clr-amber-warm: #d98f3e;    /* 【暖琥珀/赭石】：向黄偏移，专门用于待审核、打回、警告 */
  
  --clr-olive: #5e5d59;         /* 橄榄灰 (次要文本) */
  --clr-stone: #87867f;         /* 石板灰 (下架状态、禁用) */
  --clr-charcoal: #4d4c48;      /* 木炭灰 (按钮文字) */
  --clr-warm-sand: #e8e6dc;     /* 暖沙色 (次级按钮背景、选中背景) */
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

/* ================= 卡片容器重塑 ================= */
.editorial-card {
  background-color: var(--clr-ivory);
  border: 1px solid var(--clr-border-cream);
  border-radius: 12px;
  box-shadow: rgba(0, 0, 0, 0.02) 0px 4px 12px !important;
  height: 100%;
}
:deep(.editorial-card .el-card__body) { padding: 24px; }

/* ================= 左侧：分类管理 ================= */
.sidebar-card :deep(.el-card__body) {
  padding: 8px 0;
}
.sidebar-card :deep(.el-card__header) {
  padding: 16px 20px;
  border-bottom: 1px solid var(--clr-border-cream);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-title {
  font-family: var(--font-serif);
  font-weight: 500;
  font-size: 16px;
  color: var(--clr-near-black);
}
.btn-add {
  background-color: transparent;
  color: var(--clr-olive);
  border: 1px solid var(--clr-border-warm);
  padding: 4px 10px;
  font-size: 12px;
}
.btn-add:hover {
  background-color: var(--clr-warm-sand);
  color: var(--clr-near-black);
}

.category-list {
  padding: 8px 12px;
}
.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 4px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
  position: relative;
  color: var(--clr-olive);
}
.category-item:hover {
  background-color: rgba(232, 230, 220, 0.4); /* 透明暖沙色 */
}

/* 选中状态重构：柔和背景 + 左侧陶土红指示条 */
.category-item.is-active {
  background-color: var(--clr-warm-sand);
  color: var(--clr-near-black);
  font-weight: 500;
}
.category-item.is-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 20%;
  height: 60%;
  width: 3px;
  background-color: var(--clr-terracotta);
  border-radius: 0 4px 4px 0;
}

.category-item .actions {
  display: flex;
  gap: 12px;
  opacity: 0; /* 平滑过渡替代 display:none */
  transition: opacity 0.2s;
}
.category-item:hover .actions {
  opacity: 1;
}
.action-icon {
  font-size: 15px;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s;
}
.edit-icon { color: var(--clr-stone); }
.edit-icon:hover { color: var(--clr-near-black); background: rgba(0,0,0,0.05); }

/* 删除图标应用新的警示红 */
.delete-icon { color: rgba(176, 42, 42, 0.6); } 
.delete-icon:hover { color: var(--clr-danger-red); background: rgba(176, 42, 42, 0.1); }

/* ================= 右侧：课程列表表格 ================= */
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
}
:deep(.editorial-table--enable-row-hover .el-table__body tr:hover > td.el-table__cell) {
  background-color: var(--clr-parchment);
}

:deep(.text-main) { color: var(--clr-near-black); font-size: 15px; }
:deep(.fw-500) { font-weight: 500; font-family: var(--font-serif); }
:deep(.text-olive) { color: var(--clr-olive); font-size: 14px; }
.price-text {
  font-family: monospace;
  font-size: 15px;
  color: var(--clr-near-black);
}

/* ================= 状态徽章 (拉开色彩差距) ================= */
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
/* 1 已上架: 品牌陶土红 */
.status-1 .status-dot { background-color: var(--clr-terracotta); box-shadow: 0 0 4px rgba(201, 100, 66, 0.4); }
.status-1 .status-text { color: var(--clr-near-black); }

/* 2 待审核: 琥珀赭石色 (Warning) */
.status-2 .status-dot { background-color: var(--clr-amber-warm); }
.status-2 .status-text { color: var(--clr-amber-warm); }

/* 0 已下架: 石板灰 */
.status-0 .status-dot { background-color: var(--clr-stone); }
.status-0 .status-text { color: var(--clr-stone); }

/* ================= 操作按钮实体化 ================= */
.table-actions {
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

/* 查看详情：常规次级按钮 */
.btn-view {
  background-color: var(--clr-warm-sand);
  color: var(--clr-charcoal);
}
.btn-view:hover { background-color: var(--clr-border-warm); box-shadow: 0 0 0 1px var(--clr-ring-warm); }

/* 打回按钮：应用琥珀赭石色，警示其需要重做 */
.btn-warn {
  background-color: rgba(217, 143, 62, 0.1);
  color: var(--clr-amber-warm);
}
.btn-warn:hover { background-color: rgba(217, 143, 62, 0.2); }

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

/* ================= 弹窗定制 ================= */
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
.form-stacked { padding: 0 32px; }
.dialog-footer { padding-top: 12px; }

/* 表单元素重塑 */
.editorial-form :deep(.el-form-item__label) {
  font-weight: 500;
  color: var(--clr-olive);
}
.warm-input :deep(.el-input__wrapper) {
  background-color: var(--clr-parchment);
  border: 1px solid var(--clr-border-warm);
  border-radius: 8px;
  box-shadow: none !important;
}
.warm-input :deep(.el-input__wrapper.is-focus) { background-color: var(--clr-white); box-shadow: 0 0 0 1px var(--clr-focus-blue) !important; }

.sort-input-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}
.warm-input-number :deep(.el-input__wrapper) {
  background-color: var(--clr-parchment);
  border: 1px solid var(--clr-border-warm);
  box-shadow: none !important;
  border-radius: 6px;
}
.input-tip { font-size: 12px; color: var(--clr-stone); }

/* 底部弹窗按钮 */
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

.btn-secondary {
  background: var(--clr-warm-sand) !important;
  color: var(--clr-charcoal) !important;
  border: none;
  border-radius: 8px;
  padding: 8px 20px;
  box-shadow: var(--clr-warm-sand) 0px 0px 0px 0px, var(--clr-ring-warm) 0px 0px 0px 1px;
}

/* ================= 全局 MessageBox 重写 ================= */
:global(.editorial-message-box) {
  border-radius: 12px !important;
  background-color: #faf9f5 !important;
  border: 1px solid #e8e6dc !important;
}
/* 深红色删除确认按钮 */
:global(.editorial-msgbox-btn-danger) {
  background-color: #b02a2a !important; /* 应用新的深茜红 */
  border: none !important;
}
/* 琥珀色打回确认按钮 */
:global(.editorial-msgbox-btn-warn) {
  background-color: #d98f3e !important; /* 应用新的琥珀赭石 */
  border: none !important;
}
:global(.editorial-msgbox-btn-cancel) {
  background-color: #e8e6dc !important;
  color: #4d4c48 !important;
  border: none !important;
}
</style>