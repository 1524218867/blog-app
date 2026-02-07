<template>
  <view class="profile-view">
    <!-- Header Section -->
    <view class="header-section">
      <view class="user-card" @click="handleUserClick">
        <view class="avatar-wrapper">
          <view class="avatar-box">
            <image v-if="user?.avatar" :src="user.avatar" mode="aspectFill" class="avatar-img" />
            <view v-else class="avatar-placeholder">
              <text class="avatar-text">{{ user?.email ? user.email[0].toUpperCase() : 'G' }}</text>
            </view>
          </view>
          <view class="edit-badge" v-if="user">
            <wd-icon name="edit" size="14px" custom-style="color: var(--text-color-primary, #0f172a)" />
          </view>
        </view>
        <view class="info-content">
          <view class="name-row">
            <text class="nickname">{{ user?.nickname || user?.username || '点击登录' }}</text>
            <view class="role-tag" v-if="user?.role === 'admin'">
              <text>管理员</text>
            </view>
          </view>
          <text class="email" v-if="user">{{ user.email }}</text>
          <text class="subtitle" v-else>登录以解锁更多精彩功能</text>
        </view>
        <wd-icon name="arrow-right" custom-style="color: var(--text-color-placeholder, #9ca3af)" size="20px" />
      </view>
    </view>

    <!-- Content Area -->
    <view class="menu-container">
      
      <!-- 1. 空间概览 -->
      <view class="section-card space-card" v-if="user">
        <view class="space-header">
          <view class="space-title-box">
            <text class="space-title">我的空间</text>
            <view class="sync-badge">
              <view class="sync-dot"></view>
              <text>已同步</text>
            </view>
          </view>
          <text class="space-subtitle">数据安全存储中</text>
        </view>
        <view class="storage-box">
          <view class="storage-info">
            <text class="storage-label">存储使用</text>
            <text class="storage-value">{{ formatSize(storage.used) }} / {{ formatSize(storage.total) }}</text>
          </view>
          <view class="progress-bg">
            <view class="progress-bar" :style="{ width: storagePercent + '%' }"></view>
          </view>
        </view>
      </view>

      <!-- 2. 数据安全 -->
      <view class="section-group-title">数据安全</view>
      <view class="section-card">
        <wd-cell-group :border="false">
          <wd-cell title="备份 / 同步" icon="cloud" is-link center clickable :border="false" custom-class="menu-cell" @click="showDevToast" />
          <wd-cell title="导入 / 导出" icon="swap" is-link center clickable :border="false" custom-class="menu-cell" @click="showDevToast" />
          <wd-cell title="回收站" icon="delete" is-link center clickable :border="false" custom-class="menu-cell" @click="showDevToast" />
        </wd-cell-group>
      </view>

      <!-- 3. 使用偏好 -->
      <view class="section-group-title">使用偏好</view>
      <view class="section-card">
        <wd-cell-group :border="false">
          <wd-cell title="主题" icon="fill" is-link center clickable :border="false" custom-class="menu-cell" @click="handleThemeClick">
            <template #value>
              <text class="theme-text">{{ currentThemeLabel }}</text>
            </template>
          </wd-cell>
          <wd-cell title="进度记录" icon="history" center :border="false" custom-class="menu-cell">
            <wd-switch v-model="enableHistory" size="24px" @change="handleHistoryToggle" />
          </wd-cell>
          <wd-cell title="自动继续" icon="play-circle" center :border="false" custom-class="menu-cell">
             <wd-switch v-model="enableAutoContinue" size="24px" @change="handleAutoContinueToggle" />
          </wd-cell>
        </wd-cell-group>
      </view>

      <!-- 4. 内容管理 -->
      <view class="section-group-title">内容管理</view>
      <view class="section-card">
        <wd-cell-group :border="false">
          <wd-cell title="标签管理" icon="list" is-link center clickable :border="false" custom-class="menu-cell" @click="navigateToTags" />
        </wd-cell-group>
      </view>

      <!-- 5. 账号 (可选) -->
      <template v-if="user">
        <view class="section-group-title">账号</view>
        <view class="section-card">
          <wd-cell-group :border="false">
            <wd-cell title="退出登录" icon="error" is-link center clickable :border="false" custom-class="menu-cell" @click="$emit('logout')" />
          </wd-cell-group>
        </view>
      </template>

      <!-- 6. 关于 -->
      <view class="section-group-title">关于</view>
      <view class="section-card">
        <wd-cell-group :border="false">
          <wd-cell title="关于存界" icon="info-circle" is-link center clickable :border="false" custom-class="menu-cell" @click="handleAboutClick">
             <template #value>
              <text class="version-text">v1.0.7</text>
            </template>
          </wd-cell>
        </wd-cell-group>
      </view>
      
    </view>

    <!-- Theme Selection ActionSheet -->
    <view class="theme-sheet-wrapper" v-if="showThemeSheet">
      <wd-action-sheet
        v-model="showThemeSheet"
        :actions="themeActions"
        title="选择主题"
        :z-index="10000"
        safe-area-inset-bottom
        @select="handleThemeSelect"
        custom-class="theme-action-sheet"
      />
    </view>

    <!-- About Overlay with Animation -->
    <view class="about-overlay" v-if="showAbout" @click="closeAbout">
      <view class="about-content" @click.stop>
        <view class="logo-animate">
           <wd-icon name="cloud" size="64px" custom-style="color: var(--primary-color, #3b82f6)" />
        </view>
        <text class="app-name">存界</text>
        <text class="app-slogan">收藏每一个瞬间</text>
        <text class="app-version">v1.0.7</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { request } from '@/utils/request'
