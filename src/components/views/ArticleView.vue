<template>
  <view class="content-wrapper">
    <view class="fixed-header">
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

      <!-- Custom Tabs -->
      <view class="custom-tabs">
        <view 
          class="custom-tab-item" 
          :class="{ active: activeTab === 'posts' }"
          @click="activeTab = 'posts'"
        >
          <text>文章列表</text>
          <view class="tab-indicator" v-if="activeTab === 'posts'"></view>
        </view>
        <view 
          class="custom-tab-item" 
          :class="{ active: activeTab === 'groups' }"
          @click="activeTab = 'groups'"
        >
          <text>分组管理</text>
          <view class="tab-indicator" v-if="activeTab === 'groups'"></view>
        </view>
      </view>

      <!-- Tag Filter Bar -->
      <view class="tag-filter-bar" v-if="activeTab === 'posts' && availableTags.length > 0">
        <scroll-view scroll-x class="tag-filter-scroll" :show-scrollbar="false">
          <view class="tag-filter-content">
            <view 
              class="filter-chip" 
              :class="{ active: currentFilterTagId === null }" 
              @click="applyTagFilter(null)"
            >全部</view>
            <view 
              v-for="tag in availableTags" 
              :key="tag.id" 
              class="filter-chip"
              :class="{ active: currentFilterTagId === tag.id }"
              @click="applyTagFilter(tag.id)"
            >
              {{ tag.name }}
            </view>
            <view class="filter-chip manage-btn" @click="navigateToTagsMgmt">
              <wd-icon name="setting" size="14px" custom-style="color: var(--text-color-secondary, #64748b)" />
            </view>
          </view>
        </scroll-view>
      </view>
    </view>

    <scroll-view 
      scroll-y 
      class="scroll-container" 
      :scroll-top="scrollTop"
      @scroll="handleScroll"
    >
      <view class="content">
        <!-- Posts List -->
        <view class="list" v-if="activeTab === 'posts'">
          <view v-if="currentFilterGroupId" class="filter-status-bar">
            <text>当前分组: {{ getGroupName(currentFilterGroupId) }}</text>
            <view class="clear-filter" @click="clearGroupFilter">
              <wd-icon name="close-circle-filled" size="16px" color="#94a3b8" />
            </view>
          </view>
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

        <!-- Groups List -->
        <view class="group-list" v-if="activeTab === 'groups'">
          <view 
            v-for="group in groups" 
            :key="group.id" 
            class="group-item" 
            @click="handleGroupClick(group)"
            @longpress="handleGroupLongPress(group)"
          >
            <view class="group-icon">
              <wd-icon name="folder" size="24px" color="var(--primary-color, #3b82f6)" />
            </view>
            <view class="group-info">
              <text class="group-name">{{ group.name }}</text>
              <text class="group-count">{{ group.article_count || 0 }} 篇文章</text>
            </view>
            <wd-icon name="arrow-right" size="16px" color="#94a3b8" />
          </view>
          
          <view class="add-group-card" @click="showAddGroupPopup = true">
             <view class="add-icon-circle">
               <wd-icon name="add" size="24px" color="#fff" />
             </view>
             <text class="add-text">新建分组</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- Add Group Popup -->
    <wd-popup v-model="showAddGroupPopup" position="center" :z-index="10000" custom-style="border-radius: 16rpx; width: 80%; overflow: hidden; background-color: var(--bg-color-card, #fff);">
      <view class="dialog-container">
        <view class="dialog-header">
          <text class="dialog-title">新建分组</text>
        </view>
        <view class="dialog-content">
          <input 
            class="dialog-input" 
            v-model="newGroupName" 
            placeholder="请输入分组名称" 
            :focus="showAddGroupPopup"
          />
        </view>
        <view class="dialog-footer">
          <view class="dialog-btn cancel" @click="showAddGroupPopup = false">取消</view>
          <view class="dialog-btn confirm" @click="confirmAddGroup">创建</view>
        </view>
      </view>
    </wd-popup>

    <!-- Move to Group Popup -->
    <wd-popup v-model="showMoveGroupPopup" position="bottom" :z-index="10000" custom-style="border-top-left-radius: 32rpx; border-top-right-radius: 32rpx; max-height: 70vh;">
      <view class="popup-menu">
        <view class="popup-title">移动到分组</view>
        <scroll-view scroll-y style="max-height: 50vh;">
          <view class="popup-item" @click="confirmMoveGroup(null)">
            <text>未分组</text>
            <wd-icon v-if="!currentPost?.group_id" name="check" size="18px" color="var(--primary-color, #3b82f6)" />
          </view>
          <view 
            v-for="group in groups" 
            :key="group.id" 
            class="popup-item"
            @click="confirmMoveGroup(group.id)"
          >
            <text>{{ group.name }}</text>
            <wd-icon v-if="currentPost?.group_id === group.id" name="check" size="18px" color="var(--primary-color, #3b82f6)" />
          </view>
        </scroll-view>
        <view class="popup-item cancel" @click="showMoveGroupPopup = false">取消</view>
      </view>
    </wd-popup>

      <!-- Tag Selection Popup -->
    <wd-popup v-model="showTagPopup" position="bottom" :safe-area-inset-bottom="true" :z-index="10000" custom-style="max-height: 70vh; border-radius: 32rpx 32rpx 0 0; overflow: hidden; display: flex; flex-direction: column;">
      <view class="tag-popup-container">
        <view class="popup-header">
          <text class="popup-title">选择标签</text>
          <view class="popup-close" @click="showTagPopup = false">
            <wd-icon name="close" size="22px" custom-style="color: var(--text-color-secondary, #64748b)" />
          </view>
        </view>
        
        <scroll-view scroll-y class="tag-scroll-view">
          <view class="tag-content">
            <view v-if="availableTags.length === 0" class="empty-tags">
              <wd-icon name="info-circle" size="32px" custom-style="margin-bottom: 16rpx; color: var(--text-color-placeholder, #cbd5e1)" />
              <text>暂无标签，去创建一个吧</text>
            </view>
            
            <view class="tag-grid">
               <view 
                 v-for="tag in availableTags" 
                 :key="tag.id" 
                 class="tag-chip" 
                 :class="{ active: selectedTagIds.includes(tag.id) }"
                 @click="toggleTagSelection(tag.id)"
               >
                 <wd-icon v-if="selectedTagIds.includes(tag.id)" name="check" size="14px" custom-style="margin-right: 8rpx; color: #fff" />
                 <text>{{ tag.name }}</text>
               </view>
               
               <view class="tag-chip add-btn" @click="navigateToTagsMgmt">
                 <wd-icon name="add" size="14px" custom-style="margin-right: 8rpx; color: var(--primary-color, #3b82f6)" />
                 <text>管理标签</text>
               </view>
            </view>
          </view>
        </scroll-view>
        
        <view class="popup-footer">
          <wd-button type="primary" block size="large" custom-class="confirm-btn" @click="confirmAddTags">确定 ({{ selectedTagIds.length }})</wd-button>
        </view>
      </view>
    </wd-popup>


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
      position="bottom" 
      custom-style="border-top-left-radius: 32rpx; border-top-right-radius: 32rpx; overflow: hidden;"
      :z-index="10000"
    >
      <view class="popup-menu">
        <view class="popup-title">操作</view>
        <view 
          v-for="(action, index) in actionSheetActions" 
          :key="index" 
          class="popup-item" 
          :style="{ color: action.color || 'var(--text-color-primary, #334155)' }"
          @click="handleActionSelect({ item: action })"
        >
          {{ action.name }}
        </view>
        <view class="popup-item cancel" @click="showActionSheet = false">取消</view>
      </view>
    </wd-popup>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { request } from '@/utils/request'

