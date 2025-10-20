# 功能详细说明

## 一、用户端功能

### 1.1 首页展示
- ✅ 响应式设计，适配移动端和桌面端
- ✅ 动态轮播图展示（支持后台配置）
- ✅ 服务特色卡片展示
- ✅ 商家信息展示（简介、服务、师资优势）
- ✅ 在线人数显示（模拟）
- ✅ 固定位置快捷按钮（预约试听、在线咨询）

### 1.2 在线咨询系统
#### 对话窗口
- ✅ 模态框形式，不影响主页浏览
- ✅ 实时对话界面
- ✅ 消息气泡动画效果
- ✅ 打字指示器（思考中提示）

#### 智能回复
- ✅ 自动欢迎语
- ✅ 按序引导信息收集：
  1. 所在城市
  2. 学段（小学/初中/高中）
  3. 学生性别（男孩/女孩）
  4. 咨询身份（本人/家长）
  5. 联系电话
- ✅ 信息收集完成后的感谢语

#### 人工介入
- ✅ "转人工"按钮
- ✅ 保留历史对话记录
- ✅ 切换提示消息

### 1.3 预约表单系统
- ✅ 固定左下角"预约试听"按钮
- ✅ 模态框表单，快捷填写
- ✅ 自动获取用户城市（基于浏览器定位）
- ✅ 必填项验证
- ✅ 手机号格式验证
- ✅ 提交成功提示
- ✅ 数据直接存入后台

### 1.4 用户体验优化
- ✅ 平滑滚动动画
- ✅ 加载状态提示
- ✅ 错误友好提示
- ✅ 响应式布局
- ✅ 现代化 UI 设计

---

## 二、管理后台功能

### 2.1 登录认证
- ✅ JWT Token 认证
- ✅ 密码加密存储（bcrypt）
- ✅ 自动登录状态维护
- ✅ 退出登录功能

### 2.2 数据概览（Dashboard）
#### 统计卡片
- ✅ 总咨询数统计
- ✅ 已联系数量
- ✅ 未联系数量
- ✅ 今日新增（可扩展）

#### 数据分析
- ✅ 按城市统计分布
- ✅ 按学段统计分布
- ✅ 最近咨询列表（前10条）

### 2.3 咨询管理
#### 列表功能
- ✅ 分页显示所有咨询记录
- ✅ 多维度筛选：
  - 按城市筛选
  - 按学段筛选
  - 按联系状态筛选
  - 按日期范围筛选
- ✅ 排序功能（按提交时间）
- ✅ 状态标签显示

#### 单条记录操作
- ✅ 查看详情（含对话记录）
- ✅ 标记已联系/未联系
- ✅ 删除记录（需二次确认）
- ✅ 添加备注（可扩展）

#### 详情查看
- ✅ 完整用户信息展示
- ✅ 关联对话记录展示
- ✅ 时间线形式显示

### 2.4 对话记录管理
- ✅ 查看所有有对话的咨询
- ✅ 对话数量统计
- ✅ 最后对话时间显示
- ✅ 完整对话内容查看
- ✅ 区分发送者（用户/机器人/客服）
- ✅ 时间戳显示

### 2.5 轮播图管理
#### 列表功能
- ✅ 显示所有轮播图
- ✅ 缩略图预览
- ✅ 排序显示
- ✅ 启用/禁用状态

#### 编辑功能
- ✅ 添加新轮播图
- ✅ 编辑现有轮播图
- ✅ 删除轮播图（需确认）
- ✅ 设置跳转链接
- ✅ 排序调整
- ✅ 启用/禁用切换

#### 字段配置
- ✅ 标题
- ✅ 图片地址
- ✅ 跳转链接（可选）
- ✅ 描述信息（可选）
- ✅ 排序权重
- ✅ 启用状态

### 2.6 商家信息管理
#### 基础信息
- ✅ 机构名称
- ✅ 机构简介（富文本）
- ✅ 营业时间
- ✅ Logo 地址
- ✅ 封面图地址

#### 动态内容
- ✅ 服务特色（数组，可动态添加/删除）
- ✅ 师资优势（数组，可动态添加/删除）
- ✅ 联系方式（电话、地址等）

#### 状态控制
- ✅ 启用/禁用商家信息
- ✅ 实时同步到前端

---

## 三、后端 API 功能

### 3.1 咨询 API
```
POST   /api/inquiries          - 创建咨询记录
GET    /api/inquiries          - 获取咨询列表（支持筛选）
GET    /api/inquiries/stats    - 获取统计数据
GET    /api/inquiries/:id      - 获取单条记录
PATCH  /api/inquiries/:id      - 更新记录
DELETE /api/inquiries/:id      - 删除记录
```

