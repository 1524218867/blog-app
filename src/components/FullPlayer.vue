<template>
  <view class="player-container">
    <view class="player-page" :class="{ 'visible': isVisible }" v-if="audioStore.currentSong">
      <!-- Background Blur -->
      <image 
        class="bg-blur" 
        :src="audioStore.currentSong.coverUrl || defaultCover" 
        mode="aspectFill" 
      />
      <view class="bg-mask"></view>

      <!-- Loading Overlay -->
      <view class="loading-overlay" v-if="audioStore.isRetrying">
        <view class="spinner"></view>
        <text class="loading-text">正在重新获取链接...</text>
      </view>

      <!-- Header -->
      <view class="header" :style="{ paddingTop: statusBarHeight + 'px' }">
        <view class="back-btn" @click="goBack">
          <text class="back-icon">↓</text>
        </view>
        
        <!-- Tab Switcher -->
        <view class="tab-switcher">
          <text 
            class="tab-item" 
            :class="{ active: !showLyrics }" 
            @click="showLyrics = false"
          >歌曲</text>
          <text class="divider">|</text>
          <text 
            class="tab-item" 
            :class="{ active: showLyrics }" 
            @click="showLyrics = true"
          >歌词</text>
        </view>

        <!-- Header Actions -->
        <view class="header-actions">
          <view class="action-btn" @click="audioStore.showDesktopLyric = !audioStore.showDesktopLyric">
             <view class="lyric-icon" :class="{ active: audioStore.showDesktopLyric }">词</view>
          </view>
          
          <!-- Timer Button -->
          <view class="action-btn" @click="showTimerPopup = true">
            <wd-icon name="time" size="44rpx" :color="audioStore.timerRemaining > 0 ? 'var(--success-color, #4CD964)' : '#fff'" />
            <text v-if="audioStore.timerRemaining > 0" class="timer-text">{{ formatTime(audioStore.timerRemaining) }}</text>
          </view>
        </view>
      </view>

      <!-- Content -->
      <view class="content">
        <!-- Disc Area -->
        <view class="disc-area" v-show="!showLyrics" @click="showLyrics = true">
          <view class="disc" :style="{ 'animation-play-state': animationState }">
            <image 
              class="cover" 
              :src="audioStore.currentSong.coverUrl || defaultCover" 
              mode="aspectFill" 
            />
          </view>
        </view>

        <!-- Lyrics Area -->
        <scroll-view 
          v-show="showLyrics" 
          class="lyrics-area" 
          scroll-y 
          :scroll-top="scrollTop"
          scroll-with-animation
          @scroll="onScroll"
          @click="showLyrics = false"
        >
          <view class="lyrics-wrapper">
            <view v-if="parsedLyrics.length === 0" class="no-lyrics">暂无歌词</view>
            <view 
              v-for="(line, index) in parsedLyrics" 
              :key="index"
              class="lyric-line"
              :class="{ active: currentLyricIndex === index }"
              :id="'line-' + index"
            >
              {{ line.text }}
            </view>
          </view>
          <!-- Padding for bottom -->
          <view style="height: 50%;"></view>
        </scroll-view>

        <!-- Info Area -->
        <view class="info-area">
          <view class="song-info">
            <text class="song-name">{{ audioStore.currentSong.name }}</text>
            <text class="song-artist">{{ audioStore.currentSong.artist }}</text>
          </view>

          <!-- Progress -->
          <view class="progress-bar">
            <text class="time">{{ formatTime(audioStore.currentTime) }}</text>
            <slider 
              class="slider" 
              :value="audioStore.currentTime" 
              :max="audioStore.duration" 
              @change="onSeek" 
              @changing="isSeeking = true"
              activeColor="#ffffff" 
              backgroundColor="rgba(255,255,255,0.3)" 
              block-size="12" 
            />
            <text class="time">{{ formatTime(audioStore.duration) }}</text>
          </view>

          <!-- Controls -->
          <view class="controls">
            <view class="btn mode" @click="audioStore.togglePlayMode()">
              <image class="icon-img" :src="modeIcon" mode="aspectFit" />
            </view>
            <view class="btn prev" @click="audioStore.playPrev()">
              <wd-icon name="previous" size="60rpx" color="#fff" />
            </view>
            <view class="btn play" @click="audioStore.togglePlay()">
              <wd-icon 
                :name="audioStore.isPlaying ? 'pause' : 'play'" 
                size="100rpx" 
                color="#fff" 
              />
            </view>
            <view class="btn next" @click="audioStore.playNext()">
              <wd-icon name="next" size="60rpx" color="#fff" />
            </view>
            <view class="btn list" @click="showPlayList">
              <image class="icon-img" src="/static/icon-list.png" mode="aspectFit" />
            </view>
          </view>
        </view>
        <!-- Playlist Popup -->
        <view class="playlist-popup" :class="{ show: showPlaylistPopup }">
          <view class="popup-mask" @click="showPlaylistPopup = false"></view>
          <view class="popup-content">
            <view class="popup-header">
              <text class="popup-title">播放列表 ({{ audioStore.playList.length }})</text>
              <view class="popup-mode" @click="audioStore.togglePlayMode()">
                <image class="mode-icon-small" :src="modeIcon" mode="aspectFit" />
                <text class="mode-text">{{ modeText }}</text>
              </view>
            </view>
            <scroll-view scroll-y class="popup-list">
              <view 
                v-for="(song, index) in audioStore.playList" 
                :key="song.id"
                class="popup-item"
                :class="{ active: audioStore.currentSong?.id === song.id }"
                @click="playSong(song)"
              >
                <view class="item-info">
                  <text class="item-name">{{ song.name }}</text>
                  <text class="item-artist"> - {{ song.artist }}</text>
                </view>
                <view class="item-action" @click.stop="removeSong(song.id)">
                  <text class="remove-icon">×</text>
                </view>
              </view>
            </scroll-view>
            <view class="popup-close" @click="showPlaylistPopup = false">关闭</view>
          </view>
        </view>

        <!-- Timer Popup -->
        <view class="playlist-popup" :class="{ show: showTimerPopup }">
          <view class="popup-mask" @click="showTimerPopup = false"></view>
          <view class="popup-content timer-popup-content">
            <view class="popup-header">
              <text class="popup-title">定时关闭</text>
            </view>
            <view class="timer-list">
              <view 
                v-for="item in timerOptions" 
                :key="item.value"
                class="timer-item"
                :class="{ active: audioStore.timerDuration === item.value }"
                @click="selectTimer(item.value)"
              >
                <text class="timer-text">{{ item.label }}</text>
                <wd-icon v-if="audioStore.timerDuration === item.value" name="check" size="40rpx" custom-style="color: var(--success-color, #4CD964)" />
              </view>
            </view>
            <view class="popup-close" @click="showTimerPopup = false">关闭</view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch, computed, getCurrentInstance, nextTick } from 'vue'