const props = defineProps<{
  isActive?: boolean
}>()

const activeTab = ref('posts') // 'posts' | 'groups'
const groups = ref<any[]>([])
const showAddGroupPopup = ref(false)
const newGroupName = ref('')
const showMoveGroupPopup = ref(false)
const currentFilterGroupId = ref<number | null>(null)

const scrollTop = ref(0)
const lastScrollTop = ref(0)

const handleScroll = (e: any) => {
  lastScrollTop.value = e.detail.scrollTop
}

watch(() => props.isActive, (newVal) => {
  if (newVal) {
    scrollTop.value = -1
    nextTick(() => {
      scrollTop.value = lastScrollTop.value
    })
  }
})

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
  group_id?: number | null
}

const posts = ref<Post[]>([])
const searchQuery = ref('')
const availableTags = ref<any[]>([])
const currentFilterTagId = ref<number | null>(null)
let searchTimer: any = null

// Action Sheet State
const showActionSheet = ref(false)
const actionSheetActions = ref<any[]>([])
const currentPost = ref<Post | null>(null)

// Tag Popup State
const showTagPopup = ref(false)
const selectedTagIds = ref<number[]>([])
const currentTaggingItem = ref<Post | null>(null)

const formatDate = (dateStr: string | Date) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toISOString().split('T')[0]
}

