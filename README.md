# dRcLoD的博客

基于 **Vue 3 + Vite + Vue Router** 的个人博客站点，支持 GitHub Pages 自动部署。除了常规的文章博客外，还包含资料下载和游戏王卡组综合工具等页面。

## 功能特性

- 📝 **文章博客**：首页卡片式文章列表，文章页懒加载正文组件，支持旧链接重定向
- 📁 **资料下载**：文件浏览器展示 `public/document/` 下的资料，构建时自动生成文件清单，无需外部 API
- 🎴 **卡组综合工具**：导入 YDK 卡组文件，支持卡组展示、随机抽卡、双卡组对决模拟，结果导出 CSV
- 🎵 **音乐播放器**：内嵌网易云音乐播放器（可开关）
- 👁 **访客统计**：首页/工具页使用不蒜子，其余页面使用 counterapi
- 🖼 **随机背景**：启动时从外部 API 获取随机背景图

## 技术栈

- [Vue 3](https://vuejs.org/)（`<script setup>` 组合式 API）
- [Vite](https://vitejs.dev/) 构建工具
- [Vue Router 5](https://router.vuejs.org/)（History 模式）
- [GitHub Actions](.github/workflows/deploy.yml) 自动构建部署

## 本地开发

```bash
npm install       # 安装依赖
npm run dev       # 启动开发服务器（默认 http://localhost:5173/site/）
npm run build     # 生产构建，输出到 dist/，并自动生成 dist/404.html
npm run preview   # 本地预览构建产物
```

## 目录结构

```
site/
├── .github/workflows/deploy.yml   # GitHub Actions 自动部署
├── public/                        # 静态资源，构建时原样复制到 dist/
│   ├── files.json                 # 资料清单（构建时由脚本自动生成）
│   ├── image/                     # 头像、文章图片、二维码等
│   └── document/                  # 资料下载页的文件
├── scripts/
│   ├── generate-files.mjs         # 扫描 public/document/ 生成 files.json
│   ├── postbuild.mjs              # 构建后复制 index.html → 404.html（History 路由回退）
│   └── ssr-check.mjs              # 开发用渲染自检脚本
└── src/
    ├── main.js                    # 应用入口
    ├── App.vue                    # 全局布局（侧边栏 + 路由出口 + 音乐播放器 + 随机背景）
    ├── router/
    │   ├── routes.js              # 路由表（含旧链接重定向）
    │   └── index.js               # 创建路由器
    ├── articles/
    │   ├── index.js               # ★ 文章注册表（新增文章在这里登记）
    │   └── feipin-junk.vue        # 文章正文组件示例
    ├── components/
    │   ├── Sidebar.vue            # 侧边栏（头像/导航/访客数）
    │   ├── MusicPlayer.vue        # 网易云音乐播放器
    │   └── FileExplorer.vue       # 资料下载的文件浏览器
    ├── composables/
    │   └── useDocumentList.js     # 读取本地 files.json 获取文件列表
    ├── styles/                    # 全局样式
    └── views/
        ├── HomeView.vue           # 首页（置顶推荐 + 文章卡片 + 工具入口）
        ├── AboutView.vue          # 关于
        ├── ArticleView.vue        # 文章页（通用模板）
        ├── DocumentsView.vue      # 资料下载
        └── DeckToolView.vue       # 游戏王卡组综合工具
```

## 路由

| 路径 | 页面 |
| --- | --- |
| `/` | 首页 |
| `/about` | 关于 |
| `/article/:id` | 文章详情 |
| `/documents` | 资料下载 |
| `/tools/deck` | 卡组综合工具 |

旧版静态站点的链接（如 `/text/1.html`、`/document/index.html`、`/index.html` 等）会自动重定向到新路径，旧书签依然可用。

## 如何新增文章

只需两步：

1. **创建文章正文组件**：复制 `src/articles/feipin-junk.vue` 为 `src/articles/你的文章.vue`，把 `<template>` 里的内容替换成你的文章（支持 `h2`、`p`、`img`、`strong`、`em` 等标签）。图片放在 `public/image/` 下，正文中用 `:src="base + 'image/图片名.png'"` 引用。

2. **在注册表中登记**：打开 `src/articles/index.js`，在 `articles` 数组中追加一条：

```js
export const articles = [
  {
    id: 'feipin',   // 已有的示例文章
    title: '从0.5开始的废品小学习——从纯轴到耀圣',
    tag: '游戏王',
    date: '2026-03-30',
    author: 'dRcLoD',
    summary: '首页卡片上的简介文字',
    component: defineAsyncComponent(() => import('./feipin-junk.vue')),
  },
  // 新增的文章：
  {
    id: 'my-article',
    title: '我的新文章',
    tag: '分类',
    date: '2026-08-16',
    author: 'dRcLoD',
    summary: '这篇文章讲了什么……',
    component: defineAsyncComponent(() => import('./my-article.vue')),
  },
]
```

保存后，首页会自动生成该文章的卡片，访问地址为 `/article/my-article`。

## 部署到 GitHub Pages

1. 将本项目内容推送到你的 GitHub 仓库（例如 `dRcLoD/site`）。
2. 在仓库 **Settings → Pages** 中，将 **Source** 改为 **"GitHub Actions"**。
3. 之后每次 `push` 到 `main` 分支，GitHub Actions 会自动构建并部署。

> **仓库名/部署路径**：构建的 `base` 路径默认为 `/site/`（对应 `dRcLoD/site` 仓库）。
> 如果部署到其他仓库或域名，在构建时通过环境变量覆盖：
>
> ```bash
> # 部署到 <用户名>.github.io 根目录时
> BASE_URL=/ npm run build
> ```

### 资料下载页说明

- 文件清单由 `scripts/generate-files.mjs` 在 `dev` / `build` 时扫描 `public/document/` **自动生成**为 `public/files.json`（名称、大小、修改日期、类型），前端直接读取本地文件，**不依赖任何外部 API**，没有限流问题。
- 新增/删除文件后直接 `git push` 即可：CI 会自动重新生成文件清单并部署，无需手动维护。
- 注意 GitHub 单个文件上限为 100MB。

### 卡组综合工具说明

支持两种模式（均在前端本地解析 YDK 文件）：

- **单卡组模式**：展示主/副/额外卡组组成，支持多轮随机抽卡模拟，导出 CSV（含卡组构成与各轮抽卡结果）。
- **双卡组对决模式**：载入两份卡组，随机决定先攻方，模拟多轮"各抽 5 张 + 先攻额外 1 张"，导出 CSV。
- 卡牌名称通过 [YGOCDB](https://ygocdb.com) 的公共 API 实时获取并缓存，CSV 带 UTF-8 BOM，可直接用 Excel 打开。

## 常用脚本

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 生成文件清单 + 启动开发服务器 |
| `npm run build` | 生成文件清单 + 生产构建（生成 dist/ 与 404.html） |
| `npm run preview` | 本地预览 dist/ 构建产物 |
| `node scripts/ssr-check.mjs` | 渲染自检（验证各路由是否正常输出内容） |

## License

© 2026 dRcLoD | 用文字记录生活
