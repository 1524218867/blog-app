<template>
  <view class="content">
    <view class="card">
      <view class="section-header">
        <view class="title">我的音乐</view>
        <view class="actions">
          <text class="action-btn" @click="playAll">播放全部</text>
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

      <!-- View Tabs -->
      <view class="view-tabs">
        <view 
          class="tab-item" 
          :class="{ active: activeTab === 'songs' }"
          @click="switchTab('songs')"
        >
          单曲
        </view>
        <view 
          class="tab-item" 
          :class="{ active: activeTab === 'artists' }"
          @click="switchTab('artists')"
        >
          歌手
        </view>
        <view 
          class="tab-item" 
          :class="{ active: activeTab === 'net' }"
          @click="switchTab('net')"
        >
          全网
        </view>
      </view>
      
      <!-- Artist List -->
      <view v-if="activeTab === 'artists' && !searchQuery" class="artist-view">
        <!-- Artist Detail (Songs by Artist) -->
        <view v-if="selectedArtist" class="artist-detail">
          <view class="artist-header" @click="selectedArtist = null">
            <wd-icon name="arrow-left" size="20px" color="#3b5bdb"></wd-icon>
            <text class="artist-title">{{ selectedArtist }}</text>
          </view>
          <view class="music-list">
             <view v-for="(song, index) in artistSongs" :key="song.id" class="song-item" @click="playSong(song)">
              <view class="song-index">
                <text>{{ index + 1 }}</text>
              </view>
              <view class="song-cover">
                 <image v-if="song.coverUrl" :src="song.coverUrl" mode="aspectFill" class="cover-image" />
                 <view v-else class="cover-placeholder">
                   <wd-icon name="music" size="20px" color="#cbd5e1" />
                 </view>
                 <!-- Playing Overlay & Animation -->
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
          <view class="song-actions" @click.stop="deleteSong(song)">
             <wd-icon name="delete" size="24px" color="#ef4444"></wd-icon>
          </view>
        </view>
      </view>
    </view>

    <!-- Artist Group List -->
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

      <!-- Net Songs List -->
      <view v-else-if="activeTab === 'net'" class="music-list">
        <view v-for="(song, index) in netSongs" :key="song.id" class="song-item" @click="playSong(song)">
          <view class="song-index">
            <text>{{ index + 1 }}</text>
          </view>
          <view class="song-cover">
             <image v-if="song.coverUrl" :src="song.coverUrl" mode="aspectFill" class="cover-image" />
             <view v-else class="cover-placeholder">
               <wd-icon name="music" size="20px" color="#cbd5e1" />
             </view>
             <!-- Playing Overlay & Animation -->
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

      <!-- All Songs List (Default) -->
      <view v-else class="music-list">
        <view v-for="(song, index) in songs" :key="song.id" class="song-item" @click="playSong(song)">
          <view class="song-index">
            <text>{{ index + 1 }}</text>
          </view>
          <view class="song-cover">
             <image v-if="song.coverUrl" :src="song.coverUrl" mode="aspectFill" class="cover-image" />
             <view v-else class="cover-placeholder">
               <wd-icon name="music" size="20px" color="#cbd5e1" />
             </view>
             <!-- Playing Overlay & Animation -->
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
          <view class="song-actions" @click.stop="deleteSong(song)">
             <wd-icon name="delete" size="24px" color="#ef4444"></wd-icon>
          </view>
        </view>
        <view v-if="songs.length === 0" class="empty-tip">未找到相关音乐</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { request, apiBase } from '@/utils/request'
import { audioStore } from '@/store/audio'

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
const selectedArtist = ref<string | null>(null)
let searchTimer: any = null

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
        // Add "Unknown Artist" group manually if needed, or handle it separately
        // User mentioned ?group_id=null for ungrouped
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

  const switchTab = (tab: 'songs' | 'artists' | 'net') => {
    // Clear search query when switching tabs to avoid empty views due to filtering
    searchQuery.value = ''
    activeTab.value = tab
    selectedArtist.value = null
    if (tab === 'artists') {
      fetchArtistGroups()
    } else if (tab === 'net') {
      // Net tab logic
      netSongs.value = []
    } else {
      fetchSongs() // Refresh all songs when switching back
    }
  }
  
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
  
  // 3. Show ActionSheet
  const itemList = ['默认（未分组）', ...groups.map((g: any) => g.name)]
  
  uni.showActionSheet({
    itemList,
    success: async (res) => {
      const index = res.tapIndex
      let groupId = null
      if (index > 0) {
        groupId = groups[index - 1].id
      }
      
      uni.showLoading({ title: '添加中...' })
      try {
        await request('/audios/link', 'POST', {
           url: song.url,
           filename: song.name,
           singer: song.artist,
           cover: song.coverUrl,
           lyrics: song.lyrics,
           group_id: groupId
        })
        uni.showToast({ title: '已加入我的音乐', icon: 'success' })
      } catch (error) {
        console.error('Add to favorites error:', error)
        uni.showToast({ title: '添加失败', icon: 'none' })
      } finally {
        uni.hideLoading()
      }
    },
    fail: (res) => {
      console.log('ActionSheet failed/cancelled:', res.errMsg)
    }
  })
}

const deleteSong = async (song: Song) => {
  uni.showModal({
    title: '提示',
    content: `确定要删除 "${song.name}" 吗？`,
    success: async (res) => {
      if (res.confirm) {
        uni.showLoading({ title: '删除中...' })
        try {
          await request(`/audios/${song.id}`, 'DELETE')
          uni.showToast({ title: '删除成功', icon: 'success' })
          
          // Remove from local lists
          songs.value = songs.value.filter(s => s.id !== song.id)
          artistSongs.value = artistSongs.value.filter(s => s.id !== song.id)
          
          // If currently playing song is deleted, maybe stop or next?
          // For now, let's just leave it playing or let the user handle it.
          
        } catch (error) {
          console.error('Delete song error:', error)
          uni.showToast({ title: '删除失败', icon: 'none' })
        } finally {
          uni.hideLoading()
        }
      }
    }
  })
}

