<template>
  <view class="content-wrapper">
    <view class="fixed-header">
      <view class="section-header">
        <view class="title">我的音乐</view>
        <view class="actions">
          <text v-if="activeTab === 'artists'" class="action-btn" @click="showAddArtistPopup = true">添加歌手</text>
          <text v-else-if="activeTab === 'net' && netSongs.length > 0" class="action-btn" @click="toggleSelectionMode">
            {{ isSelectionMode ? '取消' : '批量管理' }}
          </text>
          <text v-else class="action-btn" @click="playAll">播放全部</text>
        </view>
      </view>

      <!-- Search Box -->
      <view class="search-box">
        <input 
          class="search-input" 
          v-model="searchQuery" 
          placeholder="搜索音乐或歌手..." 
          confirm-type="search"
          @confirm="fetchSongs"
          @input="handleSearchInput"
        />
        <view class="search-icon">
          <wd-icon name="search" size="22px"></wd-icon>
        </view>
      </view>
    </view>

    <!-- Custom Tabs and Swiper Implementation -->
    <view class="custom-tabs">
      <view 
        class="custom-tab-item" 
        :class="{ active: activeTab === 'songs' }"
        @click="activeTab = 'songs'"
      >
        <text>单曲</text>
        <view class="tab-indicator" v-if="activeTab === 'songs'"></view>
      </view>
      <view 
        class="custom-tab-item" 
        :class="{ active: activeTab === 'artists' }"
        @click="activeTab = 'artists'"
      >
        <text>歌手</text>
        <view class="tab-indicator" v-if="activeTab === 'artists'"></view>
      </view>
      <view 
        class="custom-tab-item" 
        :class="{ active: activeTab === 'net' }"
        @click="activeTab = 'net'"
      >
        <text>全网</text>
        <view class="tab-indicator" v-if="activeTab === 'net'"></view>
      </view>
    </view>

    <!-- Swiper Content -->
    <swiper 
      class="content-swiper"
      :current="currentTabIndex"
      @change="handleSwiperChange"
      :duration="300"
    >
      <!-- Songs Tab -->
      <swiper-item>
        <view class="tab-inner">
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

          <scroll-view 
            scroll-y 
            class="scroll-container" 
            :scroll-top="scrollTopMap.songs" 
            :scroll-into-view="scrollIntoViewId" 
            scroll-with-animation 
            @scroll="(e: any) => handleScroll(e, 'songs')"
          >
            <view class="music-list">
              <view v-for="(song, index) in songs" :key="song.id" :id="'song-' + song.id" class="song-item" @click="playSong(song)" @longpress="handleLongPress(song)">
                <view class="song-index">
                  <text>{{ index + 1 }}</text>
                </view>
                <view class="song-cover">
                  <image v-if="song.coverUrl" :src="song.coverUrl" mode="aspectFill" class="cover-image" />
                  <view v-else class="cover-placeholder">
                    <wd-icon name="music" size="20px" custom-style="color: var(--text-color-placeholder, #cbd5e1)" />
                  </view>
                  <view v-if="audioStore.currentSong?.id === song.id" class="playing-overlay">
                    <view class="playing-icon-css">
                      <view class="line line1"></view>
                      <view class="line line2"></view>
                      <view class="line line3"></view>
                      <view class="line line4"></view>
                    </view>
                  </view>
                </view>
                <view class="song-info">
                  <view class="name-row">
                    <view class="song-name" :class="{ 'active': audioStore.currentSong?.id === song.id }">{{ song.name }}</view>
                  </view>
                  <view class="song-artist">{{ song.artist }}</view>
                </view>
              </view>
              <view v-if="songs.length === 0" class="empty-tip">未找到相关音乐</view>
            </view>
          </scroll-view>
        </view>
      </swiper-item>

      <!-- Artists Tab -->
      <swiper-item>
        <view class="tab-inner">
          <scroll-view 
            scroll-y 
            class="scroll-container" 
            :scroll-top="scrollTopMap.artists" 
            @scroll="(e: any) => handleScroll(e, 'artists')"
          >
          <view v-if="!searchQuery" class="artist-view">
            <view v-if="selectedArtistGroup" class="artist-detail">
              <view class="artist-header">
                <view class="header-left" @click="selectedArtistGroup = null">
                  <wd-icon name="arrow-left" size="20px" custom-style="color: var(--primary-color, #3b5bdb)"></wd-icon>
                  <text class="artist-title">{{ selectedArtistGroup.name }}</text>
                </view>
                <view class="header-right" @click="handleArtistOptions(selectedArtistGroup)">
                  <wd-icon name="more" size="20px" custom-style="color: var(--text-color-secondary, #64748b)"></wd-icon>
                </view>
              </view>
              <view class="music-list">
                 <view v-for="(song, index) in artistSongs" :key="song.id" class="song-item" @click="playSong(song)" @longpress="handleLongPress(song)">
                  <view class="song-index">
                    <text>{{ index + 1 }}</text>
                  </view>
                  <view class="song-cover">
                     <image v-if="song.coverUrl" :src="song.coverUrl" mode="aspectFill" class="cover-image" />
                     <view v-else class="cover-placeholder">
                       <wd-icon name="music" size="20px" custom-style="color: var(--text-color-placeholder, #cbd5e1)" />
                     </view>
                     <view v-if="audioStore.currentSong?.id === song.id" class="playing-overlay">
                       <view class="playing-icon-css">
                         <view class="line line1"></view>
                         <view class="line line2"></view>
                         <view class="line line3"></view>
                         <view class="line line4"></view>
                       </view>
                     </view>
                  </view>
                  <view class="song-info">
                    <view class="name-row">
                      <view class="song-name" :class="{ 'active': audioStore.currentSong?.id === song.id }">{{ song.name }}</view>
                    </view>
                    <view class="song-artist">{{ song.artist }}</view>
                  </view>
                </view>
              </view>
            </view>
        
            <view v-else class="artist-list">
               <view v-for="artist in artistGroups" :key="artist.id" class="artist-item" @click="selectArtist(artist)" @longpress="handleArtistLongPress(artist)">
                 <view class="artist-icon">
                   <image v-if="artist.cover" :src="artist.cover" mode="aspectFill" class="group-cover-img" />
                   <wd-icon v-else name="user" size="24px" custom-style="color: var(--bg-color-card, #fff)"></wd-icon>
                 </view>
                 <view class="artist-info">
                   <text class="artist-name">{{ artist.name }}</text>
                   <text class="artist-count">{{ artist.count }} 首歌曲</text>
                 </view>
                 <wd-icon name="arrow-right" size="16px" custom-style="color: var(--text-color-placeholder, #94a3b8)"></wd-icon>
               </view>
             </view>
          </view>
          
          <view v-else class="music-list">
            <view v-for="(song, index) in songs" :key="song.id" :id="'song-' + song.id" class="song-item" @click="playSong(song)" @longpress="handleLongPress(song)">
              <view class="song-index">
                <text>{{ index + 1 }}</text>
              </view>
              <view class="song-cover">
                 <image v-if="song.coverUrl" :src="song.coverUrl" mode="aspectFill" class="cover-image" />
                 <view v-else class="cover-placeholder">
                   <wd-icon name="music" size="20px" custom-style="color: var(--text-color-placeholder, #cbd5e1)" />
                 </view>
                <view v-if="audioStore.currentSong?.id === song.id" class="playing-overlay">
                  <view class="playing-icon-css">
                    <view class="line line1"></view>
                    <view class="line line2"></view>
                    <view class="line line3"></view>
                    <view class="line line4"></view>
                  </view>
                </view>
              </view>
              <view class="song-info">
                <view class="name-row">
                  <view class="song-name" :class="{ 'active': audioStore.currentSong?.id === song.id }">{{ song.name }}</view>
                </view>
                <view class="song-artist">{{ song.artist }}</view>
              </view>
            </view>
            <view v-if="songs.length === 0" class="empty-tip">未找到相关音乐</view>
          </view>
        </scroll-view>
        </view>
      </swiper-item>

      <!-- Net Tab -->
      <swiper-item>
        <view class="tab-inner">
          <scroll-view 
            scroll-y 
            class="scroll-container" 
          :scroll-top="scrollTopMap.net" 
          @scroll="(e: any) => handleScroll(e, 'net')"
        >
          <view class="music-list" :class="{ 'selection-mode': isSelectionMode }">
            <view v-for="(song, index) in netSongs" :key="song.id" class="song-item" @click="handleSongClick(song)">
              <view v-if="isSelectionMode" class="checkbox-col" @click.stop="toggleSelection(song)">
                <wd-icon :name="isSelected(song) ? 'check-circle-filled' : 'check-circle'" size="22px" :custom-style="'color: ' + (isSelected(song) ? 'var(--primary-color, #3b5bdb)' : 'var(--text-color-placeholder, #cbd5e1)')"></wd-icon>
              </view>
              <view class="song-index">
                <text>{{ index + 1 }}</text>
              </view>
              <view class="song-cover">
                 <image v-if="song.coverUrl" :src="song.coverUrl" mode="aspectFill" class="cover-image" />
                 <view v-else class="cover-placeholder">
                   <wd-icon name="music" size="20px" custom-style="color: var(--text-color-placeholder, #cbd5e1)" />
                 </view>
                 <view v-if="audioStore.currentSong?.id === song.id" class="playing-overlay">
                   <view class="playing-icon-css">
                     <view class="line line1"></view>
                     <view class="line line2"></view>
                     <view class="line line3"></view>
                     <view class="line line4"></view>
                   </view>
                 </view>
              </view>
              <view class="song-info">
                <view class="name-row">
                  <view class="song-name" :class="{ 'active': audioStore.currentSong?.id === song.id }">{{ song.name }}</view>
                </view>
                <view class="song-artist">{{ song.artist }}</view>
              </view>
              <view class="song-actions" @click.stop="addToFavorites(song)">
                 <wd-icon name="add-circle" size="24px" custom-style="color: var(--primary-color, #3b5bdb)"></wd-icon>
              </view>
            </view>
            <view v-if="netSongs.length === 0" class="empty-tip">{{ searchQuery ? '未找到相关音乐' : '请输入歌名进行搜索' }}</view>
          </view>
          </scroll-view>
        </view>
      </swiper-item>
    </swiper>

    <!-- Tag Selection Popup -->
    <wd-popup v-model="showTagPopup" position="bottom" :z-index="10000" custom-style="max-height: 70vh; border-radius: 32rpx 32rpx 0 0; overflow: hidden; display: flex; flex-direction: column;">
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
                 <wd-icon v-if="selectedTagIds.includes(tag.id)" name="check" size="14px" custom-style="color: #fff; margin-right: 8rpx;" />
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

    <!-- Batch Action Bar -->
    <view v-if="isSelectionMode" class="batch-action-bar">
      <view class="batch-left" @click="toggleSelectAll">
        <wd-icon :name="selectedNetSongs.length > 0 && selectedNetSongs.length === netSongs.length ? 'check-circle-filled' : 'check-circle'" size="22px" :custom-style="'color: ' + (selectedNetSongs.length > 0 && selectedNetSongs.length === netSongs.length ? 'var(--primary-color, #3b5bdb)' : 'var(--text-color-placeholder, #94a3b8)')"></wd-icon>
        <text class="select-all-text">全选</text>
        <text class="selected-count">已选 {{ selectedNetSongs.length }} 首</text>
      </view>
      <view class="batch-right">
        <view class="batch-btn confirm" :class="{ disabled: selectedNetSongs.length === 0 }" @click="batchAddToGroup">
          加入分组
        </view>
      </view>
    </view>

    <!-- Locate Current Song FAB -->
    <view 
      v-if="activeTab === 'songs' && audioStore.currentSong" 
      class="locate-fab"
      @click="scrollToCurrentSong"
    >
      <image src="/static/miaodian.png" class="locate-icon" mode="aspectFit" />
    </view>

    <!-- Popup Action Sheet -->
    <wd-popup 
      v-model="showActionSheet" 
      position="bottom" 
      custom-style="border-top-left-radius: 32rpx; border-top-right-radius: 32rpx; overflow: hidden;"
      :z-index="10000"
    >
      <view class="popup-menu">
        <view class="popup-title">{{ actionSheetType === 'delete' || actionSheetType === 'options' ? '操作' : '选择分组' }}</view>
        <scroll-view scroll-y style="max-height: 600rpx;">
          <block v-for="(action, index) in actionSheetActions" :key="index">
            <view 
              class="popup-item" 
          :style="{ color: action.color || 'var(--text-color-primary, #334155)' }"
          @click="handleActionSelect({ item: action })"
        >
              {{ action.name }}
            </view>
          </block>
        </scroll-view>
        <view class="popup-item cancel" @click="showActionSheet = false">取消</view>
      </view>
    </wd-popup>

    <!-- Add Artist Popup -->
    <wd-popup v-model="showAddArtistPopup" position="center" :z-index="10000" custom-style="border-radius: 16rpx; width: 80%; overflow: hidden; background-color: var(--bg-color-card, #fff);">
      <view class="dialog-container">
        <view class="dialog-header">
          <text class="dialog-title">添加歌手</text>
        </view>
        <view class="dialog-content">
          <input 
            class="dialog-input" 
            v-model="newArtistName" 
            placeholder="请输入歌手名字" 
            :focus="showAddArtistPopup"
          />
        </view>
        <view class="dialog-footer">
          <view class="dialog-btn cancel" @click="showAddArtistPopup = false">取消</view>
          <view class="dialog-btn confirm" @click="handleAddArtist">创建</view>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { request, apiBase } from '@/utils/request'
