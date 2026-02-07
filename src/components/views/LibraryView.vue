<template>
  <view class="library-view">
    <!-- Top Navigation for Library Categories -->
    <view class="library-header">
      <scroll-view scroll-x class="library-tabs" :show-scrollbar="false">
        <view 
          v-for="(tab, index) in tabs" 
          :key="index"
          class="tab-item"
          :class="{ active: currentTab === index }"
          @click="currentTab = index"
        >
          <text class="tab-text">{{ tab }}</text>
          <view class="tab-line" v-if="currentTab === index"></view>
        </view>
      </scroll-view>
    </view>

    <!-- Content Area -->
    <view class="library-content">
      <view v-if="currentTab === 0" class="all-content">
        <!-- TODO: Implement aggregation of all content -->
        <view class="placeholder-container">
          <wd-icon name="app" size="48px" custom-style="color: var(--text-color-placeholder, #9ca3af)"></wd-icon>
          <text class="placeholder-text">全部内容聚合视图 (开发中)</text>
        </view>
      </view>
      
      <ArticleView 
        v-show="currentTab === 1" 
        class="view-container"
        :user="user" 
        :is-active="currentTab === 1"
        @refresh="$emit('refresh')" 
        @logout="$emit('logout')" 
      />
      
      <MediaView 
        v-show="currentTab === 2" 
        class="view-container"
        :user="user" 
        :is-active="currentTab === 2"
        @refresh="$emit('refresh')" 
        @logout="$emit('logout')" 
      />
      
      <MusicView 
        v-show="currentTab === 3" 
        class="view-container"
        :user="user" 
        :is-active="currentTab === 3"
        @refresh="$emit('refresh')" 
        @logout="$emit('logout')" 
      />
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ArticleView from './ArticleView.vue'
import MediaView from './MediaView.vue'
import MusicView from './MusicView.vue'

defineProps<{
  user: any
}>()

const emit = defineEmits(['refresh', 'logout'])

const currentTab = ref(1) // Default to Text/Article for now as 'All' is empty
const tabs = ['全部', '文本', '图片/视频', '音频']
</script>

<style scoped>
.library-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding-bottom: 100px; /* Space for bottom tab bar */
  box-sizing: border-box;
  background-color: var(--bg-color, #f8fafc);
}

.library-header {
  padding-top: var(--status-bar-height);
  background-color: var(--bg-color-card, #fff);
  z-index: 10;
  position: sticky;
  top: 0;
}

.library-tabs {
  white-space: nowrap;
  width: 100%;
  border-bottom: 1px solid var(--border-color, #f3f4f6);
}

.tab-item {
  display: inline-block;
  padding: 16px 20px;
  position: relative;
  font-size: 16px;
  color: var(--text-color-secondary, #6b7280);
  transition: all 0.3s;
}

.tab-item.active {
  color: var(--primary-color, #3b82f6);
  font-weight: 500;
}

.tab-line {
  position: absolute;
  bottom: 0;
  left: 20px;
  right: 20px;
  height: 2px;
  background-color: var(--primary-color, #3b82f6);
  border-radius: 2px;
}

.library-content {
  flex: 1;
  overflow: hidden;
  padding: 20rpx;
  display: flex;
  flex-direction: column;
}

.view-container {
  flex: 1;
  height: 0; /* Important for scroll-view to work inside flex item */
  overflow: hidden;
}

.all-content {
  padding: 40px 20px;
  text-align: center;
}

.placeholder-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: var(--text-color-placeholder, #9ca3af);
}


.placeholder-text {
  margin-top: 16px;
  font-size: 14px;
}
</style>
