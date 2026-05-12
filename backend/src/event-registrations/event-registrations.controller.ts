import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { EventRegistrationsService } from './event-registrations.service';
import { CreateEventRegistrationDto } from './dto/create-event-registration.dto';
import { UpdateEventRegistrationDto } from './dto/update-event-registration.dto';

@Controller('event-registrations')
export class EventRegistrationsController {
  constructor(private readonly eventRegistrationsService: EventRegistrationsService) {}

  @Post()
  create(@Body() createEventRegistrationDto: CreateEventRegistrationDto) {
    return this.eventRegistrationsService.create(createEventRegistrationDto);
  }

  @Get()
  findAll() {
    return this.eventRegistrationsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventRegistrationsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEventRegistrationDto: UpdateEventRegistrationDto) {
    return this.eventRegistrationsService.update(+id, updateEventRegistrationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.eventRegistrationsService.remove(+id);
  }
}