import { audioStore } from '@/store/audio'

const instance = getCurrentInstance()
const defaultCover = '/static/logo.png'
const isSeeking = ref(false)
const statusBarHeight = uni.getSystemInfoSync().statusBarHeight || 20
const showLyrics = ref(false)
const parsedLyrics = ref<{ time: number; text: string }[]>([])
const scrollTop = ref(0)
const currentScrollTop = ref(0)
const showPlaylistPopup = ref(false)
const showTimerPopup = ref(false)

const timerOptions = [
  { label: '不开启', value: 0 },
  { label: '15分钟', value: 15 },
  { label: '30分钟', value: 30 },
  { label: '60分钟', value: 60 },
  { label: '90分钟', value: 90 }
]

const selectTimer = (minutes: number) => {
  if (minutes === 0) {
    audioStore.stopTimer()
  } else {
    audioStore.startTimer(minutes)
  }
  showTimerPopup.value = false
  uni.showToast({
    title: minutes === 0 ? '已关闭定时' : `将在${minutes}分钟后停止`,
    icon: 'none'
  })
}

const isVisible = computed(() => audioStore.showFullScreen)

const onScroll = (e: any) => {
  currentScrollTop.value = e.detail.scrollTop
}

const scrollToCurrentLyric = () => {
  if (!showLyrics.value || isSeeking.value || currentLyricIndex.value < 0) return
  
  // Use nextTick to ensure DOM is ready
  nextTick(() => {
    const query = uni.createSelectorQuery().in(instance)
    query.select('.lyrics-area').boundingClientRect()
    query.select(`#line-${currentLyricIndex.value}`).boundingClientRect()
    
    query.exec((res) => {
      if (!Array.isArray(res) || res.length < 2) return
      
      let container = res[0]
      let line = res[1]
      
      // Handle potential array wrapping
      if (Array.isArray(container)) container = container[0]
      if (Array.isArray(line)) line = line[0]
      
      if (!container || !container.height || !line) return
      
      const relativeTop = line.top - container.top
      const target = currentScrollTop.value + relativeTop - (container.height / 2) + (line.height / 2)
      
      scrollTop.value = target
    })
  })
}

const goBack = () => {
  audioStore.showFullScreen = false
}

const showPlayList = () => {
  showPlaylistPopup.value = true
}

const playSong = (song: any) => {
  audioStore.play(song)
}

const removeSong = (id: number) => {
  audioStore.removeSong(id)
}

