<script setup lang="ts">
const versions = window.app.versions;
</script>

<template>
  <transition name="delayDisplayNone">
    <div class="bg">
      <div id="about">
        <div class="flex-1">
          <div class="logo"><img src="@/assets/images/icon.png" /></div>
          <p>藏起来！哔哩哔哩</p>
          <!-- <p>Tip：按Ctrl+e（ Mac下Option+w ）可以快速隐藏此程序</p> -->
          <p>
            <a href="https://github.com/liumingye/bilimini" target="_blank"
              >Github</a
            >
          </p>
        </div>
        <div class="flex-1">
          <div class="item" v-for="(value, key) in versions" :key="key">
            <div class="name">{{ key }}:</div>
            <div class="value">{{ value }}</div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<style lang="less" scoped>
.delayDisplayNone-leave-active {
  transition: 0.2s;
}
.bg {
  position: absolute;
  width: 100%;
  background: @color-bg-pink;
  margin-top: -150px;
  height: 150px;
  user-select: none;
  color: #fff;
  box-sizing: border-box;
  text-align: center;
  padding: 10px;
  line-height: 1.3em;
}
#about {
  display: flex;
  max-width: 400px;
  margin: 0 auto;
  .flex-1 {
    flex: 1;
  }
  .item {
    display: flex;
    margin-bottom: 6px;
    .name {
      margin-right: 6px;
    }
    .value {
      font-weight: bold;
    }
  }
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
