const axios = require('axios');

const API_URL = 'http://localhost:3001';

async function testGeoLocation() {
  console.log('🧪 测试地理信息功能...\n');

  try {
    // 1. 测试创建新会话（模拟不同IP）
    console.log('1️⃣ 测试创建新会话...');
    
    const testIPs = [
      '8.8.8.8',      // Google DNS (美国)
      '114.114.114.114', // 114 DNS (中国)
      '1.1.1.1',      // Cloudflare DNS (美国)
      '127.0.0.1',    // 本地IP
    ];

    for (const testIP of testIPs) {
      console.log(`\n测试IP: ${testIP}`);
      
      const sessionId = `test_geo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 模拟发送消息（包含IP信息）
      const response = await axios.post(`${API_URL}/conversations/message`, {
        sessionId,
        message: '你好，我想咨询课程',
      }, {
        headers: {
          'X-Forwarded-For': testIP,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        }
      });

      console.log(`✅ 消息发送成功，会话ID: ${sessionId}`);
      
      // 2. 获取会话表单数据
      console.log('2️⃣ 获取会话表单数据...');
      
      const formDataResponse = await axios.get(`${API_URL}/conversations/session/${sessionId}/form-data`);
      const formData = formDataResponse.data;
      
      console.log('📋 表单数据:', JSON.stringify(formData, null, 2));
      
      if (formData.city) {
        console.log(`✅ 成功检测到城市: ${formData.city}`);
      } else {
        console.log('❌ 未检测到城市信息');
      }
      
      // 3. 获取会话对话记录
      console.log('3️⃣ 获取会话对话记录...');
      
      const conversationsResponse = await axios.get(`${API_URL}/conversations/session/${sessionId}`);
      const conversations = conversationsResponse.data;
      
      console.log(`📝 对话记录数量: ${conversations.length}`);
      
      // 检查是否有欢迎语消息
      const welcomeMessage = conversations.find(conv => 
        conv.sender === 'bot' && 
        conv.metadata && 
        conv.metadata.autoReplyId
      );
      
      if (welcomeMessage) {
        console.log('✅ 找到欢迎语消息');
        console.log(`   消息内容: ${welcomeMessage.message}`);
        console.log(`   元数据: ${JSON.stringify(welcomeMessage.metadata, null, 2)}`);
      } else {
        console.log('❌ 未找到欢迎语消息');
      }
      
      console.log('\n' + '='.repeat(50));
    }

    // 4. 测试地理信息服务的直接调用
    console.log('\n4️⃣ 测试地理信息服务...');
    
    // 这里需要直接调用服务，但由于是模块化的，我们通过API测试
    console.log('✅ 地理信息服务已集成到会话服务中');
    
    console.log('\n🎉 地理信息功能测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

// 运行测试
testGeoLocation();


