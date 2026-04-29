<template>
	<el-container class="commercial-layout">
		<!-- 左侧菜单栏 (固定宽度 260px) -->
		<el-aside width="260px" class="commercial-aside">
			<!-- Logo 区 -->
			<div class="logo-box">
				<img src="../assets/logo.png" alt="logo" class="logo-img" />
				<span class="logo-text">知行家教服务平台</span>
			</div>

			<!-- 滚动菜单区 -->
			<el-scrollbar class="aside-scrollbar">
				<el-menu 
					active-text-color="#faf9f5" 
					background-color="transparent" 
					text-color="#b0aea5"
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
            <el-avatar :size="36" :src="user_info.avatar || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&s=128'" class="avatar-img" />
        </div>
        <template #dropdown>

            <el-dropdown-menu class="editorial-dropdown">
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
							<!-- <keep-alive> -->
								<component :is="Component" :key="route.path" />
							<!-- </keep-alive> -->
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
					<el-button class="btn-secondary" @click="feedback_dialog_visible = false">取消</el-button>
					<el-button class="btn-primary" :loading="submitting_feedback" @click="submit_feedback">提交反馈</el-button>
				</div>
			</el-form>

			<div class="history-header">
				<span class="history-title">历史反馈记录</span>
				<el-button link class="btn-refresh" @click="load_my_feedbacks">
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
						:color="item.status === 1 ? 'var(--clr-terracotta)' : 'var(--clr-olive)'" 
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
/* ================= 调色板 & 字体变量 ================= */
* {
	--clr-parchment: #f5f4ed;
	--clr-ivory: #faf9f5;
	--clr-white: #ffffff;
	--clr-near-black: #141413;
	--clr-dark-surface: #30302e;
	--clr-terracotta: #c96442;
    /* 【新增】为退出按钮定义明确的危险色 */
	--clr-danger-red: #b02a2a; 
	--clr-coral: #d97757;
	--clr-olive: #5e5d59;
	--clr-stone: #87867f;
	--clr-charcoal: #4d4c48;
	--clr-warm-sand: #e8e6dc;
	--clr-border-cream: #f0eee6;
	--clr-border-warm: #e8e6dc;
	--clr-warm-silver: #b0aea5;
	--clr-ring-warm: #d1cfc5;
	--clr-focus-blue: #3898ec;
	
	--font-serif: "Georgia", "Times New Roman", serif;
	--font-sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

/* ================= 全局布局 ================= */
.commercial-layout {
	height: 100vh;
	width: 100vw;
	overflow: hidden;
	background-color: var(--clr-parchment);
	font-family: var(--font-sans);
	color: var(--clr-near-black);
}

::-webkit-scrollbar { display: none; }

/* ================= 侧边栏设计 ================= */
.commercial-aside {
	background: var(--clr-near-black);
	display: flex;
	flex-direction: column;
	border-right: 1px solid var(--clr-dark-surface);
	z-index: 20;
}

.logo-box {
	display: flex;
	align-items: center;
	height: 64px;
	padding: 0 24px;
	background: var(--clr-near-black);
	border-bottom: 1px solid var(--clr-dark-surface);
}

.logo-img { width: 28px; height: 28px; }

.logo-text {
	margin-left: 12px;
	font-family: var(--font-serif);
	font-size: 18px;
	font-weight: 500;
	color: var(--clr-ivory);
	letter-spacing: 0.5px;
}

.aside-scrollbar { flex: 1; overflow: hidden; }

/* 菜单基础样式 */
.commercial-menu {
	border-right: none;
	padding: 16px 12px 24px 12px;
}

.menu-group-title {
	font-size: 12px;
	font-weight: 500;
	color: var(--clr-stone);
	margin: 24px 0 8px 12px;
	letter-spacing: 0.5px;
}

/* 菜单项排版 */
:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
	height: 40px;
	line-height: 40px;
	border-radius: 8px;
	margin-bottom: 4px;
	font-size: 14px;
	color: var(--clr-warm-silver) !important;
}

:deep(.el-menu-item:hover),
:deep(.el-sub-menu__title:hover) {
	background-color: var(--clr-dark-surface) !important;
	color: var(--clr-ivory) !important;
}

:deep(.el-menu-item.is-active) {
	background-color: var(--clr-dark-surface) !important;
	color: var(--clr-ivory) !important;
	font-weight: 500;
	position: relative;
}

:deep(.el-menu-item.is-active::before) {
	content: '';
	position: absolute;
	left: -12px;
	top: 50%;
	transform: translateY(-50%);
	height: 20px;
	width: 3px;
	background-color: var(--clr-terracotta);
	border-radius: 0 4px 4px 0;
}