import { onShow } from '@dcloudio/uni-app'
import { useThemeStore } from '@/store/theme'

const themeStore = useThemeStore()

// Theme Management
const showThemeSheet = ref(false)
const themeActions = [
  { name: '亮色 (默认)', value: 'light' },
  { name: '暗色 (夜间)', value: 'dark' },
  { name: '柔和暖色 (舒适)', value: 'warm' }
]

const currentThemeLabel = computed(() => {
  const map: Record<string, string> = {
    light: '亮色',
    dark: '暗色',
    warm: '暖色'
  }
  return map[themeStore.currentTheme] || '亮色'
})

const handleThemeClick = () => {
  showThemeSheet.value = true
}

const handleThemeSelect = ({ item }: { item: any }) => {
  themeStore.setTheme(item.value)
  showThemeSheet.value = false
}


const props = defineProps<{
  user: any
}>()

const emit = defineEmits(['logout', 'refresh'])

const enableHistory = ref(true)
const enableAutoContinue = ref(true)

watch(() => props.user, (newUser) => {
  if (newUser) {
    // 默认为 true，除非显式为 false (0)
    enableHistory.value = newUser.enable_history_recording !== false && newUser.enable_history_recording !== 0
    enableAutoContinue.value = newUser.enable_auto_continue !== false && newUser.enable_auto_continue !== 0
  }
}, { immediate: true })

const handleHistoryToggle = async ({ value }: { value: boolean }) => {
  try {
    const res = await request('/auth/profile', 'PUT', { enable_history_recording: value })
    if (res.ok) {
       enableHistory.value = value
       emit('refresh')
    } else {
       // revert on failure
       enableHistory.value = !value
       uni.showToast({ title: '设置失败', icon: 'none' })
    }
  } catch (e) {
    enableHistory.value = !value
    uni.showToast({ title: '设置失败', icon: 'none' })
  }
}

const handleAutoContinueToggle = async ({ value }: { value: boolean }) => {
  try {
    const res = await request('/auth/profile', 'PUT', { enable_auto_continue: value })
    if (res.ok) {
       enableAutoContinue.value = value
       emit('refresh')
    } else {
       // revert on failure
       enableAutoContinue.value = !value
       uni.showToast({ title: '设置失败', icon: 'none' })
    }
  } catch (e) {
    enableAutoContinue.value = !value
    uni.showToast({ title: '设置失败', icon: 'none' })
  }
}

