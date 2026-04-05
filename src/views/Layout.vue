<template>
  <el-container class="layout-container-demo">
    <!-- 左侧菜单栏 -->
    <el-aside width="auto">
      <div class="logo-box">
        <img src="../assets/logo.png" alt="logo" class="logo-img" />
        <span v-if="!is_collapse" class="logo-text">家教管理后台</span>
      </div>
      <el-menu
        active-text-color="#409EFF"
        background-color="#001529"
        text-color="#ffffffb3"
        :default-active="$route.path"
        :collapse="is_collapse"
        :router="true"
        class="el-menu-vertical-demo"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataLine /></el-icon>
          <span>首页看板</span>
        </el-menu-item>
<!-- 仅管理员菜单 -->
<el-sub-menu v-if="user_info.role === 0" index="/admin">
  <template #title><el-icon><Setting /></el-icon><span>系统管理</span></template>
  <el-menu-item index="/user-manage"><el-icon><Search /></el-icon>用户管理</el-menu-item>
  <el-menu-item index="/tutor-audit"><el-icon><DocumentChecked /></el-icon>资质审核</el-menu-item>
  <el-menu-item index="/course-audit"><el-icon><DocumentChecked /></el-icon>课程审核</el-menu-item>
            <el-menu-item index="/resource-audit">
              <el-icon><VideoPlay /></el-icon>
              教学资料审核
            </el-menu-item>
</el-sub-menu>

<el-sub-menu v-if="user_info.role === 0" index="/management">
	<template #title><el-icon><Service /></el-icon><span>纠纷管理</span></template>
          <!-- ... 其他菜单 ... -->
          <el-menu-item index="/order-dispute">
            <el-icon><WarningFilled /></el-icon>
            退款纠纷处理
          </el-menu-item>
        </el-sub-menu>

<!-- 仅家教菜单 -->
<el-menu-item v-if="user_info.role === 1" index="/course-publish">
  <el-icon><Reading /></el-icon><span>发布课程</span>
</el-menu-item>
        <el-menu-item v-if="user_info.role === 1" index="/tutor-course">
          <el-icon><Management /></el-icon><span>我的课程</span>
        </el-menu-item>
        <el-menu-item v-if="user_info.role === 1" index="/order-manage">
          <el-icon><List /></el-icon><span>订单管理</span>
        </el-menu-item>
		
		<!-- 仅学生(role=2)可见的菜单 -->
		        <el-menu-item v-if="user_info.role === 2" index="/student-order">
		          <el-icon><Ticket /></el-icon>
		          <span>我的订单</span>
		        </el-menu-item>
				


<!-- 选课中心：仅学生(2)和管理员(0)可见，家教(1)不可见 -->
        <el-menu-item v-if="user_info.role === 2 || user_info.role === 0" index="/course-mall">
          <el-icon><Search /></el-icon>
          <span>选课中心</span>
        </el-menu-item>
		
		<el-menu-item v-if="user_info.role === 2" index="/study-center">
		  <el-icon><Management /></el-icon>
		  <span>学习中心</span>
		</el-menu-item>
		
		
		<el-menu-item v-if="user_info.role === 2" index="/ai-chat">
		  <el-icon><ChatDotRound /></el-icon>
		  <span>智能答疑</span>
		</el-menu-item>

      </el-menu>
    </el-aside>
	
	
	

    <el-container>
      <!-- 顶部导航栏 -->
      <el-header style="display: flex; align-items: center; justify-content: space-between;">
        <div class="toolbar">
          <el-icon @click="is_collapse = !is_collapse" class="collapse-icon"><Menu /></el-icon>
          <el-breadcrumb separator="/">
             <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
             <el-breadcrumb-item>{{ $route.meta.title || '详情页' }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
<el-dropdown>
          <!-- 动态绑定 user_info.avatar -->
          <el-avatar :size="32" :src="user_info.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'" />
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item>你好, {{ user_info.username }}</el-dropdown-item>
              <!-- 判断角色不等于 0 (管理员) 时显示个人中心 -->
              <el-dropdown-item v-if="user_info.role !== 0" @click="router.push('/profile')">个人中心</el-dropdown-item>
              <el-dropdown-item divided @click="handle_logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-header>

      <!-- 主内容区 -->
      <el-main>
        <el-scrollbar>
            <!-- 给子页面套上一层卡片，增加质感 -->
            <el-card shadow="never" style="border-radius: 8px;">
               <router-view></router-view>
            </el-card>
        </el-scrollbar>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const is_collapse = ref(false)
const router = useRouter()
const user_info = ref({})

// 专门抽取一个方法来加载本地存储的信息
const load_user_info = () => {
  const user_json = localStorage.getItem('userInfo')
  if (user_json) {
    user_info.value = JSON.parse(user_json)
  }
}

onMounted(() => {
  // 页面刚加载时读取一次
  load_user_info()
  // 重点：监听 Profile.vue 派发的 'user_info_updated' 事件
  window.addEventListener('user_info_updated', load_user_info)
})

onUnmounted(() => {
  // 组件销毁时移除监听，防止内存泄漏
  window.removeEventListener('user_info_updated', load_user_info)
})

const handle_logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('userInfo')
  router.push('/login')
}
</script>

<style scoped>
.layout-container-demo {
  height: 100%;
}
.el-aside {
  background-color: #001529;
  transition: width 0.3s;
}
.logo-box {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 60px;
  color: white;
  margin-right: 24px;
}
.logo-img {
  width: 32px;
  height: 32px;
  margin-right: 6px;
  margin-left: 12px;
}
.logo-text {
  margin-left: 10px;
  font-size: 18px;
  white-space: nowrap; /* 防止文字换行 */
}
.el-menu {
  border-right: none;
}
.el-menu-item.is-active {
  background-color: #409eff20 !important;
}
.el-header {
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, .08);
}
.toolbar {
  display: flex;
  align-items: center;
}
.collapse-icon {
  font-size: 22px;
  cursor: pointer;
  margin-right: 15px;
}
.el-main {
  background-color: #f0f2f5;
  padding: 16px;
}
</style>