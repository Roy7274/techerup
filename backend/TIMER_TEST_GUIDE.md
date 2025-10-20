# 定时自动回复测试指南

## 问题修复

已修复以下问题：
1. ✅ 添加了 `ScheduleModule.forRoot()` 到主应用模块
2. ✅ 修复了定时任务服务的WebSocket通知
3. ✅ 优化了触发延迟从2分钟改为30秒
4. ✅ 添加了详细的日志记录

## 定时任务配置

**当前配置：**
- 检查间隔：每10秒一次
- 发送间隔：每个询问30秒内不重复发送
- 处理范围：最近24小时内的活跃会话
- 限制条件：未转人工的会话
- 人工客服暂停：客服回复后暂停3分钟

## 测试步骤

### 1. 启动服务
```bash
cd backend
npm run start:dev
```

### 2. 检查定时任务启动
查看控制台日志，应该看到：
```
[Nest] AutoReplySchedulerService - 定时任务已启动
```

### 3. 配置自动回复
在后台管理界面创建以下自动回复：

**城市询问（优先级90）：**
```json
{
  "name": "城市询问",
  "triggerType": "scheduled",
  "message": "请选择您所在的城市：",
  "hasOptions": true,
  "options": [
    {"label": "北京", "fieldName": "city", "fieldValue": "北京"},
    {"label": "上海", "fieldName": "city", "fieldValue": "上海"},
    {"label": "广州", "fieldName": "city", "fieldValue": "广州"}
  ],
  "priority": 90,
  "isActive": true
}
```

**学段询问（优先级80）：**
```json
{
  "name": "学段询问",
  "triggerType": "scheduled",
  "message": "请问孩子是小学、初中还是高中呢？",
  "hasOptions": true,
  "options": [
    {"label": "小学", "fieldName": "grade", "fieldValue": "小学"},
    {"label": "初中", "fieldName": "grade", "fieldValue": "初中"},
    {"label": "高中", "fieldName": "grade", "fieldValue": "高中"}
  ],
  "priority": 80,
  "isActive": true
}
```

### 4. 测试流程
1. 用户进入聊天界面
2. 发送任意消息（如"你好"）
3. 等待10-30秒，系统应该自动发送城市询问消息
4. 继续等待30秒，系统应该发送学段询问
5. 继续等待30秒，系统应该发送性别询问
6. 用户点击选项后，该字段被标记为已填写，不再询问
7. 系统继续发送下一个未填写的询问

### 5. 监控日志
查看控制台日志：
```
[Nest] AutoReplySchedulerService - 开始检查定时自动回复...
[Nest] AutoReplySchedulerService - 找到 X 个活跃会话
[Nest] AutoReplySchedulerService - 已发送定时自动回复到会话 session_xxx: 城市询问
```

## 故障排除

### 如果定时任务没有启动
1. 检查 `app.module.ts` 是否导入了 `ScheduleModule.forRoot()`
2. 检查 `AutoReplySchedulerService` 是否被正确注册
3. 重启服务

### 如果定时任务没有触发
1. 检查是否有配置 `scheduled` 类型的自动回复
2. 检查自动回复是否启用（`isActive: true`）
3. 检查会话是否在活跃状态（最近24小时内有活动）
4. 检查会话是否已转人工（`isAgent: false`）

### 如果消息没有发送到前端
1. 检查WebSocket连接是否正常
2. 检查 `ConversationGateway` 是否正确注入
3. 查看浏览器控制台是否有WebSocket错误

## 性能优化

- 定时任务每分钟执行一次，处理最多100个活跃会话
- 自动回复暂停机制避免重复发送
- 日志记录便于调试和监控

## 注意事项

1. 确保数据库连接正常
2. 确保WebSocket服务正常运行
3. 定时任务依赖系统时间，确保服务器时间准确
4. 大量会话时注意性能影响
