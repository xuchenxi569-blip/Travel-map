# 足迹 · 地图相册（Travel Map Gallery）

以中国地图为核心的旅行相册：去过的省份在地图上高亮，点击省份即可查看在那里拍下的照片。面向常年旅行、热爱拍照的人群，视觉风格偏 Instagram。

## 功能

- 首页展示完整中国地图，按省份划分
- 鼠标悬停省份出现柔和光圈与高亮
- 已上传照片的省份高亮，并显示照片数量角标
- 点击省份：地图聚焦放大，右侧面板以九宫格展示该省照片
- 点击照片打开灯箱大图，支持左右切换 / Esc 关闭
- 「添加图片」页：拖拽或点击批量上传，为每张照片选择省份、地点、备注
- 照片数据保存在浏览器 IndexedDB 中，刷新不丢失，无需后端

## 技术栈

- React + Vite + TypeScript
- 地图渲染：`d3-geo`（真实省界 GeoJSON，数据源：阿里 DataV）
- 路由：`react-router-dom`
- 本地存储：`idb`（IndexedDB）

## 本地运行

```bash
npm install
npm run dev
```

启动后浏览器访问 http://localhost:5173/

## 构建

```bash
npm run build
npm run preview
```

## 目录结构

```
src/
  components/   # 地图、灯箱等组件
  pages/        # 首页（地图）、图库（上传）页
  lib/          # IndexedDB 存储层与照片 Context
  data/         # 省份清单
public/
  china.json    # 中国省份地图数据（已做 winding 方向修正）
```

## 地图数据说明

`public/china.json` 来自阿里 DataV 全量边界（含港澳台及南海诸岛）。原始数据的多边形环绕方向与 d3-geo 期望相反，已预处理为顺时针，避免投影时整图塌缩。
