<template>
	<el-container class="commercial-layout">
		<!-- 左侧菜单栏 (固定宽度 260px) -->
		<el-aside width="260px" class="commercial-aside">
			<!-- Logo 区 -->
			<div class="logo-box">
				<img src="../assets/logo.png" alt="logo" class="logo-img" />
				<span class="logo-text">家教管理后台</span>
			</div>

			<!-- 滚动菜单区 -->
			<el-scrollbar class="aside-scrollbar">
				<el-menu 
					active-text-color="#ffffff" 
					background-color="transparent" 
					text-color="#94a3b8"
					:default-active="$route.path" 
					:router="true" 
					class="commercial-menu"
				>
					<div class="menu-group-title">概览</div>
					<el-menu-item index="/dashboard">
						<el-icon><DataLine /></el-icon>
						<span>首页看板</span>
					</el-menu-item>

					<!-- ================= 管理员菜单 ================= -->
					<template v-if="user_info.role === 0">
						<div class="menu-group-title">系统运维</div>
						<el-sub-menu index="/system_menu">
							<template #title>
								<el-icon><Setting /></el-icon>
								<span>系统管理</span>
							</template>
							<el-menu-item index="/user-manage">用户管理</el-menu-item>
							<el-menu-item index="/notice-manage">公告发布管理</el-menu-item>
							<el-menu-item index="/course-category-manage">课程与分类管理</el-menu-item>
							<el-menu-item index="/feedback-manage">意见反馈处理</el-menu-item>
						</el-sub-menu>

						<div class="menu-group-title">业务管控</div>
						<el-sub-menu index="/audit_menu">
							<template #title>
								<el-icon><Platform /></el-icon>
								<span>平台审核</span>
							</template>
							<el-menu-item index="/tutor-audit">资质审核</el-menu-item>
							<el-menu-item index="/course-audit">课程审核</el-menu-item>
							<el-menu-item index="/resource-audit">教学资料审核</el-menu-item>
						</el-sub-menu>

						<el-sub-menu index="/dispute_menu">
							<template #title>
								<el-icon><Service /></el-icon>
								<span>纠纷管理</span>
							</template>
							<el-menu-item index="/comment-audit">评价与举报审核</el-menu-item>
							<el-menu-item index="/order-dispute">退款纠纷处理</el-menu-item>
						</el-sub-menu>
					</template>

					<!-- ================= 家教菜单 ================= -->
					<template v-if="user_info.role === 1">
						<div class="menu-group-title">教学工作台</div>
						<el-menu-item index="/course-publish">
							<el-icon><Reading /></el-icon><span>发布课程</span>
						</el-menu-item>
						<el-menu-item index="/tutor-course">
							<el-icon><Management /></el-icon><span>我的课程</span>
						</el-menu-item>
						<el-menu-item index="/tutor-schedule">
							<el-icon><Calendar /></el-icon><span>日程管理</span>
						</el-menu-item>
						
						<div class="menu-group-title">业务管理</div>
						<el-menu-item index="/order-manage">
							<el-icon><List /></el-icon><span>订单管理</span>
						</el-menu-item>
						<el-menu-item index="/tutor-wallet">
							<el-icon><Money /></el-icon><span>财务管理</span>
						</el-menu-item>
					</template>

					<!-- ================= 学生菜单 ================= -->
					<template v-if="user_info.role === 2">
						<div class="menu-group-title">学习中心</div>
						<el-menu-item index="/course-mall">
							<el-icon><Search /></el-icon><span>选课中心</span>
						</el-menu-item>
						<el-menu-item index="/study-center">
							<el-icon><Management /></el-icon><span>我的学习</span>
						</el-menu-item>
						<el-menu-item index="/ai-chat">
							<el-icon><ChatDotRound /></el-icon><span>智能答疑</span>
						</el-menu-item>

						<div class="menu-group-title">交易与服务</div>
						<el-menu-item index="/student-order">
							<el-icon><Ticket /></el-icon><span>我的订单</span>
						</el-menu-item>
						<el-menu-item index="/student-bill">
							<el-icon><Money /></el-icon><span>费用明细</span>
						</el-menu-item>
					</template>
					<!-- 管理员选课中心占位 -->
					<el-menu-item v-if="user_info.role === 0" index="/course-mall">
						<el-icon><Search /></el-icon><span>选课中心预览</span>
					</el-menu-item>
				</el-menu>
			</el-scrollbar>

			<!-- 底部悬浮区域 (意见反馈固定在此) -->
			<div class="aside-footer" v-if="user_info.role === 2 || user_info.role === 1">
				<div class="feedback-card" @click="open_feedback_dialog">
					<div class="feedback-icon"><el-icon><Microphone /></el-icon></div>
					<div class="feedback-text">
						<h4>意见反馈</h4>
						<p>遇到问题？告诉我们</p>
					</div>
				</div>
			</div>
		</el-aside>

		<el-container class="main-container">
			<!-- 顶部导航栏 -->
			<el-header class="commercial-header">
				<div class="header-left">
					<!-- 动态多级面包屑 -->
					<el-breadcrumb separator="/">
						<el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
						<el-breadcrumb-item v-if="$route.meta.parent" :to="{ path: $route.meta.parent.path }">
							{{ $route.meta.parent.title }}
						</el-breadcrumb-item>
						<el-breadcrumb-item class="current-page">{{ $route.meta.title || '详情' }}</el-breadcrumb-item>
					</el-breadcrumb>
				</div>
				
				<div class="header-right">
					<el-dropdown trigger="click" placement="bottom-end">
						<div class="user-profile">
							<div class="user-info">
								<span class="user-name">{{ user_info.real_name }}</span>
								<span class="user-role">
									<span class="role-dot" :class="'role-' + user_info.role"></span>
									{{ user_info.role === 0 ? '系统管理员' : (user_info.role === 1 ? '家教老师' : '学生用户') }}
								</span>
							</div>
							<el-avatar :size="38" :src="user_info.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'" class="avatar-img" />
						</div>
						<template #dropdown>
							<el-dropdown-menu class="commercial-dropdown">
								<div class="dropdown-header">
									<p class="dropdown-name">{{ user_info.username }}</p>
									<p class="dropdown-email">{{ user_info.city || '未填写城市' }}</p>
								</div>
								<el-dropdown-item v-if="user_info.role !== 0" @click="router.push('/profile')">
									<el-icon><User /></el-icon>个人中心
								</el-dropdown-item>
								<el-dropdown-item divided @click="handle_logout" class="logout-item">
									<el-icon><SwitchButton /></el-icon>退出系统
								</el-dropdown-item>
							</el-dropdown-menu>
						</template>
					</el-dropdown>
				</div>
			</el-header>

			<!-- 主内容区 -->
			<el-main class="commercial-main">
				<el-scrollbar class="main-scrollbar" view-class="main-view">
					<div class="content-wrapper">
						<router-view v-slot="{ Component, route }">

								<keep-alive>
									<component :is="Component" :key="route.path" />
								</keep-alive>

						</router-view>
					</div>
				</el-scrollbar>
			</el-main>
		</el-container>

		<!-- 全局反馈弹窗 (优化 UI) -->
		<el-dialog v-model="feedback_dialog_visible" title="意见与建议反馈" width="550px" class="commercial-dialog" :show-close="true" destroy-on-close>
			<div class="dialog-subtitle">您的每一个建议都是我们进步的动力</div>
			<el-form label-position="top" class="feedback-form">
				<el-form-item>
					<el-input 
						v-model="feedback_content" 
						type="textarea" 
						:rows="5" 
						maxlength="500" 
						show-word-limit
						placeholder="请详细描述您遇到的问题或改进建议..." 
						class="custom-textarea"
					/>
				</el-form-item>
				<div class="form-actions">
					<el-button round @click="feedback_dialog_visible = false">取消</el-button>
					<el-button type="primary" round :loading="submitting_feedback" @click="submit_feedback">提交反馈</el-button>
				</div>
			</el-form>

			<div class="history-header">
				<span class="history-title">历史反馈记录</span>
				<el-button link type="primary" @click="load_my_feedbacks">
					<el-icon><Refresh /></el-icon> 刷新
				</el-button>
			</div>

			<div class="history-list-container">
				<el-empty v-if="my_feedback_list.length === 0" description="暂无反馈记录" :image-size="60" />
				<el-timeline v-else class="commercial-timeline">
					<el-timeline-item 
						v-for="item in my_feedback_list" 
						:key="item.id" 
						:timestamp="item.create_time"
						:type="item.status === 1 ? 'success' : 'primary'" 
						placement="top"
					>
						<div class="timeline-card">
							<div class="user-msg">{{ item.content }}</div>
							<div v-if="item.status === 1" class="reply-msg">
								<span class="reply-label">平台回复：</span>{{ item.reply }}
							</div>
							<div v-else class="wait-msg">
								<el-icon class="is-loading"><Loading /></el-icon> 等待管理员处理...
							</div>
						</div>
					</el-timeline-item>
				</el-timeline>
			</div>
		</el-dialog>
	</el-container>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '../utils/request'
