# 系统架构说明

## 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                         客户端层                              │
│  ┌──────────────┐    ┌──────────────┐   ┌──────────────┐   │
│  │   用户端     │    │   管理后台    │   │   移动端     │   │
│  │  (Next.js)   │    │  (Next.js)    │   │  (响应式)    │   │
│  └──────────────┘    └──────────────┘   └──────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                         API 网关                             │
│                      (Next.js API)                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       应用服务层                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                    Nest.js Backend                    │  │
│  │  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌────────┐ │  │
│  │  │ 咨询模块 │  │ 对话模块  │  │轮播图模块│  │认证模块│ │  │
│  │  └─────────┘  └──────────┘  └─────────┘  └────────┘ │  │
│  │  ┌─────────┐  ┌──────────┐                          │  │
│  │  │商家模块  │  │ 通用模块  │                          │  │
│  │  └─────────┘  └──────────┘                          │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       数据持久层                              │
│  ┌────────────────┐         ┌────────────────┐            │
│  │  PostgreSQL    │         │  Redis (可选)  │            │
│  │  (主数据库)    │         │    (缓存)      │            │
│  └────────────────┘         └────────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

## 前端架构

### Next.js 应用结构

```
frontend/
├── src/
│   ├── app/                    # App Router 路由
│   │   ├── layout.tsx         # 根布局
│   │   ├── page.tsx           # 首页（用户端）
│   │   ├── globals.css        # 全局样式
│   │   ├── admin/             # 管理后台
│   │   │   ├── page.tsx       # 管理主页
│   │   │   └── login/         # 登录页
│   │   │       └── page.tsx
│   │   └── ...
│   │
│   ├── components/            # 组件目录
│   │   ├── ChatWidget.tsx    # 对话组件
│   │   ├── BookingModal.tsx  # 预约表单
│   │   └── admin/            # 后台组件
│   │       ├── Dashboard.tsx
│   │       ├── InquiryManagement.tsx
│   │       ├── BannerManagement.tsx
│   │       ├── MerchantManagement.tsx
│   │       └── ConversationManagement.tsx
│   │
│   ├── lib/                   # 工具库
│   │   ├── api.ts            # API 调用
│   │   └── utils.ts          # 工具函数
│   │
│   └── types/                 # TypeScript 类型
│       └── index.ts
│
├── public/                    # 静态资源
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

### 组件设计原则
- **原子化设计**: 小而专一的组件
- **Props 类型化**: 使用 TypeScript 接口定义
- **状态管理**: React Hooks + Context API
- **样式方案**: Tailwind CSS + Ant Design

## 后端架构

### Nest.js 模块结构

```
backend/
├── src/
│   ├── main.ts                # 应用入口
│   ├── app.module.ts          # 根模块
│   │
│   ├── prisma/                # Prisma 模块
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   │
│   └── modules/               # 功能模块
│       ├── inquiry/           # 咨询模块
│       │   ├── inquiry.module.ts
│       │   ├── inquiry.controller.ts
│       │   ├── inquiry.service.ts
│       │   └── dto/
│       │       ├── create-inquiry.dto.ts
│       │       └── update-inquiry.dto.ts
│       │
│       ├── conversation/      # 对话模块
│       │   ├── conversation.module.ts
│       │   ├── conversation.controller.ts
│       │   ├── conversation.service.ts
│       │   └── dto/
│       │
│       ├── banner/            # 轮播图模块
│       ├── merchant/          # 商家模块
│       └── auth/              # 认证模块
│           ├── auth.module.ts
│           ├── auth.controller.ts
│           ├── auth.service.ts
│           ├── jwt.strategy.ts
│           └── jwt-auth.guard.ts
│
├── prisma/
│   └── schema.prisma          # 数据库 Schema
│
├── package.json
├── tsconfig.json
└── nest-cli.json
```

### 模块职责划分

#### 1. 咨询模块 (Inquiry)
- **职责**: 处理用户咨询信息的 CRUD
- **功能**:
  - 创建咨询记录
  - 查询咨询列表（带筛选）
  - 更新联系状态
  - 统计数据分析

#### 2. 对话模块 (Conversation)
- **职责**: 管理用户与系统的对话
- **功能**:
  - 保存对话消息
  - AI 自动回复逻辑
  - 人工客服切换
  - 对话历史查询

#### 3. 轮播图模块 (Banner)
- **职责**: 管理首页轮播图
- **功能**:
  - 轮播图 CRUD
  - 排序管理
  - 启用/禁用控制

#### 4. 商家模块 (Merchant)
- **职责**: 管理商家信息
- **功能**:
  - 商家信息维护
  - 服务特色管理
  - 师资优势管理

#### 5. 认证模块 (Auth)
- **职责**: 用户认证与授权
- **功能**:
  - JWT Token 签发
  - 登录验证
  - 密码加密
  - 权限守卫

## 数据流设计

### 1. 用户咨询流程

```
用户填写表单
    │
    ▼
前端验证 → 提交到后端
                │
                ▼
        后端 DTO 验证
                │
                ▼
        Inquiry Service 处理
                │
                ▼
        Prisma 存入数据库
                │
                ▼
        返回成功响应
                │
                ▼
        前端显示成功提示
```

### 2. 智能对话流程

```
用户发送消息
    │
    ▼
前端 → POST /api/conversations/message
            │
            ▼
    Conversation Service
            │
            ├─→ 保存用户消息
            │
            ├─→ 分析对话历史
            │
            ├─→ 生成自动回复
            │
            └─→ 保存机器人消息
            │
            ▼
    返回回复内容
            │
            ▼
    前端显示对话
