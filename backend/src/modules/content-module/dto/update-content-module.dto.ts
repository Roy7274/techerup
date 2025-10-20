import { PartialType } from '@nestjs/mapped-types';
import { CreateContentModuleDto } from './create-content-module.dto';

export class UpdateContentModuleDto extends PartialType(CreateContentModuleDto) {}



