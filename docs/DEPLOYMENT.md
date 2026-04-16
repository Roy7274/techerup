# TeacherUp 快速部署指南

## 🚀 一键部署

最简单的部署方式就是使用我们提供的一键部署脚本：

```bash
# 给脚本执行权限（如果还没有的话）
chmod +x deploy.sh

# 运行一键部署
./deploy.sh
```

## 📋 部署内容

这个部署脚本会自动为您：

1. ✅ 检查并安装 Docker 和 Docker Compose
2. ✅ 自动生成安全的环境变量文件
3. ✅ 构建前端和后端 Docker 镜像
4. ✅ 启动所有服务（前端、后端、数据库、Nginx）
5. ✅ 进行健康检查确保服务正常运行
6. ✅ 显示访问地址和管理命令

## 🌐 服务地址

部署完成后，您可以通过以下地址访问：

- **主要访问地址**: http://your-server-ip
- **前端直接访问**: http://your-server-ip:3000
- **后端 API**: http://your-server-ip:3001
- **管理后台**: http://your-server-ip/admin

## 🛠️ 常用管理命令

```bash
# 查看服务状态
./deploy.sh status
# 或者
docker-compose ps

# 查看所有服务日志
./deploy.sh logs

# 查看特定服务日志
./deploy.sh logs frontend
./deploy.sh logs backend

# 重启服务
./deploy.sh restart

# 停止所有服务
./deploy.sh stop

# 清理环境（重新部署前使用）
./deploy.sh cleanup
```

## 📁 项目结构

```
teacherUp/
├── frontend/              # Next.js 前端
│   ├── Dockerfile        # 前端容器配置
│   └── ...
├── backend/              # NestJS 后端
│   ├── Dockerfile       # 后端容器配置
│   └── ...
├── nginx/               # Nginx 配置
│   └── nginx.conf      # 反向代理配置
├── docker-compose.yml   # 服务编排
├── deploy.sh           # 一键部署脚本
└── DEPLOYMENT.md       # 本文档
```

## 🔧 环境变量配置

脚本会自动生成以下环境变量文件：

- `.env` - 项目根目录配置
- `backend/.env` - 后端服务配置
- `frontend/.env` - 前端服务配置

如需自定义配置，请在运行部署脚本前手动创建这些文件。

## 🐳 Docker 服务说明

### 服务列表

1. **postgres** - PostgreSQL 数据库
   - 端口: 5432
   - 数据库: teacherup
   - 用户: teacherup

2. **backend** - NestJS 后端服务
   - 端口: 3001
   - 自动数据库迁移
   - 健康检查: `/health`

3. **frontend** - Next.js 前端服务
   - 端口: 3000
   - 生产模式构建

4. **nginx** - 反向代理服务
   - 端口: 80, 443
   - 自动路由到前后端服务

## 🔒 安全配置

### 生产环境建议

1. **更改默认密码**:
   ```bash
   # 编辑 docker-compose.yml 中的数据库密码
   vim docker-compose.yml
   ```

2. **配置 SSL 证书**:
   ```bash
   # 将 SSL 证书放到 nginx/ssl/ 目录
   mkdir -p nginx/ssl
   # 复制证书文件
   cp your-cert.crt nginx/ssl/
   cp your-cert.key nginx/ssl/
   ```

3. **更新 JWT 密钥**:
   ```bash
   # 生成新的 JWT 密钥
   openssl rand -base64 32
   # 更新 backend/.env 中的 JWT_SECRET
   ```

## 🚨 故障排除

### 常见问题

1. **端口占用**:
   ```bash
   # 检查端口占用
   sudo netstat -tulpn | grep :80
   sudo netstat -tulpn | grep :3000
   sudo netstat -tulpn | grep :3001
   ```

2. **服务无法启动**:
   ```bash
   # 查看详细日志
   docker-compose logs -f [服务名]
   ```

3. **数据库连接失败**:
   ```bash
   # 检查数据库状态
   docker-compose exec postgres pg_isready -U teacherup
   ```

4. **权限问题**:
   ```bash
   # 确保脚本有执行权限
   chmod +x deploy.sh
   
   # 确保当前用户在 docker 组
   sudo usermod -aG docker $USER
   # 需要重新登录生效
   ```

## 📊 监控与维护

### 日志管理

```bash
# 实时查看所有日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend

# 限制日志行数
docker-compose logs --tail=100 frontend
```

### 数据备份

```bash
# 备份数据库
docker-compose exec postgres pg_dump -U teacherup teacherup > backup.sql

# 恢复数据库
docker-compose exec -T postgres psql -U teacherup teacherup < backup.sql
```

### 更新部署

```bash
# 停止服务
./deploy.sh stop

# 拉取最新代码
git pull

# 重新部署
./deploy.sh
```

## 🤖 使用 GitHub Actions 构建并推送到 Docker Hub

我们提供了工作流 `.github/workflows/dockerhub.yml`，可以在 GitHub 上自动构建并推送前后端镜像到 Docker Hub。

### 1. 准备 Docker Hub 凭据

- 在 Docker Hub 创建 Access Token（Settings → Security）
- 在 GitHub 仓库的 Settings → Secrets and variables → Actions 中新增：
  - `DOCKERHUB_TOKEN`：填入你的 Docker Hub Access Token

### 2. 触发工作流

- 手动触发（可指定 tag）
  - 进入仓库的 Actions → Build and Push Docker images to Docker Hub → Run workflow
  - 输入 `tag`（默认为 `latest`）

- 自动触发
  - 当 `main` 分支有变更并涉及 `frontend/**` 或 `backend/**` 时，会自动构建并推送

### 3. 拉取并运行

```bash
# 前端
docker pull docker.io/roy7274/teacherup-frontend:<tag>

# 后端
docker pull docker.io/roy7274/teacherup-backend:<tag>

# 在服务器的 docker-compose.yml 中替换 image，并启动
docker compose up -d
```

## 📞 技术支持

如果遇到部署问题，请检查：

1. Docker 和 Docker Compose 是否正确安装
2. 服务器防火墙是否开放相应端口
3. 服务器资源是否充足（内存建议 2GB+）
4. 查看详细的服务日志排查具体问题

---

**祝您部署顺利！** 🎉