```

### 3. 后台管理流程

```
管理员登录
    │
    ▼
JWT Token 认证
    │
    ▼
访问管理接口（带 Token）
    │
    ▼
JwtAuthGuard 验证
    │
    ▼
允许访问 → 返回数据
```

## 数据库设计

### ER 图关系

```
┌──────────────┐         ┌──────────────────┐
│   Inquiry    │1      N │  Conversation    │
│ (咨询记录)   ├─────────┤  (对话记录)      │
└──────────────┘         └──────────────────┘

┌──────────────┐
│    Banner    │
│  (轮播图)    │
└──────────────┘

┌──────────────┐
│ MerchantInfo │
│ (商家信息)   │
└──────────────┘

┌──────────────┐
│    Admin     │
│  (管理员)    │
└──────────────┘
```

### 索引策略
- `Conversation.sessionId`: 索引，加速会话查询
- `Conversation.inquiryId`: 索引，关联查询优化
- `Admin.username`: 唯一索引，登录查询
- `Banner.order`: 排序查询优化

## API 设计规范

### RESTful 风格

```
资源          方法    路径                        说明
─────────────────────────────────────────────────
咨询记录      POST    /api/inquiries             创建
             GET     /api/inquiries             列表（支持查询参数）
             GET     /api/inquiries/:id         单个
             PATCH   /api/inquiries/:id         更新
             DELETE  /api/inquiries/:id         删除
             GET     /api/inquiries/stats       统计

对话记录      POST    /api/conversations/message      发送消息
             GET     /api/conversations/session/:id  会话对话
             POST    /api/conversations/switch-agent 切换客服

轮播图        GET     /api/banners              列表
             POST    /api/banners              创建
             PATCH   /api/banners/:id          更新
             DELETE  /api/banners/:id          删除
             POST    /api/banners/reorder      排序

商家信息      GET     /api/merchant             列表
             GET     /api/merchant/active      当前启用
             PATCH   /api/merchant/:id         更新

认证          POST    /api/auth/login           登录
             POST    /api/auth/register        注册
             GET     /api/auth/profile         个人信息
```

### 响应格式

**成功响应**:
```json
{
  "id": "uuid",
  "field1": "value1",
  "field2": "value2",
  ...
}
```

**错误响应**:
```json
{
  "statusCode": 400,
  "message": "错误信息",
  "error": "Bad Request"
}
```

## 安全设计

### 1. 认证与授权
- **JWT Token**: 无状态认证
- **密码加密**: Bcrypt 哈希
- **Token 过期**: 7天自动过期
- **角色权限**: 基于角色的访问控制（可扩展）

### 2. 数据验证
- **DTO 验证**: class-validator 自动验证
- **类型安全**: TypeScript 编译时检查
- **SQL 注入防护**: Prisma ORM 参数化查询

### 3. CORS 策略
- 配置允许的前端域名
- 支持凭据传递
- 限制允许的 HTTP 方法

### 4. 环境变量
- 敏感信息不入库
- `.env` 文件本地开发
- 生产环境使用环境变量注入

## 性能优化

### 1. 前端优化
- **代码分割**: Next.js 自动分割
- **图片优化**: next/image 组件
- **静态生成**: ISR 增量静态再生成
- **客户端缓存**: SWR / React Query（可选）

### 2. 后端优化
- **数据库索引**: 关键字段建立索引
- **查询优化**: Prisma 关联查询优化
- **连接池**: PostgreSQL 连接池
- **Redis 缓存**: 热点数据缓存（可扩展）

### 3. 网络优化
- **Gzip 压缩**: 响应体压缩
- **CDN 加速**: 静态资源 CDN
- **HTTP/2**: 多路复用

## 部署架构

### 开发环境
```
localhost:3000 (前端) → localhost:3001 (后端) → localhost:5432 (PostgreSQL)
```

### 生产环境（建议）
```
                    ┌─────────────┐
                    │  Nginx/CDN  │
                    └──────┬──────┘
                           │
          ┌────────────────┴────────────────┐
          │                                  │
    ┌─────▼─────┐                    ┌──────▼──────┐
    │  前端服务  │                    │  后端服务    │
    │ (Next.js)  │                    │  (Nest.js)  │
    │   PM2      │                    │    PM2      │
    └────────────┘                    └──────┬──────┘
                                             │
                                    ┌────────▼────────┐
                                    │   PostgreSQL    │
                                    │   (主从复制)    │
                                    └─────────────────┘
```

### Docker 部署
- 前端容器: Node.js + Next.js
- 后端容器: Node.js + Nest.js
- 数据库容器: PostgreSQL
- 反向代理: Nginx

## 监控与日志

### 应用监控（建议扩展）
- **性能监控**: New Relic / DataDog
- **错误追踪**: Sentry
- **日志收集**: ELK / Loki
- **健康检查**: /health 端点

### 日志规范
```typescript
// 应用日志
logger.log('用户登录', { userId, ip })

// 错误日志
logger.error('数据库连接失败', error.stack)

// 调试日志
logger.debug('查询参数', { filters })
```

## 扩展性考虑

### 水平扩展
- 无状态设计（JWT）
- 负载均衡支持
- 数据库读写分离

### 垂直扩展
- 模块化设计
- 微服务拆分准备
- 消息队列集成（可选）

### 功能扩展
- WebSocket 实时通讯
- 文件上传服务
- 第三方集成（短信、支付）
- 数据分析平台

---

本架构设计注重：
✅ 模块化与可维护性
✅ 安全性与数据保护
✅ 性能与扩展性
✅ 开发体验与效率

可根据实际业务需求进行调整和扩展。

