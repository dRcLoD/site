import { defineAsyncComponent } from 'vue'

// ============================================================
// 文章注册表：新增文章时，在这里追加一个条目即可。
//
// 每个条目：
//   id       路由标识，URL 为 /article/<id>
//   title    文章标题（用于文章页头部 + 首页卡片）
//   tag      分类标签（显示在卡片与文章头）
//   date     发布日期（YYYY-MM-DD）
//   author   作者
//   summary  首页卡片上的简介文字
//   component 文章正文组件（懒加载）。正文组件放在 src/articles/ 下，
//             <template> 里写文章内容（支持 h2 / p / img / strong / em 等）。
// ============================================================

export const articles = [
  {
    id: 'feipin',
    title: '从0.5开始的废品小学习——从纯轴到耀圣',
    tag: '游戏王',
    date: '2026-03-30',
    author: 'dRcLoD',
    summary: '分享我从LOCH之后到4月表前对废品进行迭代的心路历程',
    component: defineAsyncComponent(() => import('./feipin-junk.vue')),
  },
]

export function getArticle(id) {
  return articles.find(a => a.id === id)
}
