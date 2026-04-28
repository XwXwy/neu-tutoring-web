<template>
  <div class="editorial-page-container">
    <el-card shadow="never" class="editorial-card chat-card">
      <template #header>
        <div class="card-header">
          <span class="header-title">
            <el-icon class="title-icon"><ChatDotRound /></el-icon> 
            AI 智能答疑助手
          </span>
          <div class="status-badge status-online">
            <span class="status-dot"></span>
            <span class="status-text">24小时在线</span>
          </div>
        </div>
      </template>

      <!-- 聊天记录展示区 -->
      <div class="message-list" ref="scroll_ref">
        <div v-for="(msg, index) in message_list" :key="index" :class="['message-item', msg.role]">
          <el-avatar :size="40" :src="msg.role === 'user' ? user_avatar : ai_avatar" class="msg-avatar" />
          
          <div class="msg-bubble markdown-editorial" v-html="md.render(msg.content)"></div>
        </div>
        
        <!-- 加载动画 -->
        <div v-if="ai_loading" class="message-item assistant">
          <el-avatar :size="40" :src="ai_avatar" class="msg-avatar" />
          <div class="msg-bubble loading-bubble">
            <el-icon class="is-loading"><Loading /></el-icon> 老师正在翻阅资料...
          </div>
        </div>
      </div>

      <!-- 底部输入区 -->
      <div class="input-area">
        <div class="input-wrapper">
          <el-input
            v-model="input_text"
            type="textarea"
            :rows="3"
            placeholder="有什么不懂的学科问题？向 AI 老师提问吧！(按 Ctrl + Enter 发送)"
            class="warm-textarea"
            @keydown.ctrl.enter="send_message"
          />
          <button 
            class="btn-send" 
            :class="{ 'is-active': input_text.trim().length > 0 }"
            :disabled="ai_loading || !input_text.trim()" 
            @click="send_message"
          >
            <el-icon><Position /></el-icon>
          </button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import request from '../../utils/request'
import { ElMessage } from 'element-plus'
import { ChatDotRound, Loading, Position } from '@element-plus/icons-vue'
import aiAvatar from '../../assets/logo.png'
import MarkdownIt from 'markdown-it'
const md = new MarkdownIt({
  html: true,        
  breaks: true,      
  linkify: true      
})

const user_info = JSON.parse(localStorage.getItem('userInfo') || '{}')
const user_avatar = user_info.avatar || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&s=128'
const ai_avatar = aiAvatar

const input_text = ref('')
const ai_loading = ref(false)
const scroll_ref = ref(null)

const message_list = ref([
  { role: 'assistant', content: `你好，${user_info.real_name || '同学'}！我是你的专属 AI 答疑助手。无论是解算理科难题、梳理文科脉络，还是制定学习计划，都可以随时问我！` }
])

const scroll_to_bottom = () => {
  nextTick(() => {
    if (scroll_ref.value) {
      scroll_ref.value.scrollTop = scroll_ref.value.scrollHeight
    }
  })
}

const send_message = async () => {
  if (!input_text.value.trim()) return

  const question = input_text.value
  message_list.value.push({ role: 'user', content: question })
  input_text.value = '' 
  scroll_to_bottom()

  ai_loading.value = true
  try {
    const res = await request.post('/ai/chat', { question: question })
    ai_loading.value = false 
    const full_text = res.data 

    message_list.value.push({ role: 'assistant', content: '' })
    const last_index = message_list.value.length - 1

    let i = 0
    const timer = setInterval(() => {
      if (i < full_text.length) {
        message_list.value[last_index].content += full_text.charAt(i)
        i++
        scroll_to_bottom() 
      } else {
        clearInterval(timer) 
      }
    }, 40) 

  } catch (error) {
    ai_loading.value = false
    message_list.value.push({ role: 'assistant', content: '抱歉，我的思绪似乎被网络阻断了，请稍后再试。' })
    scroll_to_bottom()
  }
}
</script>

