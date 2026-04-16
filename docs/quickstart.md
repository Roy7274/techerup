# 快速开始指南

## 一、环境准备

### 必需软件
1. **Node.js** 18+ 
   - 下载: https://nodejs.org/
   
2. **PostgreSQL** 14+
   - Windows: https://www.postgresql.org/download/windows/
   - Mac: `brew install postgresql`
   
3. **包管理器**
   ```bash
   npm install -g pnpm
   ```

## 二、数据库设置

### 1. 启动 PostgreSQL
```bash
# Windows: 使用 pgAdmin 或服务管理器启动

# Mac/Linux
brew services start postgresql
```

### 2. 创建数据库
```bash
# 方式1: 使用 psql 命令
psql -U postgres
CREATE DATABASE teacherup;
\q

# 方式2: 使用图形界面（pgAdmin）
# 右键 Databases -> Create -> Database
# 名称: teacherup
```

## 三、后端启动

### 1. 进入后端目录
```bash
cd backend
```

### 2. 安装依赖
```bash
pnpm install
```

### 3. 配置环境变量
创建 `.env` 文件：
```env
DATABASE_URL="postgresql://postgres:你的密码@localhost:5432/teacherup?schema=public"
JWT_SECRET=my-super-secret-key-2024
JWT_EXPIRES_IN=7d
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

**注意**: 请将 `你的密码` 替换为您的 PostgreSQL 密码！

### 4. 数据库迁移
```bash
# 生成 Prisma Client
pnpm prisma generate

# 执行数据库迁移
pnpm prisma migrate dev --name init
```

### 5. 填充初始数据（可选）
```bash
# 如果有 seed 脚本
pnpm prisma db seed

# 或手动创建管理员
# 启动后端后访问: POST http://localhost:3001/api/auth/register
```

### 6. 启动后端
```bash
pnpm start:dev
```

看到 `✅ 数据库连接成功` 和 `🚀 服务器运行在: http://localhost:3001` 表示成功！

## 四、前端启动

### 1. 打开新终端，进入前端目录
```bash
cd frontend
```

### 2. 安装依赖
```bash
pnpm install
```

### 3. 配置环境变量
创建 `.env.local` 文件：
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SITE_NAME=学与思教育
```

### 4. 启动前端
```bash
pnpm dev
```

看到 `Ready in XXXms` 表示成功！

## 五、创建管理员账号

### 方式1: 使用 API（推荐）
```bash
# 在新终端执行
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"admin123\",\"email\":\"admin@example.com\"}"
```

### 方式2: 使用 Postman
- URL: `POST http://localhost:3001/api/auth/register`
- Body (JSON):
```json
{
  "username": "admin",
  "password": "admin123",
  "email": "admin@example.com"
}
```

## 六、访问系统

### 用户端
打开浏览器访问: http://localhost:3000

功能：
- ✅ 查看首页和轮播图
- ✅ 点击"在线咨询"体验对话系统
- ✅ 点击"预约试听"填写表单

### 管理后台
打开浏览器访问: http://localhost:3000/admin/login

登录信息：
- 用户名: `admin`
- 密码: `admin123`

功能：
- ✅ 查看数据概览
- ✅ 管理咨询记录
- ✅ 查看对话记录
- ✅ 管理轮播图
- ✅ 编辑商家信息

## 七、常见问题

### Q1: 数据库连接失败
```
Error: P1001: Can't reach database server
```
**解决方案**:
1. 确认 PostgreSQL 已启动
2. 检查 `.env` 中的数据库密码
3. 确认数据库名称为 `teacherup`

### Q2: 端口被占用
```
Error: Port 3000 is already in use
```
**解决方案**:
```bash
# 修改端口
# 前端: frontend/package.json 中的 dev 脚本
"dev": "next dev -p 3002"

# 后端: backend/.env 中的 PORT
PORT=3002
```

### Q3: Prisma 迁移失败
```
Error: P3005: The database schema is not empty
```
**解决方案**:
```bash
# 重置数据库（会删除所有数据！）
pnpm prisma migrate reset
```

### Q4: 前端无法连接后端
```
Network Error / CORS Error
```
**解决方案**:
1. 确认后端已启动（http://localhost:3001）
2. 检查 `frontend/.env.local` 中的 API_URL
3. 确认后端 CORS 配置正确

### Q5: 轮播图不显示
**解决方案**:
1. 登录后台管理
2. 进入"轮播图管理"
3. 添加至少一个轮播图
4. 确保轮播图状态为"启用"

## 八、开发建议

### 推荐的开发工具
1. **VS Code** + 扩展:
   - Prisma
   - ESLint
   - Prettier
   - Tailwind CSS IntelliSense

2. **数据库管理**:
   - Prisma Studio: `pnpm prisma studio`
   - pgAdmin 4

3. **API 测试**:
   - Postman
   - Thunder Client (VS Code 插件)

### 调试技巧
```bash
# 查看数据库数据
cd backend
pnpm prisma studio

# 查看后端日志
# 后端终端会实时显示所有请求

# 查看前端错误
# 浏览器控制台 (F12)
```

## 九、下一步

1. ✅ 体验完整的用户咨询流程
2. ✅ 在后台管理中配置轮播图和商家信息
3. ✅ 测试智能对话系统
4. ✅ 查看咨询数据统计
5. ✅ 根据需求定制功能

## 十、获取帮助

- 📖 查看 `FEATURES.md` 了解详细功能
- 🏗️ 查看 `ARCHITECTURE.md` 了解系统架构
- 🚀 查看 `SETUP.md` 了解生产部署

## 总结

现在您已经成功启动了家教平台系统！

**正在运行的服务**:
- ✅ 前端: http://localhost:3000
- ✅ 后台: http://localhost:3000/admin
- ✅ API: http://localhost:3001/api
- ✅ 数据库: PostgreSQL (localhost:5432)

**默认账号**:
- 用户名: admin
- 密码: admin123

祝您使用愉快！ 🎉
