import {
	createRouter,
	createWebHistory
} from 'vue-router'
import {
	ElMessage
} from 'element-plus'
const routes = [{
		path: '/',
		redirect: '/login'
	},
	{
		path: '/login',
		name: 'Login',
		component: () => import('../views/Login.vue')
	},
	{

		path: '/home',
		name: 'Layout',
		component: () => import('../views/Layout.vue'),
		// 默认进入 /home 时，自动重定向到子路由 /dashboard
		redirect: '/dashboard',
		children: [{
				path: '/dashboard',
				name: 'Dashboard',
				component: () => import('../views/Dashboard.vue'),
				// 【关键点】meta 元信息
				meta: {
					title: '首页看板'
				}
			},
			{
				path: '/user-manage',
				name: 'UserManage',
				component: () => import('../views/admin/UserManage.vue'),
				meta: {
					title: '用户列表管理'
				}
			},
			{
				path: '/tutor-audit',
				name: 'TutorAudit',
				component: () => import('../views/admin/TutorAudit.vue'),
				meta: {
					title: '家教资质审核'
				}
			},
			{
				path: '/profile',
				name: 'Profile',
				component: () => import('../views/Profile.vue'),
				meta: {
					title: '个人中心'
				}
			},
			{
				path: '/course-publish',
				name: 'CoursePublish',
				component: () => import('../views/tutor/CoursePublish.vue'),
				meta: {
					title: '发布与管理课程'
				}
			},
			{
				path: '/course-audit',
				name: 'CourseAudit',
				component: () => import('../views/admin/CourseAudit.vue'),
				meta: {
					title: '课程内容审核'
				}
			},
			{
				path: '/course-mall',
				name: 'CourseMall',
				component: () => import('../views/student/CourseMall.vue'),
				meta: {
					title: '找家教&选课中心'
				}
			},
			{
				path: '/course-detail',
				name: 'CourseDetail',
				component: () => import('../views/CourseDetail.vue'),
				meta: {
					title: '课程详情'
				}
			},
			{
				path: '/order-manage',
				name: 'OrderManage',
				component: () => import('../views/tutor/OrderManage.vue'),
				meta: {
					title: '我的订单管理'
				}
			},
			{
				path: '/student-order',
				name: 'StudentOrder',
				component: () => import('../views/student/StudentOrder.vue'),
				meta: {
					title: '我的课程订单'
				}
			},
			{
				path: '/order-dispute',
				name: 'OrderDispute',
				component: () => import('../views/admin/OrderDispute.vue'),
				meta: {
					title: '退款纠纷处理'
				}
			},
			
			{
			        path: '/ai-chat',
			        name: 'AiChat',
			        component: () => import('../views/student/AiChat.vue'),
			        meta: { title: 'AI 智能答疑室' }
			      },
			{
			        path: '/tutor-course',
			        name: 'TutorCourse',
			        component: () => import('../views/tutor/TutorCourse.vue'),
			        meta: { title: '我的课程管理' }
			      },
			{
			        path: '/resource-audit',
			        name: 'ResourceAudit',
			        component: () => import('../views/admin/ResourceAudit.vue'),
			        meta: { title: '教学资料审核' }
			      },
			{
			  path: '/study-center',
			  name: 'StudyCenter',
			  component: () => import('../views/student/StudyCenter.vue'),
			  meta: { title: '学习中心' }
			}
		]
	}
]

const router = createRouter({
	history: createWebHistory(),
	routes
})

router.beforeEach((to, from, next) => {
	const userJson = localStorage.getItem('userInfo')
	const user = userJson ? JSON.parse(userJson) : null

	// 1. 未登录拦截
	if (to.path !== '/login' && !user) {
		return next('/login')
	}

	// 2. 权限拦截：非管理员试图进入管理员页面
	const adminRoutes = ['/user-manage', '/tutor-audit', '/course-audit']
	if (adminRoutes.includes(to.path) && user.role !== 0) {
		ElMessage.error('权限不足，无法访问！')
		return next('/dashboard')
	}

	// 增加选课中心的权限判断
	if (to.path === '/course-mall') {
		// 如果角色是家教 (1)，禁止进入
		if (user.role === 1) {
			ElMessage.error('对不起，家教老师无需进入选课中心')
			return next('/dashboard')
		}
	}

	next()
})

export default router