const fetchTags = async () => {
  try {
    const res = await request('/tags?type=article')
    if (res.ok) {
      availableTags.value = res.list
    }
  } catch (error) {
    console.error('Failed to fetch tags:', error)
  }
}

const applyTagFilter = (tagId: number | null) => {
  currentFilterTagId.value = tagId
  fetchPosts()
}

const navigateToTagsMgmt = () => {
  uni.navigateTo({
    url: '/pages/settings/tags'
  })
}

const fetchGroups = async () => {
  try {
    const res = await request('/article-groups')
    if (res.ok) {
      groups.value = res.list
    }
  } catch (error) {
    console.error('Failed to fetch groups:', error)
  }
}

const confirmAddGroup = async () => {
  if (!newGroupName.value.trim()) return
  try {
    const res = await request('/article-groups', 'POST', { name: newGroupName.value })
    if (res.ok) {
      uni.showToast({ title: '创建成功', icon: 'success' })
      showAddGroupPopup.value = false
      newGroupName.value = ''
      fetchGroups()
    }
  } catch (e) {
    uni.showToast({ title: '创建失败', icon: 'none' })
  }
}

const handleGroupLongPress = (group: any) => {
  uni.showActionSheet({
    itemList: ['删除分组'],
    itemColor: '#fa4350',
    success: (res) => {
      if (res.tapIndex === 0) {
        uni.showModal({
          title: '提示',
          content: `确定要删除分组 "${group.name}" 吗？组内文章将变为未分组状态。`,
          success: async (mRes) => {
            if (mRes.confirm) {
              try {
                await request(`/article-groups/${group.id}`, 'DELETE')
                uni.showToast({ title: '已删除', icon: 'success' })
                fetchGroups()
                if (currentFilterGroupId.value === group.id) {
                  currentFilterGroupId.value = null
                  fetchPosts()
                }
              } catch (e) {
                uni.showToast({ title: '删除失败', icon: 'none' })
              }
            }
          }
        })
      }
    }
  })
}

const handleGroupClick = (group: any) => {
  currentFilterGroupId.value = group.id
  activeTab.value = 'posts'
  fetchPosts()
}

const clearGroupFilter = () => {
  currentFilterGroupId.value = null
  fetchPosts()
}

const getGroupName = (id: number) => {
  const g = groups.value.find(g => g.id === id)
  return g ? g.name : '未知分组'
}

const confirmMoveGroup = async (groupId: number | null) => {
  if (!currentPost.value) return
  try {
    await request(`/articles/${currentPost.value.id}`, 'PUT', { group_id: groupId === null ? 'null' : groupId })
    uni.showToast({ title: '已移动', icon: 'success' })
    showMoveGroupPopup.value = false
    fetchPosts() // Refresh list
    fetchGroups() // Refresh group counts if backend supports it (optional)
  } catch (e) {
    uni.showToast({ title: '移动失败', icon: 'none' })
  }
}

