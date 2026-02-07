<template>
  <view class="page-container" :class="themeStore.currentTheme">
    <wd-navbar
      title="存储空间"
      left-arrow
      fixed
      placeholder
      safe-area-inset-top
      @click-left="goBack"
      custom-style="background-color: var(--bg-color, #ffffff); --wot-navbar-title-color: var(--text-color-primary, #1e293b); --wot-navbar-icon-color: var(--text-color-primary, #1e293b);"
    />
    <!-- Cloud Storage Card -->
    <view class="storage-card cloud-card">
      <view class="card-header">
        <text class="card-title">云端存储空间</text>
        <view class="expand-btn" @click="handleExpand">
          <text>扩容</text>
          <wd-icon name="arrow-right" size="14px" custom-style="color: var(--primary-color, #3b82f6)" />
        </view>
      </view>
      
      <view class="usage-info">
        <view class="usage-text">
          <text class="used-num">{{ formatSize(cloudStats.used) }}</text>
          <text class="total-num">/ {{ formatSize(cloudStats.total) }}</text>
        </view>
        <text class="usage-percent">已用 {{ usedPercent }}%</text>
      </view>

      <view class="progress-bar-bg">
        <view class="progress-bar-fill" :style="{ width: usedPercent + '%' }"></view>
      </view>
    </view>

    <!-- Cloud Distribution -->
    <view class="section-title">存储分布</view>
    <view class="menu-list">
      <wd-cell-group border>
        <wd-cell title="图片" center>
          <template #icon>
            <view class="type-icon image-icon">
              <wd-icon name="image" size="20px" color="#fff" />
            </view>
          </template>
          <view class="cell-value">
            <text>{{ formatSize(cloudStats.distribution.images) }}</text>
          </view>
        </wd-cell>
        <wd-cell title="视频" center>
          <template #icon>
            <view class="type-icon video-icon">
              <wd-icon name="video" size="20px" color="#fff" />
            </view>
          </template>
          <view class="cell-value">
            <text>{{ formatSize(cloudStats.distribution.videos) }}</text>
          </view>
        </wd-cell>
        <wd-cell title="音频" center>
          <template #icon>
            <view class="type-icon audio-icon">
              <wd-icon name="music" size="20px" color="#fff" />
            </view>
          </template>
          <view class="cell-value">
            <text>{{ formatSize(cloudStats.distribution.audios) }}</text>
          </view>
        </wd-cell>
        <wd-cell title="文档" center>
          <template #icon>
            <view class="type-icon doc-icon">
              <wd-icon name="file" size="20px" color="#fff" />
            </view>
          </template>
          <view class="cell-value">
            <text>{{ formatSize(cloudStats.distribution.documents) }}</text>
          </view>
        </wd-cell>
        <wd-cell title="其他" center>
          <template #icon>
            <view class="type-icon other-icon">
              <wd-icon name="folder" size="20px" color="#fff" />
            </view>
          </template>
          <view class="cell-value">
            <text>{{ formatSize(cloudStats.distribution.others) }}</text>
          </view>
        </wd-cell>
      </wd-cell-group>
    </view>

    <!-- Local Storage (Secondary) -->
    <view class="section-title">本地缓存</view>
    <view class="menu-list">
      <wd-cell-group border>
        <wd-cell title="本地缓存占用" :label="systemInfo" center>
          <template #icon>
             <wd-icon name="mobile" size="20px" custom-style="color: var(--text-color-secondary, #64748b); margin-right: 12px;" />
          </template>
          <view class="cell-value">
            <text>{{ formatSize(totalLocalSize) }}</text>
          </view>
        </wd-cell>
      </wd-cell-group>
    </view>

    <view class="action-area">
      <wd-button type="info" variant="outline" block size="large" @click="handleClear">清理本地缓存</wd-button>
      <text class="tip-text">清理本地缓存可以释放手机空间，不影响云端数据。</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { request } from '@/utils/request'
import { useThemeStore } from '@/store/theme'

const themeStore = useThemeStore()

const goBack = () => {
  uni.navigateBack()
}

const cloudStats = ref({
  total: 0,
  used: 0,
  distribution: {
    images: 0,
    videos: 0,
    audios: 0,
    documents: 0,
    others: 0
  }
})

const totalLocalSize = ref(0)
const storageSize = ref(0)
const cacheSize = ref(0)
const systemInfo = ref('')

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const usedPercent = computed(() => {
  if (cloudStats.value.total === 0) return '0.0'
  const p = (cloudStats.value.used / cloudStats.value.total) * 100
  return Math.min(100, p).toFixed(1)
})

const fetchCloudStorage = async () => {
   try {
     const res = await request('/user/storage')
     if (res && res.ok) {
       cloudStats.value = {
        total: res.total,
        used: res.used,
        distribution: res.distribution
      }
    }
  } catch (err) {
    console.error('Fetch storage failed', err)
  }
}