/* ================= 侧边栏底部反馈卡片 ================= */
.aside-footer {
	padding: 16px;
	background: var(--clr-near-black);
	border-top: 1px solid var(--clr-dark-surface);
}

.feedback-card {
	display: flex;
	align-items: center;
	padding: 12px;
	background: var(--clr-dark-surface);
	border: 1px solid transparent;
	border-radius: 8px;
	cursor: pointer;
	transition: all 0.2s ease;
}

.feedback-card:hover {
	box-shadow: var(--clr-dark-surface) 0px 0px 0px 0px, var(--clr-ring-warm) 0px 0px 0px 1px;
}

.feedback-icon {
	width: 32px;
	height: 32px;
	border-radius: 6px;
	background: rgba(201, 100, 66, 0.15);
	color: var(--clr-terracotta);
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 16px;
	margin-right: 12px;
}

.feedback-text h4 {
	margin: 0;
	font-size: 13px;
	color: var(--clr-ivory);
	font-weight: 500;
	font-family: var(--font-serif);
}

.feedback-text p {
	margin: 2px 0 0 0;
	font-size: 11px;
	color: var(--clr-warm-silver);
}

/* ================= 右侧主区域 ================= */
.main-container {
	display: flex;
	flex-direction: column;
	flex: 1;
	overflow: hidden;
}

/* 顶部 Header */
.commercial-header {
	height: 64px;
	background: var(--clr-ivory);
	border-bottom: 1px solid var(--clr-border-warm);
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 32px;
	z-index: 10;
}

/* 面包屑 */
:deep(.el-breadcrumb__inner) {
	color: var(--clr-stone) !important;
	font-weight: 400;
}
:deep(.current-page .el-breadcrumb__inner) {
	color: var(--clr-near-black) !important;
	font-weight: 500;
	font-family: var(--font-serif);
	font-size: 1.1rem;
}

/* 用户信息区 */
.user-profile {
	display: flex;
	align-items: center;
	cursor: pointer;
	padding: 6px;
	border-radius: 12px;
	transition: background 0.2s;
}
.user-profile:hover { background: var(--clr-border-cream); }

.user-info {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	margin-right: 12px;
}
.user-name {
	font-size: 14px;
	font-weight: 500;
	color: var(--clr-near-black);
}
.user-role {
	font-size: 12px;
	color: var(--clr-olive);
	margin-top: 2px;
	display: flex;
	align-items: center;
}

.role-dot {
	width: 6px;
	height: 6px;
	border-radius: 50%;
	margin-right: 6px;
}
.role-0 { background-color: var(--clr-terracotta); }
.role-1 { background-color: var(--clr-coral); }
.role-2 { background-color: var(--clr-olive); }

.avatar-img {
	border: 1px solid var(--clr-border-warm);
}

/* ================= 主体内容区 ================= */
.commercial-main {
	padding: 0;
	background-color: var(--clr-parchment);
	height: calc(100vh - 64px);
	overflow: hidden;
}
.main-scrollbar { height: 100%; }
.content-wrapper {
	padding: 32px;
	min-height: calc(100vh - 128px);
}

/* 全局卡片重塑 */
:deep(.el-card) {
	background-color: var(--clr-ivory) !important;
	border: 1px solid var(--clr-border-cream) !important;
	border-radius: 12px;
	box-shadow: rgba(0,0,0,0.03) 0px 4px 24px !important;
}
:deep(.el-card__header) {
	border-bottom: 1px solid var(--clr-border-cream);
	background-color: var(--clr-ivory);
	padding: 20px 24px;
}

/* ================= 按钮系统重构 ================= */
.btn-primary {
	background: var(--clr-terracotta) !important;
	color: var(--clr-ivory) !important;
	border: none !important;
	padding: 8px 16px;
	border-radius: 8px;
	font-weight: 500;
	box-shadow: var(--clr-terracotta) 0px 0px 0px 0px, var(--clr-terracotta) 0px 0px 0px 1px;
}
.btn-primary:hover { opacity: 0.9; }

.btn-secondary {
	background: var(--clr-warm-sand) !important;
	color: var(--clr-charcoal) !important;
	border: none !important;
	padding: 8px 16px;
	border-radius: 8px;
	box-shadow: var(--clr-warm-sand) 0px 0px 0px 0px, var(--clr-ring-warm) 0px 0px 0px 1px;
}
.btn-secondary:hover { background: var(--clr-border-warm) !important; }

/* ================= 意见反馈弹窗 ================= */
:deep(.commercial-dialog) {
	border-radius: 16px;
	background-color: var(--clr-ivory);
	box-shadow: rgba(0,0,0,0.1) 0px 10px 40px;
}
:deep(.commercial-dialog .el-dialog__header) {
	padding: 32px 32px 0;
	margin-right: 0;
}
:deep(.commercial-dialog .el-dialog__title) {
	font-family: var(--font-serif);
	font-weight: 500;
	font-size: 25px;
	color: var(--clr-near-black);
}
.dialog-subtitle {
	font-size: 15px;
	color: var(--clr-olive);
	margin-top: 8px;
	margin-bottom: 32px;
	padding: 0 32px;
}
.feedback-form { padding: 0 32px; }

