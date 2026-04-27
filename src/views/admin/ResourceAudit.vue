<template>
  <div class="editorial-page-container">
    <el-card shadow="never" class="editorial-card">
      <template #header>
        <div class="card-header">
          <span class="header-title pending-title">
            <el-icon class="title-icon"><Files /></el-icon> 
            待审核教学资料
          </span>
        </div>
      </template>

      <el-table 
        :data="audit_list" 
        v-loading="loading" 
        style="width: 100%"
        class="editorial-table"
      >
        <el-table-column prop="resource_name" label="资料名称" min-width="200" show-overflow-tooltip class-name="text-main fw-500" />
        
        <el-table-column prop="course_title" label="所属课程" min-width="180" show-overflow-tooltip class-name="text-olive" />
        
        <el-table-column prop="tutor_name" label="上传家教" width="120" class-name="text-main" />
        
        <el-table-column label="资源类型" width="120">
          <template #default="scope">
            <div class="type-badge" :class="scope.row.resource_type === 1 ? 'type-video' : 'type-doc'">
              <el-icon v-if="scope.row.resource_type === 1" class="badge-icon"><VideoPlay /></el-icon>
              {{ scope.row.resource_type === 1 ? '视频课件' : '图文文档' }}
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="获取权限" width="120">
          <template #default="scope">
            <div class="status-badge" :class="scope.row.is_free === 1 ? 'status-free' : 'status-paid'">
              <span class="status-dot"></span>
              <span class="status-text">
                {{ scope.row.is_free === 1 ? '免费试看' : '付费专享' }}
              </span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column label="审核操作" width="240" fixed="right">
          <template #default="scope">
            <div class="action-buttons">
              <button class="btn-action btn-view" @click="preview_resource(scope.row)">
                <el-icon><View /></el-icon> 预览
              </button>
              <button class="btn-action btn-approve" @click="handle_audit(scope.row.id, 1)">通过</button>
              <button class="btn-action btn-reject" @click="handle_audit(scope.row.id, 2)">驳回</button>
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

    <!-- 在线预览弹窗 (沉浸式剧院模式) -->
    <el-dialog 
      v-model="preview_dialog_visible" 
      :title="`预览资源: ${current_resource.resource_name}`" 
      width="800px" 
      destroy-on-close
      class="editorial-dialog preview-dialog"
    >
      <div class="preview-container">
        <!-- 视频播放器 -->
        <div v-if="current_resource.resource_type === 1" class="media-box">
          <video 
            :src="current_resource.resource_url" 
            controls 
            autoplay 
            class="media-player"
          ></video>
        </div>
        <!-- 文档 iframe -->
        <div v-else class="media-box">
          <iframe 
            :src="current_resource.resource_url" 
            class="document-frame"
          ></iframe>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '../../utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Files, View, VideoPlay } from '@element-plus/icons-vue'

const loading = ref(true)
const audit_list = ref([])
const total = ref(0)
const query_params = ref({
  page_num: 1,
  page_size: 10
})

const preview_dialog_visible = ref(false)
const current_resource = ref({})

const get_list = async () => {
  loading.value = true
  const res = await request.get('/course_resource/admin/audit/list', { params: query_params.value })
  audit_list.value = res.data.records
  total.value = parseInt(res.data.total)
  loading.value = false
}

const preview_resource = (resource) => {
  current_resource.value = resource
  preview_dialog_visible.value = true
}

