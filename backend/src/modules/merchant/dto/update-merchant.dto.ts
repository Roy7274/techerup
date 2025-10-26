import { IsString, IsOptional, IsBoolean, IsObject, IsArray, IsEmail, IsNumber, Min, Max } from 'class-validator';

export class UpdateMerchantDto {
  // 新的字段结构
  @IsString()
  @IsOptional()
  businessName?: string;

  @IsString()
  @IsOptional()
  businessType?: string;

  @IsString()
  @IsOptional()
  businessDescription?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  contactPhone?: string;

  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @IsString()
  @IsOptional()
  businessHours?: string;

  @IsArray()
  @IsOptional()
  services?: string[];

  @IsString()
  @IsOptional()
  specialOffers?: string;

  @IsString()
  @IsOptional()
  targetAudience?: string;

  @IsString()
  @IsOptional()
  businessAdvantages?: string;

  @IsObject()
  @IsOptional()
  aiConfig?: {
    defaultModel?: string;
    systemPrompt?: string;
    maxTokens?: number;
    temperature?: number;
    apiKey?: string;
    apiSecret?: string;
  };

  // 默认AI回复配置
  @IsBoolean()
  @IsOptional()
  defaultAIEnabled?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  defaultAIPriority?: number;

  @IsString()
  @IsOptional()
  defaultAIPrompt?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  // 原有字段（保持向后兼容）
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  advantages?: string[];

  @IsObject()
  @IsOptional()
  contact?: any;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsString()
  @IsOptional()
  coverUrl?: string;

  @IsString()
  @IsOptional()
  welcomeMessage?: string;

  @IsString()
  @IsOptional()
  detailedDescription?: string;
}

