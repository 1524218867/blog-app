<template>
  <view class="profile-view">
    <view class="header-section">
      <view class="user-card" @click="handleUserClick">
        <view class="avatar-box">
           <image v-if="user?.avatar" :src="user.avatar" mode="aspectFill" class="avatar-img" />
           <view v-else class="avatar-placeholder">
             <text class="avatar-text">{{ user?.email ? user.email[0].toUpperCase() : 'G' }}</text>
           </view>
        </view>
        <view class="info-content">
          <text class="nickname">{{ user?.nickname || user?.username || '点击登录' }}</text>
          <text class="email" v-if="user">{{ user.email }}</text>
          <text class="subtitle" v-else>登录以同步数据</text>
        </view>
        <wd-icon name="arrow-right" color="#9ca3af" v-if="!user" />
      </view>
    </view>

    <view class="menu-container">
      <view class="section-title">数据管理</view>
      <wd-cell-group border>
        <wd-cell title="存储空间" icon="cloud" is-link center clickable />
        <wd-cell title="备份 / 同步" icon="swap" is-link center clickable />
        <wd-cell title="导入 / 导出" icon="download" is-link center clickable />
      </wd-cell-group>

      <view class="section-title mt-4">应用设置</view>
      <wd-cell-group border>
        <wd-cell title="主题" icon="fill" is-link center clickable />
        <wd-cell title="设置" icon="setting" is-link center clickable />
        <wd-cell title="关于" icon="info-circle" is-link center clickable />
      </wd-cell-group>
      
      <view class="logout-section" v-if="user">
        <wd-button type="error" block @click="$emit('logout')">退出登录</wd-button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
const props = defineProps<{
  user: any
}>()

const emit = defineEmits(['logout'])

const handleUserClick = () => {
  if (!props.user) {
    uni.navigateTo({ url: '/pages/auth/login' })
  }
}
</script>

<style scoped>
.profile-view {
  min-height: 100vh;
  background-color: #f8f8f8;
  padding-bottom: 100px;
}

.header-section {
  background-color: #fff;
  padding: calc(var(--status-bar-height) + 20px) 20px 30px;
  border-bottom-left-radius: 24px;
  border-bottom-right-radius: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.user-card {
  display: flex;
  align-items: center;
}

.avatar-box {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  overflow: hidden;
  background-color: #eff6ff;
  border: 2px solid #fff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
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
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.avatar-text {
  font-size: 24px;
  color: #fff;
  font-weight: bold;
}

.info-content {
  flex: 1;
  margin-left: 16px;
  display: flex;
  flex-direction: column;
}

.nickname {
  font-size: 20px;
  font-weight: bold;
  color: #1f2937;
  margin-bottom: 4px;
}

.email {
  font-size: 14px;
  color: #6b7280;
}

.subtitle {
  font-size: 14px;
  color: #9ca3af;
}

.menu-container {
  padding: 20px;
}

.section-title {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
  margin-left: 4px;
  font-weight: 500;
}

.mt-4 {
  margin-top: 24px;
}

.logout-section {
  margin-top: 32px;
  padding: 0 4px;
}
</style>