import { ElMessage } from 'element-plus'
import { DataLine, Setting, Search, Platform, Service, Reading, Management, Calendar, List, Money, Ticket, ChatDotRound, Microphone, User, SwitchButton, Refresh, Loading } from '@element-plus/icons-vue'

const router = useRouter()
const user_info = ref({})
const feedback_dialog_visible = ref(false)
const feedback_content = ref('')
const submitting_feedback = ref(false)
const my_feedback_list = ref([])

const load_my_feedbacks = async () => {
    try {
        const res = await request.get('/feedback/my_list')
        my_feedback_list.value = res.data
    } catch (error) {
        console.error("加载历史反馈失败:", error)
    }
}

const open_feedback_dialog = () => {
    feedback_content.value = ''
    feedback_dialog_visible.value = true
    load_my_feedbacks()
}

const submit_feedback = async () => {
    if (!feedback_content.value.trim()) {
        ElMessage.warning('反馈内容不能为空')
        return
    }

    submitting_feedback.value = true
    try {
        await request.post('/feedback/submit', { content: feedback_content.value })
        ElMessage.success('反馈已提交，感谢您的支持！')
        load_my_feedbacks()
        feedback_content.value = ''
    } catch (error) {
        console.error('反馈提交失败:', error)
    } finally {
        submitting_feedback.value = false
    }
}

