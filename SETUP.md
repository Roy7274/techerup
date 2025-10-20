# 快速部署指南

## 环境准备

### 1. 安装依赖
确保已安装：
- Node.js 18+
- PostgreSQL 14+
- pnpm 8+ (推荐) 或 npm

### 2. 数据库设置

创建 PostgreSQL 数据库：
```bash
# 登录 PostgreSQL
psql -U postgres

# 创建数据库
CREATE DATABASE teacherup;

# 退出
\q
```

## 后端部署

### 1. 安装依赖
```bash
cd backend
pnpm install
# 或
npm install
```

### 2. 配置环境变量
复制 `.env.example` 为 `.env` 并修改：
```bash
cp .env.example .env
```

编辑 `.env` 文件：
```env
DATABASE_URL="postgresql://postgres:你的密码@localhost:5432/teacherup?schema=public"
JWT_SECRET=your-random-secret-key-here
JWT_EXPIRES_IN=7d
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### 3. 数据库迁移
```bash
# 生成 Prisma Client
pnpm prisma generate

# 运行数据库迁移
pnpm prisma migrate dev --name init

# (可选) 打开 Prisma Studio 查看数据
pnpm prisma studio
```

### 4. 创建管理员账号
启动后端后，使用 API 创建管理员：
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123",
    "email": "admin@example.com"
  }'
```

### 5. 启动后端
```bash
pnpm start:dev
# 或
npm run start:dev
```

后端将运行在 http://localhost:3001

## 前端部署

### 1. 安装依赖
```bash
cd frontend
pnpm install
# 或
npm install
```

### 2. 配置环境变量
复制 `.env.example` 为 `.env.local`：
```bash
cp .env.example .env.local
```

编辑 `.env.local`：
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SITE_NAME=学与思教育
```

### 3. 启动前端
```bash
pnpm dev
# 或
npm run dev
```

前端将运行在 http://localhost:3000

## 初始化数据

### 1. 添加轮播图
登录后台管理：http://localhost:3000/admin/login
- 用户名：admin
- 密码：admin123

在"轮播图管理"中添加轮播图。

### 2. 配置商家信息
在"商家信息"中配置机构信息、服务特色、师资优势等。

## 生产环境部署

### 后端
```bash
cd backend

# 构建
pnpm build

# 生产环境启动
pnpm start:prod
```

### 前端
```bash
cd frontend

# 构建
pnpm build

# 生产环境启动
pnpm start
```

## Docker 部署（可选）

创建 `docker-compose.yml`：
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: teacherup
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: your_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://postgres:your_password@postgres:5432/teacherup
      JWT_SECRET: your-secret-key
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001
    depends_on:
      - backend

volumes:
  postgres_data:
```

启动：
```bash
docker-compose up -d
```

## 常见问题

### 1. 数据库连接失败
- 检查 PostgreSQL 是否已启动
- 检查 DATABASE_URL 配置是否正确
- 检查防火墙设置

### 2. 前端无法连接后端
- 确认后端已启动
- 检查 NEXT_PUBLIC_API_URL 配置
- 检查 CORS 设置

### 3. Prisma 迁移失败
```bash
# 重置数据库（注意：会删除所有数据）
pnpm prisma migrate reset

# 重新生成 Client
pnpm prisma generate
```

## 技术支持

如有问题，请查看：
- GitHub Issues
- 项目文档
- 联系开发团队

