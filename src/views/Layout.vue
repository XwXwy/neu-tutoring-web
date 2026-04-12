<template>
	<el-container class="layout-container-demo">
		<!-- 左侧菜单栏 -->
		<el-aside width="auto">
			<div class="logo-box">
				<img src="../assets/logo.png" alt="logo" class="logo-img" />
				<span v-if="!is_collapse" class="logo-text">家教管理后台</span>
			</div>
			<el-menu active-text-color="#409EFF" background-color="#001529" text-color="#ffffffb3"
				:default-active="$route.path" :collapse="is_collapse" :router="true" class="el-menu-vertical-demo">
				<el-menu-item index="/dashboard">
					<el-icon>
						<DataLine />
					</el-icon>
					<span>首页看板</span>
				</el-menu-item>
<!-- ================= 仅管理员菜单 ================= -->
        
        <!-- 1. 系统管理 -->
        <el-sub-menu v-if="user_info.role === 0" index="/system_menu">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>系统管理</span>
          </template>
          <el-menu-item index="/user-manage">
            <el-icon><Search /></el-icon>用户管理
          </el-menu-item>
          <el-menu-item index="/notice-manage">
            <el-icon><Notification /></el-icon>公告发布管理
          </el-menu-item>
          <el-menu-item index="/course-category-manage">
            <el-icon><Tickets /></el-icon>课程与分类管理
          </el-menu-item>
          <el-menu-item index="/feedback-manage">
            <el-icon><Service /></el-icon>意见反馈处理
          </el-menu-item>
        </el-sub-menu>

        <!-- 2. 平台审核 -->
        <el-sub-menu v-if="user_info.role === 0" index="/audit_menu">
          <template #title>
            <el-icon><Platform /></el-icon>
            <span>平台审核</span>
          </template>
          <el-menu-item index="/tutor-audit">
            <el-icon><DocumentChecked /></el-icon>资质审核
          </el-menu-item>
          <el-menu-item index="/course-audit">
            <el-icon><DocumentChecked /></el-icon>课程审核
          </el-menu-item>
          <el-menu-item index="/resource-audit">
            <el-icon><VideoPlay /></el-icon>教学资料审核
          </el-menu-item>
        </el-sub-menu>

        <!-- 3. 纠纷管理 -->
        <el-sub-menu v-if="user_info.role === 0" index="/dispute_menu">
          <template #title>
            <el-icon><Service /></el-icon>
            <span>纠纷管理</span>
          </template>
          <el-menu-item index="/comment-audit">
            <el-icon><Filter /></el-icon>评价与举报审核
          </el-menu-item>
          <el-menu-item index="/order-dispute">
            <el-icon><WarningFilled /></el-icon>退款纠纷处理
          </el-menu-item>
        </el-sub-menu>

				<!-- 仅家教菜单 -->
				<el-menu-item v-if="user_info.role === 1" index="/course-publish">
					<el-icon>
						<Reading />
					</el-icon><span>发布课程</span>
				</el-menu-item>
				<el-menu-item v-if="user_info.role === 1" index="/tutor-course">
					<el-icon>
						<Management />
					</el-icon><span>我的课程</span>
				</el-menu-item>
				<el-menu-item v-if="user_info.role === 1" index="/tutor-schedule">
					<el-icon>
						<Calendar />
					</el-icon>
					<span>日程管理</span>
				</el-menu-item>
				<el-menu-item v-if="user_info.role === 1" index="/order-manage">
					<el-icon>
						<List />
					</el-icon><span>订单管理</span>
				</el-menu-item>
				<el-menu-item v-if="user_info.role === 1" index="/tutor-wallet">
					<el-icon>
						<Money />
					</el-icon><span>财务管理</span>
				</el-menu-item>
				<!-- 仅学生(role=2)可见的菜单 -->
				<el-menu-item v-if="user_info.role === 2" index="/student-order">
					<el-icon>
						<Ticket />
					</el-icon>
					<span>我的订单</span>
				</el-menu-item>

				<el-menu-item v-if="user_info.role === 2" index="/student-bill">
					<el-icon>
						<Money />
					</el-icon>
					<span>费用明细</span>
				</el-menu-item>



				<!-- 选课中心：仅学生(2)和管理员(0)可见，家教(1)不可见 -->
				<el-menu-item v-if="user_info.role === 2 || user_info.role === 0" index="/course-mall">
					<el-icon>
						<Search />
					</el-icon>
					<span>选课中心</span>
				</el-menu-item>

				<el-menu-item v-if="user_info.role === 2" index="/study-center">
					<el-icon>
						<Management />
					</el-icon>
					<span>学习中心</span>
				</el-menu-item>


				<el-menu-item v-if="user_info.role === 2" index="/ai-chat">
					<el-icon>
						<ChatDotRound />
					</el-icon>
					<span>智能答疑</span>
				</el-menu-item>

				<div style="flex-grow: 1;"></div> <!-- 占位推手 -->
				<el-menu-item v-if="user_info.role === 2 || user_info.role === 1" @click="open_feedback_dialog"
					style="border-top: 1px solid #1f2d3d;">
					<el-icon>
						<Microphone />
					</el-icon>
					<span>意见反馈</span>
				</el-menu-item>
			</el-menu>
		</el-aside>




		<el-container>
			<!-- 顶部导航栏 -->
			<el-header style="display: flex; align-items: center; justify-content: space-between;">
				<div class="toolbar">
					<el-icon @click="is_collapse = !is_collapse" class="collapse-icon">
						<Menu />
					</el-icon>
					<!-- 动态多级面包屑 -->
					<el-breadcrumb separator="/">
						<!-- 第一级：固定为首页 -->
						<el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>

						<!-- 第二级：判断当前路由有没有配置 parent，如果有就显示并加上链接 -->
						<el-breadcrumb-item v-if="$route.meta.parent" :to="{ path: $route.meta.parent.path }">
							{{ $route.meta.parent.title }}
						</el-breadcrumb-item>

						<!-- 第三级：当前所在的页面 -->
						<el-breadcrumb-item>{{ $route.meta.title || '详情页' }}</el-breadcrumb-item>
					</el-breadcrumb>
				</div>
				<el-dropdown>
					<!-- 动态绑定 user_info.avatar -->
					<el-avatar :size="32"
						:src="user_info.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'" />
					<template #dropdown>
						<el-dropdown-menu>
							<el-dropdown-item>你好, {{ user_info.username }}</el-dropdown-item>
							<!-- 判断角色不等于 0 (管理员) 时显示个人中心 -->
							<el-dropdown-item v-if="user_info.role !== 0"
								@click="router.push('/profile')">个人中心</el-dropdown-item>
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


		<!-- 全局反馈弹窗 (增加了历史记录查看功能) -->
		<el-dialog v-model="feedback_dialog_visible" title="💡 意见与建议反馈" width="550px">
			<!-- 提交新反馈区域 -->
			<el-form label-position="top">
				<el-form-item label="您遇到了什么问题？或有什么好建议？" required>
					<el-input v-model="feedback_content" type="textarea" :rows="4" maxlength="500" show-word-limit
						placeholder="请详细描述，以便我们更好地为您服务..." />
				</el-form-item>
				<div style="text-align: right;">
					<el-button type="primary" :loading="submitting_feedback" @click="submit_feedback">提交反馈</el-button>
				</div>
			</el-form>

			<el-divider border-style="dashed" />

			<!-- 【极简体验】历史反馈查看区域 -->
			<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
				<span style="font-weight: bold; color: #606266;">我的历史反馈</span>
				<el-button size="small" round @click="load_my_feedbacks">刷新记录</el-button>
			</div>

			<el-empty v-if="my_feedback_list.length === 0" description="您还没有提交过反馈" :image-size="60" />

			<!-- 用时间线来展示极其直观 -->
			<el-timeline v-else style="padding-left: 0; max-height: 250px; overflow-y: auto;">
				<el-timeline-item v-for="item in my_feedback_list" :key="item.id" :timestamp="item.create_time"
					:type="item.status === 1 ? 'success' : 'info'">
					<div style="font-size: 13px; color: #303133; margin-bottom: 5px;">
						<strong>我：</strong>{{ item.content }}
					</div>
					<!-- 平台回复展示 -->
					<div v-if="item.status === 1"
						style="font-size: 13px; color: #67C23A; background: #f0f9eb; padding: 8px; border-radius: 4px;">
						<strong>平台回复：</strong>{{ item.reply }}
					</div>
					<div v-else style="font-size: 12px; color: #E6A23C;">
						平台管理员正在赶来处理的路上...
					</div>
				</el-timeline-item>
			</el-timeline>

		</el-dialog>


	</el-container>