const load_user_info = () => {
    const user_json = localStorage.getItem('userInfo')
    if (user_json) {
        user_info.value = JSON.parse(user_json)
    }
}

onMounted(() => {
    load_user_info()
    window.addEventListener('user_info_updated', load_user_info)
})

onUnmounted(() => {
    window.removeEventListener('user_info_updated', load_user_info)
})

const handle_logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    router.push('/login')
}
</script>

<style scoped>
/* ================= 全局布局 ================= */
.commercial-layout {
	height: 100vh;
	width: 100vw;
	overflow: hidden;
	background-color: #f8fafc; /* 主体极浅灰背景 */
	font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

/* 隐藏原生全局滚动条 */
::-webkit-scrollbar {
	display: none;
}

/* ================= 侧边栏设计 ================= */
.commercial-aside {
	background: #0B1121; /* 极深邃的藏青黑 */
	display: flex;
	flex-direction: column;
	border-right: 1px solid #1e293b;
	z-index: 20;
}

.logo-box {
	display: flex;
	align-items: center;
	height: 64px;
	padding: 0 24px;
	background: #0B1121;
}

.logo-img {
	width: 28px;
	height: 28px;
}

.logo-text {
	margin-left: 12px;
	font-size: 16px;
	font-weight: 600;
	color: #f8fafc;
	letter-spacing: 0.5px;
}

.aside-scrollbar {
	flex: 1;
	overflow: hidden;
}

/* 菜单基础样式 */
.commercial-menu {
	border-right: none;
	padding: 12px 12px 24px 12px;
}

/* 菜单分组标题 */
.menu-group-title {
	font-size: 12px;
	font-weight: 500;
	color: #475569;
	margin: 20px 0 8px 12px;
	text-transform: uppercase;
	letter-spacing: 1px;
}

/* 菜单项商业化设计 */
:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
	height: 44px;
	line-height: 44px;
	border-radius: 6px;
	margin-bottom: 4px;
	font-size: 14px;
	transition: all 0.2s ease;
}

