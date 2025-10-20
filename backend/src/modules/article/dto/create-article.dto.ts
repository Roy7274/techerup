import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateArticleDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsString()
  @IsOptional()
  coverImage?: string;

  @IsString()
  @IsOptional()
  author?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}



