import { validate } from 'class-validator';
import { CreateContactDto } from './create-contact.dto';

describe('CreateContactDto', () => {
  it('should validate a complete payload', async () => {
    const dto = Object.assign(new CreateContactDto(), {
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      phone: '+1 555 123 4567',
      message: 'Hello from the API',
      applicationId: 'app-123',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('should reject missing or invalid required fields', async () => {
    const dto = Object.assign(new CreateContactDto(), {
      firstName: '',
      lastName: 'Lovelace',
      email: 'not-an-email',
      message: '',
      applicationId: '',
    });

    const errors = await validate(dto);
    const errorFields = errors.map((error) => error.property);

    expect(errorFields).toEqual(
      expect.arrayContaining(['firstName', 'email', 'message', 'applicationId']),
    );
  });
});
