<template>
  <view class="content">
    <view class="card hero">
      <view class="hero-head">
        <view>
          <view class="hero-title">欢迎来到你的博客</view>
          <view class="hero-subtitle">一站式管理文章、图片与视频</view>
        </view>
      </view>
      <view class="stat-grid">
        <view v-for="item in stats" :key="item.label" class="stat-item">
          <view class="stat-value">{{ item.value }}</view>
          <view class="stat-label">{{ item.label }}</view>
        </view>
      </view>
    </view>

    <!-- User Profile Card -->
    <view v-if="user" class="card user-card">
      <view class="user-header">
        <view class="avatar-box">
          <image src="/static/logo.png" mode="aspectFill" class="avatar" />
        </view>
        <view class="user-info">
          <view class="user-name-row">
            <text class="user-name">{{ user.nickname || user.username || '用户' }}</text>
            <view class="user-role-badge" :class="user.role">
              {{ user.role === 'admin' ? '管理员' : '游客' }}
            </view>
          </view>
          <text class="user-email">{{ user.email }}</text>
        </view>
        
        <!-- Logout Button (Right Aligned) -->
        <view class="action-btn danger-btn" @click="$emit('logout')">
          <view class="action-icon-box danger">
            <svg class="action-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 4H18C18.5304 4 19.0391 4.21071 19.4142 4.58579C19.7893 4.96086 20 5.46957 20 6V18C20 18.5304 19.7893 19.0391 19.4142 19.4142C19.0391 19.7893 18.5304 20 18 20H15M8 12H3M3 12L7 8M3 12L7 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </view>
          <text class="action-text">退出</text>
        </view>
      </view>
    </view>

    <view class="card">
      <view class="section-header">
        <view class="title">最近动态</view>
        <text class="link-text">查看全部</text>
      </view>
      <view class="list">
        <view v-for="item in recentActivities" :key="item.id + item.type" class="list-item">
          <view>
            <view class="list-title">{{ item.text }}</view>
            <view class="list-meta">{{ item.time }}</view>
          </view>
          <text class="chip">{{ item.type === 'article' ? '文章' : item.type === 'video' ? '视频' : item.type === 'image' ? '图片' : '音乐' }}</text>
        </view>
        <view v-if="recentActivities.length === 0" class="empty-tip">暂无动态</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { request } from '@/utils/request'

const props = defineProps<{
  user: any
}>()

const emit = defineEmits(['refresh', 'ping', 'logout'])

const stats = ref([
  { label: '文章', value: 0 },
  { label: '图片', value: 0 },
  { label: '视频', value: 0 },
  { label: '音乐', value: 0 }
])

const recentActivities = ref<any[]>([])

const formatTime = (timeStr: string) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}天前`
  
  return date.toLocaleDateString()
}

const fetchData = async () => {
  try {
    const data = await request('/dashboard/stats')
    if (data && data.ok) {
      stats.value = [
        { label: '文章', value: data.stats.articles },
        { label: '图片', value: data.stats.images },
        { label: '视频', value: data.stats.videos },
        { label: '音乐', value: data.stats.audios }
      ]
      
      recentActivities.value = data.recentActivities.map((item: any) => ({
        ...item,
        time: formatTime(item.time)
      }))
    }
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error)
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.content {
  width: 100%;
}

.card {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
}
.title {
  font-size: 32rpx;
  font-weight: 600;
  margin-bottom: 16rpx;
}
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}
.link-text {
  color: #3b5bdb;
  font-size: 24rpx;
}
.hero {
  background: linear-gradient(135deg, #eef2ff 0%, #ffffff 60%);
}
.hero-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 20rpx;
}
.hero-title {
  font-size: 36rpx;
  font-weight: 600;
}
.hero-subtitle {
  margin-top: 6rpx;
  color: #7a7a7a;
  font-size: 24rpx;
}
.stat-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
}
.stat-item {
  background: #ffffff;
  border-radius: 12rpx;
  padding: 16rpx;
  box-shadow: 0 6rpx 18rpx rgba(15, 23, 42, 0.08);
}
.stat-value {
  font-size: 32rpx;
  font-weight: 600;
}
.stat-label {
  color: #8a8a8a;
  margin-top: 4rpx;
  font-size: 24rpx;
}
.role-tag {
  margin-left: 12rpx;
  padding: 4rpx 12rpx;
  font-size: 24rpx;
  border-radius: 999rpx;
  background: #eef2ff;
  color: #3b5bdb;
}
.role-tag.admin {
  background: #e6f6ef;
  color: #1f8f5f;
}
.role-tag.user {
  background: #eef2ff;
  color: #3b5bdb;
}
.list {
  display: grid;
  gap: 14rpx;
}
.list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12rpx 14rpx;
  border-radius: 12rpx;
  background: #f7f8fb;
}
.empty-tip {
  text-align: center;
  color: #999;
  font-size: 28rpx;
  padding: 32rpx 0;
}
.list-title {
  font-weight: 500;
  font-size: 28rpx;
}
.list-meta {
  font-size: 24rpx;
  color: #999;
}
.chip {
  font-size: 22rpx;
  background: #e0e7ff;
  color: #4f46e5;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}
.media-grid {
  display: grid;
  gap: 16rpx;
}
.media-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16rpx;
  background: #f8fafc;
  border-radius: 12rpx;
}
.media-type {
  font-size: 24rpx;
  color: #64748b;
  background: #e2e8f0;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  margin-right: 16rpx;
}
.media-title {
  flex: 1;
  font-size: 28rpx;
  color: #334155;
}
.media-meta {
  font-size: 24rpx;
  color: #94a3b8;
}
.row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12rpx;
  font-size: 28rpx;
}
.label {
  color: #666;
}
.value {
  font-weight: 500;
}

/* User Profile Styles */
.user-card {
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.user-header {
  padding: 30rpx 24rpx;
  display: flex;
  align-items: center;
  gap: 24rpx;
  background: linear-gradient(135deg, #fff 0%, #f3f4f6 100%);
  border-bottom: 1px solid #f1f5f9;
}
.avatar-box {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  overflow: hidden;
  border: 4rpx solid #fff;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
  margin-right: 24rpx;
}
.avatar {
  width: 100%;
  height: 100%;
}
.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}
.user-name-row {
  display: flex;
  align-items: center;
  margin-bottom: 8rpx;
}
.user-name {
  font-size: 34rpx;
  font-weight: 600;
  color: #1e293b;
  margin-right: 16rpx;
}
.user-role-badge {
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 999rpx;
  background: #eef2ff;
  color: #4f46e5;
  font-weight: 500;
}
.user-role-badge.admin {
  background: #ecfdf5;
  color: #059669;
}
.user-email {
  font-size: 24rpx;
  color: #64748b;
}
.user-actions {
  display: flex;
  padding: 24rpx;
  gap: 24rpx;
}
.action-btn {
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  padding: 10rpx 16rpx;
  border-radius: 8rpx;
  background: #fef2f2;
  transition: all 0.2s;
  flex-shrink: 0;
}
.action-btn:active {
  background: #fee2e2;
  transform: scale(0.98);
}
.action-icon-box {
  width: 28rpx;
  height: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.action-icon {
  width: 28rpx;
  height: 28rpx;
  color: #dc2626;
}
.action-icon-box.success {
  background: transparent;
  color: #059669;
}
.action-icon-box.warning {
  background: transparent;
  color: #d97706;
}
.action-icon-box.danger {
  background: transparent;
  color: #dc2626;
}
.action-text {
  font-size: 24rpx;
  font-weight: 500;
  color: #dc2626;
}
</style>