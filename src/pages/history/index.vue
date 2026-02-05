<template>
  <view class="page-container">
    <view class="list-container">
      <view v-for="item in historyList" :key="item.id + '_' + item.type" class="list-item" @click="handleItemClick(item)">
         <view class="list-icon-box" :class="item.type">
           <wd-icon v-if="item.type === 'article'" name="list" size="20px" :color="getTypeColor(item.type)" />
           <wd-icon v-else-if="item.type === 'video'" name="video" size="20px" :color="getTypeColor(item.type)" />
           <wd-icon v-else-if="item.type === 'audio'" name="sound" size="20px" :color="getTypeColor(item.type)" />
           <wd-icon v-else name="image" size="20px" :color="getTypeColor(item.type)" />
         </view>
         <view class="list-content">
           <text class="list-title">{{ item.title }}</text>
           <view v-if="(item.progress || 0) > 0 && !item.isFinished" class="progress-bar-bg">
             <view class="progress-bar-fill" :style="{ width: (item.progress || 0) + '%', backgroundColor: getTypeColor(item.type) }"></view>
           </view>
           <view class="list-meta">
             <text class="list-time">{{ formatTime(item.lastAccessTime) }}</text>
             <text v-if="(item.progress || 0) > 0" class="list-status"> · 已进行 {{ item.progress }}%</text>
           </view>
         </view>
         <view class="action-btn">
           <wd-icon name="arrow-right" size="16px" color="#cbd5e1" />
         </view>
      </view>
      
      <wd-loadmore :state="loadMoreState" @reload="loadMore" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { request, hostBase } from '@/utils/request'
import { audioStore } from '@/store/audio'
import { onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'

// Types (Same as HomeView)
interface ContentItem {
  id: string | number
  title: string
  type: 'article' | 'video' | 'audio' | 'image'
  cover?: string
  url?: string
  desc?: string
  progress?: number
  lastAccessTime?: string
  isFinished?: boolean
}

const historyList = ref<ContentItem[]>([])
const page = ref(0)
const pageSize = 20
const hasMore = ref(true)
const loadMoreState = ref('loading') // loading, finished, error

// Helper functions (Reuse from HomeView)
const getTypeColor = (type: string) => {
  switch (type) {
    case 'article': return '#3b82f6';
    case 'image': return '#10b981';
    case 'video': return '#8b5cf6';
    case 'audio': return '#f97316';
    default: return '#9ca3af';
  }
}

const formatTime = (timeStr?: string) => {
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

const fetchData = async (isRefresh = false) => {
  if (isRefresh) {
    page.value = 0
    hasMore.value = true
    loadMoreState.value = 'loading'
  }
  
  if (!hasMore.value && !isRefresh) return

  try {
    const res = await request(`/content/history-list?limit=${pageSize}&offset=${page.value * pageSize}`, 'GET')
    if (res.ok && res.list) {
      const newList = res.list.map((item: any) => {
        const newItem = { ...item }
        if (newItem.cover && !newItem.cover.startsWith('http')) {
          newItem.cover = `${hostBase}${newItem.cover}`
        }
        if (newItem.url && !newItem.url.startsWith('http')) {
          newItem.url = `${hostBase}${newItem.url}`
        }
        return newItem
      })
      
      if (isRefresh) {
        historyList.value = newList
      } else {
        historyList.value = [...historyList.value, ...newList]
      }
      
      if (newList.length < pageSize) {
        hasMore.value = false
        loadMoreState.value = 'finished'
      } else {
        page.value++
        loadMoreState.value = 'loading' // Ready for next load
      }
    } else {
      if (isRefresh) historyList.value = [] // clear if refresh failed? or keep old?
      loadMoreState.value = 'finished' // Treat error as finished for now if not refresh
    }
  } catch (error) {
    console.error('Failed to fetch history:', error)
    loadMoreState.value = 'error'
  }
}

const loadMore = () => {
  fetchData()
}

// Navigation Logic (Same as HomeView)
const handleItemClick = (item: ContentItem) => {
  if (item.type === 'article') {
    uni.navigateTo({ url: `/pages/article/detail?id=${item.id}` })
  } else if (item.type === 'video') {
    const params = [
      `id=${item.id}`,
      item.url ? `url=${encodeURIComponent(item.url)}` : '',
      item.cover ? `cover=${encodeURIComponent(item.cover)}` : '',
      item.title ? `title=${encodeURIComponent(item.title)}` : ''
    ].filter(Boolean).join('&')
    uni.navigateTo({ url: `/pages/media/video?${params}` })
  } else if (item.type === 'audio') {
    const song = {
      id: Number(item.id),
      name: item.title,
      artist: item.desc || 'Unknown Artist',
      url: item.url || '',
      coverUrl: item.cover
    }
    audioStore.play(song)
    audioStore.showFullScreen = true
  } else if (item.type === 'image') {
    if (item.url) {
      uni.previewImage({
        urls: [item.url],
        current: item.url
      })
    }
  }
}

onMounted(() => {
  fetchData(true)
})

onPullDownRefresh(async () => {
  await fetchData(true)
  uni.stopPullDownRefresh()
})

onReachBottom(() => {
  if (hasMore.value) {
    fetchData()
  }
})
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background-color: #f8fafc;
  padding: 24rpx;
}

.list-container {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.list-item {
  display: flex;
  align-items: center;
  background: #fff;
  padding: 24rpx;
  border-radius: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.02);
}

.list-icon-box {
  width: 88rpx;
  height: 88rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
  flex-shrink: 0;
}
.list-icon-box.article { background: #eff6ff; }
.list-icon-box.video { background: #f5f3ff; }
.list-icon-box.audio { background: #fff7ed; }
.list-icon-box.image { background: #ecfdf5; }

.list-content {
  flex: 1;
  margin-right: 20rpx;
  overflow: hidden;
}

.list-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8rpx;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.list-meta {
  display: flex;
  align-items: center;
  font-size: 22rpx;
  color: #94a3b8;
}

.progress-bar-bg {
  width: 100%;
  height: 6rpx;
  background: #f1f5f9;
  border-radius: 3rpx;
  margin-bottom: 8rpx;
  overflow: hidden;
}
.progress-bar-fill {
  height: 100%;
  border-radius: 3rpx;
}
</style>
