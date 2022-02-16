<script setup lang="ts">
import { useAppStore } from "@/store";
const appStore = useAppStore();
window.ipcRenderer.on("windowID", (_event, items) => {
  Object.assign(appStore.windowID, items);
});
// Store Init
appStore.loadSelfFromLocalStorage();
// appStore.$onAction(
//   ({
//     name, // name of the action
//     after, // hook after the action returns or resolves
//   }) => {
//     console.log(name);
//     if (["saveSelfToLocalStorage"].includes(name)) {
//       return;
//     }
//     after(() => {
//       appStore.saveSelfToLocalStorage();
//     });
//   }
// );
</script>

<template>
  <router-view v-slot="{ Component }">
    <keep-alive>
      <component :is="Component" />
    </keep-alive>
  </router-view>
</template>

<style>
#app {
  height: 100%;
}
</style>