const formatTime = (time: number) => {
  if (!time) return '00:00'
  const mins = Math.floor(time / 60)
  const secs = Math.floor(time % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const onSeek = (e: any) => {
  audioStore.seek(e.detail.value)
  isSeeking.value = false
}

// Parse LRC
const parseLyrics = (lrc: string) => {
  if (!lrc) return []
  const lines = lrc.split('\n')
  const result: { time: number; text: string }[] = []
  const timeExp = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/

  for (const line of lines) {
    const match = timeExp.exec(line)
    if (match) {
      const mins = parseInt(match[1])
      const secs = parseInt(match[2])
      const ms = parseInt(match[3])
      // Convert to seconds
      const time = mins * 60 + secs + ms / 1000
      const text = line.replace(timeExp, '').trim()
      if (text) {
        result.push({ time, text })
      }
    }
  }
  return result
}

// Watch song change to parse lyrics
watch(() => audioStore.currentSong, (newSong) => {
  if (newSong && newSong.lyrics) {
    parsedLyrics.value = parseLyrics(newSong.lyrics)
  } else {
    parsedLyrics.value = []
  }
}, { immediate: true })

// Current lyric index
const currentLyricIndex = computed(() => {
  if (parsedLyrics.value.length === 0) return -1
  const currentTime = audioStore.currentTime
  // Find the last lyric line that has started
  for (let i = parsedLyrics.value.length - 1; i >= 0; i--) {
    if (currentTime >= parsedLyrics.value[i].time) {
      return i
    }
  }
  return -1
})

const modeIcon = computed(() => {
  switch (audioStore.playMode) {
    case 'single': return '/static/icon-single.png'
    case 'random': return '/static/icon-random.png'
    case 'order': return '/static/icon-order.png'
    default: return '/static/icon-loop.png'
  }
})

const modeText = computed(() => {
  switch (audioStore.playMode) {
    case 'single': return '单曲循环'
    case 'random': return '随机播放'
    case 'order': return '顺序播放'
    default: return '列表循环'
  }
})

// Animation state control
const animationState = ref(audioStore.isPlaying ? 'running' : 'paused')

watch(() => audioStore.isPlaying, (playing) => {
  animationState.value = playing ? 'running' : 'paused'
})

// Force reset animation when entering fullscreen
watch(() => audioStore.showFullScreen, (val) => {
  if (val && audioStore.isPlaying) {
    animationState.value = 'paused'
    setTimeout(() => {
      if (audioStore.isPlaying) {
        animationState.value = 'running'
      }
    }, 50)
  }
})

// Auto scroll lyrics
watch(currentLyricIndex, (index) => {
  if (index >= 0 && showLyrics.value && !isSeeking.value) {
    scrollToCurrentLyric()
  }
})

// Scroll to current lyric when switching to lyrics view
watch(showLyrics, (val) => {
  if (val) {
    // Small delay to ensure rendering
    setTimeout(() => {
      scrollToCurrentLyric()
    }, 100)
  }
})
</script>

<style scoped>
.player-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
  pointer-events: none;
}

.player-page {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #000;
  overflow: hidden;
  transform: translateY(100%);
  transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  pointer-events: auto;
}

.player-page.visible {
  transform: translateY(0);
}

.bg-blur {
  position: absolute;
  width: 100%;
  height: 100%;
  filter: blur(40px);
  opacity: 0.6;
  transform: scale(1.2);
}

.bg-mask {
  position: absolute;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
}

.header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  padding-left: 30rpx;
  height: 88rpx;
  box-sizing: content-box;
}

.back-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  backdrop-filter: blur(10px);
}

.back-icon {
  color: #fff;
  font-size: 36rpx;
  font-weight: bold;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.action-btn {
  height: 60rpx;
  min-width: 60rpx;
  padding: 0 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 30rpx;
  backdrop-filter: blur(10px);
  box-sizing: border-box;
}

.lyric-icon {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.6);
  font-weight: bold;
}

.lyric-icon.active {
  color: #fff;
}

.timer-text {
  font-size: 24rpx;
  color: #fff;
  margin-left: 8rpx;
}

.tab-switcher {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.tab-item {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.6);
  padding: 10rpx 20rpx;
  transition: all 0.3s;
}

.tab-item.active {
  color: #fff;
  font-weight: 600;
  font-size: 30rpx;
}

.divider {
  color: rgba(255, 255, 255, 0.3);
  font-size: 24rpx;
}

.content {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  z-index: 1;
  padding: 0 40rpx 80rpx;
}

.disc-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lyrics-area {
  flex: 1;
  width: 100%;
  /* Use a fixed height logic or flex basis */
  height: 0; /* Important for flex child scroll view */
  margin-top: 100rpx; /* Space for header */
  margin-bottom: 40rpx;
  mask-image: linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%);
  -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%);
}