:deep(.el-menu-item:hover),
:deep(.el-sub-menu__title:hover) {
	background-color: #1e293b !important;
	color: #e2e8f0 !important;
}

/* 选中的高亮状态：无大面积背景，采用精美边框与浅色背景 */
:deep(.el-menu-item.is-active) {
	background-color: #1e293b !important;
	color: #ffffff !important;
	font-weight: 600;
	position: relative;
}

:deep(.el-menu-item.is-active::before) {
	content: '';
	position: absolute;
	left: -12px;
	top: 50%;
	transform: translateY(-50%);
	height: 20px;
	width: 4px;
	background-color: #3b82f6; /* 亮蓝色指示条 */
	border-radius: 0 4px 4px 0;
}

/* ================= 侧边栏底部反馈卡片 ================= */
.aside-footer {
	padding: 16px;
	background: #0B1121;
	border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.feedback-card {
	display: flex;
	align-items: center;
	padding: 12px;
	background: linear-gradient(145deg, #1e293b, #0f172a);
	border: 1px solid #334155;
	border-radius: 8px;
	cursor: pointer;
	transition: all 0.3s ease;
}

.feedback-card:hover {
	border-color: #3b82f6;
	transform: translateY(-2px);
	box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.feedback-icon {
	width: 36px;
	height: 36px;
	border-radius: 8px;
	background: rgba(59, 130, 246, 0.1);
	color: #3b82f6;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 18px;
	margin-right: 12px;
}

.feedback-text h4 {
	margin: 0;
	font-size: 13px;
	color: #f1f5f9;
	font-weight: 500;
}

.feedback-text p {
	margin: 2px 0 0 0;
	font-size: 11px;
	color: #64748b;
}

/* ================= 右侧主区域 ================= */
.main-container {
	display: flex;
	flex-direction: column;
	flex: 1;
	overflow: hidden;
}

/* 现代化顶部 Header */
.commercial-header {
	height: 64px;
	background: rgba(255, 255, 255, 0.9);
	backdrop-filter: blur(10px);
	border-bottom: 1px solid #e2e8f0;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 24px;
	z-index: 10;
}

/* 面包屑美化 */
:deep(.el-breadcrumb__inner) {
	color: #64748b !important;
	font-weight: 400;
}
:deep(.current-page .el-breadcrumb__inner) {
	color: #0f172a !important;
	font-weight: 600;
}

/* 用户信息区 */
.user-profile {
	display: flex;
	align-items: center;
	cursor: pointer;
	padding: 4px 6px;
	border-radius: 40px;
	transition: background 0.2s;
}
.user-profile:hover {
	background: #f1f5f9;
}
.user-info {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	margin-right: 12px;
}
.user-name {
	font-size: 14px;
	font-weight: 600;
	color: #1e293b;
	line-height: 1.2;
}
.user-role {
	font-size: 12px;
	color: #64748b;
	margin-top: 4px;
	display: flex;
	align-items: center;
}

/* 角色身份小圆点 */
.role-dot {
	width: 6px;
	height: 6px;
	border-radius: 50%;
	margin-right: 6px;
}
.role-0 { background-color: #ef4444; box-shadow: 0 0 4px rgba(239, 68, 68, 0.4); } /* 管理员红 */
.role-1 { background-color: #3b82f6; box-shadow: 0 0 4px rgba(59, 130, 246, 0.4); } /* 教师蓝 */
.role-2 { background-color: #10b981; box-shadow: 0 0 4px rgba(16, 185, 129, 0.4); } /* 学生绿 */

.avatar-img {
	border: 2px solid #ffffff;
	box-shadow: 0 2px 6px rgba(0,0,0,0.08);
}

/* 用户下拉菜单美化 */
.dropdown-header {
	padding: 12px 16px;
	border-bottom: 1px solid #f1f5f9;
	margin-bottom: 4px;
	background: #f8fafc;
	border-radius: 6px 6px 0 0;
}
.dropdown-name {
	margin: 0;
	font-size: 14px;
	font-weight: 600;
	color: #1e293b;
}
.dropdown-email {
	margin: 4px 0 0 0;
	font-size: 12px;
	color: #94a3b8;
}
.logout-item {
	color: #ef4444 !important;
}

/* ================= 主体内容区 ================= */
.commercial-main {
	padding: 0;
	background-color: #f8fafc;
	height: calc(100vh - 64px);
	overflow: hidden;
}

.main-scrollbar {
	height: 100%;
}

.content-wrapper {
	padding: 24px;
	min-height: calc(100vh - 112px); /* 减去 Header 和 padding */
}



:deep(.el-card) {
	border: 1px solid #e2e8f0;
	border-radius: 12px;
	box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02) !important;
}
:deep(.el-card__header) {
	border-bottom: 1px solid #f1f5f9;
	background-color: #ffffff;
	border-radius: 12px 12px 0 0;
}

/* ================= 意见反馈弹窗商业化 ================= */
:deep(.commercial-dialog) {
	border-radius: 16px;
	overflow: hidden;
}
:deep(.commercial-dialog .el-dialog__header) {
	padding: 24px 24px 0;
	margin-right: 0;
	border-bottom: none;
}
:deep(.commercial-dialog .el-dialog__title) {
	font-weight: 600;
	font-size: 18px;
	color: #1e293b;
}
.dialog-subtitle {
	font-size: 13px;
	color: #64748b;
	margin-top: 4px;
	margin-bottom: 24px;
	padding: 0 24px;
}
.feedback-form {
	padding: 0 24px;
}
.custom-textarea :deep(.el-textarea__inner) {
	background-color: #f8fafc;
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	padding: 12px;
	font-size: 14px;
	box-shadow: none;
	transition: all 0.2s;
}
.custom-textarea :deep(.el-textarea__inner:focus) {
	background-color: #ffffff;
	border-color: #3b82f6;
	box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}
.form-actions {
	display: flex;
	justify-content: flex-end;
	gap: 12px;
	margin-top: 20px;
}

/* 历史记录区 */
.history-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 20px 24px 12px;
	border-top: 1px solid #f1f5f9;
	margin-top: 24px;
	background: #fafafa;
}
.history-title {
	font-size: 14px;
	font-weight: 600;
	color: #334155;
}
.history-list-container {
	padding: 0 24px 24px;
	background: #fafafa;
	max-height: 280px;
	overflow-y: auto;
}

/* 隐藏历史记录原生滚动条 */
.history-list-container::-webkit-scrollbar {
	width: 4px;
}
.history-list-container::-webkit-scrollbar-thumb {
	background: #cbd5e1;
	border-radius: 4px;
}

.commercial-timeline {
	padding-top: 8px;
}
.timeline-card {
	background: #ffffff;
	border: 1px solid #e2e8f0;
	border-radius: 8px;
	padding: 12px 16px;
	box-shadow: 0 1px 2px rgba(0,0,0,0.02);
}
.user-msg {
	font-size: 14px;
	color: #334155;
	line-height: 1.5;
}
.reply-msg {
	margin-top: 10px;
	padding-top: 10px;
	border-top: 1px dashed #e2e8f0;
	font-size: 13px;
	color: #0f766e;
	line-height: 1.5;
}
.reply-label {
	font-weight: 600;
}
.wait-msg {
	margin-top: 10px;
	font-size: 12px;
	color: #f59e0b;
	display: flex;
	align-items: center;
	gap: 6px;
}
</style>