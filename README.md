# Auto BT Link 🔗

一个基于 Web Bluetooth API 的蓝牙通讯网页应用，支持设备配对、聊天、传输照片和视频。

## 功能特点

- 📱 蓝牙设备扫描与配对
- 💬 实时文本聊天
- 🖼️ 图片传输与预览
- 🎬 视频传输与播放
- 🌐 可部署至 Vercel

## 部署到 Vercel

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel
```

或者直接通过 GitHub 连接到 Vercel 自动部署。

## 使用说明

### 支持的浏览器
- Chrome (桌面版 / Android)
- Edge
- Opera

**注意**: Safari 和 Firefox 不支持 Web Bluetooth API。

### 使用流程

1. 打开应用网页
2. 点击"扫描设备"按钮
3. 选择要配对的蓝牙设备
4. 配对成功后即可开始聊天
5. 可以发送文字、图片、视频

### 传输文件
- 支持 JPG、PNG、GIF、WebP 等图片格式
- 支持 MP4、WebM 等视频格式
- 最大文件大小取决于蓝牙传输速度

## 技术栈

- 纯 HTML/CSS/JavaScript
- Web Bluetooth API
- Vercel 部署

## 目录结构

```
.
├── index.html          # 主页面
├── style.css          # 样式文件
├── js/
│   ├── app.js         # 主应用逻辑
│   ├── bluetooth.js  # 蓝牙通讯模块
│   └── chat.js       # 聊天功能模块
└── vercel.json       # Vercel 配置
```

## License

MIT
