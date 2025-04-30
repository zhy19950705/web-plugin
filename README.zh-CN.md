# electron-vite-react

[![awesome-vite](https://awesome.re/mentioned-badge.svg)](https://github.com/vitejs/awesome-vite)
![GitHub stars](https://img.shields.io/github/stars/caoxiemeihao/vite-react-electron?color=fa6470)
![GitHub issues](https://img.shields.io/github/issues/caoxiemeihao/vite-react-electron?color=d8b22d)
![GitHub license](https://img.shields.io/github/license/caoxiemeihao/vite-react-electron)
[![Required Node.JS >= 14.18.0 || >=16.0.0](https://img.shields.io/static/v1?label=node&message=14.18.0%20||%20%3E=16.0.0&logo=node.js&color=3f893e)](https://nodejs.org/about/releases)

[English](README.md) | 简体中文

## 👀 概述

📦 开箱即用  
🎯 基于官方的 [template-react-ts](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts)，保持熟悉的项目结构  
🌱 易于扩展和定制  
💪 在渲染进程中完全支持 Node.js API  
🔩 兼容 C/C++ 原生模块  
🐞 内置调试配置  
🖥 轻松实现多窗口应用  

## 🛫 快速开始

```sh
# 克隆项目
git clone https://github.com/electron-vite/electron-vite-react.git

# 进入项目目录
cd electron-vite-react

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 🐞 调试

![electron-vite-react-debug.gif](/electron-vite-react-debug.gif)

## 📂 目录结构

熟悉的 React 应用结构，顶层增加了 `electron` 文件夹：  
*electron 文件夹中的文件会与 React 应用分离并构建到 `dist-electron` 中*  

```tree
├── electron                                 Electron 相关代码
│   ├── main                                 主进程源代码
│   └── preload                              预加载脚本源代码
│
├── release                                  生产构建后生成的目录，包含可执行文件
│   └── {version}
│       ├── {os}-{os_arch}                   包含未打包的应用可执行文件
│       └── {app_name}_{version}.{ext}       应用安装程序
│
├── public                                   静态资源
└── src                                      渲染进程源代码，即 React 应用
```

## 🔧 附加功能

1. **自动更新** - 使用 electron-updater 👉 [查看文档](src/components/update/README.zh-CN.md)
2. **测试** - 使用 Playwright 进行端到端测试

## 🛠️ 构建

```sh
# 为生产环境构建应用
npm run build
```

## ❔ 常见问题

- [C/C++ 插件，Node.js 模块 - 预打包](https://github.com/electron-vite/vite-plugin-electron-renderer#dependency-pre-bundling)
- [dependencies vs devDependencies](https://github.com/electron-vite/vite-plugin-electron-renderer#dependencies-vs-devdependencies)

## 🍵 🍰 🍣 🍟

<img width="270" src="https://github.com/caoxiemeihao/blog/blob/main/assets/$qrcode/$.png?raw=true">