import { audioStore } from '@/store/audio'

const props = defineProps<{
  user?: any
  isActive?: boolean
}>()

const scrollTopMap = ref({ songs: 0, artists: 0, net: 0 })
const lastScrollTopMap = ref({ songs: 0, artists: 0, net: 0 })

const handleScroll = (e: any, type: 'songs' | 'artists' | 'net') => {
  lastScrollTopMap.value[type] = e.detail.scrollTop
}

watch(() => props.isActive, (newVal) => {
  if (newVal) {
    const saved = { ...lastScrollTopMap.value }
    scrollTopMap.value = { songs: -1, artists: -1, net: -1 }
    nextTick(() => {
      scrollTopMap.value = saved
    })
  }
})

interface Song {
  id: number
  name: string
  artist: string
  url: string
  coverUrl?: string
  lyrics?: string
  n?: number
  sourceQuery?: string
}

const songs = ref<Song[]>([])
const netSongs = ref<Song[]>([])
const searchQuery = ref('')
const currentFilterTagId = ref<number | null>(null)
const activeTab = ref<'songs' | 'artists' | 'net'>('songs')

// Computed index for swiper
const currentTabIndex = computed(() => {
  const map: Record<string, number> = { 'songs': 0, 'artists': 1, 'net': 2 }
  return map[activeTab.value] || 0
})

