<template>
  <div class="chat-container">
    <el-card shadow="never" class="chat-card">
      <template #header>
        <div class="card-header">
          <span style="font-weight: bold; color: #409EFF;">
            <el-icon><ChatDotRound /></el-icon> AI 智能答疑助手 (通义千问)
          </span>
          <el-tag size="small" type="success">24小时在线</el-tag>
        </div>
      </template>

      <!-- 聊天记录展示区 -->
      <div class="message-list" ref="scroll_ref">
        <div v-for="(msg, index) in message_list" :key="index" :class="['message-item', msg.role]">
          <!-- 头像 -->
          <el-avatar :size="40" :src="msg.role === 'user' ? user_avatar : ai_avatar" class="msg-avatar" />
          
          <!-- 消息气泡 -->
<div class="msg-bubble markdown-body" v-html="md.render(msg.content)"></div>
        </div>
        
        <!-- 加载动画 -->
        <div v-if="ai_loading" class="message-item assistant">
          <el-avatar :size="40" :src="ai_avatar" class="msg-avatar" />
          <div class="msg-bubble loading-bubble">
            <el-icon class="is-loading"><Loading /></el-icon> 老师正在思考中...
          </div>
        </div>
      </div>

      <!-- 底部输入区 -->
      <div class="input-area">
        <el-input
          v-model="input_text"
          type="textarea"
          :rows="3"
          placeholder="有什么不懂的学科问题？向 AI 老师提问吧！(按 Ctrl + Enter 发送)"
          @keydown.ctrl.enter="send_message"
        />
        <el-button type="primary" class="send-btn" :loading="ai_loading" @click="send_message">
          <el-icon><Position /></el-icon> 发 送
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import request from '../../utils/request'
import { ElMessage } from 'element-plus'
//引入 Markdown 解析器
import MarkdownIt from 'markdown-it'
const md = new MarkdownIt({
  html: true,        // 允许解析文本中的 HTML 标签
  breaks: true,      // 允许回车换行
  linkify: true      // 自动识别链接
})
const user_info = JSON.parse(localStorage.getItem('userInfo') || '{}')
const user_avatar = user_info.avatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
// AI 专属头像
const ai_avatar = 'https://img.alicdn.com/tfs/TB1L0I4pNTpK1RjSZFKXXa2wXXa-120-120.png'

const input_text = ref('')
const ai_loading = ref(false)
const scroll_ref = ref(null)

// 初始欢迎语
const message_list = ref([
  { role: 'assistant', content: `你好，${user_info.real_name || '同学'}！我是你的专属 AI 答疑助手。无论是数学公式、英语语法还是物理定理，都可以随时问我哦！` }
])

// 滚动到最底部
const scroll_to_bottom = () => {
  nextTick(() => {
    if (scroll_ref.value) {
      scroll_ref.value.scrollTop = scroll_ref.value.scrollHeight
    }
  })
}

// 发送消息
const send_message = async () => {
  if (!input_text.value.trim()) {
    ElMessage.warning('问题不能为空哦')
    return
  }

  // 1. 把用户的问题加入列表
  const question = input_text.value
  message_list.value.push({ role: 'user', content: question })
  input_text.value = '' // 清空输入框
  scroll_to_bottom()

  // 2. 显示 loading，发起请求
  ai_loading.value = true
  try {
    // 此时网页上会显示“老师正在思考中...”的动画
    const res = await request.post('/ai/chat', { question: question })
    
    // 3. 拿到数据后，关闭加载动画
    ai_loading.value = false 
    const full_text = res.data 

    // 【核心修复：解决 Vue 3 响应式丢失问题】
    // 先推入一个空气泡
    message_list.value.push({ role: 'assistant', content: '' })
    // 获取刚刚推入的那个气泡在数组中的真实索引
    const last_index = message_list.value.length - 1

    // 使用定时器逐字追加内容
    let i = 0
    const timer = setInterval(() => {
      if (i < full_text.length) {
        // 【关键】直接操作 message_list.value[last_index]！这能强行触发 Vue 的视图刷新！
        message_list.value[last_index].content += full_text.charAt(i)
        i++
        scroll_to_bottom() 
      } else {
        clearInterval(timer) // 字打完了，清除定时器
      }
    }, 40) // 40毫秒敲一个字，速度适中

  } catch (error) {
    ai_loading.value = false
    message_list.value.push({ role: 'assistant', content: '抱歉，我的网络好像出了一点小问题，请稍后再试。' })
    scroll_to_bottom()
  }
}
</script>

<style scoped>
.chat-container {
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
}
.chat-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.chat-card :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background-color: #f5f7fa;
}
.message-item {
  display: flex;
  margin-bottom: 20px;
}
.message-item.user {
  flex-direction: row-reverse; /* 用户的消息在右边 */
}
.msg-avatar {
  margin: 0 15px;
}
.msg-bubble {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.6;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}
.assistant .msg-bubble {
  background-color: #ffffff;
  color: #333;
  border-top-left-radius: 2px;
}
.user .msg-bubble {
  background-color: #95ec69; /* 微信绿 */
  color: #333;
  border-top-right-radius: 2px;
}
.loading-bubble {
  color: #909399;
  display: flex;
  align-items: center;
  gap: 8px;
}
.input-area {
  padding: 15px;
  background-color: #fff;
  border-top: 1px solid #ebeef5;
  display: flex;
  gap: 15px;
  align-items: flex-end;
}
.send-btn {
  height: 75px;
  width: 100px;
}

/* --- 以下为新增的 Markdown 专属美化样式 --- */
.markdown-body {
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
}

/* 标题美化 */
.markdown-body :deep(h1), 
.markdown-body :deep(h2), 
.markdown-body :deep(h3), 
.markdown-body :deep(h4) {
  margin-top: 10px;
  margin-bottom: 10px;
  font-weight: 600;
  color: #2c3e50;
}
.markdown-body :deep(h3) { font-size: 16px; }

/* 列表美化 */
.markdown-body :deep(ul), 
.markdown-body :deep(ol) {
  padding-left: 20px;
  margin-bottom: 10px;
}
.markdown-body :deep(li) {
  margin-bottom: 4px;
}

/* 加粗文字 */
.markdown-body :deep(strong) {
  color: #d9534f; /* 让重点文字稍微带点颜色，更醒目 */
  font-weight: bold;
}

/* 表格美化 (针对你截图里那种计划表) */
.markdown-body :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 15px;
  background-color: #fff;
}
.markdown-body :deep(th), 
.markdown-body :deep(td) {
  border: 1px solid #dfe2e5;
  padding: 8px 12px;
}
.markdown-body :deep(th) {
  background-color: #f6f8fa;
  font-weight: bold;
}

/* 段落间距 */
.markdown-body :deep(p) {
  margin-bottom: 10px;
}
.markdown-body :deep(p:last-child) {
  margin-bottom: 0;
}

</style>