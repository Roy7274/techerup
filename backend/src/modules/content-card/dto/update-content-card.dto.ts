import { PartialType } from '@nestjs/mapped-types';
import { CreateContentCardDto } from './create-content-card.dto';

export class UpdateContentCardDto extends PartialType(CreateContentCardDto) {}



