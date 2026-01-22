<template>
  <view class="page">
    <keep-alive>
      <component 
        :is="currentViewComponent"
        :user="user" 
        @refresh="refreshMe" 
        @logout="logout" 
      />
    </keep-alive>

    <MiniPlayer />
    <FullPlayer />
    <CustomTabBar :current="currentTab" @change="handleTabChange" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { request } from '@/utils/request'
import CustomTabBar from '@/components/CustomTabBar.vue'
import MiniPlayer from '@/components/MiniPlayer.vue'
import FullPlayer from '@/components/FullPlayer.vue'
import HomeView from '@/components/views/HomeView.vue'
import ArticleView from '@/components/views/ArticleView.vue'
import MediaView from '@/components/views/MediaView.vue'
import MusicView from '@/components/views/MusicView.vue'

const currentTab = ref(0)
const viewComponents = [HomeView, ArticleView, MediaView, MusicView]

const currentViewComponent = computed(() => viewComponents[currentTab.value])

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
    user.value = null
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

onShow(() => {
  if (!token.value) {
    goLogin()
    return
  }
  refreshMe()
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