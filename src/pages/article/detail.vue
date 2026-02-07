<template>
  <view class="page" :class="themeStore.currentTheme">
    <wd-navbar
      title="文章详情"
      left-arrow
      fixed
      placeholder
      safe-area-inset-top
      @click-left="goBack"
    />
    <view v-if="loading" class="loading">加载中...</view>
    <view v-else-if="article" class="article-container">
      <view class="header">
        <view class="title">{{ article.title }}</view>
        <view class="meta">
          <text>{{ formatDate(article.publish_date || article.created_at) }}</text>
          <text class="tag" v-if="article.tag">{{ article.tag }}</text>
        </view>
      </view>
      
      <image 
        v-if="article.cover" 
        :src="fullCoverUrl" 
        mode="aspectFill" 
        class="cover-image"
      />

      <view class="content">
        <rich-text :nodes="processedContent"></rich-text>
      </view>
    </view>
    <view v-else class="error">文章不存在或已删除</view>

    <!-- Edit FAB -->
    <wd-fab 
      :draggable="true" 
      position="right-bottom" 
      direction="top"
    >
      <wd-button custom-class="fab-action-btn" type="primary" round @click="goEditor">
        <wd-icon name="edit" size="22px"></wd-icon>
      </wd-button>
    </wd-fab>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { request, apiBase, hostBase, reportHistory } from '@/utils/request'
import { useThemeStore } from '@/store/theme'

const themeStore = useThemeStore()
const article = ref<any>(null)
const loading = ref(true)

const goBack = () => {
  uni.navigateBack()
}

onLoad((options) => {
  if (options && options.id) {
    fetchArticle(options.id)
  }
})

const fetchArticle = async (id: string) => {
  try {
    loading.value = true
    const data = await request(`/articles/${id}`)
    article.value = data
    
    // 记录访问历史 (阅读文章通常标记为已读/未读，这里简单处理为打开即记录)
    // 可以进一步优化：监听滚动到底部才算 isFinished=true
    reportHistory('article', id, 0, false)
  } catch (error) {
    console.error('Failed to fetch article:', error)
  } finally {
    loading.value = false
  }
}

const goEditor = () => {
  if (article.value?.id) {
    uni.navigateTo({
      url: `/pages/article/editor?id=${article.value.id}`
    })
  }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  return new Date(dateStr).toISOString().split('T')[0]
}

const fullCoverUrl = computed(() => {
  if (!article.value?.cover) return ''
  return article.value.cover.startsWith('http') 
    ? article.value.cover 
    : `${hostBase}${article.value.cover}`
})

const processedContent = computed(() => {
  if (!article.value?.content) return ''
  // Handle image paths in rich text content
  return article.value.content.replace(/src="\/uploads\//g, `src="${hostBase}/uploads/`)
})
</script>

<style lang="scss" scoped>
:deep(.wd-navbar) {
  background-color: var(--bg-color) !important;
  --wot-navbar-bg: var(--bg-color);
  --wot-navbar-title-color: var(--text-color-primary);
  --wot-navbar-icon-color: var(--text-color-primary);
  --wot-navbar-side-color: var(--text-color-primary);
}

:deep(.wd-navbar__content) {
  background-color: var(--bg-color) !important;
}

:deep(.wd-navbar__title) {
  color: var(--text-color-primary) !important;
}

:deep(.wd-navbar__left) {
  color: var(--text-color-primary) !important;
}

:deep(.wd-navbar__right) {
  color: var(--text-color-primary) !important;
}

:deep(.wd-navbar__icon) {
  color: var(--text-color-primary) !important;
}

:deep(.wd-icon) {
  color: var(--text-color-primary) !important;
}

:deep(.wd-navbar__text) {
  color: var(--text-color-primary) !important;
}

:deep(.wd-navbar::after) {
  background-color: var(--border-color) !important;
}

.page {
  padding: 32rpx;
  background: var(--bg-color, #ffffff);
  min-height: 100vh;
}
.loading, .error {
  text-align: center;
  padding: 40rpx;
  color: var(--text-color-secondary, #999);
}
.header {
  margin-bottom: 32rpx;
}
.title {
  font-size: 40rpx;
  font-weight: 700;
  color: var(--text-color-primary, #1a1a1a);
  margin-bottom: 16rpx;
  line-height: 1.4;
}
.meta {
  display: flex;
  align-items: center;
  font-size: 24rpx;
  color: var(--text-color-secondary, #94a3b8);
  gap: 16rpx;
}
.tag {
  background: rgba(var(--primary-rgb, 79, 70, 229), 0.1);
  color: var(--primary-color, #4f46e5);
  padding: 2rpx 10rpx;
  border-radius: 6rpx;
}
.cover-image {
  width: 100%;
  height: 400rpx;
  border-radius: 16rpx;
  margin-bottom: 32rpx;
}
.content {
  font-size: 30rpx;
  color: var(--text-color-primary, #334155);
  line-height: 1.8;
}

:deep(.fab-action-btn) {
  min-width: auto !important;
  box-sizing: border-box;
  width: 48px !important;
  height: 48px !important;
  border-radius: 24px !important;
  margin: 0 !important;
  padding: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}
</style>
