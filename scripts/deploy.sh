#!/bin/bash

# 部署脚本
set -e

echo "🚀 开始部署 TeacherUp 项目..."

# 检查 Docker 和 Docker Compose
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

# 停止现有容器
echo "🛑 停止现有容器..."
docker-compose down

# 清理旧镜像（可选）
echo "🧹 清理旧镜像..."
docker system prune -f

# 构建并启动服务
echo "🔨 构建并启动服务..."
docker-compose up --build -d

# 等待数据库启动
echo "⏳ 等待数据库启动..."
sleep 10

# 运行数据库迁移
echo "📊 运行数据库迁移..."
docker-compose exec backend npx prisma migrate deploy

# 生成 Prisma 客户端
echo "🔧 生成 Prisma 客户端..."
docker-compose exec backend npx prisma generate

# 检查服务状态
echo "✅ 检查服务状态..."
docker-compose ps

echo "🎉 部署完成！"
echo "📱 前端地址: http://localhost:3000"
echo "🔧 后端地址: http://localhost:3001"
echo "🌐 Nginx 地址: http://localhost:80"

# 显示日志
echo "📋 查看日志: docker-compose logs -f"
