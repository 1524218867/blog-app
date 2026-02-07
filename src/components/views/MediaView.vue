<template>
  <view class="content-wrapper">
    <view class="fixed-header">
      <view class="section-header">
        <view class="title">媒体库</view>
        <view class="header-actions">
          <!-- Actions if needed -->
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

      <!-- Tag Filter Bar -->
      <view class="tag-filter-bar" v-if="availableTags.length > 0">
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
              :class="{ active: currentFilterTagId == tag.id }"
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

    <!-- Custom Tabs -->
    <view class="custom-tabs">
      <view 
        class="custom-tab-item" 
        :class="{ active: activeTab === 'all' }"
        @click="activeTab = 'all'"
      >
        <text>全部</text>
        <view class="tab-indicator" v-if="activeTab === 'all'"></view>
      </view>
      <view 
        class="custom-tab-item" 
        :class="{ active: activeTab === 'image' }"
        @click="activeTab = 'image'"
      >
        <text>图片</text>
        <view class="tab-indicator" v-if="activeTab === 'image'"></view>
      </view>
      <view 
        class="custom-tab-item" 
        :class="{ active: activeTab === 'video' }"
        @click="activeTab = 'video'"
      >
        <text>视频</text>
        <view class="tab-indicator" v-if="activeTab === 'video'"></view>
      </view>
      <view 
        class="custom-tab-item" 
        :class="{ active: activeTab === 'groups' }"
        @click="activeTab = 'groups'"
      >
        <text>分组</text>
        <view class="tab-indicator" v-if="activeTab === 'groups'"></view>
      </view>
    </view>

    <!-- Filter Status Bar -->
    <view class="filter-status-bar" v-if="currentFilterGroupId !== null">
      <view class="filter-status-text">
        正在查看分组: {{ 
          currentFilterGroupType === 'image' 
            ? imageGroups.find(g => g.id === currentFilterGroupId)?.name 
            : videoGroups.find(g => g.id === currentFilterGroupId)?.name 
        }}
      </view>
      <view class="filter-clear-btn" @click="clearGroupFilter">
        <wd-icon name="close-circle-filled" size="16px" color="#94a3b8" />
      </view>
    </view>

    <!-- Swiper Content -->
    <swiper 
      class="content-swiper"
      :current="currentTabIndex"
      @change="handleSwiperChange"
      :duration="300"
    >
      <!-- All Media Tab -->
      <swiper-item>
        <view class="tab-inner">
          <scroll-view 
            scroll-y 
            class="scroll-container" 
            :scrollTop="scrollTopMap.all"
            @scroll="(e: any) => handleScroll(e, 'all')"
          >
            <view class="content">
              <view class="media-grid">
                <view v-for="item in displayedMedia" :key="item.id + item.type" class="media-card" @click="handleMediaClick(item)" @longpress="handleLongPress(item)">
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
                <view v-if="displayedMedia.length === 0" class="empty-tip">未找到相关媒体</view>
              </view>
            </view>
          </scroll-view>
        </view>
      </swiper-item>

      <!-- Images Tab -->
      <swiper-item>
        <view class="tab-inner">
          <scroll-view 
            scroll-y 
            class="scroll-container" 
            :scrollTop="scrollTopMap.image"
            @scroll="(e: any) => handleScroll(e, 'image')"
          >
            <view class="content">
              <view class="media-grid">
                <view v-for="item in imageMedia" :key="item.id + item.type" class="media-card" @click="handleMediaClick(item)" @longpress="handleLongPress(item)">
                  <view class="media-preview image">
                    <image 
                      :src="item.fullUrl" 
                      mode="aspectFill" 
                      class="preview-image" 
                    />
                  </view>
                  <view class="media-info">
                    <view class="media-title">{{ item.title }}</view>
                    <view class="media-meta">{{ item.date }} · {{ item.size }}</view>
                  </view>
                </view>
                <view v-if="imageMedia.length === 0" class="empty-tip">未找到相关图片</view>
              </view>
            </view>
          </scroll-view>
        </view>
      </swiper-item>

      <!-- Videos Tab -->
      <swiper-item>
        <view class="tab-inner">
          <scroll-view 
            scroll-y 
            class="scroll-container" 
            :scrollTop="scrollTopMap.video"
            @scroll="(e: any) => handleScroll(e, 'video')"
          >
            <view class="content">
              <view class="media-grid">
                <view v-for="item in videoMedia" :key="item.id + item.type" class="media-card" @click="handleMediaClick(item)" @longpress="handleLongPress(item)">
                  <view class="media-preview video">
                    <image 
                      v-if="item.coverUrl" 
                      :src="item.coverUrl" 
                      mode="aspectFill" 
                      class="preview-image" 
                    />
                    <text v-else class="type-icon">▶</text>
                  </view>
                  <view class="media-info">
                    <view class="media-title">{{ item.title }}</view>
                    <view class="media-meta">{{ item.date }} · {{ item.size }}</view>
                  </view>
                </view>
                <view v-if="videoMedia.length === 0" class="empty-tip">未找到相关视频</view>
              </view>
            </view>
          </scroll-view>
        </view>
      </swiper-item>

      <!-- Groups Tab -->
      <swiper-item>
        <view class="tab-inner">
          <scroll-view scroll-y class="scroll-container">
            <view class="content">
              <!-- Image Groups -->
              <view class="group-section-title">图片分组</view>
              <view class="group-list">
                <view 
                  v-for="group in imageGroups" 
                  :key="group.id" 
                  class="group-item" 
                  @click="handleGroupClick(group, 'image')"
                  @longpress="handleGroupLongPress(group, 'image')"
                >
                  <view class="group-icon">
                    <wd-icon name="folder" size="24px" color="var(--primary-color, #3b82f6)" />
                  </view>
                  <view class="group-info">
                    <text class="group-name">{{ group.name }}</text>
                    <text class="group-count">{{ group.image_count || 0 }} 张图片</text>
                  </view>
                  <wd-icon name="arrow-right" size="16px" color="#94a3b8" />
                </view>
                
                <view class="add-group-card" @click="openAddGroupPopup('image')">
                   <view class="add-icon-circle">
                     <wd-icon name="add" size="24px" color="#fff" />
                   </view>
                   <text class="add-text">新建图片分组</text>
                </view>
              </view>

              <!-- Video Groups -->
              <view class="group-section-title" style="margin-top: 32rpx;">视频分组</view>
              <view class="group-list">
                <view 
                  v-for="group in videoGroups" 
                  :key="group.id" 
                  class="group-item" 
                  @click="handleGroupClick(group, 'video')"
                  @longpress="handleGroupLongPress(group, 'video')"
                >
                  <view class="group-icon">
                    <wd-icon name="folder" size="24px" color="var(--success-color, #10b981)" />
                  </view>
                  <view class="group-info">
                    <text class="group-name">{{ group.name }}</text>
                    <text class="group-count">{{ group.video_count || 0 }} 个视频</text>
                  </view>
                  <wd-icon name="arrow-right" size="16px" color="#94a3b8" />
                </view>
                
                <view class="add-group-card" @click="openAddGroupPopup('video')">
                   <view class="add-icon-circle" style="background: var(--success-color, #10b981);">
                     <wd-icon name="add" size="24px" color="#fff" />
                   </view>
                   <text class="add-text">新建视频分组</text>
                </view>
              </view>
            </view>
          </scroll-view>
        </view>
      </swiper-item>
    </swiper>

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
              <wd-icon name="info-circle" size="32px" custom-style="color: var(--text-color-placeholder, #cbd5e1); margin-bottom: 16rpx;" />
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
                 <wd-icon v-if="selectedTagIds.includes(tag.id)" name="check" size="14px" color="#fff" style="margin-right: 8rpx;" />
                 <text>{{ tag.name }}</text>
               </view>
               
               <view class="tag-chip add-btn" @click="navigateToTagsMgmt">
                 <wd-icon name="add" size="14px" custom-style="color: var(--primary-color, #3b82f6); margin-right: 8rpx;" />
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

    <!-- Add Group Popup -->
    <wd-popup v-model="showAddGroupPopup" position="center" :z-index="10000" custom-style="border-radius: 16rpx; width: 80%; overflow: hidden; background-color: var(--bg-color-card, #fff);">
      <view class="dialog-container">
        <view class="dialog-header">
          <text class="dialog-title">新建{{ newGroupType === 'image' ? '图片' : '视频' }}分组</text>
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
    <wd-popup v-model="showMoveGroupPopup" position="bottom" :safe-area-inset-bottom="true" :z-index="10000" custom-style="max-height: 60vh; border-radius: 32rpx 32rpx 0 0; overflow: hidden; display: flex; flex-direction: column;">
      <view class="popup-header">
        <text class="popup-title">移动到分组</text>
        <view class="popup-close" @click="showMoveGroupPopup = false">
          <wd-icon name="close" size="22px" custom-style="color: var(--text-color-secondary, #64748b)" />
        </view>
      </view>
      <scroll-view scroll-y class="group-select-list">
        <view 
          class="group-select-item" 
          :class="{ active: moveTargetGroupId === null }"
          @click="moveTargetGroupId = null"
        >
          <wd-icon name="folder-open" size="20px" custom-style="margin-right: 16rpx; color: #94a3b8;" />
          <text>未分组</text>
          <wd-icon v-if="moveTargetGroupId === null" name="check" size="18px" color="var(--primary-color, #3b82f6)" custom-style="margin-left: auto;" />
        </view>
        <view 
          v-for="group in (currentMedia?.type === 'image' ? imageGroups : videoGroups)" 
          :key="group.id" 
          class="group-select-item"
          :class="{ active: moveTargetGroupId === group.id }"
          @click="moveTargetGroupId = group.id"
        >
          <wd-icon name="folder" size="20px" custom-style="margin-right: 16rpx; color: var(--primary-color, #3b82f6);" />
          <text>{{ group.name }}</text>
          <wd-icon v-if="moveTargetGroupId === group.id" name="check" size="18px" color="var(--primary-color, #3b82f6)" custom-style="margin-left: auto;" />
        </view>
      </scroll-view>
      <view class="popup-footer">
        <wd-button type="primary" block size="large" custom-class="confirm-btn" @click="confirmMoveGroup">确定移动</wd-button>
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
      <wd-button custom-class="fab-action-btn" type="primary" round @click="handleUploadImage">
        <wd-icon name="image" size="22px"></wd-icon>
      </wd-button>
      <wd-button custom-class="fab-action-btn" type="success" round @click="handleUploadVideo">
        <wd-icon name="video" size="22px"></wd-icon>
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
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { request, apiBase, handleAuthError } from '@/utils/request'

