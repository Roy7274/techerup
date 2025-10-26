import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface AiConfig {
  defaultModel: string;
  systemPrompt: string;
  maxTokens: number;
  temperature: number;
  apiKey: string;
  apiSecret: string;
}

export interface MerchantContext {
  businessName: string;
  businessType: string;
  businessDescription: string;
  location: string;
  contactPhone: string;
  contactEmail?: string;
  businessHours: string;
  services: string[];
  specialOffers?: string;
  targetAudience: string;
  businessAdvantages: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly QIANFAN_BASE_URL = 'https://qianfan.baidubce.com';

  constructor(private readonly httpService: HttpService) {}

  /**
   * 验证Bearer Token格式
   */
  private validateBearerToken(apiSecret: string): boolean {
    // 检查是否是有效的Bearer Token格式
    return apiSecret.startsWith('bce-v3/') && apiSecret.length > 50;
  }

  /**
   * 构建系统提示词
   */
  private buildSystemPrompt(
    basePrompt: string,
    merchantContext: MerchantContext
  ): string {
    const contextInfo = `
商家信息：
- 商家名称：${merchantContext.businessName}
- 业务类型：${merchantContext.businessType}
- 业务描述：${merchantContext.businessDescription}
- 所在地区：${merchantContext.location}
- 联系电话：${merchantContext.contactPhone}
- 联系邮箱：${merchantContext.contactEmail || '未提供'}
- 营业时间：${merchantContext.businessHours}
- 服务项目：${merchantContext.services.join('、')}
- 特色优势：${merchantContext.businessAdvantages}
- 目标客户：${merchantContext.targetAudience}
${merchantContext.specialOffers ? `- 优惠活动：${merchantContext.specialOffers}` : ''}

请基于以上商家信息回答用户问题，保持专业、友好的态度。`;

    return `${basePrompt}\n\n${contextInfo}`;
  }

  /**
   * 调用百度千帆AI进行对话
   */
  async generateResponse(
    userMessage: string,
    aiConfig: AiConfig,
    merchantContext: MerchantContext,
    customPrompt?: string
  ): Promise<string> {
    try {
      // 验证Bearer Token格式
      if (!this.validateBearerToken(aiConfig.apiSecret)) {
        throw new Error('API Secret格式不正确，应该是bce-v3/开头的Bearer Token');
      }

      // 构建系统提示词
      const systemPrompt = this.buildSystemPrompt(
        customPrompt || aiConfig.systemPrompt,
        merchantContext
      );

      // 使用新的API端点
      const chatUrl = `${this.QIANFAN_BASE_URL}/v2/chat/completions`;

      // 构建请求体 - 使用新的API格式
      const requestData = {
        model: aiConfig.defaultModel || 'ernie-3.5-8k',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userMessage,
          },
        ],
        max_tokens: aiConfig.maxTokens || 2000,
        temperature: aiConfig.temperature || 0.7,
        top_p: 0.8,
      };

      this.logger.log(`调用千帆API，模型: ${requestData.model}, 用户消息: ${userMessage.substring(0, 50)}...`);

      // 发送请求 - 使用Bearer Token认证
      const response = await firstValueFrom(
        this.httpService.post(chatUrl, requestData, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${aiConfig.apiSecret}`,
          },
          timeout: 30000, // 30秒超时
        })
      );

      this.logger.log(`API响应: ${JSON.stringify(response.data)}`);

      if (response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
        this.logger.log(`AI回复生成成功，用户消息: ${userMessage.substring(0, 50)}...`);
        return response.data.choices[0].message.content;
      } else {
        this.logger.error('AI服务返回异常，响应数据:', response.data);
        throw new Error('AI服务返回异常');
      }
    } catch (error) {
      this.logger.error('AI回复生成失败', error);
      this.logger.error('错误详情:', error.response?.data || error.message);
      
      // 根据错误类型返回不同的回退消息
      if (error.response?.status === 401) {
        return '抱歉，AI服务认证失败，请检查API配置。';
      } else if (error.response?.status === 403) {
        return '抱歉，API权限不足，请联系管理员检查配置。';
      } else if (error.message?.includes('超时')) {
        return '抱歉，网络响应超时，请稍后重试或联系客服获得帮助。';
      } else {
        return '抱歉，暂时无法为您提供智能回复，请联系客服获得帮助。';
      }
    }
  }

  /**
   * 验证AI配置是否有效
   */
  async validateAiConfig(apiKey: string, apiSecret: string): Promise<boolean> {
    try {
      this.logger.log(`验证AI配置 - API Key: ${apiKey.substring(0, 10)}..., Secret Key: ${apiSecret.substring(0, 10)}...`);
      
      // 验证Bearer Token格式
      if (!this.validateBearerToken(apiSecret)) {
        this.logger.warn('API Secret格式不正确');
        return false;
      }

      // 使用简单的测试请求验证配置
      const testUrl = `${this.QIANFAN_BASE_URL}/v2/chat/completions`;
      const testData = {
        model: 'ernie-3.5-8k',
        messages: [
          {
            role: 'user',
            content: '测试',
          },
        ],
        max_tokens: 10,
      };

      await firstValueFrom(
        this.httpService.post(testUrl, testData, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiSecret}`,
          },
          timeout: 10000,
        })
      );

      return true;
    } catch (error) {
      this.logger.warn('AI配置验证失败', error);
      return false;
    }
  }

  /**
   * 测试API Key和Secret Key格式
   */
  validateApiKeyFormat(apiKey: string, apiSecret: string): { valid: boolean; message: string } {
    if (!apiKey || !apiSecret) {
      return { valid: false, message: 'API Key和Secret Key不能为空' };
    }

    // 对于新版千帆API，主要验证Secret Key（Bearer Token）格式
    if (!this.validateBearerToken(apiSecret)) {
      return { valid: false, message: 'Secret Key格式不正确，应该以bce-v3/开头' };
    }

    // API Key可以是任意格式（新版API主要使用Secret Key）
    if (apiKey.length < 5) {
      return { valid: false, message: 'API Key长度不足，请检查是否正确' };
    }

    return { valid: true, message: '格式验证通过' };
  }
}
