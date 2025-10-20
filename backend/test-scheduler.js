// 测试定时任务是否正常工作
const { AutoReplySchedulerService } = require('./dist/modules/auto-reply/auto-reply-scheduler.service');

console.log('定时任务配置：');
console.log('- 检查间隔：每分钟一次');
console.log('- 触发条件：用户消息后30秒无响应');
console.log('- 处理范围：最近24小时内的活跃会话');
console.log('- 限制条件：未转人工的会话');

console.log('\n定时任务功能：');
console.log('1. 每分钟检查所有活跃会话');
console.log('2. 如果最后一条消息是用户消息且超过30秒');
console.log('3. 获取下一个应该发送的定时询问');
console.log('4. 发送自动回复并通知前端');

console.log('\n要测试定时任务，请：');
console.log('1. 启动后端服务');
console.log('2. 在后台创建scheduled类型的自动回复');
console.log('3. 用户发送消息后等待30秒');
console.log('4. 查看控制台日志确认定时任务执行');

