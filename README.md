# Merge Image

一个基于 React + TypeScript + Vite 的图片合并工具。

## 项目简介

这是一个简单而强大的在线图片合并工具，允许用户上传多张图片并将它们合并成一张图片。该工具完全在浏览器端运行，保护用户隐私的同时提供便捷的图片处理体验。

## 技术栈

- React 19
- TypeScript
- Vite 6
- ESLint
- 现代化的开发工具链

## 功能特点

- 支持多图片上传
- 浏览器端图片处理
- 实时预览
- 简洁直观的用户界面
- 支持自定义合并参数

## 开始使用

### 环境要求

- Node.js 18.0.0 或更高版本
- npm 或 yarn 包管理器

### 安装步骤

1. 克隆项目到本地：

```bash
git clone [项目地址]
cd merge-image
```

2. 安装依赖：

```bash
npm install
# 或
yarn install
```

3. 启动开发服务器：

```bash
npm run dev
# 或
yarn dev
```

4. 打开浏览器访问 http://localhost:5173

### 构建生产版本

```bash
npm run build
# 或
yarn build
```

构建后的文件将生成在 `dist` 目录中。

## 使用说明

1. 点击上传按钮或将图片拖拽到指定区域
2. 选择需要合并的图片
3. 调整合并参数（如需要）
4. 点击合并按钮
5. 下载最终生成的图片

## 开发相关

### 可用的命令

- `npm run dev` - 启动开发服务器
- `npm run build` - 构建生产版本
- `npm run lint` - 运行代码检查
- `npm run preview` - 预览生产构建

## 贡献指南

欢迎提交 Issue 和 Pull Request 来帮助改进这个项目。

## 许可证

MIT License
