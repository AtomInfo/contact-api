import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { ListContactsQueryDto } from './dto/list-contacts-query.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Controller('api/v1/contacts')
export class ContactsController {
  constructor(private readonly svc: ContactsService) {}

  @Get()
  @UseGuards(AdminAuthGuard)
  findAll(@Query() query: ListContactsQueryDto) {
    return this.svc.findAll(query);
  }

  @Get(':id')
  @UseGuards(AdminAuthGuard)
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AdminAuthGuard)
  update(@Param('id') id: string, @Body() dto: UpdateContactDto) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AdminAuthGuard)
  remove(@Param('id') id: string) {
    return this.svc.remove(id);
  }

  // Public: client applications submit contact messages here.
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateContactDto) {
    return this.svc.create(dto, dto.applicationId);
  }
}
