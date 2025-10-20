import { IsString, IsBoolean, IsOptional, IsNumber, IsArray } from 'class-validator';

export class CreateAutoReplyDto {
  @IsString()
  name: string;

  @IsString()
  triggerType: string; // keyword/welcome/default/scheduled/manual

  @IsOptional()
  @IsArray()
  keywords?: string[];

  @IsOptional()
  @IsNumber()
  priority?: number;

  @IsString()
  message: string;

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
}


