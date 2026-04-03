<template>
	<div>
		<el-card shadow="never">
			<template #header>
				<div class="card-header">
					<span>我的预约订单</span>
				</div>
			</template>

			<el-table :data="order_list" v-loading="loading" style="width: 100%">
				<el-table-column prop="order_no" label="订单号" width="180" />
				<el-table-column prop="course_name" label="课程名称" />
				<el-table-column prop="tutor_name" label="家教老师" width="100" />
				<el-table-column prop="price" label="金额(元)" width="100">
					<template #default="scope">
						<span style="color: #f56c6c; font-weight: bold;">¥{{ scope.row.price }}</span>
					</template>
				</el-table-column>
				<el-table-column prop="appoint_time" label="预约时间" />
<el-table-column prop="pay_time" label="支付时间" width="160">
          <template #default="scope">
            {{ scope.row.pay_time || '未支付' }}
          </template>
        </el-table-column>
				<!-- 新增：备注与平台处理结果 -->
				<el-table-column label="备注与平台处理结果" min-width="200" show-overflow-tooltip>
					<template #default="scope">
						<!-- 包含【平台裁决】字样时，标红高亮显示 -->
						<span v-if="scope.row.remark && scope.row.remark.includes('【平台裁决')">
							<span style="color: #666;">{{ scope.row.remark.split('【平台裁决')[0] }}</span>
							<strong style="color: #F56C6C;">【平台裁决{{ scope.row.remark.split('【平台裁决')[1] }}</strong>
						</span>
						<!-- 正常备注直接显示 -->
						<span v-else>{{ scope.row.remark || '无备注' }}</span>
					</template>
				</el-table-column>

				<el-table-column prop="status" label="订单状态" width="120">
					<template #default="scope">
						<el-tag v-if="scope.row.status === 0" type="warning">等待老师接单</el-tag>
						<el-tag v-if="scope.row.status === 1" type="danger">待支付</el-tag>
						<el-tag v-if="scope.row.status === 2" type="primary">授课进行中</el-tag>
						<el-tag v-if="scope.row.status === 3" type="success">已完成</el-tag>
						<el-tag v-if="scope.row.status === 4" type="info">已取消</el-tag>
						<el-tag v-if="scope.row.status === 5" type="warning">退款处理中</el-tag>
						<!-- 加上纠纷中的标签 -->
						<el-tag v-if="scope.row.status === 6" type="danger">纠纷处理中</el-tag>
					</template>
				</el-table-column>

				<el-table-column label="操作" width="220" fixed="right">
					<template #default="scope">
						<!-- 待支付状态：显示红色的支付按钮和取消按钮 -->
						<div v-if="scope.row.status === 1" style="display: flex; justify-content; gap: 10px;">
							<el-button type="danger" size="small" @click="open_pay_dialog(scope.row)">立即支付</el-button>
							<el-button type="info" size="small" @click="cancel_order(scope.row.id)">取消</el-button>
						</div>

						<!-- 待确认状态：只能取消 -->
						<div v-if="scope.row.status === 0">
							<el-button type="info" size="small" @click="cancel_order(scope.row.id)">取消预约</el-button>
						</div>

						<!-- 进行中状态：显示确认完成和申请退款 -->
						<div v-if="scope.row.status === 2" style="display: flex; justify-content; gap: 10px;">
							<el-button type="success" size="small" @click="finish_order(scope.row.id)">确认完成</el-button>
							<el-button type="warning" size="small" plain
								@click="apply_refund(scope.row.id)">申请退款</el-button>
						</div>


						<!-- 状态5 (退款中) 或 6 (纠纷中)：隐藏按钮，给出友好提示 -->
						<div v-if="scope.row.status === 5">
							<span style="color: #E6A23C; font-size: 12px;"><el-icon>
									<Timer />
								</el-icon> 等待家教处理</span>
						</div>
						<div v-if="scope.row.status === 6">
							<span style="color: #F56C6C; font-size: 12px;"><el-icon>
									<Warning />
								</el-icon> 等待平台管理员裁决</span>
						</div>

						<!-- 已完成状态：评价功能 -->
						<div v-if="scope.row.status === 3">
							<el-button v-if="scope.row.is_commented === 0 || !scope.row.is_commented" type="primary"
								size="small" @click="open_comment_dialog(scope.row)">评价家教</el-button>
							<span v-else style="color: #67C23A; font-size: 12px;"><el-icon>
									<CircleCheck />
								</el-icon> 已评价</span>
						</div>
					</template>
				</el-table-column>
			</el-table>

			<!-- 分页组件 -->
			<div style="margin-top: 20px; display: flex; justify-content: flex-end;">
				<el-pagination background layout="total, prev, pager, next" :total="total"
					v-model:current-page="query_params.page_num" @current-change="get_list" />
			</div>
		</el-card>

		<!-- 模拟收银台弹窗 -->
		<el-dialog v-model="pay_dialog_visible" title="平台收银台" width="400px" center>
			<div class="pay-container">
				<div class="pay-amount">支付金额：<span>¥ {{ current_pay_order.price }}</span></div>
				<p class="pay-tip">请选择支付方式</p>

				<el-radio-group v-model="pay_method" class="pay-methods">
					<el-radio :label="1" border><el-icon color="#67C23A">
							<ChatDotRound />
						</el-icon> 微信支付</el-radio>
					<el-radio :label="2" border><el-icon color="#409EFF">
							<Platform />
						</el-icon> 支付宝支付</el-radio>
				</el-radio-group>
			</div>

			<template #footer>
				<span class="dialog-footer">
					<el-button @click="pay_dialog_visible = false">取 消</el-button>
					<el-button type="danger" :loading="pay_loading" @click="handle_pay">
						{{ pay_loading ? '支付处理中...' : '确认支付' }}
					</el-button>
				</span>
			</template>
		</el-dialog>
		
		
		<!-- 评价弹窗 -->
		    <el-dialog v-model="comment_dialog_visible" title="评价家教老师" width="400px">
		      <el-form :model="comment_form" label-width="80px">
		        <el-form-item label="综合评分" required>
		          <!-- Element Plus 的星星打分组件 -->
