<template>
  <div>
    <!-- 1. 搜索与操作区 -->
    <el-card shadow="never" style="margin-bottom: 16px;">
      <el-form :inline="true" :model="queryParams">
        <el-form-item label="用户名">
          <el-input v-model="queryParams.username" placeholder="请输入用户名" clearable />
        </el-form-item>
        <el-form-item label="真实姓名">
          <el-input v-model="queryParams.realName" placeholder="请输入真实姓名" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 2. 表格展示区 -->
    <el-card shadow="never">
      <el-table :data="userList" v-loading="loading" style="width: 100%">
        <el-table-column prop="id" label="ID" width="200" />
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="real_name" label="真实姓名" />
        <el-table-column prop="phone" label="手机号" />
        <el-table-column prop="role" label="角色">
          <template #default="scope">
            <el-tag v-if="scope.row.role === 0" type="danger">管理员</el-tag>
            <el-tag v-if="scope.row.role === 1" type="success">家教</el-tag>
            <el-tag v-if="scope.row.role === 2" type="info">用户</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态">
           <template #default="scope">
    <el-switch 
      v-model="scope.row.status" 
      :active-value="1" 
      :inactive-value="0"
      @change="handleStatusChange(scope.row)" 
    />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="scope">
            <el-button type="primary" size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="danger" size="small" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 3. 分页组件 -->
      <el-pagination
        style="margin-top: 20px; justify-content: flex-end;"
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        v-model:current-page="queryParams.pageNum"
        v-model:page-size="queryParams.pageSize"
        @size-change="getList"
        @current-change="getList"
      />
    </el-card>
  </div>
  
  <!-- 编辑对话框 -->
  <el-dialog v-model="editDialogVisible" title="编辑用户信息" width="500px">
    <el-form :model="editForm" label-width="100px">
      <el-form-item label="用户名">
        <el-input v-model="editForm.username" disabled />
      </el-form-item>
      <el-form-item label="真实姓名">
        <el-input v-model="editForm.real_name" />
      </el-form-item>
      <el-form-item label="手机号">
        <el-input v-model="editForm.phone" />
      </el-form-item>
      <el-form-item label="角色">
        <el-select v-model="editForm.role" placeholder="请选择角色" style="width: 100%">
          <el-option label="管理员" :value="0" />
          <el-option label="家教" :value="1" />
          <el-option label="用户" :value="2" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="editDialogVisible = false">取消</el-button>
      <el-button type="primary" @click="saveEdit">确 定</el-button>
    </template>
  </el-dialog>
  
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '../../utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'
const loading = ref(true) // 表格加载状态
const userList = ref([]) // 用户列表数据
const total = ref(0) // 总条数
const editDialogVisible = ref(false) // 控制弹窗显示
const editForm = ref({}) // 表单数据
// 查询参数
const queryParams = ref({
  pageNum: 1,
  pageSize: 10,
  username: '',
  realName: ''
})

// 获取用户列表的方法
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

// 搜索按钮点击事件
const handleSearch = () => {
  queryParams.value.pageNum = 1 // 搜索时从第一页开始
  getList()
}

// 重置搜索条件
const resetQuery = () => {
  queryParams.value.username = ''
  queryParams.value.realName = ''
  handleSearch()
}

// 修改用户状态
const handleStatusChange = async (row) => {
  try {
    // 调用后端更新接口
    await request.post('/sysUser/update', {
      id: row.id,
      status: row.status
    })
    ElMessage.success('状态更新成功')
  } catch (error) {
    // 如果失败了，把前端的状态切回来
    row.status = row.status === 1 ? 0 : 1
  }
}

// 删除用户
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除用户【${row.username}】吗？删除后不可恢复！`,
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    await request.delete(`/sysUser/${row.id}`)
    ElMessage.success('删除成功')
    getList() // 重新刷新列表
  }).catch(() => {
    // 点击取消，不做任何事
  })
}

// 点击编辑按钮
const handleEdit = (row) => {
  // 使用解构赋值 {...row} 是为了拷贝一份数据，避免修改弹窗时直接影响表格
  editForm.value = { ...row }
  editDialogVisible.value = true
}

// 保存修改
const saveEdit = async () => {
  await request.post('/sysUser/update', editForm.value)
  ElMessage.success('修改成功')
  editDialogVisible.value = false
  getList() // 刷新列表
}

// 组件挂载时自动加载第一页数据
onMounted(() => {
  getList()
})
</script>