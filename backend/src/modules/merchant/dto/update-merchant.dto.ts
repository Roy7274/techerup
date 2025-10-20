import { IsString, IsOptional, IsBoolean, IsObject, IsArray } from 'class-validator';

export class UpdateMerchantDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  services?: string[];

  @IsArray()
  @IsOptional()
  advantages?: string[];

  @IsObject()
  @IsOptional()
  contact?: any;

  @IsString()
  @IsOptional()
  businessHours?: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsString()
  @IsOptional()
  coverUrl?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  welcomeMessage?: string;

  @IsString()
  @IsOptional()
  detailedDescription?: string;
}

