<template>
  <view 
    class="desktop-lyric" 
    v-if="audioStore.showDesktopLyric && audioStore.currentSong"
    :style="lyricStyle"
    @touchstart="handleTouchStart"
    @touchmove.stop.prevent="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <text class="lyric-text">{{ currentLyric || '...' }}</text>
    <view class="close-btn" @click.stop="closeLyric">
      <wd-icon name="close" size="16px" color="#fff" />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { audioStore } from '@/store/audio'

// Lyric parsing logic
const parsedLyrics = ref<{ time: number; text: string }[]>([])

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
      const time = mins * 60 + secs + ms / 1000
      const text = line.replace(timeExp, '').trim()
      if (text) {
        result.push({ time, text })
      }
    }
  }
  return result
}

watch(() => audioStore.currentSong, (newSong) => {
  if (newSong && newSong.lyrics) {
    parsedLyrics.value = parseLyrics(newSong.lyrics)
  } else {
    parsedLyrics.value = []
  }
}, { immediate: true })

const currentLyric = computed(() => {
  if (parsedLyrics.value.length === 0) return audioStore.currentSong?.name || ''
  const currentTime = audioStore.currentTime
  for (let i = parsedLyrics.value.length - 1; i >= 0; i--) {
    if (currentTime >= parsedLyrics.value[i].time) {
      return parsedLyrics.value[i].text
    }
  }
  return parsedLyrics.value[0]?.text || ''
})

// Dragging logic
const systemInfo = uni.getSystemInfoSync()
const screenWidth = systemInfo.windowWidth
const screenHeight = systemInfo.windowHeight
const posX = ref(screenWidth / 2 - 150) // Initial center
const posY = ref(100) // Initial top offset
const startX = ref(0)
const startY = ref(0)
const initialX = ref(0)
const initialY = ref(0)

const lyricStyle = computed(() => ({
  top: `${posY.value}px`,
  left: `${posX.value}px`
}))

const handleTouchStart = (e: any) => {
  startX.value = e.touches[0].clientX
  startY.value = e.touches[0].clientY
  initialX.value = posX.value
  initialY.value = posY.value
}

const handleTouchMove = (e: any) => {
  const deltaX = e.touches[0].clientX - startX.value
  const deltaY = e.touches[0].clientY - startY.value
  posX.value = initialX.value + deltaX
  posY.value = initialY.value + deltaY
}

const handleTouchEnd = () => {
  // Boundary checks
  const width = 300
  const height = 40
  
  if (posX.value < 0) posX.value = 0
  if (posX.value > screenWidth - width) posX.value = screenWidth - width
  if (posY.value < 0) posY.value = 0
  if (posY.value > screenHeight - height) posY.value = screenHeight - height
}

const closeLyric = () => {
  audioStore.showDesktopLyric = false
}
</script>

<style scoped>
.desktop-lyric {
  position: fixed;
  z-index: 9999;
  width: 300px;
  height: 40px;
  padding: 0 12px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  transition: opacity 0.3s;
}

.lyric-text {
  color: #fff;
  font-size: 15px;
  font-weight: 500;
  text-align: center;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  margin-right: 4px;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  opacity: 0.7;
}

.close-btn:active {
  opacity: 1;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
}
</style>
