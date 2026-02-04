<template>
  <view class="content-wrapper">
    <scroll-view scroll-y class="scroll-container">
      <view class="content">
        <view class="card">
        <view class="section-header-row">
          <view class="title">全部文章</view>
        </view>
        
        <!-- Search Box -->
        <view class="search-box">
          <input 
            class="search-input" 
            v-model="searchQuery" 
            placeholder="搜索文章标题或内容..." 
            confirm-type="search"
            @confirm="fetchPosts"
            @input="handleSearchInput"
          />
          <view class="search-icon">
            <wd-icon name="search1" size="22px"></wd-icon>
          </view>
        </view>

        <view class="list">
          <view v-for="post in posts" :key="post.id" class="list-item" @click="goDetail(post.id)" @longpress="handleLongPress(post)">
            <view class="post-content">
              <view class="list-title">{{ post.title }}</view>
              <view class="list-summary">{{ post.summary }}</view>
              <view class="list-meta">{{ post.date }} · {{ post.author }}</view>
            </view>
            <text class="chip">{{ post.tag }}</text>
          </view>
          <view v-if="posts.length === 0" class="empty-tip">未找到相关文章</view>
        </view>
      </view>
    </view>
    </scroll-view>

    <!-- Floating Action Button -->
    <wd-fab 
      :draggable="true" 
      position="right-bottom" 
      direction="top"
      custom-style="top: 610px;"
      :z-index="200"
    >
      <wd-button custom-class="fab-action-btn" type="primary" round @click="goEditor()">
        <wd-icon name="add" size="22px"></wd-icon>
      </wd-button>
    </wd-fab>

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
import { ref, onMounted, onUnmounted } from 'vue'
import { request } from '@/utils/request'

interface Post {
  id: number
  title: string
  content: string
  tag: string
  date: string
  status: string
  author?: string
  summary?: string
  isPinned?: boolean
}

const posts = ref<Post[]>([])
const searchQuery = ref('')
let searchTimer: any = null

// Action Sheet State
const showActionSheet = ref(false)
const actionSheetActions = ref<any[]>([])
const currentPost = ref<Post | null>(null)

const formatDate = (dateStr: string | Date) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toISOString().split('T')[0]
}

const fetchPosts = async () => {
  try {
    const url = searchQuery.value 
      ? `/articles?q=${encodeURIComponent(searchQuery.value)}` 
      : '/articles'
    const data = await request(url)
    const list = Array.isArray(data) ? data : (data.list || [])
    posts.value = list.map((item: any) => ({
      ...item,
      date: formatDate(item.publish_date || item.created_at),
      // Simple summary from content (strip HTML if needed, but for now just truncate)
      summary: item.content ? item.content.replace(/<[^>]+>/g, '').slice(0, 50) + '...' : '',
      author: 'Admin', // Backend doesn't return author name yet, default to Admin
      isPinned: !!item.isPinned
    }))
  } catch (error) {
    console.error('Failed to fetch articles:', error)
  }
}

const handleSearchInput = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    fetchPosts()
  }, 500)
}

const goDetail = (id: number) => {
  uni.navigateTo({
    url: `/pages/article/detail?id=${id}`
  })
}

const handlePin = async (post: Post) => {
  try {
     await request('/content/pin', 'POST', {
       type: 'article',
       id: post.id,
       isPinned: !post.isPinned
     })
     uni.showToast({ title: post.isPinned ? '已取消置顶' : '已置顶', icon: 'success' })
     fetchPosts()
     uni.$emit('refreshHome')
  } catch(e) {
     console.error(e)
     uni.showToast({ title: '操作失败', icon: 'none' })
  }
}

const handleLongPress = (post: Post) => {
  currentPost.value = post
  actionSheetActions.value = [
    { name: post.isPinned ? '取消置顶' : '置顶' },
    { name: '删除', color: '#fa4350' }
  ]
  showActionSheet.value = true
}

const handleActionSelect = async ({ item }: any) => {
  showActionSheet.value = false
  if (!currentPost.value) return

  if (item.name === '置顶' || item.name === '取消置顶') {
    handlePin(currentPost.value)
  } else if (item.name === '删除') {
    uni.showModal({
      title: '提示',
      content: `确定要删除文章《${currentPost.value.title}》吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            uni.showLoading({ title: '删除中...' })
            await request(`/articles/${currentPost.value!.id}`, 'DELETE')
            uni.showToast({ title: '删除成功', icon: 'success' })
            fetchPosts()
            uni.$emit('refreshStats')
          } catch (error) {
            console.error('Failed to delete article:', error)
            uni.showToast({ title: '删除失败', icon: 'none' })
          } finally {
            uni.hideLoading()
          }
        }
      }
    })
  }
}

const goEditor = () => {
  uni.navigateTo({
    url: '/pages/article/editor'
  })
}

onMounted(() => {
  fetchPosts()
  uni.$on('refreshArticles', fetchPosts)
})

onUnmounted(() => {
  uni.$off('refreshArticles', fetchPosts)
})
</script>

<style scoped>
.content-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}
.scroll-container {
  flex: 1;
  height: 0;
  width: 100%;
}
.content {
  width: 100%;
  min-height: 100%;
  padding-bottom: 20rpx;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}
.card {
  flex: 1;
  background: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  box-sizing: border-box;
}
.title {
  font-size: 32rpx;
  font-weight: 600;
  margin-bottom: 0;
}
.section-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
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
.list {
  display: grid;
  gap: 20rpx;
}
.list-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20rpx;
  border-radius: 12rpx;
  background: #f7f8fb;
}
.post-content {
  flex: 1;
  margin-right: 20rpx;
}
.list-title {
  font-size: 30rpx;
  font-weight: 500;
  margin-bottom: 8rpx;
  color: #1e293b;
}
.list-summary {
  font-size: 26rpx;
  color: #64748b;
  margin-bottom: 12rpx;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.list-meta {
  font-size: 24rpx;
  color: #94a3b8;
}
.chip {
  font-size: 22rpx;
  color: #3b82f6;
  background: #eff6ff;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  white-space: nowrap;
}
.empty-tip {
  text-align: center;
  color: #94a3b8;
  padding: 40rpx 0;
  font-size: 28rpx;
}

:deep(.fab-action-btn) {
  min-width: auto !important;
  box-sizing: border-box;
  width: 48px !important;
  height: 48px !important;
  border-radius: 24px !important;
  margin: 0 !important;
  padding: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
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