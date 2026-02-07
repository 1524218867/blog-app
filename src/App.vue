<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
import { useThemeStore } from '@/store/theme';
import { watchEffect } from 'vue';

onLaunch(() => {
  console.log("App Launch");
  // #ifdef APP-PLUS
  plus.navigator.closeSplashscreen();
  // #endif
  
  // Initialize theme
  const themeStore = useThemeStore();
  
  // Watch theme changes to update body attribute
  // #ifdef H5
  watchEffect(() => {
    const theme = themeStore.currentTheme
    // Set attribute on document element for CSS variables
    document.documentElement.setAttribute('data-theme', theme)
    
    // Force update background color on 'uni-page-body' or specific root elements if needed
    // UniApp H5 structure: html > body > uni-app > uni-page > uni-page-wrapper > uni-page-body
    // The 'page' selector in style usually targets uni-page-body.
    // Sometimes explicit class toggle helps trigger repaint or override default styles.
    const pageBody = document.querySelector('uni-page-body')
    if (pageBody) {
      pageBody.setAttribute('data-theme', theme)
    }
  })
  // #endif

  // #ifdef APP-PLUS || MP-WEIXIN
  // Since we can't easily access the root document in App/MiniProgram,
  // we rely on global classes applied to 'page' or equivalent.
  // UniApp's 'page' selector in global style usually works for background color.
  // But for dynamic variables, we might need to inject styles or use a root class.
  // A simple hack for App/MiniProgram is to apply the class to the Vue app root component if possible,
  // but 'page' is outside of Vue's root in MP.
  
  // However, we can use a trick: apply the theme class to the 'page' element via JS if supported (App yes, MP limited).
  // Or, we update the tab bar and nav bar colors manually here.
  watchEffect(() => {
    const theme = themeStore.currentTheme
    let bgColor = '#f5f6f8'
    let textColor = '#000000'
    let tabBg = '#ffffff'
    
    if (theme === 'dark') {
      bgColor = '#0f172a'
      textColor = '#ffffff'
      tabBg = '#1e293b'
    } else if (theme === 'warm') {
      bgColor = '#fdfbf7'
      textColor = '#4a4238'
      tabBg = '#fffefb'
    }
    
    // Set Tab Bar Style
    uni.setTabBarStyle({
      backgroundColor: tabBg,
      color: theme === 'dark' ? '#94a3b8' : '#64748b',
      selectedColor: theme === 'warm' ? '#d97706' : (theme === 'dark' ? '#60a5fa' : '#3b82f6'),
      borderStyle: theme === 'dark' ? 'black' : 'white'
    })
    
    // Set Navigation Bar Color (if not custom)
    uni.setNavigationBarColor({
      frontColor: theme === 'dark' ? '#ffffff' : '#000000',
      backgroundColor: tabBg
    })
    
    // Attempt to set window background color (works in some envs)
    uni.setBackgroundColor({
      backgroundColor: bgColor,
      backgroundColorTop: bgColor,
      backgroundColorBottom: bgColor
    })
  })
  // #endif
});
onShow(() => {
  console.log("App Show");
});
onHide(() => {
  console.log("App Hide");
});
</script>
<style lang="scss">
/* @import "wot-design-uni/components/wd-icon/index.scss"; */

/* Theme Definitions */
:root, page {
  /* Default (Light) */
  --bg-color: #f5f6f8;
  --bg-color-card: #ffffff;
  --bg-color-card-rgb: 255, 255, 255;
  --text-color-primary: #1e293b;
  --text-color-primary-rgb: 30, 41, 59;
  --text-color-secondary: #64748b;
  --text-color-placeholder: #94a3b8;
  --text-color-disabled: #cbd5e1;
  --border-color: #e2e8f0;
  --primary-color: #3b82f6;
  --primary-rgb: 59, 130, 246;
  --success-color: #10b981;
  --success-rgb: 16, 185, 129;
  --warning-color: #f97316;
  --warning-rgb: 249, 115, 22;
  --danger-color: #ef4444;
  --danger-rgb: 239, 68, 68;
  --purple-color: #8b5cf6;
  --purple-rgb: 139, 92, 246;
  --tab-bar-bg: #ffffff;
  
  /* Wot Design Component Variables */
  --wot-switch-on-color: var(--primary-color);
  --wot-switch-off-color: var(--text-color-disabled);
}

