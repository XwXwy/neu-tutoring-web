<template>
  <div class="editorial-page-container">
    <el-card shadow="never" class="editorial-card">
      <template #header>
        <div class="card-header">
          <span class="header-title">我发布的课程</span>
        </div>
      </template>

      <el-table 
        :data="course_list" 
        v-loading="loading"
        class="editorial-table"
      >
        <el-table-column label="课程标题" min-width="220">
          <template #default="scope">
            <span class="clickable-title" @click="go_to_detail(scope.row.id)">
              {{ scope.row.title }}
            </span>
          </template>
        </el-table-column>
        
        <el-table-column prop="price" label="价格(元)" width="120">
          <template #default="scope">
            <span class="price-text">¥ {{ scope.row.price }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="type" label="类型" width="120">
          <template #default="scope">
            <div class="type-indicator" :class="scope.row.type === 1 ? 'type-online' : 'type-offline'">
              <span class="type-dot"></span>
              <span class="type-text">{{ scope.row.type === 1 ? '在线视频' : '线下上门' }}</span>
            </div>
          </template>
        </el-table-column>
        
        <el-table-column prop="status" label="课程状态" width="140">
          <template #default="scope">
            <div class="status-badge" :class="'status-' + scope.row.status">
              <span class="status-dot"></span>
              <span class="status-text">
                {{ scope.row.status === 0 ? '已下架' : (scope.row.status === 1 ? '正常上架' : '审核中') }}
              </span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="280" fixed="right">
          <template #default="scope">
            <div class="action-buttons">
              <!-- 核心操作：资料管理 -->
              <button 
                class="btn-action btn-manage" 
                :disabled="scope.row.status === 0"
                @click="open_resource_drawer(scope.row)"
              >
                <el-icon><FolderOpened /></el-icon> 资料管理
              </button>
              
              <!-- 次级操作：编辑与删除 -->
              <button class="btn-text-action" @click="open_edit_dialog(scope.row)">
                编辑
              </button>
              <button class="btn-action btn-delete" @click="delete_course(scope.row.id)">
                删除
              </button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- ================= 资料管理抽屉 (Drawer) ================= -->
    <el-drawer 
      v-model="drawer_visible" 
      :title="`管理资料 - ${current_course.title}`" 
      size="55%"
      class="editorial-drawer"
    >
      <div class="drawer-content-wrapper">
        
        <!-- 上传新资料表单 -->
        <div class="upload-section">
          <h4 class="section-subtitle serif-title"><el-icon><Upload /></el-icon> 上传新教学资料</h4>
          
          <el-form :model="resource_form" label-position="top" class="editorial-form form-stacked">
            <el-form-item label="资料名称" required>
              <el-input v-model="resource_form.resource_name" placeholder="如：第一章知识点串讲视频" class="warm-input" />
            </el-form-item>
            
            <el-row :gutter="24">
              <el-col :span="12">
                <el-form-item label="资料格式" required>
                  <el-radio-group v-model="resource_form.resource_type" class="warm-radio-group horizontal-radio">
                    <el-radio :label="0" class="radio-item">图文课件</el-radio>
                    <el-radio :label="1" class="radio-item">教学视频</el-radio>
                  </el-radio-group>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="获取权限" required>
                  <el-switch 
                    v-model="resource_form.is_free" 
                    :active-value="1" 
                    :inactive-value="0" 
                    active-text="设为免费试看" 
                    class="warm-switch"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-form-item label="选择文件上传" required>
              <el-upload
                class="file-uploader"
                action="http://localhost:8080/file/upload"
                :show-file-list="false"
                :on-success="handle_upload_success"
                :before-upload="before_upload"
              >
                <div v-if="resource_form.resource_url" class="upload-success-state">
                  <el-icon class="success-icon"><Check /></el-icon>
                  <span>文件已就绪，可提交申请</span>
                </div>
                <div v-else class="upload-empty-state">
                  <el-icon><Plus /></el-icon>
                  <span>点击将文件上传至云端</span>
                </div>
              </el-upload>
            </el-form-item>

            <div class="submit-action-bar">
              <button class="btn-brand-large" :class="{ 'is-disabled': uploading }" :disabled="uploading" @click.prevent="submit_resource">
                {{ uploading ? '文件上传中...' : '提交资料审核' }}
              </button>
            </div>
          </el-form>
        </div>

        <div class="divider-line"></div>

        <!-- 已上传资料列表 -->
        <div class="list-section">
          <h4 class="section-subtitle serif-title">已上传的资料列表</h4>
          <el-table 
            :data="resource_list" 
            class="editorial-table inner-table"
          >
            <el-table-column prop="resource_name" label="资料名称" class-name="text-main fw-500" />
            <el-table-column prop="resource_type" label="类型" width="100">
              <template #default="scope">
                <div class="type-badge" :class="scope.row.resource_type === 1 ? 'type-video' : 'type-doc'">
                  {{ scope.row.resource_type === 1 ? '视频' : '课件' }}
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="审核状态" width="120">
               <template #default="scope">
                <div class="status-badge" :class="'status-' + scope.row.status">
                  <span class="status-dot"></span>
                  <span class="status-text">
                    {{ scope.row.status === 0 ? '待审核' : (scope.row.status === 1 ? '已通过' : '被驳回') }}
                  </span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" align="right">
              <template #default="scope">
                <button class="btn-text-danger" @click="delete_resource(scope.row.id)">删除</button>
              </template>
            </el-table-column>
          </el-table>
        </div>
        
      </div>
    </el-drawer>
	
	<!-- ================= 编辑课程对话框 ================= -->
    <el-dialog 
      v-model="edit_dialog_visible" 
      title="修改课程信息" 
      width="600px"
      class="editorial-dialog"
      destroy-on-close
    >
      <div class="dialog-subtitle">修改将导致课程重新进入审核队列。</div>
      <el-form :model="edit_form" label-position="top" class="editorial-form form-stacked">
        <el-form-item label="课程标题" required>
          <el-input v-model="edit_form.title" class="warm-input" />
        </el-form-item>
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="课程科目" required>
              <el-select v-model="edit_form.category_id" style="width:100%" popper-class="warm-select-popper">
                <el-option label="数学" :value="1" />
                <el-option label="英语" :value="2" />
                <el-option label="物理" :value="3" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="价格(元/课时)" required>
              <el-input-number v-model="edit_form.price" :precision="2" :min="0" class="warm-input-number" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="授课方式" required>
          <el-radio-group v-model="edit_form.type" class="warm-radio-group horizontal-radio">
            <el-radio :label="0" class="radio-item">线下上门</el-radio>
            <el-radio :label="1" class="radio-item">在线视频课</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="课程封面图" required>
          <el-upload
            class="cover-uploader"
            action="http://localhost:8080/file/upload"
            :show-file-list="false"
            :on-success="handle_edit_cover_success"
          >
            <img v-if="edit_form.cover_image" :src="edit_form.cover_image" class="cover-img" />
            <div v-else class="upload-placeholder">
              <el-icon><Picture /></el-icon>
              <span>点击上传新封面</span>
            </div>
          </el-upload>
        </el-form-item>
        <el-form-item label="课程详情介绍" required>
          <el-input 
            v-model="edit_form.description" 
            type="textarea" 
            :rows="5" 
            class="warm-textarea" 
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button class="btn-secondary" @click="edit_dialog_visible = false">取消修改</el-button>
          <el-button class="btn-brand" @click="submit_edit">提交重新审核</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '../../utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'
import { FolderOpened, Upload, Check, Picture, Plus } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const go_to_detail = (course_id) => {
  router.push({ path: '/course-detail', query: { course_id } })
}
const loading = ref(true)
const course_list = ref([])
const edit_dialog_visible = ref(false)
const edit_form = ref({})

const open_edit_dialog = (course) => {
  edit_form.value = JSON.parse(JSON.stringify(course))
  edit_dialog_visible.value = true
}

const handle_edit_cover_success = (res) => {
  if (res.code === 200) {
    edit_form.value.cover_image = res.data
  }
}

const submit_edit = async () => {
  await request.post('/course/tutor/update', edit_form.value)
  ElMessage.success('课程已提交更新，请等待平台重新审核')
  edit_dialog_visible.value = false
  get_course_list()
}

const delete_course = (course_id) => {
  ElMessageBox.confirm(
    '确定要永久删除这门课程吗？删除后，所有关联的教学资料也将一并失效！',
    '危险操作警告',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '保留',
      confirmButtonClass: 'editorial-msgbox-btn-danger',
      cancelButtonClass: 'editorial-msgbox-btn-cancel',
      customClass: 'editorial-message-box',
    }
  ).then(async () => {
    await request.delete(`/course/tutor/delete/${course_id}`)
    ElMessage.success('课程删除成功')
    get_course_list()
  }).catch(() => {})
}