.lyrics-wrapper {
  padding: 200rpx 0; /* Initial padding */
  display: flex;
  flex-direction: column;
  align-items: center;
}

.lyric-line {
  font-size: 30rpx;
  color: rgba(255, 255, 255, 0.5);
  padding: 16rpx 0;
  text-align: center;
  transition: all 0.3s;
  min-height: 40rpx;
}

.lyric-line.active {
  color: #fff;
  font-size: 36rpx;
  font-weight: 600;
  text-shadow: 0 0 10rpx rgba(255, 255, 255, 0.5);
}

.no-lyrics {
  color: rgba(255, 255, 255, 0.5);
  margin-top: 200rpx;
}

.disc {
  width: 500rpx;
  height: 500rpx;
  border-radius: 50%;
  background: #222;
  border: 10rpx solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
  box-shadow: 0 0 20rpx rgba(0,0,0,0.5);
  animation: rotate 20s linear infinite;
  animation-play-state: paused;
  will-change: transform;
}

.cover {
  width: 100%;
  height: 100%;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.info-area {
  margin-top: auto;
  /* Ensure controls stay at bottom */
}

.song-info {
  margin-bottom: 40rpx;
}

.song-name {
  display: block;
  font-size: 40rpx;
  font-weight: 600;
  color: #fff;
  margin-bottom: 10rpx;
}

.song-artist {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.6);
}

.progress-bar {
  display: flex;
  align-items: center;
  margin-bottom: 60rpx;
}

.time {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.6);
  width: 80rpx;
  text-align: center;
}

.slider {
  flex: 1;
  margin: 0 20rpx;
}

.controls {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 40rpx 60rpx;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-img {
  width: 50rpx;
  height: 50rpx;
  opacity: 0.8;
}

.playlist-popup {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
  visibility: hidden;
  transition: visibility 0.3s;
}

.playlist-popup.show {
  visibility: visible;
}

.popup-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  opacity: 0;
  transition: opacity 0.3s;
}

.playlist-popup.show .popup-mask {
  opacity: 1;
}

.timer-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10rpx;
}

.timer-text {
  font-size: 20rpx;
  color: #fff;
  margin-top: 4rpx;
}

.timer-list {
  padding: 0 30rpx;
}

.timer-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx 0;
  border-bottom: 1rpx solid var(--border-color, #f5f5f5);
}

.timer-item:last-child {
  border-bottom: none;
}

.timer-item .timer-text {
  font-size: 30rpx;
  color: var(--text-color-primary, #333);
}

.timer-item.active .timer-text {
  color: var(--success-color, #4CD964);
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 50;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
}

.spinner {
  width: 60rpx;
  height: 60rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.3);
  border-top: 4rpx solid #fff;
  border-radius: 50%;
  animation: rotate 1s linear infinite;
  margin-bottom: 20rpx;
}

.loading-text {
  color: #fff;
  font-size: 28rpx;
}

.popup-content {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60%;
  background: var(--bg-color-card, #fff);
  border-radius: 40rpx 40rpx 0 0;
  transform: translateY(100%);
  transition: transform 0.3s;
  display: flex;
  flex-direction: column;
  padding-bottom: env(safe-area-inset-bottom);
}

.playlist-popup.show .popup-content {
  transform: translateY(0);
}

.popup-header {
  padding: 30rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1rpx solid var(--border-color, #eee);
}

.popup-title {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--text-color-primary, #333);
}

.popup-mode {
  display: flex;
  align-items: center;
}

.mode-icon-small {
  width: 32rpx;
  height: 32rpx;
  margin-right: 10rpx;
  opacity: 0.6;
}

.mode-text {
  font-size: 26rpx;
  color: var(--text-color-secondary, #666);
}

.popup-list {
  flex: 1;
  height: 0;
}

.popup-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 30rpx;
  border-bottom: 1rpx solid var(--border-color, #f5f5f5);
}

.popup-item.active .item-name,
.popup-item.active .item-artist {
  color: var(--primary-color, #007aff);
}

.item-info {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-name {
  font-size: 30rpx;
  color: var(--text-color-primary, #333);
}

.item-artist {
  font-size: 24rpx;
  color: var(--text-color-secondary, #999);
}

.item-action {
  padding: 10rpx;
  margin-left: 20rpx;
}

.remove-icon {
  font-size: 40rpx;
  color: var(--text-color-secondary, #999);
  line-height: 1;
}

.popup-close {
  padding: 30rpx;
  text-align: center;
  font-size: 32rpx;
  color: var(--text-color-primary, #333);
  border-top: 1rpx solid var(--border-color, #eee);
}
</style>