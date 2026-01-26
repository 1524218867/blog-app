<template>
  <view class="tab-bar-wrapper">
    <view class="tab-bar">
      <view 
        v-for="(item, index) in tabs" 
        :key="index"
        class="tab-item group"
        :class="{ active: currentTab === index }"
        @click="switchTab(index)"
      >
        <view class="icon-box">
          <template v-if="item.customIcon">
            <image 
              :src="item.image" 
              style="width: 24px; height: 24px; display: block;" 
              :class="{ 'active-icon': currentTab === index }"
            />
          </template>
          <wd-icon 
            v-else
            :name="item.icon" 
            size="24px"
            :color="currentTab === index ? '#3b82f6' : '#9ca3af'"
            custom-style="display: block; transition: all 0.3s ease;"
            :custom-class="currentTab === index ? 'active-icon' : ''"
          />
        </view>
        <!-- Tooltip/Label -->
        <text class="tab-label">
          {{ item.label }}
        </text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  current?: number
}>()

const emit = defineEmits(['change'])

const currentTab = ref(props.current || 0)

const switchTab = (index: number) => {
  currentTab.value = index
  emit('change', index)
}

interface TabItem {
  label: string;
  icon: string;
  customIcon: boolean;
  image?: string;
}

const tabs: TabItem[] = [
  {
    label: '首页',
    icon: 'home',
    customIcon: true,
    image: '/static/tab-home.png'
  },
  {
    label: '文章',
    icon: 'read',
    customIcon: true,
    image: '/static/tab-article.png'
  },
  {
    label: '媒体',
    icon: 'list',
    customIcon: true,
    image: '/static/tab-media.png'
  },
  {
    label: '音乐',
    icon: 'sound', // keeping icon just in case, though customIcon takes precedence
    customIcon: true,
    image: '/static/tab-music.png'
  }
]
</script>

<style scoped>
.tab-bar-wrapper {
  position: fixed;
  bottom: calc(20px + env(safe-area-inset-bottom));
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  z-index: 100;
  pointer-events: none; /* Let clicks pass through the wrapper */
}

.tab-bar {
  pointer-events: auto; /* Re-enable clicks on the bar */
  display: flex;
  gap: 8px;
  padding: 12px 8px;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(229, 231, 235, 0.8);
  border-radius: 12px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.tab-item {
  position: relative;
  padding: 0 12px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.icon-box {
  display: flex;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.3s ease;
  color: #4b5563; /* text-gray-600 */
}

.tab-item:hover .icon-box,
.tab-item.active .icon-box {
  background-color: #eff6ff; /* bg-blue-50 */
  color: #2563eb; /* text-blue-600 */
}

:deep(.active-icon) {
  transform: scale(1.1);
}

.tab-label {
  position: absolute;
  top: -48px;
  left: 50%;
  transform: translateX(-50%) scale(0);
  transform-origin: bottom;
  padding: 6px 12px;
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease-in-out;
  opacity: 0;
  white-space: nowrap;
}

/* Triangle for tooltip */
.tab-label::before {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid white;
}

.tab-item:hover .tab-label {
  transform: translateX(-50%) scale(1);
  opacity: 1;
}

/* Mobile optimization: Show label on active instead of hover if desired, 
   but the original design was hover. I'll stick to hover/active logic. 
   On mobile, 'hover' can sometimes trigger on tap. 
   Let's make active show the label briefly or just rely on the visual state.
*/
</style>