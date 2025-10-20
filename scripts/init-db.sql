-- 初始化数据库脚本
-- 创建数据库
CREATE DATABASE teacherup;

-- 切换到数据库
\c teacherup;

-- 创建扩展（如果需要）
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 提示
SELECT 'Database teacherup created successfully!' as message;