### 3.2 对话 API
```
POST   /api/conversations/message       - 发送消息（自动回复）
GET    /api/conversations/session/:id   - 获取会话对话
GET    /api/conversations/inquiry/:id   - 获取咨询对话
POST   /api/conversations/switch-agent  - 切换人工客服
```

### 3.3 轮播图 API
```
GET    /api/banners           - 获取轮播图（支持筛选）
POST   /api/banners           - 创建轮播图
PATCH  /api/banners/:id       - 更新轮播图
DELETE /api/banners/:id       - 删除轮播图
POST   /api/banners/reorder   - 批量排序
```

### 3.4 商家信息 API
```
GET    /api/merchant          - 获取所有商家
GET    /api/merchant/active   - 获取启用的商家
PATCH  /api/merchant/:id      - 更新商家信息
```

### 3.5 认证 API
```
POST   /api/auth/login        - 登录
POST   /api/auth/register     - 注册
GET    /api/auth/profile      - 获取个人信息
```

---

## 四、数据库设计

### 4.1 核心表结构

#### inquiries - 咨询记录表
- id (UUID)
- city (String) - 城市
- grade (String) - 学段
- identity (String) - 咨询身份
- studentGender (String) - 学生性别
- phone (String) - 联系电话
- status (String) - 联系状态
- notes (Text) - 备注
- createdAt, updatedAt

#### conversations - 对话记录表
- id (UUID)
- inquiryId (UUID, FK) - 关联咨询
- sessionId (String) - 会话ID
- sender (String) - 发送者
- message (Text) - 消息内容
- metadata (JSON) - 元数据
- createdAt

#### banners - 轮播图表
- id (UUID)
- title (String) - 标题
- imageUrl (String) - 图片地址
- link (String) - 跳转链接
- order (Int) - 排序
- isActive (Boolean) - 是否启用
- description (Text) - 描述
- createdAt, updatedAt

#### merchant_info - 商家信息表
- id (UUID)
- name (String) - 机构名称
- description (Text) - 简介
- services (JSON) - 服务特色
- advantages (JSON) - 师资优势
- contact (JSON) - 联系方式
- businessHours (String) - 营业时间
- logoUrl, coverUrl (String)
- isActive (Boolean)
- createdAt, updatedAt

#### admins - 管理员表
- id (UUID)
- username (String, unique)
- password (String, hashed)
- email (String)
- role (String)
- isActive (Boolean)
- lastLogin (DateTime)
- createdAt, updatedAt

---

## 五、技术特性

### 5.1 前端技术
- ✅ Next.js 14 App Router
- ✅ React 18 Hooks
- ✅ TypeScript 类型安全
- ✅ Tailwind CSS 样式
- ✅ Ant Design 组件库
- ✅ Axios HTTP 客户端
- ✅ Zustand 状态管理（可选）
- ✅ React Hook Form 表单处理

### 5.2 后端技术
- ✅ Nest.js 框架
- ✅ Prisma ORM
- ✅ PostgreSQL 数据库
- ✅ JWT 认证
- ✅ Bcrypt 密码加密
- ✅ Class Validator 数据验证
- ✅ CORS 跨域支持

### 5.3 开发体验
- ✅ TypeScript 全栈类型安全
- ✅ ESLint + Prettier 代码规范
- ✅ 热更新开发模式
- ✅ 模块化代码组织
- ✅ RESTful API 设计

### 5.4 生产就绪
- ✅ 环境变量配置
- ✅ 数据库迁移系统
- ✅ 错误处理机制
- ✅ 请求拦截器
- ✅ 响应统一格式
- ✅ 安全性考虑（JWT、密码加密）

---

## 六、扩展功能建议

### 6.1 用户端
- 📋 用户登录/注册
- 📋 历史咨询记录查看
- 📋 课程预约日历
- 📋 在线支付
- 📋 用户评价系统
- 📋 教师展示页面

### 6.2 管理后台
- 📋 数据可视化图表
- 📋 导出报表功能
- 📋 短信/邮件通知
- 📋 多角色权限管理
- 📋 操作日志记录
- 📋 系统配置管理
- 📋 文件上传功能

### 6.3 技术优化
- 📋 Redis 缓存
- 📋 WebSocket 实时通讯
- 📋 CDN 静态资源
- 📋 SSR/ISR 优化
- 📋 性能监控
- 📋 错误追踪（Sentry）
- 📋 自动化测试

---

## 总结

本项目已实现家教平台的核心功能，包括：
- ✅ 完整的用户咨询流程
- ✅ 智能对话系统
- ✅ 功能完善的管理后台
- ✅ 现代化的技术栈
- ✅ 良好的代码组织和扩展性

可以快速部署并投入使用，后续可根据业务需求继续扩展功能。