const handleSwiperChange = (e: any) => {
  const index = e.detail.current
  const map: Record<number, 'songs' | 'artists' | 'net'> = { 0: 'songs', 1: 'artists', 2: 'net' }
  activeTab.value = map[index] || 'songs'
}

const selectedArtistGroup = ref<any | null>(null)
const isSelectionMode = ref(false)
const selectedNetSongs = ref<Song[]>([])
const scrollIntoViewId = ref('')
let searchTimer: any = null

// Action Sheet State
const showActionSheet = ref(false)
const actionSheetActions = ref<any[]>([])
const currentActionSong = ref<Song | null>(null)
const currentActionArtist = ref<any>(null)
const actionSheetType = ref<'delete' | 'addToGroup' | 'batchAddToGroup' | 'options' | 'deleteArtist'>('delete')

const artistGroups = ref<any[]>([])
const artistSongs = ref<Song[]>([])

const showAddArtistPopup = ref(false)
const newArtistName = ref('')

const handleAddArtist = async () => {
  if (!newArtistName.value.trim()) {
    uni.showToast({ title: '请输入歌手名字', icon: 'none' })
    return
  }
  
  try {
    await request('/audio-groups', 'POST', {
      name: newArtistName.value.trim()
    })
    uni.showToast({ title: '添加成功', icon: 'success' })
    showAddArtistPopup.value = false
    newArtistName.value = ''
    fetchArtistGroups() // Refresh list
  } catch (e) {
    console.error(e)
    uni.showToast({ title: '添加失败', icon: 'none' })
  }
}


