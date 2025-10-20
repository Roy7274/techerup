import { IsString, IsBoolean, IsOptional, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFormFieldDto {
  @IsString()
  fieldName: string;

  @IsString()
  fieldLabel: string;

  @IsString()
  fieldType: string; // text/select/radio/checkbox/tel

  @IsOptional()
  options?: any;

  @IsOptional()
  @IsString()
  placeholder?: string;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  validation?: any;
}

export class CreateFormTemplateDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsNumber()
  order?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFormFieldDto)
  fields?: CreateFormFieldDto[];
}


