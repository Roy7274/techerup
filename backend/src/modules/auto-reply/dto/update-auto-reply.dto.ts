import { PartialType } from '@nestjs/mapped-types';
import { CreateAutoReplyDto } from './create-auto-reply.dto';

export class UpdateAutoReplyDto extends PartialType(CreateAutoReplyDto) {}