const handle_audit = (resource_id, status) => {
  const action_text = status === 1 ? '通过' : '驳回'
  const isApprove = status === 1

  ElMessageBox.confirm(
    `确定要 ${action_text} 该教学资料吗？`, 
    '审核确认',
    {
      confirmButtonText: `确认${action_text}`,
      cancelButtonText: '取消',
      // 根据操作类型注入品牌色或危险色
      confirmButtonClass: isApprove ? 'editorial-msgbox-btn-brand' : 'editorial-msgbox-btn-danger',
      cancelButtonClass: 'editorial-msgbox-btn-cancel',
      customClass: 'editorial-message-box',
    }
  ).then(async () => {
    await request.post('/course_resource/admin/audit/handle', null, {
      params: { resource_id, status }
    })
    ElMessage.success(`已${action_text}该资料`)
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
  --clr-near-black: #141413;    /* 墨黑主文本/暗场背景 */
  
  /* 高区分度色彩体系 */
  --clr-terracotta: #c96442;    /* 陶土红 (通过/试看) */
  --clr-danger-red: #b02a2a;    /* 深茜红 (驳回/危险) */
  --clr-amber-warm: #d98f3e;    /* 暖琥珀 (待审标识/付费高亮) */
  
  --clr-olive: #5e5d59;         /* 橄榄灰 (次级文本/文档) */
  --clr-stone: #87867f;         /* 石板灰 (无效) */
  --clr-charcoal: #4d4c48;      /* 木炭灰 (中性按钮) */
  --clr-warm-sand: #e8e6dc;     /* 暖沙色 (预览按钮) */
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
  display: flex;
  align-items: center;
}
/* 待处理标题应用暖琥珀色 */

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
  padding: 16px 0;
  border-bottom: 1px solid var(--clr-border-cream);
  vertical-align: middle;
}
:deep(.editorial-table--enable-row-hover .el-table__body tr:hover > td.el-table__cell) {
  background-color: var(--clr-parchment);
}

:deep(.text-main) { color: var(--clr-near-black); font-size: 14px; }
:deep(.fw-500) { font-weight: 500; font-family: var(--font-serif); font-size: 15px; }
:deep(.text-olive) { color: var(--clr-olive); font-size: 14px; }

/* ================= 资源类型与状态徽章 ================= */
/* 类型徽章 */
.type-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}
.badge-icon { margin-right: 4px; font-size: 14px; }
.type-video { background-color: var(--clr-near-black); color: var(--clr-ivory); }
.type-doc { background-color: var(--clr-border-warm); color: var(--clr-charcoal); }

/* 获取权限圆点徽章 */
.status-badge {
  display: inline-flex;
  align-items: center;
  font-size: 13px;
  font-weight: 500;
}
.status-dot { width: 6px; height: 6px; border-radius: 50%; margin-right: 8px; }
/* 免费试看：亲和力品牌色 */
.status-free .status-dot { background-color: var(--clr-terracotta); box-shadow: 0 0 4px rgba(201, 100, 66, 0.4); }
.status-free .status-text { color: var(--clr-terracotta); }
/* 付费专享：高价值琥珀色 */
.status-paid .status-dot { background-color: var(--clr-amber-warm); }
.status-paid .status-text { color: var(--clr-amber-warm); }

/* ================= 操作按钮实体化 ================= */
.action-buttons { 
  display: flex; 
  gap: 8px; 
}
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

/* 预览按钮：中性暖沙色 */
.btn-view { background-color: var(--clr-warm-sand); color: var(--clr-charcoal); }
.btn-view:hover { background-color: var(--clr-border-warm); box-shadow: 0 0 0 1px var(--clr-ring-warm); }

/* 通过按钮：陶土红 */
.btn-approve { background-color: var(--clr-terracotta); color: var(--clr-ivory); }
.btn-approve:hover { opacity: 0.9; box-shadow: 0 2px 6px rgba(201, 100, 66, 0.2); }

/* 驳回按钮：深茜红透明底 */
.btn-reject { background-color: rgba(176, 42, 42, 0.08); color: var(--clr-danger-red); }
.btn-reject:hover { background-color: rgba(176, 42, 42, 0.15); box-shadow: 0 0 0 1px rgba(176, 42, 42, 0.2); }

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

/* ================= 沉浸式暗场预览弹窗 ================= */
:deep(.preview-dialog) {
  border-radius: 16px;
  background-color: var(--clr-ivory);
  overflow: hidden;
}
:deep(.preview-dialog .el-dialog__header) {
  padding: 24px 32px 16px;
  margin-right: 0;
  border-bottom: 1px solid var(--clr-border-cream);
}
:deep(.preview-dialog .el-dialog__title) {
  font-family: var(--font-serif);
  font-weight: 500;
  font-size: 18px;
  color: var(--clr-near-black);
}
:deep(.preview-dialog .el-dialog__body) {
  padding: 0; /* 取消 padding 以使暗色背景填满盒子 */
}

/* 剧院模式黑色底座 */
.preview-container {
  background-color: var(--clr-near-black); /* 暖黑场 */
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.media-box {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  background-color: #000;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}
.media-player {
  width: 100%;
  max-height: 550px;
  display: block;
}
.document-frame {
  width: 100%;
  height: 550px;
  border: none;
  display: block;
  background-color: var(--clr-white); /* iframe 内部通常是白纸，给个白色托底 */
}

/* ================= 全局 MessageBox ================= */
:global(.editorial-message-box) {
  border-radius: 12px !important;
  background-color: #faf9f5 !important;
  border: 1px solid #e8e6dc !important;
}
:global(.editorial-msgbox-btn-brand) {
  background-color: #c96442 !important; 
  border: none !important;
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