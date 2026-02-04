<template>
  <view v-if="visible" class="update-mask">
    <view class="update-modal">
      <view class="update-header">
        <text class="title">发现新版本</text>
        <text class="version">V{{ updateInfo.version }}</text>
      </view>
      
      <scroll-view scroll-y class="update-content">
        <text class="note">{{ updateInfo.note }}</text>
      </scroll-view>
      
      <view class="update-footer">
        <template v-if="downloading">
          <view class="progress-box">
             <view class="progress-bar" :style="{ width: progress + '%' }"></view>
          </view>
          <text class="progress-text">{{ progress }}%</text>
          <text class="downloading-text">正在下载资源，请勿关闭应用...</text>
        </template>
        
        <template v-else>
          <button class="update-btn" @click="startUpdate">立即更新</button>
          <button v-if="!updateInfo.force" class="ignore-btn" @click="close">稍后提醒</button>
        </template>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { checkAppUpdate, downloadAppUpdate, installAppUpdate, type UpdateResult } from '@/utils/updater'

const visible = ref(false)
const downloading = ref(false)
const progress = ref(0)
const updateInfo = ref<UpdateResult>({ hasUpdate: false })

const check = async () => {
  const info = await checkAppUpdate()
  if (info && info.hasUpdate) {
    updateInfo.value = info
    visible.value = true
    
    // 如果是强制更新，隐藏底部TabBar（如果可能），防止用户误触
    if (info.force) {
      uni.hideTabBar()
    }
  }
}

const startUpdate = async () => {
  if (!updateInfo.value.url) return
  
  downloading.value = true
  progress.value = 0
  
  try {
    const filePath = await downloadAppUpdate(updateInfo.value.url, (p) => {
      progress.value = p
    })
    
    // Install
    const isWgt = updateInfo.value.type === 'wgt' || updateInfo.value.url.endsWith('.wgt')
    await installAppUpdate(filePath, isWgt)
    
  } catch (e) {
    console.error('Update failed:', e)
    uni.showToast({ title: '更新失败: ' + (e instanceof Error ? e.message : '未知错误'), icon: 'none', duration: 3000 })
    downloading.value = false
    progress.value = 0
  }
}

const close = () => {
  if (updateInfo.value.force) return
  visible.value = false
}

onMounted(() => {
  // Delay check slightly to ensure app is ready
  // 暂时禁用自动检查更新（因无备案域名无法下载）
  // setTimeout(check, 2000)
})
</script>

<style scoped>
.update-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(2px);
}

.update-modal {
  width: 600rpx;
  background-color: #fff;
  border-radius: 24rpx;
  padding: 50rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
}

.update-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 40rpx;
}

.title {
  font-size: 38rpx;
  font-weight: bold;
  color: #333;
}

.version {
  font-size: 24rpx;
  color: #007aff;
  margin-top: 12rpx;
  background-color: rgba(0, 122, 255, 0.1);
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
}

.update-content {
  width: 100%;
  max-height: 400rpx;
  margin-bottom: 50rpx;
  background-color: #f9f9f9;
  padding: 20rpx;
  border-radius: 12rpx;
  box-sizing: border-box;
}

.note {
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
  white-space: pre-wrap;
}

.update-footer {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.update-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background: linear-gradient(90deg, #007aff, #00c6ff);
  color: #fff;
  border-radius: 44rpx;
  font-size: 32rpx;
  margin-bottom: 24rpx;
  border: none;
  font-weight: bold;
}

.ignore-btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  background-color: transparent;
  color: #999;
  font-size: 28rpx;
}

.ignore-btn::after {
  border: none;
}

.progress-box {
  width: 100%;
  height: 16rpx;
  background-color: #eee;
  border-radius: 8rpx;
  margin-bottom: 24rpx;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #007aff, #00c6ff);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 36rpx;
  color: #007aff;
  font-weight: bold;
  margin-bottom: 12rpx;
}

.downloading-text {
  font-size: 24rpx;
  color: #999;
}
</style>
