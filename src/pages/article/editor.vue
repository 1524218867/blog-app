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
      <editor 
        id="editor" 
        class="content-editor" 
        placeholder="开始记录..." 
        show-img-size
        show-img-toolbar
        show-img-resize
        @ready="onEditorReady"
        @input="onEditorInput"
        :style="{ backgroundColor: bgColor }"
      ></editor>
    </view>

    <!-- Bottom Toolbar -->
    <view class="toolbar" :style="{ paddingBottom: safeAreaBottom + 'px', backgroundColor: bgColor }">
      <scroll-view scroll-x class="toolbar-scroll" :show-scrollbar="false">
        <view class="toolbar-items">
          <view class="toolbar-item" @click="format('header', 'H2')">
            <wd-icon name="text" size="20px" color="#666"></wd-icon>
          </view>
          <view class="toolbar-item" @click="format('bold')">
            <text class="icon-text" :class="{ active: formats.bold }">B</text>
          </view>
          <view class="toolbar-item" @click="format('italic')">
            <text class="icon-text" :class="{ active: formats.italic }" style="font-style: italic;">I</text>
          </view>
          <view class="toolbar-item" @click="format('list', 'ordered')">
            <wd-icon name="list" size="20px" color="#666"></wd-icon>
          </view>
          <view class="toolbar-item" @click="insertImage">
            <wd-icon name="image" size="20px" color="#666"></wd-icon>
          </view>
          <view class="toolbar-item" @click="showColorPanel = !showColorPanel">
            <wd-icon name="fill" size="20px" color="#666"></wd-icon>
          </view>
        </view>
      </scroll-view>
    </view>

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
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { request, apiBase } from '@/utils/request'

const statusBarHeight = uni.getSystemInfoSync().statusBarHeight || 20
const safeAreaBottom = uni.getSystemInfoSync().safeAreaInsets?.bottom || 0

const id = ref<string | null>(null)
const title = ref('')
const content = ref('')
const loading = ref(false)

// Style Settings
const showColorPanel = ref(false)
const bgColor = ref('#ffffff')
const formats = reactive<any>({})
let editorCtx: any = null

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

const onEditorReady = () => {
  uni.createSelectorQuery().select('#editor').context((res) => {
    editorCtx = res.context
    if (content.value) {
      editorCtx.setContents({
        html: content.value
      })
    }
  }).exec()
}

const onEditorInput = (e: any) => {
  content.value = e.detail.html
}

const format = (name: string, value?: string) => {
  if (!editorCtx) return
  editorCtx.format(name, value)
}

const onStatusChange = (e: any) => {
  const formatsData = e.detail
  Object.keys(formats).forEach(key => delete formats[key])
  Object.assign(formats, formatsData)
}

const insertImage = () => {
  uni.chooseImage({
    count: 1,
    success: async (res) => {
      const tempFilePath = res.tempFilePaths[0]
      uni.showLoading({ title: '上传中...' })
      
      try {
        await new Promise((resolve, reject) => {
          uni.uploadFile({
            url: `${apiBase}/upload/image`,
            filePath: tempFilePath,
            name: 'file',
            header: {
              Authorization: `Bearer ${uni.getStorageSync('token')}`
            },
            success: (uploadRes) => {
              const data = JSON.parse(uploadRes.data)
              if (data.ok) {
                editorCtx.insertImage({
                  src: data.url.startsWith('http') ? data.url : `${apiBase}${data.url}`,
                  alt: 'image',
                  success: () => resolve(true)
                })
              } else {
                reject(new Error(data.reason || 'Upload failed'))
              }
            },
            fail: (err) => reject(err)
          })
        })
      } catch (error) {
        console.error('Image upload error:', error)
        uni.showToast({ title: '图片上传失败', icon: 'none' })
      } finally {
        uni.hideLoading()
      }
    }
  })
}

const fetchDetail = async (articleId: string) => {
  try {
    loading.value = true
    const res: any = await request(`/articles/${articleId}`)
    title.value = res.title
    content.value = res.content || ''
    if (editorCtx) {
      editorCtx.setContents({
        html: content.value
      })
    }
  } catch (error) {
    console.error('Fetch error:', error)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  uni.navigateBack()
}

const handleSave = async () => {
  if (!title.value.trim()) {
    uni.showToast({ title: '请输入标题', icon: 'none' })
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
      uni.showToast({ title: '更新成功', icon: 'success' })
    } else {
      await request('/articles', 'POST', payload)
      uni.showToast({ title: '创建成功', icon: 'success' })
    }

    // Notify list to refresh
    uni.$emit('refreshArticles')

    setTimeout(() => {
      uni.navigateBack()
    }, 1000)
  } catch (error) {
    console.error('Save error:', error)
    uni.showToast({ title: '保存失败', icon: 'none' })
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

.content-editor {
  flex: 1;
  width: 100%;
  line-height: 1.6;
  color: #333;
  min-height: 300px;
  font-size: 17px;
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
  border-top: 1px solid #eee;
  z-index: 100;
  transition: background-color 0.3s;
}

.toolbar-scroll {
  width: 100%;
  height: 100%;
}

.toolbar-items {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 10px;
}

.toolbar-item {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 15px;
  height: 100%;
  flex-shrink: 0;
}

.icon-text {
  font-size: 18px;
  font-weight: bold;
  color: #666;
}

.icon-text.active {
  color: #3b82f6;
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
