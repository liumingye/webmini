# bilimini

## 藏起来！哔哩哔哩

![GitHub](https://img.shields.io/github/license/liumingye/bilimini) ![GitHub package.json version](https://img.shields.io/github/package-json/v/liumingye/bilimini) ![GitHub last commit](https://img.shields.io/github/last-commit/liumingye/bilimini) [![Build/release](https://github.com/liumingye/bilimini/actions/workflows/release.yml/badge.svg?branch=main)](https://github.com/liumingye/bilimini/actions/workflows/release.yml)

## 💽 安装稳定版

[GitHub](https://github.com/liumingye/bilimini/releases) 或 [Hazel(速度比较快)](https://hazel-liumingye.vercel.app) 提供了已经编译好的稳定版安装包，当然你也可以自己克隆代码编译打包。

## ✨ 特性

- 小窗口
- 总在最前
- 同时支持 Windows/Mac

完美解决只有一块屏幕又想在上班时候刷 b 站的刚需（x  
大概是这个星球上最适合你的 bilibili 客户端（x2

## 🖥 应用界面

![](https://ae01.alicdn.com/kf/Hd2000eccbf63438c8540c5e974aac262S.png)

![](https://ae01.alicdn.com/kf/Hfad66a90c3c94120b9a3462d140e6476A.png)

![](https://ae01.alicdn.com/kf/H9721700495684e7ba9882200aa17c3fdG.png)

![](https://ae01.alicdn.com/kf/Haa5a0054ae6a4daa9075eb7fe7a67e94v.png)

![](https://ae01.alicdn.com/kf/H7cb239fc17e34c3a8d9d8e5a15453c93d.png)

![](https://ae01.alicdn.com/kf/H5710f7fbaf38452da4b05b60f27638dfg.png)

## ⌨️ 本地开发

### 克隆代码

```bash
git clone git@github.com:liumingye/bilimini.git
```

### 安装依赖

```
corepack enable
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
