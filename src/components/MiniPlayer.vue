<template>
  <!-- Gradient Hint Overlay -->
  <view 
    class="close-hint-gradient" 
    :style="{ opacity: hintOpacity }"
  ></view>

  <view 
    class="mini-player" 
    v-if="audioStore.currentSong" 
    @click="handleClick"
    @touchstart="handleTouchStart"
    @touchmove.stop.prevent="handleTouchMove"
    @touchend="handleTouchEnd"
    :style="playerStyle"
  >
    <!-- Progress Bar (Top Border) -->
    <view class="progress-track">
      <view 
        class="progress-fill" 
        :style="{ width: (audioStore.currentTime / audioStore.duration) * 100 + '%' }"
      ></view>
    </view>

    <view class="mini-content">
      <view class="cover-box" :style="{ 'animation-play-state': audioStore.isPlaying ? 'running' : 'paused' }">
        <image 
          class="cover" 
          :src="audioStore.currentSong.coverUrl || defaultCover" 
          mode="aspectFill" 
        />
      </view>
      
      <view class="info">
        <text class="name">{{ audioStore.currentSong.name }}</text>
        <text class="artist">{{ audioStore.currentSong.artist }}</text>
      </view>
      
      <view class="controls">
        <view class="btn" @click.stop="audioStore.playPrev()">
          <wd-icon name="previous" size="24px" color="#333" />
        </view>
        <view class="btn" @click.stop="audioStore.togglePlay()">
          <wd-icon 
            :name="audioStore.isPlaying ? 'pause' : 'play'" 
            size="45px" 
            color="#333" 
          />
        </view>
        <view class="btn" @click.stop="audioStore.playNext()">
          <wd-icon name="next" size="24px" color="#333" />
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { audioStore } from '@/store/audio'
import { ref, computed } from 'vue'

const defaultCover = '/static/logo.png'

// Gesture State
const startY = ref(0)
const offsetY = ref(0)
const isDragging = ref(false)
const isClosing = ref(false)
const suppressClick = ref(false)

const formatTime = (time: number) => {
  if (!time) return ''
  const mins = Math.ceil(time / 60)
  return `${mins}m`
}

const handleTouchStart = (e: any) => {
  // Reset closing state if we touch it again (though usually it's gone)
  isClosing.value = false
  startY.value = e.touches[0].clientY
  isDragging.value = false
}

const handleTouchMove = (e: any) => {
  const currentY = e.touches[0].clientY
  const deltaY = currentY - startY.value
  
  // Only allow dragging downwards
  if (deltaY > 0) {
    offsetY.value = deltaY
    isDragging.value = true
  }
}

const handleTouchEnd = () => {
  if (offsetY.value > 60) { // Threshold to close
    closePlayer()
  } else {
    // Rebound
    offsetY.value = 0
    // If we dragged a bit but not enough to close, still suppress click
    if (isDragging.value) {
      suppressClick.value = true
      setTimeout(() => suppressClick.value = false, 50)
    }
  }
  isDragging.value = false
}

const closePlayer = () => {
  isClosing.value = true
  offsetY.value = 200 // Animate out
  
  // Wait for animation then actual close
  setTimeout(() => {
    if (audioStore.isPlaying) {
      audioStore.togglePlay()
    }
    audioStore.currentSong = null
    // Reset state
    offsetY.value = 0
    isClosing.value = false
  }, 300)
}

const hintOpacity = computed(() => {
  if (!isDragging.value && !isClosing.value) return 0
  const maxOpacity = 0.8
  // Map 0-100px drag to 0-0.8 opacity
  return Math.min(offsetY.value / 100, 1) * maxOpacity
})

const playerStyle = computed(() => {
  const baseTransform = 'translateX(-50%)'
  const translate = `${baseTransform} translateY(${offsetY.value}px)`
  const transition = isDragging.value ? 'none' : 'transform 0.3s ease, opacity 0.3s ease'
  const opacity = isClosing.value ? 0 : 1
  
  return {
    transform: translate,
    transition: transition,
    opacity: opacity
  }
})

const handleClick = () => {
  if (suppressClick.value) return
  goPlayer()
}

const goPlayer = () => {
  audioStore.showFullScreen = true
}
</script>

<style scoped>
.close-hint-gradient {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 300rpx;
  background: linear-gradient(to top, rgba(0,0,0,0.6), transparent);
  pointer-events: none;
  z-index: 101; /* Above TabBar (100) but below Player (102) */
  transition: opacity 0.2s ease;
}

.mini-player {
  position: fixed;
  bottom: 170rpx; /* Moved closer to CustomTabBar */
  left: 50%;
  transform: translateX(-50%); /* Center horizontally */
  width: 560rpx; /* Approximate width to match CustomTabBar */
  height: 110rpx;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 55rpx;
  box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.1);
  z-index: 102; /* Ensure above Gradient (101) and TabBar (100) */
  overflow: hidden;
  border: 1px solid rgba(0,0,0,0.05);
}

.progress-track {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4rpx;
  background: rgba(0,0,0,0.05);
}

.progress-fill {
  height: 100%;
  background: #4f46e5;
  transition: width 0.2s linear;
}

.mini-content {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 20rpx;
}

.cover-box {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 20rpx;
  background: #eee;
  border: 2rpx solid rgba(0,0,0,0.1);
  animation: rotate 10s linear infinite;
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

.info {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.name {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.artist {
  font-size: 22rpx;
  color: #888;
}

.artist-row {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.timer-badge {
  display: flex;
  align-items: center;
  gap: 4rpx;
  background: rgba(76, 217, 100, 0.1);
  padding: 2rpx 8rpx;
  border-radius: 8rpx;
}

.timer-text {
  font-size: 20rpx;
  color: #4CD964;
}

.controls {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-left: 20rpx;
}

.btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  /* background: #f5f5f5; */
}

.icon {
  font-size: 36rpx;
  color: #333;
}
</style>
