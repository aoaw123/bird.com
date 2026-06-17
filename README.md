# 🦜 Birds in Pieces

> 鸟类碎片化可视化 — 十种珍稀鸟类交互式物种档案  
> 期末课题 · 大数据可视化

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Vue 3 + Vite + @vueuse/core |
| 后端 | Express (Node.js) |
| 数据库 | SQLite (better-sqlite3) |
| API | RESTful JSON |

## 快速启动

```bash
npm install        # 安装依赖（自动建库 seed）
npm run dev:all    # 启动前端 (5173) + 后端 (3456)
```

浏览器打开 `http://localhost:5173`

## 项目结构

```
birds-in-pieces/
├── src/                   # 前端源码
│   ├── api/birds.js       # API 客户端
│   ├── components/        # Vue 组件
│   │   ├── BirdViewer.vue      # 鸟类主视图
│   │   ├── BirdRadar.vue       # 六维雷达图 (SVG)
│   │   ├── InfoPanel.vue       # 物种档案侧边栏
│   │   ├── GalleryViewer.vue   # 图片画廊
│   │   ├── WallpaperOverlay.vue # 壁纸下载
│   │   └── ...
│   └── data/birds.js      # 原始数据（已被 seed 脚本引用）
├── server/                # 后端
│   ├── index.js           # Express 入口
│   ├── db.js              # SQLite 连接与建表
│   ├── seed.js            # 数据迁移脚本（birds.js → SQLite）
│   └── routes/birds.js    # API 路由
├── public/birds/          # 鸟类图片资源
│   ├── 1. 中华秋沙鸭/
│   ├── 2. 冠斑犀鸟/
│   └── ...
└── vite.config.js         # Vite 配置（含 /api 代理）
```

## 数据库设计

面向可扩展的关系型设计，4 张表：

```
birds ──┬── bird_images (一对多：图片路径)
        ├── bird_tags    (一对多：标签)
        └── radar_scores (一对多：雷达六维评分)
```

**birds** — 物种主表
- 基本信息：名称、描述、种群数量、分布、抖音视频链接
- 状态：濒危等级（EN/VU/NT/LC）
- 生理数据：翼展、体重、寿命、食性

**bird_images** — 图片路径（不存二进制）
- 主图标记 `is_primary`，排序 `sort_order`

**radar_scores** — 六维评分（行式存储，便于扩展）
- 维度：speed / attack / size / migration / agility / rarity
- 等级：S / A / B / C / D

## API 接口

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/birds` | 全部鸟类数据 |
| GET | `/api/birds/:id` | 单只鸟详情 |
| GET | `/api/birds/:id/radar` | 雷达评分（轻量） |
| GET | `/api/stats/overview` | 统计汇总 |
| GET | `/api/health` | 健康检查 |

响应格式与原 `birds.js` 完全兼容，前端无需改动组件。

## 命令速查

```bash
npm run dev        # 仅启动前端
npm run server     # 仅启动后端
npm run dev:all    # 前后端一键启动
npm run seed       # 重新导入数据到数据库
npm run build      # 前端生产构建
```

## 数据来源

鸟类数据包括描述、种群数量、分布、雷达评分、图片等，来源于公开学术资料与保护区报告。

## 添加新鸟类

1. 在 `src/data/birds.js` 追加对象
2. 图片放入 `public/birds/` 对应目录
3. 运行 `npm run seed` 重新导入

## License

MIT