const props = defineProps<{
  isActive?: boolean
}>()

const scrollTopMap = ref({ all: 0, image: 0, video: 0 })
const lastScrollTopMap = ref({ all: 0, image: 0, video: 0 })

const handleScroll = (e: any, type: 'all' | 'image' | 'video') => {
  lastScrollTopMap.value[type] = e.detail.scrollTop
}

watch(() => props.isActive, (newVal) => {
  if (newVal) {
    const saved = { ...lastScrollTopMap.value }
    scrollTopMap.value = { all: -1, image: -1, video: -1 }
    nextTick(() => {
      scrollTopMap.value = saved
    })
  }
})

const media = ref<any[]>([])
const activeTab = ref<'all' | 'image' | 'video' | 'groups'>('all')
const searchQuery = ref('')
const availableTags = ref<any[]>([])
const currentFilterTagId = ref<number | null>(null)
const currentFilterGroupId = ref<number | null>(null)
const currentFilterGroupType = ref<'image' | 'video' | null>(null)
const imageGroups = ref<any[]>([])
const videoGroups = ref<any[]>([])
let searchTimer: any = null

// Computed index for swiper
const currentTabIndex = computed(() => {
  const map: Record<string, number> = { 'all': 0, 'image': 1, 'video': 2, 'groups': 3 }
  return map[activeTab.value] || 0
})

