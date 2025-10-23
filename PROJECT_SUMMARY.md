# 项目总览

## 📋 项目信息

**项目名称**: TeacherUp - 家教服务平台  
**技术栈**: Next.js + Nest.js + PostgreSQL  
**开发状态**: ✅ 核心功能完成，可立即部署使用

## 🎯 项目概述

这是一个完整的家教服务平台，包含用户端和管理后台两部分。用户可以在线咨询、预约试课，管理员可以管理咨询信息、对话记录、轮播图和商家信息。

### 特色功能
- ✅ 智能对话系统（AI 自动回复 + 人工介入）
- ✅ 在线预约试课表单
- ✅ 完善的后台管理系统
- ✅ 实时对话记录
- ✅ 数据统计与分析

## 📁 项目结构

```
teacherUp/
├── frontend/              # Next.js 前端项目
│   ├── src/
│   │   ├── app/          # 页面路由
│   │   ├── components/   # 组件
│   │   ├── lib/          # 工具库
│   │   └── types/        # TypeScript 类型
│   └── package.json
│
├── backend/              # Nest.js 后端项目
│   ├── src/
│   │   ├── modules/      # 功能模块
│   │   ├── prisma/       # 数据库服务
│   │   └── main.ts       # 入口文件
│   ├── prisma/
│   │   └── schema.prisma # 数据库模型
│   └── package.json
│
├── scripts/              # 工具脚本
│   ├── init-db.sql      # 数据库初始化
│   └── seed-data.ts     # 初始数据填充
│
├── README.md             # 项目说明
├── 快速开始.md           # 快速启动指南（中文）
├── SETUP.md              # 详细部署指南
├── FEATURES.md           # 功能详细说明
├── ARCHITECTURE.md       # 系统架构说明
└── .gitignore
```

## 🚀 核心功能模块

### 1. 用户端功能
- **首页展示**: 轮播图、服务特色、商家信息
- **在线咨询**: 智能对话系统，自动收集用户信息
- **预约表单**: 快捷预约试课，自动获取城市定位
- **响应式设计**: 完美适配移动端和桌面端

### 2. 管理后台功能
- **数据概览**: 咨询统计、城市分布、学段分析
- **咨询管理**: 查看、筛选、标记、删除咨询记录
- **对话记录**: 查看完整对话历史
- **轮播图管理**: 添加、编辑、排序、启用/禁用
- **商家信息管理**: 编辑机构信息、服务特色、师资优势

### 3. 智能对话系统
- **自动回复**: 按序引导收集用户信息
- **人工介入**: 支持切换到人工客服
- **对话记录**: 完整保存所有对话
- **信息提取**: 自动关联对话与咨询记录

## 💻 技术栈详情

### 前端技术
| 技术 | 版本 | 用途 |
|------|------|------|
| Next.js | 14.2.18 | React 框架 |
| React | 18.3.1 | UI 库 |
| TypeScript | 5.6.3 | 类型系统 |
| Tailwind CSS | 3.4.15 | 样式框架 |
| Ant Design | 5.21.6 | UI 组件库 |
| Axios | 1.7.7 | HTTP 客户端 |

### 后端技术
| 技术 | 版本 | 用途 |
|------|------|------|
| Nest.js | 10.4.7 | Node.js 框架 |
| Prisma | 6.0.1 | ORM |
| PostgreSQL | 14+ | 数据库 |
| JWT | 10.2.0 | 认证 |
| Bcrypt | 5.1.1 | 密码加密 |
| Class Validator | 0.14.1 | 数据验证 |

## 📊 数据库设计

### 核心数据表
1. **inquiries** - 咨询记录（城市、学段、性别、电话、状态等）
2. **conversations** - 对话记录（会话、消息、发送者等）
3. **banners** - 轮播图（标题、图片、链接、排序等）
4. **merchant_info** - 商家信息（名称、简介、服务、优势等）
5. **admins** - 管理员（用户名、密码、角色等）

### 关系设计
- Inquiry ←→ Conversation (一对多)
- 其他表独立管理

## 🔐 安全特性

- ✅ JWT Token 认证
- ✅ Bcrypt 密码加密
- ✅ CORS 跨域保护
- ✅ 环境变量隔离
- ✅ SQL 注入防护（Prisma ORM）
- ✅ DTO 数据验证

## 📈 性能优化

- ✅ Next.js 自动代码分割
- ✅ 数据库索引优化
- ✅ 响应数据压缩
- ✅ 图片懒加载
- ✅ API 请求缓存

## 🎨 UI/UX 设计

- ✅ 现代化界面设计
- ✅ 响应式布局
- ✅ 平滑动画效果
- ✅ 友好的错误提示
- ✅ 加载状态反馈

## 📝 API 接口

### 咨询相关
- `POST /api/inquiries` - 创建咨询
- `GET /api/inquiries` - 获取列表
- `GET /api/inquiries/stats` - 获取统计
- `PATCH /api/inquiries/:id` - 更新状态
- `DELETE /api/inquiries/:id` - 删除记录

