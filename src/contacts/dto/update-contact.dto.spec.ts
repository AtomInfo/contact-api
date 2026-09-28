import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ContactStatus } from '../entities/contact.entity';
import { UpdateContactDto } from './update-contact.dto';

// Mirrors the global pipe configured in main.ts.
const pipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
});

const validateBody = (value: unknown) =>
  pipe.transform(value, { type: 'body', metatype: UpdateContactDto });

describe('UpdateContactDto', () => {
  it('should accept a partial update with a valid status', async () => {
    await expect(
      validateBody({ status: ContactStatus.READ, message: 'Updated' }),
    ).resolves.toEqual({ status: ContactStatus.READ, message: 'Updated' });
  });

  it('should accept an empty payload', async () => {
    await expect(validateBody({})).resolves.toEqual({});
  });

  it('should allow clearing the phone number with null', async () => {
    await expect(validateBody({ phone: null })).resolves.toEqual({
      phone: null,
    });
  });

  it('should reject an invalid status', async () => {
    await expect(validateBody({ status: 'ARCHIVED' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should reject an invalid email', async () => {
    await expect(validateBody({ email: 'not-an-email' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it.each(['applicationId', 'id', 'createdAt', 'updatedAt'])(
    'should reject attempts to set %s',
    async (field) => {
      await expect(validateBody({ [field]: 'x' })).rejects.toThrow(
        BadRequestException,
      );
    },
  );
});
