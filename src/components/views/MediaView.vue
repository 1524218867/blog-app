<template>
  <view class="content">
    <view class="card">
      <view class="section-header">
        <view class="title">媒体库</view>
        <view class="header-actions">
          <view class="tabs">
            <text :class="['tab', activeTab === 'all' ? 'active' : '']" @click="activeTab = 'all'">全部</text>
            <text :class="['tab', activeTab === 'image' ? 'active' : '']" @click="activeTab = 'image'">图片</text>
            <text :class="['tab', activeTab === 'video' ? 'active' : '']" @click="activeTab = 'video'">视频</text>
          </view>
        </view>
      </view>

      <!-- Search Box -->
      <view class="search-box">
        <input 
          class="search-input" 
          v-model="searchQuery" 
          placeholder="搜索图片或视频..." 
          confirm-type="search"
          @confirm="fetchMedia"
          @input="handleSearchInput"
        />
        <view class="search-icon">
          <wd-icon name="search1" size="22px"></wd-icon>
        </view>
      </view>
      
      <view class="media-grid">
        <view v-for="item in filteredMedia" :key="item.id + item.type" class="media-card" @click="handleMediaClick(item)">
          <view class="media-preview" :class="item.type">
            <image 
              v-if="item.type === 'image'" 
              :src="item.fullUrl" 
              mode="aspectFill" 
              class="preview-image" 
            />
            <image 
              v-else-if="item.type === 'video' && item.coverUrl" 
              :src="item.coverUrl" 
              mode="aspectFill" 
              class="preview-image" 
            />
            <text v-else class="type-icon">{{ item.type === 'video' ? '▶' : '🖼' }}</text>
          </view>
          <view class="media-info">
            <view class="media-title">{{ item.title }}</view>
            <view class="media-meta">{{ item.date }} · {{ item.size }}</view>
          </view>
        </view>
        <view v-if="filteredMedia.length === 0" class="empty-tip">未找到相关媒体</view>
      </view>
    </view>

    <!-- Floating Action Button -->
    <wd-fab 
      :draggable="true" 
      position="right-bottom" 
      direction="top"
      custom-style="top: 610px;"
    >
      <wd-button custom-class="fab-action-btn" type="primary" round @click="handleUploadImage">
        <wd-icon name="image" size="22px"></wd-icon>
      </wd-button>
      <wd-button custom-class="fab-action-btn" type="success" round @click="handleUploadVideo">
        <wd-icon name="video" size="22px"></wd-icon>
      </wd-button>
    </wd-fab>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { request, apiBase } from '@/utils/request'

const activeTab = ref('all')
const media = ref<any[]>([])
const searchQuery = ref('')
let searchTimer: any = null

const fetchMedia = async () => {
  try {
    const q = searchQuery.value ? `?q=${encodeURIComponent(searchQuery.value)}` : ''
    const [images, videos] = await Promise.all([
      request(`/images${q}`),
      request(`/videos${q}`)
    ])
    
    const imageList = (Array.isArray(images) ? images : []).map((item: any) => ({
      ...item,
      type: 'image',
      title: item.filename, // Backend might return filename, use it as title
      date: item.created_at ? item.created_at.split('T')[0] : '',
      fullUrl: item.url.startsWith('http') ? item.url : `${apiBase}${item.url}`,
      displayMeta: '图片',
      size: 'Image' // Placeholder size
    }))

    const videoList = (Array.isArray(videos) ? videos : []).map((item: any) => ({
      ...item,
      type: 'video',
      title: item.filename,
      date: item.created_at ? item.created_at.split('T')[0] : '',
      fullUrl: item.url.startsWith('http') ? item.url : `${apiBase}${item.url}`,
      coverUrl: item.cover ? (item.cover.startsWith('http') ? item.cover : `${apiBase}${item.cover}`) : '',
      displayMeta: item.duration || '视频',
      size: 'Video' // Placeholder size
    }))

    media.value = [...imageList, ...videoList].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  } catch (error) {
    console.error('Failed to fetch media:', error)
  }
}

const handleSearchInput = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    fetchMedia()
  }, 500)
}

onMounted(() => {
  fetchMedia()
})

const filteredMedia = computed(() => {
  if (activeTab.value === 'all') return media.value
  return media.value.filter(m => m.type === activeTab.value)
})

