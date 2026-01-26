<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
onLaunch(() => {
  console.log("App Launch");
  // #ifdef APP-PLUS
  plus.navigator.closeSplashscreen();
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
page {
  height: 100%;
  background-color: #f5f6f8;
  overscroll-behavior-y: none;
}
</style>
