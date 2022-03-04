# bilimini

## 藏起来！哔哩哔哩

![GitHub](https://img.shields.io/github/license/liumingye/bilimini) ![GitHub package.json version](https://img.shields.io/github/package-json/v/liumingye/bilimini) ![GitHub last commit](https://img.shields.io/github/last-commit/liumingye/bilimini) [![Build/release](https://github.com/liumingye/bilimini/actions/workflows/release.yml/badge.svg?branch=main)](https://github.com/liumingye/bilimini/actions/workflows/release.yml)

## 💽 安装稳定版

[GitHub](https://github.com/liumingye/bilimini/releases) 或 [Gitee](https://gitee.com/liumingye/bilimini/releases) 或 [Hazel](https://hazel-liumingye.vercel.app) 提供了已经编译好的稳定版安装包，当然你也可以自己克隆代码编译打包。

## ✨ 特性

- 小窗口
- 总在最前
- 同时支持 Windows/Mac

完美解决只有一块屏幕又想在上班时候刷 b 站的刚需（x  
大概是这个星球上最适合你的 bilibili 客户端（x2

## 🖥 应用界面

![](https://ae01.alicdn.com/kf/H597810126c254b2784ef2b456916de51v.png)

![](https://ae01.alicdn.com/kf/Hff93d36ddde540d393684e2925acb9b2f.png)

![](https://ae01.alicdn.com/kf/H51a0523e4b2e43a3a2876c7e7712aea1E.png)

![demo](https://cdn.jsdelivr.net/gh/chitosai/bilimini/images/demo.gif)

## ⌨️ 本地开发

### 克隆代码

```bash
git clone git@github.com:liumingye/bilimini.git
```

### 安装依赖

```
yarn install
```

> Error: Electron failed to install correctly, please delete node_modules/electron and try installing again

`Electron` 下载安装失败的问题，解决方式请参考 https://github.com/electron/electron/issues/8466#issuecomment-571425574

或者使用

```
yarn dlx electron-fix start
```

### 开发模式

```
yarn dev
```

### 编译打包

```
yarn build
yarn build:mac
yarn build:win32
yarn build:win64
yarn build:linux
```