### 对话相关
- `POST /api/conversations/message` - 发送消息
- `GET /api/conversations/session/:id` - 获取会话对话
- `POST /api/conversations/switch-agent` - 切换客服

### 轮播图相关
- `GET /api/banners` - 获取轮播图
- `POST /api/banners` - 创建轮播图
- `PATCH /api/banners/:id` - 更新
- `DELETE /api/banners/:id` - 删除
- `POST /api/banners/reorder` - 排序

### 商家信息
- `GET /api/merchant/active` - 获取启用商家
- `PATCH /api/merchant/:id` - 更新信息

### 认证相关
- `POST /api/auth/login` - 登录
- `POST /api/auth/register` - 注册
- `GET /api/auth/profile` - 获取个人信息

## 🚀 快速开始

### 一、环境准备
```bash
# 1. 安装 Node.js 18+
# 2. 安装 PostgreSQL 14+
# 3. 安装 pnpm
npm install -g pnpm
```

### 二、数据库设置
```bash
# 创建数据库
psql -U postgres
CREATE DATABASE teacherup;
\q
```

### 三、启动后端
```bash
cd backend
pnpm install
cp .env.example .env
# 编辑 .env 配置数据库连接
pnpm prisma migrate dev
pnpm start:dev
```

### 四、启动前端
```bash
cd frontend
pnpm install
cp .env.example .env.local
pnpm dev
```

### 五、创建管理员
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### 六、访问系统
- 用户端: http://localhost:3000
- 管理后台: http://localhost:3000/admin/login
- API 文档: http://localhost:3001/api

## 📖 文档说明

| 文档 | 说明 |
|------|------|
| [快速开始.md](快速开始.md) | 详细的启动步骤和常见问题 |
| [SETUP.md](SETUP.md) | 生产环境部署指南 |
| [FEATURES.md](FEATURES.md) | 完整功能列表和说明 |
| [ARCHITECTURE.md](ARCHITECTURE.md) | 系统架构和技术设计 |

## 🔧 开发工具推荐

- **IDE**: VS Code
- **扩展**:
  - Prisma
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
- **数据库**: Prisma Studio (`pnpm prisma studio`)
- **API 测试**: Postman / Thunder Client

## 📦 部署建议

### 开发环境
```bash
# 前端
cd frontend && pnpm dev

# 后端
cd backend && pnpm start:dev
```

### 生产环境
```bash
# 前端
cd frontend
pnpm build
pnpm start

# 后端
cd backend
pnpm build
pnpm start:prod
```

### Docker 部署
```bash
# 使用 docker-compose
docker-compose up -d
```

## 🎯 下一步扩展建议

### 功能扩展
- [ ] WebSocket 实时通讯
- [ ] 文件上传功能
- [ ] 短信/邮件通知
- [ ] 在线支付集成
- [ ] 用户评价系统
- [ ] 教师管理系统
- [ ] 课程预约日历

### 技术优化
- [ ] Redis 缓存层
- [ ] CDN 静态资源
- [ ] SSR/ISR 优化
- [ ] 单元测试
- [ ] E2E 测试
- [ ] 性能监控
- [ ] 错误追踪

### 运营功能
- [ ] 数据分析看板
- [ ] 营销活动管理
- [ ] 多城市支持
- [ ] 多角色权限
- [ ] 操作日志
- [ ] 导出报表

## 🐛 问题排查

### 常见问题
1. **数据库连接失败**: 检查 PostgreSQL 是否启动，`.env` 配置是否正确
2. **端口被占用**: 修改端口配置
3. **Prisma 迁移失败**: 运行 `pnpm prisma migrate reset`
4. **CORS 错误**: 检查后端 CORS 配置和前端 API_URL

详细问题请参考 [快速开始.md](快速开始.md) 的常见问题章节。

## 📄 License

MIT License

## 👥 开发团队

本项目由 AI 辅助开发完成，展示了现代 Web 开发的最佳实践。

## 🎉 总结

这是一个**生产就绪**的家教服务平台，具有：

✅ **完整的功能**: 用户端 + 管理后台  
✅ **现代化技术栈**: Next.js + Nest.js + PostgreSQL  
✅ **良好的代码组织**: 模块化、类型安全  
✅ **安全性考虑**: JWT、加密、验证  
✅ **扩展性**: 易于添加新功能  
✅ **文档完善**: 详细的部署和开发指南  

**可以立即部署使用，也可以根据业务需求进行二次开发！**

---

**快速启动**: 查看 [快速开始.md](快速开始.md)  
**技术细节**: 查看 [ARCHITECTURE.md](ARCHITECTURE.md)  
**功能列表**: 查看 [FEATURES.md](FEATURES.md)  
**生产部署**: 查看 [SETUP.md](SETUP.md)

祝您使用愉快！🚀

