<template>
  <view class="content">
    <!-- Header Section -->
    <view class="home-header">
      <view class="header-left">
        <text class="greeting"><svg t="1769409122606" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="19009" width="20" height="20" style="vertical-align: middle;"><path d="M790.442667 348.842667c0 14.208-5.674667 28.330667-15.573334 39.68a49.621333 49.621333 0 0 1-39.68 14.208c-12.672 0-24.064-4.224-32.426666-12.714667-8.533333-8.533333-12.8-21.248-12.8-34.005333 0-14.208 5.717333-28.288 15.616-38.186667 9.856-9.856 24.064-15.530667 38.186666-15.530667 12.714667-1.365333 24.064 4.181333 33.962667 12.714667 8.533333 8.405333 12.714667 21.12 12.714667 33.834667z m-70.784 369.450666h-87.722667l56.576-287.274666h87.722667l-56.576 287.274666z m-261.802667-14.208l31.146667-162.730666H346.026667l-31.146667 162.730666H229.973333l75.008-387.84h83.541334l-28.288 151.466667h144.298666l29.781334-151.466667h84.906666l-75.008 387.84H457.813333z m414.72-551.936l-2.816-2.816A507.093333 507.093333 0 0 0 510.208 0.682667 510.293333 510.293333 0 0 0 149.333333 149.333333C57.258667 242.730667 0.682667 370.133333 0.682667 510.208a507.733333 507.733333 0 0 0 148.650666 360.96c93.397333 92.032 220.8 148.608 360.874667 148.608h380.714667c21.248 0 39.68-16.938667 39.68-39.68v-179.754667a518.528 518.528 0 0 0 65.066666-131.584c15.573333-49.536 24.106667-103.296 24.106667-158.549333 0-140.074667-56.576-266.112-147.2-358.058667z" fill="#3D7FFF" p-id="19010"></path></svg> {{ user?.nickname || user?.username || '朋友' }} </text>
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
          <svg t="1769406888726" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3788" width="24" height="24"><path d="M903.1 24.8c-8.6 0-17.1 0.9-25.4 2.7l-450.5 96.9c-55.3 11.9-95.5 61.6-95.5 118.2v553.1c0 70.7-57.5 128.3-128.3 128.3-70.7 0-128.3-57.5-128.3-128.3s57.5-128.3 128.3-128.3c20.8 0 37.6-16.8 37.6-37.6s-16.8-37.6-37.6-37.6C91.3 592.2 0 683.5 0 795.7s91.3 203.5 203.5 203.5S407 907.9 407 795.7V242.6c0-21.4 15.2-40.1 36.1-44.6l450.5-96.9c3.1-0.7 6.4-1 9.6-1 25.2 0 45.6 20.5 45.7 45.7v550.4c0 70.7-57.5 128.2-128.2 128.2-70.7 0-128.3-57.5-128.3-128.2 0-70.7 57.5-128.3 128.2-128.3 20.8 0 37.6-16.8 37.6-37.6s-16.8-37.6-37.6-37.6c-112.2 0-203.5 91.3-203.5 203.5s91.3 203.5 203.5 203.5 203.4-91.3 203.5-203.5V145.7c-0.1-66.6-54.4-120.9-121-120.9z" fill="#f97316" p-id="3789"></path></svg>
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
            <text v-if="item.type === 'article'"><wd-icon name="list" size="24px" color="#3b82f6"></wd-icon></text>
            <text v-else-if="item.type === 'image'"><wd-icon name="image" size="24px" color="#10b981"></wd-icon></text>
            <text v-else-if="item.type === 'video'"><text class="stat-value">{{ stats[2].value }}</text></text>
            <text v-else><svg t="1769406888726" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3788" width="24" height="24"><path d="M903.1 24.8c-8.6 0-17.1 0.9-25.4 2.7l-450.5 96.9c-55.3 11.9-95.5 61.6-95.5 118.2v553.1c0 70.7-57.5 128.3-128.3 128.3-70.7 0-128.3-57.5-128.3-128.3s57.5-128.3 128.3-128.3c20.8 0 37.6-16.8 37.6-37.6s-16.8-37.6-37.6-37.6C91.3 592.2 0 683.5 0 795.7s91.3 203.5 203.5 203.5S407 907.9 407 795.7V242.6c0-21.4 15.2-40.1 36.1-44.6l450.5-96.9c3.1-0.7 6.4-1 9.6-1 25.2 0 45.6 20.5 45.7 45.7v550.4c0 70.7-57.5 128.2-128.2 128.2-70.7 0-128.3-57.5-128.3-128.2 0-70.7 57.5-128.3 128.2-128.3 20.8 0 37.6-16.8 37.6-37.6s-16.8-37.6-37.6-37.6c-112.2 0-203.5 91.3-203.5 203.5s91.3 203.5 203.5 203.5 203.4-91.3 203.5-203.5V145.7c-0.1-66.6-54.4-120.9-121-120.9z" fill="#f97316" p-id="3789"></path></svg></text>
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