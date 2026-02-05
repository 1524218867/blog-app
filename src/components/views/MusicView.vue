<template>
  <view class="content-wrapper">
    <view class="fixed-header">
      <view class="section-header">
        <view class="title">我的音乐</view>
        <view class="actions">
          <text v-if="activeTab === 'net' && netSongs.length > 0" class="action-btn" @click="toggleSelectionMode">
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
                    <wd-icon name="music" size="20px" color="#cbd5e1" />
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
            <view v-if="selectedArtist" class="artist-detail">
              <view class="artist-header" @click="selectedArtist = null">
                <wd-icon name="arrow-left" size="20px" color="#3b5bdb"></wd-icon>
                <text class="artist-title">{{ selectedArtist }}</text>
              </view>
              <view class="music-list">
                 <view v-for="(song, index) in artistSongs" :key="song.id" class="song-item" @click="playSong(song)" @longpress="handleLongPress(song)">
                  <view class="song-index">
                    <text>{{ index + 1 }}</text>
                  </view>
                  <view class="song-cover">
                     <image v-if="song.coverUrl" :src="song.coverUrl" mode="aspectFill" class="cover-image" />
                     <view v-else class="cover-placeholder">
                       <wd-icon name="music" size="20px" color="#cbd5e1" />
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
               <view v-for="artist in artistGroups" :key="artist.id" class="artist-item" @click="selectArtist(artist)">
                 <view class="artist-icon">
                   <image v-if="artist.cover" :src="artist.cover" mode="aspectFill" class="group-cover-img" />
                   <wd-icon v-else name="user" size="24px" color="#fff"></wd-icon>
                 </view>
                 <view class="artist-info">
                   <text class="artist-name">{{ artist.name }}</text>
                   <text class="artist-count">{{ artist.count }} 首歌曲</text>
                 </view>
                 <wd-icon name="arrow-right" size="16px" color="#94a3b8"></wd-icon>
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
                   <wd-icon name="music" size="20px" color="#cbd5e1" />
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
                <wd-icon :name="isSelected(song) ? 'check-circle-filled' : 'check-circle'" size="22px" :color="isSelected(song) ? '#3b5bdb' : '#cbd5e1'"></wd-icon>
              </view>
              <view class="song-index">
                <text>{{ index + 1 }}</text>
              </view>
              <view class="song-cover">
                 <image v-if="song.coverUrl" :src="song.coverUrl" mode="aspectFill" class="cover-image" />
                 <view v-else class="cover-placeholder">
                   <wd-icon name="music" size="20px" color="#cbd5e1" />
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
                 <wd-icon name="add-circle" size="24px" color="#3b5bdb"></wd-icon>
              </view>
            </view>
            <view v-if="netSongs.length === 0" class="empty-tip">{{ searchQuery ? '未找到相关音乐' : '请输入歌名进行搜索' }}</view>
          </view>
          </scroll-view>
        </view>
      </swiper-item>
    </swiper>

    <!-- Batch Action Bar -->
    <view v-if="isSelectionMode" class="batch-action-bar">
      <view class="batch-left" @click="toggleSelectAll">
        <wd-icon :name="selectedNetSongs.length > 0 && selectedNetSongs.length === netSongs.length ? 'check-circle-filled' : 'check-circle'" size="22px" :color="selectedNetSongs.length > 0 && selectedNetSongs.length === netSongs.length ? '#3b5bdb' : '#94a3b8'"></wd-icon>
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
      position="center" 
      custom-style="border-radius: 16rpx; overflow: hidden; width: 600rpx;"
      :z-index="10000"
    >
      <view class="popup-menu">
        <view class="popup-title">{{ actionSheetType === 'delete' ? '操作' : '选择分组' }}</view>
        <scroll-view scroll-y style="max-height: 600rpx;">
          <view 
            v-for="(action, index) in actionSheetActions" 
            :key="index" 
            class="popup-item" 
            :style="{ color: action.color || '#333' }"
            @click="handleActionSelect({ item: action })"
          >
            {{ action.name }}
          </view>
        </scroll-view>
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

const selectedArtist = ref<string | null>(null)
const isSelectionMode = ref(false)
const selectedNetSongs = ref<Song[]>([])
const scrollIntoViewId = ref('')
let searchTimer: any = null

// Action Sheet State
const showActionSheet = ref(false)
const actionSheetActions = ref<any[]>([])
const currentActionSong = ref<Song | null>(null)
const actionSheetType = ref<'delete' | 'addToGroup' | 'batchAddToGroup'>('delete')

const artistGroups = ref<any[]>([])
const artistSongs = ref<Song[]>([])

