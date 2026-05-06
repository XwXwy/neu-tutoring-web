<template>
  <div class="editorial-page-container">
    <!-- 1. 搜索与操作区 -->
    <el-card shadow="never" class="editorial-card search-card">
      <el-form :inline="true" :model="queryParams" class="editorial-form">
        <el-form-item label="用户名">
          <el-input 
            v-model="queryParams.username" 
            placeholder="请输入用户名" 
            clearable 
            class="warm-input"
          />
        </el-form-item>
        <el-form-item label="真实姓名">
          <el-input 
            v-model="queryParams.realName" 
            placeholder="请输入真实姓名" 
            clearable 
            class="warm-input"
          />
        </el-form-item>
        <el-form-item class="form-actions-inline">
          <el-button class="btn-primary" @click="handleSearch">搜索</el-button>
          <el-button class="btn-secondary" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 2. 表格展示区 -->
    <el-card shadow="never" class="editorial-card table-card">
      <el-table 
        :data="userList" 
        v-loading="loading" 
        style="width: 100%"
        class="editorial-table"
      >
        <el-table-column prop="id" label="ID" width="180" class-name="text-stone" />
        <el-table-column prop="username" label="用户名" class-name="text-main fw-500" />
        <el-table-column prop="real_name" label="真实姓名" class-name="text-main" />
        <el-table-column prop="phone" label="手机号" class-name="text-olive" />
        
        <!-- 角色列增强辨识度：应用新的色彩区分逻辑 -->
        <el-table-column prop="role" label="角色" width="140">
          <template #default="scope">
            <div class="role-badge" :class="'role-badge-' + scope.row.role">
              <span class="role-dot"></span>
              <span class="role-text">
                {{ scope.row.role === 0 ? '管理员' : (scope.row.role === 1 ? '家教' : '用户') }}
              </span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-switch 
              v-model="scope.row.status" 
              :active-value="1" 
              :inactive-value="0"
              @change="handleStatusChange(scope.row)" 
              class="warm-switch"
            />
          </template>
        </el-table-column>
        
        <!-- 操作列按钮实体化 -->
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <div class="action-buttons">
              <button class="btn-action btn-edit" @click="handleEdit(scope.row)">
                编辑
              </button>
              <button class="btn-action btn-delete" @click="handleDelete(scope.row)">
                删除
              </button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 3. 分页组件 -->
      <div class="pagination-wrapper">
        <el-pagination
          class="editorial-pagination"
          background
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          v-model:current-page="queryParams.pageNum"
          v-model:page-size="queryParams.pageSize"
          @size-change="getList"
          @current-change="getList"
        />
      </div>
    </el-card>
  </div>
  
  <!-- 编辑对话框 -->
  <el-dialog 
    v-model="editDialogVisible" 
    title="编辑用户信息" 
    width="500px"
    class="editorial-dialog"
    destroy-on-close
  >
    <div class="dialog-subtitle">修改账户权限、联系方式或基本身份信息</div>
    <el-form :model="editForm" label-width="80px" class="editorial-form form-stacked" label-position="top">
      <el-form-item label="用户名">
        <el-input v-model="editForm.username" disabled class="warm-input is-disabled" />
      </el-form-item>
      <el-form-item label="真实姓名">
        <el-input v-model="editForm.real_name" class="warm-input" />
      </el-form-item>
      <el-form-item label="手机号">
        <el-input v-model="editForm.phone" class="warm-input" />
      </el-form-item>
      <el-form-item label="角色权限分配">
        <el-select v-model="editForm.role" placeholder="请选择角色" style="width: 100%" popper-class="warm-select-popper">
          <el-option label="管理员 (Admin)" :value="0" />
          <el-option label="家教老师 (Tutor)" :value="1" />
          <el-option label="普通用户 (Student)" :value="2" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button class="btn-secondary" @click="editDialogVisible = false">取消</el-button>
        <el-button class="btn-primary" @click="saveEdit">保存更新</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, onActivated } from 'vue'
import request from '../../utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(true) 
const userList = ref([]) 
const total = ref(0) 
const editDialogVisible = ref(false) 
const editForm = ref({}) 
const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
  username: '',
  realName: ''
})

