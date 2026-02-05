<template>
  <view class="content-wrapper">
    <!-- 1. 全局搜索 -->
    <view class="search-section">
      <wd-search 
        v-model="searchKeyword" 
        placeholder="搜索文章、媒体、音频..." 
        cancel-txt="搜索" 
        @search="handleSearch"
        @clear="handleClear"
        hide-cancel
      />
    </view>

    <scroll-view scroll-y class="main-scroll" :show-scrollbar="false">
      <view class="scroll-content">
      
      <!-- 5. 置顶内容 (Pinned) - Optional -->
      <view v-if="pinnedList.length > 0" class="section">
        <view class="section-header">
          <text class="section-title-text">📌 置顶内容</text>
        </view>
        <view class="pinned-list">
          <view 
            v-for="item in pinnedList" 
            :key="item.id" 
            class="pinned-card" 
            @click="handleItemClick(item)"
            @longpress="handlePinnedLongPress(item)"
          >
            <view class="pinned-icon">
              <wd-icon v-if="item.type === 'article'" name="list" size="20px" color="#fff" />
              <wd-icon v-else-if="item.type === 'video'" name="video" size="20px" color="#fff" />
              <wd-icon v-else-if="item.type === 'audio'" name="sound" size="20px" color="#fff" />
              <wd-icon v-else name="image" size="20px" color="#fff" />
            </view>
            <view class="pinned-content">
              <text class="pinned-title">{{ item.title }}</text>
              <text class="pinned-desc">{{ item.desc || '精选内容' }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 2. 最近使用 (Recently Used) -->
      <view class="section" v-if="recentlyUsed.length > 0">
        <view class="section-header">
          <text class="section-title-text">⏱ 最近使用</text>
          <view class="more-link" @click="viewMore('history')">
            <text>更多</text>
            <wd-icon name="arrow-right" size="14px" color="#94a3b8"></wd-icon>
          </view>
        </view>
        <scroll-view scroll-x class="horizontal-scroll" :show-scrollbar="false">
          <view class="horizontal-list">
            <view v-for="item in recentlyUsed" :key="item.id" class="card-item" @click="handleItemClick(item)">
              <view class="card-cover-box">
                <image v-if="item.cover" :src="item.cover" mode="aspectFill" class="card-cover" />
                <view v-else class="card-cover-placeholder" :class="item.type">
                  <wd-icon v-if="item.type === 'article'" name="list" size="32px" color="#3b82f6" />
                  <wd-icon v-else-if="item.type === 'video'" name="video" size="32px" color="#8b5cf6" />
                  <wd-icon v-else-if="item.type === 'audio'" name="sound" size="32px" color="#f97316" />
                  <wd-icon v-else name="image" size="32px" color="#10b981" />
                </view>
                <view class="type-badge" :class="item.type">
                  <wd-icon v-if="item.type === 'article'" name="list" size="12px" color="#fff" />
                  <wd-icon v-else-if="item.type === 'video'" name="video" size="12px" color="#fff" />
                  <wd-icon v-else-if="item.type === 'audio'" name="sound" size="12px" color="#fff" />
                  <wd-icon v-else name="image" size="12px" color="#fff" />
                </view>
              </view>
              <text class="card-title">{{ item.title }}</text>
              <text class="card-time">{{ formatTime(item.lastAccessTime) }}</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 4. 未完成 (Unfinished) -->
      <view class="section" v-if="unfinishedList.length > 0">
        <view class="section-header">
          <text class="section-title-text">⏯ 未完成</text>
        </view>
        <view class="list-container">
          <view v-for="item in unfinishedList" :key="item.id" class="list-item" @click="handleItemClick(item)">
             <view class="list-icon-box" :class="item.type">
               <wd-icon v-if="item.type === 'article'" name="list" size="20px" :color="getTypeColor(item.type)" />
               <wd-icon v-else-if="item.type === 'video'" name="video" size="20px" :color="getTypeColor(item.type)" />
               <wd-icon v-else-if="item.type === 'audio'" name="sound" size="20px" :color="getTypeColor(item.type)" />
               <wd-icon v-else name="image" size="20px" :color="getTypeColor(item.type)" />
             </view>
             <view class="list-content">
               <text class="list-title">{{ item.title }}</text>
               <view class="progress-bar-bg">
                 <view class="progress-bar-fill" :style="{ width: (item.progress || 0) + '%', backgroundColor: getTypeColor(item.type) }"></view>
               </view>
               <text class="list-subtitle">已进行 {{ item.progress }}%</text>
             </view>
             <view class="play-btn">
               <wd-icon name="play-circle-filled" size="28px" :color="getTypeColor(item.type)" />
             </view>
          </view>
        </view>
      </view>

      <!-- 3. 最近添加 (Recently Added) -->
      <view class="section" v-if="recentlyAdded.length > 0">
        <view class="section-header">
          <text class="section-title-text">📥 最近添加</text>
        </view>
        <scroll-view scroll-y class="recent-added-scroll" :show-scrollbar="true">
          <view class="list-container">
            <view v-for="item in recentlyAdded" :key="item.id" class="simple-list-item" @click="handleItemClick(item)">
              <view class="simple-info">
                <text class="simple-title">{{ item.title }}</text>
                <text class="simple-meta">{{ formatTime(item.createTime) }} · {{ getTypeName(item.type) }}</text>
              </view>
              <view class="simple-tag" :class="item.type">{{ getTypeName(item.type) }}</view>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- Global Empty State -->
      <view v-if="!pinnedList.length && !recentlyUsed.length && !unfinishedList.length && !recentlyAdded.length" class="empty-state">
        <wd-icon name="box" size="64px" color="#cbd5e1"></wd-icon>
        <text class="empty-text">暂无内容，快去库里添加吧</text>
      </view>

      </view>
    </scroll-view>

    <!-- Popup Action Sheet -->
    <wd-popup 
      v-model="showActionSheet" 
      position="center" 
      custom-style="border-radius: 16rpx; overflow: hidden; width: 600rpx;"
      :z-index="10000"
    >
      <view class="popup-menu">
        <view class="popup-title">操作</view>
        <view 
          v-for="(action, index) in actionSheetActions" 
          :key="index" 
          class="popup-item" 
          :style="{ color: action.color || '#333' }"
          @click="handleActionSelect({ item: action })"
        >
          {{ action.name }}
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { request, hostBase } from '@/utils/request'
import { audioStore } from '@/store/audio'

// --- Types ---
interface ContentItem {
  id: string | number
  title: string
  type: 'article' | 'video' | 'audio' | 'image'
  cover?: string
  url?: string
  desc?: string
  progress?: number
  lastAccessTime?: string
  createTime?: string
  isPinned?: boolean
}

const props = defineProps<{
  user: any
}>()

const emit = defineEmits(['refresh', 'logout'])

// --- State ---
// Action Sheet State
const showActionSheet = ref(false)
const actionSheetActions = ref<any[]>([])
const currentActionItem = ref<ContentItem | null>(null)

const searchKeyword = ref('')
const pinnedList = ref<ContentItem[]>([])
const recentlyUsed = ref<ContentItem[]>([])
const unfinishedList = ref<ContentItem[]>([])
const recentlyAdded = ref<ContentItem[]>([])

// --- Helpers ---
const getTypeColor = (type: string) => {
  switch (type) {
    case 'article': return '#3b82f6';
    case 'image': return '#10b981';
    case 'video': return '#8b5cf6';
    case 'audio': return '#f97316';
    default: return '#9ca3af';
  }
}

const getTypeName = (type: string) => {
  switch (type) {
    case 'article': return '文章';
    case 'image': return '图片';
    case 'video': return '视频';
    case 'audio': return '音频';
    default: return '未知';
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

// --- Actions ---
const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    uni.showToast({ title: `搜索: ${searchKeyword.value}`, icon: 'none' })
    // TODO: Navigate to search results page
  }
}

const handleClear = () => {
  searchKeyword.value = ''
}

const handleItemClick = (item: ContentItem) => {
  console.log('Clicked item:', item)
  
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
    // Construct Song object
    const song = {
      id: Number(item.id),
      name: item.title,
      artist: item.desc || 'Unknown Artist',
      url: item.url || '',
      coverUrl: item.cover
    }
    // Play and open full player
    audioStore.play(song)
    audioStore.showFullScreen = true
  } else if (item.type === 'image') {
    if (item.url) {
      uni.previewImage({
        urls: [item.url],
        current: item.url
      })
    } else {
      uni.showToast({ title: '无效的图片链接', icon: 'none' })
    }
  } else {
    uni.showToast({ title: '功能开发中', icon: 'none' })
  }
}

