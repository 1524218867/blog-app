<template>
  <view class="tags-page" :class="currentTheme" :data-theme="currentTheme">
    <wd-navbar 
      title="标签管理" 
      left-text="返回" 
      left-arrow 
      @click-left="goBack" 
      fixed 
      placeholder 
    />

    <wd-tabs 
      v-model="currentTab" 
      @change="handleTabChange"
    >
      <wd-tab title="音乐" name="audio" />
      <wd-tab title="文章" name="article" />
      <wd-tab title="媒体" name="media" />
    </wd-tabs>

    <view class="content">
      <view v-if="tags.length === 0" class="empty-state">
        <wd-icon name="list" size="48px" custom-style="color: var(--text-color-placeholder, #cbd5e1)" />
        <text class="empty-text">暂无标签，点击下方按钮添加</text>
      </view>

      <view v-else class="tag-list">
        <wd-swipe-action v-for="tag in tags" :key="tag.id">
          <wd-cell :title="tag.name" center custom-class="tag-cell">
             <template #icon>
               <wd-icon name="tag" size="20px" custom-style="color: var(--primary-color, #3b5bdb); margin-right: 12px;" />
             </template>
             <template #value>
                <view class="cell-actions">
                  <wd-icon name="edit" size="20px" custom-style="color: var(--text-color-secondary, #64748b)" @click.stop="handleEdit(tag)" />
                </view>
             </template>
          </wd-cell>
          <template #right>
            <view class="action-btn delete" @click="handleDelete(tag)">删除</view>
          </template>
        </wd-swipe-action>
      </view>
    </view>

    <view class="footer-action">
      <wd-button type="primary" block size="large" @click="handleAdd">新建标签</wd-button>
    </view>

    <!-- Custom Add/Edit Popup -->
    <wd-popup v-model="showEditPopup" position="center" :z-index="10000" :custom-class="currentTheme" custom-style="width: 80%; border-radius: 16rpx; overflow: hidden; background: var(--bg-color-card, #fff);">
      <view class="dialog-container">
        <view class="dialog-header">
          <text class="dialog-title">{{ isEditing ? '修改标签' : '新建标签' }}</text>
        </view>
        <view class="dialog-content">
          <input 
            class="dialog-input" 
            v-model="editingTagName" 
            placeholder="请输入标签名称" 
            :focus="showEditPopup"
          />
        </view>
        <view class="dialog-footer">
          <view class="dialog-btn cancel" @click="showEditPopup = false">取消</view>
          <view class="dialog-btn confirm" @click="confirmEdit">确定</view>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { request } from '@/utils/request'
import { useThemeStore } from '@/store/theme'

interface Tag {
  id: number
  name: string
}

const themeStore = useThemeStore()
const { currentTheme } = storeToRefs(themeStore)
const tags = ref<Tag[]>([])
const currentTab = ref('audio')

// Edit Popup State
const showEditPopup = ref(false)
const isEditing = ref(false)
const editingTagName = ref('')
const currentEditingTag = ref<Tag | null>(null)

onMounted(() => {
  fetchTags()
})

const goBack = () => {
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
  } else {
    // If opened directly or no history, go to home or profile
    uni.reLaunch({ url: '/pages/index/index' })
  }
}

const handleTabChange = ({ name }: { name: string }) => {
  currentTab.value = name
  fetchTags()
}

