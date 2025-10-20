import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsObject, IsArray, ArrayNotEmpty, IsJSON } from 'class-validator';

export class CreateMerchantDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsArray()
  @ArrayNotEmpty()
  services: string[];

  @IsArray()
  @ArrayNotEmpty()
  advantages: string[];

  @IsObject()
  @IsNotEmpty()
  contact: any; // JSON object

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

