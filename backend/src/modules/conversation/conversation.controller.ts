import { Controller, Get, Post, Body, Param, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { ConversationService } from './conversation.service';
import { CreateConversationDto } from './dto/create-conversation.dto';

@Controller('conversations')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Post()
  create(@Body() createConversationDto: CreateConversationDto) {
    return this.conversationService.create(createConversationDto);
  }

  @Get('session/:sessionId')
  findBySession(@Param('sessionId') sessionId: string) {
    return this.conversationService.findBySession(sessionId);
  }

  @Get('session/:sessionId/form-data')
  async getSessionFormData(@Param('sessionId') sessionId: string) {
    return this.conversationService.getSessionFormData(sessionId);
  }

  @Get('inquiry/:inquiryId')
  findByInquiry(@Param('inquiryId') inquiryId: string) {
    return this.conversationService.findByInquiry(inquiryId);
  }

  @Post('message')
  async handleMessage(
    @Body() body: { sessionId: string; message: string; metadata?: any },
    @Req() req: Request,
  ) {
    // 获取客户端信息
    const clientIP = req.ip || 
                    req.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
                    req.get('X-Real-IP') ||
                    req.connection.remoteAddress || 
                    req.socket.remoteAddress;
    const userAgent = req.get('User-Agent');
    const acceptLanguage = req.get('Accept-Language');
    
    console.log(`客户端信息 - IP: ${clientIP}, User-Agent: ${userAgent}, Accept-Language: ${acceptLanguage}`);

    return this.conversationService.handleUserMessage(
      body.sessionId,
      body.message,
      body.metadata,
      clientIP,
      userAgent,
      acceptLanguage,
    );
  }

  // 新增：前端在页面加载完成后可直接写入定位到的城市
  @Post('session/save-city')
  async saveCity(@Body() body: { sessionId: string; city: string }) {
    await this.conversationService.getOrCreateSession(body.sessionId);
    await this.conversationService.saveSessionFormData(body.sessionId, 'city', body.city || '未知');
    return { ok: true };
  }

  @Post('switch-agent')
  async switchToAgent(@Body() body: { sessionId: string }) {
    return this.conversationService.switchToAgent(body.sessionId);
  }

  @Post('agent-message')
  async sendAgentMessage(
    @Body() body: { sessionId: string; message: string; agentId?: string },
  ) {
    return this.conversationService.sendAgentMessage(
      body.sessionId,
      body.message,
      body.agentId,
    );
  }

  @Get('session-status/:sessionId')
  async getSessionStatus(@Param('sessionId') sessionId: string) {
    return this.conversationService.getSessionStatus(sessionId);
  }

  @Get('active-sessions')
  async getActiveSessions(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.conversationService.getActiveSessions(limitNum);
  }

  @Get('pending-agent-sessions')
  async getPendingAgentSessions() {
    return this.conversationService.getPendingAgentSessions();
  }

  @Post('session/archive')
  async archiveSession(@Body() body: { sessionId: string }) {
    return this.conversationService.archiveSession(body.sessionId);
  }

  @Post('session/delete')
  async deleteSession(@Body() body: { sessionId: string }) {
    return this.conversationService.deleteSession(body.sessionId);
  }

  @Post('session/user-leave')
  async handleUserLeave(@Body() body: { sessionId: string }) {
    return this.conversationService.handleUserLeaveSession(body.sessionId);
  }

  @Post('submit-form')
  async submitForm(@Body() body: { sessionId: string; formData: any }) {
    return this.conversationService.createInquiryFromFormData(body.sessionId, body.formData);
  }
}