const fetchArtistGroups = async () => {
  try {
    const data = await request('/audio-groups')
    if (Array.isArray(data)) {
      artistGroups.value = data.map((item: any) => ({
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
  selectedArtist.value = null
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
  selectedArtist.value = artistGroup.name
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
    const q = searchQuery.value ? `?q=${encodeURIComponent(searchQuery.value)}` : ''
    const data = await request(`/audios${q}`)
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
    const data = await request('/audio-groups')
    if (Array.isArray(data)) {
      groups = data
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

const handleLongPress = (song: Song) => {
  currentActionSong.value = song
  actionSheetType.value = 'delete'
  actionSheetActions.value = [
    { name: '删除', color: '#fa4350' }
  ]
  showActionSheet.value = true
}

const handleActionSelect = async ({ item }: any) => {
  showActionSheet.value = false

  if (actionSheetType.value === 'delete') {
    if (!currentActionSong.value) return
    if (item.name === '删除') {
      deleteSong(currentActionSong.value)
    }
  } else if (actionSheetType.value === 'addToGroup') {
    if (!currentActionSong.value) return
    await saveNetSong(currentActionSong.value, item.id)
  } else if (actionSheetType.value === 'batchAddToGroup') {
    await batchSaveNetSongs(item.id)
  }
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
          
          if (activeTab.value === 'artists' && selectedArtist.value) {
            // Re-fetch current artist's songs
            const group = artistGroups.value.find(g => g.name === selectedArtist.value)
            if (group) fetchSongsByGroup(group.id)
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
    const data = await request('/audio-groups')
    if (Array.isArray(data)) {
      groups = data
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
    
    await request('/audios', 'POST', {
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
        await request('/audios', 'POST', {
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
})
</script>

<style scoped>
.content-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.fixed-header {
  background: #ffffff;
  padding: 24rpx 24rpx 0 24rpx;
  border-top-left-radius: 16rpx;
  border-top-right-radius: 16rpx;
  z-index: 10;
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
.actions {
  display: flex;
  gap: 16rpx;
}
.action-btn {
  font-size: 28rpx;
  color: #3b82f6;
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
  background: #fff;
  border-bottom: 1px solid #f1f5f9;
  z-index: 10;
}
.custom-tab-item {
  flex: 1;
  text-align: center;
  padding: 24rpx 0;
  font-size: 28rpx;
  color: #64748b;
  position: relative;
  font-weight: 500;
}
.custom-tab-item.active {
  color: #3b82f6;
  font-weight: 600;
}
.tab-indicator {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40rpx;
  height: 4rpx;
  background: #3b82f6;
  border-radius: 2rpx;
}

/* Swiper Styles */
.content-swiper {
  flex: 1;
  height: 0; /* Critical for flex expansion */
  width: 100%;
  overflow: hidden;
}
.content-swiper swiper-item {
  height: 100%;
  width: 100%;
  overflow: hidden;
  position: relative;
}

.tab-inner {
  height: 100%;
  width: 100%;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}
.scroll-container {
  flex: 1;
  height: 0;
  width: 100%;
}

.music-list {
  padding: 0 0 24rpx 0;
}
.song-item {
  display: flex;
  align-items: center;
  padding: 16rpx 24rpx;
  border-bottom: 1px solid #f1f5f9;
}
.song-item:active {
  background-color: #f8fafc;
}
.song-index {
  width: 60rpx;
  text-align: center;
  color: #94a3b8;
  font-size: 28rpx;
}
.song-cover {
  width: 80rpx;
  height: 80rpx;
  border-radius: 8rpx;
  overflow: hidden;
  background: #f1f5f9;
  margin-right: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-shrink: 0;
}
.cover-image {
  width: 100%;
  height: 100%;
}
.song-info {
  flex: 1;
  overflow: hidden;
}
.name-row {
  display: flex;
  align-items: center;
  margin-bottom: 4rpx;
}
.song-name {
  font-size: 28rpx;
  color: #1e293b;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.song-name.active {
  color: #3b82f6;
}
.song-artist {
  font-size: 24rpx;
  color: #64748b;
}
.playing-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Playing Animation */
.playing-icon-css {
  display: flex;
  align-items: flex-end;
  height: 12px;
  gap: 2px;
}
.playing-icon-css .line {
  width: 2px;
  background-color: #fff;
  animation: equalize 1s infinite;
}
.playing-icon-css .line1 { animation-delay: 0.2s; height: 6px; }
.playing-icon-css .line2 { animation-delay: 0.4s; height: 10px; }
.playing-icon-css .line3 { animation-delay: 0.6s; height: 8px; }
.playing-icon-css .line4 { animation-delay: 0.8s; height: 5px; }

@keyframes equalize {
  0% { height: 4px; }
  50% { height: 12px; }
  100% { height: 4px; }
}

.empty-tip {
  text-align: center;
  color: #94a3b8;
  padding: 40rpx 0;
  font-size: 28rpx;
}

/* Artist View */
.artist-header {
  display: flex;
  align-items: center;
  padding: 16rpx 24rpx;
  margin-bottom: 16rpx;
  gap: 16rpx;
}
.artist-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1e293b;
}
.artist-list {
  padding: 0 0 24rpx 0;
}
.artist-item {
  display: flex;
  align-items: center;
  padding: 24rpx 24rpx;
  border-bottom: 1px solid #f1f5f9;
}
.artist-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
  overflow: hidden;
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
  font-size: 30rpx;
  color: #1e293b;
  font-weight: 500;
  margin-bottom: 4rpx;
}
.artist-count {
  font-size: 24rpx;
  color: #94a3b8;
}

/* Net Music Selection */
.checkbox-col {
  margin-right: 20rpx;
  display: flex;
  align-items: center;
}
.batch-action-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 20rpx 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 -2rpx 10rpx rgba(0,0,0,0.05);
  z-index: 100;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
}
.batch-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}
.select-all-text {
  font-size: 28rpx;
  color: #333;
}
.selected-count {
  font-size: 24rpx;
  color: #999;
}
.batch-btn {
  padding: 12rpx 32rpx;
  border-radius: 30rpx;
  font-size: 28rpx;
  color: #fff;
  background: #3b82f6;
}
.batch-btn.disabled {
  background: #cbd5e1;
}

/* Locate FAB */
.locate-fab {
  position: absolute;
  right: 32rpx;
  bottom: 120rpx;
  width: 80rpx;
  height: 80rpx;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}
.locate-icon {
  width: 40rpx;
  height: 40rpx;
}

/* Popup Menu */
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