<template>
  <div class="study-center">
    <el-row :gutter="20">
      <el-col :span="24" v-if="my_courses.length === 0">
        <el-empty description="你还没有购买任何课程，快去选课中心看看吧！" />
      </el-col>
      
      <el-col :md="8" :lg="6" v-for="item in my_courses" :key="item.id">
        <el-card class="course-item" shadow="hover" @click="go_study(item.id)">
          <!-- 复用刚才的封面图逻辑 -->
          <img v-if="item.cover_image" :src="item.cover_image" class="course-img" />
          <div v-else class="no-img">该课程暂无封面</div>
          
          <div class="content">
            <h4 class="title">{{ item.title }}</h4>
            <div class="tutor">讲师：{{ item.tutor_name }}</div>
            
            <div class="progress-box">
              <div class="label">学习进度：{{ item.progress }}%</div>
              <el-progress :percentage="item.progress" :format="() => ''" />
            </div>
            
            <el-button type="success" size="small" style="width: 100%; margin-top: 10px;">
              继续学习
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import request from '../../utils/request'
import { useRouter } from 'vue-router'

const router = useRouter()
const my_courses = ref([])

const load_data = async () => {
  const res = await request.get('/course/student/purchased')
  my_courses.value = res.data
}

const go_study = (id) => {
  // 点击跳转到具体的课程学习室页面（我们下一步要做这个）
  router.push({ path: '/study_room', query: { course_id: id } })
}

onMounted(load_data)
</script>

<style scoped>
.course-item { cursor: pointer; margin-bottom: 20px; transition: transform 0.2s; }
.course-item:hover { transform: translateY(-5px); }
.course-img { width: 100%; height: 140px; object-fit: cover; }
.no-img { width: 100%; height: 140px; background: #f0f2f5; display: flex; align-items: center; justify-content: center; color: #999; }
.content { padding: 10px; }
.title { margin: 0 0 5px 0; font-size: 16px; }
.tutor { font-size: 13px; color: #666; margin-bottom: 15px; }
.progress-box .label { font-size: 12px; color: #999; margin-bottom: 5px; }
</style>