</template>

<script setup>
	import {
		ref,
		onMounted,
		onUnmounted
	} from 'vue'
	import {
		useRouter
	} from 'vue-router'
	import request from '../utils/request'
	import {
		ElMessage
	} from 'element-plus'

	const is_collapse = ref(false)
	const router = useRouter()
	const user_info = ref({})
	const feedback_dialog_visible = ref(false)
	const feedback_content = ref('')
	const submitting_feedback = ref(false)

	// 用于存放“我的历史反馈”的数组
	const my_feedback_list = ref([])

	// 加载“我的历史反馈”的方法
	const load_my_feedbacks = async () => {
		try {
			const res = await request.get('/feedback/my_list')
			my_feedback_list.value = res.data
		} catch (error) {
			console.error("加载历史反馈失败:", error)
		}
	}

	// 打开反馈弹窗时，不仅要清空输入框，还要自动加载一次历史记录
	const open_feedback_dialog = () => {
		feedback_content.value = ''
		feedback_dialog_visible.value = true
		load_my_feedbacks() // 【追加】自动加载
	}

	// 提交新反馈成功后，也要刷新一次历史记录
	const submit_feedback = async () => {
		if (!feedback_content.value.trim()) {
			ElMessage.warning('反馈内容不能为空')
			return
		}

		submitting_feedback.value = true
		try {
			await request.post('/feedback/submit', {
				content: feedback_content.value
			})
			ElMessage.success('反馈已提交，感谢您的支持！')
			load_my_feedbacks() // 【追加】提交成功后刷新
			feedback_content.value = '' // 清空输入框
		} catch (error) {
			console.error('反馈提交失败:', error)
		} finally {
			submitting_feedback.value = false
		}
	}

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
		white-space: nowrap;
		/* 防止文字换行 */
	}

	.el-menu {
		border-right: none;
		/* 开启 Flex 布局 */
		display: flex;
		flex-direction: column;
		/* 高度 = 屏幕总高度(100vh) - 顶部Logo高度(60px) */
		height: calc(100vh - 60px);
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