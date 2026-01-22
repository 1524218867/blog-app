<template>
  <view class="page">
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
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { request, apiBase } from '@/utils/request'

const article = ref<any>(null)
const loading = ref(true)

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
  } catch (error) {
    console.error('Failed to fetch article:', error)
  } finally {
    loading.value = false
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
    : `${apiBase}${article.value.cover}`
})

const processedContent = computed(() => {
  if (!article.value?.content) return ''
  // Handle image paths in rich text content
  return article.value.content.replace(/src="\/uploads\//g, `src="${apiBase}/uploads/`)
})
</script>

<style scoped>
.page {
  padding: 32rpx;
  background: #ffffff;
  min-height: 100vh;
}
.loading, .error {
  text-align: center;
  padding: 40rpx;
  color: #999;
}
.header {
  margin-bottom: 32rpx;
}
.title {
  font-size: 40rpx;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 16rpx;
  line-height: 1.4;
}
.meta {
  display: flex;
  align-items: center;
  font-size: 24rpx;
  color: #94a3b8;
  gap: 16rpx;
}
.tag {
  background: #e0e7ff;
  color: #4f46e5;
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
  color: #334155;
  line-height: 1.8;
}
</style>
