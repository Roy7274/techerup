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
import { ContentModuleService } from './content-module.service';
import { CreateContentModuleDto } from './dto/create-content-module.dto';
import { UpdateContentModuleDto } from './dto/update-content-module.dto';

@Controller('content-modules')
export class ContentModuleController {
  constructor(private readonly contentModuleService: ContentModuleService) {}

  @Post()
  create(@Body() createContentModuleDto: CreateContentModuleDto) {
    return this.contentModuleService.create(createContentModuleDto);
  }

  @Get()
  findAll(@Query('active') active?: string) {
    const activeOnly = active === 'true';
    return this.contentModuleService.findAll(activeOnly);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contentModuleService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateContentModuleDto: UpdateContentModuleDto,
  ) {
    return this.contentModuleService.update(id, updateContentModuleDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.contentModuleService.remove(id);
  }
}



