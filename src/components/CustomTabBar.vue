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
            <!-- Home (Index 0) -->
            <svg 
              v-if="index === 0"
              viewBox="0 0 1024 1024" 
              version="1.1" 
              xmlns="http://www.w3.org/2000/svg" 
              width="24px" 
              height="24px"
              :style="{ display: 'block', transition: 'all 0.3s ease' }"
              :class="{ 'active-icon': currentTab === index }"
            >
              <path d="M960.856566 463.515152L586.294949 88.824242c-20.428283-20.428283-47.450505-31.547475-76.282828-31.547474s-55.854545 11.248485-76.282828 31.547474L63.046465 459.636364c-9.050505 9.050505-9.050505 23.789899 0 32.969697 9.050505 9.050505 23.789899 9.050505 32.969697 0l38.141414-38.141415v369.519192c0 38.141414 14.610101 73.955556 41.115151 100.848485 26.634343 27.022222 62.319192 42.020202 100.460606 42.020202h469.333334c79.127273 0 143.515152-64.129293 143.515151-142.868687V456.921212l39.434344 39.434344c4.525253 4.525253 10.472727 6.852525 16.420202 6.852525s11.894949-2.327273 16.420202-6.852525c9.179798-9.050505 9.179798-23.789899 0-32.840404zM621.20404 920.177778h-218.50505v-250.828283c0-9.309091 7.49899-16.808081 16.808081-16.808081h184.888889c9.309091 0 16.808081 7.49899 16.80808 16.808081v250.828283z m220.832324-96.323233c0 53.139394-43.442424 96.323232-96.969697 96.323233h-77.317172v-250.828283c0-34.909091-28.444444-63.353535-63.353535-63.353535h-184.888889c-34.909091 0-63.353535 28.444444-63.353536 63.353535v250.828283h-80.549495c-52.363636 0-95.030303-43.183838-95.030303-96.323233v-415.030303H179.668687l287.030303-287.030303c11.636364-11.636364 27.022222-17.971717 43.313131-17.971717s31.806061 6.335354 43.313132 17.971717l288.581818 288.581819v413.478787z" 
                :fill="currentTab === index ? '#3b82f6' : '#9ca3af'" 
              />
            </svg>

            <!-- Article (Index 1) -->
            <svg 
              v-else-if="index === 1"
              viewBox="0 0 1024 1024" 
              version="1.1" 
              xmlns="http://www.w3.org/2000/svg" 
              width="24px" 
              height="24px"
              :style="{ display: 'block', transition: 'all 0.3s ease' }"
              :class="{ 'active-icon': currentTab === index }"
            >
              <path d="M778.113 95.01 250.999 95.01c-72.675 0-131.777 58.102-131.777 129.495l0 597.604c0 71.39 59.102 129.495 131.777 129.495l527.114 0c72.65 0 131.78-58.105 131.78-129.495L909.893 224.504C909.893 153.112 850.763 95.01 778.113 95.01zM849.053 822.108c0 38.45-31.815 69.72-70.94 69.72L250.999 891.828c-39.12 0-70.97-31.27-70.97-69.72L180.029 224.504c0-38.445 31.85-69.717 70.97-69.717l527.114 0c39.125 0 70.94 31.272 70.94 69.717L849.053 822.108zM299.579 356.509l227.234 0c16.795 0 30.405-13.385 30.405-29.857 0-16.535-13.61-29.887-30.405-29.887L299.579 296.765c-16.792 0-30.402 13.352-30.402 29.887C269.177 343.124 282.789 356.509 299.579 356.509zM729.533 493.434 299.579 493.434c-16.792 0-30.402 13.385-30.402 29.89s13.61 29.885 30.402 29.885l429.954 0c16.795 0 30.44-13.38 30.44-29.885S746.328 493.434 729.533 493.434zM729.533 690.103 299.579 690.103c-16.792 0-30.402 13.39-30.402 29.89 0 16.505 13.61 29.89 30.402 29.89l429.954 0c16.795 0 30.44-13.385 30.44-29.89C759.973 703.493 746.328 690.103 729.533 690.103z" 
                :fill="currentTab === index ? '#3b82f6' : '#9ca3af'" 
              />
            </svg>

            <!-- Media (Index 2) -->
            <svg 
              v-else-if="index === 2"
              viewBox="0 0 1024 1024" 
              version="1.1" 
              xmlns="http://www.w3.org/2000/svg" 
              width="24px" 
              height="24px"
              :style="{ display: 'block', transition: 'all 0.3s ease' }"
              :class="{ 'active-icon': currentTab === index }"
            >
              <path d="M857.92 875.584h-94.4a32 32 0 0 1 0-64h94.464c20.224 0 36.736-17.344 36.736-38.656V207.424c0-21.312-16.512-38.656-36.736-38.656H170.752c-20.224 0-36.736 17.344-36.736 38.656v565.504c0 21.312 16.448 38.656 36.736 38.656h384.256a32 32 0 0 1 0 64H170.752c-55.552 0-100.736-46.08-100.736-102.656V207.424c0-56.64 45.184-102.656 100.736-102.656H857.92c55.552 0 100.736 46.08 100.736 102.656v565.504c0 56.576-45.184 102.656-100.736 102.656z" 
                :fill="currentTab === index ? '#3b82f6' : '#9ca3af'" 
              />
              <path d="M397.76 374.464c0-35.2 24.96-49.6 55.424-32l200.32 115.712c30.528 17.6 30.528 46.4 0 64l-200.32 115.712c-30.464 17.6-55.424 3.2-55.424-32V374.464z" 
                :fill="currentTab === index ? '#3b82f6' : '#9ca3af'" 
              />
            </svg>

            <!-- Music (Index 3) -->
            <svg 
              v-else-if="index === 3"
              viewBox="0 0 1024 1024" 
              version="1.1" 
              xmlns="http://www.w3.org/2000/svg" 
              width="24px" 
              height="24px"
              :style="{ display: 'block', transition: 'all 0.3s ease' }"
              :class="{ 'active-icon': currentTab === index }"
            >
              <path 
                d="M875.008 295.424a34.133333 34.133333 0 1 0-58.197333 35.669333c35.328 57.514667 53.930667 123.562667 53.930666 191.488 0 201.898667-164.352 366.250667-366.250666 366.250667S138.24 724.48 138.24 522.581333 302.592 156.330667 504.490667 156.330667c18.773333 0 34.133333-15.36 34.133333-34.133334s-15.36-34.133333-34.133333-34.133333C264.874667 88.064 69.973333 282.965333 69.973333 522.581333s194.901333 434.517333 434.517334 434.517334 434.517333-194.901333 434.517333-434.517334c0.170667-80.384-22.016-159.061333-64-227.157333z" 
                :fill="currentTab === index ? '#3b82f6' : '#9ca3af'" 
              />
              <path 
                d="M501.248 389.973333c-77.653333 0-140.8 63.146667-140.8 140.8s63.146667 140.8 140.8 140.8 140.8-63.146667 140.8-140.8V224.256c0-19.456 15.872-35.328 35.328-35.328 19.456 0 35.328 15.872 35.328 35.328 0 18.773333 15.36 34.133333 34.133333 34.133333s34.133333-15.36 34.133334-34.133333c0-57.173333-46.421333-103.594667-103.594667-103.594667s-103.594667 46.421333-103.594667 103.594667v186.026667a140.526933 140.526933 0 0 0-72.533333-20.309334z m0 213.333334a72.704 72.704 0 0 1-72.533333-72.533334 72.704 72.704 0 0 1 72.533333-72.533333 72.704 72.704 0 0 1 72.533333 72.533333 72.704 72.704 0 0 1-72.533333 72.533334z" 
                :fill="currentTab === index ? '#3b82f6' : '#9ca3af'" 
              />
            </svg>
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

const tabs = [
  {
    label: '首页',
    icon: 'home',
    customIcon: true
  },
  {
    label: '文章',
    icon: 'read',
    customIcon: true
  },
  {
    label: '媒体',
    icon: 'list',
    customIcon: true
  },
  {
    label: '音乐',
    icon: 'sound', // keeping icon just in case, though customIcon takes precedence
    customIcon: true
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