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
import { ListContactsQueryDto } from './dto/list-contacts-query.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ContactStatus } from './entities/contact.entity';

describe('ContactsController', () => {
  let controller: ContactsController;
  let service: jest.Mocked<
    Pick<
      ContactsService,
      'create' | 'findAll' | 'findOne' | 'update' | 'remove'
    >
  >;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContactsController],
      providers: [
        {
          provide: ContactsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ContactsController>(ContactsController);
    service =
      module.get<
        jest.Mocked<
          Pick<
            ContactsService,
            'create' | 'findAll' | 'findOne' | 'update' | 'remove'
          >
        >
      >(ContactsService);
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

    service.create.mockResolvedValue(created);

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

    service.create.mockResolvedValue(created);

    const result = await controller.create(dto);

    expect(result).toEqual(created);
    expect(service.create).toHaveBeenCalledWith(dto, 'app-456');
  });

  it('should pass the validated query straight to the service', async () => {
    const query: ListContactsQueryDto = {
      applicationId: 'app-123',
      status: ContactStatus.NEW,
      email: 'ada@example.com',
      search: 'Ada',
      page: 2,
      limit: 10,
      sortBy: 'createdAt',
      order: 'desc',
    };
    const result = {
      data: [{ id: 'contact-1', email: 'ada@example.com' }],
      total: 1,
      page: 2,
      limit: 10,
    };
    service.findAll.mockResolvedValue(result);

    await expect(controller.findAll(query)).resolves.toEqual(result);
    expect(service.findAll).toHaveBeenCalledWith(query);
  });

  it('should return a single contact from the service by id', async () => {
    const item = { id: 'contact-1', email: 'ada@example.com' };
    service.findOne.mockResolvedValue(item);

    await expect(controller.findOne('contact-1')).resolves.toEqual(item);
    expect(service.findOne).toHaveBeenCalledWith('contact-1');
  });

  it('should update a contact through the service', async () => {
    const update: UpdateContactDto = {
      status: ContactStatus.READ,
      message: 'Updated message',
    };
    const item = {
      id: 'contact-1',
      status: 'READ',
      message: 'Updated message',
    };
    service.update.mockResolvedValue(item);

    await expect(controller.update('contact-1', update)).resolves.toEqual(item);
    expect(service.update).toHaveBeenCalledWith('contact-1', update);
  });

  it('should delete a contact through the service', async () => {
    const item = { id: 'contact-1', email: 'ada@example.com' };
    service.remove.mockResolvedValue(item);

    await expect(controller.remove('contact-1')).resolves.toEqual(item);
    expect(service.remove).toHaveBeenCalledWith('contact-1');
  });
});
