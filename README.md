# webmini

## 迷你 web 应用

![GitHub](https://img.shields.io/github/license/liumingye/webmini) ![GitHub package.json version](https://img.shields.io/github/package-json/v/liumingye/webmini) ![GitHub last commit](https://img.shields.io/github/last-commit/liumingye/webmini) [![Build/release](https://github.com/liumingye/webmini/actions/workflows/release.yml/badge.svg?branch=main)](https://github.com/liumingye/webmini/actions/workflows/release.yml)

## 💽 安装稳定版

[GitHub](https://github.com/liumingye/webmini/releases) 或 [Hazel(速度比较快)](https://webmini.vercel.app) 提供了已经编译好的稳定版安装包，当然你也可以自己克隆代码编译打包。

## ✨ 特性

- 小窗口
- 总在最前
- 同时支持 Windows/Mac
- 可拓展

## 🖥 应用界面

![](https://ae01.alicdn.com/kf/He81afd1338794a5582bc4e8e7e6f3c17w.png)

![](https://ae01.alicdn.com/kf/Hd16eae4af9154bdfa7f861c6cbc31c78c.png)

![](https://ae01.alicdn.com/kf/H18a6522c15254a688ed418c684c74997s.png)

![](https://ae01.alicdn.com/kf/H9e8bdce3125f41ef9c051b81fe6f290f0.png)

![](https://ae01.alicdn.com/kf/H27880bddc8be4eef986523d4ff60cbaez.png)

![](https://ae01.alicdn.com/kf/H5710f7fbaf38452da4b05b60f27638dfg.png)

## ⌨️ 本地开发

### 克隆代码

```bash
git clone git@github.com:liumingye/webmini.git
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
yarn build:win
yarn build:linux
```
