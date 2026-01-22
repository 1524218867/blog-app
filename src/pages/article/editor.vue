<template>
  <view class="editor-container" :style="{ paddingTop: statusBarHeight + 'px' }">
    <!-- Navbar -->
    <view class="navbar">
      <view class="nav-left" @click="goBack">
        <wd-icon name="arrow-left" size="24px" color="#333"></wd-icon>
      </view>
      <view class="nav-title">{{ id ? '编辑文章' : '新建文章' }}</view>
      <view class="nav-right" @click="handleSave">
        <view class="save-btn" :class="{ disabled: !title.trim() }">完成</view>
      </view>
    </view>

    <!-- Editor Area -->
    <view class="editor-content" :style="{ backgroundColor: bgColor }">
      <input 
        class="title-input" 
        v-model="title" 
        placeholder="标题" 
        placeholder-class="placeholder"
        :style="{ backgroundColor: bgColor }"
      />
      <view class="divider"></view>
      <textarea 
        class="content-input" 
        v-model="content" 
        placeholder="开始记录..." 
        placeholder-class="placeholder"
        maxlength="-1"
        auto-height
        :style="{ fontSize: fontSize + 'px', backgroundColor: bgColor }"
      ></textarea>
    </view>

    <!-- Bottom Toolbar -->
    <view class="toolbar" :style="{ paddingBottom: safeAreaBottom + 'px', backgroundColor: bgColor }">
      <view class="toolbar-item" @click="showFontPanel = !showFontPanel; showColorPanel = false">
        <wd-icon name="text" size="20px" color="#666"></wd-icon>
        <text class="toolbar-text">字号</text>
      </view>
      <view class="toolbar-item" @click="showColorPanel = !showColorPanel; showFontPanel = false">
        <wd-icon name="fill" size="20px" color="#666"></wd-icon>
        <text class="toolbar-text">背景</text>
      </view>
    </view>

    <!-- Font Size Panel -->
    <wd-popup v-model="showFontPanel" position="bottom" custom-style="padding: 20px;">
      <view class="panel-title">字号大小</view>
      <view class="font-options">
        <view 
          v-for="size in fontSizes" 
          :key="size.value"
          class="font-option"
          :class="{ active: fontSize === size.value }"
          @click="fontSize = size.value"
        >
          <text :style="{ fontSize: size.value + 'px' }">A</text>
          <text class="font-label">{{ size.label }}</text>
        </view>
      </view>
    </wd-popup>

    <!-- Color Panel -->
    <wd-popup v-model="showColorPanel" position="bottom" custom-style="padding: 20px;">
      <view class="panel-title">背景颜色</view>
      <view class="color-options">
        <view 
          v-for="color in bgColors" 
          :key="color.value"
          class="color-option"
          :class="{ active: bgColor === color.value }"
          :style="{ backgroundColor: color.value }"
          @click="bgColor = color.value"
        >
          <wd-icon v-if="bgColor === color.value" name="check" color="#666" size="20px"></wd-icon>
        </view>
      </view>
    </wd-popup>

    <!-- Loading Mask -->
    <wd-toast id="wd-toast"></wd-toast>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { request } from '@/utils/request'
import { useToast } from 'wot-design-uni'

const statusBarHeight = uni.getSystemInfoSync().statusBarHeight || 20
const safeAreaBottom = uni.getSystemInfoSync().safeAreaInsets?.bottom || 0
const toast = useToast()

const id = ref<string | null>(null)
const title = ref('')
const content = ref('')
const loading = ref(false)

// Style Settings
const showFontPanel = ref(false)
const showColorPanel = ref(false)
const fontSize = ref(17)
const bgColor = ref('#ffffff')

const fontSizes = [
  { label: '小', value: 14 },
  { label: '标准', value: 17 },
  { label: '大', value: 20 },
  { label: '超大', value: 24 }
]

const bgColors = [
  { label: '默认', value: '#ffffff' },
  { label: '米黄', value: '#fff8ea' },
  { label: '浅绿', value: '#f0f9eb' },
  { label: '浅蓝', value: '#f0faff' },
  { label: '护眼', value: '#f5f5f5' }
]

onLoad((options: any) => {
  if (options.id) {
    id.value = options.id
    fetchDetail(options.id)
  }
})

const fetchDetail = async (articleId: string) => {
  try {
    loading.value = true
    const res: any = await request(`/articles/${articleId}`)
    title.value = res.title
    content.value = res.content || ''
  } catch (error) {
    console.error('Fetch error:', error)
    toast.error('加载失败')
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  uni.navigateBack()
}

const handleSave = async () => {
  if (!title.value.trim()) {
    toast.warning('请输入标题')
    return
  }
  if (loading.value) return

  try {
    loading.value = true
    
    // Format date as YYYY-MM-DD HH:mm:ss for MySQL
    const now = new Date()
    const pad = (n: number) => n.toString().padStart(2, '0')
    const formattedDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`

    const payload = {
      title: title.value,
      content: content.value,
      status: '已发布', // Default to published for simplicity
      date: formattedDate,
      tag: '随笔' // Default tag
    }

    if (id.value) {
      await request(`/articles/${id.value}`, 'PUT', payload)
      toast.success('更新成功')
    } else {
      await request('/articles', 'POST', payload)
      toast.success('创建成功')
    }

    // Notify list to refresh
    uni.$emit('refreshArticles')

    setTimeout(() => {
      uni.navigateBack()
    }, 1000)
  } catch (error) {
    console.error('Save error:', error)
    toast.error('保存失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.editor-container {
  min-height: 100vh;
  background-color: #fff; /* Xiaomi Note default white/yellowish, let's stick to clean white */
  display: flex;
  flex-direction: column;
}

.navbar {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background-color: #fff;
  z-index: 100;
}

.nav-title {
  font-size: 17px;
  font-weight: 500;
  color: #333;
}

.save-btn {
  color: #F0B90B; /* Xiaomi yellow-ish or primary color */
  font-size: 16px;
  font-weight: 500;
  padding: 4px 12px;
  border-radius: 4px;
}

.save-btn.disabled {
  color: #ccc;
}

.editor-content {
  flex: 1;
  padding: 20px 24px;
  padding-bottom: 80px; /* Add padding for bottom toolbar */
  display: flex;
  flex-direction: column;
  transition: background-color 0.3s;
}

.title-input {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
  height: 40px;
  line-height: 40px;
  transition: background-color 0.3s;
}

.divider {
  height: 1px;
  background-color: #f0f0f0;
  margin-bottom: 16px;
}

.content-input {
  flex: 1;
  width: 100%;
  line-height: 1.6;
  color: #333;
  min-height: 300px;
  transition: all 0.3s;
}

.placeholder {
  color: #999;
}

/* Toolbar Styles */
.toolbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: space-around;
  border-top: 1px solid #eee;
  z-index: 100;
  transition: background-color 0.3s;
}

.toolbar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4px 16px;
}

.toolbar-text {
  font-size: 10px;
  color: #666;
  margin-top: 2px;
}

/* Panel Styles */
.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 20px;
  text-align: center;
}

.font-options {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 0 20px;
}

.font-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  opacity: 0.5;
  transition: all 0.3s;
}

.font-option.active {
  opacity: 1;
  color: #333;
  font-weight: 600;
}

.font-label {
  font-size: 12px;
  color: #666;
}

.color-options {
  display: flex;
  justify-content: space-between;
  padding: 0 10px;
}

.color-option {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid #eee;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.color-option.active {
  border-color: #333;
  transform: scale(1.1);
}
</style>
