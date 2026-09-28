import { ConflictException, NotFoundException } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { prisma } from '../prisma/client';
import { ContactStatus } from './entities/contact.entity';

jest.mock('../prisma/client', () => ({
  prisma: {
    contactMessage: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
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

    (prisma.contactMessage.findFirst as jest.Mock).mockResolvedValue({
      id: 'existing',
    });

    await expect(service.create(dto, 'app-123')).rejects.toThrow(
      ConflictException,
    );
    expect(prisma.contactMessage.create).not.toHaveBeenCalled();
  });

  describe('findAll', () => {
    it('should apply defaults and return paginated results with a total', async () => {
      const rows = [{ id: 'contact-1' }];
      (prisma.contactMessage.findMany as jest.Mock).mockResolvedValue(rows);
      (prisma.contactMessage.count as jest.Mock).mockResolvedValue(42);

      await expect(service.findAll()).resolves.toEqual({
        data: rows,
        total: 42,
        page: 1,
        limit: 20,
      });
      expect(prisma.contactMessage.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      });
      expect(prisma.contactMessage.count).toHaveBeenCalledWith({ where: {} });
    });

    it('should build filters, search, sorting and offset from the query', async () => {
      (prisma.contactMessage.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.contactMessage.count as jest.Mock).mockResolvedValue(0);

      await service.findAll({
        applicationId: 'app-123',
        status: ContactStatus.READ,
        email: 'ada@example.com',
        search: 'ada',
        page: 3,
        limit: 10,
        sortBy: 'email',
        order: 'asc',
      });

      const where = {
        applicationId: 'app-123',
        status: ContactStatus.READ,
        email: 'ada@example.com',
        OR: [
          { firstName: { contains: 'ada', mode: 'insensitive' } },
          { lastName: { contains: 'ada', mode: 'insensitive' } },
          { email: { contains: 'ada', mode: 'insensitive' } },
          { message: { contains: 'ada', mode: 'insensitive' } },
        ],
      };
      expect(prisma.contactMessage.findMany).toHaveBeenCalledWith({
        where,
        orderBy: { email: 'asc' },
        skip: 20,
        take: 10,
      });
      expect(prisma.contactMessage.count).toHaveBeenCalledWith({ where });
    });
  });

  describe('findOne', () => {
    it('should return the contact when it exists', async () => {
      const contact = { id: 'contact-1' };
      (prisma.contactMessage.findUnique as jest.Mock).mockResolvedValue(
        contact,
      );

      await expect(service.findOne('contact-1')).resolves.toEqual(contact);
    });

    it('should throw NotFoundException when the contact does not exist', async () => {
      (prisma.contactMessage.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe.each([
    [
      'update',
      'update',
      (s: ContactsService, id: string) =>
        s.update(id, { status: ContactStatus.READ }),
    ],
    ['remove', 'delete', (s: ContactsService, id: string) => s.remove(id)],
  ] as const)('%s', (_name, prismaMethod, call) => {
    it('should return the prisma result', async () => {
      const contact = { id: 'contact-1' };
      (prisma.contactMessage[prismaMethod] as jest.Mock).mockResolvedValue(
        contact,
      );

      await expect(call(service, 'contact-1')).resolves.toEqual(contact);
    });

    it('should throw NotFoundException when prisma reports a missing record', async () => {
      (prisma.contactMessage[prismaMethod] as jest.Mock).mockRejectedValue(
        Object.assign(new Error('Record not found'), { code: 'P2025' }),
      );

      await expect(call(service, 'missing')).rejects.toThrow(NotFoundException);
    });

    it('should rethrow other prisma errors', async () => {
      const error = Object.assign(new Error('Connection lost'), {
        code: 'P1001',
      });
      (prisma.contactMessage[prismaMethod] as jest.Mock).mockRejectedValue(
        error,
      );

      await expect(call(service, 'contact-1')).rejects.toBe(error);
    });
  });
});