const storage = ref({
  total: 1024 * 1024 * 1024 * 5, // Default 5GB
  used: 0
})

const storagePercent = computed(() => {
  if (storage.value.total === 0) return 0
  const p = (storage.value.used / storage.value.total) * 100
  return Math.min(Math.max(p, 0), 100).toFixed(1)
})

const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const fetchStats = async () => {
  if (!props.user) return
  try {
    const res = await request('/user/storage')
    if (res && res.ok) {
      storage.value = {
        total: res.total || (1024 * 1024 * 1024 * 5),
        used: res.used || 0
      }
    }
  } catch (e) {
    console.error(e)
  }
}

const handleUserClick = () => {
  if (!props.user) {
    uni.navigateTo({ url: '/pages/auth/login' })
  } else {
    uni.showToast({ title: '个人信息编辑功能开发中', icon: 'none' })
  }
}

const navigateTo = (url: string) => {
  uni.navigateTo({ url })
}

const navigateToTags = () => {
  uni.navigateTo({
    url: '/pages/settings/tags'
  })
}

const showDevToast = () => {
  uni.showToast({ title: '功能开发中', icon: 'none' })
}

// About Animation State
const showAbout = ref(false)

const handleAboutClick = () => {
  showAbout.value = true
}

const closeAbout = () => {
  showAbout.value = false
}

onShow(() => {
  fetchStats()
})

onMounted(() => {
  fetchStats()
})
</script>

