<script setup lang="ts">
const version = window.app.remote.app.getVersion();
</script>

<template>
  <transition name="delayDisplayNone">
    <div id="about">
      <div class="logo"><img src="@/assets/images/icon.png" /></div>
      <div id="about-title">藏起来！哔哩哔哩 v{{ version }}</div>
      <p>Tip：按Ctrl+e（ Mac下Option+w ）可以快速隐藏此程序</p>
      <p>
        Made by
        <a href="https://weibo.com/chitosai" target="_blank">@千歳</a>
        with LOVE
      </p>
      <p>
        代码开源于<a href="https://github.com/chitosai/bilimini" target="_blank"
          >Github</a
        >
      </p>
    </div>
  </transition>
</template>

<style lang="less" scoped>
.delayDisplayNone-leave-active {
  transition: 0.2s;
}
#about {
  user-select: none;
  background: @color-bg-pink;
  color: #fff;
  box-sizing: border-box;
  text-align: center;
  padding: 10px;
  position: absolute;
  margin-top: -180px;
  width: 100%;
  height: 180px;
  line-height: 1.3em;
  .logo {
    width: 60px;
    margin: 0 auto;
    img {
      width: 100%;
      height: 100%;
    }
  }
  a {
    color: #fff;
  }
}
</style>
