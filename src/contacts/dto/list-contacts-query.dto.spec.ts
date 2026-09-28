import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ContactStatus } from '../entities/contact.entity';
import { ListContactsQueryDto } from './list-contacts-query.dto';

// Mirrors the global pipe configured in main.ts.
const pipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});

const validateQuery = (value: unknown) =>
  pipe.transform(value, { type: 'query', metatype: ListContactsQueryDto });

describe('ListContactsQueryDto', () => {
  it('should accept valid filters and convert pagination to numbers', async () => {
    await expect(
      validateQuery({
        applicationId: 'app-123',
        status: 'NEW',
        email: 'ada@example.com',
        search: 'Ada',
        page: '2',
        limit: '10',
        sortBy: 'email',
        order: 'asc',
      }),
    ).resolves.toEqual({
      applicationId: 'app-123',
      status: ContactStatus.NEW,
      email: 'ada@example.com',
      search: 'Ada',
      page: 2,
      limit: 10,
      sortBy: 'email',
      order: 'asc',
    });
  });

  it('should accept an empty query', async () => {
    await expect(validateQuery({})).resolves.toEqual({});
  });

  it.each([
    ['an invalid status', { status: 'ARCHIVED' }],
    ['a non-numeric page', { page: 'abc' }],
    ['a page below 1', { page: '0' }],
    ['a limit above 100', { limit: '101' }],
    ['an unsupported sort field', { sortBy: 'message' }],
    ['an unsupported sort order', { order: 'sideways' }],
    ['an array-valued filter', { applicationId: ['app-1', 'app-2'] }],
    ['an unknown query parameter', { foo: 'bar' }],
  ])('should reject %s', async (_label, query) => {
    await expect(validateQuery(query)).rejects.toThrow(BadRequestException);
  });
});
