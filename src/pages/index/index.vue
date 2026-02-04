<template>
  <view class="page" v-if="isReady">
    <HomeView 
      v-show="currentTab === 0"
      :user="user" 
      @refresh="refreshMe" 
      @logout="logout" 
    />
    <LibraryView 
      v-show="currentTab === 1"
      :user="user" 
      @refresh="refreshMe" 
      @logout="logout" 
    />
    <ProfileView 
      v-show="currentTab === 2"
      :user="user" 
      @refresh="refreshMe" 
      @logout="logout" 
    />

    <MiniPlayer />
    <FullPlayer />
    <CustomTabBar :current="currentTab" @change="handleTabChange" />
    <UpdatePopup />
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow, onLoad } from '@dcloudio/uni-app'
import { request } from '@/utils/request'
import CustomTabBar from '@/components/CustomTabBar.vue'
import MiniPlayer from '@/components/MiniPlayer.vue'
import FullPlayer from '@/components/FullPlayer.vue'
import UpdatePopup from '@/components/UpdatePopup.vue'
import HomeView from '@/components/views/HomeView.vue'
import LibraryView from '@/components/views/LibraryView.vue'
import ProfileView from '@/components/views/ProfileView.vue'

const currentTab = ref(0)
const isReady = ref(false)

const handleTabChange = (index: number) => {
  currentTab.value = index
}

const token = ref(uni.getStorageSync('token') || '')
const user = ref<{ email: string; role: string } | null>(null)

const refreshMe = async () => {
  if (!token.value) {
    user.value = null
    return
  }
  try {
    const data = await request('/auth/me', 'GET')
    user.value = data.user
  } catch {
    // Token 失效或网络错误
    // 这里可以选择不强制登出，只在需要时处理
  }
}

const goLogin = () => {
  uni.redirectTo({ url: '/pages/auth/login' })
}

const logout = () => {
  token.value = ''
  user.value = null
  uni.removeStorageSync('token')
  uni.showToast({
    title: '已退出登录',
    icon: 'none'
  })
  goLogin()
}

const checkAuth = () => {
  const storedToken = uni.getStorageSync('token')
  if (!storedToken) {
    goLogin()
  } else {
    token.value = storedToken
    isReady.value = true
    refreshMe()
  }
}

onLoad(() => {
  checkAuth()
})

onShow(() => {
  const storedToken = uni.getStorageSync('token')
  if (!storedToken) {
    goLogin()
  } else if (isReady.value) {
     // 如果已经 Ready 且有 Token，可以在这里做静默刷新或其他检查
     // 但没必要每次都阻塞
  }
})
</script>

<style>
.page {
  min-height: 100%;
  padding: calc(var(--status-bar-height) + 32rpx) 24rpx calc(200rpx + env(safe-area-inset-bottom));
  background: #f5f6f8;
  box-sizing: border-box;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>