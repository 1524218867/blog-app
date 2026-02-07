import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ThemeType = 'light' | 'dark' | 'warm'

export const useThemeStore = defineStore('theme', () => {
  const currentTheme = ref<ThemeType>((uni.getStorageSync('app_theme') as ThemeType) || 'light')

  const setTheme = (theme: ThemeType) => {
    currentTheme.value = theme
    uni.setStorageSync('app_theme', theme)
    // You might need to reload or apply class here if not reactive enough, 
    // but usually binding class in App.vue or root layout works.
  }

  return {
    currentTheme,
    setTheme
  }
})