const fetchArtistGroups = async () => {
  try {
    const res = await request('/audio-groups')
    if (res.ok) {
      artistGroups.value = res.list.map((item: any) => ({
        id: item.id,
        name: item.name,
        count: item.audioCount || 0,
        cover: item.cover ? (item.cover.startsWith('http') ? item.cover : `${apiBase}${item.cover}`) : ''
      }))
      // Add "Unknown Artist" group manually if needed
      const ungroupedData = await request('/audios?group_id=null')
      if (Array.isArray(ungroupedData) && ungroupedData.length > 0) {
          artistGroups.value.push({
            id: 'null',
            name: '未分组',
            count: ungroupedData.length,
            cover: ''
          })
      }
    }
  } catch (error) {
    console.error('Failed to fetch groups:', error)
  }
}

const fetchSongsByGroup = async (groupId: string | number) => {
  try {
    const url = groupId === 'null' ? '/audios?group_id=null' : `/audios?group_id=${groupId}`
    const data = await request(url)
    const list = Array.isArray(data) ? data : []
    artistSongs.value = list.map((item: any) => ({
      id: item.id,
      name: item.filename.replace(/\.[^/.]+$/, ""),
      artist: item.singer || 'Unknown Artist',
      url: item.url.startsWith('http') ? item.url : `${apiBase}${item.url}`,
      coverUrl: item.cover ? (item.cover.startsWith('http') ? item.cover : `${apiBase}${item.cover}`) : '',
      lyrics: item.lyrics || ''
    }))
  } catch (error) {
    console.error('Failed to fetch group songs:', error)
  }
}

// Watch activeTab to handle data loading and state reset
watch(activeTab, (newVal) => {
  // Clear search query when switching tabs to avoid empty views due to filtering
  searchQuery.value = ''
  selectedArtistGroup.value = null
  isSelectionMode.value = false // Reset selection mode when switching tabs
  
  if (newVal === 'artists') {
    fetchArtistGroups()
  } else if (newVal === 'net') {
    // Net tab logic
    netSongs.value = []
  } else {
    fetchSongs() // Refresh all songs when switching back
  }
})

const selectArtist = (artistGroup: any) => {
  selectedArtistGroup.value = artistGroup
  fetchSongsByGroup(artistGroup.id)
}

