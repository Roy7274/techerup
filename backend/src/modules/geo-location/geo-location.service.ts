import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class GeoLocationService {
  private readonly logger = new Logger(GeoLocationService.name);

  constructor(private readonly httpService: HttpService) {}

  /**
   * 从IP地址获取地理位置信息
   * @param ip IP地址
   * @returns 城市信息
   */
  async getCityFromIP(ip: string): Promise<string> {
    try {
      // 过滤掉本地IP和私有IP
      if (this.isLocalOrPrivateIP(ip)) {
        this.logger.log(`IP ${ip} 是本地或私有IP，返回未知`);
        return '未知';
      }

      // 使用免费的IP地理位置API
      const response = await firstValueFrom(
        this.httpService.get(`http://ip-api.com/json/${ip}?lang=zh-CN`)
      );

      const data = response.data as any;
      if (data && data.status === 'success') {
        const city = data.city || data.regionName || '未知';
        this.logger.log(`从IP ${ip} 获取到城市: ${city}`);
        return city;
      }
    } catch (error) {
      this.logger.error(`从IP获取城市信息失败: ${error.message}`);
    }

    return '未知';
  }

  /**
   * 从浏览器头信息中提取地理位置信息
   * @param userAgent 用户代理字符串
   * @param acceptLanguage 接受语言头
   * @returns 城市信息
   */
  async getCityFromHeaders(userAgent: string, acceptLanguage: string): Promise<string> {
    try {
      // 从Accept-Language头中提取语言信息
      if (acceptLanguage) {
        const languages = acceptLanguage.split(',').map(lang => lang.trim().split(';')[0]);
        
        // 检查是否包含中文相关的语言代码
        const chineseLanguages = ['zh', 'zh-CN', 'zh-TW', 'zh-HK'];
        const hasChinese = languages.some(lang => 
          chineseLanguages.some(chinese => lang.startsWith(chinese))
        );

        if (hasChinese) {
          // 如果有中文语言偏好，尝试从语言代码中提取地区信息
          const zhLang = languages.find(lang => lang.startsWith('zh'));
          if (zhLang) {
            if (zhLang.includes('TW')) {
              return '台湾';
            } else if (zhLang.includes('HK')) {
              return '香港';
            }
            // 对于中国大陆，尝试从其他信息推断
            return this.inferCityFromUserAgent(userAgent);
          }
        }
      }

      // 从User-Agent中提取时区信息（如果可用）
      if (userAgent) {
        return this.inferCityFromUserAgent(userAgent);
      }
    } catch (error) {
      this.logger.error(`从请求头获取城市信息失败: ${error.message}`);
    }

    return '未知';
  }

  /**
   * 从User-Agent中推断城市信息
   * @param userAgent 用户代理字符串
   * @returns 城市信息
   */
  private inferCityFromUserAgent(userAgent: string): string {
    try {
      // 检查是否包含地区相关的关键词
      const regionKeywords = {
        '成都': ['chengdu', 'sichuan', '四川'],
        '重庆': ['chongqing', '重庆'],
        '北京': ['beijing', 'peking', '北京'],
        '上海': ['shanghai', '上海'],
        '广州': ['guangzhou', 'canton', '广州'],
        '深圳': ['shenzhen', '深圳'],
        '杭州': ['hangzhou', '杭州'],
        '南京': ['nanjing', '南京'],
        '武汉': ['wuhan', '武汉'],
        '西安': ['xian', '西安'],
      };

      const lowerUserAgent = userAgent.toLowerCase();
      
      for (const [city, keywords] of Object.entries(regionKeywords)) {
        if (keywords.some(keyword => lowerUserAgent.includes(keyword))) {
          this.logger.log(`从User-Agent推断出城市: ${city}`);
          return city;
        }
      }

      // 如果没有找到特定地区信息，返回未知
      return '未知';
    } catch (error) {
      this.logger.error(`从User-Agent推断城市失败: ${error.message}`);
      return '未知';
    }
  }

  /**
   * 综合获取用户地理位置信息
   * @param ip IP地址
   * @param userAgent 用户代理字符串
   * @param acceptLanguage 接受语言头
   * @returns 城市信息
   */
  async getUserCity(ip: string, userAgent?: string, acceptLanguage?: string): Promise<string> {
    try {
      this.logger.log(`开始获取用户地理信息 - IP: ${ip}, User-Agent: ${userAgent}, Accept-Language: ${acceptLanguage}`);

      // 优先从请求头获取（更准确）
      if (userAgent || acceptLanguage) {
        const headerCity = await this.getCityFromHeaders(userAgent || '', acceptLanguage || '');
        if (headerCity && headerCity !== '未知' && headerCity !== '北京') {
          this.logger.log(`从请求头获取到城市: ${headerCity}`);
          return headerCity;
        }
      }

      // 如果请求头获取失败，尝试从IP获取
      const ipCity = await this.getCityFromIP(ip);
      if (ipCity && ipCity !== '未知' && ipCity !== '北京') {
        this.logger.log(`从IP获取到城市: ${ipCity}`);
        return ipCity;
      }

      this.logger.log(`所有方法都失败，返回未知`);
      return '未知';
    } catch (error) {
      this.logger.error(`获取用户城市信息失败: ${error.message}`);
      return '未知';
    }
  }

  /**
   * 检查是否为本地或私有IP
   * @param ip IP地址
   * @returns 是否为本地或私有IP
   */
  private isLocalOrPrivateIP(ip: string): boolean {
    // 本地回环地址
    if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') {
      return true;
    }

    // 私有IP地址段
    const privateRanges = [
      /^10\./,                    // 10.0.0.0/8
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
      /^192\.168\./,              // 192.168.0.0/16
      /^169\.254\./,              // 169.254.0.0/16 (链路本地)
      /^::1$/,                    // IPv6 本地回环
      /^fe80:/,                   // IPv6 链路本地
    ];

    return privateRanges.some(range => range.test(ip));
  }

  /**
   * 标准化城市名称
   * @param city 原始城市名称
   * @returns 标准化后的城市名称
   */
  standardizeCityName(city: string): string {
    if (!city || city === '未知') {
      return '未知';
    }

    // 移除常见的后缀
    const cleanCity = city
      .replace(/市$/, '')
      .replace(/省$/, '')
      .replace(/自治区$/, '')
      .replace(/特别行政区$/, '')
      .trim();

    // 处理一些特殊情况
    const cityMappings: { [key: string]: string } = {
      '北京市': '北京',
      '上海市': '上海',
      '广州市': '广州',
      '深圳市': '深圳',
      '杭州市': '杭州',
      '南京市': '南京',
      '武汉市': '武汉',
      '成都市': '成都',
      '西安市': '西安',
      '重庆市': '重庆',
      '天津市': '天津',
      '苏州市': '苏州',
      '长沙市': '长沙',
      '郑州市': '郑州',
      '青岛市': '青岛',
      '大连市': '大连',
      '宁波市': '宁波',
      '厦门市': '厦门',
      '福州市': '福州',
      '无锡市': '无锡',
      '合肥市': '合肥',
      '昆明市': '昆明',
      '哈尔滨市': '哈尔滨',
      '济南市': '济南',
      '佛山市': '佛山',
      '长春市': '长春',
      '温州市': '温州',
      '石家庄市': '石家庄',
      '南宁市': '南宁',
      '贵阳市': '贵阳',
      '海口市': '海口',
      '兰州市': '兰州',
      '银川市': '银川',
      '西宁市': '西宁',
      '乌鲁木齐市': '乌鲁木齐',
      '呼和浩特市': '呼和浩特',
      '拉萨市': '拉萨',
    };

    return cityMappings[city] || cityMappings[cleanCity] || cleanCity || '未知';
  }
}
