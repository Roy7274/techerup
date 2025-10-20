#!/bin/bash

# TeacherUp 一键部署脚本
echo "🚀 开始部署 TeacherUp 项目..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 错误处理
set -e

# 检查 Docker 是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker 未安装，正在安装 Docker...${NC}"
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh
        sudo usermod -aG docker $USER
        echo -e "${GREEN}✅ Docker 安装完成${NC}"
    else
        echo -e "${GREEN}✅ Docker 已安装${NC}"
    fi
}

# 检查 Docker Compose 是否安装
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}❌ Docker Compose 未安装，正在安装...${NC}"
        sudo curl -L "https://github.com/docker/compose/releases/download/v2.21.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
        echo -e "${GREEN}✅ Docker Compose 安装完成${NC}"
    else
        echo -e "${GREEN}✅ Docker Compose 已安装${NC}"
    fi
}

# 创建环境变量文件
create_env_files() {
    echo -e "${YELLOW}📝 创建环境变量文件...${NC}"
    
    # 项目根目录 .env
    if [ ! -f .env ]; then
        cat > .env << EOF
# 数据库配置
DATABASE_URL=postgresql://teacherup:teacherup123@localhost:5432/teacherup

# JWT 密钥（生产环境请更换）
JWT_SECRET=$(openssl rand -base64 32)

# 后端端口
PORT=3001

# 环境
NODE_ENV=production

# 前端API地址
NEXT_PUBLIC_API_URL=http://localhost:3001

# 文件上传目录
UPLOAD_DIR=uploads

# 日志级别
LOG_LEVEL=info
EOF
        echo -e "${GREEN}✅ 创建根目录 .env 文件${NC}"
    fi

    # 后端 .env
    if [ ! -f backend/.env ]; then
        cat > backend/.env << EOF
# 数据库配置
DATABASE_URL=postgresql://teacherup:teacherup123@postgres:5432/teacherup

# JWT 密钥
JWT_SECRET=$(openssl rand -base64 32)

# 端口
PORT=3001

# 环境
NODE_ENV=production

# 文件上传目录
UPLOAD_DIR=uploads

# 日志级别
LOG_LEVEL=info
EOF
        echo -e "${GREEN}✅ 创建后端 .env 文件${NC}"
    fi

    # 前端 .env
    if [ ! -f frontend/.env ]; then
        cat > frontend/.env << EOF
# API 基础地址
NEXT_PUBLIC_API_URL=http://localhost:3001

# 应用名称
NEXT_PUBLIC_APP_NAME=TeacherUp
EOF
        echo -e "${GREEN}✅ 创建前端 .env 文件${NC}"
    fi
}

# 清理旧容器和镜像
cleanup() {
    echo -e "${YELLOW}🧹 清理旧容器和镜像...${NC}"
    docker-compose down -v --remove-orphans || true
    docker system prune -f || true
    echo -e "${GREEN}✅ 清理完成${NC}"
}

# 构建和启动服务
deploy() {
    echo -e "${YELLOW}🔨 构建和启动服务...${NC}"
    
    # 构建镜像
    echo -e "${YELLOW}📦 构建 Docker 镜像...${NC}"
    docker-compose build --no-cache
    
    # 启动服务
    echo -e "${YELLOW}🚀 启动服务...${NC}"
    docker-compose up -d
    
    # 检查服务状态
    echo -e "${YELLOW}⏳ 等待服务启动...${NC}"
    sleep 30
    
    # 显示服务状态
    docker-compose ps
}

# 健康检查
health_check() {
    echo -e "${YELLOW}🏥 进行健康检查...${NC}"
    
    # 检查数据库
    if docker-compose exec -T postgres pg_isready -U teacherup; then
        echo -e "${GREEN}✅ 数据库连接正常${NC}"
    else
        echo -e "${RED}❌ 数据库连接失败${NC}"
        exit 1
    fi
    
    # 检查后端服务
    if curl -f http://localhost:3001/health 2>/dev/null; then
        echo -e "${GREEN}✅ 后端服务正常${NC}"
    else
        echo -e "${RED}❌ 后端服务异常${NC}"
        echo -e "${YELLOW}📋 后端服务日志:${NC}"
        docker-compose logs backend
    fi
    
    # 检查前端服务
    if curl -f http://localhost:3000 2>/dev/null; then
        echo -e "${GREEN}✅ 前端服务正常${NC}"
    else
        echo -e "${RED}❌ 前端服务异常${NC}"
        echo -e "${YELLOW}📋 前端服务日志:${NC}"
        docker-compose logs frontend
    fi
    
    # 检查 Nginx
    if curl -f http://localhost 2>/dev/null; then
        echo -e "${GREEN}✅ Nginx 代理正常${NC}"
    else
        echo -e "${RED}❌ Nginx 代理异常${NC}"
        echo -e "${YELLOW}📋 Nginx 日志:${NC}"
        docker-compose logs nginx
    fi
}

# 显示部署信息
show_info() {
    echo -e "${GREEN}🎉 部署完成！${NC}"
    echo -e "${YELLOW}📋 服务信息:${NC}"
    echo -e "  🌐 前端地址: http://localhost (Nginx 代理)"
    echo -e "  🌐 前端直接访问: http://localhost:3000"
    echo -e "  🔧 后端 API: http://localhost:3001"
    echo -e "  🗄️  数据库: localhost:5432"
    echo ""
    echo -e "${YELLOW}📋 常用命令:${NC}"
    echo -e "  查看服务状态: docker-compose ps"
    echo -e "  查看日志: docker-compose logs -f [服务名]"
    echo -e "  停止服务: docker-compose down"
    echo -e "  重启服务: docker-compose restart"
    echo ""
    echo -e "${YELLOW}📋 管理地址:${NC}"
    echo -e "  后台管理: http://localhost/admin"
    echo ""
}

# 主函数
main() {
    echo -e "${GREEN}🎯 TeacherUp 快速部署脚本${NC}"
    echo "=================================="
    
    # 检查依赖
    check_docker
    check_docker_compose
    
    # 创建环境变量文件
    create_env_files
    
    # 清理环境
    cleanup
    
    # 部署服务
    deploy
    
    # 健康检查
    health_check
    
    # 显示部署信息
    show_info
}

# 参数处理
case "$1" in
    "cleanup")
        cleanup
        ;;
    "logs")
        docker-compose logs -f "${2:-}"
        ;;
    "restart")
        docker-compose restart "${2:-}"
        ;;
    "stop")
        docker-compose down
        ;;
    "status")
        docker-compose ps
        ;;
    *)
        main
        ;;
esac
