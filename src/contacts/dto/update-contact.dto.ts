import { OmitType, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ContactStatus } from '../entities/contact.entity';
import { CreateContactDto } from './create-contact.dto';

// applicationId is owned by the submitting application and cannot be changed.
export class UpdateContactDto extends PartialType(
  OmitType(CreateContactDto, ['applicationId'] as const),
) {
  @IsOptional()
  @IsEnum(ContactStatus)
  status?: ContactStatus;
}
