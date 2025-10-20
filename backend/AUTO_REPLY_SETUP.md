# 自动回复系统配置指南

## 概述

新的自动回复系统完全基于后台配置，支持定时发送带选项的询问消息，用户可以通过点击选项来回复机器人。

## 功能特性

- ✅ 完全使用后台配置的自动回复
- ✅ 定时发送带选项的询问消息
- ✅ 选项点击验证，防止数据错乱
- ✅ 智能表单数据管理
- ✅ 防重复发送机制
- ✅ 支持多种触发类型

## 自动回复类型

### 1. 欢迎语 (triggerType: 'welcome')
用户首次进入时发送的欢迎消息。

**配置示例：**
```json
{
  "name": "欢迎语",
  "triggerType": "welcome",
  "message": "您好！欢迎咨询我们的家教服务，请选择您所在的城市：",
  "hasOptions": true,
  "options": [
    {"label": "北京", "fieldName": "city", "fieldValue": "北京"},
    {"label": "上海", "fieldName": "city", "fieldValue": "上海"},
    {"label": "广州", "fieldName": "city", "fieldValue": "广州"},
    {"label": "深圳", "fieldName": "city", "fieldValue": "深圳"}
  ],
  "priority": 100,
  "isActive": true
}
```

### 2. 关键词回复 (triggerType: 'keyword')
匹配用户消息中的关键词时触发。

**配置示例：**
```json
{
  "name": "价格咨询",
  "triggerType": "keyword",
  "keywords": ["价格", "费用", "多少钱", "收费"],
  "message": "我们的收费标准如下：\n小学：100元/小时\n初中：120元/小时\n高中：150元/小时",
  "hasOptions": false,
  "priority": 80,
  "isActive": true
}
```

### 3. 默认回复 (triggerType: 'default')
当没有其他匹配时的回复。这是系统的兜底回复，当用户的消息不匹配任何关键词时触发。

**配置示例：**
```json
{
  "name": "默认回复",
  "triggerType": "default",
  "message": "感谢您的咨询！如需了解更多信息，请随时告诉我。",
  "hasOptions": false,
  "priority": 10,
  "isActive": true
}
```

**注意：** 默认回复会在以下情况触发：
- 用户消息不匹配任何关键词
- 没有配置定时询问
- 系统无法找到其他合适的回复

### 4. 定时询问 (triggerType: 'scheduled')
按顺序发送的询问消息，用于收集用户信息。

**配置示例：**

**城市询问：**
```json
{
  "name": "城市询问",
  "triggerType": "scheduled",
  "message": "请选择您所在的城市：",
  "hasOptions": true,
  "options": [
    {"label": "北京", "fieldName": "city", "fieldValue": "北京"},
    {"label": "上海", "fieldName": "city", "fieldValue": "上海"},
    {"label": "广州", "fieldName": "city", "fieldValue": "广州"},
    {"label": "深圳", "fieldName": "city", "fieldValue": "深圳"},
    {"label": "其他城市", "fieldName": "city", "fieldValue": "其他"}
  ],
  "priority": 90,
  "isActive": true
}
```

**学段询问：**
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

**性别询问：**
```json
{
  "name": "性别询问",
  "triggerType": "scheduled",
  "message": "请问是男孩还是女孩呢？",
  "hasOptions": true,
  "options": [
    {"label": "男孩", "fieldName": "studentGender", "fieldValue": "男孩"},
    {"label": "女孩", "fieldName": "studentGender", "fieldValue": "女孩"}
  ],
  "priority": 70,
  "isActive": true
}
```

**身份询问：**
```json
{
  "name": "身份询问",
  "triggerType": "scheduled",
  "message": "请问您是孩子本人还是家长呢？",
  "hasOptions": true,
  "options": [
    {"label": "本人", "fieldName": "identity", "fieldValue": "本人"},
    {"label": "家长", "fieldName": "identity", "fieldValue": "家长"}
  ],
  "priority": 60,
  "isActive": true
}
```

**电话询问：**
```json
{
  "name": "电话询问",
  "triggerType": "scheduled",
  "message": "请留下您的联系电话，我们的老师会尽快与您联系安排试课时间。",
  "hasOptions": false,
  "priority": 50,
  "isActive": true
}
```

## 配置说明

### 字段说明

- **name**: 自动回复名称（管理用）
- **triggerType**: 触发类型（welcome/keyword/default/scheduled）
- **keywords**: 关键词数组（仅keyword类型需要）
- **message**: 回复内容
- **hasOptions**: 是否包含可点击选项
- **options**: 选项数组
- **priority**: 优先级（数字越大优先级越高）
- **isActive**: 是否启用

### 选项格式

每个选项包含：
- **label**: 显示给用户的文本
- **fieldName**: 对应的表单字段名
- **fieldValue**: 选项的值

### 优先级规则

1. **welcome**: 优先级最高（100）
2. **scheduled**: 按顺序递减（90, 80, 70, 60, 50...）
3. **keyword**: 中等优先级（80）
4. **default**: 最低优先级（10）

## 工作流程

1. **用户进入**：发送欢迎语或第一个定时询问
2. **定时检查**：每分钟检查活跃会话，发送下一个询问
3. **用户点击**：验证选项匹配，保存数据，发送下一个询问
4. **智能跳过**：已填写的字段不会重复询问
5. **防重复**：5分钟内不重复发送相同询问

## 定时任务

系统每分钟执行以下任务：
- 检查活跃会话（最近24小时内有活动）
- 发送下一个应该询问的问题
- 清理过期的暂停记录

### 定时任务配置

**触发条件：**
- 检查间隔：每10秒一次
- 发送间隔：每个询问30秒内不重复发送
- 处理范围：最近24小时内的活跃会话
- 限制条件：未转人工的会话

**工作流程：**
1. 每10秒检查所有活跃会话
2. 检查是否有人工客服最近3分钟回复过（如有则暂停）
3. 获取下一个应该发送的定时询问
4. 检查该询问是否30秒内已发送过（如有则跳过）
5. 发送自动回复并通知前端
6. 记录日志便于调试

**智能逻辑：**
- 按优先级顺序发送询问（城市→学段→性别→身份→电话）
- 已填写的字段不会重复询问
- 人工客服回复后暂停3分钟
- 每个询问30秒内不重复发送

**日志监控：**
- 启动时查看控制台日志确认定时任务已启动
- 执行时会显示"开始检查定时自动回复..."
- 发送消息时会显示"已发送定时自动回复到会话"

## 安全特性

- **选项验证**：确保用户点击的选项属于对应的消息
- **防重复发送**：避免短时间内重复发送相同消息
- **数据一致性**：确保表单数据正确保存到对应字段
- **会话隔离**：每个会话独立管理，互不影响

## 注意事项

1. **定时询问必须按优先级顺序配置**，确保询问顺序正确
2. **每个定时询问的fieldName必须唯一**，避免数据冲突
3. **选项的fieldName和fieldValue必须与表单字段对应**
4. **建议为每个询问设置合适的优先级**，确保发送顺序

## 测试建议

1. 创建完整的定时询问序列
2. 测试用户点击选项的流程
3. 验证表单数据是否正确保存
4. 检查防重复发送机制
5. 测试关键词匹配功能

通过以上配置，您的自动回复系统将能够智能地引导用户填写信息，提供良好的用户体验。