<style scoped>
.profile-view {
  min-height: 100vh;
  background-color: var(--bg-color, #f8fafc);
  padding-bottom: 120rpx;
}

.header-section {
  position: relative;
  background: linear-gradient(to bottom, var(--primary-color, #3b82f6), var(--bg-color, #f5f6f8));
  padding: calc(var(--status-bar-height) + 40rpx) 40rpx 60rpx;
  border-bottom-left-radius: 40rpx;
  border-bottom-right-radius: 40rpx;
  overflow: hidden;
  margin-bottom: 20rpx;
}

.user-card {
  display: flex;
  align-items: center;
  position: relative;
  z-index: 10;
}

.avatar-wrapper {
  position: relative;
  margin-right: 32rpx;
}

.avatar-box {
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  overflow: hidden;
  background-color: var(--text-color-secondary, #334155);
  border: 4rpx solid var(--bg-color-card, #fff);
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}

.avatar-img {
  width: 100%;
  height: 100%;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--text-color-secondary, #334155);
}

.avatar-text {
  font-size: 60rpx;
  color: #fff;
  font-weight: 600;
}

.edit-badge {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 44rpx;
  height: 44rpx;
  background-color: var(--bg-color-card, #fff);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 10rpx rgba(0,0,0,0.1);
}

.info-content {
  flex: 1;
}

.name-row {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}

.nickname {
  font-size: 48rpx;
  font-weight: 700;
  color: #fff;
  margin-right: 16rpx;
  letter-spacing: -0.5rpx;
}

.role-tag {
  background-color: rgba(255, 255, 255, 0.15);
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
  border: 1px solid rgba(255,255,255,0.1);
}

.role-tag text {
  font-size: 20rpx;
  color: var(--border-color, #e2e8f0);
  font-weight: 600;
  letter-spacing: 1rpx;
  text-transform: uppercase;
}

.email {
  font-size: 28rpx;
  color: var(--text-color-placeholder, #94a3b8);
  display: block;
  margin-top: 8rpx;
  font-weight: 400;
}

.subtitle {
  font-size: 28rpx;
  color: var(--text-color-placeholder, #94a3b8);
}

.menu-container {
  padding: 0 32rpx 40rpx;
  margin-top: -40rpx;
  position: relative;
  z-index: 20;
}

.section-group-title {
  font-size: 28rpx;
  color: var(--text-color-secondary, #64748b);
  margin: 32rpx 12rpx 16rpx;
  font-weight: 500;
}

.section-card {
  background-color: var(--bg-color-card, #fff);
  border-radius: 24rpx;
  overflow: hidden;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.02);
}

.space-card {
  padding: 32rpx;
}

.space-header {
  display: flex;
  flex-direction: column;
  margin-bottom: 32rpx;
}

.space-title-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}

.space-title {
  font-size: 32rpx;
  font-weight: 700;
  color: var(--text-color-primary, #1e293b);
}

.space-subtitle {
  font-size: 24rpx;
  color: var(--text-color-placeholder, #94a3b8);
}

.sync-badge {
  display: flex;
  align-items: center;
  background: var(--bg-color, #f0fdf4);
  padding: 4rpx 12rpx;
  border-radius: 100rpx;
  border: 1px solid var(--border-color, #dcfce7);
}

.sync-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: var(--success-color, #22c55e);
  margin-right: 8rpx;
}

.sync-badge text {
  font-size: 20rpx;
  color: var(--success-color, #16a34a);
  font-weight: 500;
}

.storage-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12rpx;
}

.storage-label {
  font-size: 26rpx;
  color: var(--text-color-secondary, #64748b);
}

.storage-value {
  font-size: 26rpx;
  color: var(--text-color-primary, #334155);
  font-weight: 600;
}

.progress-bg {
  width: 100%;
  height: 16rpx;
  background: var(--border-color, #f1f5f9);
  border-radius: 100rpx;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color, #3b82f6), rgba(var(--primary-rgb, 59, 130, 246), 0.8));
  border-radius: 100rpx;
  transition: width 0.3s ease;
}

.version-text {
  font-size: 24rpx;
  color: var(--text-color-placeholder, #94a3b8);
  background: var(--border-color, #f1f5f9);
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
}

.theme-text {
  font-size: 26rpx;
  color: var(--text-color-secondary, #64748b);
  margin-right: 8rpx;
}

:deep(.wd-cell) {
  padding: 24rpx 32rpx !important;
  background-color: var(--bg-color-card, #fff) !important;
}

:deep(.wd-cell__icon) {
  font-size: 36rpx !important;
  margin-right: 24rpx !important;
  color: var(--text-color-secondary, #64748b) !important;
}

:deep(.wd-cell__title) {
  font-size: 30rpx !important;
  color: var(--text-color-primary, #334155) !important;
}

:deep(.theme-action-sheet) {
  background-color: var(--bg-color-card) !important;
  --wot-action-sheet-bg: var(--bg-color-card);
  --wot-action-sheet-color: var(--text-color-primary);
  --wot-action-sheet-title-color: var(--text-color-primary);
  --wot-action-sheet-cancel-bg: var(--bg-color-card);
  --wot-action-sheet-cancel-color: var(--text-color-primary);
  --wot-action-sheet-active-color: var(--bg-color);
  --wot-action-sheet-disabled-color: var(--text-color-disabled);
}

:deep(.theme-action-sheet .wd-action-sheet__action) {
  background-color: var(--bg-color-card) !important;
}

:deep(.theme-action-sheet .wd-action-sheet__header) {
  background-color: var(--bg-color-card) !important;
}

/* About Animation Styles */
.about-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease;
}

.about-content {
  background: var(--bg-color-card, #fff);
  padding: 60rpx;
  border-radius: 32rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 500rpx;
  box-shadow: 0 10rpx 30rpx rgba(0,0,0,0.15);
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.logo-animate {
  margin-bottom: 32rpx;
  animation: bounce 2s infinite;
}

.app-name {
  font-size: 40rpx;
  font-weight: 700;
  color: var(--text-color-primary, #1e293b);
  margin-bottom: 12rpx;
}

.app-slogan {
  font-size: 28rpx;
  color: var(--text-color-secondary, #64748b);
  margin-bottom: 24rpx;
  letter-spacing: 2rpx;
}

.app-version {
  font-size: 24rpx;
  color: var(--text-color-placeholder, #94a3b8);
  background: var(--border-color, #f1f5f9);
  padding: 4rpx 16rpx;
  border-radius: 100rpx;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(40rpx); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10rpx); }
}
</style>
