<template>
  <view class="content">
    <!-- Header Section -->
    <view class="home-header">
      <view class="header-left">
        <text class="greeting">你好，{{ user?.nickname || user?.username || '朋友' }} 👋</text>
        <text class="subtitle">今天想创作点什么？</text>
      </view>
      <view class="header-right">
        <view class="avatar-box" @click="handleLogout">
           <image v-if="user?.avatar" :src="user.avatar" mode="aspectFill" class="avatar" />
           <view v-else class="avatar-placeholder">
             <text class="avatar-text">{{ user?.email ? user.email[0].toUpperCase() : 'U' }}</text>
           </view>
        </view>
      </view>
    </view>

    <!-- Stats Grid -->
    <view class="section-title">数据概览</view>
    <view class="stat-grid">
      <view class="stat-item blue">
        <view class="stat-icon-box">
          <wd-icon name="list" size="24px" color="#3b82f6"></wd-icon>
        </view>
        <view class="stat-info">
          <text class="stat-value">{{ stats[0].value }}</text>
          <text class="stat-label">文章</text>
        </view>
      </view>
      <view class="stat-item green">
        <view class="stat-icon-box">
          <wd-icon name="image" size="24px" color="#10b981"></wd-icon>
        </view>
        <view class="stat-info">
           <text class="stat-value">{{ stats[1].value }}</text>
           <text class="stat-label">图片</text>
        </view>
      </view>
      <view class="stat-item purple">
        <view class="stat-icon-box">
          <wd-icon name="video" size="24px" color="#8b5cf6"></wd-icon>
        </view>
        <view class="stat-info">
           <text class="stat-value">{{ stats[2].value }}</text>
           <text class="stat-label">视频</text>
        </view>
      </view>
      <view class="stat-item orange">
        <view class="stat-icon-box">
          <wd-icon name="music" size="24px" color="#f97316"></wd-icon>
        </view>
        <view class="stat-info">
           <text class="stat-value">{{ stats[3].value }}</text>
           <text class="stat-label">音乐</text>
        </view>
      </view>
    </view>

    <!-- Recent Activities -->
    <view class="recent-section">
      <view class="section-header">
        <text class="section-title-text">最近动态</text>
        <!-- <view class="more-link">
          <text>查看更多</text>
          <wd-icon name="arrow-right" size="14px" color="#94a3b8"></wd-icon>
        </view> -->
      </view>
      
      <view class="activity-list">
        <view v-for="item in recentActivities" :key="item.id + item.type" class="activity-item">
          <view class="activity-icon" :class="item.type">
            <!-- Fallback icons -->
            <text v-if="item.type === 'article'">📄</text>
            <text v-else-if="item.type === 'image'">🖼️</text>
            <text v-else-if="item.type === 'video'">🎬</text>
            <text v-else>🎵</text>
          </view>
          <view class="activity-content">
            <text class="activity-text">{{ item.text }}</text>
            <text class="activity-time">{{ item.time }}</text>
          </view>
          <view class="activity-tag" :class="item.type">
            {{ item.type === 'article' ? '文章' : item.type === 'video' ? '视频' : item.type === 'image' ? '图片' : '音乐' }}
          </view>
        </view>
        <view v-if="recentActivities.length === 0" class="empty-state">
           <text class="empty-text">暂无动态</text>
        </view>
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

const handleLogout = () => {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        emit('logout')
      }
    }
  })
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.content {
  width: 100%;
  padding: 0 4rpx;
}

/* Header */
.home-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 12rpx;
  margin-bottom: 24rpx;
}
.header-left {
  display: flex;
  flex-direction: column;
}
.greeting {
  font-size: 40rpx;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 8rpx;
}
.subtitle {
  font-size: 26rpx;
  color: #64748b;
}
.avatar-box {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  overflow: hidden;
  border: 2rpx solid #e2e8f0;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
}
.avatar {
  width: 100%;
  height: 100%;
}
.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
}
.avatar-text {
  color: #fff;
  font-size: 36rpx;
  font-weight: bold;
}

/* Section Title */
.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 24rpx;
  padding: 0 12rpx;
}

/* Stats Grid */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24rpx;
  margin-bottom: 48rpx;
  padding: 0 12rpx;
}
.stat-item {
  background: #fff;
  border-radius: 24rpx;
  padding: 24rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.02);
}
.stat-icon-box {
  width: 80rpx;
  height: 80rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
}
.stat-item.blue .stat-icon-box { background: #eff6ff; }
.stat-item.green .stat-icon-box { background: #ecfdf5; }
.stat-item.purple .stat-icon-box { background: #f5f3ff; }
.stat-item.orange .stat-icon-box { background: #fff7ed; }

.stat-info {
  display: flex;
  flex-direction: column;
}
.stat-value {
  font-size: 36rpx;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.2;
}
.stat-label {
  font-size: 24rpx;
  color: #64748b;
}

/* Recent Activities */
.recent-section {
  background: #fff;
  border-radius: 32rpx 32rpx 0 0;
  padding: 32rpx 24rpx;
  min-height: 400rpx;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}
.section-title-text {
  font-size: 32rpx;
  font-weight: 600;
  color: #1e293b;
}
.more-link {
  display: flex;
  align-items: center;
  gap: 4rpx;
  font-size: 24rpx;
  color: #94a3b8;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}
.activity-item {
  display: flex;
  align-items: center;
  padding-bottom: 24rpx;
  border-bottom: 1rpx solid #f1f5f9;
}
.activity-item:last-child {
  border-bottom: none;
}
.activity-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 16rpx;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  margin-right: 24rpx;
  flex-shrink: 0;
}
.activity-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  overflow: hidden;
}
.activity-text {
  font-size: 28rpx;
  color: #334155;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.activity-time {
  font-size: 22rpx;
  color: #94a3b8;
}
.activity-tag {
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  background: #f1f5f9;
  color: #64748b;
  margin-left: 16rpx;
}
.activity-tag.article { background: #eff6ff; color: #3b82f6; }
.activity-tag.image { background: #ecfdf5; color: #10b981; }
.activity-tag.video { background: #f5f3ff; color: #8b5cf6; }
.activity-tag.audio { background: #fff7ed; color: #f97316; }

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx 0;
  gap: 16rpx;
}
.empty-text {
  color: #94a3b8;
  font-size: 28rpx;
}
</style>