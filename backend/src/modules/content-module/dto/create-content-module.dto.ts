import { IsString, IsOptional, IsBoolean, IsInt } from 'class-validator';

export class CreateContentModuleDto {
  @IsString()
  title: string;

  @IsInt()
  @IsOptional()
  order?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  description?: string;
}



