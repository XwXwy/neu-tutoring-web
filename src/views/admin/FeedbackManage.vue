<template>
  <div class="editorial-page-container">
    <el-card shadow="never" class="editorial-card">
      <template #header>
        <div class="card-header">
          <span class="header-title">
            <el-icon class="title-icon"><Service /></el-icon> 
            意见反馈大厅
          </span>
        </div>
      </template>

      <el-table :data="feedback_list" v-loading="loading" style="width: 100%" class="editorial-table">
        <el-table-column label="反馈人" width="180">
          <template #default="scope">
            <div class="user-info">
              <span class="user-name">{{ scope.row.real_name }}</span>
              <span class="user-phone">{{ scope.row.phone }}</span>
            </div>
            <!-- 使用胶囊徽章区分身份 -->
            <div class="role-badge" :class="'role-badge-' + scope.row.role">
              <span class="role-dot"></span>
              <span class="role-text">
                {{ scope.row.role === 1 ? '家教老师' : '学生用户' }}
              </span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="content" label="反馈内容" min-width="260">
          <template #default="scope">
            <div class="content-text">{{ scope.row.content }}</div>
          </template>
        </el-table-column>
        
        <el-table-column prop="create_time" label="提交时间" width="160" class-name="text-olive" />
        
        <!-- 状态圆点重塑 -->
        <el-table-column label="处理状态" width="120">
          <template #default="scope">
            <div class="status-badge" :class="scope.row.status === 0 ? 'status-pending' : 'status-replied'">
              <span class="status-dot"></span>
              <span class="status-text">
                {{ scope.row.status === 0 ? '待处理' : '已回复' }}
              </span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="reply" label="平台回复内容" min-width="220">
          <template #default="scope">
            <span v-if="scope.row.status === 1" class="reply-text">{{ scope.row.reply }}</span>
            <span v-else class="empty-text">等待回复...</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <div class="action-buttons">
              <button 
                v-if="scope.row.status === 0" 
                class="btn-action btn-reply" 
                @click="open_reply_dialog(scope.row.id)"
              >
                立即回复
              </button>
              <span v-else class="status-disabled">处理完毕</span>
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

    <!-- 快速回复弹窗 -->
    <el-dialog 
      v-model="reply_dialog_visible" 
      title="回复用户反馈" 
      width="540px"
      class="editorial-dialog"
      destroy-on-close
    >
      <div class="dialog-subtitle">请选择快捷模板，或在下方输入自定义回复内容。</div>
      
      <div class="template-section">
        <span class="template-label">快捷模板</span>
        <div class="tags-container">
          <span 
            v-for="(tpl, index) in quick_templates" 
            :key="index" 
            class="quick-tag" 
            @click="use_template(tpl)"
          >
            {{ tpl }}
          </span>
        </div>
      </div>

      <el-input 
        v-model="reply_text" 
        type="textarea" 
        :rows="5" 
        placeholder="请输入详细的回复内容..." 
        class="writing-textarea"
      />
      
      <template #footer>
        <div class="dialog-footer">
          <el-button class="btn-secondary" @click="reply_dialog_visible = false">取消</el-button>
          <el-button class="btn-primary" @click="submit_reply">发送回复</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '../../utils/request'
import { ElMessage } from 'element-plus'
import { Service } from '@element-plus/icons-vue'

const loading = ref(true)
const feedback_list = ref([])
const total = ref(0)
const query_params = ref({ page_num: 1, page_size: 10 })

// 回复弹窗相关
const reply_dialog_visible = ref(false)
const current_feedback_id = ref(null)
const reply_text = ref('')

// 快捷回复模板数组
const quick_templates =[
  '已知悉，感谢您的宝贵建议！',
  '该问题已记录，我们将尽快修复。',
  '非常抱歉给您带来不便，我们会核实处理。',
  '您的建议已采纳，期待您继续支持平台！'
]

