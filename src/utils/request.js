import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
    baseURL: 'http://localhost:8080', 
    timeout: 5000
})

// 请求拦截器：每次发请求前，把 localStorage 里的 Token 带上
request.interceptors.request.use(config => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers['satoken'] = token // 与后端 Sa-Token 配置对应
    }
    return config
}, error => {
    return Promise.reject(error)
})

// 响应拦截器：统一处理报错
request.interceptors.response.use(response => {
    const res = response.data
    if (res.code !== 200) {
        ElMessage.error(res.message || '系统异常')
        return Promise.reject(new Error(res.message))
    }
    return res
}, error => {
    ElMessage.error('网络请求失败')
    return Promise.reject(error)
})

export default request