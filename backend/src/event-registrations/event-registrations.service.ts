import { Injectable } from '@nestjs/common';
import { CreateEventRegistrationDto } from './dto/create-event-registration.dto';
import { UpdateEventRegistrationDto } from './dto/update-event-registration.dto';

@Injectable()
export class EventRegistrationsService {
  create(createEventRegistrationDto: CreateEventRegistrationDto) {
    return 'This action adds a new eventRegistration';
  }

  findAll() {
    return `This action returns all eventRegistrations`;
  }

  findOne(id: number) {
    return `This action returns a #${id} eventRegistration`;
  }

  update(id: number, updateEventRegistrationDto: UpdateEventRegistrationDto) {
    return `This action updates a #${id} eventRegistration`;
  }

  remove(id: number) {
    return `This action removes a #${id} eventRegistration`;
  }
}