/* Dark Theme */
[data-theme='dark'], .dark {
  --bg-color: #0f172a;
  --bg-color-card: #1e293b;
  --bg-color-card-rgb: 30, 41, 59;
  --text-color-primary: #f1f5f9;
  --text-color-primary-rgb: 241, 245, 249;
  --text-color-secondary: #94a3b8;
  --text-color-placeholder: #475569;
  --text-color-disabled: #334155;
  --border-color: #334155;
  --primary-color: #60a5fa;
  --primary-rgb: 96, 165, 250;
  --success-color: #34d399;
  --success-rgb: 52, 211, 153;
  --warning-color: #fb923c;
  --warning-rgb: 251, 146, 60;
  --danger-color: #f87171;
  --danger-rgb: 248, 113, 113;
  --purple-color: #a78bfa;
  --purple-rgb: 167, 139, 250;
  --tab-bar-bg: #1e293b;

  /* Wot Design Component Variables Override for Dark */
  --wot-switch-on-color: var(--primary-color);
  --wot-switch-off-color: var(--text-color-disabled);
}

/* Warm Theme */
[data-theme='warm'], .warm {
  --bg-color: #fdfbf7;
  --bg-color-card: #fffefb;
  --bg-color-card-rgb: 255, 254, 251;
  --text-color-primary: #4a4238;
  --text-color-primary-rgb: 74, 66, 56;
  --text-color-secondary: #8c8172;
  --text-color-placeholder: #b5aba0;
  --text-color-disabled: #d6d3ce;
  --border-color: #efebe4;
  --primary-color: #d97706; /* Warm Orange/Amber */
  --primary-rgb: 217, 119, 6;
  --success-color: #059669;
  --success-rgb: 5, 150, 105;
  --warning-color: #d97706;
  --warning-rgb: 217, 119, 6;
  --danger-color: #dc2626;
  --danger-rgb: 220, 38, 38;
  --purple-color: #7c3aed;
  --purple-rgb: 124, 58, 237;
  --tab-bar-bg: #fffefb;

  /* Wot Design Component Variables Override for Warm */
  --wot-switch-on-color: var(--primary-color);
  --wot-switch-off-color: var(--text-color-disabled);
}

/* Light Theme */
[data-theme='light'], .light {
  --bg-color: #f5f6f8;
  --bg-color-card: #ffffff;
  --text-color-primary: #1e293b;
  --text-color-primary-rgb: 30, 41, 59;
  --text-color-secondary: #64748b;
  --text-color-placeholder: #94a3b8;
  --text-color-disabled: #cbd5e1;
  --border-color: #e2e8f0;
  --primary-color: #3b82f6;
  --primary-rgb: 59, 130, 246;
  --success-color: #10b981;
  --success-rgb: 16, 185, 129;
  --warning-color: #f97316;
  --warning-rgb: 249, 115, 22;
  --danger-color: #ef4444;
  --danger-rgb: 239, 68, 68;
  --purple-color: #8b5cf6;
  --purple-rgb: 139, 92, 246;
  --tab-bar-bg: #ffffff;
}

page {
  height: 100%;
  background-color: var(--bg-color);
  color: var(--text-color-primary);
  overscroll-behavior-y: none;
  transition: background-color 0.3s, color 0.3s;
}

/* Global Overrides for Wot Design Components */
/* Force wd-switch to use CSS variables for dynamic theming */
.wd-switch.is-checked {
  background: var(--wot-switch-on-color, var(--primary-color)) !important;
  border-color: var(--wot-switch-on-color, var(--primary-color)) !important;
}

.wd-switch {
  background: var(--wot-switch-off-color, var(--text-color-disabled)) !important;
}
</style>