const get_list = async () => {
  loading.value = true
  const res = await request.get('/feedback/admin/page', { params: query_params.value })
  feedback_list.value = res.data.records
  total.value = parseInt(res.data.total)
  loading.value = false
}

const open_reply_dialog = (id) => {
  current_feedback_id.value = id
  reply_text.value = ''
  reply_dialog_visible.value = true
}

const use_template = (text) => {
  reply_text.value = text
}

const submit_reply = async () => {
  if (!reply_text.value.trim()) {
    ElMessage.warning('回复内容不能为空')
    return
  }
  await request.post('/feedback/admin/reply', null, {
    params: { id: current_feedback_id.value, reply: reply_text.value }
  })
  ElMessage.success('回复成功')
  reply_dialog_visible.value = false
  get_list()
}

onMounted(() => { get_list() })
</script>

<style scoped>
/* ================= 美学色板与变量定义 ================= */
* {
  --clr-parchment: #f5f4ed;     /* 羊皮纸暖白 (底色) */
  --clr-ivory: #faf9f5;         /* 卡片象牙白 */
  --clr-white: #ffffff;
  --clr-near-black: #141413;    /* 墨黑主文本 */
  
  /* 严格遵循高区分度色彩体系 */
  --clr-terracotta: #c96442;    /* 陶土红 (主操作/品牌色) */
  --clr-danger-red: #b02a2a;    /* 深茜红 (警示) */
  --clr-amber-warm: #d98f3e;    /* 暖琥珀 (待处理/警告/家教) */
  
  --clr-olive: #5e5d59;         /* 橄榄灰 (次级文本) */
  --clr-stone: #87867f;         /* 石板灰 (辅助文本/已完成) */
  --clr-charcoal: #4d4c48;      /* 木炭灰 (按钮) */
  --clr-warm-sand: #e8e6dc;     /* 暖沙色 (交互底色) */
  --clr-border-cream: #f0eee6;  /* 柔和边框 */
  --clr-border-warm: #e8e6dc;   /* 加深边框 */
  --clr-ring-warm: #d1cfc5;     /* 交互光环 */
  --clr-focus-blue: #3898ec;    /* 无障碍焦点 */
  
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
  display: flex;
  align-items: center;
}
.title-icon {
  color: var(--clr-terracotta);
  margin-right: 8px;
  font-size: 20px;
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
  padding: 20px 0; /* 加大行高，更像文本阅读 */
  border-bottom: 1px solid var(--clr-border-cream);
  vertical-align: top; /* 顶部对齐适合长文本 */
}
:deep(.editorial-table--enable-row-hover .el-table__body tr:hover > td.el-table__cell) {
  background-color: var(--clr-parchment);
}

/* 文本辅助类 */
:deep(.text-olive) { color: var(--clr-olive); font-size: 14px; }

/* 用户信息组 */
.user-info { margin-bottom: 8px; }
.user-name { font-weight: 500; color: var(--clr-near-black); font-size: 15px; margin-right: 6px; }
.user-phone { color: var(--clr-stone); font-size: 13px; font-family: monospace; }

/* 内容阅读区 */
.content-text {
  font-size: 14px;
  line-height: 1.6;
  color: var(--clr-near-black);
}
.reply-text {
  font-size: 14px;
  line-height: 1.6;
  color: var(--clr-terracotta); /* 回复内容使用品牌色，表示官方口吻 */
}
.empty-text {
  font-size: 13px;
  color: var(--clr-stone);
  font-style: italic;
}

