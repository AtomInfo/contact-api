import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { prisma } from '../prisma/client';
import { CreateContactDto } from './dto/create-contact.dto';
import { ListContactsQueryDto } from './dto/list-contacts-query.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ContactStatus } from './entities/contact.entity';

const DUPLICATE_CHECK_WINDOW_MS = 60 * 1000; // 60 seconds
const DEFAULT_PAGE_SIZE = 20;

// Prisma error code for "record to update/delete does not exist".
const PRISMA_RECORD_NOT_FOUND = 'P2025';

function isRecordNotFound(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { code?: unknown }).code === PRISMA_RECORD_NOT_FOUND
  );
}

function contactNotFound(id: string): NotFoundException {
  return new NotFoundException(`Contact ${id} not found.`);
}

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

  async findAll(query: ListContactsQueryDto = {}) {
    const page = query.page ?? 1;
    const limit = query.limit ?? DEFAULT_PAGE_SIZE;
    const sortBy = query.sortBy ?? 'createdAt';
    const order = query.order ?? 'desc';

    const where: any = {};
    if (query.applicationId) where.applicationId = query.applicationId;
    if (query.status) where.status = query.status;
    if (query.email) where.email = query.email;
    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { message: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await prisma.$transaction([
      prisma.contactMessage.findMany({
        where,
        orderBy: { [sortBy]: order },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.contactMessage.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const contact = await prisma.contactMessage.findUnique({
      where: { id },
    });

    if (!contact) {
      throw contactNotFound(id);
    }

    return contact;
  }

  async update(id: string, data: UpdateContactDto) {
    try {
      return await prisma.contactMessage.update({
        where: { id },
        data,
      });
    } catch (error) {
      if (isRecordNotFound(error)) throw contactNotFound(id);
      throw error;
    }
  }

  async remove(id: string) {
    try {
      return await prisma.contactMessage.delete({
        where: { id },
      });
    } catch (error) {
      if (isRecordNotFound(error)) throw contactNotFound(id);
      throw error;
    }
  }
}