const searchNetMusic = async () => {
  if (!searchQuery.value.trim()) return
  
  uni.showLoading({ title: '搜索中...' })
  try {
    const res: any = await new Promise((resolve, reject) => {
      uni.request({
        url: 'http://lpz.chatc.vip/apiqq.php',
        method: 'GET',
        data: {
          msg: searchQuery.value,
          type: 'json'
        },
        success: (res) => resolve(res.data),
        fail: (err) => reject(err)
      })
    })

    if (res.code === 200 && Array.isArray(res.data)) {
      netSongs.value = res.data.map((item: any) => ({
        id: Date.now() + item.n, // Generate a temporary unique ID
        name: item.song_title,
        artist: item.song_singer,
        url: '', // Empty initially
        coverUrl: '', // Empty initially
        lyrics: '',
        n: item.n,
        sourceQuery: searchQuery.value
      }))
      
      // Automatically fetch details (covers) for all songs
      fetchCoversForList()
    } else {
      uni.showToast({ title: '未找到歌曲', icon: 'none' })
      netSongs.value = []
    }
  } catch (error) {
    console.error('Net search error:', error)
    uni.showToast({ title: '搜索失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

const fetchCoversForList = async () => {
  const songsToFetch = [...netSongs.value]
  for (const song of songsToFetch) {
    // Check if song is still in the current list
    if (!netSongs.value.find(s => s.id === song.id)) continue
    
    try {
      await ensureSongDetails(song)
    } catch (e) {
      console.error(e)
    }
  }
}

const fetchSongs = async () => {
  try {
    let url = '/audios'
    const params: string[] = []
    
    if (searchQuery.value) {
      params.push(`q=${encodeURIComponent(searchQuery.value)}`)
    }
    
    if (currentFilterTagId.value !== null) {
      params.push(`tag_id=${currentFilterTagId.value}`)
    }
    
    if (params.length > 0) {
      url += '?' + params.join('&')
    }

    const data = await request(url)
    const list = Array.isArray(data) ? data : []
    songs.value = list.map((item: any) => ({
      id: item.id,
      name: item.filename.replace(/\.[^/.]+$/, ""), // Remove extension for display
      artist: item.singer || 'Unknown Artist',
      url: item.url.startsWith('http') ? item.url : `${apiBase}${item.url}`,
      coverUrl: item.cover ? (item.cover.startsWith('http') ? item.cover : `${apiBase}${item.cover}`) : '',
      lyrics: item.lyrics || ''
    }))
  } catch (error) {
    console.error('Failed to fetch music:', error)
  }
}

const applyTagFilter = (tagId: number | null) => {
  if (currentFilterTagId.value === tagId) return
  currentFilterTagId.value = tagId
  fetchSongs()
}

const handleSearchInput = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    if (activeTab.value === 'net') {
      searchNetMusic()
    } else {
      fetchSongs()
    }
  }, 500)
}

const ensureSongDetails = async (song: Song) => {
  if (song.url) return true
  if (!song.n) return false
  
  try {
    const res: any = await new Promise((resolve, reject) => {
      uni.request({
        url: 'http://lpz.chatc.vip/apiqq.php',
        method: 'GET',
        data: {
          msg: song.sourceQuery,
          n: song.n,
          type: 'json'
        },
        success: (res) => resolve(res.data),
        fail: (err) => reject(err)
      })
    })

    if (res.code === 200 && res.data) {
      song.url = res.data.music_url
      song.coverUrl = res.data.cover
      song.lyrics = res.data.lyric
      return true
    }
  } catch (e) {
    console.error('Fetch details error:', e)
  }
  return false
}

const addToFavorites = async (song: Song) => {
  uni.showLoading({ title: '准备中...' })
  
  // 1. Ensure we have details (url, cover, etc.)
  const hasDetails = await ensureSongDetails(song)
  if (!hasDetails) {
    uni.hideLoading()
    uni.showToast({ title: '获取歌曲信息失败', icon: 'none' })
    return
  }
  
  // 2. Fetch available groups
  let groups: any[] = []
  try {
    const res = await request('/audio-groups')
    if (res.ok) {
      groups = res.list
    }
  } catch (e) {
    console.error('Fetch groups failed', e)
  }
  
  uni.hideLoading()
  
  // 3. Show Popup
  currentActionSong.value = song
  actionSheetType.value = 'addToGroup'
  actionSheetActions.value = [
    { name: '默认（未分组）', id: null },
    ...groups.map((g: any) => ({ name: g.name, id: g.id }))
  ]
  showActionSheet.value = true
}

const showTagPopup = ref(false)
const availableTags = ref<any[]>([])
const selectedTagIds = ref<number[]>([])

const fetchTags = async () => {
  try {
    const res = await request('/tags?type=audio')
    if (res.ok) {
      availableTags.value = res.list
    }
  } catch (e) {
    console.error(e)
  }
}

const toggleTagSelection = (tagId: number) => {
  if (selectedTagIds.value.includes(tagId)) {
    selectedTagIds.value = selectedTagIds.value.filter(id => id !== tagId)
  } else {
    selectedTagIds.value.push(tagId)
  }
}

const navigateToTagsMgmt = () => {
  uni.navigateTo({ url: '/pages/settings/tags' })
  showTagPopup.value = false
}

const confirmAddTags = async () => {
  const contentIds = currentActionSong.value ? [currentActionSong.value.id] : selectedNetSongs.value.map(s => s.id)
  
  if (contentIds.length === 0) return
  
  try {
    await request('/tags/content', 'POST', {
      type: 'audio',
      id: contentIds,
      tagIds: selectedTagIds.value
    })
    uni.showToast({ title: '添加成功', icon: 'success' })
    showTagPopup.value = false
  } catch (e) {
    uni.showToast({ title: '添加失败', icon: 'none' })
  }
}

const handleLongPress = (song: Song) => {
    currentActionSong.value = song
    actionSheetType.value = 'options'
    actionSheetActions.value = [
      { name: '添加标签', id: 'tag' },
      { name: '删除', color: 'var(--danger-color, #fa4350)', id: 'delete' }
    ]
    showActionSheet.value = true
  }

const handleArtistLongPress = (artist: any) => {
    currentActionArtist.value = artist
    actionSheetType.value = 'deleteArtist'
    actionSheetActions.value = [
      { name: '删除歌手', color: 'var(--danger-color, #fa4350)', id: 'delete' }
    ]
    showActionSheet.value = true
}

const handleArtistOptions = (artist: any) => {
  handleArtistLongPress(artist)
}

const handleActionSelect = async ({ item }: any) => {
  showActionSheet.value = false

  if (actionSheetType.value === 'options') {
    if (!currentActionSong.value) return
    if (item.id === 'delete') {
      deleteSong(currentActionSong.value)
    } else if (item.id === 'tag') {
      // Fetch tags and show popup
      await fetchTags()
      // Fetch existing tags for this song?
      // Ideally yes, but for now let's just show all tags to add.
      // Or reset selection
      selectedTagIds.value = []
      try {
        const res = await request(`/tags/content?type=audio&id=${currentActionSong.value.id}`)
        if (res.ok) {
           selectedTagIds.value = res.list.map((t: any) => t.id)
        }
      } catch(e) {}
      
      showTagPopup.value = true
    }
  } else if (actionSheetType.value === 'addToGroup') {
    if (!currentActionSong.value) return
    await saveNetSong(currentActionSong.value, item.id)
  } else if (actionSheetType.value === 'batchAddToGroup') {
    await batchSaveNetSongs(item.id)
  } else if (actionSheetType.value === 'deleteArtist') {
    if (!currentActionArtist.value) return
    if (item.id === 'delete') {
      confirmDeleteArtist(currentActionArtist.value)
    }
  }
}

const confirmDeleteArtist = (artist: any) => {
  uni.showModal({
    title: '提示',
    content: `确定要删除歌手 "${artist.name}" 吗？该操作只会删除分组，不会删除歌曲。`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await request(`/audio-groups/${artist.id}`, 'DELETE')
          uni.showToast({ title: '删除成功', icon: 'success' })
          fetchArtistGroups() // Refresh list
        } catch (e) {
          console.error(e)
          uni.showToast({ title: '删除失败', icon: 'none' })
        }
      }
    }
  })
}

