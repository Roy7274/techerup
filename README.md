# 家教平台 - TeacherUp

基于 Next.js + Nest.js + PostgreSQL 的家教服务平台

## 技术栈

### 前端
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Ant Design / shadcn/ui

### 后端
- Nest.js
- TypeScript
- TypeORM
- PostgreSQL
- JWT 认证

## 项目结构

```
teacherUp/
├── frontend/          # Next.js 前端项目
│   ├── src/
│   │   ├── app/      # 页面路由
│   │   ├── components/  # 组件
│   │   ├── lib/      # 工具函数
│   │   └── types/    # TypeScript 类型
│   └── public/       # 静态资源
│
├── backend/          # Nest.js 后端项目
│   ├── src/
│   │   ├── modules/  # 功能模块
│   │   ├── entities/ # 数据库实体
│   │   ├── dto/      # 数据传输对象
│   │   └── common/   # 公共模块
│   └── prisma/       # 数据库 schema
│
└── docs/             # 文档
```

## 核心功能

### 1. 信息收集系统
- 自动获取用户城市定位
- 收集学段、身份、性别、联系方式
- 左下角固定"预约试听"按钮
- 后台数据筛选和状态管理

### 2. 智能回复系统
- AI 自动回复初始话术
- 按顺序引导信息收集
- 支持人工介入切换
- 保留历史对话记录

### 3. 内容管理系统
- 轮播图上传、删除、排序
- 商家信息编辑
- 实时同步前端展示

### 4. 后台管理系统
- 多条件数据筛选
- 联系状态跟踪
- 内容维护管理

## 快速开始

### 环境要求
- Node.js 18+
- PostgreSQL 14+
- pnpm 8+

### 安装依赖

```bash
# 前端
cd frontend
pnpm install

# 后端
cd backend
pnpm install
```

### 配置环境变量

创建 `.env` 文件（参考 `.env.example`）

### 运行项目

```bash
# 前端开发服务器
cd frontend
pnpm dev

# 后端开发服务器
cd backend
pnpm start:dev
```

### 数据库迁移

```bash
cd backend
pnpm prisma migrate dev
pnpm prisma generate
```

## 部署

待补充...

## License

MIT