const get_course_list = async () => {
  loading.value = true
  try {
    const res = await request.get('/course/tutor/my_courses') 
    course_list.value = res.data
  } catch(error) {} finally {
    loading.value = false
  }
}

// ---- 资料抽屉相关逻辑 ----
const drawer_visible = ref(false)
const current_course = ref({})
const resource_list = ref([])
const uploading = ref(false)

const resource_form = ref({
  course_id: null,
  resource_name: '',
  resource_type: 0, 
  is_free: 0,       
  resource_url: ''
})

const open_resource_drawer = async (course) => {
  current_course.value = course
  drawer_visible.value = true
  
  resource_form.value = {
    course_id: course.id,
    resource_name: '',
    resource_type: 0,
    is_free: 0,
    resource_url: ''
  }
  
  load_resource_list(course.id)
}

const load_resource_list = async (course_id) => {
  const res = await request.get('/course_resource/list_by_course', {
    params: { course_id }
  })
  resource_list.value = res.data
}

const handle_upload_success = (res) => {
  if (res.code === 200) {
    resource_form.value.resource_url = res.data
    ElMessage.success('文件已上传至云端，可提交申请')
  } else {
    ElMessage.error(res.message)
  }
  uploading.value = false
}

const before_upload = (file) => {
  const is_video = file.type.startsWith('video/')
  const is_doc = ['application/pdf', 'application/msword', 'application/vnd.ms-powerpoint'].includes(file.type)
  
  if (!is_video && !is_doc) {
    ElMessage.error('只能上传视频或 PDF/Word/PPT 格式的课件!')
    return false
  }

  const is_lt100m = file.size / 1024 / 1024 < 100 
  if (!is_lt100m) {
    ElMessage.error('单个文件大小不能超过 100MB!')
    return false
  }
  
  uploading.value = true
  return true
}