const fetchTags = async () => {
  try {
    const res = await request(`/tags?type=${currentTab.value}`)
    if (res.ok) {
      tags.value = res.list
    }
  } catch (e) {
    console.error(e)
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

const handleAdd = () => {
  isEditing.value = false
  editingTagName.value = ''
  currentEditingTag.value = null
  showEditPopup.value = true
}

const handleEdit = (tag: Tag) => {
  isEditing.value = true
  editingTagName.value = tag.name
  currentEditingTag.value = tag
  showEditPopup.value = true
}

const confirmEdit = async () => {
  const name = editingTagName.value.trim()
  if (!name) {
    uni.showToast({ title: '请输入标签名称', icon: 'none' })
    return
  }

  try {
    if (isEditing.value && currentEditingTag.value) {
      // Update
      if (name === currentEditingTag.value.name) {
        showEditPopup.value = false
        return
      }
      
      const apiRes = await request(`/tags/${currentEditingTag.value.id}`, 'PUT', { name })
      if (apiRes.ok) {
        uni.showToast({ title: '修改成功', icon: 'success' })
        fetchTags()
        showEditPopup.value = false
      } else {
        uni.showToast({ title: '修改失败', icon: 'none' })
      }
    } else {
      // Create
      const apiRes = await request('/tags', 'POST', { 
        name,
        type: currentTab.value
      })
      if (apiRes.ok) {
        uni.showToast({ title: '添加成功', icon: 'success' })
        fetchTags()
        showEditPopup.value = false
      } else if (apiRes.reason === 'tag_exists') {
        uni.showToast({ title: '标签已存在', icon: 'none' })
      } else {
        uni.showToast({ title: '添加失败', icon: 'none' })
      }
    }
  } catch (e) {
    uni.showToast({ title: '操作失败', icon: 'none' })
  }
}

const handleDelete = (tag: Tag) => {
  uni.showModal({
    title: '确认删除',
    content: `确定要删除标签 "${tag.name}" 吗？此操作不会删除已关联的内容，但会移除标签关联。`,
    success: async (res) => {
      if (res.confirm) {
        try {
          const apiRes = await request(`/tags/${tag.id}`, 'DELETE')
          if (apiRes.ok) {
            uni.showToast({ title: '删除成功', icon: 'success' })
            fetchTags()
          } else {
            uni.showToast({ title: '删除失败', icon: 'none' })
          }
        } catch (e) {
          uni.showToast({ title: '删除失败', icon: 'none' })
        }
      }
    }
  })
}
</script>

<style lang="scss">
/* Force local definition of theme variables to ensure they are available */
[data-theme='dark'], .dark {
  --bg-color: #0f172a;
  --bg-color-card: #1e293b;
  --text-color-primary: #f1f5f9;
  --text-color-secondary: #94a3b8;
  --text-color-placeholder: #475569;
  --border-color: #334155;
  --primary-color: #60a5fa;
  --danger-color: #f87171;
}

[data-theme='warm'], .warm {
  --bg-color: #fdfbf7;
  --bg-color-card: #fffefb;
  --text-color-primary: #4a4238;
  --text-color-secondary: #8c8172;
  --text-color-placeholder: #b5aba0;
  --border-color: #efebe4;
  --primary-color: #d97706;
  --danger-color: #dc2626;
}

.tag-cell {
  background: var(--bg-color-card, #fff);
  --wot-cell-bg: var(--bg-color-card, #fff);
  --wot-cell-title-color: var(--text-color-primary, #1e293b);
  --wot-cell-value-color: var(--text-color-secondary, #64748b);
  --wot-cell-label-color: var(--text-color-secondary, #94a3b8);
  --wot-cell-border-color: var(--border-color, #e2e8f0);
}
</style>

<style lang="scss" scoped>
:deep(.wd-navbar) {
  background-color: var(--bg-color-card) !important;
  --wot-navbar-bg: var(--bg-color-card);
  --wot-navbar-title-color: var(--text-color-primary);
  --wot-navbar-icon-color: var(--text-color-primary);
  --wot-navbar-side-color: var(--text-color-primary);
}

:deep(.wd-navbar__content) {
  background-color: var(--bg-color-card) !important;
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

:deep(.wd-tabs) {
  background: transparent !important;
}

:deep(.wd-tabs__nav) {
  background-color: var(--bg-color-card) !important;
}

:deep(.wd-tabs__nav-item) {
  color: var(--text-color-secondary) !important;
  &.is-active {
    color: var(--primary-color) !important;
    font-weight: bold;
  }
}

:deep(.wd-tabs__line) {
  background-color: var(--primary-color) !important;
}

.tags-page {
  min-height: 100vh;
  background-color: var(--bg-color, #f8fafc);
  padding-bottom: 120rpx;
  /* Ensure text color is set on root */
  color: var(--text-color-primary, #1e293b);
}

:deep(.wd-cell) {
  background-color: var(--bg-color-card) !important;
}

:deep(.wd-cell__wrapper) {
  background-color: var(--bg-color-card) !important;
}

:deep(.wd-cell__title) {
  color: var(--text-color-primary) !important;
}

:deep(.wd-cell__value) {
  color: var(--text-color-secondary) !important;
}

:deep(.wd-cell__label) {
  color: var(--text-color-secondary) !important;
}

.content {
  padding: 24rpx;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 0;
  
  .empty-text {
    margin-top: 24rpx;
    color: var(--text-color-placeholder, #94a3b8);
    font-size: 28rpx;
  }
}

.tag-list {
  border-radius: 16rpx;
  overflow: hidden;
  background: var(--bg-color-card, #fff);
}

.cell-actions {
  display: flex;
  align-items: center;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 0 32rpx;
  font-size: 28rpx;
  color: #fff;
  
  &.delete {
    background-color: var(--danger-color, #ef4444);
  }
}

.footer-action {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24rpx;
  background: var(--bg-color-card, #fff);
  box-shadow: 0 -2rpx 10rpx rgba(0,0,0,0.05);
  z-index: 10;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
}

.dialog-container {
  background: var(--bg-color-card, #fff);
}

.dialog-header {
  padding: 32rpx;
  text-align: center;
  border-bottom: 1px solid var(--border-color, #f1f5f9);
}

.dialog-title {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--text-color-primary, #1e293b);
}

.dialog-content {
  padding: 40rpx;
}

.dialog-input {
  width: 100%;
  height: 88rpx;
  background: var(--bg-color, #f1f5f9);
  border-radius: 16rpx;
  padding: 0 32rpx;
  font-size: 28rpx;
  color: var(--text-color-primary, #333);
  box-sizing: border-box;
}

.dialog-footer {
  display: flex;
  padding: 0 40rpx 40rpx;
  gap: 24rpx;
}

.dialog-btn {
  flex: 1;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16rpx;
  font-size: 28rpx;
  font-weight: 600;
  
  &.cancel {
    background: var(--bg-color, #f1f5f9);
    color: var(--text-color-secondary, #64748b);
  }
  
  &.confirm {
    background: var(--primary-color, #3b82f6);
    color: #fff;
  }
}
</style>