const deleteSong = async (song: Song) => {
  uni.showModal({
    title: '提示',
    content: `确定要删除 "${song.name}" 吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await request(`/audios/${song.id}`, 'DELETE')
          uni.showToast({ title: '删除成功', icon: 'success' })
          
          if (activeTab.value === 'artists' && selectedArtistGroup.value) {
            // Re-fetch current artist's songs
            fetchSongsByGroup(selectedArtistGroup.value.id)
          } else {
            fetchSongs()
          }
        } catch (error) {
          console.error('Failed to delete song:', error)
          uni.showToast({ title: '删除失败', icon: 'none' })
        }
      }
    }
  })
}

const playSong = (song: Song) => {
  audioStore.play(song)
}

const playAll = () => {
  if (songs.value.length > 0) {
    audioStore.setPlayList(songs.value)
    audioStore.play(songs.value[0])
  }
}

const scrollToCurrentSong = () => {
  if (audioStore.currentSong) {
    scrollIntoViewId.value = 'song-' + audioStore.currentSong.id
    // Reset after a short delay so it can be triggered again
    setTimeout(() => {
      scrollIntoViewId.value = ''
    }, 1000)
  }
}

// Net Music Selection Mode
const toggleSelectionMode = () => {
  isSelectionMode.value = !isSelectionMode.value
  selectedNetSongs.value = []
}

const isSelected = (song: Song) => {
  return selectedNetSongs.value.some(s => s.id === song.id)
}

const toggleSelection = (song: Song) => {
  if (isSelected(song)) {
    selectedNetSongs.value = selectedNetSongs.value.filter(s => s.id !== song.id)
  } else {
    selectedNetSongs.value.push(song)
  }
}

const toggleSelectAll = () => {
  if (selectedNetSongs.value.length === netSongs.value.length) {
    selectedNetSongs.value = []
  } else {
    selectedNetSongs.value = [...netSongs.value]
  }
}

const handleSongClick = (song: Song) => {
  if (isSelectionMode.value) {
    toggleSelection(song)
  } else {
    playSong(song)
  }
}

const batchAddToGroup = async () => {
  if (selectedNetSongs.value.length === 0) return
  
  uni.showLoading({ title: '准备中...' })
  
  // Fetch available groups
  let groups: any[] = []
  try {
    const res = await request('/audio-groups')
    if (res.ok) {
      groups = res.list
    }
  } catch (e) {
    console.error('Fetch groups failed', e)
  }
  
  uni.hideLoading()
  
  actionSheetType.value = 'batchAddToGroup'
  actionSheetActions.value = [
    { name: '默认（未分组）', id: null },
    ...groups.map((g: any) => ({ name: g.name, id: g.id }))
  ]
  showActionSheet.value = true
}

const saveNetSong = async (song: Song, groupId: string | null) => {
  uni.showLoading({ title: '保存中...' })
  try {
    // Ensure we have details
    const hasDetails = await ensureSongDetails(song)
    if (!hasDetails) throw new Error('Cannot get song details')
    
    // Download cover to get a temp path or use URL directly if backend supports it
    // Assuming backend takes URL
    
    await request('/audios/link', 'POST', {
      filename: song.name, // We use filename as title usually
      singer: song.artist,
      url: song.url,
      cover: song.coverUrl,
      lyrics: song.lyrics,
      group_id: groupId
    })
    
    uni.showToast({ title: '添加成功', icon: 'success' })
  } catch (e) {
    console.error(e)
    uni.showToast({ title: '添加失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

const batchSaveNetSongs = async (groupId: string | null) => {
  uni.showLoading({ title: '正在保存...' })
  let successCount = 0
  
  for (const song of selectedNetSongs.value) {
    try {
      const hasDetails = await ensureSongDetails(song)
      if (hasDetails) {
        await request('/audios/link', 'POST', {
          filename: song.name,
          singer: song.artist,
          url: song.url,
          cover: song.coverUrl,
          lyrics: song.lyrics,
          group_id: groupId
        })
        successCount++
      }
    } catch (e) {
      console.error(e)
    }
  }
  
  uni.hideLoading()
  uni.showToast({ title: `成功保存 ${successCount} 首`, icon: 'none' })
  isSelectionMode.value = false
  selectedNetSongs.value = []
}

onMounted(() => {
  fetchSongs()
  fetchTags()
})
</script>

<style scoped>
.content-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-color, #f8fafc);
}

/* Header Styles */
.fixed-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--bg-color-card, rgba(255, 255, 255, 0.95));
  backdrop-filter: blur(10px);
  padding: 24rpx 24rpx 0 24rpx;
}

/* Tag Filter Bar */
.tag-filter-bar {
  padding: 16rpx 24rpx;
  background: var(--bg-color-card, #fff);
  border-bottom: 1px solid var(--border-color, #f1f5f9);
}
.tag-filter-scroll {
  white-space: nowrap;
  width: 100%;
}
.tag-filter-content {
  display: inline-flex;
  align-items: center;
}
.filter-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10rpx 24rpx;
  background: var(--bg-color, #f1f5f9);
  border-radius: 100rpx;
  font-size: 26rpx;
  color: var(--text-color-secondary, #64748b);
  margin-right: 16rpx;
  transition: all 0.2s;
  border: 1px solid transparent;
}
.filter-chip.active {
  background: rgba(var(--primary-rgb), 0.1);
  color: var(--primary-color, #3b82f6);
  border-color: rgba(var(--primary-rgb), 0.3);
  font-weight: 500;
}
.filter-chip.manage-btn {
  padding: 10rpx 20rpx;
  background: var(--bg-color, #f8fafc);
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
.actions {
  display: flex;
  gap: 24rpx;
}
.action-btn {
  font-size: 28rpx;
  color: var(--primary-color, #3b82f6);
  font-weight: 500;
  padding: 8rpx 16rpx;
  background: rgba(var(--primary-rgb), 0.1);
  border-radius: 12rpx;
}
.action-btn:active {
  background: rgba(var(--primary-rgb), 0.2);
}

/* Search Box */
.search-box {
  background: var(--bg-color, #f1f5f9);
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

:deep(.fab-action-btn) {
  min-width: auto !important;
  box-sizing: border-box;
  width: 32px !important;
  height: 32px !important;
  border-radius: 16px !important;
  margin: 8rpx;
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

/* Music List */
.music-list {
  padding: 16rpx 24rpx 180rpx 24rpx; /* Bottom padding for FAB/Player */
}
.song-item {
  display: flex;
  align-items: center;
  padding: 24rpx;
  margin-bottom: 20rpx;
  background: var(--bg-color-card, #ffffff);
  border-radius: 24rpx;
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.02);
  transition: transform 0.1s, background-color 0.2s;
}
.song-item:active {
  transform: scale(0.98);
  background-color: var(--bg-color, #f8fafc);
}
.song-index {
  width: 50rpx;
  text-align: center;
  color: var(--text-color-placeholder, #94a3b8);
  font-size: 30rpx;
  font-weight: 600;
  margin-right: 8rpx;
  font-style: italic;
}
/* Top 3 Highlighting */
.song-item:nth-child(1) .song-index { color: var(--warning-color, #fbbf24); }
.song-item:nth-child(2) .song-index { color: var(--text-color-secondary, #94a3b8); }
.song-item:nth-child(3) .song-index { color: var(--danger-color, #f59e0b); }

.song-cover {
  width: 96rpx;
  height: 96rpx;
  border-radius: 16rpx;
  overflow: hidden;
  background: var(--bg-color, #f1f5f9);
  margin-right: 24rpx;
  position: relative;
  flex-shrink: 0;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08);
}
.cover-image {
  width: 100%;
  height: 100%;
  transition: transform 0.3s;
}
.song-info {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.name-row {
  margin-bottom: 8rpx;
}
.song-name {
  font-size: 32rpx;
  color: var(--text-color-primary, #1e293b);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.song-name.active {
  color: var(--primary-color, #3b82f6);
}
.song-artist {
  font-size: 26rpx;
  color: var(--text-color-secondary, #64748b);
  font-weight: 400;
}
.playing-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Playing Animation */
.playing-icon-css {
  display: flex;
  align-items: flex-end;
  height: 16px;
  gap: 3px;
}
.playing-icon-css .line {
  width: 3px;
  background-color: #fff;
  border-radius: 2px;
  animation: equalize 1s infinite;
}
.playing-icon-css .line1 { animation-delay: 0.2s; height: 8px; }
.playing-icon-css .line2 { animation-delay: 0.4s; height: 14px; }
.playing-icon-css .line3 { animation-delay: 0.6s; height: 10px; }
.playing-icon-css .line4 { animation-delay: 0.8s; height: 6px; }

@keyframes equalize {
  0% { height: 4px; }
  50% { height: 100%; }
  100% { height: 4px; }
}

.empty-tip {
  text-align: center;
  color: var(--text-color-placeholder, #94a3b8);
  padding: 60rpx 0;
  font-size: 30rpx;
}

/* Artist View */
.artist-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx;
  background: var(--bg-color-card, #fff);
  position: sticky;
  top: 0;
  z-index: 5;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.02);
}
.header-left {
  display: flex;
  align-items: center;
  flex: 1;
}
.header-right {
  padding: 8rpx;
}
.artist-title {
  font-size: 36rpx;
  font-weight: 700;
  color: var(--text-color-primary, #1e293b);
  margin-left: 16rpx;
}
.artist-list {
  padding: 16rpx 24rpx;
}
.artist-item {
  display: flex;
  align-items: center;
  padding: 24rpx;
  margin-bottom: 20rpx;
  background: var(--bg-color-card, #fff);
  border-radius: 24rpx;
  box-shadow: 0 2rpx 6rpx rgba(0,0,0,0.02);
}
.artist-item:active {
  transform: scale(0.99);
  background: var(--bg-color, #f8fafc);
}
.artist-icon {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: var(--border-color, #e2e8f0);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 32rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1);
}
.group-cover-img {
  width: 100%;
  height: 100%;
}
.artist-info {
  flex: 1;
}
.artist-name {
  display: block;
  font-size: 32rpx;
  color: var(--text-color-primary, #1e293b);
  font-weight: 600;
  margin-bottom: 8rpx;
}
.artist-count {
  font-size: 26rpx;
  color: var(--text-color-secondary, #64748b);
}

/* Net Music Selection */
.checkbox-col {
  margin-right: 20rpx;
  display: flex;
  align-items: center;
}
.batch-action-bar {
  position: absolute;
  bottom: 110rpx; /* Lift above tab bar */
  left: 24rpx;
  right: 24rpx;
  background: var(--bg-color-glass, rgba(255, 255, 255, 0.95));
  backdrop-filter: blur(10px);
  padding: 24rpx 32rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4rpx 24rpx rgba(0,0,0,0.12);
  z-index: 1000;
  border-radius: 48rpx;
}
.batch-left {
  display: flex;
  align-items: center;
  gap: 20rpx;
}
.select-all-text {
  font-size: 30rpx;
  color: var(--text-color-primary, #1e293b);
  font-weight: 500;
}
.selected-count {
  font-size: 26rpx;
  color: var(--text-color-secondary, #64748b);
}
.batch-btn {
  padding: 16rpx 40rpx;
  border-radius: 40rpx;
  font-size: 30rpx;
  font-weight: 600;
  color: #fff;
  background: var(--primary-color, #3b82f6);
  box-shadow: 0 4rpx 12rpx rgba(var(--primary-rgb), 0.3);
  transition: all 0.3s;
}
.batch-btn:active {
  transform: scale(0.95);
  box-shadow: 0 2rpx 6rpx rgba(var(--primary-rgb), 0.2);
}
.batch-btn.disabled {
  background: var(--text-color-placeholder, #cbd5e1);
  box-shadow: none;
  color: var(--bg-color, #f1f5f9);
}

/* Locate FAB */
.locate-fab {
  position: absolute;
  right: 32rpx;
  bottom: 160rpx;
  width: 96rpx;
  height: 96rpx;
  background: var(--bg-color-card, #fff);
  border-radius: 50%;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 90;
  transition: transform 0.2s;
}
.locate-fab:active {
  transform: scale(0.9);
}
.locate-icon {
  width: 48rpx;
  height: 48rpx;
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
  background-color: var(--bg-color, #f1f5f9);
  color: var(--text-color-primary, #0f172a);
}
.popup-item.cancel {
  border-top: 8rpx solid var(--border-color, #f1f5f9);
  color: var(--text-color-secondary, #64748b);
  margin-top: -1px;
}

/* Tag Selection Popup Styles */
.tag-popup-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-color-card, #fff);
}
.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;
  border-bottom: 2rpx solid var(--border-color, #f1f5f9);
}
.popup-title {
  font-size: 34rpx;
  font-weight: 700;
  color: var(--text-color-primary, #1e293b);
}
.popup-close {
  padding: 8rpx;
  margin-right: -8rpx;
}
.tag-scroll-view {
  max-height: 50vh;
  width: 100%;
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 16rpx 32rpx;
  background: var(--bg-color, #f1f5f9);
  border-radius: 100rpx;
  font-size: 28rpx;
  color: var(--text-color-secondary, #475569);
  transition: all 0.2s;
  border: 2rpx solid transparent;
}
.tag-chip.active {
  background: var(--primary-color, #3b82f6);
  color: #fff;
  box-shadow: 0 4rpx 12rpx rgba(var(--primary-rgb), 0.3);
  transform: scale(1.02);
}
.tag-chip.add-btn {
  background: var(--bg-color-card, #fff);
  border: 2rpx dashed var(--text-color-placeholder, #cbd5e1);
  color: var(--primary-color, #3b82f6);
}
.tag-chip.add-btn:active {
  background: var(--bg-color, #f8fafc);
  border-color: var(--primary-color, #3b82f6);
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
.popup-footer {
  padding: 24rpx 32rpx;
  background: var(--bg-color-card, #fff);
  border-top: 2rpx solid var(--border-color, #f1f5f9);
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
}

/* Add Artist Dialog Styles */
.dialog-container {
  padding: 40rpx;
  background: var(--bg-color-card, #fff);
  width: 100%;
  box-sizing: border-box;
}
.dialog-header {
  margin-bottom: 40rpx;
}
.dialog-title {
  font-size: 36rpx;
  font-weight: 600;
  text-align: center;
  display: block;
  color: var(--text-color-primary, #1e293b);
}
.dialog-content {
  padding: 0;
}
.dialog-input {
  width: 100%;
  height: 88rpx;
  background: var(--border-color, #f1f5f9);
  border-radius: 16rpx;
  padding: 0 24rpx;
  font-size: 30rpx;
  box-sizing: border-box;
  margin-bottom: 40rpx;
  color: var(--text-color-primary, #1e293b);
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