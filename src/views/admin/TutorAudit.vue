<template>
  <div class="editorial-page-container">
    <el-card shadow="never" class="editorial-card">
      <template #header>
        <div class="card-header">
          <span class="header-title">家教资质审核申请</span>
        </div>
      </template>

      <el-table :data="auditList" v-loading="loading" style="width: 100%" class="editorial-table">
        <el-table-column prop="real_name" label="申请人姓名" width="120" class-name="text-main fw-500" />
        
        <el-table-column prop="university" label="毕业院校" min-width="150" class-name="text-main" />
        
        <el-table-column prop="major" label="专业" min-width="150" class-name="text-olive" />
        
        <el-table-column label="教龄" width="100">
          <template #default="scope">
            <span class="teaching-years">{{ scope.row.teaching_years }} <span class="unit">年</span></span>
          </template>
        </el-table-column>
        
        <!-- 学历证预览 (档案相片质感) -->
        <el-table-column label="学历证书" width="140">
          <template #default="scope">
            <div class="cert-wrapper" v-if="scope.row.degree_cert">
              <el-image 
                class="cert-image"
                :src="scope.row.degree_cert" 
                :preview-src-list="[scope.row.degree_cert]"
                preview-teleported
                fit="cover"
              />
            </div>
            <span v-else class="empty-text">未上传</span>
          </template>
        </el-table-column>

        <!-- 教师证预览 (档案相片质感) -->
        <el-table-column label="教师资格证" width="140">
          <template #default="scope">
            <div class="cert-wrapper" v-if="scope.row.teacher_cert">
              <el-image 
                class="cert-image"
                :src="scope.row.teacher_cert" 
                :preview-src-list="[scope.row.teacher_cert]"
                preview-teleported
                fit="cover"
              />
            </div>
            <span v-else class="empty-text">未上传</span>
          </template>
        </el-table-column>

        <!-- 操作按钮实体化 -->
        <el-table-column label="审核操作" width="180" fixed="right">
          <template #default="scope">
            <div class="action-buttons">
              <button class="btn-action btn-approve" @click="handleAudit(scope.row, 1)">通过</button>
              <button class="btn-action btn-reject" @click="handleAudit(scope.row, 0)">驳回</button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onActivated } from 'vue'
import request from '../../utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const auditList = ref([])

const getList = async () => {
  loading.value = true
  const res = await request.get('/sysUser/tutor/audit/list')
  auditList.value = res.data.records
  loading.value = false
}

const handleAudit = (row, status) => {
  const actionText = status === 1 ? '通过' : '驳回'
  const isApprove = status === 1
  
  ElMessageBox.confirm(
    `确定要 ${actionText} 【${row.real_name}】 的家教资质申请吗？`, 
    '审核确认',
    {
      confirmButtonText: `确认${actionText}`,
      cancelButtonText: '取消',
      // 根据操作类型动态赋予不同的按钮颜色（通过为陶土红，驳回为深茜红）
      confirmButtonClass: isApprove ? 'editorial-msgbox-btn-brand' : 'editorial-msgbox-btn-danger',
      cancelButtonClass: 'editorial-msgbox-btn-cancel',
      customClass: 'editorial-message-box',
    }
  ).then(async () => {
    await request.post('/sysUser/tutor/audit/handle', null, {
      params: { user_id: row.user_id, status: status }
    })
    ElMessage.success(`已${actionText}该申请`)
    getList()
  }).catch(() => {})
}

onActivated(() => {
  getList()
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
  --clr-terracotta: #c96442;    /* 陶土红 (通过/确认) */
  --clr-danger-red: #b02a2a;    /* 深茜红 (驳回/拒绝) */
  
  --clr-olive: #5e5d59;         /* 橄榄灰 (次级文本) */
  --clr-stone: #87867f;         /* 石板灰 (辅助文本) */
  --clr-charcoal: #4d4c48;      /* 木炭灰 */
  --clr-warm-sand: #e8e6dc;     /* 暖沙色 (空状态底色) */
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

/* ================= 表格重塑 (档案级排版) ================= */
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
  padding: 18px 0; /* 增大行高 */
  border-bottom: 1px solid var(--clr-border-cream);
  vertical-align: middle;
}
:deep(.editorial-table--enable-row-hover .el-table__body tr:hover > td.el-table__cell) {
  background-color: var(--clr-parchment);
}

/* 文本辅助类 */

.teaching-years {
  font-family: monospace;
  font-size: 20px;
  color: var(--clr-near-black);
}
.teaching-years .unit {
  font-family: var(--font-sans);
  font-size: 14px;
  color: var(--clr-stone);
}

/* ================= 证书图片预览 (相片质感) ================= */
.cert-wrapper {
  display: inline-block;
  padding: 4px;
  background-color: var(--clr-white);
  border: 1px solid var(--clr-border-warm);
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
  transition: all 0.2s;
}
.cert-wrapper:hover {
  box-shadow: 0 0 0 1px var(--clr-ring-warm);
  transform: translateY(-1px);
}
.cert-image {
  width: 56px;
  height: 56px;
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

/* 通过按钮：陶土红底，白色字，表示积极肯定 */
.btn-approve {
  background-color: var(--clr-terracotta);
  color: var(--clr-ivory);
}
.btn-approve:hover {
  opacity: 0.9;
  box-shadow: 0 2px 6px rgba(201, 100, 66, 0.2);
}

/* 驳回按钮：深茜红底透明，红色字，警示但不刺眼 */
.btn-reject {
  background-color: rgba(176, 42, 42, 0.08);
  color: var(--clr-danger-red);
}
.btn-reject:hover {
  background-color: rgba(176, 42, 42, 0.15);
  box-shadow: 0 0 0 1px rgba(176, 42, 42, 0.2);
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