const viewMore = (section: string) => {
  if (section === 'history') {
    uni.navigateTo({ url: '/pages/history/index' })
  } else {
    uni.showToast({ title: '查看更多开发中', icon: 'none' })
  }
}

const processList = (list: any[]): ContentItem[] => {
  return list.map(item => {
    const newItem = { ...item }
    if (newItem.cover && !newItem.cover.startsWith('http')) {
      newItem.cover = `${hostBase}${newItem.cover}`
    }
    if (newItem.url && !newItem.url.startsWith('http')) {
      newItem.url = `${hostBase}${newItem.url}`
    }
    return newItem
  })
}

// --- Data Fetching ---
const fetchData = async () => {
  try {
    const res = await request('/dashboard/home-data', 'GET')
    if (res.ok && res.data) {
      pinnedList.value = processList(res.data.pinnedList || [])
      recentlyUsed.value = processList(res.data.recentlyUsedList || [])
      unfinishedList.value = processList(res.data.unfinishedList || [])
      recentlyAdded.value = processList(res.data.recentlyAddedList || [])
    }
  } catch (error) {
    console.error('Failed to fetch home data:', error)
  }
}

onMounted(() => {
  fetchData()
})

// 下拉刷新
const handleRefresh = async () => {
  await fetchData()
  uni.stopPullDownRefresh()
}

