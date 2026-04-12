<template>
  <div class="page-container">
    <el-row :gutter="20">
      
      <!-- 左侧：科目分类管理 -->
      <el-col :xs="24" :sm="8" :md="6">
        <el-card shadow="never" class="category-card">
          <template #header>
            <div class="card-header">
              <span>科目分类管理</span>
              <el-button type="success" size="small" icon="Plus" @click="open_category_dialog(null)">新建</el-button>
            </div>
          </template>
          
          <div class="category-list">
            <div 
              class="category-item" 
              :class="{ 'is-active': selected_category_id === null }"
              @click="select_category(null)"
            >
              <span>全部课程</span>
            </div>
            <div 
              v-for="cat in category_list" 
              :key="cat.id" 
              class="category-item"
              :class="{ 'is-active': selected_category_id === cat.id }"
              @click="select_category(cat.id)"
            >
              <span>{{ cat.name }}</span>
              <div class="actions">
                <el-icon class="action-icon" @click.stop="open_category_dialog(cat)"><Edit /></el-icon>
                <el-icon class="action-icon danger" @click.stop="delete_category(cat.id)"><Delete /></el-icon>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：课程列表 -->
      <el-col :xs="24" :sm="16" :md="18">
        <el-card shadow="never">
          <el-table :data="course_list" v-loading="loading" style="width: 100%">
            <!-- 复用之前的课程审核列表的列定义 -->
            <el-table-column prop="title" label="课程标题" min-width="150" show-overflow-tooltip />
            <el-table-column prop="tutor_name" label="发布家教" width="100" />
            <el-table-column prop="price" label="价格" width="100" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag v-if="scope.row.status === 0" type="info">已下架</el-tag>
                <el-tag v-if="scope.row.status === 1" type="success">已上架</el-tag>
                <el-tag v-if="scope.row.status === 2" type="warning">待审核</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="scope">
                <el-button type="primary" size="small" link @click="go_to_detail(scope.row.id)">查看详情</el-button>
                <el-button v-if="scope.row.status === 1" type="warning" size="small" link @click="require_modify(scope.row.id)">打回</el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <!-- 分页 -->
          <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
            <el-pagination
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
    <el-dialog v-model="category_dialog_visible" :title="category_form.id ? '编辑分类' : '新建分类'" width="400px">
      <el-form :model="category_form" label-position="top">
        <el-form-item label="分类名称" required>
          <el-input v-model="category_form.name" />
        </el-form-item>
        <el-form-item label="排序值">
          <el-input-number v-model="category_form.sort" :min="0" />
          <small style="color:#999; margin-left: 10px;">值越小越靠前</small>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="category_dialog_visible = false">取消</el-button>
        <el-button type="primary" @click="submit_category">保 存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import request from '../../utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'

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
  category_form.value = cat ? { ...cat } : { type: 1, sort: 0 } // type=1 代表科目
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
  get_category_list() // 刷新列表
}

const delete_category = (id) => {
  ElMessageBox.confirm('确定要删除这个分类吗？', '提示').then(async () => {
    await request.delete(`/category/admin/delete/${id}`)
    ElMessage.success('删除成功')
    // 如果删除的是当前选中的，就切回“全部”
    if (selected_category_id.value === id) {
      selected_category_id.value = null
    }
    get_category_list()
  })
}

// --- 右侧课程列表逻辑 ---
const course_list = ref([])
const total = ref(0)
const query_params = ref({
  page_num: 1,
  page_size: 10,
  category_id: null
})

// 监听左侧选择的变化，自动刷新右侧列表
watch(selected_category_id, (new_val) => {
  query_params.value.category_id = new_val
  query_params.value.page_num = 1 // 切换分类时重置到第一页
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
  ElMessageBox.confirm('确定要将该课程打回待审核状态吗？', '确认').then(async () => {
    await request.post('/course/admin/require_modify', null, { params: { course_id: id } })
    ElMessage.success('操作成功')
    get_course_list()
  })
}

onMounted(() => {
  get_category_list()
  get_course_list()
})
</script>

<style scoped>
.page-container {
  padding-top: 10px;
}
.category-card :deep(.el-card__body) {
  padding: 0;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}
.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  cursor: pointer;
  border-left: 3px solid transparent;
  transition: all 0.2s;
}
.category-item:hover {
  background-color: #f5f7fa;
}
.category-item.is-active {
  background-color: #ecf5ff;
  border-left-color: #409EFF;
  font-weight: bold;
}
.category-item .actions {
  display: none;
  gap: 15px;
}
.category-item:hover .actions {
  display: flex;
}
.action-icon {
  color: #909399;
  font-size: 14px;
}
.action-icon:hover {
  color: #409EFF;
}
.action-icon.danger:hover {
  color: #F56C6C;
}
</style>