const handleSwiperChange = (e: any) => {
  const index = e.detail.current
  const map: Record<number, 'all' | 'image' | 'video' | 'groups'> = { 0: 'all', 1: 'image', 2: 'video', 3: 'groups' }
  activeTab.value = map[index] || 'all'
}

// Action Sheet State
const showActionSheet = ref(false)
const actionSheetActions = ref<any[]>([])
const currentMedia = ref<any>(null)

// Group Management State
const showAddGroupPopup = ref(false)
const newGroupName = ref('')
const newGroupType = ref<'image' | 'video'>('image')
const showMoveGroupPopup = ref(false)
const moveTargetGroupId = ref<number | null>(null) // null means ungrouped

const fetchGroups = async () => {
  try {
    const [imgGroupsRes, vidGroupsRes] = await Promise.all([
      request('/image-groups'),
      request('/video-groups')
    ])
    if (imgGroupsRes.ok) imageGroups.value = imgGroupsRes.list
    if (vidGroupsRes.ok) videoGroups.value = vidGroupsRes.list
  } catch (error) {
    console.error('Failed to fetch groups:', error)
  }
}

// Tag Popup State
const showTagPopup = ref(false)
const selectedTagIds = ref<number[]>([])
const currentTaggingItem = ref<any>(null)

const fetchTags = async () => {
  try {
    const res = await request('/tags?type=media')
    if (res.ok) {
      availableTags.value = res.list
    }
  } catch (error) {
    console.error('Failed to fetch tags:', error)
  }
}