const handlePinnedLongPress = (item: ContentItem) => {
  currentActionItem.value = item
  actionSheetActions.value = [{ name: '取消置顶', color: '#fa4350' }]
  showActionSheet.value = true
}

const handleActionSelect = async ({ item }: any) => {
  showActionSheet.value = false
  if (item.name === '取消置顶' && currentActionItem.value) {
    try {
      await request('/content/pin', 'POST', {
        type: currentActionItem.value.type,
        id: currentActionItem.value.id,
        isPinned: false
      })
      uni.showToast({ title: '已取消置顶', icon: 'success' })
      fetchData()
      // 通知其他页面刷新
      uni.$emit('refreshStats')
    } catch (error) {
      console.error('Failed to unpin:', error)
      uni.showToast({ title: '操作失败', icon: 'none' })
    }
  }
}

// 暴露刷新方法给父组件
defineExpose({
  refresh: handleRefresh
})
</script>

<style scoped>
.content-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.main-scroll {
  flex: 1;
  height: 0;
  width: 100%;
}

.scroll-content {
  padding-bottom: 100px; /* Space for bottom tab bar */
  min-height: 100%;
  box-sizing: border-box;
}

/* Search */
.search-section {
  padding: 0 0 24rpx; /* Removed top padding */
}

/* Sections */
.section {
  margin-bottom: 48rpx;
  padding: 0 20rpx;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}
.section-title-text {
  font-size: 34rpx;
  font-weight: 700;
  color: #1e293b;
}
.more-link {
  display: flex;
  align-items: center;
  gap: 4rpx;
  font-size: 26rpx;
  color: #64748b;
}

/* Pinned List */
.pinned-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}
.pinned-card {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-radius: 24rpx;
  padding: 24rpx;
  width: calc(50% - 10rpx);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8rpx 16rpx rgba(59, 130, 246, 0.2);
}
.pinned-icon {
  width: 64rpx;
  height: 64rpx;
  background: rgba(255,255,255,0.2);
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
}
.pinned-title {
  color: #fff;
  font-size: 28rpx;
  font-weight: 600;
  margin-bottom: 8rpx;
}
.pinned-desc {
  color: rgba(255,255,255,0.8);
  font-size: 22rpx;
}

