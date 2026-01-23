<template>
  <view class="video-page">
    <video 
      id="myVideo" 
      class="video-player" 
      :src="videoUrl" 
      :poster="coverUrl"
      controls 
      autoplay
      object-fit="contain"
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
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { request } from '@/utils/request'

const videoUrl = ref('')
const coverUrl = ref('')
const title = ref('')
const user = ref<any>(null)

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
  }
  fetchUser()
})
</script>

<style scoped>
.video-page {
  background: #ffffff;
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
  color: #333;
  background: #ffffff;
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
  border: 2rpx solid #eee;
}

.avatar-placeholder {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  margin-right: 20rpx;
  background: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid #eee;
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
  color: #333;
}

.author-desc {
  font-size: 22rpx;
  color: #666;
  margin-top: 4rpx;
}

.title {
  font-size: 36rpx;
  font-weight: 600;
  line-height: 1.4;
  margin-bottom: 16rpx;
  color: #000;
}

.time {
  font-size: 24rpx;
  color: #999;
}
</style>
