import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AutoReplyService } from './auto-reply.service';
import { CreateAutoReplyDto } from './dto/create-auto-reply.dto';
import { UpdateAutoReplyDto } from './dto/update-auto-reply.dto';

@Controller('auto-replies')
export class AutoReplyController {
  constructor(private readonly autoReplyService: AutoReplyService) {}

  @Post()
  create(@Body() createAutoReplyDto: CreateAutoReplyDto) {
    return this.autoReplyService.create(createAutoReplyDto);
  }

  @Get()
  findAll(@Query('active') active?: string) {
    const activeOnly = active === 'true';
    return this.autoReplyService.findAll(activeOnly);
  }

  @Get('welcome')
  getWelcomeMessage() {
    return this.autoReplyService.getWelcomeMessage();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.autoReplyService.findOne(id);
  }

  @Post('match')
  findMatchingReply(
    @Body() body: { message: string; sessionId: string },
  ) {
    return this.autoReplyService.findMatchingReply(body.message, body.sessionId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAutoReplyDto: UpdateAutoReplyDto,
  ) {
    return this.autoReplyService.update(id, updateAutoReplyDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.autoReplyService.remove(id);
  }

  @Patch(':id/toggle-active')
  toggleActive(@Param('id') id: string) {
    return this.autoReplyService.toggleActive(id);
  }

  @Post('pause')
  pauseAutoReply(
    @Body() body: { sessionId: string; durationMinutes: number; reason: string },
  ) {
    return this.autoReplyService.pauseAutoReply(
      body.sessionId,
      body.durationMinutes,
      body.reason,
    );
  }

  @Post('resume')
  resumeAutoReply(@Body() body: { sessionId: string }) {
    return this.autoReplyService.resumeAutoReply(body.sessionId);
  }

  @Get('status/:sessionId')
  checkAutoReplyStatus(@Param('sessionId') sessionId: string) {
    return this.autoReplyService.isAutoReplyPaused(sessionId);
  }
}