.custom-textarea :deep(.el-textarea__inner) {
	background-color: var(--clr-parchment);
	border: 1px solid var(--clr-border-warm);
	border-radius: 8px;
	padding: 16px;
	font-size: 15px;
	color: var(--clr-near-black);
	box-shadow: none;
}
.custom-textarea :deep(.el-textarea__inner:focus) {
	background-color: var(--clr-white);
	border-color: var(--clr-focus-blue);
	box-shadow: 0 0 0 1px var(--clr-focus-blue);
}
.form-actions {
	display: flex;
	justify-content: flex-end;
	gap: 12px;
	margin-top: 24px;
}

/* 历史记录区 */
.history-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 24px 32px 12px;
	border-top: 1px solid var(--clr-border-cream);
	margin-top: 32px;
	background: var(--clr-ivory);
}
.history-title {
	font-family: var(--font-serif);
	font-size: 18px;
	font-weight: 500;
	color: var(--clr-near-black);
}
.btn-refresh { color: var(--clr-olive) !important; font-weight: 400; }
.btn-refresh:hover { color: var(--clr-near-black) !important; }

.history-list-container {
	padding: 0 32px 32px;
	background: var(--clr-ivory);
	max-height: 280px;
	overflow-y: auto;
}
.history-list-container::-webkit-scrollbar { width: 6px; }
.history-list-container::-webkit-scrollbar-thumb { background: var(--clr-border-warm); border-radius: 8px; }

.commercial-timeline { padding-top: 12px; }

.timeline-card {
	background: var(--clr-parchment);
	border: 1px solid var(--clr-border-cream);
	border-radius: 8px;
	padding: 16px;
}
.user-msg {
	font-size: 15px;
	color: var(--clr-near-black);
}
.reply-msg {
	margin-top: 12px;
	padding-top: 12px;
	border-top: 1px solid var(--clr-border-warm);
	font-size: 14px;
	color: var(--clr-terracotta);
}
.reply-label { font-weight: 500; }
.wait-msg {
	margin-top: 12px;
	font-size: 13px;
	color: var(--clr-olive);
	display: flex;
	align-items: center;
	gap: 6px;
}

/* ================= 用户下拉菜单 (【最终修正版】) ================= */
/* 使用 :global 穿透作用域，确保能覆盖 Element Plus 的全局样式 */
:global(.editorial-dropdown) {
  border-radius: 12px !important;
  border: 1px solid var(--clr-border-warm) !important;
  background-color: var(--clr-ivory) !important;
  box-shadow: rgba(0, 0, 0, 0.05) 0px 4px 24px !important;
  padding: 4px !important;
}

/* 我们自己的菜单项样式 */
:global(.editorial-dropdown .el-dropdown-menu__item) {
  border-radius: 8px !important;
  color: var(--clr-olive) !important;
  padding: 8px 12px !important;
  margin: 0 4px !important;
}

/* 【关键修复】:hover 和 :focus 状态必须同时覆盖，且背景色不能是 none */
:global(.editorial-dropdown .el-dropdown-menu__item:not(.is-disabled):focus),
:global(.editorial-dropdown .el-dropdown-menu__item:not(.is-disabled):hover) {
  background-color: var(--clr-border-cream) !important;
  color: var(--clr-near-black) !important;
}

/* 退出按钮的专属样式 */
:global(.editorial-dropdown .logout-item) {
  color: var(--clr-danger-red) !important;
}
:global(.editorial-dropdown .logout-item:not(.is-disabled):focus),
:global(.editorial-dropdown .logout-item:not(.is-disabled):hover) {
  background-color: rgba(176, 42, 42, 0.08) !important;
  color: var(--clr-danger-red) !important;
}

/* 顶部的用户信息区 */
.dropdown-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--clr-border-cream);
  margin-bottom: 4px;
}
.dropdown-name { 
  margin: 0; 
  font-size: 14px; 
  font-weight: 500; 
  color: var(--clr-near-black); 
}
.dropdown-email { 
  margin: 4px 0 0 0; 
  font-size: 12px; 
  color: var(--clr-stone); 
}

/* 分割线样式 */
:global(.editorial-dropdown .el-dropdown-menu__item.is-divided::before) {
    content: '';
    height: 1px;
    display: block;
    background-color: var(--clr-border-cream);
    position: absolute;
    left: 8px;
    right: 8px;
    top: 0;
}
</style>