const applyTagFilter = (tagId: number | null) => {
  // If clicking the same tag, toggle it off (set to null)
  if (currentFilterTagId.value === tagId) {
    currentFilterTagId.value = null
  } else {
    currentFilterTagId.value = tagId
  }
  fetchMedia()
}

const navigateToTagsMgmt = () => {
  uni.navigateTo({
    url: '/pages/settings/tags'
  })
}

const fetchMedia = async () => {
  try {
    let queryParams = ''
    const params: string[] = []
    
    if (searchQuery.value) {
      params.push(`q=${encodeURIComponent(searchQuery.value)}`)
    }
    
    if (currentFilterTagId.value !== null) {
      params.push(`tag_id=${currentFilterTagId.value}`)
    }
    
    if (params.length > 0) {
      queryParams = `?${params.join('&')}`
    }

    console.log('Fetching media with params:', queryParams)

    // Special handling for group filtering
    // If we are filtering by group, we only need to fetch that specific type
    let fetchImages = true
    let fetchVideos = true

    if (currentFilterGroupId.value !== null) {
      if (currentFilterGroupType.value === 'image') fetchVideos = false
      if (currentFilterGroupType.value === 'video') fetchImages = false
      params.push(`group_id=${currentFilterGroupId.value}`)
      queryParams = `?${params.join('&')}`
    }

    const promises = []
    if (fetchImages) promises.push(request(`/images${queryParams}`))
    else promises.push(Promise.resolve([]))

    if (fetchVideos) promises.push(request(`/videos${queryParams}`))
    else promises.push(Promise.resolve([]))

    const [images, videos] = await Promise.all(promises)
    
    const imageList = (Array.isArray(images) ? images : []).map((item: any) => ({
      ...item,
      type: 'image',
      title: item.filename, // Backend might return filename, use it as title
      date: item.created_at ? item.created_at.split('T')[0] : '',
      fullUrl: item.url.startsWith('http') ? item.url : `${apiBase}${item.url}`,
      displayMeta: '图片',
      size: 'Image', // Placeholder size
      isPinned: !!item.isPinned
    }))

    const videoList = (Array.isArray(videos) ? videos : []).map((item: any) => ({
      ...item,
      type: 'video',
      title: item.filename,
      date: item.created_at ? item.created_at.split('T')[0] : '',
      fullUrl: item.url.startsWith('http') ? item.url : `${apiBase}${item.url}`,
      coverUrl: item.cover ? (item.cover.startsWith('http') ? item.cover : `${apiBase}${item.cover}`) : '',
      displayMeta: item.duration || '视频',
      size: 'Video', // Placeholder size
      isPinned: !!item.isPinned
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
  fetchTags()
  fetchGroups()
  fetchMedia()
  uni.$on('refreshTags', fetchTags)
})

const handleGroupClick = (group: any, type: 'image' | 'video') => {
  currentFilterGroupId.value = group.id
  currentFilterGroupType.value = type
  // Switch to relevant tab
  activeTab.value = type
  fetchMedia()
}

const clearGroupFilter = () => {
  currentFilterGroupId.value = null
  currentFilterGroupType.value = null
  fetchMedia()
}

const openAddGroupPopup = (type: 'image' | 'video') => {
  newGroupType.value = type
  newGroupName.value = ''
  showAddGroupPopup.value = true
}

const confirmAddGroup = async () => {
  if (!newGroupName.value.trim()) {
    uni.showToast({ title: '请输入分组名称', icon: 'none' })
    return
  }
  
  try {
    const endpoint = newGroupType.value === 'image' ? '/image-groups' : '/video-groups'
    await request(endpoint, 'POST', { name: newGroupName.value })
    uni.showToast({ title: '创建成功', icon: 'success' })
    showAddGroupPopup.value = false
    fetchGroups()
  } catch (e) {
    console.error(e)
    uni.showToast({ title: '创建失败', icon: 'none' })
  }
}

const handleGroupLongPress = (group: any, type: 'image' | 'video') => {
  uni.showActionSheet({
    itemList: ['删除分组'],
    itemColor: '#fa4350',
    success: (res) => {
      if (res.tapIndex === 0) {
        uni.showModal({
          title: '提示',
          content: '确定要删除该分组吗？组内媒体将被移出分组（不会删除）。',
          success: async (modalRes) => {
            if (modalRes.confirm) {
              try {
                const endpoint = type === 'image' ? `/image-groups/${group.id}` : `/video-groups/${group.id}`
                await request(endpoint, 'DELETE')
                uni.showToast({ title: '删除成功', icon: 'success' })
                fetchGroups()
                // If currently filtering by this group, clear filter
                if (currentFilterGroupId.value === group.id && currentFilterGroupType.value === type) {
                  clearGroupFilter()
                }
              } catch (e) {
                console.error(e)
                uni.showToast({ title: '删除失败', icon: 'none' })
              }
            }
          }
        })
      }
    }
  })
}

const handleMoveToGroup = (item: any) => {
  currentMedia.value = item
  showMoveGroupPopup.value = true
  moveTargetGroupId.value = item.group_id || null
}

const confirmMoveGroup = async () => {
  if (!currentMedia.value) return
  
  try {
    const endpoint = currentMedia.value.type === 'image' ? `/images/${currentMedia.value.id}` : `/videos/${currentMedia.value.id}`
    await request(endpoint, 'PUT', { group_id: moveTargetGroupId.value })
    uni.showToast({ title: '移动成功', icon: 'success' })
    showMoveGroupPopup.value = false
    fetchMedia()
    fetchGroups() // Counts might change
  } catch (e) {
    console.error(e)
    uni.showToast({ title: '操作失败', icon: 'none' })
  }
}

const imageMedia = computed(() => media.value.filter(m => m.type === 'image'))
const videoMedia = computed(() => media.value.filter(m => m.type === 'video'))

const displayedMedia = computed(() => {
  if (activeTab.value === 'image') return imageMedia.value
  if (activeTab.value === 'video') return videoMedia.value
  return media.value
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

const handlePin = async (item: any) => {
  try {
     await request('/content/pin', 'POST', {
       type: item.type, // 'image' or 'video'
       id: item.id,
       isPinned: !item.isPinned
     })
     uni.showToast({ title: item.isPinned ? '已取消置顶' : '已置顶', icon: 'success' })
     fetchMedia()
     uni.$emit('refreshHome')
  } catch(e) {
     console.error(e)
     uni.showToast({ title: '操作失败', icon: 'none' })
  }
}

const handleLongPress = (item: any) => {
  currentMedia.value = item
  actionSheetActions.value = [
    { name: item.isPinned ? '取消置顶' : '置顶' },
    { name: '移动到分组' },
    { name: '设置标签' },
    { name: '删除', color: 'var(--danger-color, #fa4350)' }
  ]
  showActionSheet.value = true
}

const openTagPopup = async (item: any) => {
  currentTaggingItem.value = item
  selectedTagIds.value = []
  
  // Fetch current tags for this item
  try {
    const res = await request(`/tags/content?type=${item.type}&id=${item.id}`)
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
      type: currentTaggingItem.value.type,
      id: currentTaggingItem.value.id,
      tagIds: selectedTagIds.value,
      mode: 'replace'
    })
    
    uni.showToast({ title: '标签已更新', icon: 'success' })
    showTagPopup.value = false
    fetchMedia() // Refresh list
  } catch (e) {
    console.error('Failed to update tags:', e)
    uni.showToast({ title: '更新失败', icon: 'none' })
  }
}

const handleActionSelect = async ({ item }: any) => {
  showActionSheet.value = false
  if (!currentMedia.value) return

  if (item.name === '置顶' || item.name === '取消置顶') {
    handlePin(currentMedia.value)
  } else if (item.name === '移动到分组') {
    handleMoveToGroup(currentMedia.value)
  } else if (item.name === '设置标签') {
    openTagPopup(currentMedia.value)
  } else if (item.name === '删除') {
    uni.showModal({
      title: '提示',
      content: `确定要删除这个${currentMedia.value.type === 'image' ? '图片' : '视频'}吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            uni.showLoading({ title: '删除中...' })
            const endpoint = currentMedia.value.type === 'image' ? `/images/${currentMedia.value.id}` : `/videos/${currentMedia.value.id}`
            await request(endpoint, 'DELETE')
            uni.showToast({ title: '删除成功', icon: 'success' })
            fetchMedia()
          } catch (error) {
            console.error('Failed to delete media:', error)
            uni.showToast({ title: '删除失败', icon: 'none' })
          } finally {
            uni.hideLoading()
          }
        }
      }
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
      
      // Check if we are currently filtering by an image group
      const targetGroupId = (currentFilterGroupId.value && currentFilterGroupType.value === 'image') 
        ? currentFilterGroupId.value 
        : null

      for (const filePath of tempFilePaths) {
        try {
          await new Promise((resolve) => {
            uni.uploadFile({
              url: `${apiBase}/upload/multiple`,
              filePath: filePath,
              name: 'files',
              formData: targetGroupId ? { group_id: targetGroupId } : {},
              header: {
                Authorization: `Bearer ${uni.getStorageSync('token')}`
              },
              success: (uploadRes) => {
                if (uploadRes.statusCode === 401) {
                  handleAuthError()
                  resolve(null)
                  return
                }
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
      if (targetGroupId) fetchGroups() // Refresh counts
    }
  })
}

const handleUploadVideo = () => {
  uni.chooseVideo({
    sourceType: ['album', 'camera'],
    success: (res) => {
      uni.showLoading({ title: '上传中...' })
      
      // Check if we are currently filtering by a video group
      const targetGroupId = (currentFilterGroupId.value && currentFilterGroupType.value === 'video') 
        ? currentFilterGroupId.value 
        : null

      uni.uploadFile({
        url: `${apiBase}/upload/videos`,
        filePath: res.tempFilePath,
        name: 'files',
        formData: targetGroupId ? { group_id: targetGroupId } : {},
        header: {
          Authorization: `Bearer ${uni.getStorageSync('token')}`
        },
        success: (uploadRes) => {
          uni.hideLoading()
          if (uploadRes.statusCode === 401) {
            handleAuthError()
            return
          }
          const data = JSON.parse(uploadRes.data)
          if (data.ok) {
            uni.showToast({ title: '上传成功' })
            fetchMedia()
            if (targetGroupId) fetchGroups() // Refresh counts
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
  z-index: 20;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32rpx;
  padding-top: 12rpx;
}
.title {
  font-size: 40rpx;
  font-weight: 700;
  color: var(--text-color-primary, #1e293b);
  letter-spacing: -0.5px;
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

/* Custom Tabs Styles */
.custom-tabs {
  display: flex;
  background: transparent;
  padding: 0 24rpx;
  margin-top: 16rpx;
  z-index: 10;
}
.custom-tab-item {
  flex: 1;
  text-align: center;
  padding: 24rpx 0;
  font-size: 30rpx;
  color: var(--text-color-secondary, #64748b);
  position: relative;
  font-weight: 500;
  transition: all 0.3s;
}
.custom-tab-item.active {
  color: var(--text-color-primary, #0f172a);
  font-weight: 700;
  font-size: 32rpx;
}
.tab-indicator {
  position: absolute;
  bottom: 12rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 32rpx;
  height: 6rpx;
  background: var(--primary-color, #3b82f6);
  border-radius: 4rpx;
  box-shadow: 0 2rpx 8rpx rgba(var(--primary-rgb), 0.4);
}

/* Swiper Styles */
.content-swiper {
  flex: 1;
  height: 0;
  width: 100%;
}
.content-swiper swiper-item {
  height: 100%;
  width: 100%;
}
.tab-inner {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
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

.media-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
}
.media-card {
  background: var(--bg-color-card, #ffffff);
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.02);
  transition: transform 0.1s;
}
.media-card:active {
  transform: scale(0.98);
}
.media-preview {
  width: 100%;
  aspect-ratio: 16/9;
  background: var(--bg-color, #f8fafc);
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
  color: var(--text-color-secondary, #64748b);
}
.media-info {
  padding: 20rpx;
}
.media-title {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--text-color-primary, #1e293b);
  margin-bottom: 8rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.media-meta {
  font-size: 24rpx;
  color: var(--text-color-secondary, #94a3b8);
}
.empty-tip {
  grid-column: span 2;
  text-align: center;
  color: var(--text-color-placeholder, #94a3b8);
  padding: 40rpx 0;
  font-size: 28rpx;
}

:deep(.fab-action-btn) {
  min-width: auto !important;
  box-sizing: border-box;
  width: 32px !important;
  height: 32px !important;
  border-radius: 16px !important;
  margin: 8rpx;
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
  border-top: 1px solid var(--border-color, #f1f5f9);
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
.group-section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--text-color-primary, #1e293b);
  padding: 0 24rpx 16rpx;
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
.dialog-header {
  margin-bottom: 24rpx;
  text-align: center;
}
.dialog-title {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--text-color-primary, #1e293b);
}
.dialog-content {
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
.group-select-list {
  flex: 1;
  height: 0;
  padding: 0;
}
.group-select-item {
  display: flex;
  align-items: center;
  padding: 32rpx;
  background: var(--bg-color-card, #fff);
  border-bottom: 1px solid var(--border-color, #f1f5f9);
}
.group-select-item.active {
  background-color: var(--bg-color, #f8fafc);
}
.group-select-item text {
  font-size: 30rpx;
  color: var(--text-color-primary, #1e293b);
}

</style>