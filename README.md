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

![](https://ae01.alicdn.com/kf/H9d655f89e940420bb0e0ed352893fab0x.png)

![](https://ae01.alicdn.com/kf/H847e841e971541299e3aabaa4bc7183cy.png)

![](https://ae01.alicdn.com/kf/Hc05b3be0894b4069a95b34e4386ba442n.png)

![](https://ae01.alicdn.com/kf/H011a53a606d7422cbd6c61d135e28b64J.png)

![](https://ae01.alicdn.com/kf/H6a1b68d4677d4c0aa9960c77f0f9580cr.png)

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
