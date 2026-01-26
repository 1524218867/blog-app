<template>
  <view class="page login-page">
    <!-- 顶部 Logo 区域 -->
    <view class="header-section">
      <image class="logo" src="/static/logo.png" mode="aspectFit" />
      <text class="app-name">Blog Studio</text>
    </view>

    <!-- 欢迎语区域 -->
    <view class="welcome-section">
      <text class="title">{{ mode === 'login' ? '欢迎回来' : '创建账号' }}</text>
      <text class="subtitle">
        {{ mode === 'login' ? '登录您的账号以继续' : '注册账号开始您的旅程' }}
      </text>
    </view>
    
    <!-- 表单区域 -->
    <view class="form-section">
      <!-- 邮箱输入 -->
      <view class="input-group">
        <view class="input-wrapper" :class="{ 'is-focus': emailFocused }">
          <wd-icon name="mail" size="20px" custom-class="input-icon" :color="emailFocused ? '#0f172a' : '#94a3b8'" />
          <input 
            class="real-input"
            v-model="email" 
            placeholder="请输入邮箱地址" 
            placeholder-class="input-placeholder"
            @focus="emailFocused = true"
            @blur="emailFocused = false"
          />
        </view>
      </view>
      
      <!-- 密码输入 -->
      <view class="input-group">
        <view class="input-wrapper" :class="{ 'is-focus': passwordFocused }">
          <wd-icon name="lock-on" size="20px" custom-class="input-icon" :color="passwordFocused ? '#0f172a' : '#94a3b8'" />
          <input 
            class="real-input"
            v-model="password" 
            type="password" 
            placeholder="请输入密码" 
            placeholder-class="input-placeholder"
            @focus="passwordFocused = true"
            @blur="passwordFocused = false"
          />
        </view>
      </view>

      <!-- 辅助选项 -->
      <view class="action-row" v-if="mode === 'login'">
        <view class="remember-me" @click="rememberMe = !rememberMe">
          <wd-icon :name="rememberMe ? 'check-circle-filled' : 'circle'" size="18px" :color="rememberMe ? '#0f172a' : '#94a3b8'" />
          <text class="remember-text">记住我</text>
        </view>
        <text class="forgot-text">忘记密码？</text>
      </view>

      <!-- 提交按钮 -->
      <view class="submit-section">
        <button 
          class="custom-button" 
          :loading="loading" 
          @click="handleSubmit"
          hover-class="button-hover"
        >
          {{ mode === 'login' ? '登录' : '注册' }}
        </button>
      </view>
    </view>

    <!-- 底部切换 -->
    <view class="footer-section">
      <text class="footer-text">{{ mode === 'login' ? '还没有账号？' : '已有账号？' }}</text>
      <text class="link-text" @click="toggleMode">
        {{ mode === 'login' ? '立即注册' : '立即登录' }}
      </text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow, onLoad } from '@dcloudio/uni-app'
import { request } from '@/utils/request'

const mode = ref<'login' | 'register'>('login')
const email = ref('')
const password = ref('')
const rememberMe = ref(true)
const emailFocused = ref(false)
const passwordFocused = ref(false)
const loading = ref(false)
const token = ref(uni.getStorageSync('token') || '')

const showToast = (title: string, icon: 'success' | 'none' = 'none') => {
  uni.showToast({
    title,
    icon,
    mask: true,
    duration: 2000
  })
}

const toggleMode = () => {
  mode.value = mode.value === 'login' ? 'register' : 'login'
  // 重置表单状态但保留邮箱（如果是切换去注册）
  password.value = ''
}

const handleSubmit = async () => {
  if (!email.value || !password.value) {
    showToast('请填写完整信息')
    return
  }
  loading.value = true
  try {
    if (mode.value === 'register') {
      await request('/auth/register', 'POST', {
        email: email.value,
        password: password.value
      })
      showToast('注册成功，请登录', 'success')
      mode.value = 'login'
    } else {
      const data = await request('/auth/login', 'POST', {
        email: email.value,
        password: password.value
      })
      token.value = data.token
      uni.setStorageSync('token', token.value)
      
      if (rememberMe.value) {
        uni.setStorageSync('rememberMe', 'true')
      } else {
        uni.removeStorageSync('rememberMe')
      }
      
      showToast('登录成功', 'success')
      
      setTimeout(() => {
        uni.redirectTo({ url: '/pages/index/index' })
      }, 500)
    }
  } catch (e) {
    showToast('操作失败，请检查账号密码')
  } finally {
    loading.value = false
  }
}



onShow(() => {
  // Logic on show
})
</script>

<style>
/* 页面基础 */
page {
  height: 100%;
  background: linear-gradient(135deg, #eef2ff 0%, #ffffff 100%);
}

.login-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0 60rpx;
  background: transparent;
  box-sizing: border-box;
}

/* 顶部 Logo */
.header-section {
  margin-top: 120rpx;
  display: flex;
  align-items: center;
  margin-bottom: 60rpx;
}

.logo {
  width: 64rpx;
  height: 64rpx;
  margin-right: 24rpx;
}

.app-name {
  font-size: 36rpx;
  font-weight: 600;
  color: #0f172a;
  letter-spacing: -0.5px;
}

/* 欢迎语 */
.welcome-section {
  margin-bottom: 80rpx;
}

.title {
  display: block;
  font-size: 56rpx;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 16rpx;
  line-height: 1.2;
}

.subtitle {
  font-size: 30rpx;
  color: #64748b;
  font-weight: 400;
}

/* 表单 */
.form-section {
  width: 100%;
}

.input-group {
  margin-bottom: 40rpx;
}

.input-wrapper {
  background-color: #f8fafc;
  border-radius: 32rpx;
  height: 112rpx;
  padding: 0 32rpx;
  display: flex;
  align-items: center;
  border: 2rpx solid transparent;
  transition: all 0.3s ease;
}

.input-wrapper.is-focus {
  background-color: #ffffff;
  border-color: #0f172a;
  box-shadow: 0 8rpx 24rpx rgba(15, 23, 42, 0.05);
}

/* 使用 :deep 穿透组件样式（如果需要）或者直接控制 wd-icon 的外部类 */
:deep(.input-icon) {
  margin-right: 24rpx;
  display: flex;
  align-items: center;
}

.real-input {
  flex: 1;
  height: 100%;
  font-size: 32rpx;
  color: #0f172a;
}

.input-placeholder {
  color: #94a3b8;
}

.action-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: -16rpx;
  margin-bottom: 48rpx;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.remember-text {
  font-size: 28rpx;
  color: #64748b;
}

.forgot-text {
  font-size: 28rpx;
  color: #3b5bdb;
  font-weight: 500;
}

/* 按钮 */
.submit-section {
  margin-top: 20rpx;
}

.custom-button {
  background: #0f172a;
  color: #ffffff;
  height: 112rpx;
  border-radius: 32rpx;
  font-size: 34rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  box-shadow: 0 12rpx 36rpx rgba(15, 23, 42, 0.2);
  transition: all 0.2s;
}

.button-hover {
  transform: scale(0.98);
  opacity: 0.9;
}

/* 底部切换 */
.footer-section {
  margin-top: auto;
  margin-bottom: 80rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12rpx;
}

.footer-text {
  font-size: 28rpx;
  color: #64748b;
}

.link-text {
  font-size: 28rpx;
  color: #0f172a;
  font-weight: 700;
}
</style>