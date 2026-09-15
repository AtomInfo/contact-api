import { ConflictException, Injectable } from '@nestjs/common';
import { prisma } from '../prisma/client';
import { CreateContactDto } from './dto/create-contact.dto';
import { ContactStatus } from './entities/contact.entity';

const DUPLICATE_CHECK_WINDOW_MS = 60 * 1000; // 60 seconds

@Injectable()
export class ContactsService {
  async create(dto: CreateContactDto, applicationId = 'unknown') {
    // Check for duplicate submission: same application, email, and message within the time window.
    const recentDuplicate = await prisma.contactMessage.findFirst({
      where: {
        applicationId,
        email: dto.email,
        message: dto.message,
        createdAt: {
          gte: new Date(Date.now() - DUPLICATE_CHECK_WINDOW_MS),
        },
      },
    });

    if (recentDuplicate) {
      throw new ConflictException(
        `Duplicate submission detected. A similar contact from ${dto.email} was received recently. Please wait a moment before resubmitting.`,
      );
    }

    const data: any = {
      applicationId,
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone ?? null,
      message: dto.message,
      metadata: dto.metadata ?? null,
      status: ContactStatus.NEW,
    };
    const created = await prisma.contactMessage.create({ data });
    return created;
  }
}
