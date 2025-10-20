# TeacherUp 项目部署指南

## 🚀 快速部署

### 方法一：Docker Compose 一键部署（推荐）

1. **克隆项目到服务器**
```bash
git clone <your-repo-url>
cd teacherUp
```

2. **配置环境变量**
```bash
# 复制环境配置模板
cp env.production.example .env.production

# 编辑配置文件，修改数据库密码、JWT密钥等
nano .env.production
```

3. **一键部署**
```bash
# 运行部署脚本
./scripts/deploy.sh
```

### 方法二：手动部署

1. **启动服务**
```bash
# 构建并启动所有服务
docker-compose up --build -d

# 等待数据库启动
sleep 10

# 运行数据库迁移
docker-compose exec backend npx prisma migrate deploy

# 生成 Prisma 客户端
docker-compose exec backend npx prisma generate
```

## 📋 服务说明

- **前端**: http://localhost:3000
- **后端 API**: http://localhost:3001
- **Nginx 代理**: http://localhost:80
- **数据库**: PostgreSQL (端口 5432)

## 🔧 常用命令

```bash
# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 进入容器
docker-compose exec backend sh
docker-compose exec frontend sh
```

## 🗄️ 数据库管理

```bash
# 运行数据库迁移
docker-compose exec backend npx prisma migrate deploy

# 重置数据库
docker-compose exec backend npx prisma migrate reset

# 打开 Prisma Studio
docker-compose exec backend npx prisma studio
```

## 🔒 生产环境安全配置

1. **修改默认密码**
   - 数据库密码
   - JWT 密钥
   - 管理员密码

2. **配置 SSL 证书**
   - 将证书文件放在 `nginx/ssl/` 目录
   - 修改 `nginx/nginx.conf` 启用 HTTPS

3. **防火墙配置**
   - 只开放必要端口 (80, 443)
   - 限制数据库访问

## 📊 监控和维护

```bash
# 查看资源使用情况
docker stats

# 清理未使用的镜像
docker system prune -f

# 备份数据库
docker-compose exec postgres pg_dump -U postgres teacherup > backup.sql

# 恢复数据库
docker-compose exec -T postgres psql -U postgres teacherup < backup.sql
```

## 🐛 故障排除

1. **服务无法启动**
   - 检查端口是否被占用
   - 查看容器日志
   - 确认环境变量配置

2. **数据库连接失败**
   - 检查数据库容器状态
   - 确认数据库 URL 配置
   - 查看数据库日志

3. **前端无法访问后端**
   - 检查 Nginx 配置
   - 确认服务间网络连接
   - 查看防火墙设置
