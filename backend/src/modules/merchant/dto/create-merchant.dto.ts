import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsObject, IsArray, ArrayNotEmpty, IsEmail, IsNumber, Min, Max } from 'class-validator';

export class CreateMerchantDto {
  @IsString()
  @IsNotEmpty()
  businessName: string;

  @IsString()
  @IsNotEmpty()
  businessType: string;

  @IsString()
  @IsNotEmpty()
  businessDescription: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsString()
  @IsNotEmpty()
  contactPhone: string;

  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @IsString()
  @IsNotEmpty()
  businessHours: string;

  @IsArray()
  @IsNotEmpty()
  services: string[];

  @IsString()
  @IsOptional()
  specialOffers?: string;

  @IsString()
  @IsNotEmpty()
  targetAudience: string;

  @IsString()
  @IsNotEmpty()
  businessAdvantages: string;

  @IsObject()
  @IsNotEmpty()
  aiConfig: {
    defaultModel: string;
    systemPrompt: string;
    maxTokens: number;
    temperature: number;
    apiKey: string;
    apiSecret: string;
  };

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  // 保持原有字段兼容性
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