/* ================= 身份徽章与状态徽章 ================= */
/* 角色徽章 (缩小版) */
.role-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px 2px 6px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  background: var(--clr-white);
  border: 1px solid var(--clr-border-warm);
}
.role-dot { width: 5px; height: 5px; border-radius: 50%; margin-right: 6px; }
/* 1 家教：暖琥珀 */
.role-badge-1 { border-color: rgba(217, 143, 62, 0.3); background: rgba(217, 143, 62, 0.05); }
.role-badge-1 .role-dot { background-color: var(--clr-amber-warm); }
.role-badge-1 .role-text { color: var(--clr-amber-warm); }
/* 2 学生：石板灰 */
.role-badge-2 { border-color: var(--clr-border-warm); background: var(--clr-parchment); }
.role-badge-2 .role-dot { background-color: var(--clr-stone); }
.role-badge-2 .role-text { color: var(--clr-olive); }

/* 状态徽章 (圆点指示器) */
.status-badge {
  display: inline-flex;
  align-items: center;
  font-size: 13px;
  font-weight: 500;
}
.status-dot { width: 6px; height: 6px; border-radius: 50%; margin-right: 8px; }
/* 待处理：需要行动，使用显眼的暖琥珀色 */
.status-pending .status-dot { background-color: var(--clr-amber-warm); box-shadow: 0 0 4px rgba(217, 143, 62, 0.4); }
.status-pending .status-text { color: var(--clr-amber-warm); }
/* 已回复：已完结退居二线，使用石板灰 */
.status-replied .status-dot { background-color: var(--clr-stone); }
.status-replied .status-text { color: var(--clr-stone); }

/* ================= 操作按钮实体化 ================= */
.action-buttons { display: flex; align-items: center; }
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
/* 立即回复按钮 */
.btn-reply {
  background-color: var(--clr-near-black);
  color: var(--clr-ivory);
}
.btn-reply:hover { background-color: var(--clr-charcoal); }

/* 不可用的纯文本 */
.status-disabled {
  font-size: 13px;
  color: var(--clr-stone);
  padding: 6px 0;
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

/* ================= 快捷回复弹窗 ================= */
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

/* 快捷模板组 */
.template-section {
  padding: 0 32px;
  margin-bottom: 20px;
}
.template-label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: var(--clr-stone);
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.quick-tag {
  cursor: pointer;
  padding: 6px 14px;
  border-radius: 16px;
  font-size: 13px;
  background-color: var(--clr-white);
  border: 1px solid var(--clr-border-warm);
  color: var(--clr-charcoal);
  transition: all 0.2s;
}
.quick-tag:hover {
  background-color: var(--clr-warm-sand);
  border-color: var(--clr-ring-warm);
  color: var(--clr-near-black);
}

/* 沉浸式文本区 */
.writing-textarea { padding: 0 0px; }
.writing-textarea :deep(.el-textarea__inner) {
  background-color: var(--clr-parchment);
  border: 1px solid var(--clr-border-warm);
  border-radius: 8px;
  padding: 16px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--clr-near-black);
  box-shadow: none;
  transition: all 0.2s;
}
.writing-textarea :deep(.el-textarea__inner:focus) {
  background-color: var(--clr-white);
  border-color: var(--clr-focus-blue);
  box-shadow: 0 0 0 1px var(--clr-focus-blue);
}

/* 底部按钮组 */
.dialog-footer {
  padding-top: 12px;
}
.btn-primary {
  background: var(--clr-terracotta) !important;
  color: var(--clr-ivory) !important;
  border: none;
  border-radius: 8px;
  padding: 8px 24px;
  font-weight: 500;
  box-shadow: var(--clr-terracotta) 0px 0px 0px 0px, var(--clr-terracotta) 0px 0px 0px 1px;
}
.btn-primary:hover { opacity: 0.9; }

.btn-secondary {
  background: var(--clr-warm-sand) !important;
  color: var(--clr-charcoal) !important;
  border: none;
  border-radius: 8px;
  padding: 8px 24px;
  box-shadow: var(--clr-warm-sand) 0px 0px 0px 0px, var(--clr-ring-warm) 0px 0px 0px 1px;
}
.btn-secondary:hover { background: var(--clr-border-warm) !important; }
</style>