const handleMediaClick = (item: any) => {
  if (item.type === 'image') {
    uni.previewImage({
      urls: [item.fullUrl],
      current: item.fullUrl
    })
  } else if (item.type === 'video') {
    uni.navigateTo({
      url: `/pages/media/video?url=${encodeURIComponent(item.fullUrl)}&title=${encodeURIComponent(item.title)}&cover=${encodeURIComponent(item.coverUrl || '')}`
    })
  }
}

const handleUploadImage = () => {
  uni.chooseImage({
    count: 9,
    success: async (res) => {
      uni.showLoading({ title: '上传中...' })
      const tempFilePaths = res.tempFilePaths
      let successCount = 0
      
      for (const filePath of tempFilePaths) {
        try {
          await new Promise((resolve) => {
            uni.uploadFile({
              url: `${apiBase}/upload/multiple`,
              filePath: filePath,
              name: 'files',
              header: {
                Authorization: `Bearer ${uni.getStorageSync('token')}`
              },
              success: (uploadRes) => {
                const data = JSON.parse(uploadRes.data)
                if (data.ok) successCount++
                resolve(data)
              },
              fail: (err) => {
                console.error(err)
                resolve(null)
              }
            })
          })
        } catch (e) {
          console.error(e)
        }
      }
      
      uni.hideLoading()
      uni.showToast({ title: `成功上传 ${successCount} 张图片`, icon: 'none' })
      fetchMedia()
    }
  })
}

const handleUploadVideo = () => {
  uni.chooseVideo({
    sourceType: ['album', 'camera'],
    success: (res) => {
      uni.showLoading({ title: '上传中...' })
      uni.uploadFile({
        url: `${apiBase}/upload/videos`,
        filePath: res.tempFilePath,
        name: 'files',
        header: {
          Authorization: `Bearer ${uni.getStorageSync('token')}`
        },
        success: (uploadRes) => {
          uni.hideLoading()
          const data = JSON.parse(uploadRes.data)
          if (data.ok) {
            uni.showToast({ title: '上传成功' })
            fetchMedia()
          } else {
            uni.showToast({ title: '上传失败', icon: 'error' })
          }
        },
        fail: () => {
          uni.hideLoading()
          uni.showToast({ title: '网络错误', icon: 'error' })
        }
      })
    }
  })
}
</script>

<style scoped>
:deep(.fab-action-btn) {
  min-width: auto !important;
  box-sizing: border-box;
  width: 32px !important;
  height: 32px !important;
  border-radius: 16px !important;
  margin: 8rpx;
}

.content {
  width: 100%;
}
.card {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}
.title {
  font-size: 32rpx;
  font-weight: 600;
}
.tabs {
  display: flex;
  background: #f1f5f9;
  border-radius: 8rpx;
  padding: 4rpx;
}
.tab {
  padding: 8rpx 24rpx;
  font-size: 24rpx;
  color: #64748b;
  border-radius: 6rpx;
  transition: all 0.2s;
}
.tab.active {
  background: #ffffff;
  color: #3b82f6;
  box-shadow: 0 2rpx 4rpx rgba(0,0,0,0.05);
  font-weight: 500;
}
.search-box {
  background: #f1f5f9;
  border-radius: 12rpx;
  padding: 16rpx 24rpx;
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
}
.search-input {
  flex: 1;
  font-size: 28rpx;
  color: #1e293b;
}
.search-icon {
  font-size: 28rpx;
  color: #94a3b8;
}
.media-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}
.media-card {
  background: #ffffff;
  border-radius: 12rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.02);
  border: 1px solid #f1f5f9;
}
.media-preview {
  width: 100%;
  aspect-ratio: 16/9;
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.preview-image {
  width: 100%;
  height: 100%;
}
.type-icon {
  font-size: 48rpx;
  opacity: 0.5;
}
.media-info {
  padding: 16rpx;
}
.media-title {
  font-size: 28rpx;
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 8rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.media-meta {
  font-size: 22rpx;
  color: #94a3b8;
}
.empty-tip {
  grid-column: span 2;
  text-align: center;
  color: #94a3b8;
  padding: 40rpx 0;
  font-size: 28rpx;
}
</style>