const fetchPosts = async () => {
  try {
    let url = '/articles'
    const params: string[] = []
    
    if (searchQuery.value) {
      params.push(`q=${encodeURIComponent(searchQuery.value)}`)
    }
    
    if (currentFilterTagId.value !== null) {
      params.push(`tag_id=${currentFilterTagId.value}`)
    }

    if (currentFilterGroupId.value !== null) {
      params.push(`group_id=${currentFilterGroupId.value}`)
    }
    
    if (params.length > 0) {
      url += `?${params.join('&')}`
    }

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
    { name: '移动到分组' },
    { name: '设置标签' },
    { name: '删除', color: 'var(--danger-color, #fa4350)' }
  ]
  showActionSheet.value = true
}

const openTagPopup = async (post: Post) => {
  currentTaggingItem.value = post
  selectedTagIds.value = []
  
  // Fetch current tags for this item
  try {
    const res = await request(`/tags/content?type=article&id=${post.id}`)
    if (res.ok) {
      selectedTagIds.value = res.list.map((t: any) => t.id)
    }
  } catch (e) {
    console.error('Failed to fetch item tags:', e)
  }
  
  showTagPopup.value = true
}

const toggleTagSelection = (tagId: number) => {
  const index = selectedTagIds.value.indexOf(tagId)
  if (index > -1) {
    selectedTagIds.value.splice(index, 1)
  } else {
    selectedTagIds.value.push(tagId)
  }
}

const confirmAddTags = async () => {
  if (!currentTaggingItem.value) return
  
  try {
    await request('/tags/content', 'POST', {
      type: 'article',
      id: currentTaggingItem.value.id,
      tagIds: selectedTagIds.value
    })
    
    uni.showToast({ title: '标签已更新', icon: 'success' })
    showTagPopup.value = false
    fetchPosts() // Refresh list to update any tag displays if needed
  } catch (e) {
    console.error('Failed to update tags:', e)
    uni.showToast({ title: '更新失败', icon: 'none' })
  }
}

const handleActionSelect = async ({ item }: any) => {
  showActionSheet.value = false
  if (!currentPost.value) return

  if (item.name === '置顶' || item.name === '取消置顶') {
    handlePin(currentPost.value)
  } else if (item.name === '移动到分组') {
    showMoveGroupPopup.value = true
  } else if (item.name === '设置标签') {
    openTagPopup(currentPost.value)
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
  fetchTags()
  fetchGroups()
  fetchPosts()
  uni.$on('refreshArticles', fetchPosts)
  uni.$on('refreshTags', fetchTags)
})

onUnmounted(() => {
  uni.$off('refreshArticles', fetchPosts)
  uni.$off('refreshTags', fetchTags)
})
</script>

<style scoped>
.content-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  background-color: var(--bg-color, #f8fafc);
}
.fixed-header {
  background: var(--bg-color-card, rgba(255, 255, 255, 0.95));
  backdrop-filter: blur(10px);
  padding: 24rpx 24rpx 0 24rpx;
  border-bottom-left-radius: 24rpx;
  border-bottom-right-radius: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.03);
  /* Adaptive shadow for dark mode if needed, usually shadow is less visible on dark */
  /* box-shadow: 0 4rpx 20rpx var(--shadow-color, rgba(0, 0, 0, 0.03)); */

  z-index: 20;
}
.scroll-container {
  flex: 1;
  height: 0;
  width: 100%;
}
.content {
  width: 100%;
  min-height: 100%;
  padding: 16rpx 24rpx 180rpx 24rpx;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}
