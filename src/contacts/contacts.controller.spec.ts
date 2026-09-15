import { Test, TestingModule } from '@nestjs/testing';

jest.mock('../prisma/client', () => ({
  prisma: {
    contactMessage: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}));

import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';

describe('ContactsController', () => {
  let controller: ContactsController;
  let service: jest.Mocked<Pick<ContactsService, 'create'>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContactsController],
      providers: [{ provide: ContactsService, useValue: { create: jest.fn() } }],
    }).compile();

    controller = module.get<ContactsController>(ContactsController);
    service = module.get<jest.Mocked<Pick<ContactsService, 'create'>>>(ContactsService);
  });

  it('should delegate creation to the service with the dto and application id', async () => {
    const dto: CreateContactDto = {
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      phone: '+1 555 123 4567',
      message: 'Hello from the API',
      applicationId: 'app-123',
    };

    const created = {
      id: 'contact-1',
      ...dto,
      metadata: null,
      status: 'NEW',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    service.create.mockResolvedValue(created as never);

    await expect(controller.create(dto)).resolves.toEqual(created);
    expect(service.create).toHaveBeenCalledTimes(1);
    expect(service.create).toHaveBeenCalledWith(dto, 'app-123');
  });

  it('should return the created contact unchanged from the service', async () => {
    const dto: CreateContactDto = {
      firstName: 'Grace',
      lastName: 'Hopper',
      email: 'grace@example.com',
      message: 'Patching on the fly',
      applicationId: 'app-456',
    };

    const created = {
      id: 'contact-2',
      ...dto,
      phone: null,
      metadata: null,
      status: 'NEW',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    service.create.mockResolvedValue(created as never);

    const result = await controller.create(dto);

    expect(result).toEqual(created);
    expect(service.create).toHaveBeenCalledWith(dto, 'app-456');
  });
});