const submit_resource = async () => {
  if (!resource_form.value.resource_name) {
    ElMessage.warning('请填写资料名称')
    return
  }
  if (!resource_form.value.resource_url) {
    ElMessage.warning('请先上传文件')
    return
  }
  
  await request.post('/course_resource/add', resource_form.value)
  ElMessage.success('资料提交成功，等待平台审核')
  
  load_resource_list(current_course.value.id)
  resource_form.value.resource_name = ''
  resource_form.value.resource_url = ''
}

const delete_resource = (resource_id) => {
  ElMessageBox.confirm(
    '确定要永久删除这个教学资料吗？', 
    '确认删除',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '保留',
      confirmButtonClass: 'editorial-msgbox-btn-danger',
      cancelButtonClass: 'editorial-msgbox-btn-cancel',
      customClass: 'editorial-message-box',
    }
  ).then(async () => {
    await request.post('/course_resource/delete', null, { params: { resource_id } })
    ElMessage.success('删除成功')
    load_resource_list(current_course.value.id)
  }).catch(() => {})
}

onMounted(() => {
  get_course_list()
})
</script>

<style scoped>
/* ================= 美学色板与变量定义 ================= */
* {
  --clr-parchment: #f5f4ed;     
  --clr-ivory: #faf9f5;         
  --clr-white: #ffffff;
  --clr-near-black: #141413;    
  
  --clr-terracotta: #c96442;    /* 上架/通过/核心按钮 */
  --clr-danger-red: #b02a2a;    /* 驳回/删除/危险操作 */
  --clr-amber-warm: #d98f3e;    /* 审核中/待定/在线类型 */
  
  --clr-olive: #5e5d59;         
  --clr-stone: #87867f;         /* 下架/失效 */
  --clr-charcoal: #4d4c48;      /* 资料管理按钮/文本按钮 */
  
  --clr-warm-sand: #e8e6dc;     
  --clr-border-cream: #f0eee6;  
  --clr-border-warm: #e8e6dc;   
  --clr-focus-blue: #3898ec;
  
  --font-serif: "Georgia", "Times New Roman", serif;
  --font-sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.editorial-page-container {
  font-family: var(--font-sans);
  padding-top: 8px;
  padding-bottom: 40px;
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

/* ================= 课程主表格 ================= */
.editorial-table {
  --el-table-border-color: var(--clr-border-cream);
  --el-table-header-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  background-color: transparent;
}
:deep(.editorial-table th.el-table__cell) { font-family: var(--font-serif); font-size: 15px; font-weight: 500; color: var(--clr-near-black); border-bottom: 2px solid var(--clr-border-warm); padding: 16px 0; }
:deep(.editorial-table td.el-table__cell) { padding: 16px 0; border-bottom: 1px solid var(--clr-border-cream); vertical-align: middle; }
:deep(.editorial-table--enable-row-hover .el-table__body tr:hover > td.el-table__cell) { background-color: var(--clr-parchment); }

:deep(.text-main) { color: var(--clr-near-black); font-size: 15px; }
:deep(.fw-500) { font-weight: 500; font-family: var(--font-serif); }

.clickable-title {
  font-family: var(--font-serif);
  font-size: 16px;
  font-weight: 500;
  color: var(--clr-near-black);
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-block;
}
.clickable-title:hover { color: var(--clr-terracotta); transform: translateX(2px); }

.price-text { font-family: monospace; font-size: 16px; font-weight: 500; color: var(--clr-charcoal); }

/* 类型圆点指示器 */
.type-indicator { display: inline-flex; align-items: center; font-size: 13px; }
.type-dot { width: 5px; height: 5px; border-radius: 50%; margin-right: 6px; }
.type-online .type-dot { background-color: var(--clr-amber-warm); }
.type-online .type-text { color: var(--clr-amber-warm); }
.type-offline .type-dot { background-color: var(--clr-stone); }
.type-offline .type-text { color: var(--clr-stone); }

/* 状态徽章 (拉开色彩差距) */
.status-badge { display: inline-flex; align-items: center; padding: 4px 10px 4px 8px; border-radius: 16px; font-size: 12px; font-weight: 500; background: var(--clr-white); border: 1px solid var(--clr-border-warm); }
.status-dot { width: 6px; height: 6px; border-radius: 50%; margin-right: 6px; }
/* 1 正常上架 */
.status-1 { border-color: rgba(201, 100, 66, 0.3); background: rgba(201, 100, 66, 0.05); }
.status-1 .status-dot { background-color: var(--clr-terracotta); }
.status-1 .status-text { color: var(--clr-terracotta); }
/* 2 审核中 */
.status-2 { border-color: rgba(217, 143, 62, 0.3); background: rgba(217, 143, 62, 0.05); }
.status-2 .status-dot { background-color: var(--clr-amber-warm); }
.status-2 .status-text { color: var(--clr-amber-warm); }
/* 0 已下架 / 2 驳回 */
.status-0, .status-reject { border-color: var(--clr-border-warm); }
.status-0 .status-dot, .status-reject .status-dot { background-color: var(--clr-stone); }
.status-0 .status-text, .status-reject .status-text { color: var(--clr-stone); }

/* 资料特有：2 被驳回 (危险红) */
.status-badge.status-2-res { border-color: rgba(176, 42, 42, 0.3); background: rgba(176, 42, 42, 0.05); }
.status-badge.status-2-res .status-dot { background-color: var(--clr-danger-red); }
.status-badge.status-2-res .status-text { color: var(--clr-danger-red); }

/* ================= 按钮体系 ================= */
.action-buttons { display: flex; align-items: center; gap: 8px; }
.btn-action {
  cursor: pointer; border-radius: 6px; padding: 6px 12px; font-size: 13px; font-weight: 500; font-family: inherit; transition: all 0.2s ease; border: 1px solid transparent; display: inline-flex; align-items: center;
}
.btn-action .el-icon { margin-right: 4px; }

/* 资料管理 (核心次级) */
.btn-manage { background-color: var(--clr-warm-sand); color: var(--clr-charcoal); }
.btn-manage:hover:not(:disabled) { background-color: var(--clr-border-warm); box-shadow: 0 0 0 1px var(--clr-ring-warm); }
.btn-manage:disabled { opacity: 0.5; cursor: not-allowed; }

/* 删除 (深茜红透明底) */
.btn-delete { background-color: rgba(176, 42, 42, 0.08); color: var(--clr-danger-red); }
.btn-delete:hover { background-color: rgba(176, 42, 42, 0.15); box-shadow: 0 0 0 1px rgba(176, 42, 42, 0.2); }

/* 文本操作 (编辑) */
.btn-text-action { background: transparent; border: none; color: var(--clr-olive); font-size: 13px; font-weight: 500; cursor: pointer; padding: 6px 8px; border-radius: 4px; transition: all 0.2s; }
.btn-text-action:hover { color: var(--clr-near-black); background-color: var(--clr-border-cream); }
.btn-text-danger { background: transparent; border: none; color: var(--clr-stone); font-size: 13px; font-weight: 500; cursor: pointer; padding: 6px 8px; border-radius: 4px; transition: all 0.2s; }
.btn-text-danger:hover { color: var(--clr-danger-red); background-color: rgba(176, 42, 42, 0.08); }


/* ================= 资料管理抽屉 (Drawer) ================= */
:deep(.editorial-drawer) {
  background-color: var(--clr-parchment);
}
:deep(.editorial-drawer .el-drawer__header) {
  margin-bottom: 0;
  padding: 24px 32px;
  border-bottom: 1px solid var(--clr-border-cream);
  background-color: var(--clr-ivory);
  color: var(--clr-near-black);
  font-family: var(--font-serif);
  font-size: 20px;
  font-weight: 500;
}
:deep(.editorial-drawer .el-drawer__body) { padding: 0; }

.drawer-content-wrapper { height: 100%; display: flex; flex-direction: column; overflow-y: auto; }
.upload-section { padding: 32px; background-color: var(--clr-ivory); }
.list-section { padding: 32px; flex: 1; }

.serif-title { font-family: var(--font-serif); font-size: 18px; font-weight: 500; color: var(--clr-near-black); margin: 0 0 24px 0; display: flex; align-items: center; }
.serif-title .el-icon { margin-right: 8px; color: var(--clr-stone); }

.divider-line { height: 1px; width: 100%; background-color: var(--clr-border-cream); }

/* 内部表格修饰 */
.inner-table { background-color: transparent; }
:deep(.inner-table th.el-table__cell) { background-color: transparent !important; }

/* 资料类型徽章 */
.type-badge { display: inline-flex; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
.type-video { background-color: var(--clr-near-black); color: var(--clr-ivory); }
.type-doc { background-color: var(--clr-border-warm); color: var(--clr-charcoal); }

/* ================= 统一表单元素重塑 ================= */
.editorial-form :deep(.el-form-item__label) { font-weight: 500; color: var(--clr-olive); }
.form-stacked { padding-bottom: 16px; }

/* 统一暖色输入框 */
.warm-input :deep(.el-input__wrapper) { background-color: var(--clr-parchment); border: 1px solid var(--clr-border-warm); border-radius: 8px; box-shadow: none !important; transition: all 0.2s; }
.warm-input :deep(.el-input__wrapper.is-focus) { background-color: var(--clr-white); box-shadow: 0 0 0 1px var(--clr-focus-blue) !important; }
.warm-textarea :deep(.el-textarea__inner) { background-color: var(--clr-parchment); border: 1px solid var(--clr-border-warm); border-radius: 8px; padding: 12px; font-size: 14px; color: var(--clr-near-black); box-shadow: none !important; }
.warm-textarea :deep(.el-textarea__inner:focus) { background-color: var(--clr-white); box-shadow: 0 0 0 1px var(--clr-focus-blue) !important; }
.warm-input-number { width: 100% !important; }
.warm-input-number :deep(.el-input__wrapper) { background-color: var(--clr-parchment); border: 1px solid var(--clr-border-warm); border-radius: 8px; box-shadow: none !important; }

/* 单选组横向排列 */
.warm-radio-group { display: flex; width: 100%; }
.horizontal-radio :deep(.el-radio) {
  flex: 1; margin-right: 12px !important; border: 1px solid var(--clr-border-warm) !important; border-radius: 8px; padding: 12px 16px; height: auto; background-color: var(--clr-parchment); transition: all 0.2s;
}
.horizontal-radio :deep(.el-radio:last-child) { margin-right: 0 !important; }
.horizontal-radio :deep(.el-radio.is-checked) { border-color: var(--clr-terracotta) !important; background-color: var(--clr-white); }
.horizontal-radio :deep(.el-radio__input.is-checked .el-radio__inner) { border-color: var(--clr-terracotta); background: var(--clr-terracotta); }
.horizontal-radio :deep(.el-radio__label) { color: var(--clr-charcoal); font-weight: 500; }

/* Switch 开关颜色定制 */
.warm-switch :deep(.el-switch__core) { border-color: var(--clr-border-warm); background-color: var(--clr-stone); }
.warm-switch.is-checked :deep(.el-switch__core) { border-color: var(--clr-terracotta); background-color: var(--clr-terracotta); }
.warm-switch :deep(.el-switch__label.is-active) { color: var(--clr-terracotta); font-weight: 500; }

/* ================= 附件/封面虚线上传框 (抽屉与弹窗共用) ================= */
.file-uploader :deep(.el-upload),
.cover-uploader :deep(.el-upload) {
  border: 1px dashed var(--clr-stone);
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 100%;
  background-color: var(--clr-parchment);
  transition: all 0.2s ease;
}
.cover-uploader :deep(.el-upload) { width: 180px; height: 180px; }
.file-uploader :deep(.el-upload) { height: 120px; }

.file-uploader :deep(.el-upload:hover),
.cover-uploader :deep(.el-upload:hover) {
  border-color: var(--clr-terracotta);
  background-color: var(--clr-white);
}
.cover-img { width: 100%; height: 100%; object-fit: cover; display: block; }

.upload-placeholder, .upload-empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  width: 100%; height: 100%; color: var(--clr-olive); font-size: 13px;
}
.upload-placeholder .el-icon, .upload-empty-state .el-icon { font-size: 28px; margin-bottom: 8px; color: var(--clr-stone); }

.upload-success-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  width: 100%; height: 100%; color: var(--clr-terracotta); font-size: 14px; font-weight: 500;
  background-color: rgba(201, 100, 66, 0.05); border: 1px solid var(--clr-terracotta); border-radius: 8px;
}
.success-icon { font-size: 32px; margin-bottom: 8px; }

/* 抽屉大按钮 */
.submit-action-bar { margin-top: 32px; }
.btn-brand-large {
  width: 100%; background: var(--clr-terracotta); color: var(--clr-ivory); border: none; border-radius: 8px; padding: 14px 0; font-size: 16px; font-weight: 500; cursor: pointer; transition: all 0.2s; box-shadow: var(--clr-terracotta) 0px 0px 0px 0px, var(--clr-terracotta) 0px 0px 0px 1px;
}
.btn-brand-large:hover:not(.is-disabled) { opacity: 0.9; transform: translateY(-1px); }
.btn-brand-large.is-disabled { opacity: 0.6; cursor: not-allowed; }

/* ================= 编辑弹窗 ================= */
:deep(.editorial-dialog) { border-radius: 16px; background-color: var(--clr-ivory); }
:deep(.editorial-dialog .el-dialog__header) { padding: 32px 32px 0; margin-right: 0; }
:deep(.editorial-dialog .el-dialog__title) { font-family: var(--font-serif); font-weight: 500; font-size: 22px; color: var(--clr-near-black); }
:deep(.editorial-dialog .el-dialog__body) { padding: 24px 32px; }
.dialog-subtitle { font-size: 14px; color: var(--clr-olive); margin-top: -16px; margin-bottom: 24px; }
.dialog-footer { padding-top: 12px; }

:global(.warm-select-popper) { border-radius: 8px !important; border: 1px solid var(--clr-border-warm) !important; }
:global(.warm-select-popper .el-select-dropdown__item.selected) { color: var(--clr-terracotta) !important; font-weight: 500; }

.btn-brand { background: var(--clr-terracotta) !important; color: var(--clr-ivory) !important; border: none; border-radius: 8px; padding: 8px 24px; font-weight: 500; box-shadow: var(--clr-terracotta) 0px 0px 0px 0px, var(--clr-terracotta) 0px 0px 0px 1px; }
.btn-secondary { background: var(--clr-warm-sand) !important; color: var(--clr-charcoal) !important; border: none; border-radius: 8px; padding: 8px 24px; }

/* 全局 MessageBox */
:global(.editorial-message-box) { border-radius: 12px !important; background-color: #faf9f5 !important; border: 1px solid #e8e6dc !important; }
:global(.editorial-msgbox-btn-danger) { background-color: #b02a2a !important; border: none !important; }
:global(.editorial-msgbox-btn-cancel) { background-color: #e8e6dc !important; color: #4d4c48 !important; border: none !important; }
</style>