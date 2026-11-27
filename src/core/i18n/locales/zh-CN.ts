// i18n-allow-cjk-file
// The only place in the codebase where zh-CN UI copy is allowed to be literal.

const zhCN = {
  app: {
    name: 'HWPanel',
  },
  tabs: {
    overview: '概览',
    containers: '容器',
    apps: '应用',
    tasks: '任务',
    more: '更多',
  },
  screens: {
    overview: {
      title: '概览',
      body: '资源总览将在后续切片接入。',
    },
    containers: {
      title: '容器',
      body: '容器与编排列表将在后续切片接入。',
    },
    apps: {
      title: '应用',
      body: '应用商店与已安装列表将在后续切片接入。',
    },
    tasks: {
      title: '任务',
      body: '计划任务列表将在后续切片接入。',
    },
    more: {
      title: '更多',
      body: '网站、外观与设置入口将在后续切片接入。',
    },
  },
} as const;

export default zhCN;
