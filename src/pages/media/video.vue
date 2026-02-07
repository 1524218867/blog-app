<template>
  <view class="video-page" :class="themeStore.currentTheme">
    <wd-navbar
      title="视频播放"
      left-arrow
      fixed
      placeholder
      safe-area-inset-top
      @click-left="goBack"
      custom-style="background-color: var(--bg-color, #ffffff); --wot-navbar-title-color: var(--text-color-primary, #333); --wot-navbar-icon-color: var(--text-color-primary, #333);"
    />
    <video 
      id="myVideo" 
      class="video-player" 
      :src="videoUrl" 
      :poster="coverUrl"
      controls 
      autoplay
      object-fit="contain"
      @timeupdate="handleTimeUpdate"
      @ended="handleEnded"
    ></video>
    <view class="info">
      <view class="author-row" v-if="user">
        <image 
          v-if="user.avatar" 
          :src="user.avatar" 
          class="avatar" 
          mode="aspectFill"
        />
        <view v-else class="avatar-placeholder">
          <text class="avatar-text">{{ user.email ? user.email[0].toUpperCase() : 'U' }}</text>
        </view>
        <view class="author-info">
          <text class="author-name">{{ user.email }}</text>
          <text class="author-desc">管理员</text>
        </view>
      </view>
      <view class="title">{{ title }}</view>
      <view class="time">{{ new Date().toLocaleDateString() }}</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import { request, reportHistory } from '@/utils/request'
import { useThemeStore } from '@/store/theme'

const themeStore = useThemeStore()
const videoUrl = ref('')
const coverUrl = ref('')
const title = ref('')
const videoId = ref<string | number>('')
const user = ref<any>(null)

const goBack = () => {
  uni.navigateBack()
}

// 进度记录
let currentProgress = 0
let isEnded = false
let reportTimer: number | null = null

const fetchUser = async () => {
  try {
    const res = await request('/auth/me')
    if (res.ok) {
      user.value = res.user
    }
  } catch (e) {
    console.error(e)
  }
}

onLoad((options) => {
  if (options) {
    if (options.url) videoUrl.value = decodeURIComponent(options.url)
    if (options.cover) coverUrl.value = decodeURIComponent(options.cover)
    if (options.title) title.value = decodeURIComponent(options.title)
    if (options.id) videoId.value = options.id
    
    // 初始上报
    if (videoId.value) {
      reportHistory('video', videoId.value, 0, false)
    }
  }
  fetchUser()
})

const handleTimeUpdate = (e: any) => {
  const { currentTime, duration } = e.detail
  if (duration > 0) {
    currentProgress = (currentTime / duration) * 100
    
    // 每 10 秒上报一次进度，避免过于频繁
    if (!reportTimer) {
      reportTimer = setTimeout(() => {
        if (videoId.value) {
          reportHistory('video', videoId.value, currentProgress, false)
        }
        reportTimer = null
      }, 10000) as unknown as number
    }
  }
}

const handleEnded = () => {
  isEnded = true
  if (videoId.value) {
    reportHistory('video', videoId.value, 100, true)
  }
}

// 页面卸载时最后上报一次
onUnload(() => {
  if (reportTimer) {
    clearTimeout(reportTimer)
  }
  if (videoId.value && !isEnded) {
    reportHistory('video', videoId.value, currentProgress, false)
  }
})
</script>

<style scoped>
.video-page {
  background: var(--bg-color, #ffffff);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.video-player {
  width: 100%;
  height: 450rpx;
  background: #000;
}

.info {
  padding: 32rpx;
  color: var(--text-color-primary, #333);
  background: var(--bg-color-card, #ffffff);
  flex: 1;
  border-radius: 24rpx 24rpx 0 0;
  margin-top: -20rpx;
  position: relative;
  z-index: 1;
}

.author-row {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
}

.avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  margin-right: 20rpx;
  border: 2rpx solid var(--border-color, #eee);
}

.avatar-placeholder {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  margin-right: 20rpx;
  background: var(--primary-color, #3b82f6);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid var(--border-color, #eee);
}

.avatar-text {
  color: #fff;
  font-size: 32rpx;
  font-weight: bold;
}

.author-info {
  display: flex;
  flex-direction: column;
}

.author-name {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--text-color-primary, #333);
}

.author-desc {
  font-size: 22rpx;
  color: var(--text-color-secondary, #666);
  margin-top: 4rpx;
}

.title {
  font-size: 36rpx;
  font-weight: 600;
  line-height: 1.4;
  margin-bottom: 16rpx;
  color: var(--text-color-primary, #000);
}

.time {
  font-size: 24rpx;
  color: var(--text-color-secondary, #999);
}
</style>
