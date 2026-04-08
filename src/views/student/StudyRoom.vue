<template>
  <div class="study-room-container" v-loading="loading">
	  
	      <el-button icon="ArrowLeft" @click="router.back()" style="margin-bottom: 20px;">
	        返回学习中心
	      </el-button>
	  
    <el-row :gutter="20">
      
      <!-- 左侧：播放器 / 阅读器区域 -->
      <el-col :span="16">
        <el-card shadow="never" class="player-card" :body-style="{ padding: '0px' }">
          <!-- 1. 如果没有选中任何资源，显示提示 -->
          <div v-if="!current_resource.id" class="empty-player">
            <el-icon class="empty-icon"><VideoPlay /></el-icon>
            <p>请在右侧目录选择要学习的课件或视频</p>
          </div>
          
          <!-- 2. 如果是视频 (resource_type === 1) -->
          <div v-else-if="current_resource.resource_type === 1" class="video-container">
            <video 
              :src="current_resource.resource_url" 
              controls 
              autoplay 
              controlslist="nodownload"
              class="video-player"
            ></video>
          </div>
          
          <!-- 3. 如果是文档 (resource_type === 0) -->
          <div v-else class="doc-container">
            <iframe :src="current_resource.resource_url" class="doc-viewer"></iframe>
          </div>

          <!-- 当前正在学习的资源标题 -->
          <div class="resource-title-bar" v-if="current_resource.id">
            <h3 style="margin: 0; color: #303133;">{{ current_resource.resource_name }}</h3>
            <el-tag type="success" effect="dark" v-if="current_resource.is_learned === 1">已学习</el-tag>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：课程目录 (播放列表) -->
      <el-col :span="8">
        <el-card shadow="never" class="playlist-card">
          <template #header>
            <div class="playlist-header">
              <span style="font-weight: bold; font-size: 16px;">课程目录</span>
              <span style="font-size: 12px; color: #909399;">共 {{ resource_list.length }} 节</span>
            </div>
          </template>
          
          <div class="playlist-content">
            <el-empty v-if="resource_list.length === 0" description="老师尚未上传资料" />
            
            <div 
              v-else 
              v-for="(item, index) in resource_list" 
              :key="item.id"
              :class="['playlist-item', { 'is-active': current_resource.id === item.id }]"
              @click="play_resource(item)"
            >
              <div class="item-left">
                <span class="item-index">{{ index + 1 }}</span>
                <el-icon class="item-icon" :color="item.resource_type === 1 ? '#F56C6C' : '#409EFF'">
                  <VideoCamera v-if="item.resource_type === 1" />
                  <Document v-else />
                </el-icon>
                <span class="item-name">{{ item.resource_name }}</span>
              </div>
              <div class="item-right">
                <!-- 学习进度标记：绿色的打勾 -->
                <el-icon v-if="item.is_learned === 1" color="#67C23A" :size="16"><CircleCheckFilled /></el-icon>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute,useRouter} from 'vue-router'
import request from '../../utils/request'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter() 
const loading = ref(true)

const course_id = ref(null)
const resource_list = ref([])
const current_resource = ref({})

// 加载该课程的所有教学资料
const load_resources = async () => {
  loading.value = true
  course_id.value = route.query.course_id
  
  if (!course_id.value) {
    ElMessage.error('缺少课程ID参数')
    return
  }

  try {
    // 调用之前写好的带 is_learned 标记的接口
    const res = await request.get('/course_resource/student/list_by_course', {
      params: { course_id: course_id.value }
    })
    resource_list.value = res.data

    // 如果有资料，默认选中第一节课播放
    if (resource_list.value.length > 0) {
      play_resource(resource_list.value[0])
    }
  } catch (error) {}
  
  loading.value = false
}

// 点击目录播放资料
const play_resource = async (resource) => {
  current_resource.value = resource
  
  // 如果这个资料还没学习过，就向后端发送“已学习”的标记请求
  if (resource.is_learned === 0) {
    try {
      await request.post('/study_record/mark_as_learned', null, {
        params: { resource_id: resource.id }
      })
      // 标记成功后，前端立刻把状态改为 1，显示绿色打勾
      resource.is_learned = 1
    } catch(error) {
      console.error('记录学习进度失败', error)
    }
  }
}

onMounted(() => {
  load_resources()
})
</script>

<style scoped>
.study-room-container {
  max-width: 1200px;
  margin: 0 auto;
}

/* 播放器区域样式 */
.player-card {
  border-radius: 8px;
  overflow: hidden;
  background-color: #000; /* 播放器背景设为黑色 */
}
.empty-player {
  height: 500px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #909399;
  background-color: #f5f7fa;
}
.empty-icon {
  font-size: 60px;
  margin-bottom: 15px;
  color: #c0c4cc;
}
.video-container {
  width: 100%;
  height: 500px;
  background-color: #000;
  display: flex;
  align-items: center;
}
.video-player {
  width: 100%;
  height: 100%;
  outline: none;
}
.doc-container {
  width: 100%;
  height: 500px;
  background-color: #fff;
}
.doc-viewer {
  width: 100%;
  height: 100%;
  border: none;
}
.resource-title-bar {
  padding: 15px 20px;
  background-color: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid #ebeef5;
}

/* 右侧播放列表样式 */
.playlist-card {
  border-radius: 8px;
  height: calc(500px + 63px); /* 保持和左侧一样高 */
  display: flex;
  flex-direction: column;
}
.playlist-card :deep(.el-card__body) {
  padding: 0;
  flex: 1;
  overflow-y: auto; /* 资料太多时可以滚动 */
}
.playlist-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.playlist-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  cursor: pointer;
  border-bottom: 1px solid #f5f7fa;
  transition: background-color 0.2s;
}
.playlist-item:hover {
  background-color: #f5f7fa;
}
.playlist-item.is-active {
  background-color: #ecf5ff;
  color: #409EFF;
}
.playlist-item.is-active .item-name {
  color: #409EFF;
  font-weight: bold;
}
.item-left {
  display: flex;
  align-items: center;
  overflow: hidden;
}
.item-index {
  color: #909399;
  font-size: 13px;
  margin-right: 12px;
  width: 15px;
}
.item-icon {
  margin-right: 8px;
  font-size: 16px;
}
.item-name {
  font-size: 14px;
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}
</style>