<style scoped>
/* ================= 美学色板与变量定义 ================= */
* {
  --clr-parchment: #f5f4ed;     /* 羊皮纸底色 (聊天背景) */
  --clr-ivory: #faf9f5;         /* 象牙白 (AI气泡) */
  --clr-white: #ffffff;
  --clr-near-black: #141413;    /* 墨黑主文本 */
  
  --clr-terracotta: #c96442;    /* 陶土红 (发送按钮激活/Markdown强调) */
  --clr-coral: #d97757;         /* 珊瑚色 */
  --clr-olive: #5e5d59;         /* 橄榄灰 */
  --clr-stone: #87867f;         /* 石板灰 */
  --clr-charcoal: #4d4c48;      /* 木炭灰 */
  
  --clr-warm-sand: #e8e6dc;     /* 暖沙色 (用户气泡) */
  --clr-border-cream: #f0eee6;  /* 柔和边框 */
  --clr-border-warm: #e8e6dc;   /* 加深边框 */
  --clr-focus-blue: #3898ec;
  
  --font-serif: "Georgia", "Times New Roman", serif;
  --font-sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.editorial-page-container {
  font-family: var(--font-sans);
  height: calc(100vh - 120px);
  padding-top: 8px;
  display: flex;
  flex-direction: column;
}

/* ================= 柔和卡片系统 ================= */
.editorial-card {
  background-color: var(--clr-ivory);
  border: 1px solid var(--clr-border-cream);
  border-radius: 12px;
  box-shadow: rgba(0, 0, 0, 0.02) 0px 4px 12px !important;
  height: 100%;
  display: flex;
  flex-direction: column;
}
:deep(.editorial-card .el-card__header) {
  padding: 16px 24px;
  border-bottom: 1px solid var(--clr-border-cream);
}
:deep(.editorial-card .el-card__body) { 
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
.header-title {
  font-family: var(--font-serif);
  font-size: 18px;
  font-weight: 500;
  color: var(--clr-near-black);
  display: flex;
  align-items: center;
}
.title-icon { margin-right: 8px; font-size: 20px; color: var(--clr-terracotta); }

/* 在线状态徽章 */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px 4px 8px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  background: var(--clr-white);
  border: 1px solid var(--clr-border-warm);
}
.status-dot { width: 6px; height: 6px; border-radius: 50%; margin-right: 6px; }
.status-online .status-dot { background-color: #10b981; box-shadow: 0 0 4px rgba(16, 185, 129, 0.4); }
.status-online .status-text { color: var(--clr-olive); }

/* ================= 聊天展示区 ================= */
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px;
  background-color: var(--clr-parchment); /* 使用羊皮纸底色，保护视力 */
}
/* 隐藏原生滚动条 */
.message-list::-webkit-scrollbar { width: 6px; }
.message-list::-webkit-scrollbar-thumb { background: var(--clr-border-warm); border-radius: 8px; }

.message-item {
  display: flex;
  margin-bottom: 24px;
  align-items: flex-start;
}
.message-item.user { flex-direction: row-reverse; }

.msg-avatar { 
  margin: 0 16px; 
  border: 1px solid var(--clr-border-warm);
}

/* 气泡基础样式 */
.msg-bubble {
  max-width: 75%;
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
}

/* AI 气泡：象牙白，严谨专业 */
.assistant .msg-bubble {
  background-color: var(--clr-ivory);
  border: 1px solid var(--clr-border-cream);
  border-top-left-radius: 4px;
}

/* 用户气泡：暖沙色，摒弃刺眼的微信绿 */
.user .msg-bubble {
  background-color: var(--clr-warm-sand);
  border: 1px solid var(--clr-border-warm);
  border-top-right-radius: 4px;
}

/* 加载动画气泡 */
.loading-bubble {
  color: var(--clr-olive);
  display: flex;
  align-items: center;
  gap: 8px;
  font-style: italic;
}

/* ================= 输入区 ================= */
.input-area {
  padding: 20px 32px;
  background-color: var(--clr-ivory);
  border-top: 1px solid var(--clr-border-cream);
}
.input-wrapper {
  position: relative;
  background-color: var(--clr-white);
  border: 1px solid var(--clr-border-warm);
  border-radius: 12px;
  transition: border-color 0.2s;
}
.input-wrapper:focus-within {
  border-color: var(--clr-terracotta);
  box-shadow: 0 0 0 1px var(--clr-terracotta);
}

.warm-textarea :deep(.el-textarea__inner) {
  border: none !important;
  box-shadow: none !important;
  background: transparent;
  padding: 16px 60px 16px 16px; /* 留出右侧按钮空间 */
  font-size: 15px;
  line-height: 1.6;
  color: var(--clr-near-black);
  resize: none;
}
.warm-textarea :deep(.el-textarea__inner::placeholder) {
  color: var(--clr-stone);
}

/* 精致的内置发送按钮 */
.btn-send {
  position: absolute;
  right: 12px;
  bottom: 12px;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  background-color: var(--clr-border-warm);
  color: var(--clr-white);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 16px;
  cursor: not-allowed;
  transition: all 0.2s;
}
.btn-send.is-active {
  background-color: var(--clr-terracotta);
  cursor: pointer;
}
.btn-send.is-active:hover {
  background-color: var(--clr-coral);
  transform: translateY(-1px);
}

/* ================= Markdown 编辑排版美学 ================= */
.markdown-editorial {
  font-size: 15px;
  line-height: 1.8; /* 更宽松的文学级行高 */
  color: var(--clr-near-black);
  word-break: break-word;
}

/* 标题应用衬线体，展现权威感 */
.markdown-editorial :deep(h1), 
.markdown-editorial :deep(h2), 
.markdown-editorial :deep(h3), 
.markdown-editorial :deep(h4) {
  font-family: var(--font-serif);
  margin-top: 1.5em;
  margin-bottom: 0.8em;
  font-weight: 500;
  color: var(--clr-near-black);
  line-height: 1.3;
}
.markdown-editorial :deep(h3) { font-size: 1.15em; }

.markdown-editorial :deep(p) { margin-bottom: 1em; }
.markdown-editorial :deep(p:last-child) { margin-bottom: 0; }

.markdown-editorial :deep(ul), 
.markdown-editorial :deep(ol) {
  padding-left: 1.5em;
  margin-bottom: 1em;
}
.markdown-editorial :deep(li) { margin-bottom: 0.3em; }

/* 重点文字采用陶土红，而非默认黑色加粗 */
.markdown-editorial :deep(strong) {
  color: var(--clr-terracotta);
  font-weight: 600;
}

/* 表格：淡雅风格 */
.markdown-editorial :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 1.2em 0;
  background-color: var(--clr-white);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 0 0 1px var(--clr-border-warm);
}
.markdown-editorial :deep(th), 
.markdown-editorial :deep(td) {
  border: 1px solid var(--clr-border-cream);
  padding: 10px 14px;
}
.markdown-editorial :deep(th) {
  background-color: var(--clr-parchment);
  font-weight: 500;
  color: var(--clr-charcoal);
  text-align: left;
}
.markdown-editorial :deep(code) {
  background-color: var(--clr-warm-sand);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.9em;
  color: var(--clr-charcoal);
}
</style>