const getList = async () => {
  loading.value = true
  try {
    const res = await request.get('/sysUser/page', { params: queryParams.value })
    userList.value = res.data.records
    total.value = parseInt(res.data.total)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  queryParams.value.pageNum = 1 
  getList()
}

const resetQuery = () => {
  queryParams.value.username = ''
  queryParams.value.realName = ''
  handleSearch()
}

const handleStatusChange = async (row) => {
  try {
    await request.post('/sysUser/update', {
      id: row.id,
      status: row.status
    })
    ElMessage.success('状态更新成功')
  } catch (error) {
    row.status = row.status === 1 ? 0 : 1
  }
}

const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要永久删除用户 "${row.username}" 吗？此操作不可恢复。`,
    '确认删除',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '保留',
      confirmButtonClass: 'editorial-msgbox-btn-danger',
      cancelButtonClass: 'editorial-msgbox-btn-cancel',
      customClass: 'editorial-message-box',
    }
  ).then(async () => {
    await request.delete(`/sysUser/${row.id}`)
    ElMessage.success('用户已移除')
    getList() 
  }).catch(() => {})
}

const handleEdit = (row) => {
  editForm.value = { ...row }
  editDialogVisible.value = true
}

const saveEdit = async () => {
  await request.post('/sysUser/update', editForm.value)
  ElMessage.success('信息已更新')
  editDialogVisible.value = false
  getList() 
}

onActivated(() => {
  getList()
})
</script>

<style scoped>
/* ================= 全局设计系统变量 ================= */
* {
  --clr-parchment: #f5f4ed;     /* 羊皮纸背景 */
  --clr-ivory: #faf9f5;         /* 卡片背景 */
  --clr-white: #ffffff;
  --clr-near-black: #141413;    /* 主文本墨黑色 */
  
  /* 区分度增强版色彩方案 */
  --clr-terracotta: #c96442;    /* 品牌红：用于管理员、保存、主要指示 */
  --clr-danger-red: #b02a2a;    /* 深茜红：用于删除、危险操作 */
  --clr-amber-warm: #d98f3e;    /* 暖琥珀：用于家教身份、中等警告 */
  
  --clr-olive: #5e5d59;         /* 橄榄灰文本 */
  --clr-stone: #87867f;         /* 石板灰文本 */
  --clr-charcoal: #4d4c48;      /* 木炭灰按钮文字 */
  --clr-warm-sand: #e8e6dc;     /* 暖沙色按钮/选中背景 */
  --clr-border-cream: #f0eee6;  /* 细边框 */
  --clr-border-warm: #e8e6dc;   /* 显眼边框 */
  --clr-ring-warm: #d1cfc5;     /* 交互光环 */
  --clr-focus-blue: #3898ec;    /* 焦点蓝 */
  
  --font-serif: "Georgia", "Times New Roman", serif;
  --font-sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.editorial-page-container {
  font-family: var(--font-sans);
}

/* ================= 柔和卡片系统 ================= */
.editorial-card {
  background-color: var(--clr-ivory);
  border: 1px solid var(--clr-border-cream);
  border-radius: 12px;
  box-shadow: rgba(0, 0, 0, 0.02) 0px 4px 12px !important;
}
.search-card { margin-bottom: 24px; }
:deep(.editorial-card .el-card__body) { padding: 24px; }

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
.warm-input.is-disabled :deep(.el-input__wrapper) {
  background-color: var(--clr-warm-sand);
  color: var(--clr-stone);
}
.form-actions-inline { margin-right: 0; }

/* ================= 主按钮系统 ================= */
.btn-primary {
  background: var(--clr-terracotta) !important;
  color: var(--clr-ivory) !important;
  border: none;
  border-radius: 8px;
  padding: 8px 20px;
  font-weight: 500;
  box-shadow: var(--clr-terracotta) 0px 0px 0px 0px, var(--clr-terracotta) 0px 0px 0px 1px;
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
  padding: 16px 0;
  border-bottom: 1px solid var(--clr-border-cream);
}
:deep(.editorial-table--enable-row-hover .el-table__body tr:hover > td.el-table__cell) {
  background-color: var(--clr-parchment);
}

:deep(.text-main) { color: var(--clr-near-black); }
:deep(.fw-500) { font-weight: 500; }
:deep(.text-olive) { color: var(--clr-olive); font-size: 14px; }
:deep(.text-stone) { color: var(--clr-stone); font-size: 13px; font-family: monospace; }

/* ================= 角色标签：区分度强化版 ================= */
.role-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px 4px 8px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  background: var(--clr-white);
  border: 1px solid var(--clr-border-warm);
  box-shadow: 0 1px 2px rgba(0,0,0,0.02);
}
.role-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 8px;
}

/* 0 管理员：品牌陶土红，最显眼 */
.role-badge-0 { border-color: rgba(201, 100, 66, 0.3); background: rgba(201, 100, 66, 0.05); }
.role-badge-0 .role-dot { background-color: var(--clr-terracotta); }
.role-badge-0 .role-text { color: var(--clr-terracotta); }

/* 1 家教：应用暖琥珀色，与品牌红拉开差距 */
.role-badge-1 { border-color: rgba(217, 143, 62, 0.3); background: rgba(217, 143, 62, 0.05); }
.role-badge-1 .role-dot { background-color: var(--clr-amber-warm); }
.role-badge-1 .role-text { color: var(--clr-amber-warm); }

/* 2 用户：沉稳橄榄灰 */
.role-badge-2 { border-color: var(--clr-border-warm); background: var(--clr-parchment); }
.role-badge-2 .role-dot { background-color: var(--clr-stone); }
.role-badge-2 .role-text { color: var(--clr-olive); }

/* ================= 开关 (Switch) ================= */
.warm-switch :deep(.el-switch__core) {
  border-color: var(--clr-ring-warm);
  background-color: var(--clr-ring-warm);
}
.warm-switch.is-checked :deep(.el-switch__core) {
  border-color: var(--clr-terracotta);
  background-color: var(--clr-terracotta);
}

/* ================= 操作按钮实体化 ================= */
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

/* 编辑按钮：暖沙色稳重风格 */
.btn-edit {
  background-color: var(--clr-warm-sand);
  color: var(--clr-charcoal);
}
.btn-edit:hover { background-color: var(--clr-border-warm); box-shadow: 0 0 0 1px var(--clr-ring-warm); }

/* 删除按钮：应用深茜红，显著区分 */
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

/* ================= 编辑弹窗 ================= */
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

:global(.warm-select-popper) {
  border-radius: 8px !important;
  border: 1px solid var(--clr-border-warm) !important;
}

/* ================= 全局反馈框重塑 ================= */
:global(.editorial-message-box) {
  border-radius: 12px !important;
  background-color: #faf9f5 !important;
  border: 1px solid #e8e6dc !important;
}
/* 应用深茜红 */
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