import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class CreateConversationDto {
  @IsString()
  @IsOptional()
  inquiryId?: string;

  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsString()
  @IsNotEmpty()
  sender: string; // user/bot/agent

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsObject()
  @IsOptional()
  metadata?: any;
}

