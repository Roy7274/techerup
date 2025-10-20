import { IsString, IsNotEmpty, IsOptional, IsPhoneNumber } from 'class-validator';

export class CreateInquiryDto {
  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  grade: string; // 小学/初中/高中

  @IsString()
  @IsNotEmpty()
  identity: string; // 本人/家长

  @IsString()
  @IsNotEmpty()
  studentGender: string; // 男孩/女孩

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

