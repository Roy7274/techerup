import { IsString, IsOptional, IsBoolean, IsInt, IsArray } from 'class-validator';

export class CreateContentCardDto {
  @IsString()
  moduleId: string;

  @IsString()
  title: string;

  @IsString()
  imageUrl: string;

  @IsArray()
  tags: string[];

  @IsString()
  @IsOptional()
  articleId?: string;

  @IsInt()
  @IsOptional()
  order?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}



