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
      <view class="title">{{ title }}</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const videoUrl = ref('')
const coverUrl = ref('')
const title = ref('')

onLoad((options) => {
  if (options) {
    if (options.url) videoUrl.value = decodeURIComponent(options.url)
    if (options.cover) coverUrl.value = decodeURIComponent(options.cover)
    if (options.title) title.value = decodeURIComponent(options.title)
  }
})
</script>

<style scoped>
.video-page {
  background: #000;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.video-player {
  width: 100%;
  height: 450rpx;
}
.info {
  padding: 32rpx;
  color: #fff;
}
.title {
  font-size: 32rpx;
  font-weight: 500;
}
</style>