<el-rate 
  v-model="comment_form.score" 
  :colors="['#99A9BF', '#F7BA2A', '#FF9900']" 
  show-text 
  :texts="['极差', '失望', '一般', '满意', '强烈推荐']" 
/>
		        </el-form-item>
		        <el-form-item label="详细文字">
		          <el-input 
		            v-model="comment_form.content" 
		            type="textarea" 
		            :rows="4" 
		            placeholder="老师讲得怎么样？给其他同学一些参考吧..." 
		          />
		        </el-form-item>
		      </el-form>
		      <template #footer>
		        <el-button @click="comment_dialog_visible = false">取消</el-button>
		        <el-button type="primary" @click="submit_comment">提交评价</el-button>
		      </template>
		    </el-dialog>
		
		
		
	</div>
</template>

<script setup>
	import {
		ref,
		onMounted
	} from 'vue'
	import request from '../../utils/request'
	import {
		ElMessage,
		ElMessageBox
	} from 'element-plus'

	const loading = ref(true)
	const order_list = ref([])
	const total = ref(0)
	const query_params = ref({
		page_num: 1,
		page_size: 10
	})

	// 模拟收银台相关
	const pay_dialog_visible = ref(false)
	const pay_loading = ref(false)
	const pay_method = ref(1) // 1-微信, 2-支付宝
	const current_pay_order = ref({})

	const comment_dialog_visible = ref(false)
	const comment_form = ref({
	  order_id: null,
	  tutor_id: null,
	  score: 5, // 默认给5星好评
	  content: ''
	})
	
	// 打开评价弹窗
	const open_comment_dialog = (order) => {
	  comment_form.value = {
	    order_id: order.id,
	    tutor_id: order.tutor_id,
	    score: 5,
	    content: ''
	  }
	  comment_dialog_visible.value = true
	}
	
	// 提交评价
	const submit_comment = async () => {
	  if (!comment_form.value.score) {
	    ElMessage.warning('请为老师打分')
	    return
	  }
	  await request.post('/comment/add', comment_form.value)
	  ElMessage.success('评价成功，感谢您的反馈！')
	  comment_dialog_visible.value = false
	  get_list() // 刷新列表，按钮将变成“已评价”
	}

	// 获取学生自己的订单列表
	const get_list = async () => {
		loading.value = true
		const res = await request.get('/order/student/list', {
			params: query_params.value
		})
		order_list.value = res.data.records
		total.value = parseInt(res.data.total)
		loading.value = false
	}

	// 打开支付弹窗
	const open_pay_dialog = (order) => {
		current_pay_order.value = order
		pay_dialog_visible.value = true
	}

	// 【核心】处理模拟支付
	const handle_pay = () => {
		pay_loading.value = true

		// 模拟网络请求和支付处理的延迟
		setTimeout(async () => {
			try {
				await request.post('/order/student/pay', null, {
					params: {
						order_id: current_pay_order.value.id
					}
				})
				ElMessage.success('支付成功！课程已开始')
				pay_dialog_visible.value = false
				get_list() // 刷新列表，状态会变为“进行中”
			} catch (error) {
				// 错误已被拦截器处理
			} finally {
				pay_loading.value = false
			}
		}, 1500) // 模拟1.5秒的支付处理时间
	}

	const cancel_order = (order_id) => {
		ElMessageBox.confirm('确定要取消这个预约订单吗？', '提示').then(async () => {
			await request.post('/order/student/cancel', null, {
				params: {
					order_id
				}
			})
			ElMessage.success('订单已取消')
			get_list()
		})
	}

	const finish_order = (order_id) => {
		ElMessageBox.confirm('请确认课程是否已全部完成？操作后将为老师结算费用。', '确认完成').then(async () => {
			await request.post('/order/student/finish', null, {
				params: {
					order_id
				}
			})
			ElMessage.success('课程已完成，期待您的评价！')
			get_list()
		})
	}

	const apply_refund = (order_id) => {
		ElMessageBox.confirm('确定要为该课程申请退款吗？提交后将由家教老师处理。', '申请退款').then(async () => {
			await request.post('/order/student/apply_refund', null, {
				params: {
					order_id
				}
			})
			ElMessage.success('退款申请已提交')
			get_list()
		})
	}


	onMounted(() => {
		get_list()
	})
</script>