const calculateLocalStorage = () => {
  try {
    // 1. 计算 LocalStorage (基本数据)
    const res = uni.getStorageInfoSync()
    let size = 0
    res.keys.forEach(key => {
      const data = uni.getStorageSync(key)
      if (data) {
        const str = JSON.stringify(data)
        size += str.length
      }
    })
    storageSize.value = size
    
    // 2. 计算媒体缓存 (仅 App 端有效)
    // #ifdef APP-PLUS
    // @ts-ignore
    plus.cache.calculate((size) => {
      cacheSize.value = size
      totalLocalSize.value = storageSize.value + cacheSize.value
    })
    // #endif

    // #ifndef APP-PLUS
    totalLocalSize.value = storageSize.value
    // #endif
    
    // 获取系统信息
    const sys = uni.getSystemInfoSync()
    systemInfo.value = `${sys.platform} ${sys.system}`
  } catch (e) {
    console.error(e)
  }
}

const handleClear = () => {
  uni.showModal({
    title: '清理本地缓存',
    content: '确定要清理本地缓存吗？这将释放手机存储空间，但下次访问内容时需要重新加载。',
    success: (res) => {
      if (res.confirm) {
        uni.showLoading({ title: '清理中...' })
        try {
          // 1. 清理 LocalStorage (保留白名单)
          const resInfo = uni.getStorageInfoSync()
          const whiteList = ['token', 'apiBase', 'user_info']
          
          resInfo.keys.forEach(key => {
            if (!whiteList.includes(key)) {
              uni.removeStorageSync(key)
            }
          })
          
          // 2. 清理媒体缓存 (App 端)
          // #ifdef APP-PLUS
          // @ts-ignore
          plus.cache.clear(() => {
            uni.hideLoading()
            uni.showToast({ title: '清理完成', icon: 'success' })
            calculateLocalStorage()
          })
          // #endif

          // #ifndef APP-PLUS
          uni.hideLoading()
          uni.showToast({ title: '清理完成', icon: 'success' })
          calculateLocalStorage()
          // #endif
          
        } catch (e) {
          uni.hideLoading()
          uni.showToast({ title: '清理失败', icon: 'none' })
        }
      }
    }
  })
}

const handleExpand = () => {
  uni.showToast({
    title: '暂未开放扩容功能',
    icon: 'none'
  })
}

onMounted(() => {
  calculateLocalStorage()
  fetchCloudStorage()
})

onShow(() => {
  calculateLocalStorage()
  fetchCloudStorage()
})
</script>

<style scoped>
.page-container {
  min-height: 100vh;
  background-color: var(--bg-color, #f8fafc);
  padding: 24rpx;
}

.storage-card {
  background: var(--bg-color-card, #fff);
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.03);
}

.cloud-card {
  background: var(--bg-color-card, #fff);
  border: 1px solid var(--border-color, #e0f2fe);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32rpx;
}

.card-title {
  font-size: 32rpx;
  font-weight: bold;
  color: var(--text-color-primary, #1e293b);
}

.expand-btn {
  display: flex;
  align-items: center;
  font-size: 26rpx;
  color: var(--primary-color, #3b82f6);
}

.usage-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 16rpx;
}

.used-num {
  font-size: 48rpx;
  font-weight: bold;
  color: var(--text-color-primary, #0f172a);
}

.total-num {
  font-size: 28rpx;
  color: var(--text-color-secondary, #64748b);
  margin-left: 8rpx;
}

.usage-percent {
  font-size: 28rpx;
  color: var(--primary-color, #3b82f6);
  font-weight: 600;
}

.progress-bar-bg {
  height: 16rpx;
  background-color: var(--bg-color, #e2e8f0);
  border-radius: 8rpx;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: var(--primary-color, #3b82f6);
  border-radius: 8rpx;
  transition: width 0.5s ease;
}

.section-title {
  font-size: 28rpx;
  font-weight: 600;
  color: var(--text-color-secondary, #475569);
  margin: 32rpx 0 16rpx 12rpx;
}

.menu-list {
  border-radius: 24rpx;
  overflow: hidden;
  background: var(--bg-color-card, #fff);
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.03);
}

.type-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
}

.image-icon {
  background-color: var(--warning-color, #f59e0b);
}

.video-icon {
  background-color: var(--primary-color, #3b82f6);
}

.audio-icon {
  background-color: var(--success-color, #10b981);
}

.doc-icon {
  background-color: var(--purple-color, #8b5cf6);
}

.other-icon {
  background-color: var(--text-color-disabled, #94a3b8);
}

.cell-value {
  font-size: 28rpx;
  color: var(--text-color-secondary, #64748b);
}

.action-area {
  padding: 24rpx 12rpx;
  margin-top: 48rpx;
}

.tip-text {
  display: block;
  text-align: center;
  font-size: 24rpx;
  color: var(--text-color-placeholder, #94a3b8);
  margin-top: 24rpx;
}
</style>