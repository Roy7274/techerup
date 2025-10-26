import { IsString, IsBoolean, IsOptional, IsNumber, IsArray } from 'class-validator';

export class CreateAutoReplyDto {
  @IsString()
  name: string;

  @IsString()
  triggerType: string; // keyword/welcome/default/scheduled/manual/ai

  @IsOptional()
  @IsArray()
  keywords?: string[];

  @IsOptional()
  @IsNumber()
  priority?: number;

  @IsOptional()
  @IsString()
  message?: string; // AI类型可以为空

  @IsOptional()
  @IsBoolean()
  hasOptions?: boolean;

  @IsOptional()
  options?: any; // [{label: "预约试听", value: "booking", formTemplateId: "xxx"}]

  @IsOptional()
  @IsString()
  formTemplateId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  useConditions?: any; // 使用条件（时间段等）

  // AI相关字段
  @IsOptional()
  @IsBoolean()
  useAI?: boolean;

  @IsOptional()
  @IsString()
  aiPrompt?: string;

  @IsOptional()
  @IsString()
  aiModel?: string;

  // 关键词AI结合功能
  @IsOptional()
  @IsBoolean()
  keywordAIEnabled?: boolean;

  @IsOptional()
  @IsString()
  keywordAIPrompt?: string;
}