.title {
  font-size: 40rpx;
  font-weight: 700;
  color: var(--text-color-primary, #1e293b);
  letter-spacing: -0.5px;
  margin-bottom: 0;
}
.section-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32rpx;
  padding-top: 12rpx;
}
.search-box {
  background: var(--border-color, #f1f5f9);
  border-radius: 20rpx;
  padding: 20rpx 24rpx;
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
  transition: all 0.3s ease;
}
.search-box:active {
  background: var(--border-color, #e2e8f0);
}

.custom-tabs {
  display: flex;
  margin-bottom: 24rpx;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
}
.custom-tab-item {
  padding: 16rpx 32rpx;
  position: relative;
  font-size: 30rpx;
  color: var(--text-color-secondary, #64748b);
  transition: all 0.2s;
}
.custom-tab-item.active {
  color: var(--primary-color, #3b82f6);
  font-weight: 600;
}
.tab-indicator {
  position: absolute;
  bottom: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: 40rpx;
  height: 4rpx;
  background: var(--primary-color, #3b82f6);
  border-radius: 4rpx;
}

.filter-status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(var(--primary-rgb), 0.05);
  padding: 16rpx 24rpx;
  border-radius: 16rpx;
  margin-bottom: 20rpx;
  color: var(--primary-color, #3b82f6);
  font-size: 26rpx;
}

.group-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}
.group-item {
  display: flex;
  align-items: center;
  padding: 32rpx;
  background: var(--bg-color-card, #ffffff);
  border-radius: 24rpx;
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.02);
}
.group-item:active {
  background-color: var(--bg-color, #f8fafc);
}
.group-icon {
  width: 80rpx;
  height: 80rpx;
  background: rgba(var(--primary-rgb), 0.05);
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
}
.group-info {
  flex: 1;
}
.group-name {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--text-color-primary, #1e293b);
  display: block;
  margin-bottom: 4rpx;
}
.group-count {
  font-size: 24rpx;
  color: var(--text-color-secondary, #64748b);
}

.search-input {
  flex: 1;
  font-size: 30rpx;
  color: var(--text-color-primary, #1e293b);
  margin-right: 16rpx;
}
.search-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.tag-filter-bar {
  margin-bottom: 24rpx;
}
.tag-filter-scroll {
  width: 100%;
  white-space: nowrap;
}
.tag-filter-content {
  display: flex;
  padding-right: 24rpx;
}
.filter-chip {
  padding: 12rpx 28rpx;
  background: var(--border-color, #f1f5f9);
  color: var(--text-color-secondary, #64748b);
  border-radius: 32rpx;
  font-size: 26rpx;
  margin-right: 16rpx;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.filter-chip.active {
  background: var(--primary-color, #3b82f6);
  color: #fff;
  font-weight: 500;
  box-shadow: 0 4rpx 12rpx rgba(var(--primary-rgb), 0.25);
}
.filter-chip:active {
  transform: scale(0.96);
}
.filter-chip.manage-btn {
  padding: 12rpx;
  margin-right: 0;
  background: var(--bg-color, #f8fafc);
  border: 1px solid var(--border-color, #e2e8f0);
}

.list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}
.list-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 24rpx;
  border-radius: 24rpx;
  background: var(--bg-color-card, #ffffff);
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.02);
  transition: transform 0.1s;
}
.list-item:active {
  transform: scale(0.98);
  background-color: var(--bg-color, #f8fafc);
}
.post-content {
  flex: 1;
  margin-right: 20rpx;
}
.list-title {
  font-size: 32rpx;
  font-weight: 600;
  margin-bottom: 8rpx;
  color: var(--text-color-primary, #1e293b);
}
.list-summary {
  font-size: 28rpx;
  color: var(--text-color-secondary, #64748b);
  margin-bottom: 16rpx;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.list-meta {
  font-size: 24rpx;
  color: var(--text-color-placeholder, #94a3b8);
}
.chip {
  font-size: 22rpx;
  color: var(--primary-color, #3b82f6);
  background: rgba(var(--primary-rgb), 0.1);
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  white-space: nowrap;
  align-self: flex-start;
}
.empty-tip {
  text-align: center;
  color: var(--text-color-placeholder, #94a3b8);
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
  background: var(--bg-color-card, #fff);
  border-top-left-radius: 32rpx;
  border-top-right-radius: 32rpx;
  overflow: hidden;
}
.popup-title {
  padding: 32rpx;
  text-align: center;
  font-size: 34rpx;
  font-weight: 600;
  color: var(--text-color-primary, #1e293b);
  background: var(--bg-color, #f8fafc);
}
.popup-item {
  padding: 32rpx;
  text-align: center;
  font-size: 32rpx;
  transition: background-color 0.2s;
  color: var(--text-color-primary, #334155);
  border-bottom: 1px solid var(--border-color, #f1f5f9);
}
.popup-item:last-child {
  border-bottom: none;
}
.popup-item:active {
  background-color: var(--border-color, #f1f5f9);
  color: var(--text-color-primary, #0f172a);
}
.popup-item.cancel {
  border-top: 8rpx solid var(--border-color, #f1f5f9);
  color: var(--text-color-secondary, #64748b);
  margin-top: -1px;
}

/* Tag Popup Styles */
.tag-popup-container {
  display: flex;
  flex-direction: column;
  height: 60vh;
  background: var(--bg-color-card, #fff);
}
.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 32rpx;
  border-bottom: 1px solid var(--border-color, #f1f5f9);
}
.popup-close {
  padding: 8rpx;
}
.tag-scroll-view {
  flex: 1;
  height: 0;
}
.tag-content {
  padding: 32rpx;
}
.tag-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}
.tag-chip {
  padding: 12rpx 24rpx;
  background: var(--border-color, #f1f5f9);
  color: var(--text-color-secondary, #64748b);
  border-radius: 32rpx;
  font-size: 28rpx;
  transition: all 0.2s;
  display: flex;
  align-items: center;
}
.tag-chip.active {
  background: var(--primary-color, #3b82f6);
  color: #fff;
  box-shadow: 0 4rpx 12rpx rgba(var(--primary-rgb), 0.3);
}
.tag-chip.add-btn {
  background: rgba(var(--primary-rgb), 0.1);
  color: var(--primary-color, #3b82f6);
  border: 1px dashed var(--border-color, #bfdbfe);
}
.popup-footer {
  padding: 24rpx 32rpx;
  box-shadow: 0 -2rpx 10rpx rgba(0,0,0,0.05);
  background: var(--bg-color-card, #fff);
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
}
.empty-tags {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx 0;
  color: var(--text-color-placeholder, #94a3b8);
  font-size: 28rpx;
}

/* Group Management Styles */
.filter-status-bar {
  padding: 16rpx 24rpx;
  background: var(--border-color, #f1f5f9);
  border-radius: 16rpx;
  margin: 0 24rpx 24rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.filter-status-text {
  font-size: 28rpx;
  color: var(--text-color-primary, #1e293b);
}
.filter-clear-btn {
  padding: 8rpx;
}
.group-list {
  padding: 0 24rpx 24rpx;
}
.group-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx;
  background: var(--bg-color-card, #fff);
  border-radius: 16rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 6rpx rgba(0,0,0,0.03);
}
.group-icon {
  margin-right: 24rpx;
}
.group-info {
  flex: 1;
}
.group-name {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--text-color-primary, #1e293b);
  margin-bottom: 8rpx;
  display: block;
}
.group-count {
  font-size: 24rpx;
  color: var(--text-color-secondary, #94a3b8);
  display: block;
}
.add-group-card {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24rpx;
  background: var(--border-color, #f1f5f9);
  border-radius: 16rpx;
  margin: 0 24rpx 24rpx;
}
.add-icon-circle {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: var(--primary-color, #3b82f6);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
}
.add-text {
  font-size: 28rpx;
  color: var(--text-color-primary, #1e293b);
}
.dialog-container {
  padding: 24rpx;
  background: var(--bg-color-card, #fff);
}
.dialog-title {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--text-color-primary, #1e293b);
  text-align: center;
  margin-bottom: 24rpx;
}
.dialog-input {
  width: 100%;
  height: 80rpx;
  padding: 0 24rpx;
  box-sizing: border-box;
  border: 1px solid var(--border-color, #f1f5f9);
  border-radius: 16rpx;
  font-size: 28rpx;
  color: var(--text-color-primary, #1e293b);
  background: var(--bg-color, #f8fafc);
  margin-bottom: 32rpx;
}
.dialog-footer {
  display: flex;
  justify-content: space-between;
  gap: 24rpx;
}
.dialog-btn {
  flex: 1;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16rpx;
  font-size: 28rpx;
  font-weight: 600;
}
.dialog-btn.cancel {
  background: var(--border-color, #f1f5f9);
  color: var(--text-color-secondary, #94a3b8);
}
.dialog-btn.confirm {
  background: var(--primary-color, #3b82f6);
  color: #fff;
}

</style>