const axios = require('axios');

const API_URL = 'http://localhost:3001';

async function testGeoInquiry() {
  console.log('🧪 测试地理信息在咨询记录中的保存...\n');

  try {
    // 1. 创建新会话并发送消息
    console.log('1️⃣ 创建新会话并发送消息...');
    
    const sessionId = `test_geo_inquiry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 模拟发送消息（包含IP信息）
    const response = await axios.post(`${API_URL}/conversations/message`, {
      sessionId,
      message: '你好，我想咨询课程',
    }, {
      headers: {
        'X-Forwarded-For': '114.114.114.114', // 使用中国IP
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
      console.log(`✅ 会话中检测到城市: ${formData.city}`);
    } else {
      console.log('❌ 会话中未检测到城市信息');
    }
    
    // 3. 模拟用户离开会话，触发创建咨询记录
    console.log('3️⃣ 模拟用户离开会话...');
    
    await axios.post(`${API_URL}/conversations/session/user-leave`, {
      sessionId
    });
    
    console.log('✅ 用户离开会话处理完成');
    
    // 4. 获取咨询记录
    console.log('4️⃣ 获取咨询记录...');
    
    const inquiriesResponse = await axios.get(`${API_URL}/inquiries`);
    const inquiries = inquiriesResponse.data;
    
    // 查找我们刚创建的咨询记录
    const ourInquiry = inquiries.find(inquiry => 
      inquiry.phone && inquiry.phone.includes(sessionId.slice(-8))
    );
    
    if (ourInquiry) {
      console.log('✅ 找到咨询记录:', JSON.stringify(ourInquiry, null, 2));
      
      if (ourInquiry.city && ourInquiry.city !== '未知') {
        console.log(`✅ 咨询记录中城市信息正确: ${ourInquiry.city}`);
      } else {
        console.log(`❌ 咨询记录中城市信息不正确: ${ourInquiry.city}`);
      }
    } else {
      console.log('❌ 未找到对应的咨询记录');
    }
    
    console.log('\n🎉 地理信息咨询记录测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
  }
}

// 运行测试
testGeoInquiry();