/* Horizontal Scroll List (Recently Used) */
.horizontal-scroll {
  width: 100%;
  white-space: nowrap;
}
.horizontal-list {
  display: flex;
  padding-right: 20rpx; /* Padding for last item */
}
.card-item {
  display: inline-flex;
  flex-direction: column;
  width: 240rpx;
  margin-right: 24rpx;
}
.card-cover-box {
  width: 240rpx;
  height: 160rpx;
  border-radius: 20rpx;
  overflow: hidden;
  margin-bottom: 16rpx;
  position: relative;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
}
.card-cover {
  width: 100%;
  height: 100%;
}
.card-cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.card-cover-placeholder.article { background: #eff6ff; }
.card-cover-placeholder.video { background: #f5f3ff; }
.card-cover-placeholder.audio { background: #fff7ed; }
.card-cover-placeholder.image { background: #ecfdf5; }

.type-badge {
  position: absolute;
  top: 12rpx;
  right: 12rpx;
  width: 40rpx;
  height: 40rpx;
  border-radius: 10rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}
.type-badge.article { background: rgba(59, 130, 246, 0.9); }
.type-badge.video { background: rgba(139, 92, 246, 0.9); }
.type-badge.audio { background: rgba(249, 115, 22, 0.9); }
.type-badge.image { background: rgba(16, 185, 129, 0.9); }

.card-title {
  font-size: 28rpx;
  color: #1e293b;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 4rpx;
}
.card-time {
  font-size: 22rpx;
  color: #94a3b8;
}

/* Unfinished List */
.list-container {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}
.list-item {
  display: flex;
  align-items: center;
  background: #fff;
  padding: 20rpx;
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
}
.list-icon-box.article { background: #eff6ff; }
.list-icon-box.video { background: #f5f3ff; }
.list-icon-box.audio { background: #fff7ed; }
.list-icon-box.image { background: #ecfdf5; }

.list-content {
  flex: 1;
  margin-right: 20rpx;
}
.list-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 12rpx;
  display: block;
}
.progress-bar-bg {
  width: 100%;
  height: 8rpx;
  background: #f1f5f9;
  border-radius: 4rpx;
  margin-bottom: 8rpx;
  overflow: hidden;
}
.progress-bar-fill {
  height: 100%;
  border-radius: 4rpx;
}
.list-subtitle {
  font-size: 22rpx;
  color: #64748b;
}
.play-btn {
  opacity: 0.8;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
  opacity: 0.8;
}
.empty-text {
  font-size: 28rpx;
  color: #94a3b8;
  margin-top: 24rpx;
}
.simple-list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  background: #f8fafc;
  border-radius: 16rpx;
}
.simple-info {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}
.simple-title {
  font-size: 28rpx;
  color: #334155;
  font-weight: 500;
}
.simple-meta {
  font-size: 22rpx;
  color: #94a3b8;
}
.simple-tag {
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  background: #e2e8f0;
  color: #64748b;
}
.simple-tag.article { background: #eff6ff; color: #3b82f6; }
.simple-tag.image { background: #ecfdf5; color: #10b981; }
.simple-tag.video { background: #f5f3ff; color: #8b5cf6; }
.simple-tag.audio { background: #fff7ed; color: #f97316; }

.recent-added-scroll {
  height: 420rpx;
}

/* Popup Menu Styles */
.popup-menu {
  width: 100%;
  background: #fff;
}
.popup-title {
  padding: 30rpx;
  text-align: center;
  font-size: 32rpx;
  font-weight: 600;
  border-bottom: 1px solid #f1f5f9;
  color: #1e293b;
}
.popup-item {
  padding: 30rpx;
  text-align: center;
  font-size: 30rpx;
  border-bottom: 1px solid #f1f5f9;
  transition: background-color 0.2s;
}
.popup-item:last-child {
  border-bottom: none;
}
.popup-item:active {
  background-color: #f8fafc;
}
</style>
