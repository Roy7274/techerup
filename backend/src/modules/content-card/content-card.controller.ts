import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ContentCardService } from './content-card.service';
import { CreateContentCardDto } from './dto/create-content-card.dto';
import { UpdateContentCardDto } from './dto/update-content-card.dto';

@Controller('content-cards')
export class ContentCardController {
  constructor(private readonly contentCardService: ContentCardService) {}

  @Post()
  create(@Body() createContentCardDto: CreateContentCardDto) {
    return this.contentCardService.create(createContentCardDto);
  }

  @Get()
  findAll(
    @Query('moduleId') moduleId?: string,
    @Query('active') active?: string,
  ) {
    const activeOnly = active === 'true';
    return this.contentCardService.findAll(moduleId, activeOnly);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contentCardService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateContentCardDto: UpdateContentCardDto,
  ) {
    return this.contentCardService.update(id, updateContentCardDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contentCardService.remove(id);
  }
}



