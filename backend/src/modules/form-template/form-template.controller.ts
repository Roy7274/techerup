import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FormTemplateService } from './form-template.service';
import { CreateFormTemplateDto } from './dto/create-form-template.dto';
import { UpdateFormTemplateDto } from './dto/update-form-template.dto';

@Controller('form-templates')
export class FormTemplateController {
  constructor(private readonly formTemplateService: FormTemplateService) {}

  @Post()
  create(@Body() createFormTemplateDto: CreateFormTemplateDto) {
    return this.formTemplateService.create(createFormTemplateDto);
  }

  @Get()
  findAll(@Query('active') active?: string) {
    const activeOnly = active === 'true';
    return this.formTemplateService.findAll(activeOnly);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.formTemplateService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateFormTemplateDto: UpdateFormTemplateDto,
  ) {
    return this.formTemplateService.update(id, updateFormTemplateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.formTemplateService.remove(id);
  }

  @Patch(':id/toggle-active')
  toggleActive(@Param('id') id: string) {
    return this.formTemplateService.toggleActive(id);
  }
}


