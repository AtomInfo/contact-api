import { ConflictException } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { prisma } from '../prisma/client';
import { ContactStatus } from './entities/contact.entity';

jest.mock('../prisma/client', () => ({
  prisma: {
    contactMessage: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe('ContactsService', () => {
  let service: ContactsService;

  beforeEach(() => {
    service = new ContactsService();
    jest.clearAllMocks();
  });

  it('should create a contact when no duplicate exists and use the default application id', async () => {
    const dto = {
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      message: 'Hello from the API',
      applicationId: 'app-123',
    };

    const created = {
      id: 'contact-1',
      applicationId: 'unknown',
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      phone: null,
      message: 'Hello from the API',
      metadata: null,
      status: ContactStatus.NEW,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    (prisma.contactMessage.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.contactMessage.create as jest.Mock).mockResolvedValue(created);

    await expect(service.create(dto)).resolves.toEqual(created);
    expect(prisma.contactMessage.findFirst).toHaveBeenCalledWith({
      where: {
        applicationId: 'unknown',
        email: 'ada@example.com',
        message: 'Hello from the API',
        createdAt: {
          gte: expect.any(Date),
        },
      },
    });
    expect(prisma.contactMessage.create).toHaveBeenCalledWith({
      data: {
        applicationId: 'unknown',
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        phone: null,
        message: 'Hello from the API',
        metadata: null,
        status: ContactStatus.NEW,
      },
    });
  });

  it('should keep provided phone and metadata values when creating a contact', async () => {
    const dto = {
      firstName: 'Grace',
      lastName: 'Hopper',
      email: 'grace@example.com',
      phone: '+1 415 555 0101',
      message: 'Legacy systems are beautiful',
      metadata: { source: 'newsletter' },
      applicationId: 'app-456',
    };

    const created = {
      id: 'contact-2',
      applicationId: 'app-456',
      firstName: 'Grace',
      lastName: 'Hopper',
      email: 'grace@example.com',
      phone: '+1 415 555 0101',
      message: 'Legacy systems are beautiful',
      metadata: { source: 'newsletter' },
      status: ContactStatus.NEW,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    (prisma.contactMessage.findFirst as jest.Mock).mockResolvedValue(null);
    (prisma.contactMessage.create as jest.Mock).mockResolvedValue(created);

    await expect(service.create(dto, 'app-456')).resolves.toEqual(created);
    expect(prisma.contactMessage.create).toHaveBeenCalledWith({
      data: {
        applicationId: 'app-456',
        firstName: 'Grace',
        lastName: 'Hopper',
        email: 'grace@example.com',
        phone: '+1 415 555 0101',
        message: 'Legacy systems are beautiful',
        metadata: { source: 'newsletter' },
        status: ContactStatus.NEW,
      },
    });
  });

  it('should throw a ConflictException for a recent duplicate', async () => {
    const dto = {
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      message: 'Hello from the API',
      applicationId: 'app-123',
    };

    (prisma.contactMessage.findFirst as jest.Mock).mockResolvedValue({ id: 'existing' });

    await expect(service.create(dto, 'app-123')).rejects.toThrow(ConflictException);
    expect(prisma.contactMessage.create).not.toHaveBeenCalled();
  });
});
