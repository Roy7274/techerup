const axios = require('axios');

async function debugGeoLocation() {
  console.log('🔍 调试地理信息识别问题...\n');

  // 测试一些常见的IP地址
  const testIPs = [
    '8.8.8.8',           // Google DNS (美国)
    '114.114.114.114',   // 114 DNS (中国)
    '1.1.1.1',           // Cloudflare DNS (美国)
    '127.0.0.1',         // 本地IP
    '192.168.1.1',       // 私有IP
    '10.0.0.1',          // 私有IP
    '172.16.0.1',        // 私有IP
  ];

  for (const ip of testIPs) {
    console.log(`\n测试IP: ${ip}`);
    
    try {
      // 直接调用ip-api.com
      const response = await axios.get(`http://ip-api.com/json/${ip}?lang=zh-CN`);
      const data = response.data;
      
      console.log('API响应:', JSON.stringify(data, null, 2));
      
      if (data.status === 'success') {
        console.log(`✅ 成功获取地理信息:`);
        console.log(`   国家: ${data.country}`);
        console.log(`   省份: ${data.regionName}`);
        console.log(`   城市: ${data.city}`);
        console.log(`   ISP: ${data.isp}`);
      } else {
        console.log(`❌ API返回失败状态: ${data.status}`);
        console.log(`   消息: ${data.message}`);
      }
    } catch (error) {
      console.log(`❌ API调用失败: ${error.message}`);
    }
  }

  // 测试一些成都的IP地址（这些是示例，实际IP可能不同）
  console.log('\n\n🏙️ 测试成都相关IP地址...');
  
  const chengduIPs = [
    '183.230.96.1',      // 重庆电信
    '202.98.96.68',      // 四川电信
    '61.139.2.69',       // 四川联通
  ];

  for (const ip of chengduIPs) {
    console.log(`\n测试成都IP: ${ip}`);
    
    try {
      const response = await axios.get(`http://ip-api.com/json/${ip}?lang=zh-CN`);
      const data = response.data;
      
      if (data.status === 'success') {
        console.log(`✅ 地理信息:`);
        console.log(`   国家: ${data.country}`);
        console.log(`   省份: ${data.regionName}`);
        console.log(`   城市: ${data.city}`);
        console.log(`   ISP: ${data.isp}`);
      } else {
        console.log(`❌ API返回失败: ${data.message}`);
      }
    } catch (error) {
      console.log(`❌ API调用失败: ${error.message}`);
    }
  }
}

// 运行调试
debugGeoLocation();