const playSong = async (song: Song) => {
  // Check if we need to fetch details (lazy load for net songs)
  if (activeTab.value === 'net' && song.n && !song.url) {
    uni.showLoading({ title: '获取播放地址...' })
    const success = await ensureSongDetails(song)
    uni.hideLoading()
    
    if (!success) {
      uni.showToast({ title: '无法获取播放地址', icon: 'none' })
      return
    }
  }

  // If in artist view, playlist should probably be just that artist's songs?
  // Or all songs? Usually context matters.
  // Let's set playlist to the currently visible list.
  if (activeTab.value === 'artists' && selectedArtist.value) {
    audioStore.setPlayList(artistSongs.value)
  } else if (activeTab.value === 'net') {
    audioStore.setPlayList(netSongs.value)
  } else if (searchQuery.value) {
     audioStore.setPlayList(songs.value) // Search results
  } else {
    // All songs tab
    audioStore.setPlayList(songs.value)
  }
  
  if (song.url) {
    audioStore.play(song)
    audioStore.showFullScreen = true
  }
}

const playAll = () => {
  let listToPlay: Song[] = []
  
  if (activeTab.value === 'net') {
    listToPlay = netSongs.value
  } else if (searchQuery.value) {
    listToPlay = songs.value
  } else if (activeTab.value === 'artists') {
    if (selectedArtist.value) {
      listToPlay = artistSongs.value
    } else {
      // In artist list view, play all?
      listToPlay = songs.value
    }
  } else {
    listToPlay = songs.value
  }

  if (listToPlay.length > 0) {
    audioStore.setPlayList(listToPlay)
    audioStore.play(listToPlay[0])
    audioStore.showFullScreen = true
  }
}

onMounted(() => {
  fetchSongs()
})
</script>

<style scoped>
.content {
  width: 100%;
}
.card {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  min-height: 400rpx;
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
  font-size: 26rpx;
  color: #3b5bdb;
  background: #e0e7ff;
  padding: 8rpx 20rpx;
  border-radius: 999rpx;
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

/* Tabs */
.view-tabs {
  display: flex;
  margin-bottom: 24rpx;
  border-bottom: 1rpx solid #f1f5f9;
}
.tab-item {
  flex: 1;
  text-align: center;
  padding: 16rpx 0;
  font-size: 28rpx;
  color: #64748b;
  position: relative;
}
.tab-item.active {
  color: #3b5bdb;
  font-weight: 600;
}
.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40rpx;
  height: 4rpx;
  background: #3b5bdb;
  border-radius: 2rpx;
}

/* Artist List */
.artist-list {
  display: flex;
  flex-direction: column;
}
.artist-item {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f1f5f9;
}
.artist-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  background: linear-gradient(135deg, #a5b4fc 0%, #6366f1 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  flex-shrink: 0;
  overflow: hidden;
}

.group-cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.artist-info {
  flex: 1;
}
.artist-name {
  font-size: 30rpx;
  color: #1e293b;
  font-weight: 500;
  display: block;
  margin-bottom: 4rpx;
}
.artist-count {
  font-size: 24rpx;
  color: #94a3b8;
}

/* Artist Detail Header */
.artist-header {
  display: flex;
  align-items: center;
  padding: 16rpx 0;
  margin-bottom: 16rpx;
  border-bottom: 1rpx solid #f1f5f9;
}
.artist-title {
  font-size: 32rpx;
  font-weight: 600;
  margin-left: 16rpx;
  color: #1e293b;
}

.music-list {
  display: flex;
  flex-direction: column;
}
.song-item {
  display: flex;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f1f5f9;
}
.song-item:last-child {
  border-bottom: none;
}
.song-index {
  width: 60rpx;
  text-align: center;
  font-size: 28rpx;
  color: #94a3b8;
}
.song-cover {
  width: 80rpx;
  height: 80rpx;
  border-radius: 8rpx;
  overflow: hidden;
  margin-right: 20rpx;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.cover-image {
  width: 100%;
  height: 100%;
}
.cover-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.playing-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.playing-icon-css {
  display: flex;
  align-items: flex-end;
  height: 30rpx;
  gap: 6rpx;
}

.playing-icon-css .line {
  width: 6rpx;
  background-color: #000000;
  border-radius: 4rpx;
  animation: equalize 1s infinite ease-in-out;
}

.playing-icon-css .line1 { animation-delay: 0s; height: 40%; }
.playing-icon-css .line2 { animation-delay: 0.2s; height: 100%; }
.playing-icon-css .line3 { animation-delay: 0.4s; height: 60%; }
.playing-icon-css .line4 { animation-delay: 0.1s; height: 80%; }

@keyframes equalize {
  0% { height: 30%; }
  50% { height: 100%; }
  100% { height: 30%; }
}

.playing-icon {
  width: 40rpx;
  height: 40rpx;
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
  font-size: 30rpx;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.song-name.active {
  color: #3b5bdb;
  font-weight: 500;
}
/* Playing Animation removed */

.song-artist {
  font-size: 24rpx;
  color: #94a3b8;
}
.song-actions {
  padding: 0 16rpx;
}
.empty-tip {
  text-align: center;
  color: #94a3b8;
  padding: 40rpx 0;
  font-size: 28rpx;
}
</style>